from __future__ import annotations
from typing import Dict, Any
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState


async def human_checkpoint_1_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Human checkpoint for tour selection."""
	matched_tours = state.get("matched_tours", [])
	human_feedback = state.get("human_feedback", {})
	tour_selection = state.get("tour_selection", "create_new")
	
	logger.info("[node:checkpoint_1] matched_tours={} tour_selection=\"{}\" has_feedback={}", len(matched_tours), tour_selection, bool(human_feedback.get("checkpoint_1")))
	
	# ALWAYS check feedback first - if we have feedback, we're resuming
	checkpoint_feedback = human_feedback.get("checkpoint_1")
	if checkpoint_feedback:
		action = checkpoint_feedback.get("action", "create_new")
		selected_tour_id = checkpoint_feedback.get("selected_tour_id")
		
		logger.info("[node:checkpoint_1] RESUMING with feedback: action=\"{}\" tour_id=\"{}\"", action, selected_tour_id)
		
		# Return updated tour_selection based on feedback
		if action == "use_existing":
			if selected_tour_id:
				return {"tour_selection": "use_existing", "selected_tour_id": selected_tour_id, "matched_tours": matched_tours}
			else:
				logger.warning("[node:checkpoint_1] use_existing but no tour_id, defaulting to create_new")
				return {"tour_selection": "create_new", "matched_tours": matched_tours}
		elif action == "create_new":
			return {"tour_selection": "create_new", "matched_tours": matched_tours}
		else:
			# Hybrid mode not fully implemented, default to create_new
			logger.info("[node:checkpoint_1] Hybrid mode requested, defaulting to create_new")
			return {"tour_selection": "create_new", "matched_tours": matched_tours}
	
	# No feedback yet - first time running
	logger.info("[node:checkpoint_1] First run, using default tour_selection=\"{}\"", tour_selection)
	return {"tour_selection": tour_selection, "matched_tours": matched_tours}

