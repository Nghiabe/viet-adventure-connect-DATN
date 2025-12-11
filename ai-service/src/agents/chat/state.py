from __future__ import annotations
from typing import Annotated, TypedDict, Dict, Any, Optional
from langgraph.graph.message import add_messages


class ChatState(TypedDict, total=False):
	# Aggregated chat history managed by LangGraph
	messages: Annotated[list, add_messages]
	# Optional metadata/context carried alongside
	context: Dict[str, Any]
	user_id: Optional[str]
	trace_id: Optional[str]
	intent: Optional[str]




