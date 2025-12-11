from __future__ import annotations
from typing import Any, Dict, List, Optional
import httpx
from loguru import logger
from config import get_settings


async def search_destinations(query: str, limit: int = 10) -> List[Dict[str, Any]]:
	"""Search destinations by query string."""
	settings = get_settings()
	url = f"{settings.backend_base_url}/api/destinations/search"
	# Use URL encoding for query parameter to handle special characters
	from urllib.parse import urlencode
	params = urlencode({"q": query, "limit": limit})
	full_url = f"{url}?{params}"
	logger.info("[backend] search_destinations q=\"{}\" limit={} url=\"{}\"", query, limit, full_url)
	try:
		async with httpx.AsyncClient(timeout=10.0) as client:
			resp = await client.get(full_url, headers={"Accept": "application/json"})
			resp.raise_for_status()
			# Check content type before parsing JSON
			content_type = resp.headers.get("content-type", "")
			if "application/json" not in content_type:
				logger.warning("[backend] search_destinations received non-JSON response: content-type={}", content_type)
				# Try to get text to see what we received
				try:
					text = resp.text[:200]
					logger.warning("[backend] search_destinations response preview: {}", text)
				except:
					pass
				return []
			data = resp.json()
			results = data.get("data", []) if isinstance(data, dict) else data
			logger.info("[backend] search_destinations found {} results", len(results) if isinstance(results, list) else 0)
			return results if isinstance(results, list) else []
	except httpx.HTTPError as e:
		logger.error("[backend] search_destinations error: {}", e)
		return []
	except Exception as e:
		logger.exception("[backend] search_destinations exception: {}", e)
		return []


async def get_destination(slug: str) -> Optional[Dict[str, Any]]:
	"""Get destination by slug or name."""
	settings = get_settings()
	# URL encode the slug to handle special characters
	from urllib.parse import quote
	encoded_slug = quote(slug, safe='')
	url = f"{settings.backend_base_url}/api/destinations/{encoded_slug}"
	logger.info("[backend] get_destination slug=\"{}\" encoded=\"{}\"", slug, encoded_slug)
	try:
		async with httpx.AsyncClient(timeout=10.0) as client:
			resp = await client.get(url)
			resp.raise_for_status()
			# Check content type before parsing JSON
			content_type = resp.headers.get("content-type", "")
			if "application/json" not in content_type:
				logger.warning("[backend] get_destination received non-JSON response: content-type={}", content_type)
				# Try to get text to see what we received
				try:
					text = resp.text[:200]
					logger.warning("[backend] get_destination response preview: {}", text)
				except:
					pass
				return None
			data = resp.json()
			result = data.get("data") if isinstance(data, dict) else data
			logger.info("[backend] get_destination found: {}", result is not None)
			return result if isinstance(result, dict) else None
	except httpx.HTTPError as e:
		logger.error("[backend] get_destination error: {}", e)
		return None
	except Exception as e:
		logger.exception("[backend] get_destination exception: {}", e)
		return None


async def search_tours(
	query: Optional[str] = None,
	destination: Optional[str] = None,
	page: int = 1,
	limit: int = 20
) -> Dict[str, Any]:
	"""Search tours with filters."""
	settings = get_settings()
	url = f"{settings.backend_base_url}/api/tours/search"
	# Use URL encoding for query parameters to handle special characters
	from urllib.parse import urlencode
	params: Dict[str, Any] = {"page": page, "limit": limit}
	if query:
		params["q"] = query
	if destination:
		params["destination"] = destination
	params_str = urlencode(params)
	full_url = f"{url}?{params_str}"
	logger.info("[backend] search_tours query=\"{}\" destination=\"{}\" url=\"{}\"", query, destination, full_url)
	try:
		async with httpx.AsyncClient(timeout=10.0) as client:
			resp = await client.get(full_url, headers={"Accept": "application/json"})
			resp.raise_for_status()
			# Check content type before parsing JSON
			content_type = resp.headers.get("content-type", "")
			if "application/json" not in content_type:
				logger.warning("[backend] search_tours received non-JSON response: content-type={}", content_type)
				# Try to get text to see what we received
				try:
					text = resp.text[:200]
					logger.warning("[backend] search_tours response preview: {}", text)
				except:
					pass
				return {"tours": [], "total": 0, "page": page, "limit": limit}
			data = resp.json()
			logger.info("[backend] search_tours found {} tours", len(data.get("tours", [])) if isinstance(data, dict) else 0)
			return data if isinstance(data, dict) else {"tours": [], "total": 0, "page": page, "limit": limit}
	except httpx.HTTPError as e:
		logger.error("[backend] search_tours error: {}", e)
		return {"tours": [], "total": 0, "page": page, "limit": limit}
	except Exception as e:
		logger.exception("[backend] search_tours exception: {}", e)
		return {"tours": [], "total": 0, "page": page, "limit": limit}


async def get_tour(tour_id: str) -> Optional[Dict[str, Any]]:
	"""Get tour by ID."""
	settings = get_settings()
	url = f"{settings.backend_base_url}/api/tours/{tour_id}"
	logger.info("[backend] get_tour id=\"{}\"", tour_id)
	try:
		async with httpx.AsyncClient(timeout=10.0) as client:
			resp = await client.get(url)
			resp.raise_for_status()
			data = resp.json()
			result = data.get("data") if isinstance(data, dict) else data
			logger.info("[backend] get_tour found: {}", result is not None)
			return result if isinstance(result, dict) else None
	except httpx.HTTPError as e:
		logger.error("[backend] get_tour error: {}", e)
		return None
	except Exception as e:
		logger.exception("[backend] get_tour exception: {}", e)
		return None


async def create_itinerary(itinerary_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
	"""Create itinerary via backend API."""
	settings = get_settings()
	url = f"{settings.backend_base_url}/api/itineraries"
	logger.info("[backend] create_itinerary")
	try:
		async with httpx.AsyncClient(timeout=15.0) as client:
			resp = await client.post(url, json=itinerary_data)
			resp.raise_for_status()
			data = resp.json()
			result = data.get("data") if isinstance(data, dict) else data
			itinerary_id = result.get("_id") if isinstance(result, dict) else None
			logger.info("[backend] create_itinerary success id=\"{}\"", itinerary_id)
			return result if isinstance(result, dict) else None
	except httpx.HTTPError as e:
		logger.error("[backend] create_itinerary error: {}", e)
		return None
	except Exception as e:
		logger.exception("[backend] create_itinerary exception: {}", e)
		return None


async def update_itinerary(itinerary_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
	"""Update itinerary via backend API."""
	settings = get_settings()
	url = f"{settings.backend_base_url}/api/itineraries/{itinerary_id}"
	logger.info("[backend] update_itinerary id=\"{}\"", itinerary_id)
	try:
		async with httpx.AsyncClient(timeout=15.0) as client:
			resp = await client.patch(url, json=updates)
			resp.raise_for_status()
			data = resp.json()
			result = data.get("data") if isinstance(data, dict) else data
			logger.info("[backend] update_itinerary success")
			return result if isinstance(result, dict) else None
	except httpx.HTTPError as e:
		logger.error("[backend] update_itinerary error: {}", e)
		return None
	except Exception as e:
		logger.exception("[backend] update_itinerary exception: {}", e)
		return None

