from typing import List, Dict, Any, Optional

def tour_matcher_prompt(
    destination: str,
    web_results: List[Dict[str, Any]],
    budget_per_person: Optional[float] = None
) -> str:
    """Generate enhanced prompt for tour normalization with detailed info."""
    
    search_context = ""
    for i, res in enumerate(web_results[:8]):  # Limit to 8 results
        search_context += f"""
Kết quả {i+1}:
- Tiêu đề: {res.get('title', '')}
- Mô tả: {res.get('snippet', res.get('content', ''))[:400]}
- URL: {res.get('url', '')}
"""

    budget_str = f"{budget_per_person:,.0f} VND" if budget_per_person else "Linh hoạt"

    return f"""Bạn là chuyên gia du lịch Việt Nam với kiến thức sâu rộng về {destination}. 
Nhiệm vụ của bạn là trích xuất và ENRICHMENT thông tin tour từ kết quả tìm kiếm web.

# THÔNG TIN ĐẦU VÀO
- **Điểm đến**: {destination}
- **Ngân sách mục tiêu**: {budget_str} / người
- **Nguồn dữ liệu**:
{search_context}

# YÊU CẦU CHI TIẾT

Với mỗi tour/hoạt động tìm được, bạn PHẢI cung cấp đầy đủ các trường sau:

## Bắt buộc
1. `_id`: ID duy nhất (web_1, web_2, ...)
2. `title`: Tiêu đề HAY và HẤP DẪN bằng tiếng Việt (tối đa 50 ký tự)
3. `description`: Mô tả ngắn gọn 2-3 câu về điểm nổi bật
4. `price`: Giá VND (ước tính nếu không có - dựa trên loại hình)
5. `duration`: Thời lượng cụ thể (vd: "4 giờ", "1 ngày", "2 ngày 1 đêm")
6. `match_score`: Độ phù hợp 0.0 - 1.0

## QUAN TRỌNG - Thông tin mở rộng
7. `route`: Lộ trình với mũi tên. VD: "Đà Nẵng → Cầu Vàng → Làng Pháp → Fantasy Park → Đà Nẵng"
8. `highlights`: Array 3-5 điểm nổi bật. VD: ["Check-in Cầu Vàng", "Buffet cao cấp", "Cáp treo dài nhất"]
9. `schedule`: Chi tiết lịch trình từng buổi:
   - "morning": "07:00 Đón tại khách sạn → 08:00 Cáp treo lên Bà Nà"
   - "afternoon": "12:00 Buffet → 14:00 Fantasy Park"  
   - "evening": "17:00 Quay về" (nếu có)
10. `includes`: Những gì bao gồm. VD: ["Xe đưa đón", "Vé cáp treo", "Buffet trưa", "Hướng dẫn viên"]
11. `excludes`: Những gì không bao gồm. VD: ["Bữa tối", "Chi phí cá nhân"]
12. `tips`: 1-2 mẹo hữu ích cho người đi
13. `category`: "tham_quan" | "am_thuc" | "van_hoa" | "trai_nghiem" | "phieu_luu"
14. `image_search_query`: Query để tìm ảnh. VD: "Cầu Vàng Bà Nà Hills Đà Nẵng"

## Tùy chọn
15. `source`: "web_search"
16. `url`: Link nguồn gốc

# OUTPUT FORMAT

Trả về JSON array với ít nhất 3 tour, tối đa 5 tour tốt nhất:

```json
[
  {{
    "_id": "web_1",
    "title": "Tour Bà Nà Hills - Cầu Vàng 1 Ngày",
    "description": "Khám phá công trình Cầu Vàng nổi tiếng thế giới và khu du lịch Bà Nà Hills với cáp treo dài nhất Việt Nam.",
    "price": 1450000,
    "duration": "1 ngày",
    "match_score": 0.95,
    "route": "Đà Nẵng → Cáp treo → Cầu Vàng → Làng Pháp → Fantasy Park → Đà Nẵng",
    "highlights": [
      "Check-in Cầu Vàng biểu tượng",
      "Cáp treo 5.8km dài nhất VN",
      "Buffet quốc tế cao cấp",
      "Khu vui chơi Fantasy Park"
    ],
    "schedule": {{
      "morning": "07:00 Đón khách → 08:30 Lên cáp treo → 09:00 Tham quan Cầu Vàng, Làng Pháp",
      "afternoon": "12:00 Buffet trưa → 14:00 Fantasy Park & khu vực tự do",
      "evening": "17:00 Cáp treo xuống → 18:30 Về khách sạn"
    }},
    "includes": ["Xe đưa đón khách sạn", "Vé cáp treo khứ hồi", "Buffet trưa", "Hướng dẫn viên tiếng Việt"],
    "excludes": ["Bữa tối", "Chi phí cá nhân", "Tip cho HDV"],
    "tips": "Mang theo áo khoác vì Bà Nà lạnh hơn dưới đất. Đến sớm để tránh đông.",
    "category": "tham_quan",
    "image_search_query": "Cầu Vàng Bà Nà Hills Đà Nẵng",
    "source": "web_search",
    "url": "https://example.com/tour"
  }}
]
```

# QUAN TRỌNG
1. Chỉ trả về JSON array hợp lệ, KHÔNG kèm markdown code block
2. Giá phải là số nguyên VND (không có dấu phẩy hay ký tự khác)
3. `route` PHẢI có mũi tên → để hiển thị lộ trình
4. `highlights` PHẢI có ít nhất 3 bullet points
5. Nếu thiếu thông tin, hãy BỔ SUNG dựa trên kiến thức về {destination}
"""
