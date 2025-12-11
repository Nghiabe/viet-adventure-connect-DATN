from __future__ import annotations
from typing import Dict, Any
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState
from agents.itinerary_planner.utils import parse_dates, map_budget_level
from tools.budget_calculator_tool import budget_calculator


async def budget_calculator_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Calculate budget breakdown."""
	user_inputs = state.get("user_inputs", {})
	daily_itinerary = state.get("daily_itinerary", [])
	recommended_hotels = state.get("recommended_hotels", [])
	selected_hotel = state.get("selected_hotel")
	route_data = state.get("route_data", {})
	
	start_date = user_inputs.get("startDate", "")
	end_date = user_inputs.get("endDate", "")
	travelers = user_inputs.get("travelers", 1)
	budget = user_inputs.get("budget", "")
	
	logger.info(
		"[node:budget_calculator] travelers={} budget=\"{}\"",
		travelers, budget
	)
	
	# Calculate number of days
	_, _, num_days = parse_dates(start_date, end_date)
	
	# Map budget string to number
	budget_per_person, _ = map_budget_level(budget)
	user_budget = budget_per_person * travelers if budget_per_person else None
	
	# Use selected hotel or first hotel
	hotels_list = []
	if selected_hotel:
		hotels_list = [selected_hotel]
	elif recommended_hotels:
		hotels_list = [recommended_hotels[0]]
	
	# Extract transport costs from routes
	transportation = None
	routes = route_data.get("routes", [])
	if routes:
		# Estimate transport costs from routes
		total_transport = 0
		for route in routes:
			distance = route.get("distance_km", 0)
			# Rough estimate: 15k VND per km
			cost = int(distance * 15000)
			total_transport += cost
		transportation = {
			"costs": {"total": total_transport},
			"suggestions": ["Dùng Grab hoặc taxi có đồng hồ"]
		}
	
	# Call budget calculator tool
	try:
		result = await budget_calculator(
			daily_activities=daily_itinerary,
			hotels=hotels_list,
			transportation=transportation,
			meals=None,
			user_budget=user_budget,
			num_days=num_days,
			num_people=travelers
		)
		
		total = result.get("total_estimated", 0)
		within_budget = result.get("within_budget", False)
		logger.info(
			"[node:budget_calculator] total={} within_budget={}",
			total, within_budget
		)
		
		return {"budget_summary": result}
		
	except Exception as e:
		logger.exception("[node:budget_calculator] Error calculating budget: {}", e)
		return {"budget_summary": {}}

