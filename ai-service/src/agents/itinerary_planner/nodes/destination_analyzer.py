from __future__ import annotations
from typing import Dict, Any
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState
from tools.weather import weather_lookup
from tools.search import web_search_tavily


async def destination_analyzer_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Analyze destination and gather context information."""
	user_inputs = state.get("user_inputs", {})
	destination = user_inputs.get("destination", "")
	
	logger.info("[node:destination_analyzer] destination=\"{}\"", destination)
	
	if not destination:
		logger.error("[node:destination_analyzer] No destination provided")
		return {"destination_info": {}}
	
	# Initialize destination doc
	dest_doc = {"name": destination}
	
	# Use web search for destination info
	try:
		search_query = f"{destination} Vietnam travel guide destination information"
		web_results = web_search_tavily(search_query, max_results=3)
		
		if web_results.get("results") and len(web_results["results"]) > 0:
			first_result = web_results["results"][0]
			dest_doc.update({
				"description": first_result.get("snippet", ""),
				"mainImage": first_result.get("image", "")
			})
			logger.info("[node:destination_analyzer] web search successful")
		else:
			logger.warning("[node:destination_analyzer] web search returned no results")
	except Exception as e:
		logger.warning("[node:destination_analyzer] web search failed: {}", e)
	
	# Get weather info
	weather_info = {}
	try:
		weather_result = await weather_lookup(destination)
		if weather_result and not weather_result.get("error"):
			weather_info = {
				"forecast": weather_result.get("forecast", ""),
				"source": weather_result.get("source", "")
			}
			logger.info("[node:destination_analyzer] weather lookup successful")
	except Exception as e:
		logger.warning("[node:destination_analyzer] weather lookup failed: {}", e)
	
	# Build destination info
	destination_info = {
		"name": dest_doc.get("name", destination),
		"slug": dest_doc.get("slug", ""),
		"description": dest_doc.get("description", ""),
		"history": dest_doc.get("history", ""),
		"culture": dest_doc.get("culture", ""),
		"geography": dest_doc.get("geography", ""),
		"bestTimeToVisit": dest_doc.get("bestTimeToVisit", []),
		"essentialTips": dest_doc.get("essentialTips", []),
		"mainImage": dest_doc.get("mainImage", ""),
		"weather": weather_info,
		"_id": str(dest_doc.get("_id", "")) if dest_doc.get("_id") else None
	}
	
	logger.info("[node:destination_analyzer] completed")
	return {"destination_info": destination_info}

