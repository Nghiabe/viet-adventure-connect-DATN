from __future__ import annotations
from typing import Any, Dict
from loguru import logger
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from agents.itinerary_planner.state import ItineraryPlannerState

# Import all nodes
from agents.itinerary_planner.nodes.destination_analyzer import destination_analyzer_node
from agents.itinerary_planner.nodes.tour_matcher import tour_matcher_node
from agents.itinerary_planner.nodes.human_checkpoint_1 import human_checkpoint_1_node
from agents.itinerary_planner.nodes.itinerary_generator import itinerary_generator_node
from agents.itinerary_planner.nodes.hotel_finder import hotel_finder_node
from agents.itinerary_planner.nodes.human_checkpoint_2 import human_checkpoint_2_node
from agents.itinerary_planner.nodes.map_route_builder import map_route_builder_node
from agents.itinerary_planner.nodes.budget_calculator import budget_calculator_node
from agents.itinerary_planner.nodes.tips_generator import tips_generator_node
from agents.itinerary_planner.nodes.human_checkpoint_3 import human_checkpoint_3_node
from agents.itinerary_planner.nodes.finalize import finalize_node


def route_after_checkpoint1(state: ItineraryPlannerState) -> str:
	"""Route after checkpoint 1 based on tour selection."""
	tour_selection = state.get("tour_selection", "create_new")
	logger.info("[route:checkpoint_1] tour_selection=\"{}\"", tour_selection)
	if tour_selection == "use_existing":
		return "hotel_finder"
	else:
		return "itinerary_generator"


def route_after_checkpoint2(state: ItineraryPlannerState) -> str:
	"""Route after checkpoint 2 based on hotel feedback."""
	hotel_adjustment_requested = state.get("hotel_adjustment_requested", False)
	if hotel_adjustment_requested:
		return "hotel_finder"  # Loop back
	else:
		return "map_builder"


def route_after_checkpoint3(state: ItineraryPlannerState) -> str:
	"""Route after checkpoint 3 based on final approval."""
	final_approved = state.get("final_approved", False)
	if final_approved:
		return "finalize"
	
	# User wants changes - check max revisions first
	revision_count = state.get("revision_count", 0)
	max_revisions = 5  # Prevent infinite loops
	if revision_count >= max_revisions:
		logger.warning("[route:checkpoint_3] Max revisions reached, forcing approval")
		return "finalize"
	
	# Route back based on change_type
	change_type = state.get("change_type", "").lower()
	if "hotel" in change_type:
		return "hotel_finder"
	elif "itinerary" in change_type or "activity" in change_type:
		return "itinerary_generator"
	else:
		# Invalid change_type - default to finalize to prevent loop
		logger.warning("[route:checkpoint_3] Invalid change_type=\"{}\", defaulting to finalize", change_type)
		return "finalize"


# Shared memory across all agent instances
from config import get_settings
from agents.itinerary_planner.mongo_checkpointer import MongoDBSaver

try:
	settings = get_settings()
	_shared_memory = MongoDBSaver(
		uri=settings.mongodb_uri,
		db_name=settings.mongodb_db_name,
		collection_name=settings.mongodb_collection
	)
	logger.info(f"[graph] Initialized MongoDBSaver with db={settings.mongodb_db_name} coll={settings.mongodb_collection}")
except Exception as e:
	logger.error(f"[graph] Failed to initialize MongoDBSaver: {e}, using MemorySaver")
	_shared_memory = MemorySaver()

class ItineraryPlannerAgent:
	"""Agent for generating travel itineraries."""
	
	def __init__(self) -> None:
		# Use shared memory so checkpoints persist across requests
		self._memory = _shared_memory
		self.graph = self._build()
	
	def _build(self):
		"""Build the LangGraph workflow."""
		workflow = StateGraph(ItineraryPlannerState)
		
		# Add all nodes
		workflow.add_node("destination_analyzer", destination_analyzer_node)
		workflow.add_node("tour_matcher", tour_matcher_node)
		workflow.add_node("checkpoint_1", human_checkpoint_1_node)
		workflow.add_node("itinerary_generator", itinerary_generator_node)
		workflow.add_node("hotel_finder", hotel_finder_node)
		workflow.add_node("checkpoint_2", human_checkpoint_2_node)
		workflow.add_node("map_builder", map_route_builder_node)
		workflow.add_node("budget_calc", budget_calculator_node)
		workflow.add_node("tips_gen", tips_generator_node)
		workflow.add_node("checkpoint_3", human_checkpoint_3_node)
		workflow.add_node("finalize", finalize_node)
		
		# Define edges
		workflow.set_entry_point("destination_analyzer")
		workflow.add_edge("destination_analyzer", "tour_matcher")
		workflow.add_edge("tour_matcher", "checkpoint_1")
		
		# Conditional edge from checkpoint_1
		workflow.add_conditional_edges(
			"checkpoint_1",
			route_after_checkpoint1,
			{
				"hotel_finder": "hotel_finder",
				"itinerary_generator": "itinerary_generator"
			}
		)
		
		workflow.add_edge("itinerary_generator", "hotel_finder")
		workflow.add_edge("hotel_finder", "checkpoint_2")
		
		# Conditional edge from checkpoint_2
		workflow.add_conditional_edges(
			"checkpoint_2",
			route_after_checkpoint2,
			{
				"hotel_finder": "hotel_finder",
				"map_builder": "map_builder"
			}
		)
		
		workflow.add_edge("map_builder", "budget_calc")
		workflow.add_edge("budget_calc", "tips_gen")
		workflow.add_edge("tips_gen", "checkpoint_3")
		
		# Conditional edge from checkpoint_3
		workflow.add_conditional_edges(
			"checkpoint_3",
			route_after_checkpoint3,
			{
				"finalize": "finalize",
				"hotel_finder": "hotel_finder",
				"itinerary_generator": "itinerary_generator",
				"checkpoint_3": "checkpoint_3"
			}
		)
		
		workflow.add_edge("finalize", END)
		
		# Compile with checkpointer and interrupts
		# Use interrupt_after so checkpoint nodes can run and set state first
		return workflow.compile(
			checkpointer=self._memory,
			interrupt_after=["checkpoint_1", "checkpoint_2", "checkpoint_3"]
		)
	
	async def stream(
		self,
		user_inputs: Dict[str, Any],
		user_id: str | None = None,
		thread_id: str | None = None
	):
		"""
		Stream graph execution events.
		
		Yields:
			Dict with event type and data
		"""
		thread_id = thread_id or user_id or "default"
		logger.info("[planner:stream] user_id=\"{}\" thread_id=\"{}\"", user_id, thread_id)
		
		initial_state: ItineraryPlannerState = {
			"user_inputs": user_inputs,
			"destination_info": {},
			"matched_tours": [],
			"tour_selection": "create_new",
			"selected_tour_id": None,
			"daily_itinerary": [],
			"recommended_hotels": [],
			"selected_hotel": None,
			"hotel_adjustment_requested": False,
			"route_data": {},
			"budget_summary": {},
			"safety_tips": [],
			"human_feedback": {},
			"revision_count": 0,
			"final_approved": False,
			"change_type": "",
			"changes": {},
			"final_itinerary": {},
			"saved_to_db": False,
			"itinerary_id": ""
		}
		
		config = {"configurable": {"thread_id": thread_id, "checkpoint_ns": ""}}
		
		try:
			async for event in self._stream_events(self.graph.astream(initial_state, config), thread_id, self._memory):
				yield event
		except Exception as e:
			logger.exception("[planner:stream] Error: {}", e)
			yield {
				"event": "error",
				"data": {"error": str(e)}
			}
	
	async def _stream_events(self, astream_iter, thread_id: str, memory=None):
		"""Helper to stream events from graph execution.
		
		Args:
			astream_iter: Async iterator from graph.astream()
			thread_id: Thread ID for loading checkpoints
			memory: Optional memory instance for loading checkpoints
		"""
		node_progress = {
			"destination_analyzer": 10,
			"tour_matcher": 20,
			"checkpoint_1": 25,
			"itinerary_generator": 40,
			"hotel_finder": 50,
			"checkpoint_2": 55,
			"map_builder": 65,
			"budget_calc": 75,
			"tips_gen": 85,
			"checkpoint_3": 90,
			"finalize": 100
		}
		
		async for event in astream_iter:
			for node_name, node_state in event.items():
				# Skip special keys
				if node_name.startswith("__"):
					continue
				
				# Yield progress event
				progress = node_progress.get(node_name, 0)
				yield {
					"event": "progress",
					"data": {
						"stage": node_name,
						"progress": progress
					}
				}
				
				# Check for checkpoints
				if node_name in ["checkpoint_1", "checkpoint_2", "checkpoint_3"]:
					# node_state can be None when resuming - load from checkpoint if needed
					# Always load latest state from memory for checkpoints to ensure we have full context
					# (node_state usually only contains the delta returned by the node)
					full_state = {}
					if memory is not None:
						try:
							checkpoint_config = {"configurable": {"thread_id": thread_id, "checkpoint_ns": ""}}
							checkpoint_tuple = await memory.aget(checkpoint_config)
							if checkpoint_tuple:
								if isinstance(checkpoint_tuple, tuple) and len(checkpoint_tuple) == 2:
									checkpoint, _ = checkpoint_tuple
								else:
									checkpoint = checkpoint_tuple
								
								if isinstance(checkpoint, dict):
									full_state = dict(checkpoint.get("channel_values", {}))
								elif hasattr(checkpoint, 'channel_values'):
									full_state = dict(checkpoint.channel_values)
								logger.info("[_stream_events] Loaded full state from memory for node=\"{}\"", node_name)
						except Exception as e:
							logger.warning("[_stream_events] Failed to load checkpoint state: {}", e)

					# If node_state gave us something (delta), update our view of full_state
					if node_state:
						full_state.update(node_state)
					
					# Use full_state for extracting data for frontend
					node_state = full_state
					
					checkpoint_data = _extract_checkpoint_data(node_name, node_state)
					yield {
						"event": "checkpoint",
						"data": {
							"checkpoint_id": node_name,
							"session_id": thread_id,
							"data": checkpoint_data,
							"prompt": _get_checkpoint_prompt(node_name)
						}
					}
					# Wait briefly to ensure checkpoint is saved
					import asyncio
					await asyncio.sleep(0.2)
					return  # Exit to wait for resume
				
				# Check for completion
				if node_name == "finalize" and node_state.get("saved_to_db"):
					yield {
						"event": "complete",
						"data": {
							"itinerary_id": node_state.get("itinerary_id", ""),
							"itinerary": node_state.get("final_itinerary", {})
						}
					}
					return
	
	async def resume(
		self,
		thread_id: str,
		checkpoint_id: str,
		feedback: Dict[str, Any]
	):
		"""
		Resume graph execution from a checkpoint.
		
		Args:
			thread_id: Thread ID
			checkpoint_id: Checkpoint ID
			feedback: User feedback
		"""
		logger.info(
			"[planner:resume] thread_id=\"{}\" checkpoint_id=\"{}\"",
			thread_id, checkpoint_id
		)
		
		# Validate checkpoint_id
		valid_checkpoints = ["checkpoint_1", "checkpoint_2", "checkpoint_3"]
		if checkpoint_id not in valid_checkpoints:
			logger.error("[planner:resume] Invalid checkpoint_id=\"{}\"", checkpoint_id)
			yield {
				"event": "error",
				"data": {"error": f"Invalid checkpoint_id: {checkpoint_id}"}
			}
			return
		
		config = {"configurable": {"thread_id": thread_id, "checkpoint_ns": ""}}
		
		# Get current state from checkpoint
		import asyncio
		checkpoint_tuple = None
		for attempt in range(5):
			checkpoint_tuple = await self._memory.aget(config)
			if checkpoint_tuple:
				break
			await asyncio.sleep(0.1)
		
		if not checkpoint_tuple:
			logger.error("[planner:resume] No checkpoint found for thread_id=\"{}\"", thread_id)
			yield {
				"event": "error",
				"data": {"error": "No checkpoint found"}
			}
			return
		
		# Extract state from checkpoint
		# LangGraph returns (checkpoint, metadata) tuple
		if isinstance(checkpoint_tuple, tuple) and len(checkpoint_tuple) == 2:
			checkpoint, original_metadata = checkpoint_tuple
		else:
			# Fallback if not tuple
			checkpoint = checkpoint_tuple
			original_metadata = {}
		
		# Preserve original metadata - DO NOT modify step
		# LangGraph uses step to know where to resume from
		# If we change step, it will restart from beginning
		if not isinstance(original_metadata, dict):
			# Try to convert metadata object to dict while preserving all fields
			if hasattr(original_metadata, '__dict__'):
				metadata = dict(original_metadata.__dict__)
			else:
				# Try to get common attributes
				metadata = {}
				for attr in ['step', 'v', 'ts', 'id']:
					if hasattr(original_metadata, attr):
						metadata[attr] = getattr(original_metadata, attr)
		else:
			metadata = dict(original_metadata)  # Copy to avoid modifying original
		
		# Log metadata for debugging
		logger.info("[planner:resume] original metadata step={} v={}", metadata.get("step"), metadata.get("v"))
		
		# CRITICAL: Ensure metadata has 'step' - LangGraph requires it to resume
		# If step is missing, LangGraph will fail with KeyError
		if "step" not in metadata:
			# Try to infer step from version number
			if "v" in metadata:
				metadata["step"] = metadata["v"]
				logger.info("[planner:resume] Using version as step: {}", metadata["step"])
			else:
				# If no step or version, we need to get it from the checkpoint itself
				# LangGraph stores step in checkpoint metadata when it creates checkpoints
				# For now, use a reasonable default based on checkpoint_id
				step_map = {
					"checkpoint_1": 3,  # After destination_analyzer, tour_matcher, checkpoint_1
					"checkpoint_2": 6,  # After more nodes
					"checkpoint_3": 9   # Near the end
				}
				default_step = step_map.get(checkpoint_id, 3)
				metadata["step"] = default_step
				logger.warning(
					"[planner:resume] No step found, using default step={} for checkpoint_id={}",
					default_step, checkpoint_id
				)
		
		if isinstance(checkpoint, dict):
			current_state = dict(checkpoint.get("channel_values", {}))
		elif hasattr(checkpoint, 'channel_values'):
			current_state = dict(checkpoint.channel_values)
		else:
			current_state = {}
		
		# Update revision count if this is a change request
		if checkpoint_id == "checkpoint_3" and feedback.get("action") != "approve":
			current_state["revision_count"] = current_state.get("revision_count", 0) + 1
		
		# Store feedback in state - checkpoint nodes will read and process this
		# NOTE: We don't update state here, let checkpoint nodes do it to avoid double update
		human_feedback = current_state.get("human_feedback", {})
		human_feedback[checkpoint_id] = feedback
		current_state["human_feedback"] = human_feedback
		
		# Save updated state back to checkpoint
		if isinstance(checkpoint, dict):
			checkpoint["channel_values"] = current_state
		else:
			checkpoint.channel_values = current_state
		
		# Save updated state back to checkpoint BEFORE resuming
		# This ensures feedback is available when checkpoint node runs
		# CRITICAL: metadata MUST have 'step' for LangGraph to resume correctly
		await self._memory.aput(config, checkpoint, metadata, {})
		logger.info("[planner:resume] Saved checkpoint with step={}", metadata.get("step"))
		logger.info("[planner:resume] Stored feedback, resuming from checkpoint")
		
		# Resume graph execution from checkpoint
		# LangGraph will automatically load checkpoint from memory based on config
		# We pass None or empty dict to let LangGraph load from checkpoint
		# The checkpoint node will read feedback from state and process it
		try:
			async for event in self._stream_events(self.graph.astream(None, config), thread_id, self._memory):
				yield event
		except Exception as e:
			logger.exception("[planner:resume] Error resuming: {}", e)
			# Fallback: try with empty dict
			logger.info("[planner:resume] Retrying with empty state")
			async for event in self._stream_events(self.graph.astream({}, config), thread_id, self._memory):
				yield event


# REMOVED: _update_state_from_feedback() - Checkpoint nodes now handle state updates directly
# This prevents double state updates and makes logic clearer


def _extract_checkpoint_data(checkpoint_id: str, node_state: Dict[str, Any] | None) -> Dict[str, Any]:
	"""Extract relevant data for checkpoint."""
	# Handle None node_state (can happen during resume)
	if node_state is None:
		logger.warning("[_extract_checkpoint_data] node_state is None for checkpoint_id=\"{}\"", checkpoint_id)
		return {}
	
	if checkpoint_id == "checkpoint_1":
		return {
			"matched_tours": node_state.get("matched_tours", []),
			"tour_selection": node_state.get("tour_selection", "")
		}
	elif checkpoint_id == "checkpoint_2":
		return {
			"hotels": node_state.get("recommended_hotels", [])
		}
	elif checkpoint_id == "checkpoint_3":
		# Extract data before finalize - use current state, not final_itinerary
		return {
			"daily_itinerary": node_state.get("daily_itinerary", []),
			"hotels": node_state.get("recommended_hotels", []),
			"selected_hotel": node_state.get("selected_hotel"),
			"budget": node_state.get("budget_summary", {}),
			"tips": node_state.get("safety_tips", []),
			"route_data": node_state.get("route_data", {})
		}
	return {}


def _get_checkpoint_prompt(checkpoint_id: str) -> str:
	"""Get prompt text for checkpoint."""
	prompts = {
		"checkpoint_1": "Bạn có muốn dùng tours này không?",
		"checkpoint_2": "Xem trước khách sạn, OK không?",
		"checkpoint_3": "Review toàn bộ lịch trình"
	}
	return prompts.get(checkpoint_id, "Vui lòng xem xét và phản hồi")
