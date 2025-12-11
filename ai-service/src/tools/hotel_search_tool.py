"""
Hotel Search Tool

Unified hotel search supporting multiple providers:
1. StayAPI (Booking.com wrapper) - Primary
2. Amadeus Hotel API - Fallback
3. Web Search (LLM-normalized) - Last resort

Uses adapter pattern for consistent data normalization.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
import httpx
from loguru import logger
import os
import asyncio

from config import get_settings
from models.hotel import Hotel, HotelProvider, HotelSearchResult, HotelImage
from tools.hotel_adapters import (
    StayAPIAdapter, 
    AmadeusAdapter, 
    WebSearchAdapter,
    get_adapter
)


# ==============================================================================
# BUDGET HELPERS
# ==============================================================================

def _map_budget_level(budget_level: str) -> tuple[float, float] | None:
    """Map budget level to price range in VND per night."""
    if budget_level == "budget":
        return (0, 1000000)  # < 1M/night
    elif budget_level == "mid-range":
        return (1000000, 2500000)  # 1M - 2.5M/night
    elif budget_level == "luxury":
        return (2500000, None)  # > 2.5M/night
    return None


def _filter_hotels_by_budget(hotels: List[Hotel], budget_level: str | None) -> List[Hotel]:
    """Filter Hotel models by budget level."""
    if not budget_level:
        return hotels
    
    price_range = _map_budget_level(budget_level)
    if not price_range:
        return hotels
    
    min_price, max_price = price_range
    filtered = []
    
    for hotel in hotels:
        price = hotel.price_per_night
        
        if price is not None:
            if max_price is None:
                if price >= min_price:
                    filtered.append(hotel)
            else:
                if min_price <= price <= max_price:
                    filtered.append(hotel)
        else:
            # Include hotels without price
            filtered.append(hotel)
    
    return filtered


# ==============================================================================
# STAYAPI PROVIDER
# ==============================================================================

async def _search_stayapi(
    city: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
    rooms: int = 1
) -> List[Hotel]:
    """
    Search hotels using StayAPI - 2-step process.
    
    Step 1: Call /booking/destinations/lookup to get dest_id
    Step 2: Call /booking/search with dest_id
    
    Returns list of Hotel models.
    """
    settings = get_settings()
    api_key = settings.stayapi_key
    
    if not api_key:
        logger.warning("[hotel_search:stayapi] API key not configured")
        return []

    base_url = os.getenv("STAYAPI_BASE", "https://api.stayapi.com/v1")
    
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    logger.info("[hotel_search:stayapi] city=\"{}\" checkin={} checkout={}", city, check_in, check_out)
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Step 1: Lookup destination to get dest_id
            lookup_url = f"{base_url}/booking/destinations/lookup"
            lookup_params = {
                "query": city,
                "language": "en-us"
            }
            
            lookup_resp = await client.get(lookup_url, params=lookup_params, headers=headers)
            
            if lookup_resp.status_code == 401:
                logger.error("[hotel_search:stayapi] Unauthorized - Check API Key")
                return []
            
            if lookup_resp.status_code != 200:
                logger.warning("[hotel_search:stayapi] lookup failed status={}: {}", 
                    lookup_resp.status_code, lookup_resp.text[:200])
                return []
            
            lookup_data = lookup_resp.json()
            dest_id = lookup_data.get("dest_id") or lookup_data.get("data", {}).get("dest_id")
            dest_type = lookup_data.get("dest_type") or lookup_data.get("data", {}).get("dest_type") or "CITY"
            
            if not dest_id:
                logger.warning("[hotel_search:stayapi] No dest_id found for city: {}", city)
                return []
            
            logger.info("[hotel_search:stayapi] Got dest_id={} dest_type={}", dest_id, dest_type)
            
            # Step 2: Search hotels using dest_id
            search_url = f"{base_url}/booking/search"
            search_params = {
                "dest_id": dest_id,
                "dest_type": dest_type,
                "checkin": check_in,
                "checkout": check_out,
                "adults": str(adults),
                "rooms": str(rooms),
                "currency": "VND",
                "language": "en-us",
                "rows_per_page": "20",
                "page": "1"
            }
            
            search_resp = await client.get(search_url, params=search_params, headers=headers)
            
            if search_resp.status_code != 200:
                logger.warning("[hotel_search:stayapi] search failed status={}: {}", 
                    search_resp.status_code, search_resp.text[:200])
                return []
            
            data = search_resp.json()
            
            # Extract hotels array from response
            raw_hotels = []
            if isinstance(data, dict):
                if "data" in data and isinstance(data["data"], list):
                    raw_hotels = data["data"]
                elif "data" in data and isinstance(data["data"], dict):
                    raw_hotels = data["data"].get("hotels", []) or data["data"].get("results", [])
                elif "hotels" in data:
                    raw_hotels = data["hotels"]
                elif "results" in data:
                    raw_hotels = data["results"]
            
            logger.info("[hotel_search:stayapi] found {} raw hotels", len(raw_hotels))
            
            # Use adapter to normalize
            adapter = StayAPIAdapter()
            hotels = adapter.adapt_many(raw_hotels, city)
            
            logger.info("[hotel_search:stayapi] normalized {} hotels", len(hotels))
            return hotels

    except Exception as e:
        logger.exception("[hotel_search:stayapi] failed: {}", e)
        return []


# ==============================================================================
# AMADEUS PROVIDER
# ==============================================================================

# Vietnam city to IATA code mapping
CITY_TO_IATA = {
    "hà nội": "HAN",
    "hanoi": "HAN",
    "hồ chí minh": "SGN",
    "ho chi minh": "SGN",
    "saigon": "SGN",
    "sài gòn": "SGN",
    "đà nẵng": "DAD",
    "da nang": "DAD",
    "nha trang": "CXR",
    "phú quốc": "PQC",
    "phu quoc": "PQC",
    "huế": "HUI",
    "hue": "HUI",
    "hội an": "DAD",  # Closest airport
    "hoi an": "DAD",
    "đà lạt": "DLI",
    "dalat": "DLI",
    "cần thơ": "VCA",
    "can tho": "VCA",
    "quy nhơn": "UIH",
    "quy nhon": "UIH",
    "hải phòng": "HPH",
    "hai phong": "HPH",
}


async def _get_amadeus_token(api_key: str, api_secret: str) -> Optional[str]:
    """Get OAuth token from Amadeus API."""
    url = "https://test.api.amadeus.com/v1/security/oauth2/token"
    
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {
        "grant_type": "client_credentials",
        "client_id": api_key,
        "client_secret": api_secret
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, data=data)
            
            if resp.status_code != 200:
                logger.warning("[hotel_search:amadeus] Token request failed: {}", resp.text[:200])
                return None
            
            result = resp.json()
            return result.get("access_token")
            
    except Exception as e:
        logger.exception("[hotel_search:amadeus] Token request error: {}", e)
        return None


async def _search_amadeus_hotels_by_city(
    city_code: str, 
    token: str,
    radius: int = 10
) -> List[Dict[str, Any]]:
    """Search hotels by IATA city code."""
    url = "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city"
    
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "cityCode": city_code,
        "radius": radius,
        "radiusUnit": "KM",
        "hotelSource": "ALL"
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            
            if resp.status_code != 200:
                logger.warning("[hotel_search:amadeus] Hotel list failed: {}", resp.text[:200])
                return []
            
            data = resp.json()
            hotels = data.get("data", [])
            logger.info("[hotel_search:amadeus] Found {} hotels in {}", len(hotels), city_code)
            return hotels
            
    except Exception as e:
        logger.exception("[hotel_search:amadeus] Hotel list error: {}", e)
        return []


async def _get_amadeus_hotel_offers(
    hotel_ids: List[str],
    check_in: str,
    check_out: str,
    adults: int,
    token: str
) -> List[Dict[str, Any]]:
    """Get hotel offers (pricing) for specific hotels."""
    if not hotel_ids:
        return []
    
    url = "https://test.api.amadeus.com/v3/shopping/hotel-offers"
    
    headers = {"Authorization": f"Bearer {token}"}
    params = {
        "hotelIds": ",".join(hotel_ids[:5]),  # Limit to 5 hotels
        "checkInDate": check_in,
        "checkOutDate": check_out,
        "adults": adults,
        "roomQuantity": 1,
        "currency": "USD"  # Amadeus uses USD
    }
    
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.get(url, headers=headers, params=params)
            
            if resp.status_code != 200:
                logger.warning("[hotel_search:amadeus] Offers failed: {}", resp.text[:200])
                return []
            
            data = resp.json()
            offers = data.get("data", [])
            logger.info("[hotel_search:amadeus] Got {} hotel offers", len(offers))
            return offers
            
    except Exception as e:
        logger.exception("[hotel_search:amadeus] Offers error: {}", e)
        return []


async def _search_amadeus(
    city: str,
    check_in: str,
    check_out: str,
    adults: int = 2
) -> List[Hotel]:
    """
    Full Amadeus hotel search flow:
    1. Get OAuth token
    2. Map city name to IATA code
    3. Search hotels by city
    4. Get hotel offers (pricing) - may return fewer hotels
    5. Merge offers into hotel list
    6. Search for hotel images
    7. Adapt to Hotel models
    """
    settings = get_settings()
    api_key = settings.amadeus_api_key
    api_secret = settings.amadeus_api_secret
    
    if not api_key or not api_secret:
        logger.warning("[hotel_search:amadeus] Missing credentials")
        return []
    
    logger.info("[hotel_search:amadeus] city=\"{}\" checkin={} checkout={}", city, check_in, check_out)
    
    # Step 1: Get OAuth token
    token = await _get_amadeus_token(api_key, api_secret)
    if not token:
        return []
    
    # Step 2: Map city to IATA code
    city_lower = city.lower().strip()
    city_code = CITY_TO_IATA.get(city_lower)
    
    if not city_code:
        # Try partial match
        for key, code in CITY_TO_IATA.items():
            if key in city_lower or city_lower in key:
                city_code = code
                break
    
    if not city_code:
        logger.warning("[hotel_search:amadeus] Unknown city: {}", city)
        return []
    
    logger.info("[hotel_search:amadeus] Using IATA code: {}", city_code)
    
    # Step 3: Search hotels by city
    hotels_list = await _search_amadeus_hotels_by_city(city_code, token)
    if not hotels_list:
        return []
    
    # Step 4: Get offers for top hotels (pricing/availability)
    hotel_ids = [h.get("hotelId") for h in hotels_list[:10] if h.get("hotelId")]
    offers = await _get_amadeus_hotel_offers(hotel_ids, check_in, check_out, adults, token)
    
    # Step 5: Merge offers into hotel list
    # Create a map of hotelId -> offer data
    offers_map = {}
    for offer in offers:
        hotel_info = offer.get("hotel", {})
        hotel_id = hotel_info.get("hotelId")
        if hotel_id:
            offers_map[hotel_id] = offer
    
    # Merge: hotels with offers get full data, others get basic data
    merged_hotels = []
    for hotel in hotels_list[:10]:  # Limit to top 10
        hotel_id = hotel.get("hotelId")
        if hotel_id and hotel_id in offers_map:
            # Use offer data (has pricing)
            merged_hotels.append(offers_map[hotel_id])
        else:
            # Use basic hotel data (no pricing but still useful)
            merged_hotels.append(hotel)
    
    logger.info("[hotel_search:amadeus] Merged {} hotels ({} with pricing)", 
                len(merged_hotels), len(offers_map))
    
    # Step 6: Adapt to Hotel models
    adapter = AmadeusAdapter()
    hotels = adapter.adapt_many(merged_hotels, city)
    
    # Step 7: Search for hotel images (parallel)
    if hotels:
        hotels = await _enrich_hotels_with_images(hotels, city)
    
    logger.info("[hotel_search:amadeus] normalized {} hotels", len(hotels))
    return hotels


async def _enrich_hotels_with_images(hotels: List[Hotel], city: str) -> List[Hotel]:
    """
    Search for hotel images using Tavily.
    
    Runs sequentially to avoid rate limits.
    Only enriches hotels that don't have images.
    """
    import os
    
    tavily_key = os.getenv("TAVILY_API_KEY")
    if not tavily_key:
        logger.debug("[hotel_search] No Tavily API key, skipping image enrichment")
        return hotels
    
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=tavily_key)
    except ImportError:
        logger.debug("[hotel_search] Tavily not installed")
        return hotels
    
    enriched_count = 0
    
    for hotel in hotels[:5]:  # Only top 5
        if hotel.images and len(hotel.images) > 0:
            continue  # Already has images
        
        try:
            query = f"{hotel.name} hotel {city} Vietnam"
            
            # Search with image support
            resp = client.search(
                query, 
                search_depth="basic", 
                max_results=1, 
                include_images=True
            )
            
            images = resp.get("images", [])
            if images and len(images) > 0:
                image_url = images[0]
                hotel.images = [HotelImage(url=image_url, caption=hotel.name)]
                enriched_count += 1
                logger.debug("[hotel_search] Image found for: {}", hotel.name)
                
        except Exception as e:
            logger.debug("[hotel_search] Image search failed for {}: {}", hotel.name, e)
            continue
        
        # Small delay to avoid rate limits
        await asyncio.sleep(0.3)
    
    logger.info("[hotel_search] Enriched {} hotels with images", enriched_count)
    return hotels


# ==============================================================================
# WEB SEARCH FALLBACK
# ==============================================================================

async def _search_web_fallback(
    city: str,
    check_in: str,
    check_out: str,
    budget_level: str | None = None
) -> List[Hotel]:
    """Fallback to web search when all APIs fail."""
    from tools.search import web_search_tavily, web_search_duckduckgo
    
    logger.info("[hotel_search:web] city=\"{}\"", city)
    
    # Build search query
    budget_hint = ""
    if budget_level == "budget":
        budget_hint = "giá rẻ tiết kiệm"
    elif budget_level == "mid-range":
        budget_hint = "tầm trung"
    elif budget_level == "luxury":
        budget_hint = "cao cấp sang trọng"
    
    query = f"khách sạn {city} Việt Nam {budget_hint} đánh giá tốt booking"
    
    results = []
    
    # Try Tavily first
    try:
        tavily_resp = await asyncio.to_thread(web_search_tavily, query, max_results=5)
        if isinstance(tavily_resp, dict):
            results = tavily_resp.get("results", [])
        elif isinstance(tavily_resp, list):
            results = tavily_resp
    except Exception as e:
        logger.exception("[hotel_search:web] Tavily failed: {}", e)

    # Fallback to DuckDuckGo
    if not results:
        logger.info("[hotel_search:web] Tavily empty, trying DuckDuckGo")
        try:
            ddg_resp = await asyncio.to_thread(web_search_duckduckgo, query, max_results=5)
            if isinstance(ddg_resp, dict):
                results = ddg_resp.get("results", [])
            elif isinstance(ddg_resp, list):
                results = ddg_resp
        except Exception as e:
            logger.exception("[hotel_search:web] DuckDuckGo failed: {}", e)

    if not results:
        logger.warning("[hotel_search:web] No results from any source")
        return []
    
    logger.info("[hotel_search:web] found {} results", len(results))
    
    # Use LLM to normalize
    normalized = await _normalize_hotels_with_llm(results, city, budget_level)
    
    # Adapt to Hotel models
    adapter = WebSearchAdapter()
    hotels = adapter.adapt_many(normalized, city)
    
    return hotels


async def _normalize_hotels_with_llm(
    web_results: List[Dict[str, Any]],
    city: str,
    budget_level: str | None = None
) -> List[Dict[str, Any]]:
    """Use LLM to normalize web search results into structured hotel data."""
    import json
    from langchain_openai import ChatOpenAI
    
    settings = get_settings()
    
    # Build context from web results
    context_parts = []
    for i, result in enumerate(web_results[:5], 1):
        title = result.get("title", "")
        content = result.get("content", "")[:500]
        url = result.get("url", "")
        context_parts.append(f"{i}. {title}\n{content}\nURL: {url}")
    
    context = "\n\n".join(context_parts)
    
    from prompts.hotel import hotel_normalization_prompt
    prompt = hotel_normalization_prompt(city, context, budget_level)

    async def invoke_llm(llm, provider_name: str) -> List[Dict[str, Any]]:
        logger.info("[hotel_search:web] Invoking {} LLM...", provider_name)
        response = await llm.ainvoke(prompt)
        response_text = response.content.strip()
        
        # Extract JSON from response
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        hotels = json.loads(response_text)
        
        if not isinstance(hotels, list):
            hotels = [hotels] if isinstance(hotels, dict) else []
        
        logger.info("[hotel_search:web] {} normalized {} hotels", provider_name, len(hotels))
        return hotels

    # Try MegaLLM first
    if settings.megallm_api_key:
        try:
            llm_mega = ChatOpenAI(
                model="qwen/qwen3-next-80b-a3b-instruct",
                api_key=settings.megallm_api_key,
                base_url=settings.megallm_base_url,
                temperature=0.3,
                timeout=45.0,
                max_retries=1
            )
            return await invoke_llm(llm_mega, "MegaLLM")
        except Exception as e:
            logger.warning("[hotel_search:web] MegaLLM failed: {} - trying OpenRouter", str(e)[:100])
    
    # Fallback to OpenRouter
    if settings.openrouter_api_key:
        try:
            llm_openrouter = ChatOpenAI(
                model=settings.openrouter_model,
                api_key=settings.openrouter_api_key,
                base_url=settings.openrouter_base_url,
                temperature=0.3,
                timeout=60.0,
                max_retries=2,
                default_headers={
                    "HTTP-Referer": "https://viet-adventure.com",
                    "X-Title": "VietAdventure AI Planner"
                }
            )
            return await invoke_llm(llm_openrouter, "OpenRouter")
        except Exception as e:
            logger.exception("[hotel_search:web] OpenRouter fallback failed: {}", e)
    
    logger.warning("[hotel_search:web] All LLM providers failed")
    return []


# ==============================================================================
# MAIN SEARCH FUNCTION
# ==============================================================================

async def hotel_search(
    city: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
    budget_level: str | None = None,
    preferences: List[str] | None = None
) -> Dict[str, Any]:
    """
    Search hotels for a given city and dates.
    
    Tries providers in order:
    1. StayAPI (Booking.com)
    2. Amadeus
    3. Web Search (LLM-normalized)
    
    Args:
        city: City name
        check_in: Check-in date (YYYY-MM-DD)
        check_out: Check-out date (YYYY-MM-DD)
        adults: Number of adults
        budget_level: "budget", "mid-range", or "luxury"
        preferences: List of preferences (e.g., ["beach_view", "pool"])
    
    Returns:
        Dict with hotels list (serialized Hotel models)
    """
    logger.info(
        "[hotel_search] city=\"{}\" checkin={} checkout={} budget=\"{}\"",
        city, check_in, check_out, budget_level
    )
    
    hotels: List[Hotel] = []
    provider_used = HotelProvider.WEB_SEARCH
    errors: List[str] = []
    
    # Primary: Try StayAPI
    hotels = await _search_stayapi(city, check_in, check_out, adults)
    if hotels:
        provider_used = HotelProvider.STAYAPI
    
    # Fallback 1: Amadeus
    if not hotels:
        logger.info("[hotel_search] StayAPI empty, trying Amadeus")
        hotels = await _search_amadeus(city, check_in, check_out, adults)
        if hotels:
            provider_used = HotelProvider.AMADEUS
    
    # Fallback 2: Web Search
    if not hotels:
        logger.info("[hotel_search] Amadeus empty, trying web search")
        hotels = await _search_web_fallback(city, check_in, check_out, budget_level)
        if hotels:
            provider_used = HotelProvider.WEB_SEARCH
    
    if not hotels:
        logger.warning("[hotel_search] No hotels found from any source")
        return HotelSearchResult(
            hotels=[],
            total_found=0,
            provider_used=provider_used,
            errors=["Không tìm thấy khách sạn nào"]
        ).to_frontend_dict()
    
    total_before_filter = len(hotels)
    
    # Filter by budget
    if budget_level:
        filtered_hotels = _filter_hotels_by_budget(hotels, budget_level)
        
        # If filter removed all hotels, try web search with budget hint
        if not filtered_hotels and hotels:
            logger.info("[hotel_search] Budget filter removed all {} hotels, trying web search", len(hotels))
            web_hotels = await _search_web_fallback(city, check_in, check_out, budget_level)
            if web_hotels:
                hotels = web_hotels
                provider_used = HotelProvider.WEB_SEARCH
            else:
                # No web results, use original unfiltered with warning
                logger.warning("[hotel_search] Web search also empty, returning unfiltered hotels")
                errors.append(f"Không tìm thấy khách sạn phù hợp ngân sách {budget_level}")
        else:
            hotels = filtered_hotels
    
    # Sort by rating (descending), then by price (ascending)
    hotels.sort(
        key=lambda h: (
            -(h.rating or 0),  # Negative for descending
            h.price_per_night or float("inf")
        )
    )
    
    # Take top 5
    top_hotels = hotels[:5]
    
    # Calculate total price for each hotel
    try:
        checkin_date = datetime.strptime(check_in, "%Y-%m-%d")
        checkout_date = datetime.strptime(check_out, "%Y-%m-%d")
        nights = (checkout_date - checkin_date).days
        if nights <= 0:
            nights = 1
    except:
        nights = 1
    
    for hotel in top_hotels:
        if hotel.price_per_night:
            hotel.total_price = hotel.price_per_night * nights
    
    logger.info("[hotel_search] returning {} hotels from {}", len(top_hotels), provider_used.value)
    
    # Create result and serialize
    result = HotelSearchResult(
        hotels=top_hotels,
        total_found=total_before_filter,
        provider_used=provider_used,
        errors=errors
    )
    
    return result.to_frontend_dict()


# ==============================================================================
# LANGCHAIN TOOL WRAPPER
# ==============================================================================

from langchain_core.tools import tool


@tool
async def hotel_search_tool(
    city: str,
    check_in: str,
    check_out: str,
    adults: int = 2,
    budget_level: str | None = None,
    preferences: str | None = None
) -> Dict[str, Any]:
    """
    Search hotels for a destination with check-in/check-out dates.
    
    Use this when user needs hotel recommendations for their itinerary.
    
    Args:
        city: City name (e.g., "Da Nang", "Hoi An")
        check_in: Check-in date in YYYY-MM-DD format
        check_out: Check-out date in YYYY-MM-DD format
        adults: Number of adults (default: 2)
        budget_level: "budget", "mid-range", or "luxury" (optional)
        preferences: Comma-separated preferences (optional)
    
    Returns:
        Dict with hotels list, each containing name, rating, price, coordinates, booking_url, why_recommended
    """
    prefs_list = []
    if preferences:
        prefs_list = [p.strip() for p in preferences.split(",")] if isinstance(preferences, str) else preferences
    
    return await hotel_search(
        city=city,
        check_in=check_in,
        check_out=check_out,
        adults=adults,
        budget_level=budget_level,
        preferences=prefs_list
    )
