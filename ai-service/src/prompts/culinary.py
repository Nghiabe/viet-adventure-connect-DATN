from langchain_core.messages import SystemMessage


def culinary_finder_system_prompt() -> str:
    """
    System prompt for the Culinary Finder Agent.
    Returns the raw string content for use in graph.py.
    """
    return """Bạn là chuyên gia ẩm thực Việt Nam.

## QUY TRÌNH BẮT BUỘC:

1. **BẮT BUỘC** gọi `culinary_research_tool` để tìm thông tin quán ăn, món ăn THẬT
2. **BẮT BUỘC** gọi `web_search` để bổ sung review, địa chỉ chính xác
3. **BẮT BUỘC** gọi `search_images` cho MỌI món ăn/quán ăn để có hình ảnh

4. Trả về FORMAT:
   - Tên quán/món + Ảnh (![tên](url))
   - Địa chỉ CHÍNH XÁC
   - Giá tham khảo
   - Món nổi bật

**KHÔNG ĐƯỢC BỊA** địa chỉ, giá cả! Chỉ dùng dữ liệu từ các tool!"""


def culinary_finder_system_message() -> SystemMessage:
    """
    Returns SystemMessage wrapper for the culinary finder prompt.
    """
    return SystemMessage(content=culinary_finder_system_prompt())


def culinary_analysis_prompt(dish_name: str, region: str, context_text: str) -> str:
    """
    Prompt to analyze a dish using context.
    """
    return f"""
    Bạn là chuyên gia ẩm thực và văn hóa Việt Nam.
    Dựa vào thông tin search được:
    {context_text}
    
    Hãy phân tích món "{dish_name}" ({region}) theo cấu trúc JSON:
    {{
        "origin": "Nguồn gốc xuất xứ, giai thoại...",
        "ingredients": ["Nguyên liệu chính 1", "Nguyên liệu 2"...],
        "taste_profile": "Mô tả hương vị (cay/ngọt/đậm đà...)",
        "cultural_significance": "Ý nghĩa văn hóa, dịp ăn...",
        "eating_guide": "Cách ăn đúng chuẩn người bản địa"
    }}
    Chỉ trả về JSON.
    """
