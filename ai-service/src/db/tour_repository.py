"""
Tour model and repository for async MongoDB operations.
Matches the TypeScript Tour.ts schema.
"""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from loguru import logger

from db.connection import get_db, TOURS_COLLECTION


# ============== Pydantic Models ==============

class TourImage(BaseModel):
    url: str
    thumbnail: Optional[str] = None
    caption: Optional[str] = None


class TourSchedule(BaseModel):
    morning: Optional[str] = None
    afternoon: Optional[str] = None
    evening: Optional[str] = None


class TourCreate(BaseModel):
    """Model for creating/upserting a tour."""
    title: str
    description: Optional[str] = None
    price: float
    duration: str
    max_group_size: Optional[int] = None
    
    # Location
    location: str = ""
    
    # Enriched fields
    route: str = ""
    highlights: List[str] = Field(default_factory=list)
    schedule: Optional[TourSchedule] = None
    category: str = "tham_quan"  # tham_quan | am_thuc | van_hoa | trai_nghiem | phieu_luu
    tips: str = ""
    
    # Includes/Excludes
    inclusions: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    
    # Images
    main_image: Optional[str] = None
    image_gallery: List[str] = Field(default_factory=list)
    images: List[TourImage] = Field(default_factory=list)
    
    # Source
    source: str = "web_scrape"  # web_scrape | user_created | partner
    source_url: Optional[str] = None
    
    # Ratings
    average_rating: float = 0.0
    review_count: int = 0
    match_score: Optional[float] = None
    
    # Status
    status: str = "published"
    is_sustainable: bool = False


class TourResponse(TourCreate):
    """Tour response with ID."""
    id: str = Field(alias="_id")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


# ============== Repository ==============

class TourRepository:
    """Async repository for Tour operations."""
    
    @staticmethod
    def _to_db_dict(tour: TourCreate) -> Dict[str, Any]:
        """Convert Pydantic model to MongoDB document."""
        data = tour.model_dump(by_alias=False)
        
        # Convert snake_case to camelCase for DB
        db_data = {
            "title": data["title"],
            "description": data.get("description"),
            "price": data["price"],
            "duration": data["duration"],
            "maxGroupSize": data.get("max_group_size"),
            "location": data.get("location", ""),
            "route": data.get("route", ""),
            "highlights": data.get("highlights", []),
            "schedule": data.get("schedule") or {},
            "category": data.get("category", "tham_quan"),
            "tips": data.get("tips", ""),
            "inclusions": data.get("inclusions", []),
            "exclusions": data.get("exclusions", []),
            "mainImage": data.get("main_image"),
            "imageGallery": data.get("image_gallery", []),
            "images": [img if isinstance(img, dict) else img.model_dump() for img in data.get("images", [])],
            "source": data.get("source", "web_scrape"),
            "sourceUrl": data.get("source_url"),
            "averageRating": data.get("average_rating", 0),
            "reviewCount": data.get("review_count", 0),
            "matchScore": data.get("match_score"),
            "status": data.get("status", "published"),
            "isSustainable": data.get("is_sustainable", False),
            "updatedAt": datetime.utcnow()
        }
        return db_data
    
    @staticmethod
    def _from_db_dict(doc: Dict[str, Any]) -> Dict[str, Any]:
        """Convert MongoDB document to response dict."""
        if not doc:
            return None
        
        return {
            "_id": str(doc.get("_id", "")),
            "title": doc.get("title", ""),
            "description": doc.get("description"),
            "price": doc.get("price", 0),
            "duration": doc.get("duration", ""),
            "max_group_size": doc.get("maxGroupSize"),
            "location": doc.get("location", ""),
            "route": doc.get("route", ""),
            "highlights": doc.get("highlights", []),
            "schedule": doc.get("schedule", {}),
            "category": doc.get("category", "tham_quan"),
            "tips": doc.get("tips", ""),
            "inclusions": doc.get("inclusions", []),
            "exclusions": doc.get("exclusions", []),
            "main_image": doc.get("mainImage"),
            "image_gallery": doc.get("imageGallery", []),
            "images": doc.get("images", []),
            "source": doc.get("source", "web_scrape"),
            "source_url": doc.get("sourceUrl"),
            "average_rating": doc.get("averageRating", 0),
            "review_count": doc.get("reviewCount", 0),
            "match_score": doc.get("matchScore"),
            "status": doc.get("status", "published"),
            "is_sustainable": doc.get("isSustainable", False),
            "created_at": doc.get("createdAt"),
            "updated_at": doc.get("updatedAt")
        }
    
    @staticmethod
    async def upsert_by_url(tour: TourCreate) -> str:
        """
        Upsert tour by sourceUrl.
        If sourceUrl exists, update. Otherwise, insert.
        Returns the tour ID.
        """
        db = get_db()
        collection = db[TOURS_COLLECTION]
        
        db_data = TourRepository._to_db_dict(tour)
        source_url = db_data.get("sourceUrl")
        
        if source_url:
            # Upsert by sourceUrl
            result = await collection.update_one(
                {"sourceUrl": source_url},
                {
                    "$set": db_data,
                    "$setOnInsert": {"createdAt": datetime.utcnow()}
                },
                upsert=True
            )
            
            if result.upserted_id:
                logger.info("[tour_repo] Inserted new tour: {}", tour.title[:50])
                return str(result.upserted_id)
            else:
                # Find the existing document
                existing = await collection.find_one({"sourceUrl": source_url})
                logger.info("[tour_repo] Updated existing tour: {}", tour.title[:50])
                return str(existing["_id"]) if existing else None
        else:
            # No sourceUrl, just insert
            db_data["createdAt"] = datetime.utcnow()
            result = await collection.insert_one(db_data)
            logger.info("[tour_repo] Inserted tour without URL: {}", tour.title[:50])
            return str(result.inserted_id)
    
    @staticmethod
    async def upsert_many(tours: List[TourCreate]) -> List[str]:
        """Upsert multiple tours. Returns list of IDs."""
        ids = []
        for tour in tours:
            tour_id = await TourRepository.upsert_by_url(tour)
            if tour_id:
                ids.append(tour_id)
        return ids
    
    @staticmethod
    async def find_by_id(tour_id: str) -> Optional[Dict[str, Any]]:
        """Find tour by ID."""
        db = get_db()
        collection = db[TOURS_COLLECTION]
        
        try:
            doc = await collection.find_one({"_id": ObjectId(tour_id)})
            return TourRepository._from_db_dict(doc) if doc else None
        except Exception as e:
            logger.warning("[tour_repo] Error finding tour {}: {}", tour_id, e)
            return None
    
    @staticmethod
    async def search(
        location: Optional[str] = None,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        query: Optional[str] = None,
        limit: int = 20,
        skip: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Search tours with filters.
        """
        db = get_db()
        collection = db[TOURS_COLLECTION]
        
        # Build query
        filter_query: Dict[str, Any] = {"status": "published"}
        
        if location:
            # Case-insensitive regex search
            filter_query["location"] = {"$regex": location, "$options": "i"}
        
        if category:
            filter_query["category"] = category
        
        if min_price is not None or max_price is not None:
            filter_query["price"] = {}
            if min_price is not None:
                filter_query["price"]["$gte"] = min_price
            if max_price is not None:
                filter_query["price"]["$lte"] = max_price
        
        if query:
            # Text search on title and description
            filter_query["$or"] = [
                {"title": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
                {"route": {"$regex": query, "$options": "i"}}
            ]
        
        logger.info("[tour_repo] Search with filter: {}", filter_query)
        
        cursor = collection.find(filter_query).sort("updatedAt", -1).skip(skip).limit(limit)
        
        results = []
        async for doc in cursor:
            results.append(TourRepository._from_db_dict(doc))
        
        logger.info("[tour_repo] Found {} tours", len(results))
        return results
    
    @staticmethod
    async def count(
        location: Optional[str] = None,
        category: Optional[str] = None
    ) -> int:
        """Count tours matching filters."""
        db = get_db()
        collection = db[TOURS_COLLECTION]
        
        filter_query: Dict[str, Any] = {"status": "published"}
        
        if location:
            filter_query["location"] = {"$regex": location, "$options": "i"}
        if category:
            filter_query["category"] = category
        
        return await collection.count_documents(filter_query)
    
    @staticmethod
    async def get_by_destination(destination: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get tours by destination/location."""
        return await TourRepository.search(location=destination, limit=limit)
    
    @staticmethod
    async def find_by_urls(urls: List[str]) -> List[Dict[str, Any]]:
        """Find tours by list of sourceUrls."""
        db = get_db()
        collection = db[TOURS_COLLECTION]
        
        cursor = collection.find({"sourceUrl": {"$in": urls}})
        results = []
        async for doc in cursor:
            results.append(TourRepository._from_db_dict(doc))
        
        return results
