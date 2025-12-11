from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from uuid import uuid4
from loguru import logger
from agents.itinerary_planner.graph import ItineraryPlannerAgent
from typing import Dict, Any, Optional

router = APIRouter()


class PlannerGenerateRequest(BaseModel):
	user_id: Optional[str] = None
	inputs: Dict[str, Any] = Field(..., description="User inputs from wizard")


class PlannerFeedbackRequest(BaseModel):
	session_id: str
	checkpoint_id: str
	feedback: Dict[str, Any]


@router.post("/generate")
async def generate_itinerary(payload: PlannerGenerateRequest):
	"""Generate itinerary with SSE streaming."""
	session_id = str(uuid4())
	agent = ItineraryPlannerAgent()
	
	logger.info(
		"[planner:generate] session_id={} user_id={}",
		session_id, payload.user_id
	)
	
	async def event_stream():
		import asyncio
		import json
		
		iterator = agent.stream(
			user_inputs=payload.inputs,
			user_id=payload.user_id,
			thread_id=session_id
		).__aiter__()
		
		while True:
			try:
				# Wait for next event with 5s timeout to send heartbeat
				event = await asyncio.wait_for(iterator.__anext__(), timeout=5.0)
				
				# Format as SSE
				event_type = event.get("event", "progress")
				data = event.get("data", {})
				
				yield f"event: {event_type}\n"
				yield f"data: {json.dumps(data)}\n\n"
				
			except StopAsyncIteration:
				break
			except asyncio.TimeoutError:
				# Send heartbeat comment to keep connection alive
				yield ": keep-alive\n\n"
			except Exception as exc:
				logger.exception("[planner:generate] error: {}", exc)
				yield f"event: error\n"
				yield f"data: {json.dumps({'error': str(exc)})}\n\n"
				break
	
	return StreamingResponse(
		event_stream(),
		media_type="text/event-stream",
		headers={
			"Cache-Control": "no-cache",
			"Connection": "keep-alive",
			"X-Accel-Buffering": "no"
		}
	)


@router.post("/feedback")
async def send_feedback(payload: PlannerFeedbackRequest):
	"""Resume graph from checkpoint with feedback."""
	agent = ItineraryPlannerAgent()
	
	logger.info(
		"[planner:feedback] session_id={} checkpoint_id={}",
		payload.session_id, payload.checkpoint_id
	)
	
	# Update state with feedback
	# In a real implementation, we'd load state from checkpointer
	# For now, we'll need to handle this differently
	
	async def event_stream():
		import asyncio
		import json
		
		iterator = agent.resume(
			thread_id=payload.session_id,
			checkpoint_id=payload.checkpoint_id,
			feedback=payload.feedback
		).__aiter__()

		while True:
			try:
				# Wait for next event with 5s timeout to send heartbeat
				event = await asyncio.wait_for(iterator.__anext__(), timeout=5.0)

				event_type = event.get("event", "progress")
				data = event.get("data", {})
				yield f"event: {event_type}\n"
				yield f"data: {json.dumps(data)}\n\n"
				
			except StopAsyncIteration:
				break
			except asyncio.TimeoutError:
				# Send heartbeat comment to keep connection alive
				yield ": keep-alive\n\n"
			except Exception as exc:
				logger.exception("[planner:feedback] error: {}", exc)
				yield f"event: error\n"
				yield f"data: {json.dumps({'error': str(exc)})}\n\n"
				break
	
	return StreamingResponse(
		event_stream(),
		media_type="text/event-stream",
		headers={
			"Cache-Control": "no-cache",
			"Connection": "keep-alive",
			"X-Accel-Buffering": "no"
		}
	)



