from __future__ import annotations
from typing import Any, Dict
import httpx
from loguru import logger
from config import get_settings


async def _geocode_location(location: str) -> Dict[str, float] | None:
	params = {"q": f"{location}, Vietnam", "format": "json", "limit": 1}
	logger.info("[tool:weather] geocode q=\"{}\"", location)
	async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "viet-adventure-ai/1.0"}) as client:
		resp = await client.get("https://nominatim.openstreetmap.org/search", params=params)
		resp.raise_for_status()
		data = resp.json()
		if not data:
			logger.warning("[tool:weather] geocode empty q=\"{}\"", location)
			return None
		item = data[0]
		coords = {"lat": float(item["lat"]), "lon": float(item["lon"]) }
		logger.info("[tool:weather] geocode ok lat={} lon={}", coords["lat"], coords["lon"])
		return coords


async def _openmeteo_forecast(lat: float, lon: float) -> Dict[str, Any]:
	params = {
		"latitude": lat,
		"longitude": lon,
		"current": ["temperature_2m", "precipitation", "weather_code", "wind_speed_10m"],
		"hourly": ["temperature_2m"],
		"timezone": "Asia/Bangkok",
	}
	logger.info("[tool:weather] openmeteo lat={} lon={}", lat, lon)
	async with httpx.AsyncClient(timeout=8.0) as client:
		resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
		resp.raise_for_status()
		return resp.json()


async def _openweather_fallback(location: str) -> Dict[str, Any]:
	api_key = get_settings().openweather_api_key
	if not api_key:
		return {"error": "no_openweather_key"}
	logger.info("[tool:weather] openweather q=\"{}\"", location)
	async with httpx.AsyncClient(timeout=8.0) as client:
		resp = await client.get("https://api.openweathermap.org/data/2.5/weather", params={
			"q": f"{location},VN",
			"appid": api_key,
			"units": "metric",
			"lang": "vi",
		})
		resp.raise_for_status()
		data = resp.json()
		desc = data.get("weather", [{}])[0].get("description", "không rõ")
		temp = round(float(data.get("main", {}).get("temp", 0)))
		city = data.get("name") or location
		return {"forecast": f"Thời tiết tại {city} là {desc}, nhiệt độ khoảng {temp}°C.", "raw": data}


async def weather_lookup(location: str) -> Dict[str, Any]:
	try:
		geo = await _geocode_location(location)
		if not geo:
			return {"error": "weather_geocode_not_found"}
		om = await _openmeteo_forecast(geo["lat"], geo["lon"])
		cur = (om.get("current") or {})
		temp = cur.get("temperature_2m")
		prec = cur.get("precipitation")
		wind = cur.get("wind_speed_10m")
		city = location
		parts = []
		if temp is not None:
			parts.append(f"{round(float(temp))}°C")
		if prec is not None and float(prec) > 0:
			parts.append("có mưa")
		if wind is not None:
			parts.append(f"gió {round(float(wind))} km/h")
		forecast = f"Thời tiết tại {city}: " + ", ".join(parts) if parts else f"Thời tiết tại {city} chưa rõ."
		return {"forecast": forecast, "raw": om, "source": "open-meteo"}
	except httpx.HTTPError as e:
		logger.error("[tool:weather] http_error {}", e)
		ow = await _openweather_fallback(location)
		if "forecast" in ow:
			ow["source"] = "openweather"
		return ow
	except Exception as e:  # pragma: no cover
		logger.exception("[tool:weather] error {}", e)
		ow = await _openweather_fallback(location)
		if "forecast" in ow:
			ow["source"] = "openweather"
		return ow


