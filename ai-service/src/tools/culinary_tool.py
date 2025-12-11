from typing import Any, Dict, List
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from config import get_settings
from loguru import logger
from tools.search import web_search_tavily
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_fixed
from google.api_core.exceptions import ResourceExhausted

@tool
async def culinary_research_tool(dish_name: str, region: str = "") -> Dict[str, Any]:
    """
    Research deep details about a dish: history, ingredients, cultural significance.
    Use this when the user asks for more than just 'where to eat'.
    
    Args:
        dish_name: Name of the dish (e.g., "Mì Quảng", "Cao Lầu")
        region: City or region (e.g., "Hội An", "Đà Nẵng")
    """
    logger.info(f"[tool:culinary_research] dish={dish_name} region={region}")
    
    # 1. Search web for context
    query = f"nguồn gốc lịch sử thành phần món {dish_name} {region} chi tiết"
    web_results = web_search_tavily(query, max_results=3)
    
    context_text = ""
    if web_results.get("results"):
        context_text = "\n".join([r.get("content", "") for r in web_results["results"]])
        
    # 2. Use LLM to synthesize deep insight
    settings = get_settings()
    llm = ChatOpenAI(
        model="qwen/qwen3-next-80b-a3b-instruct",
        api_key=settings.megallm_api_key,
        base_url=settings.megallm_base_url,
        temperature=0.7 # Creative temp for stroytelling
    )
    
    from prompts.culinary import culinary_analysis_prompt
    prompt = culinary_analysis_prompt(dish_name, region, context_text)
    
    try:
        response_content = ""
        async for attempt in AsyncRetrying(
            retry=retry_if_exception_type(ResourceExhausted),
            stop=stop_after_attempt(3),
            wait=wait_fixed(5),
            reraise=True
        ):
            with attempt:
                response = await llm.ainvoke(prompt)
                response_content = response.content
                
        import json
        # Simple cleanup
        clean_json = response_content.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_json)
        return data
        
    except Exception as e:
        logger.error(f"[tool:culinary_research] LLM error: {e}")
        return {
            "error": "Could not analyze deep culinary details.",
            "raw_context": context_text[:500] + "..."
        }
