from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from uuid import uuid4
from loguru import logger
from agents.chat_graph import ChatAgent
from tools.image_search_tool import search_images
from typing import Dict, Any

router = APIRouter()


class ChatRequest(BaseModel):
	message: str
	user_id: str | None = None
	context: Dict[str, Any] | None = None
	location_hint: str | None = None
	intent_hint: str | None = None


class ImageSearchRequest(BaseModel):
	query: str


@router.post("/image-search")
async def search_image_api(req: ImageSearchRequest):
	"""Explicit image search API for client-side hydration."""
	try:
		result = search_images(req.query)
		# search_images tool returns dict {"images": [...]} or {"error": ...}
		# We'll just return the first valid image for simplicity, or the whole list
		if result.get("error"):
			raise HTTPException(status_code=500, detail=result["error"])
		
		images = result.get("images", [])
		if not images:
			return {"image": None}
			
		# Return best image (first one)
		return {"image": images[0]}
	except Exception as e:
		raise HTTPException(status_code=500, detail=str(e))


class ChatResponse(BaseModel):
	response: str
	action: dict | None = None  # For planner redirect button
	cards: list[dict] | None = None
	intent: str | None = None
	trace_id: str | None = None
	errors: list[str] | None = None
	sources: list[dict] | None = None


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
	trace_id = str(uuid4())
	try:
		agent = ChatAgent()
		ctx = payload.context or {}
		# Normalize hints into context for downstream uniform access
		if payload.location_hint:
			ctx["location_hint"] = payload.location_hint
		if payload.intent_hint:
			ctx["intent_hint"] = payload.intent_hint
		ctx["trace_id"] = trace_id
		logger.info("[chat] trace_id={} user_id={} intent_hint={} location_hint={} msg=\"{}\"",
			trace_id, payload.user_id, payload.intent_hint, payload.location_hint, payload.message)
		result = await agent.run(message=payload.message, user_id=payload.user_id, context=ctx)
		errors = result.get("errors") if isinstance(result, dict) else None
		logger.info("[chat] trace_id={} done intent={} cards={} resp_len={} errors={}",
			trace_id, result.get("intent"), len(result.get("cards") or []), len(result.get("response") or ""), errors)
		return ChatResponse(response=result.get("response", ""), cards=result.get("cards"), intent=result.get("intent"), trace_id=trace_id, errors=errors, sources=result.get("sources"))
	except Exception as exc:  # pragma: no cover
		logger.exception("[chat] trace_id={} error: {}", trace_id, exc)
		raise HTTPException(status_code=500, detail=str(exc))


@router.post("/chat/stream")
async def chat_stream_endpoint(payload: ChatRequest):
	trace_id = str(uuid4())
	agent = ChatAgent()
	ctx = payload.context or {}
	ctx["trace_id"] = trace_id
	if payload.location_hint:
		ctx["location_hint"] = payload.location_hint
	if payload.intent_hint:
		ctx["intent_hint"] = payload.intent_hint

	async def token_stream():
		try:
			async for chunk in agent.stream(message=payload.message, user_id=payload.user_id, context=ctx):
				yield chunk.encode("utf-8")
		except Exception as exc:
			yield f"error: {exc}".encode("utf-8")

	return StreamingResponse(token_stream(), media_type="text/plain; charset=utf-8")


