from fastapi import APIRouter
from api.routes.chat import router as chat_router
from api.routes.health import router as health_router
from api.routes.planner import router as planner_router

api_router = APIRouter()
api_router.include_router(health_router, prefix="", tags=["health"])
api_router.include_router(chat_router, prefix="/agent", tags=["agent"])
api_router.include_router(planner_router, prefix="/planner", tags=["planner"])

from api.routes.agents import router as agents_router
api_router.include_router(agents_router, prefix="/agents", tags=["micro-agents"])

from api.routes.tours import router as tours_router
api_router.include_router(tours_router, prefix="", tags=["tours"])

from api.routes.itinerary import router as itinerary_router
api_router.include_router(itinerary_router, prefix="", tags=["itineraries"])
