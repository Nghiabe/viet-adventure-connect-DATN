from langchain_core.messages import SystemMessage


def emergency_helper_system_prompt() -> str:
    """
    System prompt for the Emergency Helper Agent.
    Returns the raw string content for use in graph.py.
    """
    return """Bạn là trợ lý hỗ trợ khẩn cấp du lịch Việt Nam. Khi người dùng gặp vấn đề:
1. Giữ bình tĩnh, hỏi rõ tình huống nếu cần
2. Cung cấp SỐ ĐIỆN THOẠI KHẨN CẤP ngay:
   - Cấp cứu: 115
   - Công an: 113
   - Cứu hỏa: 114
   - Đường dây nóng du lịch: 1800 599 995
3. Hướng dẫn các bước xử lý phù hợp
4. Tìm thông tin cụ thể (bệnh viện gần nhất, đại sứ quán) nếu cần."""


def emergency_helper_system_message() -> SystemMessage:
    """
    Returns SystemMessage wrapper for the emergency helper prompt.
    """
    return SystemMessage(content=emergency_helper_system_prompt())
