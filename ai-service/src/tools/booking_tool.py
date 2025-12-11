from typing import Any, Dict, List, Optional
from langchain_core.tools import tool
import random
from datetime import datetime
from loguru import logger

TRANSPORTS = [
    {"type": "grab_bike", "name": "GrabBike", "base_price": 12000, "price_per_km": 4000},
    {"type": "grab_car", "name": "GrabCar 4 chỗ", "base_price": 25000, "price_per_km": 9000},
    {"type": "grab_car_7", "name": "GrabCar 7 chỗ", "base_price": 30000, "price_per_km": 11000},
    {"type": "taxi", "name": "Taxi Mai Linh", "base_price": 20000, "price_per_km": 10000},
]

DRIVERS = [
    {"name": "Nguyễn Văn A", "plate": "43A-123.45", "rating": 4.9},
    {"name": "Trần Thị B", "plate": "92A-567.89", "rating": 4.8},
    {"name": "Lê Văn C", "plate": "43H-999.99", "rating": 5.0},
    {"name": "Phạm Văn D", "plate": "43K-555.55", "rating": 4.7},
]

@tool
def book_transport(
    transport_type: str,
    pickup_location: str,
    dropoff_location: str,
    pickup_time: Optional[str] = None
) -> Dict[str, Any]:
    """
    Book a transport (Grab, Taxi, etc.) for the user.
    
    Args:
        transport_type: check available types (grab_bike, grab_car, etc.)
        pickup_location: Address or place name
        dropoff_location: Address or place name
        pickup_time: 'now' or specific time (e.g., '2023-10-20 14:00')
    """
    logger.info(f"[tool:book_transport] type={transport_type} from={pickup_location} to={dropoff_location}")
    
    # Simulate processing delay
    import time
    time.sleep(1) # Fake network delay
    
    # Find transport config
    transport = next((t for t in TRANSPORTS if t["type"] in transport_type.lower() or transport_type.lower() in t["type"]), None)
    if not transport:
        # Default to GrabCar if unclear
        transport = TRANSPORTS[1]
        
    # Mock distance and price
    distance_km = random.uniform(2.0, 15.0)
    price = transport["base_price"] + (distance_km * transport["price_per_km"])
    # Round to thousands
    price = round(price / 1000) * 1000
    
    driver = random.choice(DRIVERS)
    
    eta_mins = random.randint(2, 10)
    
    return {
        "status": "success",
        "booking_id": f"BK-{random.randint(10000, 99999)}",
        "provider": transport["name"],
        "driver": {
            "name": driver["name"],
            "plate": driver["plate"],
            "rating": driver["rating"]
        },
        "trip_details": {
            "from": pickup_location,
            "to": dropoff_location,
            "distance_km": round(distance_km, 1),
            "estimated_price": price,
            "currency": "VND"
        },
        "eta_pickup": f"{eta_mins} phút",
        "message": f"Đã tìm thấy tài xế! {driver['name']} ({driver['plate']}) đang đến đón bạn."
    }

@tool
def book_ticket(
    attraction_name: str,
    quantity: int,
    date: str,
    ticket_type: str = "standard"
) -> Dict[str, Any]:
    """
    Book tickets for an attraction or tour.
    
    Args:
        attraction_name: Name of the place (e.g., Ba Na Hills, Hoi An Memories)
        quantity: Number of tickets
        date: Date of visit (YYYY-MM-DD or 'tomorrow')
        ticket_type: 'standard', 'vip', 'child', etc.
    """
    logger.info(f"[tool:book_ticket] place={attraction_name} qty={quantity} date={date}")
    
    # Mock pricing logic
    base_price = 100000 # Default
    if "ba na" in attraction_name.lower():
        base_price = 900000
    elif "hoi an" in attraction_name.lower():
        base_price = 150000
    elif "than tai" in attraction_name.lower():
        base_price = 450000
    
    if "vip" in ticket_type.lower():
        base_price *= 1.5
        
    total_price = base_price * quantity
    
    return {
        "status": "confirmed",
        "booking_code": f"TKT-{random.randint(100000, 999999)}",
        "attraction": attraction_name,
        "details": {
            "quantity": quantity,
            "date": date,
            "type": ticket_type,
            "price_per_ticket": base_price,
            "total_price": total_price,
            "currency": "VND"
        },
        "message": f"Đặt vé thành công! Mã vé của bạn là TKT-{random.randint(100000, 999999)}. Vui lòng xuất trình tại cổng."
    }
