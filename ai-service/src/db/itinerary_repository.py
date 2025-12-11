"""
Itinerary repository for async MongoDB operations.
Stores user-generated travel plans with full details.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from loguru import logger

from db.connection import get_db

ITINERARIES_COLLECTION = "itineraries"


# ============== Pydantic Models ==============

class ItineraryCreate(BaseModel):
    """Model for creating an itinerary."""
    user_id: str
    name: str
    destination: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    travelers: int = 1
    budget: Optional[str] = None
    travel_style: Optional[str] = None
    
    # The full itinerary content from AI
    itinerary_content: Dict[str, Any] = Field(default_factory=dict)
    
    # Selected hotel info
    hotel: Optional[Dict[str, Any]] = None
    
    # Selected tours
    selected_tours: List[str] = Field(default_factory=list)
    
    # Status
    status: str = "draft"  # draft | saved | active | completed
    
    # Total cost estimate
    total_cost: float = 0.0


class ItineraryUpdate(BaseModel):
    """Model for updating an itinerary."""
    name: Optional[str] = None
    status: Optional[str] = None
    itinerary_content: Optional[Dict[str, Any]] = None
    current_day: Optional[int] = None
    completed_slots: Optional[List[str]] = None


# ============== Repository ==============

class ItineraryRepository:
    """Async repository for Itinerary operations."""
    
    @staticmethod
    def _to_db_dict(itinerary: ItineraryCreate) -> Dict[str, Any]:
        """Convert Pydantic model to MongoDB document."""
        data = itinerary.model_dump()
        
        db_data = {
            "userId": data["user_id"],
            "name": data["name"],
            "destination": data["destination"],
            "startDate": data.get("start_date"),
            "endDate": data.get("end_date"),
            "travelers": data.get("travelers", 1),
            "budget": data.get("budget"),
            "travelStyle": data.get("travel_style"),
            "itineraryContent": data.get("itinerary_content", {}),
            "hotel": data.get("hotel"),
            "selectedTours": data.get("selected_tours", []),
            "status": data.get("status", "draft"),
            "totalCost": data.get("total_cost", 0),
            "currentDay": 1,
            "completedSlots": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        return db_data
    
    @staticmethod
    def _from_db_dict(doc: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Convert MongoDB document to response dict."""
        if not doc:
            return None
        
        return {
            "_id": str(doc.get("_id", "")),
            "user_id": doc.get("userId", ""),
            "name": doc.get("name", ""),
            "destination": doc.get("destination", ""),
            "start_date": doc.get("startDate"),
            "end_date": doc.get("endDate"),
            "travelers": doc.get("travelers", 1),
            "budget": doc.get("budget"),
            "travel_style": doc.get("travelStyle"),
            "itinerary_content": doc.get("itineraryContent", {}),
            "hotel": doc.get("hotel"),
            "selected_tours": doc.get("selectedTours", []),
            "status": doc.get("status", "draft"),
            "total_cost": doc.get("totalCost", 0),
            "current_day": doc.get("currentDay", 1),
            "completed_slots": doc.get("completedSlots", []),
            "created_at": doc.get("createdAt"),
            "updated_at": doc.get("updatedAt")
        }
    
    @staticmethod
    async def create(itinerary: ItineraryCreate) -> str:
        """Create a new itinerary. Returns the ID."""
        db = get_db()
        collection = db[ITINERARIES_COLLECTION]
        
        db_data = ItineraryRepository._to_db_dict(itinerary)
        result = await collection.insert_one(db_data)
        
        logger.info("[itinerary_repo] Created itinerary: {} for user: {}", 
                    itinerary.name[:30], itinerary.user_id[:10])
        return str(result.inserted_id)
    
    @staticmethod
    async def find_by_id(itinerary_id: str) -> Optional[Dict[str, Any]]:
        """Find itinerary by ID."""
        db = get_db()
        collection = db[ITINERARIES_COLLECTION]
        
        try:
            doc = await collection.find_one({"_id": ObjectId(itinerary_id)})
            return ItineraryRepository._from_db_dict(doc)
        except Exception as e:
            logger.warning("[itinerary_repo] Error finding itinerary {}: {}", itinerary_id, e)
            return None
    
    @staticmethod
    async def find_by_user(
        user_id: str,
        status: Optional[str] = None,
        limit: int = 20,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """Find all itineraries for a user."""
        db = get_db()
        collection = db[ITINERARIES_COLLECTION]
        
        query: Dict[str, Any] = {"userId": user_id}
        if status:
            query["status"] = status
        
        cursor = collection.find(query).sort("updatedAt", -1).skip(skip).limit(limit)
        
        results = []
        async for doc in cursor:
            results.append(ItineraryRepository._from_db_dict(doc))
        
        logger.info("[itinerary_repo] Found {} itineraries for user {}", len(results), user_id[:10])
        return results
    
    @staticmethod
    async def update(itinerary_id: str, updates: ItineraryUpdate) -> bool:
        """Update an itinerary. Returns True if successful."""
        db = get_db()
        collection = db[ITINERARIES_COLLECTION]
        
        update_data = {}
        if updates.name is not None:
            update_data["name"] = updates.name
        if updates.status is not None:
            update_data["status"] = updates.status
        if updates.itinerary_content is not None:
            update_data["itineraryContent"] = updates.itinerary_content
        if updates.current_day is not None:
            update_data["currentDay"] = updates.current_day
        if updates.completed_slots is not None:
            update_data["completedSlots"] = updates.completed_slots
        
        update_data["updatedAt"] = datetime.utcnow()
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(itinerary_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.warning("[itinerary_repo] Error updating itinerary {}: {}", itinerary_id, e)
            return False
    
    @staticmethod
    async def delete(itinerary_id: str) -> bool:
        """Delete an itinerary. Returns True if successful."""
        db = get_db()
        collection = db[ITINERARIES_COLLECTION]
        
        try:
            result = await collection.delete_one({"_id": ObjectId(itinerary_id)})
            return result.deleted_count > 0
        except Exception as e:
            logger.warning("[itinerary_repo] Error deleting itinerary {}: {}", itinerary_id, e)
            return False
    
    @staticmethod
    async def mark_slot_completed(itinerary_id: str, slot_id: str) -> bool:
        """Mark a slot as completed (for tracking mode)."""
        db = get_db()
        collection = db[ITINERARIES_COLLECTION]
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(itinerary_id)},
                {
                    "$addToSet": {"completedSlots": slot_id},
                    "$set": {"updatedAt": datetime.utcnow()}
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.warning("[itinerary_repo] Error marking slot completed: {}", e)
            return False
    
    @staticmethod
    async def set_current_day(itinerary_id: str, day: int) -> bool:
        """Set the current active day (for tracking mode)."""
        db = get_db()
        collection = db[ITINERARIES_COLLECTION]
        
        try:
            result = await collection.update_one(
                {"_id": ObjectId(itinerary_id)},
                {
                    "$set": {
                        "currentDay": day,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            logger.warning("[itinerary_repo] Error setting current day: {}", e)
            return False
    
    @staticmethod  
    async def count_by_user(user_id: str) -> int:
        """Count itineraries for a user."""
        db = get_db()
        collection = db[ITINERARIES_COLLECTION]
        return await collection.count_documents({"userId": user_id})
