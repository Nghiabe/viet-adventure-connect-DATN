from typing import TypedDict, List, Dict, Any, Optional

class HotelFinderState(TypedDict):
    # Inputs
    destination_id: str # Location name or LLM-resolved ID
    check_in: str
    check_out: str
    budget: float  # Budget per night/total? Usually per night for API
    guests: int

    # Outputs
    hotels: List[Dict[str, Any]]
    
    # Internal
    errors: List[str]
