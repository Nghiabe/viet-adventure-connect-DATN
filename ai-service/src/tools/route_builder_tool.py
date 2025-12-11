from __future__ import annotations
from typing import Any, Dict, List
import httpx
from loguru import logger


def _format_coords(points: List[Dict[str, Any]]) -> str:
	"""Format points as OSRM coordinate string: lon,lat;lon,lat;..."""
	coords = []
	for point in points:
		lat = point.get("lat")
		lng = point.get("lng")
		if lat is not None and lng is not None:
			coords.append(f"{lng},{lat}")
	return ";".join(coords)


def _estimate_transport_cost(distance_km: float) -> Dict[str, str]:
	"""Estimate transport cost based on distance."""
	# Rough estimates for Vietnam
	if distance_km < 5:
		return {
			"grab_bike": f"{int(distance_km * 10000)}k",
			"taxi": f"{int(distance_km * 25000)}k",
			"recommendation": "Grab bike (nhanh, rẻ)"
		}
	elif distance_km < 20:
		return {
			"grab_car": f"{int(distance_km * 15000)}k",
			"taxi": f"{int(distance_km * 20000)}k",
			"recommendation": "Grab car hoặc taxi"
		}
	else:
		return {
			"private_car": f"{int(distance_km * 30000)}k",
			"bus": f"{int(distance_km * 5000)}k",
			"recommendation": "Thuê xe riêng hoặc đi xe bus"
		}


async def route_builder(points: List[Dict[str, Any]]) -> Dict[str, Any]:
	"""
	Build routes between points using OSRM API.
	
	Args:
		points: List of points with 'name', 'lat', 'lng'
	
	Returns:
		Dict with routes list
	"""
	if len(points) < 2:
		logger.warning("[tool:route_builder] Need at least 2 points")
		return {"routes": []}
	
	logger.info("[tool:route_builder] building route for {} points", len(points))
	
	# Format coordinates for OSRM
	coords_str = _format_coords(points)
	if not coords_str:
		logger.error("[tool:route_builder] Invalid coordinates")
		return {"routes": []}
	
	# Call OSRM API
	osrm_url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}"
	params = {
		"overview": "full",
		"geometries": "polyline",
		"steps": "false"
	}
	
	try:
		async with httpx.AsyncClient(timeout=10.0) as client:
			resp = await client.get(osrm_url, params=params)
			resp.raise_for_status()
			data = resp.json()
			
			if data.get("code") != "Ok":
				logger.error("[tool:route_builder] OSRM error: {}", data.get("code"))
				return {"routes": []}
			
			routes_data = data.get("routes", [])
			if not routes_data:
				logger.warning("[tool:route_builder] No routes returned")
				return {"routes": []}
			
			# Build route segments between consecutive points
			routes = []
			route_data = routes_data[0]  # Take first route
			legs = route_data.get("legs", [])
			distance_total = route_data.get("distance", 0) / 1000  # Convert to km
			duration_total = route_data.get("duration", 0) / 60  # Convert to minutes
			polyline = route_data.get("geometry", "")
			
			# If we have legs, use them for individual segments
			if legs and len(legs) == len(points) - 1:
				for i, leg in enumerate(legs):
					from_point = points[i]
					to_point = points[i + 1]
					distance_km = leg.get("distance", 0) / 1000
					duration_min = leg.get("duration", 0) / 60
					
					transport = _estimate_transport_cost(distance_km)
					
					routes.append({
						"from": from_point.get("name", f"Point {i+1}"),
						"to": to_point.get("name", f"Point {i+1}"),
						"distance_km": round(distance_km, 2),
						"duration_minutes": round(duration_min, 1),
						"polyline": polyline,  # Use full route polyline
						"transport_suggestion": transport.get("recommendation", "Grab hoặc taxi")
					})
			else:
				# Single route from first to last point
				transport = _estimate_transport_cost(distance_total)
				routes.append({
					"from": points[0].get("name", "Start"),
					"to": points[-1].get("name", "End"),
					"distance_km": round(distance_total, 2),
					"duration_minutes": round(duration_total, 1),
					"polyline": polyline,
					"transport_suggestion": transport.get("recommendation", "Grab hoặc taxi")
				})
			
			logger.info("[tool:route_builder] built {} route segments", len(routes))
			return {"routes": routes}
			
	except httpx.HTTPError as e:
		logger.error("[tool:route_builder] HTTP error: {}", e)
		return {"routes": []}
	except Exception as e:
		logger.exception("[tool:route_builder] Exception: {}", e)
		return {"routes": []}


# For use as LangChain tool
from langchain_core.tools import tool
import json


@tool
async def route_builder_tool(points: str) -> Dict[str, Any]:
	"""
	Build routes between multiple points using OSRM routing API.
	
	Use this to calculate travel routes, distances, and durations between locations in an itinerary.
	
	Args:
		points: JSON string with array of points, each with 'name', 'lat', 'lng'
			Example: '[{"name": "Hotel", "lat": 16.0544, "lng": 108.2022}, {"name": "Attraction", "lat": 16.0084, "lng": 108.2618}]'
	
	Returns:
		Dict with routes list, each containing from, to, distance_km, duration_minutes, polyline, transport_suggestion
	"""
	try:
		if isinstance(points, str):
			points_list = json.loads(points)
		else:
			points_list = points
		
		if not isinstance(points_list, list):
			return {"routes": [], "error": "points must be a list"}
		
		return await route_builder(points_list)
	except json.JSONDecodeError as e:
		logger.error("[tool:route_builder] JSON decode error: {}", e)
		return {"routes": [], "error": "Invalid JSON format"}
	except Exception as e:
		logger.exception("[tool:route_builder] Exception: {}", e)
		return {"routes": [], "error": str(e)}



