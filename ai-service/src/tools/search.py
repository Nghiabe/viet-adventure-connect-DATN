from __future__ import annotations
from typing import Any, Dict, List, Optional
from loguru import logger
import os



def web_search(query: str, max_results: int = 6) -> Dict[str, Any]:
	# Firecrawl only, cap at 3 results
	api_key = os.getenv("FIRECRAWL_API_KEY")
	if not api_key:
		logger.error("[tool:web_search] firecrawl missing FIRECRAWL_API_KEY")
		return {"results": [], "error": "firecrawl_missing_api_key"}
	limit = 3 if max_results is None else min(max_results, 3)
	try:
		from firecrawl import FirecrawlApp  # type: ignore
		logger.info("[tool:web_search] provider=firecrawl q=\"{}\" limit={}", query, limit)
		app = FirecrawlApp(api_key=api_key)
		resp = app.search(query, limit=limit)
		items: List[Any]
		if isinstance(resp, list):
			items = resp
		elif isinstance(resp, dict):
			items = resp.get("results") or resp.get("data") or []
			if isinstance(items, dict):
				# flatten category buckets like {"web": [...], "news": [...]} into a single list
				buckets = items
				items = []
				for key in ("web", "news", "images"):
					val = buckets.get(key)
					if isinstance(val, list):
						items.extend(val)
		else:
			# Object-like SDK responses
			items = []
			for attr in ("results", "data", "items", "web"):
				if hasattr(resp, attr):
					val = getattr(resp, attr)
					if isinstance(val, list):
						items = val
						break
		results: List[Dict[str, Any]] = []
		for r in items[:limit]:
			if isinstance(r, dict):
				title = r.get("title") or r.get("name")
				snippet = r.get("description") or r.get("snippet") or r.get("content")
				url = r.get("url") or r.get("link")
				image = r.get("image") or r.get("thumbnail") or r.get("ogImage")
			else:
				title = getattr(r, "title", None)
				snippet = getattr(r, "description", None) or getattr(r, "snippet", None) or getattr(r, "content", None)
				url = getattr(r, "url", None) or getattr(r, "link", None)
				image = getattr(r, "image", None) or getattr(r, "thumbnail", None) or getattr(r, "ogImage", None)
			
			results.append({
				"type": "web",
				"title": title,
				"snippet": snippet,
				"url": url,
				"image": image,
				"provider": "firecrawl",
			})
		if not results:
			logger.warning("[tool:web_search] firecrawl empty_results")
			return {"results": [], "error": "firecrawl_empty"}
		return {"results": results}
	except Exception as e:
		logger.error("[tool:web_search] firecrawl error={} q=\"{}\"", e, query)
		return {"results": [], "error": f"firecrawl_error: {e}"}


def web_search_fire_crawl(query: str, max_results: int = 3, sources: Optional[List[str]] = None, tbs: Optional[str] = None, location: Optional[str] = None) -> Dict[str, Any]:
	"""Simple Firecrawl v2 search wrapper.

	Returns: {"results": [{title, snippet, url, provider}]}
	"""
	api_key = os.getenv("FIRECRAWL_API_KEY")
	if not api_key:
		logger.error("[tool:web_search_fire_crawl] missing FIRECRAWL_API_KEY")
		return {"results": [], "error": "firecrawl_missing_api_key"}
	limit = 3 if max_results is None else min(max_results, 3)
	try:
		from firecrawl import Firecrawl  # type: ignore
		logger.info(
			"[tool:web_search_fire_crawl] q=\"{}\" limit={} sources={} tbs={} location={}",
			query,
			limit,
			sources,
			tbs,
			location,
		)
		client = Firecrawl(api_key=api_key)
		resp = client.search(query=query, limit=limit, sources=sources, tbs=tbs, location=location)
		# SDK returns the data object directly, which may be:
		# - dict with buckets (web/news/images)
		# - list when scraping content
		# - plain list of results in some cases
		items: List[Any] = []
		if isinstance(resp, list):
			items = resp
		elif isinstance(resp, dict):
			# Try buckets first
			for key in ("web", "news", "images"):
				val = resp.get(key)
				if isinstance(val, list):
					items.extend(val)
			# Fallback: sometimes sdk returns {"data": [...]}
			if not items:
				data = resp.get("data")
				if isinstance(data, list):
					items = data
		else:
			for attr in ("web", "results", "data"):
				if hasattr(resp, attr):
					val = getattr(resp, attr)
					if isinstance(val, list):
						items = val
						break
		results: List[Dict[str, Any]] = []
		for r in items[:limit]:
			if isinstance(r, dict):
				title = r.get("title")
				snippet = r.get("description") or r.get("snippet") or r.get("content")
				url = r.get("url")
			else:
				title = getattr(r, "title", None)
				snippet = getattr(r, "description", None) or getattr(r, "snippet", None) or getattr(r, "content", None)
				url = getattr(r, "url", None)
			results.append({
				"type": "web",
				"title": title,
				"snippet": snippet,
				"url": url,
				"provider": "firecrawl",
			})
		logger.info("[tool:web_search_fire_crawl] results_count={}", len(results))
		if not results:
			return {"results": [], "error": "firecrawl_empty"}
		return {"results": results}
	except Exception as e:
		logger.error("[tool:web_search_fire_crawl] error={} q=\"{}\"", e, query)
		return {"results": [], "error": f"firecrawl_error: {e}"}


def web_search_tavily(query: str, max_results: int = 5) -> Dict[str, Any]:
	"""Tavily search wrapper with image support."""
	api_key = os.getenv("TAVILY_API_KEY")
	if not api_key:
		logger.error("[tool:web_search_tavily] missing TAVILY_API_KEY")
		return {"results": [], "error": "tavily_missing_api_key"}

	limit = 3 if max_results is None else min(max_results, 5)
	try:
		from tavily import TavilyClient
		logger.info("[tool:web_search_tavily] q=\"{}\" limit={}", query, limit)
		client = TavilyClient(api_key=api_key)
		resp = client.search(query, search_depth="basic", max_results=limit, include_images=True)
		
		# Tavily response structure: {'results': [...], 'images': [...]}
		tavily_results = resp.get("results", [])
		tavily_images = resp.get("images", [])
		
		results: List[Dict[str, Any]] = []
		
		for idx, r in enumerate(tavily_results):
			image_url = None
			# Attempt to match image to result by index, or just give any image
			if idx < len(tavily_images):
				image_url = tavily_images[idx]
			
			# Fallback: sometimes 'images' in result item?
			if not image_url and isinstance(r, dict):
				image_url = r.get("image") or r.get("thumbnail")

			results.append({
				"type": "web",
				"title": r.get("title"),
				"snippet": r.get("content"),
				"url": r.get("url"),
				"image": image_url,
				"provider": "tavily",
			})
			
		if not results:
			return {"results": [], "error": "tavily_empty"}
			
		return {"results": results}
	except Exception as e:
		logger.error("[tool:web_search_tavily] error={} q=\"{}\"", e, query)
		return {"results": [], "error": f"tavily_error: {e}"}


def web_search_duckduckgo(query: str, max_results: int = 5) -> Dict[str, Any]:
	"""DuckDuckGo search wrapper (no API key required)."""
	try:
		from duckduckgo_search import DDGS
		logger.info("[tool:web_search_duckduckgo] q=\"{}\" limit={}", query, max_results)
		
		results = []
		with DDGS() as ddgs:
			ddgs_gen = ddgs.text(query, max_results=max_results)
			if ddgs_gen:
				for r in ddgs_gen:
					results.append({
						"type": "web",
						"title": r.get("title"),
						"snippet": r.get("body"),
						"url": r.get("href"),
						"provider": "duckduckgo",
					})
					
		if not results:
			return {"results": [], "error": "duckduckgo_empty"}
			
		return {"results": results}
	except Exception as e:
		logger.error("[tool:web_search_duckduckgo] error={} q=\"{}\"", e, query)
		return {"results": [], "error": f"duckduckgo_error: {e}"}
