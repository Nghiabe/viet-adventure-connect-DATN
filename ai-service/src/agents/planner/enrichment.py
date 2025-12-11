"""
Enrichment module for Super Guide AI.

This module enriches itinerary data with:
1. Images from search_images tool
2. Details from web_search tool

Called after the main itinerary is generated to fill in:
- `images[]` for each slot
- `details{}` with deeper info about locations and dishes
"""

from typing import Dict, Any, List
from loguru import logger
import asyncio


async def search_images_for_item(query: str, max_results: int = 2) -> List[Dict[str, str]]:
    """
    Search images for a location or dish.
    Uses DuckDuckGo image search directly (avoiding LangChain tool overhead).
    
    Returns list of: [{"url": str, "caption": str}]
    """
    images = []
    
    try:
        logger.info(f"[enrichment] Searching images for: {query}")
        
        # Use DuckDuckGo directly instead of LangChain tool
        from duckduckgo_search import DDGS
        
        def run_ddg_images():
            with DDGS() as ddgs:
                return list(ddgs.images(
                    query,
                    region="vn-vi",
                    safesearch="off",
                    max_results=max_results
                ))
        
        # Run in thread to avoid blocking
        ddg_results = await asyncio.to_thread(run_ddg_images)
        
        for r in ddg_results:
            images.append({
                "url": r.get("image", ""),
                "thumbnail": r.get("thumbnail", ""),
                "caption": r.get("title", query),
                "source": "duckduckgo"
            })
        
        logger.info(f"[enrichment] Found {len(images)} images for: {query}")
        
    except Exception as e:
        logger.error(f"[enrichment] Image search error: {e}")
    
    return images


async def search_details_for_item(query: str, item_type: str = "attraction") -> Dict[str, Any]:
    """
    Search detailed info for a location or dish.
    
    Args:
        query: Search query (e.g., "Cầu Rồng Đà Nẵng lịch sử")
        item_type: "attraction" | "meal" | "restaurant"
    
    Returns details dict with relevant fields based on type.
    """
    try:
        from tools.search import web_search_tavily, web_search_duckduckgo
        
        logger.info(f"[enrichment] Searching details for: {query}")
        
        # Try Tavily first, fallback to DuckDuckGo
        result = web_search_tavily(query, max_results=2)
        if not result.get("results"):
            result = web_search_duckduckgo(query, max_results=2)
        
        results = result.get("results", [])
        
        if not results:
            return _get_default_details(item_type)
        
        # Combine snippets from search results
        combined_description = ""
        source_url = ""
        
        for r in results[:2]:
            snippet = r.get("snippet", "")
            if snippet:
                combined_description += snippet + " "
            if not source_url and r.get("url"):
                source_url = r.get("url")
        
        # Build details based on type
        if item_type == "meal":
            return {
                "description": combined_description.strip()[:500],
                "origin": "Đặc sản địa phương",
                "ingredients": [],  # Would need more sophisticated parsing
                "eating_guide": "Thưởng thức nóng, ăn kèm rau sống",
                "source_url": source_url
            }
        elif item_type == "restaurant":
            return {
                "description": combined_description.strip()[:500],
                "rating": 4.5,  # Mock - would need Google Places API for real data
                "review_count": 100,
                "opening_hours": "06:00 - 22:00",
                "price_range": "30k - 150k",
                "source_url": source_url
            }
        else:  # attraction
            return {
                "description": combined_description.strip()[:500],
                "history": "",
                "best_time": "Sáng sớm hoặc chiều muộn",
                "nearby": [],
                "source_url": source_url
            }
    
    except Exception as e:
        logger.error(f"[enrichment] Details search error: {e}")
        return _get_default_details(item_type)


def _get_default_details(item_type: str) -> Dict[str, Any]:
    """Return default details when search fails."""
    if item_type == "meal":
        return {
            "description": "Món ăn đặc sản địa phương",
            "origin": "Đặc sản vùng miền",
            "eating_guide": "Thưởng thức nóng",
            "source_url": ""
        }
    elif item_type == "restaurant":
        return {
            "description": "Quán ăn địa phương",
            "rating": 4.0,
            "opening_hours": "06:00 - 22:00",
            "source_url": ""
        }
    else:
        return {
            "description": "Điểm tham quan nổi tiếng",
            "best_time": "Sáng sớm hoặc chiều muộn",
            "source_url": ""
        }


async def enrich_slot(slot: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enrich a single schedule slot with images and details.
    
    Args:
        slot: A schedule slot from the itinerary
        
    Returns:
        Enriched slot with `images` and `details` fields filled
    """
    slot_type = slot.get("slot_type", "")
    
    # Skip transport and rest slots
    if slot_type in ["transport", "rest"]:
        return slot
    
    # Get search queries from slot
    image_query = slot.get("image_search_query", "")
    detail_query = slot.get("detail_search_query", "")
    
    # Fallback to activity name if no query specified
    activity = slot.get("activity", "")
    if not image_query and activity:
        image_query = activity
    if not detail_query and activity:
        detail_query = activity
    
    # Determine detail type
    detail_type = "attraction"
    if slot_type == "meal":
        meal_type = slot.get("meal_type", "")
        # If it looks like a restaurant
        if slot.get("location") and "quán" in slot.get("activity", "").lower():
            detail_type = "restaurant"
        else:
            detail_type = "meal"
    
    # Run both searches concurrently
    images_task = search_images_for_item(image_query, max_results=2)
    details_task = search_details_for_item(detail_query, detail_type)
    
    images, details = await asyncio.gather(images_task, details_task)
    
    # Add to slot
    slot["images"] = images
    slot["details"] = details
    
    return slot


async def enrich_itinerary(itinerary_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Enrich entire itinerary with images and details.
    
    Args:
        itinerary_data: Parsed JSON itinerary from LLM
        
    Returns:
        Enriched itinerary with images and details for each slot
    """
    logger.info("[enrichment] Starting itinerary enrichment")
    
    try:
        days = itinerary_data.get("days", [])
        
        # Collect all slots to enrich
        enrichment_tasks = []
        slot_references = []  # Keep track of (day_idx, slot_idx) for each task
        
        for day_idx, day in enumerate(days):
            schedule = day.get("schedule", [])
            for slot_idx, slot in enumerate(schedule):
                enrichment_tasks.append(enrich_slot(slot))
                slot_references.append((day_idx, slot_idx))
        
        logger.info(f"[enrichment] Enriching {len(enrichment_tasks)} slots")
        
        # Run all enrichments concurrently (with some rate limiting)
        # Process in batches of 5 to avoid overwhelming APIs
        batch_size = 5
        enriched_slots = []
        
        for i in range(0, len(enrichment_tasks), batch_size):
            batch = enrichment_tasks[i:i + batch_size]
            batch_results = await asyncio.gather(*batch, return_exceptions=True)
            
            for result in batch_results:
                if isinstance(result, Exception):
                    logger.error(f"[enrichment] Slot enrichment failed: {result}")
                    enriched_slots.append({})  # Empty fallback
                else:
                    enriched_slots.append(result)
        
        # Put enriched slots back into itinerary
        for (day_idx, slot_idx), enriched_slot in zip(slot_references, enriched_slots):
            if enriched_slot:
                itinerary_data["days"][day_idx]["schedule"][slot_idx] = enriched_slot
        
        # Also enrich hero image for trip
        trip_overview = itinerary_data.get("trip_overview", {})
        hero_query = trip_overview.get("hero_image_query", "")
        if hero_query:
            hero_images = await search_images_for_item(hero_query, max_results=1)
            if hero_images:
                trip_overview["hero_image"] = hero_images[0].get("url", "")
        
        logger.info("[enrichment] Itinerary enrichment complete")
        return itinerary_data
        
    except Exception as e:
        logger.error(f"[enrichment] Full enrichment failed: {e}")
        return itinerary_data  # Return original if enrichment fails
