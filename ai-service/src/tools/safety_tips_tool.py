from __future__ import annotations
from typing import Any, Dict, List
from loguru import logger
from tools.search import web_search_tavily


# Emergency contacts for Vietnam
VIETNAM_EMERGENCY_CONTACTS = {
	"police": "113",
	"ambulance": "115",
	"fire": "114",
	"tourist_hotline": "1900 2108"
}


def _extract_safety_tips_from_search(search_results: Dict[str, Any], destination: str, activities: List[str]) -> List[str]:
	"""Extract and summarize safety tips from search results."""
	tips = []
	results = search_results.get("results", [])
	
	if not results:
		return tips
	
	# Common safety keywords to look for
	safety_keywords = [
		"scam", "lừa đảo", "cẩn thận", "an toàn", "safety", "warning", "cảnh báo",
		"taxi", "grab", "giá", "price", "tiền", "money", "tiền mặt", "cash",
		"bãi biển", "beach", "bơi", "swim", "nước", "water",
		"ăn uống", "food", "thức ăn", "hải sản", "seafood",
		"đêm", "night", "tối", "khuya"
	]
	
	# Collect snippets that mention safety
	safety_snippets = []
	for result in results[:5]:  # Check top 5 results
		snippet = result.get("snippet", "") or result.get("content", "") or ""
		title = result.get("title", "")
		combined = f"{title} {snippet}".lower()
		
		# Check if snippet contains safety-related keywords
		if any(keyword in combined for keyword in safety_keywords):
			safety_snippets.append(snippet)
	
	# Generate tips from snippets
	if safety_snippets:
		# Common tips based on activities
		if "beach" in " ".join(activities).lower() or "bãi biển" in " ".join(activities).lower():
			tips.append("Bãi biển: Không bơi khi có cờ đỏ, thuê phao cứu sinh khi cần")
		
		if "ăn uống" in " ".join(activities).lower() or "food" in " ".join(activities).lower():
			tips.append("Ẩm thực: Hỏi giá trước khi order, tránh quán không niêm yết giá")
		
		# General tips from search results
		if any("taxi" in s.lower() or "grab" in s.lower() for s in safety_snippets):
			tips.append("Di chuyển: Chỉ dùng Grab hoặc taxi có đồng hồ, tránh taxi dù")
		
		if any("giá" in s.lower() or "price" in s.lower() or "tiền" in s.lower() for s in safety_snippets):
			tips.append("Giá cả: Luôn hỏi giá trước khi mua, đặc biệt là hải sản và đồ lưu niệm")
		
		if any("đêm" in s.lower() or "night" in s.lower() or "tối" in s.lower() for s in safety_snippets):
			tips.append("An toàn ban đêm: Tránh đi một mình vào khuya, giữ đồ có giá trị cẩn thận")
	
	# Add default tips if we don't have enough
	default_tips = [
		f"Khi đến {destination}: Luôn giữ bản sao passport và tiền mặt ở nơi an toàn",
		"Di chuyển: Ưu tiên dùng Grab hoặc taxi có đồng hồ, tránh taxi dù",
		"Giá cả: Hỏi giá trước khi mua, đặc biệt là hải sản và đồ lưu niệm",
		"An toàn: Giữ đồ có giá trị cẩn thận, không để lộ tiền mặt"
	]
	
	# Merge and deduplicate
	all_tips = tips + default_tips
	unique_tips = []
	seen = set()
	for tip in all_tips:
		tip_lower = tip.lower()
		if tip_lower not in seen:
			seen.add(tip_lower)
			unique_tips.append(tip)
	
	# Return top 5-7 tips
	return unique_tips[:7]


async def safety_tips_generator(destination: str, activities: List[str] | None = None) -> Dict[str, Any]:
	"""
	Generate safety tips for a destination based on web search.
	
	Args:
		destination: Destination name
		activities: List of planned activities
	
	Returns:
		Dict with safety_tips and emergency_contacts
	"""
	activities = activities or []
	logger.info(
		"[tool:safety_tips] destination=\"{}\" activities={}",
		destination, activities
	)
	
	# Build search query
	query_parts = [f"an toàn {destination}", "safety tips", "lưu ý"]
	if activities:
		activity_keywords = " ".join(activities[:3])  # Use first 3 activities
		query_parts.append(activity_keywords)
	
	query = " ".join(query_parts)
	
	# Search for safety information
	search_results = web_search_tavily(query, max_results=5)
	
	# Extract tips
	tips = _extract_safety_tips_from_search(search_results, destination, activities)
	
	# Add activity-specific tips
	if "beach" in " ".join(activities).lower() or "bãi biển" in " ".join(activities).lower():
		if not any("bãi biển" in tip.lower() or "beach" in tip.lower() for tip in tips):
			tips.insert(0, "Bãi biển: Không bơi khi có cờ đỏ, thuê phao cứu sinh 50k/ngày")
	
	if "trekking" in " ".join(activities).lower() or "leo núi" in " ".join(activities).lower():
		tips.insert(0, "Trekking: Mang giày thể thao, nước uống, và báo cho người thân về lịch trình")
	
	if "ăn uống" in " ".join(activities).lower() or "food" in " ".join(activities).lower():
		if not any("giá" in tip.lower() or "price" in tip.lower() for tip in tips):
			tips.insert(0, "Ẩm thực: Hỏi giá trước khi order, tránh quán không niêm yết giá")
	
	# Limit to 7 tips
	tips = tips[:7]
	
	logger.info("[tool:safety_tips] generated {} tips", len(tips))
	
	return {
		"safety_tips": tips,
		"emergency_contacts": VIETNAM_EMERGENCY_CONTACTS
	}


# For use as LangChain tool
from langchain_core.tools import tool


@tool
async def safety_tips_tool(
	destination: str,
	activities: str | None = None
) -> Dict[str, Any]:
	"""
	Generate safety tips and emergency contacts for a destination.
	
	Use this to provide important safety information for travelers.
	
	Args:
		destination: Destination name (e.g., "Da Nang", "Hoi An")
		activities: Comma-separated list of planned activities (optional)
	
	Returns:
		Dict with safety_tips list and emergency_contacts dict
	"""
	activities_list = []
	if activities:
		activities_list = [a.strip() for a in activities.split(",")] if isinstance(activities, str) else activities
	
	return await safety_tips_generator(destination, activities_list)



