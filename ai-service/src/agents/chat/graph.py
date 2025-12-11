from __future__ import annotations
from typing import Any, Dict, Literal
from loguru import logger
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from agents.chat.lc_tools import web_search, weather_lookup
from tools.image_search_tool import search_images
from tools.booking_tool import book_transport, book_ticket
from tools.search_trips_tool import search_trips
from tools.culinary_tool import culinary_research_tool
from prompts.assistant import build_messages, system_prompt
from prompts.router import router_prompt_template
from prompts.logistics import logistics_system_prompt
from prompts.culinary import culinary_finder_system_prompt
from prompts.hotel import hotel_finder_system_prompt
from prompts.emergency import emergency_helper_system_prompt
from config import get_settings
from agents.chat.state import ChatState

from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_fixed, AsyncRetrying
from google.api_core.exceptions import ResourceExhausted

# ... imports

from agents.chat.schema import RouterOutput

class ChatAgent:
	def __init__(self) -> None:
		self._memory = InMemorySaver()
		self.graph = self._build()

	def _build(self):
		settings = get_settings()
		llm = ChatOpenAI(
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

		# --- 1. Router ---
		# Use module-level class
		router_prompt = router_prompt_template()
		router_chain = router_prompt | llm.with_structured_output(RouterOutput)

		async def router_node(state: ChatState):
			messages = state.get("messages", [])
			last_msg = messages[-1].content if messages else ""
			params = {"input": last_msg} if state.get("messages") else {"input": ""}
			
			dest = "local_guide" 
			try:
				async for attempt in AsyncRetrying(
					retry=retry_if_exception_type(ResourceExhausted),
					stop=stop_after_attempt(10),
					wait=wait_fixed(10)
				):
					with attempt:
						result = await router_chain.ainvoke(params)
						dest = result.destination
			except Exception as e:
				logger.warning(f"Router failed after retries, default to Local Guide: {e}")
				dest = "local_guide"
			
			logger.info(f"[ROUTER] Directed to: {dest}")
			# IMPORTANT: Return keys that match State definition to update it
			return {"intent": dest}

		# --- 2. Specialists ---
		# B. Logistics Manager (Booker) - Uses search_trips for real web data
		# IMPORTANT: Only search_trips tool - no other tools to avoid confusion
		logistics_tools = [search_trips]
		# FORCE tool usage by setting tool_choice - REMOVED to avoid infinite loop
		logistics_llm = llm.bind_tools(logistics_tools)
		
		logger.info(f"[GRAPH BUILD] Logistics tools: {[t.name for t in logistics_tools]}")

		async def logistics_manager(state: ChatState):
			msgs = state.get("messages", [])
			logistics_system = SystemMessage(content=logistics_system_prompt())
			filtered = [m for m in msgs if not isinstance(m, SystemMessage)]
			processed_msgs = [logistics_system] + filtered
			
			# DEBUG: Log what tools the LLM has
			logger.info(f"[DEBUG:logistics_manager] Tools bound: {[t.name for t in logistics_tools]}")
			logger.info(f"[DEBUG:logistics_manager] Message count: {len(processed_msgs)}")
			
			response = await logistics_llm.ainvoke(processed_msgs)
			
			# DEBUG: Log what the LLM responded with
			if hasattr(response, 'tool_calls') and response.tool_calls:
				logger.info(f"[DEBUG:logistics_manager] Tool calls: {response.tool_calls}")
			else:
				logger.info(f"[DEBUG:logistics_manager] No tool calls, text response length: {len(response.content) if response.content else 0}")
			
			return {"messages": [response]}


		# A. Local Guide (Researcher)
		guide_tools = [web_search, weather_lookup, search_images, culinary_research_tool]
		guide_llm = llm.bind_tools(guide_tools)

		async def local_guide(state: ChatState):
			msgs = state.get("messages", [])
			# Inject persona if not present
			if not isinstance(msgs[0], SystemMessage):
				msgs = [SystemMessage(content=system_prompt())] + msgs
			
			response = await guide_llm.ainvoke(msgs)
			return {"messages": [response]}

		# C. General Chat
		general_llm = llm # No tools needed for simple chat
		async def general_chat(state: ChatState):
			msgs = state.get("messages", [])
			response = await general_llm.ainvoke(msgs)
			return {"messages": [response]}

		# D. Culinary Finder (uses existing culinary_research_tool)
		culinary_tools = [culinary_research_tool, search_images, web_search]
		culinary_llm = llm.bind_tools(culinary_tools)

		
		async def culinary_finder(state: ChatState):
			msgs = state.get("messages", [])
			# Add culinary-specific system prompt
			culinary_system = SystemMessage(content=culinary_finder_system_prompt())
			filtered = [m for m in msgs if not isinstance(m, SystemMessage)]
			processed_msgs = [culinary_system] + filtered
			response = await culinary_llm.ainvoke(processed_msgs)
			return {"messages": [response]}


		# E. Hotel Finder (uses Amadeus/StayAPI hotel_search_tool)
		from tools.hotel_search_tool import hotel_search_tool
		hotel_tools = [hotel_search_tool, web_search, search_images]
		hotel_llm = llm.bind_tools(hotel_tools)

		async def hotel_finder(state: ChatState):
			msgs = state.get("messages", [])
			hotel_system = SystemMessage(content=hotel_finder_system_prompt())
			filtered = [m for m in msgs if not isinstance(m, SystemMessage)]
			processed_msgs = [hotel_system] + filtered
			response = await hotel_llm.ainvoke(processed_msgs)
			return {"messages": [response]}



		# F. Planner Redirect (returns ACTION instead of AI response)
		async def planner_redirect(state: ChatState):
			"""Return special action marker for FE to show button."""
			action_msg = AIMessage(
				content="Tôi có thể giúp bạn lập kế hoạch chi tiết! Hãy nhấn nút bên dưới để bắt đầu với công cụ Lập Kế Hoạch chuyên dụng của chúng tôi.",
				additional_kwargs={
					"action": {
						"type": "open_planner",
						"label": "🗓️ Lập kế hoạch chuyến đi",
						"description": "Mở công cụ lập lịch trình AI"
					}
				}
			)
			return {"messages": [action_msg]}

		# G. Emergency Helper
		emergency_llm = llm.bind_tools([web_search])
		
		async def emergency_helper(state: ChatState):
			msgs = state.get("messages", [])
			emergency_system = SystemMessage(content=emergency_helper_system_prompt())
			filtered = [m for m in msgs if not isinstance(m, SystemMessage)]
			processed_msgs = [emergency_system] + filtered
			response = await emergency_llm.ainvoke(processed_msgs)
			return {"messages": [response]}

		# --- 3. Graph Assembly ---
		graph = StateGraph(ChatState)
		
		graph.add_node("router", router_node)
		graph.add_node("local_guide", local_guide)
		graph.add_node("logistics_manager", logistics_manager)
		graph.add_node("general_chat", general_chat)
		graph.add_node("culinary_finder", culinary_finder)
		graph.add_node("hotel_finder", hotel_finder)
		graph.add_node("planner_redirect", planner_redirect)
		graph.add_node("emergency_helper", emergency_helper)
		
		# Tool Nodes (Generic listener for tool calls from any agent)
		# Deduplicate tools by name
		all_tools_map = {t.name: t for t in (guide_tools + culinary_tools + hotel_tools)}
		all_tools = list(all_tools_map.values())
		tool_node = ToolNode(tools=all_tools)
		graph.add_node("tools", tool_node)
		
		# SEPARATE tool node for logistics - ONLY has search_trips
		logistics_tool_node = ToolNode(tools=logistics_tools)
		logger.info(f"[GRAPH BUILD] Created logistics_tool_node with: {[t.name for t in logistics_tools]}")
		graph.add_node("logistics_tools", logistics_tool_node)

		# Edges
		graph.add_edge(START, "router")
		
		# All 7 intents mapping
		VALID_INTENTS = ["local_guide", "logistics_manager", "general_chat", 
						 "culinary_finder", "hotel_finder", "planner", "emergency_helper"]
		
		def route_decision(state: ChatState):
			# Map Router output to node names
			intent = state.get("intent")
			logger.info(f"[DEBUG:route_decision] Intent in state: '{intent}' vs Valid: {VALID_INTENTS}")
			
			if intent == "planner":
				return "planner_redirect"  # Special handling
			if intent in VALID_INTENTS:
				return intent
			
			logger.warning(f"[DEBUG:route_decision] Fallback to local_guide. Intent='{intent}' not in valid list")
			return "local_guide"  # Default fallback

		graph.add_conditional_edges("router", route_decision, {
			"local_guide": "local_guide",
			"logistics_manager": "logistics_manager",
			"general_chat": "general_chat",
			"culinary_finder": "culinary_finder",
			"hotel_finder": "hotel_finder",
			"planner_redirect": "planner_redirect",
			"emergency_helper": "emergency_helper"
		})

		# Agents to Tools or End
		# logistics_manager goes to its own tool node
		graph.add_conditional_edges("logistics_manager", tools_condition, {"tools": "logistics_tools", END: END})
		# Other agents go to shared tool node
		graph.add_conditional_edges("local_guide", tools_condition, {"tools": "tools", END: END})
		graph.add_conditional_edges("culinary_finder", tools_condition, {"tools": "tools", END: END})
		graph.add_conditional_edges("hotel_finder", tools_condition, {"tools": "tools", END: END})
		graph.add_conditional_edges("emergency_helper", tools_condition, {"tools": "tools", END: END})
		graph.add_edge("general_chat", END)
		graph.add_edge("planner_redirect", END)  # No tools, direct to END

		
		def route_tool_output(state: ChatState):
			intent = state.get("intent")
			if intent == "culinary_finder":
				return "culinary_finder"
			if intent == "hotel_finder":
				return "hotel_finder"
			if intent == "emergency_helper":
				return "emergency_helper"
			return "local_guide"  # Default

		graph.add_conditional_edges("tools", route_tool_output, {
			"local_guide": "local_guide",
			"culinary_finder": "culinary_finder",
			"hotel_finder": "hotel_finder",
			"emergency_helper": "emergency_helper"
		})
		
		# Logistics: after tool call, go back to LLM to format response naturally
		# The LLM will see the tool result and respond accordingly
		graph.add_edge("logistics_tools", "logistics_manager")

		return graph.compile(checkpointer=self._memory, interrupt_before=None)

	async def run(self, message: str, user_id: str | None, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
		ctx = context or {}
		logger.info("[agent] run trace_id={} user_id={}", ctx.get("trace_id"), user_id)
		
		# Initialize history properly
		history = ctx.get("history", [])
		valid_history = []
		for msg in history[-10:]:
			if msg.get("role") == "user":
				valid_history.append(HumanMessage(content=msg.get("content", "")))
			elif msg.get("role") == "ai":
				valid_history.append(AIMessage(content=msg.get("content", "")))
		
		# Add current message
		messages = valid_history + [HumanMessage(content=message)]
		
		# Memory thread
		thread_id = (ctx.get("thread_id") or user_id or ctx.get("trace_id") or "default")
		config = {"configurable": {"thread_id": str(thread_id)}}
		# Run the graph with initial messages (System + Human)
		inputs: ChatState = {  # type: ignore[assignment]
			"messages": messages,
			"context": ctx,
			"user_id": user_id,
			"trace_id": ctx.get("trace_id"),
		}
		
		final_text = ""
		# Use astream for async support
		async for event in self.graph.astream(inputs, config):
			if not event: continue
			for value in event.values():
				if not value: continue
				msgs = value.get("messages") or []
				if msgs:
					final_text = msgs[-1].content or final_text
					
		return {"response": final_text, "cards": None, "intent": None, "errors": None, "sources": None}

	async def stream(self, message: str, user_id: str | None, context: Dict[str, Any] | None = None, raw: bool = False):
		ctx = context or {}
		history = ctx.get("history", [])
		valid_history = []
		for msg in history[-10:]:
			if msg.get("role") == "user":
				valid_history.append(HumanMessage(content=msg.get("content", "")))
			elif msg.get("role") == "ai":
				valid_history.append(AIMessage(content=msg.get("content", "")))
		
		messages = valid_history + [HumanMessage(content=message)]
		
		thread_id = (ctx.get("thread_id") or user_id or ctx.get("trace_id") or "default")
		config = {"configurable": {"thread_id": str(thread_id)}}
		
		inputs: ChatState = { 
			"messages": messages,
			"context": ctx,
			"user_id": user_id,
			"trace_id": ctx.get("trace_id"),
		}
		
		# Valid generator nodes that we want to stream output from
		VALID_GENERATORS = {"local_guide", "logistics_manager", "general_chat", "culinary_finder", "hotel_finder", "emergency_helper"}
		
		async for ev in self.graph.astream_events(inputs, config, version="v1"):
			if raw:
				yield ev
				continue
			
			# Filter only chat model stream events AND exclude router events
			if ev["event"] == "on_chat_model_stream":
				# Metadata usually contains 'langgraph_node'
				meta = ev.get("metadata", {})
				node_name = meta.get("langgraph_node", "")
				
				# Only yield if coming from a generator agent, NOT the router
				# Router produces JSON stream which we don't want in UI
				if node_name in VALID_GENERATORS:
					data = ev["data"]
					chunk = data.get("chunk")
					if chunk and chunk.content:
						yield chunk.content



