from __future__ import annotations
from typing import Any, Dict, List
from loguru import logger


def _extract_cost_from_activity(activity: Dict[str, Any]) -> float:
	"""Extract cost from activity dict."""
	cost = activity.get("cost") or activity.get("estimated_cost") or activity.get("price")
	if cost is None:
		return 0.0
	try:
		return float(cost)
	except (ValueError, TypeError):
		return 0.0


def _calculate_activities_cost(daily_activities: List[Dict[str, Any]]) -> float:
	"""Calculate total cost from activities."""
	total = 0.0
	for day in daily_activities:
		if isinstance(day, dict):
			# Check for morning/afternoon/evening structure
			for period in ["morning", "afternoon", "evening"]:
				period_data = day.get(period)
				if isinstance(period_data, dict):
					total += _extract_cost_from_activity(period_data)
			# Also check for activities array
			activities = day.get("activities", [])
			if isinstance(activities, list):
				for activity in activities:
					if isinstance(activity, dict):
						total += _extract_cost_from_activity(activity)
	return total


def _calculate_hotels_cost(hotels: List[Dict[str, Any]]) -> float:
	"""Calculate total cost from hotels."""
	if not hotels:
		return 0.0
	
	# Use the first (selected) hotel's total_price
	selected_hotel = hotels[0] if hotels else None
	if selected_hotel:
		total_price = selected_hotel.get("total_price")
		if total_price is not None:
			try:
				return float(total_price)
			except (ValueError, TypeError):
				pass
		
		# Fallback: calculate from price_per_night
		price_per_night = selected_hotel.get("price_per_night")
		nights = selected_hotel.get("nights", 1)
		if price_per_night is not None:
			try:
				return float(price_per_night) * float(nights)
			except (ValueError, TypeError):
				pass
	
	return 0.0


def _calculate_transport_cost(transportation: Dict[str, Any] | None) -> float:
	"""Calculate total transport cost."""
	if not transportation:
		return 0.0
	
	costs = transportation.get("costs", {})
	if isinstance(costs, dict):
		total = 0.0
		for key, value in costs.items():
			try:
				total += float(value)
			except (ValueError, TypeError):
				pass
		return total
	
	return 0.0


def _estimate_meals_cost(num_days: int, num_people: int) -> float:
	"""Estimate meals cost: 300k VND per person per day."""
	return float(num_days * num_people * 300000)


def _generate_savings_suggestions(
	breakdown: Dict[str, float],
	total: float,
	user_budget: float | None
) -> List[str]:
	"""Generate suggestions to save money."""
	suggestions = []
	
	if not user_budget or total <= user_budget:
		return suggestions
	
	# Check each category
	accommodation = breakdown.get("accommodation", 0)
	activities = breakdown.get("activities", 0)
	food = breakdown.get("food", 0)
	transport = breakdown.get("transport", 0)
	
	if accommodation > user_budget * 0.5:
		suggestions.append("Có thể chọn homestay thay vì resort để tiết kiệm khoảng 30-40% chi phí lưu trú")
	
	if activities > user_budget * 0.3:
		suggestions.append("Có thể giảm số lượng hoạt động có phí, thay bằng tham quan miễn phí")
	
	if food > user_budget * 0.25:
		suggestions.append("Có thể ăn ở quán địa phương thay vì nhà hàng để tiết kiệm 20-30% chi phí ăn uống")
	
	if transport > user_budget * 0.15:
		suggestions.append("Có thể dùng xe bus công cộng thay vì taxi để tiết kiệm chi phí di chuyển")
	
	if not suggestions:
		suggestions.append("Có thể giảm số ngày hoặc chọn mùa thấp điểm để tiết kiệm chi phí")
	
	return suggestions


async def budget_calculator(
	daily_activities: List[Dict[str, Any]] | None = None,
	hotels: List[Dict[str, Any]] | None = None,
	transportation: Dict[str, Any] | None = None,
	meals: Dict[str, Any] | None = None,
	user_budget: float | None = None,
	num_days: int = 1,
	num_people: int = 1
) -> Dict[str, Any]:
	"""
	Calculate total budget breakdown for an itinerary.
	
	Args:
		daily_activities: List of daily activities with costs
		hotels: List of hotels (first one is selected)
		transportation: Transportation data with costs
		meals: Meals data (optional, will estimate if not provided)
		user_budget: User's budget constraint in VND
		num_days: Number of days
		num_people: Number of people
	
	Returns:
		Dict with total_estimated, breakdown, per_person, contingency, within_budget, savings_suggestions
	"""
	logger.info(
		"[tool:budget_calculator] num_days={} num_people={} user_budget={}",
		num_days, num_people, user_budget
	)
	
	daily_activities = daily_activities or []
	hotels = hotels or []
	
	# Calculate costs by category
	accommodation = _calculate_hotels_cost(hotels)
	activities = _calculate_activities_cost(daily_activities)
	transport = _calculate_transport_cost(transportation)
	
	# Meals: use provided or estimate
	if meals and isinstance(meals, dict) and "total" in meals:
		food = float(meals.get("total", 0))
	else:
		food = _estimate_meals_cost(num_days, num_people)
	
	# Other costs (miscellaneous)
	other = 0.0
	
	# Total
	total = accommodation + activities + food + transport + other
	
	# Breakdown
	breakdown = {
		"accommodation": round(accommodation, 0),
		"activities": round(activities, 0),
		"food": round(food, 0),
		"transport": round(transport, 0),
		"other": round(other, 0)
	}
	
	# Per person
	per_person = round(total / num_people, 0) if num_people > 0 else total
	
	# Contingency (15%)
	contingency = round(total * 0.15, 0)
	
	# Check within budget
	within_budget = True
	if user_budget:
		within_budget = (total + contingency) <= user_budget
	
	# Savings suggestions
	savings_suggestions = []
	if not within_budget and user_budget:
		savings_suggestions = _generate_savings_suggestions(breakdown, total, user_budget)
	
	logger.info(
		"[tool:budget_calculator] total={} per_person={} within_budget={}",
		total, per_person, within_budget
	)
	
	return {
		"total_estimated": round(total, 0),
		"breakdown": breakdown,
		"per_person": per_person,
		"contingency": contingency,
		"within_budget": within_budget,
		"savings_suggestions": savings_suggestions
	}


# For use as LangChain tool
from langchain_core.tools import tool
import json


@tool
async def budget_calculator_tool(
	daily_activities: str | None = None,
	hotels: str | None = None,
	transportation: str | None = None,
	meals: str | None = None,
	user_budget: float | None = None,
	num_days: int = 1,
	num_people: int = 1
) -> Dict[str, Any]:
	"""
	Calculate total budget breakdown for an itinerary.
	
	Use this to summarize costs and check if itinerary fits within user's budget.
	
	Args:
		daily_activities: JSON string with list of daily activities (optional)
		hotels: JSON string with list of hotels (optional)
		transportation: JSON string with transportation data (optional)
		meals: JSON string with meals data (optional)
		user_budget: User's budget in VND (optional)
		num_days: Number of days (default: 1)
		num_people: Number of people (default: 1)
	
	Returns:
		Dict with total_estimated, breakdown, per_person, contingency, within_budget, savings_suggestions
	"""
	try:
		activities_list = None
		if daily_activities:
			activities_list = json.loads(daily_activities) if isinstance(daily_activities, str) else daily_activities
		
		hotels_list = None
		if hotels:
			hotels_list = json.loads(hotels) if isinstance(hotels, str) else hotels
		
		transport_dict = None
		if transportation:
			transport_dict = json.loads(transportation) if isinstance(transportation, str) else transportation
		
		meals_dict = None
		if meals:
			meals_dict = json.loads(meals) if isinstance(meals, str) else meals
		
		return await budget_calculator(
			daily_activities=activities_list,
			hotels=hotels_list,
			transportation=transport_dict,
			meals=meals_dict,
			user_budget=user_budget,
			num_days=num_days,
			num_people=num_people
		)
	except json.JSONDecodeError as e:
		logger.error("[tool:budget_calculator] JSON decode error: {}", e)
		return {
			"total_estimated": 0,
			"breakdown": {},
			"per_person": 0,
			"contingency": 0,
			"within_budget": True,
			"savings_suggestions": [],
			"error": "Invalid JSON format"
		}
	except Exception as e:
		logger.exception("[tool:budget_calculator] Exception: {}", e)
		return {
			"total_estimated": 0,
			"breakdown": {},
			"per_person": 0,
			"contingency": 0,
			"within_budget": True,
			"savings_suggestions": [],
			"error": str(e)
		}



