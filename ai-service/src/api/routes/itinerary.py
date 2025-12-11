"""
Itinerary API routes.
Requires authentication for all operations.
"""
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from loguru import logger

from db.itinerary_repository import ItineraryRepository, ItineraryCreate, ItineraryUpdate

router = APIRouter()


class SaveItineraryRequest(BaseModel):
    """Request to save an itinerary."""
    name: str
    destination: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    travelers: int = 1
    budget: Optional[str] = None
    travel_style: Optional[str] = None
    itinerary_content: Dict[str, Any] = {}
    hotel: Optional[Dict[str, Any]] = None
    selected_tours: List[str] = []
    total_cost: float = 0.0


class UpdateItineraryRequest(BaseModel):
    """Request to update an itinerary."""
    name: Optional[str] = None
    status: Optional[str] = None
    current_day: Optional[int] = None
    completed_slots: Optional[List[str]] = None


class MarkSlotRequest(BaseModel):
    """Request to mark a slot as completed."""
    slot_id: str


@router.post("/itineraries")
async def save_itinerary(
    request: SaveItineraryRequest,
    x_user_id: str = Header(..., alias="X-User-Id")
):
    """
    Save a new itinerary for the authenticated user.
    Requires X-User-Id header from frontend auth.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        itinerary = ItineraryCreate(
            user_id=x_user_id,
            name=request.name,
            destination=request.destination,
            start_date=request.start_date,
            end_date=request.end_date,
            travelers=request.travelers,
            budget=request.budget,
            travel_style=request.travel_style,
            itinerary_content=request.itinerary_content,
            hotel=request.hotel,
            selected_tours=request.selected_tours,
            total_cost=request.total_cost,
            status="saved"
        )
        
        itinerary_id = await ItineraryRepository.create(itinerary)
        
        logger.info("[itinerary_api] Saved itinerary {} for user {}", itinerary_id, x_user_id[:10])
        
        return {
            "success": True,
            "id": itinerary_id,
            "message": "Kế hoạch đã được lưu thành công!"
        }
    except Exception as e:
        logger.error("[itinerary_api] Error saving itinerary: {}", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/itineraries")
async def get_user_itineraries(
    x_user_id: str = Header(..., alias="X-User-Id"),
    status: Optional[str] = None,
    limit: int = 20,
    page: int = 1
):
    """
    Get all itineraries for the authenticated user.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        skip = (page - 1) * limit
        itineraries = await ItineraryRepository.find_by_user(
            user_id=x_user_id,
            status=status,
            limit=limit,
            skip=skip
        )
        
        total = await ItineraryRepository.count_by_user(x_user_id)
        
        return {
            "success": True,
            "data": itineraries,
            "total": total,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        logger.error("[itinerary_api] Error getting itineraries: {}", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/itineraries/{itinerary_id}")
async def get_itinerary(
    itinerary_id: str,
    x_user_id: str = Header(..., alias="X-User-Id")
):
    """
    Get a single itinerary by ID.
    User must own the itinerary.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        itinerary = await ItineraryRepository.find_by_id(itinerary_id)
        
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        
        # Check ownership
        if itinerary.get("user_id") != x_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "data": itinerary
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[itinerary_api] Error getting itinerary {}: {}", itinerary_id, e)
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/itineraries/{itinerary_id}")
async def update_itinerary(
    itinerary_id: str,
    request: UpdateItineraryRequest,
    x_user_id: str = Header(..., alias="X-User-Id")
):
    """
    Update an itinerary.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Check ownership first
        itinerary = await ItineraryRepository.find_by_id(itinerary_id)
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        if itinerary.get("user_id") != x_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        update = ItineraryUpdate(
            name=request.name,
            status=request.status,
            current_day=request.current_day,
            completed_slots=request.completed_slots
        )
        
        success = await ItineraryRepository.update(itinerary_id, update)
        
        return {
            "success": success,
            "message": "Cập nhật thành công" if success else "Không có thay đổi"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[itinerary_api] Error updating itinerary: {}", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/itineraries/{itinerary_id}")
async def delete_itinerary(
    itinerary_id: str,
    x_user_id: str = Header(..., alias="X-User-Id")
):
    """
    Delete an itinerary.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        # Check ownership first
        itinerary = await ItineraryRepository.find_by_id(itinerary_id)
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        if itinerary.get("user_id") != x_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        success = await ItineraryRepository.delete(itinerary_id)
        
        return {
            "success": success,
            "message": "Đã xóa kế hoạch" if success else "Không thể xóa"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[itinerary_api] Error deleting itinerary: {}", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/itineraries/{itinerary_id}/start")
async def start_itinerary(
    itinerary_id: str,
    x_user_id: str = Header(..., alias="X-User-Id")
):
    """
    Start tracking an itinerary (activate tracking mode).
    Sets status to 'active' and initializes tracking fields.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        itinerary = await ItineraryRepository.find_by_id(itinerary_id)
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        if itinerary.get("user_id") != x_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        update = ItineraryUpdate(
            status="active",
            current_day=1,
            completed_slots=[]
        )
        
        success = await ItineraryRepository.update(itinerary_id, update)
        
        return {
            "success": success,
            "message": "Đã bắt đầu hành trình! Chúc bạn có chuyến đi tuyệt vời!" if success else "Lỗi"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[itinerary_api] Error starting itinerary: {}", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/itineraries/{itinerary_id}/complete-slot")
async def complete_slot(
    itinerary_id: str,
    request: MarkSlotRequest,
    x_user_id: str = Header(..., alias="X-User-Id")
):
    """
    Mark a slot as completed during tracking.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        itinerary = await ItineraryRepository.find_by_id(itinerary_id)
        if not itinerary:
            raise HTTPException(status_code=404, detail="Itinerary not found")
        if itinerary.get("user_id") != x_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        success = await ItineraryRepository.mark_slot_completed(itinerary_id, request.slot_id)
        
        return {
            "success": success,
            "message": "Đã hoàn thành!" if success else "Lỗi"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("[itinerary_api] Error completing slot: {}", e)
        raise HTTPException(status_code=500, detail=str(e))
