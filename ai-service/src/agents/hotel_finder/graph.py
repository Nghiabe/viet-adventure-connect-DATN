from typing import Dict, Any
from loguru import logger
from langgraph.graph import StateGraph, START, END
from agents.hotel_finder.state import HotelFinderState
from tools.hotel_search_tool import hotel_search

# Define nodes
async def node_find_hotels(state: HotelFinderState) -> Dict[str, Any]:
    """Call hotel search tool."""
    logger.info(f"[hotel_finder] searching hotels for {state['destination_id']}")
    
    try:
        # Map budget float to level string
        budget = state.get("budget", 0)
        budget_level = "mid-range"
        if budget < 1000000:
            budget_level = "budget"
        elif budget > 2500000:
            budget_level = "luxury"
            
        # Direct call to python function
        result = await hotel_search(
            city=state["destination_id"], # Correct arg name: city
            check_in=state["check_in"],
            check_out=state["check_out"],
            adults=state.get("guests", 2),
            budget_level=budget_level # Correct arg name: budget_level
        )
        
        # Result is dict {"hotels": [...]}
        hotels = result.get("hotels", []) if isinstance(result, dict) else []
        return {"hotels": hotels}
        
    except Exception as e:
        logger.error(f"[hotel_finder] error searching hotels: {e}")
        return {"errors": [str(e)]}

# Build graph
def build_hotel_graph():
    graph = StateGraph(HotelFinderState)
    graph.add_node("find_hotels", node_find_hotels)
    graph.add_edge(START, "find_hotels")
    graph.add_edge("find_hotels", END)
    
    return graph.compile()

# Singleton accessor
hotel_agent = build_hotel_graph()
