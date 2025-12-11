from __future__ import annotations
from typing import Dict, Any, List
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState
from tools.route_builder_tool import route_builder


async def map_route_builder_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Build map routes and markers from itinerary."""
	daily_itinerary = state.get("daily_itinerary", [])
	recommended_hotels = state.get("recommended_hotels", [])
	selected_hotel = state.get("selected_hotel")
	
	logger.info("[node:map_route_builder] building routes")
	
	# Get selected hotel or first hotel
	hotel = selected_hotel or (recommended_hotels[0] if recommended_hotels else None)
	
	# Collect all points
	markers: List[Dict[str, Any]] = []
	all_points: List[Dict[str, Any]] = []
	
	# Add hotel marker
	if hotel and hotel.get("coordinates"):
		coords = hotel.get("coordinates", {})
		lat = coords.get("lat")
		lng = coords.get("lng")
		if lat is not None and lng is not None:
			hotel_marker = {
				"id": "hotel",
				"name": hotel.get("name", "Hotel"),
				"lat": lat,
				"lng": lng,
				"label": hotel.get("name", "Hotel"),
				"icon": "hotel"
			}
			markers.append(hotel_marker)
			all_points.append({
				"name": hotel.get("name", "Hotel"),
				"lat": lat,
				"lng": lng
			})
	
	# Extract locations from daily itinerary (skip for now - need geocoding)
	# TODO: Add geocoding for activity locations
	
	# Calculate center point (use hotel or default)
	center = {"lat": 16.0544, "lng": 108.2022}  # Default to Da Nang
	if all_points:
		first_point = all_points[0]
		center = {
			"lat": first_point.get("lat", 16.0544),
			"lng": first_point.get("lng", 108.2022)
		}
	
	# Build routes if we have multiple points
	routes = []
	if len(all_points) >= 2:
		try:
			route_result = await route_builder(all_points)
			routes = route_result.get("routes", [])
		except Exception as e:
			logger.warning("[node:map_route_builder] Failed to build routes: {}", e)
	
	# Group routes by day (routes don't have day field currently, so use all routes)
	routes_by_day = routes
	
	logger.info("[node:map_route_builder] built {} markers, {} routes", len(markers), len(routes))
	
	return {
		"route_data": {
			"center": center,
			"markers": markers,
			"routes": routes_by_day
		}
	}

