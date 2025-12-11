"""
API routes for Tour operations.
Provides endpoints for frontend to fetch tours and for AI to upsert scraped tours.
"""
from __future__ import annotations
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from loguru import logger

from db.tour_repository import TourRepository, TourCreate, TourImage, TourSchedule


router = APIRouter(prefix="/tours", tags=["tours"])


# ============== Request/Response Models ==============

class TourSearchParams(BaseModel):
    location: Optional[str] = None
    category: Optional[str] = None
    query: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    limit: int = Field(default=20, ge=1, le=100)
    skip: int = Field(default=0, ge=0)


class TourUpsertRequest(BaseModel):
    """Request for upserting tours (from AI agent)."""
    tours: List[TourCreate]


class TourListResponse(BaseModel):
    success: bool
    tours: List[dict]
    count: int
    total: Optional[int] = None


class TourDetailResponse(BaseModel):
    success: bool
    tour: Optional[dict]


class UpsertResponse(BaseModel):
    success: bool
    upserted_count: int
    ids: List[str]


# ============== Endpoints ==============

@router.get("/search", response_model=TourListResponse)
async def search_tours(
    location: Optional[str] = Query(None, description="Location to search (e.g., 'Đà Nẵng')"),
    category: Optional[str] = Query(None, description="Category filter"),
    query: Optional[str] = Query(None, description="Text search query"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0)
):
    """
    Search tours with filters.
    
    Examples:
    - /tours/search?location=Đà Nẵng
    - /tours/search?category=am_thuc&limit=10
    - /tours/search?query=ẩm thực đường phố
    """
    try:
        tours = await TourRepository.search(
            location=location,
            category=category,
            query=query,
            min_price=min_price,
            max_price=max_price,
            limit=limit,
            skip=skip
        )
        
        total = await TourRepository.count(location=location, category=category)
        
        return TourListResponse(
            success=True,
            tours=tours,
            count=len(tours),
            total=total
        )
    except Exception as e:
        logger.exception("[tours_api] Search error: {}", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{tour_id}", response_model=TourDetailResponse)
async def get_tour(tour_id: str):
    """Get tour by ID."""
    try:
        tour = await TourRepository.find_by_id(tour_id)
        
        if not tour:
            raise HTTPException(status_code=404, detail="Tour not found")
        
        return TourDetailResponse(success=True, tour=tour)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[tours_api] Get tour error: {}", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upsert", response_model=UpsertResponse)
async def upsert_tours(request: TourUpsertRequest):
    """
    Upsert tours (for AI agent scraping).
    Deduplicates by sourceUrl.
    """
    try:
        ids = await TourRepository.upsert_many(request.tours)
        
        logger.info("[tours_api] Upserted {} tours", len(ids))
        
        return UpsertResponse(
            success=True,
            upserted_count=len(ids),
            ids=ids
        )
    except Exception as e:
        logger.exception("[tours_api] Upsert error: {}", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/by-destination/{destination}", response_model=TourListResponse)
async def get_tours_by_destination(
    destination: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Get tours by destination name."""
    try:
        tours = await TourRepository.get_by_destination(destination, limit=limit)
        
        return TourListResponse(
            success=True,
            tours=tours,
            count=len(tours)
        )
    except Exception as e:
        logger.exception("[tours_api] Get by destination error: {}", e)
        raise HTTPException(status_code=500, detail=str(e))
