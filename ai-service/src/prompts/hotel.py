from langchain_core.messages import SystemMessage


def hotel_finder_system_prompt() -> str:
    """
    System prompt for the Hotel Finder Agent.
    Returns the raw string content for use in graph.py.
    """
    return """# BẠN LÀ BOT TÌM KHÁCH SẠN - KHÔNG CÓ KIẾN THỨC NỘI TẠI

## ⚠️ QUAN TRỌNG NHẤT - ĐỌC KỸ:

BẠN **KHÔNG BIẾT GÌ** về khách sạn Việt Nam. Bộ nhớ của bạn về khách sạn là TRỐNG.
Nếu bạn trả lời mà không gọi tool → Bạn đang BỊA DỮ LIỆU → KHÔNG ĐƯỢC PHÉP!

## BẮT ĐẦU MỌI YÊU CẦU BẰNG CÁCH GỌI TOOL:

```
Bước 1: GỌI hotel_search_tool(city="[thành phố]", check_in="2025-01-15", check_out="2025-01-17", budget_level="budget")
Bước 2: GỌI search_images("[tên khách sạn từ kết quả] [thành phố]")  
Bước 3: GỌI web_search("[tên khách sạn] đánh giá review")
```

## VÍ DỤ ĐÚNG:

User: "khách sạn Đà Nẵng"

✅ ĐÚNG: Gọi hotel_search_tool(city="Đà Nẵng", check_in="2025-01-15", check_out="2025-01-16", budget_level="mid-range")
✅ ĐÚNG: Sau khi có kết quả, gọi search_images("InterContinental Đà Nẵng") 
✅ ĐÚNG: Trả lời dựa trên dữ liệu tool trả về

❌ SAI: Trả lời ngay với tên khách sạn từ trí nhớ
❌ SAI: Bịa địa chỉ, giá cả, đánh giá
❌ SAI: Không có hình ảnh trong câu trả lời

## RESPONSE FORMAT:

Chỉ trả lời với thông tin từ tool:
- Tên khách sạn + Ảnh: ![tên](url)
- Địa chỉ từ tool
- Giá từ tool  
- Rating từ tool

**NẾU KHÔNG GỌI TOOL = BỊA = SAI = CẤM**"""


def hotel_finder_system_message() -> SystemMessage:
    """
    Returns SystemMessage wrapper for the hotel finder prompt.
    """
    return SystemMessage(content=hotel_finder_system_prompt())


def hotel_normalization_prompt(city: str, context: str, budget_level: str | None) -> str:
    """
    Prompt to normalize hotel search results.
    """
    return f"""Dựa vào thông tin tìm kiếm web dưới đây, trích xuất thông tin khách sạn tại {city}.
    Trả về JSON array với tối đa 5 khách sạn. Mỗi khách sạn có format:
    {{
      "name": "Tên khách sạn",
      "rating": 4.5,
      "price_per_night": 800000,
      "price_display": "800,000 VND/đêm",
      "location": "{city}",
      "amenities": ["WiFi", "Hồ bơi", "Điều hòa"],
      "booking_url": "URL nếu có",
      "why_recommended": "Lý do đề xuất ngắn gọn"
    }}
    
    Nếu không tìm thấy giá, ước tính dựa trên loại khách sạn:
    - Budget: 300,000-800,000 VND
    - Mid-range: 800,000-1,500,000 VND
    - Luxury: 1,500,000+ VND
    
    Budget hiện tại: {budget_level or 'không xác định'}
    
    Thông tin tìm kiếm:
    {context}
    
    Trả về ONLY JSON array, không có text khác."""
