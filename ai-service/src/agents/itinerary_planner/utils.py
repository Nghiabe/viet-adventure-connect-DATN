"""
Utility functions for itinerary planner agent.
"""
from __future__ import annotations
from typing import Dict, Any
from datetime import datetime, timedelta
from loguru import logger


def parse_dates(start_date: str, end_date: str) -> tuple[datetime, datetime, int]:
	"""
	Parse start and end dates, calculate number of days.
	
	Args:
		start_date: Start date string (YYYY-MM-DD)
		end_date: End date string (YYYY-MM-DD)
	
	Returns:
		Tuple of (start_datetime, end_datetime, num_days)
	"""
	try:
		start = datetime.strptime(start_date, "%Y-%m-%d")
		end = datetime.strptime(end_date, "%Y-%m-%d")
		num_days = (end - start).days
		if num_days <= 0:
			num_days = 1
		return start, end, num_days
	except Exception as e:
		logger.warning("[utils] Failed to parse dates: start={} end={} error={}", start_date, end_date, e)
		# Fallback to today + 1 day
		start = datetime.now()
		end = start + timedelta(days=1)
		return start, end, 1


def map_budget_level(budget: str | None) -> tuple[float | None, str | None]:
	"""
	Map budget string to numeric value and level.
	
	Args:
		budget: Budget string ("budget", "mid-range", "luxury")
	
	Returns:
		Tuple of (budget_per_person_vnd, budget_level)
	"""
	if not budget:
		return None, None
	
	budget_lower = budget.lower()
	budget_map = {
		"budget": (2000000, "budget"),  # < 2M/person
		"mid-range": (3500000, "mid-range"),  # 2-5M/person
		"luxury": (6000000, "luxury")  # > 5M/person
	}
	
	return budget_map.get(budget_lower, (None, None))


def calculate_nights(start_date: str, end_date: str) -> int:
	"""
	Calculate number of nights from check-in to check-out.
	
	Args:
		start_date: Check-in date (YYYY-MM-DD)
		end_date: Check-out date (YYYY-MM-DD)
	
	Returns:
		Number of nights
	"""
	try:
		checkin = datetime.strptime(start_date, "%Y-%m-%d")
		checkout = datetime.strptime(end_date, "%Y-%m-%d")
		nights = (checkout - checkin).days
		return max(1, nights)
	except Exception as e:
		logger.warning("[utils] Failed to calculate nights: start={} end={} error={}", start_date, end_date, e)
		return 1


def extract_json_from_text(text: str) -> Dict[str, Any] | List[Any] | None:
	"""
	Extract JSON object or array from text response.
	
	Args:
		text: Text that may contain JSON
	
	Returns:
		Parsed JSON dict/list or None if not found
	"""
	import json
	import re
	
	# Clean up markdown code blocks if present
	text = re.sub(r'```json\s*', '', text)
	text = re.sub(r'```\s*', '', text)
	
	# Try to find JSON object or array
	# Look for first { or [
	match = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', text)
	if match:
		try:
			json_str = match.group(0)
			return json.loads(json_str)
		except json.JSONDecodeError as e:
			logger.warning("[utils] Failed to parse JSON: {}", e)
			# Try a more lenient approach if strict parsing fails
			# Sometimes there is extra text after the closing brace/bracket
			try:
				# Find the last valid closing character corresponding to start
				char_map = {'{': '}', '[': ']'}
				start_char = json_str[0]
				end_char = char_map.get(start_char)
				if end_char:
					last_idx = json_str.rfind(end_char)
					if last_idx != -1:
						json_str_trimmed = json_str[:last_idx+1]
						return json.loads(json_str_trimmed)
			except:
				pass
			return None
	
	return None



