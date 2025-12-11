from __future__ import annotations
from typing import Dict, Any
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState


async def human_checkpoint_3_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Human checkpoint for final review."""
	human_feedback = state.get("human_feedback", {})
	
	logger.info("[node:checkpoint_3] waiting for human feedback")
	
	# Check if we have feedback for this checkpoint
	checkpoint_feedback = human_feedback.get("checkpoint_3")
	if checkpoint_feedback:
		action = checkpoint_feedback.get("action", "approve")
		
		logger.info("[node:checkpoint_3] received feedback: action=\"{}\"", action)
		
		if action == "approve":
			return {"final_approved": True}
		else:
			# User wants to make changes
			change_type = checkpoint_feedback.get("change_type", "")
			return {
				"final_approved": False,
				"change_type": change_type,
				"changes": checkpoint_feedback.get("changes", {})
			}
	
	# No feedback yet - this will cause an interrupt
	return {}



