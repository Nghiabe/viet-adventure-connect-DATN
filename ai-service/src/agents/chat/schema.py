from pydantic import BaseModel, Field
from typing import Literal

class RouterOutput(BaseModel):
    """Router output with 7 travel-focused intents."""
    destination: Literal[
        "local_guide",        # Travel info, tips, weather, destinations
        "culinary_finder",    # Food, restaurants, local delicacies
        "hotel_finder",       # Hotel search, comparison
        "logistics_manager",  # Book transport, tickets
        "planner",            # Create trip itinerary → Redirect to Web Wizard
        "emergency_helper",   # SOS, medical, lost items
        "general_chat"        # Greetings, off-topic
    ] = Field(
        description="The best agent to handle the user request"
    )

