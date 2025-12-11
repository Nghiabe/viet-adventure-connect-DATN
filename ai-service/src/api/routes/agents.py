from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from agents.researcher.graph import researcher_agent
from agents.hotel_finder.graph import hotel_agent
from agents.planner.graph import planner_agent

router = APIRouter()

# --- Request Models ---

class ResearchRequest(BaseModel):
    destination: str
    dates: Optional[Dict[str, str]] = None
    budget: Optional[float] = None
    style: Optional[str] = None
    interests: Optional[List[str]] = None

class HotelRequest(BaseModel):
    destination_id: str
    check_in: str
    check_out: str
    budget: Optional[float] = None
    guests: Optional[int] = 2

class PlanRequest(BaseModel):
    destination_id: str
    dates: Dict[str, str]
    selected_tours: List[str] = []
    tours_data: List[Dict[str, Any]] = []
    selected_hotel: str = ""
    hotel_data: Dict[str, Any] = {}
    # Super Guide fields
    travel_style: Optional[str] = "mid-range"
    interests: Optional[List[str]] = []
    num_travelers: Optional[int] = 2

# --- Endpoints ---

@router.post("/research")
async def run_research(payload: ResearchRequest):
    """Run Researcher Agent to find tours."""
    try:
        inputs = payload.model_dump()
        result = await researcher_agent.ainvoke(inputs)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/hotel")
async def run_hotel(payload: HotelRequest):
    """Run Hotel Finder Agent."""
    try:
        inputs = payload.model_dump()
        result = await hotel_agent.ainvoke(inputs)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plan")
async def run_plan(payload: PlanRequest):
    """
    Run Super Guide Planner Agent.
    
    Returns enriched itinerary with:
    - Full day-by-day schedule (8 slots per day)
    - Images for each attraction/meal
    - Detailed info for each location
    - Daily briefings with weather, dress code
    - Cost breakdowns
    """
    try:
        input_data = payload.model_dump()
        result = await planner_agent.ainvoke(input_data)
        
        # Return enriched data if available, fallback to itinerary_data
        response = {
            "success": True,
            "itinerary_content": result.get("enriched_data") or result.get("itinerary_data"),
            "total_cost": result.get("total_cost", 0),
            "errors": result.get("errors", [])
        }
        
        if result.get("errors"):
            response["success"] = False
            
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

