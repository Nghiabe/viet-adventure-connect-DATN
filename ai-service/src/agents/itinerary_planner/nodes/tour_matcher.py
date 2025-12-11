from __future__ import annotations
from typing import Dict, Any
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState
from agents.itinerary_planner.utils import map_budget_level
from tools.tour_matcher_tool import tour_matcher


async def tour_matcher_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Match existing tours from database."""
	user_inputs = state.get("user_inputs", {})
	destination = user_inputs.get("destination", "")
	start_date = user_inputs.get("startDate", "")
	end_date = user_inputs.get("endDate", "")
	budget = user_inputs.get("budget", "")
	style = user_inputs.get("style", "")
	interests = user_inputs.get("interests", [])
	
	logger.info(
		"[node:tour_matcher] destination=\"{}\" budget=\"{}\" style=\"{}\"",
		destination, budget, style
	)
	
	# Map budget string to number
	budget_per_person, _ = map_budget_level(budget)
	
	dates = None
	if start_date and end_date:
		dates = {"start": start_date, "end": end_date}
	
	# Call tour matcher tool
	try:
		result = await tour_matcher(
			destination=destination,
			dates=dates,
			budget_per_person=budget_per_person,
			style=style,
			interests=interests if isinstance(interests, list) else []
		)
		
		matched_tours = result.get("matched_tours", [])
		recommendation = result.get("recommendation", "create_new")
		
		logger.info(
			"[node:tour_matcher] found {} tours, recommendation=\"{}\"",
			len(matched_tours), recommendation
		)
		
		return {
			"matched_tours": matched_tours,
			"tour_selection": recommendation
		}
		
	except Exception as e:
		logger.exception("[node:tour_matcher] Error matching tours: {}", e)
		return {
			"matched_tours": [],
			"tour_selection": "create_new"
		}

