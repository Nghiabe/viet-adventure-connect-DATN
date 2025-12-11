from typing import Any, Dict, List
from loguru import logger
from langchain_core.tools import tool

@tool
async def search_images(query: str, max_results: int = 2) -> Dict[str, Any]:
    """
    Search for specific images using Tavily (primary) or DuckDuckGo (fallback).
    Use this tool when you need to find photos of specific food, places, or landmarks 
    to illustrate your response.
    
    Parameters:
    - query: Specific search term (e.g. "Bánh xèo Bà Dưỡng Đà Nẵng", "Cầu Rồng về đêm").
    
    Returns:
    - { "images": [ { "title": str, "image": str, "thumbnail": str, "source": str } ] }
    """
    images = []
    
    # 1. Try Tavily first (API Key required)
    try:
        from tools.search import web_search_tavily
        logger.info(f"[tool:search_images] method=tavily q='{query}' limit={max_results}")
        
        # Tavily's web_search wrapper returns generic search results
        # We need to ensure we ask for images specifically or parse them
        # Note: The existing web_search_tavily in search.py uses include_images=True
        import asyncio
        tavily_resp = await asyncio.to_thread(web_search_tavily, query, max_results=max_results)
        
        if isinstance(tavily_resp, dict) and "results" in tavily_resp:
            for r in tavily_resp["results"]:
                if r.get("image"):
                    images.append({
                        "title": r.get("title"),
                        "image": r.get("image"),
                        "thumbnail": r.get("image"), # Tavily uses same URL
                        "source": "tavily",
                        "url": r.get("url")
                    })
        
        if images:
            return {"images": images[:max_results]}
            
    except Exception as e:
        logger.error(f"[tool:search_images] tavily error={e}")

    # 2. Fallback to DuckDuckGo
    if not images:
        try:
            from duckduckgo_search import DDGS
            logger.info(f"[tool:search_images] method=ddg fallback q='{query}'")
            
            # Use sync DDGS in thread to avoid blocking loop
            import asyncio
            
            def run_ddg():
                with DDGS() as ddgs:
                    return list(ddgs.images(
                        query,
                        region="vn-vi",
                        safesearch="off",
                        max_results=max_results
                    ))
            
            dk_results = await asyncio.to_thread(run_ddg)
                
            for r in dk_results:
                images.append({
                    "title": r.get("title"),
                    "image": r.get("image"),
                    "thumbnail": r.get("thumbnail"),
                    "source": "duckduckgo",
                    "url": r.get("url")
                })
        except Exception as e:
            logger.error(f"[tool:search_images] ddg error={e}")

    return {"images": images}
