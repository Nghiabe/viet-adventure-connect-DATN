"""
Hotel Provider Adapters

Adapter pattern to normalize responses from different hotel search providers
into the unified Hotel model format.

Each adapter handles provider-specific field mapping and data extraction.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from loguru import logger

from models.hotel import Hotel, HotelProvider, HotelCoordinates, HotelImage


class HotelAdapter(ABC):
    """Base adapter interface for hotel providers"""
    
    provider: HotelProvider
    
    @abstractmethod
    def adapt(self, raw_hotel: Dict[str, Any], city: str) -> Optional[Hotel]:
        """
        Convert raw API response to unified Hotel model.
        
        Args:
            raw_hotel: Raw hotel data from provider API
            city: City name for fallback location
            
        Returns:
            Hotel model or None if parsing fails
        """
        pass
    
    def adapt_many(self, raw_hotels: List[Dict[str, Any]], city: str) -> List[Hotel]:
        """Convert list of raw hotels, filtering out failed conversions"""
        hotels = []
        for raw in raw_hotels:
            try:
                hotel = self.adapt(raw, city)
                if hotel:
                    hotels.append(hotel)
            except Exception as e:
                logger.warning(f"[{self.provider.value}] Failed to adapt hotel: {e}")
                continue
        return hotels


class StayAPIAdapter(HotelAdapter):
    """
    Adapter for StayAPI (Booking.com wrapper) response.
    
    StayAPI returns hotels with fields like:
    - name, hotel_name
    - review_score, rating
    - price, min_price, gross_price
    - address, city
    - latitude, longitude
    - url, deeplink
    """
    
    provider = HotelProvider.STAYAPI
    
    def adapt(self, raw: Dict[str, Any], city: str) -> Optional[Hotel]:
        if not raw:
            return None
            
        # Extract name (multiple possible fields)
        name = (
            raw.get("name") or 
            raw.get("hotel_name") or 
            raw.get("hotel_name_trans") or
            raw.get("hotel", {}).get("name") or
            "Unknown Hotel"
        )
        
        # Extract rating (can be score out of 10 or review_score)
        rating = (
            raw.get("review_score") or 
            raw.get("rating") or 
            raw.get("class") or
            raw.get("hotel", {}).get("review_score")
        )
        
        # Extract star rating
        stars = raw.get("class") or raw.get("hotel_class") or raw.get("stars")
        
        # Extract price (multiple patterns)
        price = self._extract_price(raw)
        price_display = (
            raw.get("price_breakdown", {}).get("gross_price") or
            raw.get("composite_price_breakdown", {}).get("gross_amount_per_night", {}).get("value") or
            raw.get("price_display") or
            raw.get("priceForDisplay")
        )
        
        # Extract location
        location = (
            raw.get("address") or 
            raw.get("address_trans") or
            raw.get("city") or
            city
        )
        
        # Extract coordinates
        coordinates = self._extract_coordinates(raw)
        
        # Extract distance
        distance = raw.get("distance_to_cc") or raw.get("distance")
        if distance:
            distance = f"{distance} km từ trung tâm"
        
        # Extract amenities  
        amenities = self._extract_amenities(raw)
        
        # Extract images
        images = self._extract_images(raw)
        
        # Extract booking URL
        booking_url = (
            raw.get("url") or 
            raw.get("deeplink") or
            raw.get("hotel_url")
        )
        
        # Generate recommendation reason
        why_recommended = self._generate_recommendation(raw)
        
        return Hotel(
            name=name,
            rating=rating,
            stars=stars,
            price_per_night=price,
            price_display=str(price_display) if price_display else None,
            location=location,
            city=city,
            coordinates=coordinates,
            distance_to_center=distance,
            amenities=amenities,
            images=images,
            booking_url=booking_url,
            hotel_id=str(raw.get("hotel_id") or raw.get("id") or ""),
            why_recommended=why_recommended,
            review_count=raw.get("review_nr") or raw.get("review_count"),
            provider=self.provider,
            raw_data=raw
        )
    
    def _extract_price(self, raw: Dict) -> Optional[float]:
        """Extract price from various StayAPI price structures"""
        # Try composite_price_breakdown first (newer format)
        composite = raw.get("composite_price_breakdown", {})
        if composite:
            per_night = composite.get("gross_amount_per_night", {})
            if isinstance(per_night, dict) and per_night.get("value"):
                return per_night.get("value")
            
            all_in = composite.get("all_inclusive_amount", {})
            if isinstance(all_in, dict) and all_in.get("value"):
                return all_in.get("value")
        
        # Try price_breakdown (older format)
        breakdown = raw.get("price_breakdown", {})
        if breakdown:
            if breakdown.get("gross_price"):
                return breakdown.get("gross_price")
            if breakdown.get("all_inclusive_price"):
                return breakdown.get("all_inclusive_price")
        
        # Direct price fields
        for field in ["price", "min_price", "gross_price", "gross_amount"]:
            val = raw.get(field)
            if val is not None:
                if isinstance(val, dict):
                    val = val.get("value") or val.get("amount")
                if val is not None:
                    try:
                        return float(val)
                    except (ValueError, TypeError):
                        pass
        
        return None
    
    def _extract_coordinates(self, raw: Dict) -> Optional[HotelCoordinates]:
        """Extract GPS coordinates"""
        lat = raw.get("latitude") or raw.get("lat")
        lng = raw.get("longitude") or raw.get("lng") or raw.get("lon")
        
        if lat is not None and lng is not None:
            try:
                return HotelCoordinates(lat=float(lat), lng=float(lng))
            except (ValueError, TypeError):
                pass
        return None
    
    def _extract_amenities(self, raw: Dict) -> List[str]:
        """Extract hotel amenities/facilities"""
        amenities = []
        
        # Property highlights
        highlights = raw.get("property_highlight", {})
        if isinstance(highlights, dict):
            amenities.extend(highlights.get("name", "").split(","))
        
        # Direct amenities list
        if raw.get("facilities"):
            for f in raw.get("facilities", []):
                if isinstance(f, dict):
                    amenities.append(f.get("name", ""))
                elif isinstance(f, str):
                    amenities.append(f)
        
        # Hotel facility types
        if raw.get("hotel_facilities"):
            amenities.extend([str(f) for f in raw.get("hotel_facilities", [])])
        
        # Clean and filter
        amenities = [a.strip() for a in amenities if a and a.strip()]
        
        # Add common indicators
        if raw.get("is_free_cancellable"):
            amenities.insert(0, "Hủy miễn phí")
        if raw.get("has_free_parking"):
            amenities.append("Đậu xe miễn phí")
        if raw.get("has_swimming_pool") or "pool" in str(raw).lower():
            amenities.append("Hồ bơi")
            
        return list(dict.fromkeys(amenities))[:10]  # Dedupe and limit
    
    def _extract_images(self, raw: Dict) -> List[HotelImage]:
        """Extract hotel images"""
        images = []
        
        # Main photo
        main_photo = raw.get("main_photo_url") or raw.get("max_photo_url")
        if main_photo:
            images.append(HotelImage(url=main_photo, caption="Ảnh chính"))
        
        # Photo gallery
        for photo in raw.get("photos", [])[:5]:
            if isinstance(photo, dict):
                url = photo.get("url_max") or photo.get("url_original") or photo.get("url")
                if url:
                    images.append(HotelImage(
                        url=url,
                        thumbnail=photo.get("url_square60"),
                        caption=photo.get("photo_tag")
                    ))
            elif isinstance(photo, str):
                images.append(HotelImage(url=photo))
        
        return images[:6]
    
    def _generate_recommendation(self, raw: Dict) -> str:
        """Generate recommendation reason based on hotel features"""
        reasons = []
        
        rating = raw.get("review_score") or raw.get("rating", 0)
        if isinstance(rating, (int, float)) and rating >= 8.5:
            reasons.append("Đánh giá xuất sắc")
        elif isinstance(rating, (int, float)) and rating >= 7.5:
            reasons.append("Đánh giá tốt")
        
        if raw.get("is_genius_deal"):
            reasons.append("Genius Deal")
        
        if raw.get("has_swimming_pool"):
            reasons.append("Có hồ bơi")
            
        if raw.get("distance_to_cc"):
            try:
                dist = float(raw.get("distance_to_cc", 999))
                if dist < 1:
                    reasons.append("Gần trung tâm")
            except:
                pass
        
        return ", ".join(reasons) if reasons else "Phù hợp với yêu cầu"


class AmadeusAdapter(HotelAdapter):
    """
    Adapter for Amadeus Hotel Offers API response.
    
    Amadeus hotel list returns:
    {
        "hotelId": "HSHANAGR",
        "name": "ROYAL GATE HOTEL",
        "chainCode": "HS",
        "iataCode": "HAN",
        "geoCode": {"latitude": 21.03189, "longitude": 105.84815},
        "address": {"countryCode": "VN", "cityName": "HANOI", "lines": ["NGUYEN BIEU STREET 09"]},
        "distance": {"value": 0.0, "unit": "KM"}
    }
    
    Amadeus offers return:
    {
        "hotel": {...},
        "offers": [{
            "price": {"total": "500.00", "currency": "USD"},
            "room": {"typeEstimated": {"category": "DELUXE"}}
        }]
    }
    """
    
    provider = HotelProvider.AMADEUS
    
    # Exchange rate VND/USD (approximate)
    USD_TO_VND = 24500
    
    def adapt(self, raw: Dict[str, Any], city: str) -> Optional[Hotel]:
        if not raw:
            return None
        
        # Handle both hotel list format and offers format
        hotel_data = raw.get("hotel", raw)
        
        name = hotel_data.get("name") or "Unknown Hotel"
        # Clean up name (often ALL CAPS)
        if name.isupper():
            name = name.title()
        
        # Rating in Amadeus is typically 1-5 stars as string
        rating = hotel_data.get("rating")
        stars = None
        if rating:
            try:
                stars = int(rating)
                rating = float(stars) + 0.5  # Base rating from stars
            except (ValueError, TypeError):
                rating = None
        
        # Extract price from offers
        price_vnd = None
        price_display = None
        currency = "VND"
        room_type = None
        
        offers = raw.get("offers", [])
        if offers:
            first_offer = offers[0]
            price_info = first_offer.get("price", {})
            price_total = price_info.get("total")
            currency = price_info.get("currency", "USD")
            
            if price_total:
                try:
                    price_float = float(price_total)
                    # Convert to VND if in USD
                    if currency == "USD":
                        price_vnd = price_float * self.USD_TO_VND
                        price_display = f"{price_vnd:,.0f} ₫"
                    else:
                        price_vnd = price_float
                        price_display = f"{price_vnd:,.0f} ₫"
                except (ValueError, TypeError):
                    pass
            
            # Room type
            room = first_offer.get("room", {})
            type_estimated = room.get("typeEstimated", {})
            room_type = type_estimated.get("category")
        
        # Location - build clean address
        address = hotel_data.get("address", {})
        location_parts = []
        if isinstance(address, dict):
            if address.get("lines"):
                street = address["lines"][0] if isinstance(address["lines"], list) else str(address["lines"])
                if street:
                    # Clean up street name
                    street = street.title() if street.isupper() else street
                    location_parts.append(street)
            if address.get("cityName"):
                city_name = address["cityName"]
                city_name = city_name.title() if city_name.isupper() else city_name
                location_parts.append(city_name)
        
        location = ", ".join(location_parts) if location_parts else city
        
        # Coordinates
        coordinates = self._extract_coordinates(hotel_data)
        
        # Distance to center
        distance_str = None
        distance_data = hotel_data.get("distance", {})
        if isinstance(distance_data, dict):
            dist_value = distance_data.get("value")
            dist_unit = distance_data.get("unit", "KM")
            if dist_value is not None:
                try:
                    dist_float = float(dist_value)
                    if dist_float < 1:
                        distance_str = f"{int(dist_float * 1000)}m từ trung tâm"
                    else:
                        distance_str = f"{dist_float:.1f}km từ trung tâm"
                except:
                    pass
        
        # Amenities from room description
        amenities = []
        if room_type:
            amenities.append(f"Phòng {room_type}")
        
        if offers:
            room = offers[0].get("room", {})
            type_estimated = room.get("typeEstimated", {})
            
            # Bed type
            beds = type_estimated.get("beds")
            if beds:
                amenities.append(f"{beds} giường")
            
            bed_type = type_estimated.get("bedType")
            if bed_type:
                amenities.append(f"Giường {bed_type}")
            
            # Description may contain amenities
            desc_text = room.get("description", {}).get("text", "")
            if desc_text:
                desc_parts = [d.strip() for d in desc_text.split(",") if d.strip()]
                amenities.extend(desc_parts[:4])
        
        # Chain/brand info
        chain_code = hotel_data.get("chainCode")
        
        # Generate recommendation based on actual features
        why_recommended = self._generate_recommendation(stars, distance_data, chain_code)
        
        return Hotel(
            name=name,
            rating=rating,
            stars=stars,
            price_per_night=price_vnd,
            price_display=price_display,
            currency=currency,
            location=location,
            city=city,
            coordinates=coordinates,
            distance_to_center=distance_str,
            amenities=amenities,
            hotel_id=hotel_data.get("hotelId"),
            why_recommended=why_recommended,
            provider=self.provider,
            raw_data=raw
        )
    
    def _extract_coordinates(self, hotel_data: Dict) -> Optional[HotelCoordinates]:
        """Extract coordinates from Amadeus geoCode"""
        geo = hotel_data.get("geoCode", {})
        if geo.get("latitude") and geo.get("longitude"):
            try:
                return HotelCoordinates(
                    lat=float(geo["latitude"]),
                    lng=float(geo["longitude"])
                )
            except (ValueError, TypeError):
                pass
        return None
    
    def _generate_recommendation(self, stars: int | None, distance_data: Dict, chain_code: str | None) -> str:
        """Generate recommendation based on hotel features"""
        reasons = []
        
        if stars and stars >= 4:
            reasons.append(f"Khách sạn {stars} sao")
        
        if isinstance(distance_data, dict):
            dist_value = distance_data.get("value")
            if dist_value is not None:
                try:
                    if float(dist_value) <= 1.0:
                        reasons.append("Gần trung tâm")
                except:
                    pass
        
        # Known hotel chains
        known_chains = {
            "HS": "Hilton", "MA": "Marriott", "HY": "Hyatt",
            "IH": "InterContinental", "AC": "Accor", "WY": "Wyndham"
        }
        if chain_code and chain_code in known_chains:
            reasons.append(f"Thương hiệu {known_chains[chain_code]}")
        
        return ", ".join(reasons) if reasons else "Đặt phòng uy tín"


class WebSearchAdapter(HotelAdapter):
    """
    Adapter for LLM-normalized web search results.
    
    Web search results are pre-normalized by LLM into a simplified format,
    so this adapter just validates and wraps the data.
    """
    
    provider = HotelProvider.WEB_SEARCH
    
    def adapt(self, raw: Dict[str, Any], city: str) -> Optional[Hotel]:
        if not raw:
            return None
        
        # LLM-normalized data should already be in correct format
        name = raw.get("name")
        if not name:
            return None
        
        return Hotel(
            name=name,
            rating=raw.get("rating"),
            stars=raw.get("stars"),
            price_per_night=raw.get("price_per_night"),
            price_display=raw.get("price_display"),
            location=raw.get("location", city),
            city=city,
            amenities=raw.get("amenities", []),
            booking_url=raw.get("booking_url"),
            why_recommended=raw.get("why_recommended", "Từ tìm kiếm web"),
            provider=self.provider,
            raw_data=raw
        )


# Factory function to get appropriate adapter
def get_adapter(provider: HotelProvider) -> HotelAdapter:
    """Get adapter instance for provider"""
    adapters = {
        HotelProvider.STAYAPI: StayAPIAdapter(),
        HotelProvider.AMADEUS: AmadeusAdapter(),
        HotelProvider.WEB_SEARCH: WebSearchAdapter()
    }
    return adapters.get(provider, WebSearchAdapter())
