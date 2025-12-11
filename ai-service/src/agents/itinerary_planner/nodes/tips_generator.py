from __future__ import annotations
from typing import Dict, Any
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState
from tools.safety_tips_tool import safety_tips_generator


async def tips_generator_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Generate safety tips."""
	user_inputs = state.get("user_inputs", {})
	daily_itinerary = state.get("daily_itinerary", [])
	
	destination = user_inputs.get("destination", "")
	interests = user_inputs.get("interests", [])
	
	logger.info("[node:tips_generator] destination=\"{}\"", destination)
	
	if not destination:
		logger.warning("[node:tips_generator] No destination provided")
		return {"safety_tips": []}
	
	# Extract activities from itinerary
	activities = []
	for day in daily_itinerary:
		for period in ["morning", "afternoon", "evening"]:
			activity = day.get(period, {})
			if isinstance(activity, dict):
				activity_name = activity.get("activity", "")
				if activity_name:
					activities.append(activity_name)
	
	# Combine with interests
	all_activities = list(set(activities + (interests if isinstance(interests, list) else [])))
	
	# Call safety tips tool
	try:
		result = await safety_tips_generator(
			destination=destination,
			activities=all_activities[:10]  # Limit to 10
		)
		
		tips = result.get("safety_tips", [])
		logger.info("[node:tips_generator] generated {} tips", len(tips))
		return {"safety_tips": tips}
		
	except Exception as e:
		logger.exception("[node:tips_generator] Error generating tips: {}", e)
		return {"safety_tips": []}

