from typing import Dict, Any, List, TypedDict
from loguru import logger
from langgraph.graph import StateGraph, START, END
from config import get_settings
from langchain_openai import ChatOpenAI
from prompts.alternatives import alternatives_generator_prompt
from agents.itinerary_planner.utils import extract_json_from_text

class AlternativesState(TypedDict):
    slot_context: Dict[str, Any]
    interests: List[str]
    alternatives: List[Dict[str, Any]]
    errors: List[str]

async def node_generate_alternatives(state: AlternativesState) -> Dict[str, Any]:
    try:
        settings = get_settings()
        
        # Use MegaLLM or OpenRouter
        if settings.megallm_api_key:
            llm = ChatOpenAI(
                model="qwen/qwen3-next-80b-a3b-instruct",
                api_key=settings.megallm_api_key,
                base_url=settings.megallm_base_url,
                temperature=0.4,
                timeout=15.0
            )
        elif settings.openrouter_api_key:
            llm = ChatOpenAI(
                model=settings.openrouter_model,
                api_key=settings.openrouter_api_key,
                base_url=settings.openrouter_base_url,
                temperature=0.4,
                timeout=30.0
            )
        else:
            return {"errors": ["No LLM configured"]}

        prompt = alternatives_generator_prompt(
            state["slot_context"],
            state.get("interests", [])
        )
        
        response = await llm.ainvoke(prompt)
        content = response.content
        
        data = extract_json_from_text(content)
        if not data or "alternatives" not in data:
            return {"errors": ["Failed to parse alternatives JSON"]}
            
        return {"alternatives": data["alternatives"]}

    except Exception as e:
        logger.error(f"[alternatives] Error: {e}")
        return {"errors": [str(e)]}

def build_alternatives_graph():
    graph = StateGraph(AlternativesState)
    graph.add_node("generate", node_generate_alternatives)
    graph.add_edge(START, "generate")
    graph.add_edge("generate", END)
    return graph.compile()

alternatives_agent = build_alternatives_graph()
