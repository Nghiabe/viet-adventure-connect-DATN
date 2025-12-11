from typing import Dict, Any, Literal
from loguru import logger
from langgraph.graph import StateGraph, START, END
from agents.researcher.state import ResearcherState
from tools.tour_matcher_tool import tour_matcher_tool

# Define nodes
async def node_research_tours(state: ResearcherState) -> Dict[str, Any]:
    """Call tour matcher tool to find activities."""
    logger.info(f"[researcher] searching tours for {state['destination']}")
    
    try:
        # Convert list to comma-separated string for tool if needed, 
        # but tour_matcher_tool handles list input if we call the python function directly
        # Actually tour_matcher_tool is a LangChain tool. We can call the python function `tour_matcher` directly.
        from tools.tour_matcher_tool import tour_matcher
        
        result = await tour_matcher(
            destination=state["destination"],
            dates=state.get("dates"),
            budget_per_person=state.get("budget"),
            style=state.get("style"),
            interests=state.get("interests", [])
        )
        
        return {
            "matched_tours": result.get("matched_tours", []),
            "recommendation": result.get("recommendation", "create_new")
        }
    except Exception as e:
        logger.error(f"[researcher] error matching tours: {e}")
        return {"errors": [str(e)]}

# Build graph
def build_researcher_graph():
    graph = StateGraph(ResearcherState)
    graph.add_node("research_tours", node_research_tours)
    graph.add_edge(START, "research_tours")
    graph.add_edge("research_tours", END)
    
    return graph.compile()

# Singleton accessor
researcher_agent = build_researcher_graph()
