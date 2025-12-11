from __future__ import annotations
from typing import Dict, Any, List
from loguru import logger
from agents.itinerary_planner.state import ItineraryPlannerState
from agents.itinerary_planner.utils import parse_dates, extract_json_from_text
from config import get_settings
from langchain_openai import ChatOpenAI
from clients.backend import get_tour
from prompts.itinerary_planner import itinerary_generator_prompt
from datetime import timedelta
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed
from google.api_core.exceptions import ResourceExhausted


@retry(
	retry=retry_if_exception_type(ResourceExhausted),
	stop=stop_after_attempt(5),
	wait=wait_fixed(3)
)
async def _invoke_llm(llm: ChatOpenAI, prompt: str) -> str:
	"""Invoke LLM with retry logic."""
	response = await llm.ainvoke(prompt)
	return response.content


async def itinerary_generator_node(state: ItineraryPlannerState) -> Dict[str, Any]:
	"""Generate daily itinerary."""
	user_inputs = state.get("user_inputs", {})
	destination_info = state.get("destination_info", {})
	tour_selection = state.get("tour_selection", "create_new")
	selected_tour_id = state.get("selected_tour_id")
	
	destination = user_inputs.get("destination", "")
	start_date = user_inputs.get("startDate", "")
	end_date = user_inputs.get("endDate", "")
	style = user_inputs.get("style", "")
	interests = user_inputs.get("interests", [])
	
	logger.info(
		"[node:itinerary_generator] destination=\"{}\" tour_selection=\"{}\"",
		destination, tour_selection
	)
	
	# Validate inputs
	if not destination or not start_date or not end_date:
		logger.error("[node:itinerary_generator] Missing required inputs")
		return {"daily_itinerary": []}
	
	# Calculate number of days
	_, _, num_days = parse_dates(start_date, end_date)
	
	# If using existing tour, extract itinerary from tour
	if tour_selection == "use_existing" and selected_tour_id:
		try:
			tour_doc = await get_tour(selected_tour_id)
			if tour_doc and tour_doc.get("itinerary"):
				daily_plan = _convert_tour_itinerary_to_daily_plan(
					tour_doc.get("itinerary", []),
					start_date,
					num_days
				)
				logger.info("[node:itinerary_generator] using tour itinerary, {} days", len(daily_plan))
				return {"daily_itinerary": daily_plan}
		except Exception as e:
			logger.warning("[node:itinerary_generator] Failed to load tour, generating new: {}", e)
	
	# Generate new itinerary using Gemini
	settings = get_settings()
	if not settings.megallm_api_key:
		logger.error("[node:itinerary_generator] No MegaLLM API key configured")
		return {"daily_itinerary": []}
	
	# Build prompt from prompts file
	prompt = itinerary_generator_prompt(
		destination=destination,
		destination_info=destination_info,
		num_days=num_days,
		start_date=start_date,
		end_date=end_date,
		style=style,
		interests=interests if isinstance(interests, list) else []
	)
	
	try:
		llm = ChatOpenAI(
			model="qwen/qwen3-next-80b-a3b-instruct",
			api_key=settings.megallm_api_key,
			base_url=settings.megallm_base_url,
			temperature=0.2,
			timeout=60.0 # Longer timeout for itinerary gen
		)
		
		text = await _invoke_llm(llm, prompt)
		
		# Extract JSON from response
		plan_data = extract_json_from_text(text)
		if not plan_data:
			logger.error("[node:itinerary_generator] No valid JSON found in response")
			return {"daily_itinerary": []}
		
		days = plan_data.get("days", [])
		if not days:
			logger.warning("[node:itinerary_generator] Empty days array in response")
			return {"daily_itinerary": []}
		
		# Convert to daily_itinerary format
		daily_plan = []
		for day_data in days:
			daily_plan.append({
				"day": day_data.get("day", 0),
				"date": day_data.get("date", ""),
				"morning": day_data.get("morning", {}),
				"afternoon": day_data.get("afternoon", {}),
				"evening": day_data.get("evening", {})
			})
		
		logger.info("[node:itinerary_generator] generated {} days successfully", len(daily_plan))
		return {"daily_itinerary": daily_plan}
			
	except Exception as e:
		logger.exception("[node:itinerary_generator] Error generating itinerary: {}", e)
		return {"daily_itinerary": []}


def _convert_tour_itinerary_to_daily_plan(
	tour_itinerary: List[Dict[str, Any]],
	start_date: str,
	num_days: int
) -> List[Dict[str, Any]]:
	"""Convert tour itinerary format to daily plan format."""
	from datetime import datetime
	
	daily_plan = []
	start, _, _ = parse_dates(start_date, start_date)
	
	for i, day_item in enumerate(tour_itinerary[:num_days]):
		day_num = day_item.get("day", i + 1)
		current_date = (start + timedelta(days=i)).strftime("%Y-%m-%d")
		title = day_item.get("title", f"Ngày {day_num}")
		description = day_item.get("description", "")
		
		# Split description into morning/afternoon/evening (simplified)
		daily_plan.append({
			"day": day_num,
			"date": current_date,
			"morning": {
				"time": "08:00 - 11:30",
				"activity": f"{title} - Buổi sáng",
				"location": "",
				"duration": "3.5 giờ",
				"cost": 0,
				"tips": description[:100] if description else ""
			},
			"afternoon": {
				"time": "13:00 - 17:00",
				"activity": f"{title} - Buổi chiều",
				"location": "",
				"duration": "4 giờ",
				"cost": 0,
				"tips": ""
			},
			"evening": {
				"time": "18:00 - 21:00",
				"activity": f"{title} - Buổi tối",
				"location": "",
				"duration": "3 giờ",
				"cost": 0,
				"tips": ""
			}
		})
	
	return daily_plan

