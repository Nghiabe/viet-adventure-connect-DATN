from __future__ import annotations
from typing import TypedDict, Dict, List, Any, Optional


class ItineraryPlannerState(TypedDict, total=False):
	"""State schema for Itinerary Planner Agent Graph."""
	
	# User inputs from wizard
	user_inputs: Dict[str, Any]  # destination, dates, travelers, budget, style, interests
	
	# Processing states
	destination_info: Dict[str, Any]  # from destination_analyzer
	matched_tours: List[Dict[str, Any]]  # from tour_matcher
	tour_selection: str  # "use_existing" | "create_new" | "hybrid"
	selected_tour_id: Optional[str]  # ID of selected tour if use_existing
	
	# Generated data
	daily_itinerary: List[Dict[str, Any]]  # daily plan with activities
	recommended_hotels: List[Dict[str, Any]]  # hotel recommendations
	selected_hotel: Optional[Dict[str, Any]]  # selected hotel from checkpoint_2
	hotel_adjustment_requested: bool  # whether user wants to adjust hotels
	route_data: Dict[str, Any]  # map routes and markers
	budget_summary: Dict[str, Any]  # budget breakdown
	safety_tips: List[str]  # safety tips and notes
	
	# Human checkpoints
	human_feedback: Dict[str, Any]  # {checkpoint_id: feedback_data}
	revision_count: int  # number of revisions
	final_approved: bool  # whether final itinerary is approved
	change_type: str  # type of change requested at checkpoint_3
	changes: Dict[str, Any]  # specific changes requested
	
	# Final output
	final_itinerary: Dict[str, Any]  # complete itinerary data
	saved_to_db: bool  # whether saved to database
	itinerary_id: str  # MongoDB ID after saving

