from functools import lru_cache
from pydantic import BaseModel, Field
import os
from dotenv import load_dotenv

# Ensure .env is loaded for local/dev runs
load_dotenv()


class Settings(BaseModel):
	backend_base_url: str = Field(default_factory=lambda: os.getenv("BACKEND_BASE_URL", "http://localhost:5173"))
	openai_api_key: str = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
	google_api_key: str = Field(default_factory=lambda: os.getenv("GOOGLE_API_KEY", ""))
	openweather_api_key: str = Field(default_factory=lambda: os.getenv("OPENWEATHER_API_KEY", ""))
	amadeus_api_key: str = Field(default_factory=lambda: os.getenv("AMADEUS_API_KEY", ""))
	amadeus_api_secret: str = Field(default_factory=lambda: os.getenv("AMADEUS_API_SECRET", ""))
	stayapi_key: str = Field(default_factory=lambda: os.getenv("STAYAPI_KEY", ""))
	service_port: int = Field(default_factory=lambda: int(os.getenv("SERVICE_PORT", "8081")))
	mongodb_uri: str = Field(default_factory=lambda: os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
	mongodb_db_name: str = Field(default_factory=lambda: os.getenv("MONGODB_DB_NAME", "viet_adventure_ai"))
	mongodb_collection: str = Field(default_factory=lambda: os.getenv("MONGODB_COLLECTION", "agent_checkpoints"))
	
	# MegaLLM
	megallm_api_key: str = Field(default_factory=lambda: os.getenv("MEGALLM_API_KEY", ""))
	megallm_base_url: str = Field(default_factory=lambda: os.getenv("MEGALLM_BASE_URL", "https://ai.megallm.io/v1"))
	
	# OpenRouter (fallback when MegaLLM fails)
	openrouter_api_key: str = Field(default_factory=lambda: os.getenv("OPENROUTER_API_KEY", ""))
	openrouter_base_url: str = Field(default_factory=lambda: os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"))
	openrouter_model: str = Field(default_factory=lambda: os.getenv("OPENROUTER_MODEL", "qwen/qwen3-30b-a3b:free"))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
	return Settings()


