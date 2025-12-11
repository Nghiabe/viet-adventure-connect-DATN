from __future__ import annotations
from typing import Any, Dict
from langchain_core.tools import tool
from tools.search import web_search_tavily as _web_search
from tools.weather import weather_lookup as _weather_lookup


@tool
def web_search(query: str, max_results: int = 3) -> Dict[str, Any]:
	"""
	Web search tool (Firecrawl-based) for retrieving up-to-date, citeable sources.

	Purpose:
	- Execute a web search for travel-related queries (e.g., điểm đến, ẩm thực, lịch trình, di chuyển, giá vé).
	- Provide structured results for citation: title, snippet, url, provider.

	Parameters:
	- query: Natural language search string in Vietnamese or English.
	- max_results: Upper bound of results to return (capped internally at 3).

	Returns (dict):
	- { "results": [ { "type": "web", "title": str, "snippet": str, "url": str, "image": str, "provider": "firecrawl" } ],
	    "error"?: str }

	Usage policy for the assistant:
	- ALWAYS call this tool before answering factual travel questions, then cite URLs in the answer.
	"""
	return _web_search(query=query, max_results=max_results)


@tool
async def weather_lookup(location: str) -> Dict[str, Any]:
	"""
	Weather lookup tool for Vietnam locations using Open-Meteo with OpenWeather fallback.

	Purpose:
	- Retrieve current weather summary for a given location (city/province/region) in Vietnam.
	- Provide a concise, user-facing forecast string and the provider source for citation.

	Parameters:
	- location: Human-readable place name (e.g., "Đà Nẵng", "Hội An").

	Returns (dict):
	- { "forecast": str, "source": "open-meteo" | "openweather", "raw"?: object, "error"?: str }

	Usage policy for the assistant:
	- When user intent involves weather, call this tool and cite the "source" in the answer as [source].
	"""
	return await _weather_lookup(location)


