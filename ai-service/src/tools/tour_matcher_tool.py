from __future__ import annotations
from typing import Any, Dict, List
from loguru import logger
from langchain_openai import ChatOpenAI
from config import get_settings
from agents.itinerary_planner.utils import extract_json_from_text
from prompts.tour_matcher import tour_matcher_prompt
from tenacity import AsyncRetrying, retry, retry_if_exception_type, stop_after_attempt, wait_fixed
from google.api_core.exceptions import ResourceExhausted

def _calculate_match_score(
	tour: Dict[str, Any],
	destination_id: str | None,
	budget_per_person: float | None,
	style: str | None,
	interests: List[str]
) -> float:
	"""Calculate match score for a tour (0.0 to 1.0)."""
	score = 0.0
	
	# Destination match (40%)
	if destination_id:
		tour_dest = str(tour.get("destination", ""))
		if tour_dest == destination_id:
			score += 0.4
		elif tour.get("destinations"):
			# Check multi-destinations
			for dest_item in tour.get("destinations", []):
				if str(dest_item.get("destinationId", "")) == destination_id:
					score += 0.4
					break
	
	# Budget fit (20%)
	if budget_per_person and tour.get("price"):
		tour_price = float(tour.get("price", 0))
		# Within 20% of budget = full score, within 50% = half score
		if tour_price <= budget_per_person * 1.2:
			score += 0.2
		elif tour_price <= budget_per_person * 1.5:
			score += 0.1
	
	# Style/interest match (20%)
	if style or interests:
		tour_title = (tour.get("title") or "").lower()
		tour_desc = (tour.get("description") or "").lower()
		combined_text = f"{tour_title} {tour_desc}"
		
		# Check style keywords
		if style:
			style_keywords = {
				"adventure": ["adventure", "trekking", "hiking", "explore", "outdoor"],
				"cultural": ["cultural", "history", "heritage", "tradition", "temple"],
				"culinary": ["culinary", "food", "cooking", "cuisine", "restaurant"],
				"photography": ["photography", "scenic", "view", "landscape", "sunset"]
			}
			keywords = style_keywords.get(style.lower(), [])
			if any(kw in combined_text for kw in keywords):
				score += 0.1
		
		# Check interests
		if interests:
			matched_interests = sum(1 for interest in interests if interest.lower() in combined_text)
			if matched_interests > 0:
				score += min(0.1, (matched_interests / len(interests)) * 0.1)
	
	# Date availability (20% - simplified, assume available if no booking conflicts)
	# For now, give full score if tour is published
	if tour.get("status") == "published":
		score += 0.2
	
	return min(1.0, score)


def _generate_fit_reason(tour: Dict[str, Any], score: float, budget_per_person: float | None) -> str:
	"""Generate human-readable reason why tour fits."""
	reasons = []
	
	if score >= 0.4:
		reasons.append("Điểm đến phù hợp")
	
	if budget_per_person and tour.get("price"):
		tour_price = float(tour.get("price", 0))
		if tour_price <= budget_per_person * 1.2:
			reasons.append("Ngân sách phù hợp")
		elif tour_price <= budget_per_person * 1.5:
			reasons.append("Ngân sách gần phù hợp")
	
	if tour.get("status") == "published":
		reasons.append("Tour đang có sẵn")
	
	if not reasons:
		return "Có một số điểm phù hợp với yêu cầu"
	
	return ", ".join(reasons)





async def _normalize_tours_with_llm(
	web_results: List[Dict[str, Any]], 
	destination: str,
	budget_per_person: float | None = None
) -> List[Dict[str, Any]]:
	"""Use LLM to normalize web search results into structured Tour objects.
	
	Tries MegaLLM first, falls back to OpenRouter if timeout/error.
	"""
	settings = get_settings()
	prompt = tour_matcher_prompt(destination, web_results, budget_per_person)
	
	# Helper to invoke LLM and extract tours
	async def invoke_llm(llm, provider_name: str) -> List[Dict[str, Any]]:
		logger.info(f"[tool:tour_matcher] Invoking {provider_name} LLM...")
		response = await llm.ainvoke(prompt)
		content = response.content
		
		tours = extract_json_from_text(content)
		if not tours or not isinstance(tours, list):
			logger.warning(f"[tool:tour_matcher] {provider_name} returned invalid JSON")
			if isinstance(tours, dict) and "tours" in tours:
				return tours["tours"]
			return []
		
		logger.info(f"[tool:tour_matcher] {provider_name} normalized {len(tours)} tours")
		return tours
	
	# Try MegaLLM first
	if settings.megallm_api_key:
		try:
			llm_mega = ChatOpenAI(
				model="qwen/qwen3-next-80b-a3b-instruct",
				api_key=settings.megallm_api_key,
				base_url=settings.megallm_base_url,
				temperature=0.1,
				timeout=1.0,  # Increased timeout
				max_retries=1
			)
			return await invoke_llm(llm_mega, "MegaLLM")
		except Exception as e:
			logger.warning("[tool:tour_matcher] MegaLLM failed: {} - trying OpenRouter fallback", str(e)[:100])
	
	# Fallback to OpenRouter
	if settings.openrouter_api_key:
		try:
			llm_openrouter = ChatOpenAI(
				model=settings.openrouter_model,
				api_key=settings.openrouter_api_key,
				base_url=settings.openrouter_base_url,
				temperature=0.1,
				timeout=60.0,
				max_retries=2,
				default_headers={
					"HTTP-Referer": "https://viet-adventure.com",
					"X-Title": "VietAdventure AI Planner"
				}
			)
			return await invoke_llm(llm_openrouter, "OpenRouter")
		except Exception as e:
			logger.exception("[tool:tour_matcher] OpenRouter fallback failed: {}", e)
	
	logger.warning("[tool:tour_matcher] All LLM providers failed")
	return []


async def tour_matcher(
	destination: str,
	dates: Dict[str, str] | None = None,
	budget_per_person: float | None = None,
	style: str | None = None,
	interests: List[str] | None = None
) -> Dict[str, Any]:
	"""
	Match tours from database and web search.
	
	Flow:
	1. Query MongoDB for existing tours in destination
	2. Web search for additional tours
	3. LLM normalize web results
	4. Upsert new tours to MongoDB (dedupe by URL)
	5. Merge and return all tours
	
	Args:
		destination: Destination name
		dates: Dict with 'start' and 'end' dates (optional)
		budget_per_person: Budget per person in VND
		style: Travel style (adventure, cultural, culinary, photography)
		interests: List of interests
	
	Returns:
		Dict with matched_tours and recommendation
	"""
	logger.info(
		"[tool:tour_matcher] destination=\"{}\" budget={} style=\"{}\" interests={}",
		destination, budget_per_person, style, interests
	)
	
	interests = interests or []
	all_tours: List[Dict[str, Any]] = []
	
	# ========== STEP 1: Query MongoDB ==========
	try:
		from db.tour_repository import TourRepository
		
		# Map style to category
		style_to_category = {
			"adventure": "phieu_luu",
			"cultural": "van_hoa",
			"culinary": "am_thuc",
			"photography": "tham_quan"
		}
		category = style_to_category.get(style.lower(), None) if style else None
		
		db_tours = await TourRepository.search(
			location=destination,
			category=category,
			limit=10
		)
		
		if db_tours:
			logger.info("[tool:tour_matcher] Found {} tours in database", len(db_tours))
			for db_tour in db_tours:
				all_tours.append({
					"_id": db_tour.get("_id", ""),
					"title": db_tour.get("title", ""),
					"description": db_tour.get("description", ""),
					"price": db_tour.get("price", 0),
					"duration": db_tour.get("duration", ""),
					"match_score": db_tour.get("match_score", 0.8),  # DB tours get high score
					"route": db_tour.get("route", ""),
					"highlights": db_tour.get("highlights", []),
					"schedule": db_tour.get("schedule", {}),
					"includes": db_tour.get("inclusions", []),
					"excludes": db_tour.get("exclusions", []),
					"tips": db_tour.get("tips", ""),
					"category": db_tour.get("category", "tham_quan"),
					"images": db_tour.get("images", []),
					"url": db_tour.get("source_url", ""),
					"source": "database"
				})
	except Exception as e:
		logger.warning("[tool:tour_matcher] DB query failed: {}", e)
	
	# ========== STEP 2: Web Search ==========
	web_tours: List[Dict[str, Any]] = []
	try:
		from tools.search import web_search_tavily
		
		# Vietnamese search query for better local results
		search_query = f"tour du lịch {destination} Việt Nam trải nghiệm"
		if style:
			style_vn = {
				"adventure": "mạo hiểm khám phá",
				"cultural": "văn hóa lịch sử",
				"culinary": "ẩm thực ăn uống",
				"photography": "chụp ảnh cảnh đẹp"
			}
			search_query += f" {style_vn.get(style.lower(), style)}"
		if interests:
			search_query += f" {' '.join(interests[:2])}"
		
		web_results = web_search_tavily(search_query, max_results=12)
		raw_results = web_results.get("results", [])
		logger.info("[tool:tour_matcher] Web search: '{}' - {} results", 
			search_query[:40], len(raw_results))
		
		if raw_results:
			# Use LLM to normalize results
			web_tours = await _normalize_tours_with_llm(
				raw_results, 
				destination,
				budget_per_person
			)
			
			# POST-PROCESS: Map URLs from original web_results (LLM may skip URL field)
			if web_tours:
				logger.info("[tool:tour_matcher] LLM returned {} tours, mapping URLs...", len(web_tours))
				for idx, tour in enumerate(web_tours):
					# If tour doesn't have URL or has placeholder, map from original results
					if not tour.get("url") or "example.com" in tour.get("url", ""):
						if idx < len(raw_results):
							tour["url"] = raw_results[idx].get("url", "")
							logger.debug("[tool:tour_matcher] Mapped URL for tour {}: {}", idx, tour["url"][:50] if tour["url"] else "N/A")
			
			# Fallback if LLM fails
			if not web_tours:
				logger.warning("[tool:tour_matcher] LLM failed, using enhanced fallback")
				for idx, result in enumerate(raw_results[:5]):
					title = result.get("title", f"Hoạt động tại {destination}")
					snippet = result.get("snippet", result.get("content", ""))
					url = result.get("url", "")
					
					import re
					price_match = re.search(r'(\d{1,3}[.,]?\d{3,})\s*(đ|VND|vnđ|đồng)?', title + snippet)
					price = int(price_match.group(1).replace('.', '').replace(',', '')) if price_match else (
						int(budget_per_person * 0.7) if budget_per_person else 800000
					)
					
					duration_match = re.search(r'(\d+)\s*(giờ|ngày|hour|day)', title + snippet, re.I)
					duration = f"{duration_match.group(1)} {duration_match.group(2)}" if duration_match else "Nửa ngày"
					
					web_tours.append({
						"_id": f"web_search_{idx}",
						"title": title[:80],
						"description": snippet[:200] if snippet else f"Khám phá điểm đến hấp dẫn tại {destination}.",
						"price": price,
						"duration": duration,
						"match_score": 0.6,
						"route": f"{destination} → Điểm tham quan → {destination}",
						"highlights": ["Khám phá địa phương", "Hướng dẫn viên kinh nghiệm"],
						"schedule": {"morning": f"Khởi hành từ {destination}", "afternoon": "Tham quan và trải nghiệm"},
						"includes": ["Hướng dẫn viên", "Phương tiện di chuyển"],
						"excludes": ["Bữa ăn", "Chi phí cá nhân"],
						"tips": "Mang theo máy ảnh và đồ uống.",
						"category": "tham_quan",
						"image_search_query": f"{title[:30]} {destination}",
						"url": url,
						"source": "web_search"
					})
			
			# ========== STEP 2.5: Enrich tours with images BEFORE upsert ==========
			if web_tours:
				logger.info("[tool:tour_matcher] === STEP 2.5: Enriching {} tours with images ===", len(web_tours))
				try:
					from duckduckgo_search import DDGS
					import asyncio
					
					async def fetch_images_for_tour(tour_data: dict) -> list:
						"""Fetch images for a single tour using DuckDuckGo."""
						image_query = tour_data.get("image_search_query", tour_data.get("title", ""))
						if not image_query:
							return []
						
						try:
							def search_images():
								with DDGS() as ddgs:
									return list(ddgs.images(image_query, region="vn-vi", max_results=3))
							
							ddg_images = await asyncio.to_thread(search_images)
							images = []
							for img in ddg_images:
								images.append({
									"url": img.get("image", ""),
									"thumbnail": img.get("thumbnail", ""),
									"caption": img.get("title", image_query)
								})
							return images
						except Exception as e:
							logger.warning("[tool:tour_matcher] Image fetch failed for '{}': {}", image_query[:30], str(e)[:50])
							return []
					
					# Fetch images concurrently for all tours
					import asyncio
					tasks = [fetch_images_for_tour(tour) for tour in web_tours[:5]]  # Limit to 5 for rate limits
					results = await asyncio.gather(*tasks, return_exceptions=True)
					
					# Assign images back to tours
					for i, result in enumerate(results):
						if i < len(web_tours) and isinstance(result, list) and len(result) > 0:
							web_tours[i]["images"] = result
							logger.info("[tool:tour_matcher] ✅ Enriched '{}' with {} images", 
								web_tours[i].get("title", "?")[:30], len(result))
						
				except Exception as e:
					logger.warning("[tool:tour_matcher] Image enrichment step failed: {}", e)
			
			# ========== STEP 3: Upsert to MongoDB ==========
			if web_tours:
				logger.info("[tool:tour_matcher] === STEP 3: Upserting {} web_tours to MongoDB ===", len(web_tours))
				try:
					from db.tour_repository import TourRepository, TourCreate, TourImage, TourSchedule
					
					tours_to_upsert = []
					skipped_no_url = 0
					for wt in web_tours:
						url = wt.get("url", "")
						if not url:
							skipped_no_url += 1
							logger.debug("[tool:tour_matcher] Skipping tour '{}' - no URL", wt.get("title", "?")[:30])
							continue
						
						logger.debug("[tool:tour_matcher] Preparing tour for upsert: '{}' - URL: {}", 
							wt.get("title", "?")[:40], url[:50])
						
						schedule_data = wt.get("schedule", {})
						schedule = TourSchedule(
							morning=schedule_data.get("morning"),
							afternoon=schedule_data.get("afternoon"),
							evening=schedule_data.get("evening")
						) if schedule_data else None
						
						images = [TourImage(url=img.get("url", ""), thumbnail=img.get("thumbnail"), caption=img.get("caption")) 
								  for img in wt.get("images", [])]
						
						# Convert tips to string if it's a list (LLM sometimes returns list)
						tips_raw = wt.get("tips", "")
						if isinstance(tips_raw, list):
							tips = " | ".join(str(t) for t in tips_raw)
						else:
							tips = str(tips_raw) if tips_raw else ""
						
						tour_create = TourCreate(
							title=wt.get("title", ""),
							description=wt.get("description", ""),
							price=float(wt.get("price", 0)),
							duration=wt.get("duration", ""),
							location=destination,
							route=wt.get("route", ""),
							highlights=wt.get("highlights", []),
							schedule=schedule,
							category=wt.get("category", "tham_quan"),
							tips=tips,
							inclusions=wt.get("includes", []),
							exclusions=wt.get("excludes", []),
							images=images,
							source="web_scrape",
							source_url=url,
							match_score=wt.get("match_score")
						)
						tours_to_upsert.append(tour_create)
					
					logger.info("[tool:tour_matcher] Prepared {} tours for upsert ({} skipped - no URL)", 
						len(tours_to_upsert), skipped_no_url)
					
					if tours_to_upsert:
						upserted_ids = await TourRepository.upsert_many(tours_to_upsert)
						logger.info("[tool:tour_matcher] ✅ UPSERTED {} tours to MongoDB", len(upserted_ids))
					else:
						logger.warning("[tool:tour_matcher] ⚠️ No tours to upsert - all were skipped (no URL)")
				except Exception as e:
					logger.exception("[tool:tour_matcher] ❌ Upsert failed: {}", e)
			
			# Add web tours to all_tours
			all_tours.extend(web_tours)
	
	except Exception as e:
		logger.warning("[tool:tour_matcher] Web search failed: {}", e)
	
	if not all_tours:
		logger.info("[tool:tour_matcher] no tours found")
		return {
			"matched_tours": [],
			"recommendation": "create_new"
		}
	
	# Score and rank tours (if match_score not already from LLM)
	scored_tours = []
	for i, tour in enumerate(all_tours):
		score = tour.get("match_score", 0.5)
		# Ensure ID
		if "_id" not in tour:
			tour["_id"] = f"tour_{i}"
			
		scored_tours.append({
			"tour": tour,
			"score": score
		})
	
	# Sort by score descending
	scored_tours.sort(key=lambda x: x["score"], reverse=True)
	
	# Take top 5
	top_tours = scored_tours[:5]
	
	# Enrich tours with images (async)
	enriched_tours = []
	for item in top_tours:
		tour = item["tour"]
		score = item["score"]
		
		# Search for images if image_search_query exists
		images = []
		image_query = tour.get("image_search_query", "")
		if image_query:
			try:
				from duckduckgo_search import DDGS
				import asyncio
				
				def search_images():
					with DDGS() as ddgs:
						return list(ddgs.images(image_query, region="vn-vi", max_results=2))
				
				ddg_images = await asyncio.to_thread(search_images)
				for img in ddg_images:
					images.append({
						"url": img.get("image", ""),
						"thumbnail": img.get("thumbnail", ""),
						"caption": img.get("title", image_query)
					})
				logger.info("[tool:tour_matcher] Found {} images for: {}", len(images), image_query[:30])
			except Exception as e:
				logger.warning("[tool:tour_matcher] Image search failed: {}", e)
		
		# Build final tour object with all new fields
		enriched_tours.append({
			"tour_id": str(tour.get("_id", "")),
			"title": tour.get("title", "Unknown Tour"),
			"description": tour.get("description", ""),
			"match_score": round(score, 2),
			"price": tour.get("price", 0),
			"duration": tour.get("duration", ""),
			"fit_reason": _generate_fit_reason(tour, score, budget_per_person),
			# New detailed fields
			"route": tour.get("route", ""),
			"highlights": tour.get("highlights", []),
			"schedule": tour.get("schedule", {}),
			"includes": tour.get("includes", []),
			"excludes": tour.get("excludes", []),
			"tips": tour.get("tips", ""),
			"category": tour.get("category", "tham_quan"),
			"itinerary_preview": tour.get("itinerary_preview", tour.get("route", "")),
			"can_customize": True,
			"images": images,
			"url": tour.get("url", "")
		})
	
	matched_tours = enriched_tours
	
	# Determine recommendation
	best_score = top_tours[0]["score"] if top_tours else 0.0
	if best_score >= 0.7:
		recommendation = "use_existing"
	elif best_score >= 0.4:
		recommendation = "hybrid"
	else:
		recommendation = "create_new"
	
	logger.info(
		"[tool:tour_matcher] found {} matches, best_score={}, recommendation=\"{}\"",
		len(matched_tours), best_score, recommendation
	)

	if matched_tours:
		import json
		logger.info("[tool:tour_matcher] DEBUG FIRST TOUR: {}", json.dumps(matched_tours[0], ensure_ascii=False))
	
	return {
		"matched_tours": matched_tours,
		"recommendation": recommendation
	}


# For use as LangChain tool
from langchain_core.tools import tool


@tool
async def tour_matcher_tool(
	destination: str,
	dates: str | None = None,
	budget_per_person: float | None = None,
	style: str | None = None,
	interests: str | None = None
) -> Dict[str, Any]:
	"""
	Match existing tours from database based on user preferences.
	
	Use this when user wants to find tours that match their requirements.
	Returns top 5 matching tours with scores and recommendation.
	
	Args:
		destination: Destination name
		dates: JSON string with 'start' and 'end' dates (optional)
		budget_per_person: Budget per person in VND (optional)
		style: Travel style - adventure, cultural, culinary, photography (optional)
		interests: Comma-separated list of interests (optional)
	
	Returns:
		Dict with matched_tours list and recommendation (use_existing/hybrid/create_new)
	"""
	import json
	
	dates_dict = None
	if dates:
		try:
			dates_dict = json.loads(dates) if isinstance(dates, str) else dates
		except:
			pass
	
	interests_list = []
	if interests:
		interests_list = [i.strip() for i in interests.split(",")] if isinstance(interests, str) else interests
	
	return await tour_matcher(
		destination=destination,
		dates=dates_dict,
		budget_per_person=budget_per_person,
		style=style,
		interests=interests_list
	)

