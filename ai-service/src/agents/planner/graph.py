from typing import Dict, Any, List
from loguru import logger
from langgraph.graph import StateGraph, START, END
from agents.planner.state import PlannerState
from config import get_settings
from langchain_openai import ChatOpenAI
from prompts.itinerary_planner import itinerary_generator_prompt
from agents.itinerary_planner.utils import extract_json_from_text, parse_dates
from agents.planner.enrichment import enrich_itinerary
from tenacity import AsyncRetrying, retry_if_exception_type, stop_after_attempt, wait_fixed
from google.api_core.exceptions import ResourceExhausted
import json


async def node_generate_itinerary(state: PlannerState) -> Dict[str, Any]:
    """
    Generate comprehensive Super Guide itinerary.
    
    This node:
    1. Builds a detailed prompt with weather, hotel info, etc.
    2. Tries MegaLLM first (short timeout), falls back to OpenRouter
    3. Parses JSON response
    """
    try:
        settings = get_settings()
        
        # Check if we have at least one LLM provider
        if not settings.megallm_api_key and not settings.openrouter_api_key:
            return {"errors": ["No LLM API key configured (neither MegaLLM nor OpenRouter)"]}
            
        destination = state["destination_id"]
        dates = state["dates"]
        start_date = dates.get("start", "")
        end_date = dates.get("end", "")
        
        if not start_date or not end_date:
            return {"errors": ["Missing dates"]}
            
        _, _, num_days = parse_dates(start_date, end_date)
        
        # Extract hotel info for start point
        hotel_data = state.get("hotel_data", {})
        hotel_name = hotel_data.get("name", "Khách sạn đã chọn")
        hotel_address = hotel_data.get("address", "")
        
        # Get travel preferences
        travel_style = state.get("travel_style", "mid-range")
        interests = state.get("interests", [])
        
        # Prepare destination context
        tours_summary = [t.get("title") for t in state.get("tours_data", [])]
        destination_info = {
            "name": destination,
            "tours": tours_summary,
            "hotel": hotel_name
        }
        
        # Build prompt
        prompt = itinerary_generator_prompt(
            destination=destination,
            destination_info=destination_info,
            num_days=num_days,
            start_date=start_date,
            end_date=end_date,
            style=travel_style,
            interests=interests,
            hotel_name=hotel_name,
            hotel_address=hotel_address
        )
        
        logger.info(f"[planner] Generating itinerary for {destination}, {num_days} days")
        
        # Helper to invoke LLM
        async def invoke_llm(llm, provider_name: str) -> str:
            logger.info(f"[planner] Invoking {provider_name}...")
            response = await llm.ainvoke(prompt)
            content = response.content
            logger.info(f"[planner] {provider_name} returned {len(content)} chars")
            return content
        
        content = ""
        
        # Try MegaLLM first (short timeout - fail fast)
        if settings.megallm_api_key:
            try:
                llm_mega = ChatOpenAI(
                    model="qwen/qwen3-next-80b-a3b-instruct",
                    api_key=settings.megallm_api_key,
                    base_url=settings.megallm_base_url,
                    temperature=0.2,
                    timeout=10.0,  # Short timeout - fail fast to fallback
                    max_retries=1
                )
                content = await invoke_llm(llm_mega, "MegaLLM")
            except Exception as e:
                logger.warning(f"[planner] MegaLLM failed: {str(e)[:100]} - trying OpenRouter fallback")
        
        # Fallback to OpenRouter if MegaLLM failed or not configured
        if not content and settings.openrouter_api_key:
            try:
                llm_openrouter = ChatOpenAI(
                    model=settings.openrouter_model,
                    api_key=settings.openrouter_api_key,
                    base_url=settings.openrouter_base_url,
                    temperature=0.2,
                    timeout=120.0,  # Longer timeout for detailed itinerary generation
                    max_retries=2,
                    default_headers={
                        "HTTP-Referer": "https://viet-adventure.com",
                        "X-Title": "VietAdventure AI Planner"
                    }
                )
                content = await invoke_llm(llm_openrouter, "OpenRouter")
            except Exception as e:
                logger.error(f"[planner] OpenRouter also failed: {e}")
                return {"errors": [f"All LLM providers failed: {str(e)}"]}
        
        if not content:
            return {"errors": ["No LLM response received"]}
        
        logger.info(f"[planner] Got LLM response, length: {len(content)}")
        
        # Parse JSON from response
        itinerary_data = extract_json_from_text(content)
        
        if not itinerary_data:
            logger.error("[planner] Failed to parse JSON from LLM response")
            return {
                "itinerary_content": content,
                "itinerary_data": None,
                "errors": ["Failed to parse itinerary JSON"]
            }
        
        # Calculate total cost from itinerary
        total_cost = 0
        try:
            trip_summary = itinerary_data.get("trip_summary", {})
            total_cost = trip_summary.get("total_cost", 0)
            if not total_cost:
                # Fallback: sum day summaries
                for day in itinerary_data.get("days", []):
                    day_summary = day.get("day_summary", {})
                    total_cost += day_summary.get("total_cost", 0)
        except Exception as e:
            logger.warning(f"[planner] Could not calculate total cost: {e}")
        
        logger.info(f"[planner] Parsed itinerary with {len(itinerary_data.get('days', []))} days, total cost: {total_cost}")
        
        return {
            "itinerary_content": content,
            "itinerary_data": itinerary_data,
            "total_cost": total_cost
        }

    except Exception as e:
        logger.error(f"[planner] Error generating itinerary: {e}")
        return {"errors": [str(e)]}


async def node_enrich_itinerary(state: PlannerState) -> Dict[str, Any]:
    """
    Enrich itinerary with images and detailed info.
    
    This node:
    1. Takes parsed itinerary_data
    2. Searches for images for each attraction/meal
    3. Searches for detailed info for each location
    4. Returns enriched_data
    """
    try:
        itinerary_data = state.get("itinerary_data")
        
        if not itinerary_data:
            logger.warning("[planner] No itinerary_data to enrich")
            return {"enriched_data": None}
        
        logger.info("[planner] Starting enrichment...")
        
        # Run enrichment
        enriched_data = await enrich_itinerary(itinerary_data)
        
        logger.info("[planner] Enrichment complete")
        
        return {"enriched_data": enriched_data}
        
    except Exception as e:
        logger.error(f"[planner] Enrichment error: {e}")
        # Return original data if enrichment fails
        return {"enriched_data": state.get("itinerary_data")}


def build_planner_graph():
    """
    Build the Super Guide planner graph.
    
    Flow:
    START -> generate_itinerary -> enrich_itinerary -> END
    """
    graph = StateGraph(PlannerState)
    
    # Add nodes
    graph.add_node("generate_itinerary", node_generate_itinerary)
    graph.add_node("enrich_itinerary", node_enrich_itinerary)
    
    # Add edges
    graph.add_edge(START, "generate_itinerary")
    graph.add_edge("generate_itinerary", "enrich_itinerary")
    graph.add_edge("enrich_itinerary", END)
    
    return graph.compile()


planner_agent = build_planner_graph()
