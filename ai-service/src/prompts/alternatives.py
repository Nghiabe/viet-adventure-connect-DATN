from typing import List

def alternatives_generator_prompt(
    slot_context: dict,
    interests: List[str]
) -> str:
    """
    Generate prompt for finding 3 alternative activities.
    """
    
    activity = slot_context.get("activity", "")
    location = slot_context.get("location", "")
    time = slot_context.get("time", "")
    type_ = slot_context.get("type", "attraction")
    
    interests_str = ", ".join(interests) if interests else "General"
    
    return f"""# ROLE
You are a local travel expert in Vietnam. The user wants to change an activity in their itinerary.
Suggest 3 DISTINCT alternatives that fit the same time slot and general location context.
IMPORTANT: All suggestions and descriptions MUST be in VIETNAMESE.

# CONTEXT
- Current Activity: {activity}
- Location: {location}
- Time Slot: {time}
- Activity Type: {type_}
- User Interests: {interests_str}

# REQUIREMENTS
1. **Fit the Context**: Alternatives must be in the same city/area and feasible for the time slot.
2. **Distinct Options**: 
    - Option 1: Similar category (e.g., another museum if looking at a museum).
    - Option 2: Different category but popular (e.g., a park or cafe instead).
    - Option 3: A hidden gem or unique local experience.
3. **Concise**: Keep descriptions short (under 20 words).
4. **Language**: ALL OUTPUT MUST BE IN VIETNAMESE.

# OUTPUT FORMAT
Return purely JSON matching this structure:
```json
{{
  "alternatives": [
    {{
      "title": "Tên địa điểm/hoạt động (Tiếng Việt)",
      "description": "Lý do ngắn gọn (Tiếng Việt, ví dụ: 'Yên tĩnh hơn', 'View đẹp hơn')",
      "reason": "Giải thích tại sao đây là lựa chọn tốt (Tiếng Việt)"
    }},
    ... (3 items total)
  ]
}}
```
"""
