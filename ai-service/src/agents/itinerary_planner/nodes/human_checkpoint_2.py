from __future__ import annotations
from typing import Dict, Any
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState


async def human_checkpoint_2_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Human checkpoint for hotel review."""
	recommended_hotels = state.get("recommended_hotels", [])
	human_feedback = state.get("human_feedback", {})
	
	logger.info("[node:checkpoint_2] waiting for human feedback")
	
	# Check if we have feedback for this checkpoint
	checkpoint_feedback = human_feedback.get("checkpoint_2")
	if checkpoint_feedback:
		action = checkpoint_feedback.get("action", "approve")
		selected_hotel_index = checkpoint_feedback.get("selected_hotel_index", 0)
		
		logger.info("[node:checkpoint_2] received feedback: action=\"{}\" hotel_index={}", action, selected_hotel_index)
		
		if action == "adjust":
			# User wants to adjust - will loop back to hotel_finder
			return {"hotel_adjustment_requested": True}
		else:
			# User approved - select hotel (validate index)
			if not recommended_hotels:
				logger.warning("[node:checkpoint_2] No hotels available, cannot select")
				return {"hotel_adjustment_requested": True}  # Force adjustment
			
			if 0 <= selected_hotel_index < len(recommended_hotels):
				selected_hotel = recommended_hotels[selected_hotel_index]
				return {"selected_hotel": selected_hotel, "hotel_adjustment_requested": False}
			else:
				logger.warning("[node:checkpoint_2] Invalid hotel_index={}, using first hotel", selected_hotel_index)
				return {"selected_hotel": recommended_hotels[0], "hotel_adjustment_requested": False}
	
	# No feedback yet - this will cause an interrupt
	return {}

