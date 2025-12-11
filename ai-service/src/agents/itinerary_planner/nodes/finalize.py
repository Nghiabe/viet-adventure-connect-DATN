from __future__ import annotations
from typing import Dict, Any
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState
from clients.backend import create_itinerary


async def finalize_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Finalize and save itinerary to database."""
	user_inputs = state.get("user_inputs", {})
	daily_itinerary = state.get("daily_itinerary", [])
	recommended_hotels = state.get("recommended_hotels", [])
	selected_hotel = state.get("selected_hotel")
	route_data = state.get("route_data", {})
	budget_summary = state.get("budget_summary", {})
	safety_tips = state.get("safety_tips", [])
	
	destination = user_inputs.get("destination", "")
	start_date = user_inputs.get("startDate", "")
	end_date = user_inputs.get("endDate", "")
	
	logger.info(
		"[node:finalize] destination=\"{}\" dates={}-{}",
		destination, start_date, end_date
	)
	
	# Use selected hotel or top hotels
	hotels_list = []
	if selected_hotel:
		hotels_list = [selected_hotel]
	elif recommended_hotels:
		hotels_list = recommended_hotels[:3]  # Top 3
	
	# Build itinerary name
	itinerary_name = f"Kế hoạch {destination} {start_date} - {end_date}"
	
	# Build final itinerary object
	final_itinerary = {
		"name": itinerary_name,
		"generationParams": user_inputs,
		"dailyPlan": daily_itinerary,
		"hotels": hotels_list,
		"transportation": {
			"suggestions": ["Dùng Grab hoặc taxi có đồng hồ"],
			"costs": {}
		},
		"mapData": route_data,
		"totalCost": budget_summary,
		"importantNotes": safety_tips,
		"status": "draft"
	}
	
	# Save to database
	try:
		itinerary_doc = await create_itinerary(final_itinerary)
		
		if itinerary_doc:
			itinerary_id = str(itinerary_doc.get("_id", ""))
			logger.info("[node:finalize] saved itinerary id=\"{}\"", itinerary_id)
			return {
				"final_itinerary": final_itinerary,
				"saved_to_db": True,
				"itinerary_id": itinerary_id
			}
		else:
			logger.error("[node:finalize] create_itinerary returned None")
			return {
				"final_itinerary": final_itinerary,
				"saved_to_db": False,
				"itinerary_id": ""
			}
	except Exception as e:
		logger.exception("[node:finalize] Error saving itinerary: {}", e)
		return {
			"final_itinerary": final_itinerary,
			"saved_to_db": False,
			"itinerary_id": ""
		}

