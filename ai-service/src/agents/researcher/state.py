from typing import TypedDict, List, Dict, Any, Annotated
import operator

class ResearcherState(TypedDict):
    # Inputs
    destination: str
    dates: Dict[str, str]  # { "start": "...", "end": "..." }
    budget: float  # Budget per person
    style: str # adventure, cultural, etc.
    interests: List[str]

    # Outputs
    matched_tours: List[Dict[str, Any]]
    recommendation: str # use_existing, hybrid, create_new
    
    # Internal
    errors: List[str]
