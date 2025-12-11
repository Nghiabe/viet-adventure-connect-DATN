"""
Unified Hotel Data Models

Provides Pydantic models for hotel search results from multiple providers:
- StayAPI (Booking.com wrapper)
- Amadeus Hotel API
- Web Search (LLM-normalized)

These models ensure type safety and consistent data structure across all providers.
"""

from __future__ import annotations
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any
from enum import Enum


class HotelProvider(str, Enum):
    """Hotel data source provider"""
    STAYAPI = "stayapi"
    AMADEUS = "amadeus"
    WEB_SEARCH = "web_search"


class HotelCoordinates(BaseModel):
    """Geographic coordinates for hotel location"""
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude")


class HotelImage(BaseModel):
    """Hotel image data"""
    url: str
    thumbnail: Optional[str] = None
    caption: Optional[str] = None


class Hotel(BaseModel):
    """
    Unified hotel model for all providers.
    
    All fields use validators to handle inconsistent API responses
    where values may be dicts, strings, or None.
    """
    name: str = Field(..., description="Hotel name")
    rating: Optional[float] = Field(None, ge=0, le=10, description="Rating score (0-10 or 0-5)")
    stars: Optional[int] = Field(None, ge=1, le=5, description="Star rating (1-5)")
    
    # Pricing
    price_per_night: Optional[float] = Field(None, ge=0, description="Price per night in VND")
    price_display: Optional[str] = Field(None, description="Formatted price string")
    total_price: Optional[float] = Field(None, ge=0, description="Total price for stay")
    currency: str = Field("VND", description="Currency code")
    
    # Location
    location: str = Field(..., description="Location/address")
    city: Optional[str] = Field(None, description="City name")
    coordinates: Optional[HotelCoordinates] = Field(None, description="GPS coordinates")
    distance_to_center: Optional[str] = Field(None, description="Distance to city center")
    
    # Details
    amenities: List[str] = Field(default_factory=list, description="List of amenities")
    description: Optional[str] = Field(None, description="Hotel description")
    images: List[HotelImage] = Field(default_factory=list, description="Hotel images")
    
    # Booking
    booking_url: Optional[str] = Field(None, description="Direct booking URL")
    hotel_id: Optional[str] = Field(None, description="Provider-specific hotel ID")
    
    # Recommendation
    why_recommended: Optional[str] = Field(None, description="Why this hotel is recommended")
    review_count: Optional[int] = Field(None, description="Number of reviews")
    
    # Metadata
    provider: HotelProvider = Field(HotelProvider.WEB_SEARCH, description="Data source")
    raw_data: Optional[dict] = Field(None, exclude=True, description="Original API response")

    @field_validator("rating", mode="before")
    @classmethod
    def parse_rating(cls, v: Any) -> Optional[float]:
        """Handle dict/string/None rating values"""
        if v is None:
            return None
        if isinstance(v, dict):
            # Common patterns: {"score": 8.5}, {"value": 4.5}, {"rating": 9.0}
            v = v.get("score") or v.get("value") or v.get("rating") or v.get("average")
        if v is None:
            return None
        try:
            rating = float(v)
            # Normalize 10-scale to 5-scale if needed
            if rating > 5:
                rating = rating / 2
            return round(rating, 1)
        except (ValueError, TypeError):
            return None

    @field_validator("price_per_night", "total_price", mode="before")
    @classmethod
    def parse_price(cls, v: Any) -> Optional[float]:
        """Handle dict/string/None price values"""
        if v is None:
            return None
        if isinstance(v, dict):
            # Common patterns: {"value": 1500000}, {"amount": 2000000}, {"price": 800000}
            v = v.get("value") or v.get("amount") or v.get("price") or v.get("total")
        if v is None:
            return None
        try:
            # Remove currency symbols and formatting
            if isinstance(v, str):
                v = v.replace(",", "").replace(".", "").replace("VND", "").replace("₫", "").strip()
            return float(v)
        except (ValueError, TypeError):
            return None

    @field_validator("stars", mode="before")
    @classmethod
    def parse_stars(cls, v: Any) -> Optional[int]:
        """Parse star rating"""
        if v is None:
            return None
        if isinstance(v, dict):
            v = v.get("value") or v.get("stars") or v.get("class")
        try:
            stars = int(float(v))
            return min(max(stars, 1), 5)  # Clamp to 1-5
        except (ValueError, TypeError):
            return None

    @field_validator("amenities", mode="before")
    @classmethod
    def parse_amenities(cls, v: Any) -> List[str]:
        """Ensure amenities is a list of strings"""
        if v is None:
            return []
        if isinstance(v, str):
            return [a.strip() for a in v.split(",") if a.strip()]
        if isinstance(v, list):
            return [str(a) for a in v if a][:15]  # Limit to 15
        return []

    def to_frontend_dict(self) -> dict:
        """
        Serialize for frontend consumption.
        Excludes raw_data and includes computed fields.
        """
        data = self.model_dump(exclude={"raw_data"})
        
        # Add computed fields for frontend
        if self.coordinates:
            data["has_coordinates"] = True
        
        # Generate price display if missing
        if not data.get("price_display") and data.get("price_per_night"):
            data["price_display"] = f"{data['price_per_night']:,.0f} VND/đêm"
        
        return data


class HotelSearchResult(BaseModel):
    """Response wrapper for hotel search results"""
    hotels: List[Hotel] = Field(default_factory=list)
    total_found: int = Field(0, description="Total hotels found before filtering")
    provider_used: HotelProvider = Field(HotelProvider.WEB_SEARCH)
    search_query: Optional[str] = Field(None, description="Search query used")
    errors: List[str] = Field(default_factory=list, description="Any errors encountered")

    def to_frontend_dict(self) -> dict:
        """Serialize for frontend"""
        return {
            "hotels": [h.to_frontend_dict() for h in self.hotels],
            "total_found": self.total_found,
            "provider": self.provider_used.value,
            "errors": self.errors
        }
