from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from config import Settings, get_settings
from api.router import api_router
import os


def create_app() -> FastAPI:
	settings: Settings = get_settings()

	application = FastAPI(
		title="Viet Adventure AI Service",
		version="0.1.0",
	)

	# CORS
	application.add_middleware(
		CORSMiddleware,
		allow_origins=["*"],
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	@application.get("/health")
	async def health() -> dict:
		return {"status": "ok"}

	application.include_router(api_router, prefix="/v1")

	# Validate required settings in production
	if os.getenv("ENV", "development").lower() == "production":
		missing: list[str] = []
		if not settings.megallm_api_key:
			missing.append("MEGALLM_API_KEY")
		if not os.getenv("FIRECRAWL_API_KEY"):
			missing.append("FIRECRAWL_API_KEY")
		if missing:
			raise RuntimeError(f"Missing required environment variables in production: {', '.join(missing)}")

	logger.info("AI Service initialized with backend: {}", settings.backend_base_url)
	return application


