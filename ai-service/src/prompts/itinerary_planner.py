from __future__ import annotations
from typing import Dict, Any, List


def get_mock_weather(destination: str, month: int) -> dict:
    """Mock weather data based on destination and month."""
    # Vietnam weather patterns (simplified)
    # Đà Nẵng: Hot & humid year-round, rainy Sep-Dec
    # Hà Nội: Hot summer, cold winter
    # HCMC: Tropical, rainy May-Nov
    
    base_temps = {
        "đà nẵng": 28, "da nang": 28,
        "hà nội": 25, "ha noi": 25, "hanoi": 25,
        "hồ chí minh": 30, "ho chi minh": 30, "hcmc": 30, "saigon": 30,
        "huế": 27, "hue": 27,
        "hội an": 28, "hoi an": 28,
        "nha trang": 29,
        "phú quốc": 29, "phu quoc": 29,
        "sa pa": 18, "sapa": 18,
        "đà lạt": 20, "da lat": 20, "dalat": 20,
    }
    
    dest_lower = destination.lower()
    base_temp = 28  # default
    for key, temp in base_temps.items():
        if key in dest_lower:
            base_temp = temp
            break
    
    # Adjust for month
    if month in [12, 1, 2]:  # Winter
        temp = base_temp - 3
        conditions = ["Se lạnh", "Mát mẻ", "Có mây"]
        icons = ["🌥️", "☁️", "🌤️"]
    elif month in [6, 7, 8]:  # Summer
        temp = base_temp + 4
        conditions = ["Nắng nóng", "Nóng ẩm", "Nắng gắt"]
        icons = ["☀️", "🌞", "🔥"]
    elif month in [9, 10, 11]:  # Rainy season
        temp = base_temp
        conditions = ["Có mưa", "Mưa rào", "Ẩm ướt"]
        icons = ["🌧️", "⛈️", "🌦️"]
    else:  # Spring
        temp = base_temp + 2
        conditions = ["Ấm áp", "Dễ chịu", "Nắng nhẹ"]
        icons = ["🌤️", "☀️", "🌈"]
    
    import random
    return {
        "temp": temp + random.randint(-2, 2),
        "condition": random.choice(conditions),
        "humidity": random.randint(60, 85),
        "icon": random.choice(icons)
    }


def itinerary_generator_prompt(
    destination: str,
    destination_info: Dict[str, Any],
    num_days: int,
    start_date: str,
    end_date: str,
    style: str,
    interests: List[str],
    hotel_name: str = "Khách sạn đã chọn",
    hotel_address: str = ""
) -> str:
    """
    Generate SUPER GUIDE prompt for comprehensive itinerary.
    
    This prompt generates a detailed day-by-day itinerary with:
    - Full day slots: breakfast, morning, transport, lunch, rest, afternoon, transport, dinner, evening
    - Daily briefing with weather, dress code, must-bring items  
    - Transport estimation between locations
    - Detailed info for each location/dish (to be enriched later)
    - Image placeholders (to be filled by search)
    """
    
    # Parse month for weather mock
    month = 12  # default
    try:
        month = int(start_date.split("-")[1])
    except:
        pass
    
    weather = get_mock_weather(destination, month)
    
    dest_context = f"Điểm đến: {destination_info.get('name', destination)}\n"
    if destination_info.get("description"):
        dest_context += f"Mô tả: {destination_info.get('description')[:300]}...\n"
    
    interests_str = ', '.join(interests) if interests else 'Đa dạng'
    
    return f"""# ROLE & CONTEXT
Bạn là SUPER GUIDE - Hướng dẫn viên du lịch AI TOP 1 Việt Nam với chuyên môn sâu về:
- Ẩm thực địa phương: Biết tất cả quán ngon, món đặc sản, giá cả thực tế
- Địa điểm tham quan: Giờ mở cửa, chi phí vé, tips chụp ảnh đẹp
- Di chuyển: Khoảng cách thực tế, phương tiện tối ưu, giá Grab ước tính chính xác

⚠️ CRITICAL OUTPUT REQUIREMENT:
- BẠN PHẢI TRẢ VỀ JSON HỢP LỆ, KHÔNG CÓ TEXT NÀO KHÁC
- KHÔNG giải thích, KHÔNG markdown wrapper, CHỈ JSON THUẦN TÚY
- Bắt đầu bằng {{ và kết thúc bằng }}

# NHIỆM VỤ
Tạo kế hoạch hành động chi tiết từng phút cho chuyến du lịch - không chỉ là lịch trình mà là HƯỚNG DẪN HOÀN CHỈNH.

# THÔNG TIN ĐẦU VÀO

{dest_context}
- Thời gian: {num_days} ngày (từ {start_date} đến {end_date})
- Phong cách: {style}
- Sở thích: {interests_str}
- Khách sạn: {hotel_name}
- Địa chỉ khách sạn: {hotel_address if hotel_address else "Trung tâm " + destination}
- Thời tiết dự kiến: {weather['condition']}, {weather['temp']}°C, độ ẩm {weather['humidity']}%

# YÊU CẦU CHI TIẾT

## 1. CẤU TRÚC MỖI NGÀY (8 SLOTS BẮT BUỘC)
Mỗi ngày PHẢI có đủ 8 slots theo thứ tự:
1. `breakfast` - Bữa sáng (địa điểm, món ăn cụ thể)
2. `morning_activity` - Hoạt động sáng (tham quan/trải nghiệm)
3. `transport_to_lunch` - Di chuyển đến quán trưa
4. `lunch` - Bữa trưa (quán ăn, món đặc sản địa phương)
5. `rest` - Nghỉ ngơi (café, về khách sạn, hoặc đi bộ thong thả)
6. `afternoon_activity` - Hoạt động chiều
7. `transport_to_dinner` - Di chuyển đến quán tối
8. `dinner` - Bữa tối
9. `transport_to_evening` - Di chuyển đến hoạt động tối (nếu có)
10. `evening_activity` (tùy chọn) - Hoạt động tối (dạo phố, bar, show...)
11. `transport_back_hotel` - Di chuyển về khách sạn (BẮT BUỘC để kết thúc ngày)

⚠️ QUAN TRỌNG - TRANSPORT BẮT BUỘC:
Giữa MỌI slot hoạt động liên tiếp PHẢI có slot transport.
Kể cả buổi tối, sau khi ăn tối xong nếu đi chơi tiếp phải có transport.
Và cuối cùng PHẢI có `transport_back_hotel` để về khách sạn.
Ví dụ đúng: ... -> dinner -> transport -> evening_activity -> transport -> hotel
KHÔNG BAO GIỜ để 2 slot meal/attraction/rest liền kề nhau mà không có transport ở giữa!

## 2. THÔNG TIN MỖI SLOT
Mỗi slot PHẢI có:
- `slot_id`: ID duy nhất (vd: "day1_breakfast")
- `slot_type`: "meal" | "attraction" | "transport" | "rest"
- `time`: Khung giờ cụ thể (vd: "07:00 - 08:00")
- `activity`: Tên hoạt động/quán ăn CỤ THỂ (không chung chung)
- `location`: Địa chỉ đầy đủ
- `cost`: Chi phí VND (số nguyên)
- `tips`: Mẹo hữu ích (1-2 câu)
- `image_search_query`: Query để search hình ảnh (vd: "Cầu Rồng Đà Nẵng về đêm")

## 3. SLOT ĂN UỐNG (meal)
Thêm:
- `meal_type`: "breakfast" | "lunch" | "dinner"
- `dish_recommendation`: ["Tên món 1", "Tên món 2"] - 2-3 món nên thử
- `detail_search_query`: Query để search info (vd: "Mì Quảng Bà Mua Đà Nẵng review")

## 4. SLOT DI CHUYỂN (transport)
- `from`: Điểm xuất phát
- `to`: Điểm đến
- `method`: "Grab/Taxi" | "Xe máy thuê" | "Đi bộ" | "Xe bus"
- `distance_km`: Khoảng cách km (ước tính)
- `duration_minutes`: Thời gian di chuyển phút
- `estimated_cost`: Chi phí VND (Grab: 10k/km + 15k mở cửa)
- `alternative`: Phương án thay thế

## 5. DAILY BRIEFING
Mỗi ngày có `daily_briefing`:
- `weather`: {{"temp": {weather['temp']}, "condition": "{weather['condition']}", "icon": "{weather['icon']}"}}
- `dress_code`: Gợi ý trang phục dựa trên hoạt động trong ngày
- `must_bring`: ["item1", "item2"] - Vật dụng cần mang
- `special_notes`: Lưu ý đặc biệt (sự kiện, giờ đóng cửa...)

## 6. DAY SUMMARY
Cuối mỗi ngày:
- `total_cost`: Tổng chi phí ngày
- `breakdown`: {{"transport": X, "food": Y, "attractions": Z}}
- `total_distance_km`: Tổng quãng đường di chuyển

# FORMAT OUTPUT JSON

```json
{{
  "trip_overview": {{
    "destination": "{destination}",
    "total_days": {num_days},
    "hero_image_query": "{destination} Vietnam landscape"
  }},
  "days": [
    {{
      "day": 1,
      "date": "{start_date}",
      "daily_briefing": {{
        "weather": {{"temp": {weather['temp']}, "condition": "{weather['condition']}", "humidity": {weather['humidity']}, "icon": "{weather['icon']}"}},
        "dress_code": "Quần áo thoáng mát, mang theo áo khoác mỏng",
        "must_bring": ["Kem chống nắng", "Mũ", "Chai nước"],
        "special_notes": "Điểm tham quan đông vào cuối tuần"
      }},
      "start_point": {{
        "name": "{hotel_name}",
        "address": "{hotel_address if hotel_address else 'Trung tâm ' + destination}"
      }},
      "schedule": [
        {{
          "slot_id": "day1_breakfast",
          "slot_type": "meal",
          "meal_type": "breakfast",
          "time": "07:00 - 08:00",
          "activity": "Quán Phở Hùng",
          "location": "123 Đường ABC, Quận X",
          "cost": 50000,
          "tips": "Đến sớm để tránh đông",
          "dish_recommendation": ["Phở bò tái", "Phở gà"],
          "image_search_query": "Phở bò Đà Nẵng",
          "detail_search_query": "Quán Phở Hùng Đà Nẵng review"
        }},
        {{
          "slot_id": "day1_morning",
          "slot_type": "attraction",
          "time": "08:30 - 11:30",
          "activity": "Tham quan Cầu Rồng",
          "location": "Cầu Rồng, Quận Hải Châu, Đà Nẵng",
          "duration": "3 giờ",
          "cost": 0,
          "tips": "Buổi sáng mát mẻ, đẹp để chụp ảnh",
          "image_search_query": "Cầu Rồng Đà Nẵng ban ngày",
          "detail_search_query": "Cầu Rồng Đà Nẵng lịch sử thông tin"
        }},
        {{
          "slot_id": "day1_transport_1",
          "slot_type": "transport",
          "time": "11:30 - 11:45",
          "from": "Cầu Rồng",
          "to": "Quán Mì Quảng Bà Mua",
          "method": "Grab/Taxi",
          "distance_km": 2.5,
          "duration_minutes": 15,
          "estimated_cost": 40000,
          "alternative": "Đi bộ 20 phút"
        }}
      ],
      "day_summary": {{
        "total_cost": 500000,
        "breakdown": {{"transport": 80000, "food": 320000, "attractions": 100000}},
        "total_distance_km": 15
      }}
    }}
  ],
  "trip_summary": {{
    "total_cost": 1500000,
    "cost_breakdown": {{
      "accommodation": 0,
      "food": 600000,
      "transport": 300000,
      "attractions": 400000,
      "other": 200000
    }},
    "packing_checklist": [
      {{"item": "Kem chống nắng SPF50+", "reason": "Nắng gắt miền Trung"}},
      {{"item": "Giày thể thao", "reason": "Leo núi/đi bộ nhiều"}}
    ]
  }}
}}
```

# ⚠️ VALIDATION CHECKLIST - KIỂM TRA TRƯỚC KHI TRẢ VỀ

Trước khi output JSON, tự kiểm tra:
☑ JSON bắt đầu bằng {{ và kết thúc bằng }} (KHÔNG có ```json)
☑ Có đúng {num_days} ngày trong array "days"
☑ Mỗi ngày có đủ 8-9 slots (breakfast → dinner/evening)
☑ Mỗi slot có đầy đủ: slot_id, slot_type, time, activity, location, cost
☑ Slots meal có: dish_recommendation (array), image_search_query
☑ Slots transport có: from, to, distance_km, estimated_cost, method
☑ Địa điểm/quán ăn là CÓ THẬT tại {destination}
☑ Chi phí bằng VND thực tế (không quá rẻ/đắt)
☑ Không có trailing comma trong JSON

OUTPUT NGAY BÂY GIỜ - CHỈ JSON, KHÔNG TEXT KHÁC:
"""
