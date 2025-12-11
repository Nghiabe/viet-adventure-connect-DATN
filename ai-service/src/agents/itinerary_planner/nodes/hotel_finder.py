from __future__ import annotations
from typing import Dict, Any
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState
from agents.itinerary_planner.utils import calculate_nights, map_budget_level
from tools.hotel_search_tool import hotel_search


async def hotel_finder_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Find and recommend hotels."""
	user_inputs = state.get("user_inputs", {})
	destination = user_inputs.get("destination", "")
	start_date = user_inputs.get("startDate", "")
	end_date = user_inputs.get("endDate", "")
	travelers = user_inputs.get("travelers", 2)
	budget = user_inputs.get("budget", "")
	
	logger.info(
		"[node:hotel_finder] destination=\"{}\" checkin={} checkout={} travelers={} budget=\"{}\"",
		destination, start_date, end_date, travelers, budget
	)
	
	# Validate inputs
	if not destination or not start_date or not end_date:
		logger.error("[node:hotel_finder] Missing required inputs")
		return {"recommended_hotels": []}
	
	# Map budget to budget_level
	_, budget_level = map_budget_level(budget)
	
	# Call hotel search tool
	try:
		result = await hotel_search(
			city=destination,
			check_in=start_date,
			check_out=end_date,
			adults=travelers,
			budget_level=budget_level,
			preferences=None
		)
		
		hotels = result.get("hotels", [])
		
		# Add nights info to hotels
		nights = calculate_nights(start_date, end_date)
		for hotel in hotels:
			hotel["nights"] = nights
		
		logger.info("[node:hotel_finder] found {} hotels", len(hotels))
		return {"recommended_hotels": hotels}
		
	except Exception as e:
		logger.exception("[node:hotel_finder] Error searching hotels: {}", e)
		return {"recommended_hotels": []}

