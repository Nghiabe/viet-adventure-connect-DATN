"""
MongoDB connection manager for AI Service.
Uses motor for async MongoDB operations.
"""
from __future__ import annotations
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from loguru import logger
import os
from functools import lru_cache


class MongoDBManager:
    """Async MongoDB connection manager (singleton pattern)."""
    
    _instance: Optional['MongoDBManager'] = None
    _client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None
    
    def __new__(cls) -> 'MongoDBManager':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def client(self) -> AsyncIOMotorClient:
        if self._client is None:
            uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            self._client = AsyncIOMotorClient(uri)
            logger.info("[db] MongoDB client connected to: {}", uri[:50] + "...")
        return self._client
    
    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            # Try to get db name from env or extract from URI
            db_name = os.getenv("MONGODB_DB_NAME") or os.getenv("MONGODB_COLLECTION", "TRAVELDB")
            self._db = self.client[db_name]
            logger.info("[db] Using database: {}", db_name)
        return self._db
    
    async def close(self):
        """Close MongoDB connection."""
        if self._client:
            self._client.close()
            self._client = None
            self._db = None
            logger.info("[db] MongoDB connection closed")


# Global instance
_manager: Optional[MongoDBManager] = None


def get_db_manager() -> MongoDBManager:
    """Get MongoDB manager singleton."""
    global _manager
    if _manager is None:
        _manager = MongoDBManager()
    return _manager


def get_db() -> AsyncIOMotorDatabase:
    """Get database instance."""
    return get_db_manager().db


# Collection names
TOURS_COLLECTION = "tours"
DESTINATIONS_COLLECTION = "destinations"
ITINERARIES_COLLECTION = "itineraries"
