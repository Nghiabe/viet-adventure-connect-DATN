from typing import TypedDict, List, Dict, Any, Optional

class PlannerState(TypedDict):
    # Inputs
    destination_id: str
    dates: Dict[str, str]
    selected_tours: List[str]  # List of tour IDs
    tours_data: List[Dict[str, Any]]  # Full tour objects (passed from Researcher)
    selected_hotel: str  # Hotel ID
    hotel_data: Dict[str, Any]  # Full hotel object (passed from Hotel Agent)
    
    # Additional inputs for Super Guide
    travel_style: Optional[str]  # "budget" | "mid-range" | "luxury"
    interests: Optional[List[str]]  # ["food", "history", "nature", ...]
    num_travelers: Optional[int]
    
    # Outputs
    itinerary_content: str  # Raw JSON string from LLM
    itinerary_data: Optional[Dict[str, Any]]  # Parsed JSON object
    enriched_data: Optional[Dict[str, Any]]  # After enrichment with images/details
    total_cost: float
    
    # Internal
    errors: List[str]
