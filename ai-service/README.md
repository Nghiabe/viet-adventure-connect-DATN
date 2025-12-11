# AI Service

AI microservice for Viet Adventure Connect. Provides LLM-powered agents that call external tools.

## Tech
- FastAPI
- LangGraph / LangChain
- Gemini (langchain-google-genai)
- Firecrawl for web search
- Open-Meteo + Nominatim for weather (fallback OpenWeather if key provided)

## Setup
1. Activate venv
2. Install deps (either):
   - `pip install -U fastapi uvicorn httpx loguru python-dotenv langchain langgraph langchain-google-genai firecrawl-py`
   - or `uv sync`
3. Create `.env` at project root `ai-service/.env`:
```
GOOGLE_API_KEY=...
FIRECRAWL_API_KEY=...
# Optional
OPENWEATHER_API_KEY=...
SERVICE_PORT=8081
```
4. Run service:
```
# Option A: set app dir
uvicorn main:app --app-dir src --host 0.0.0.0 --port 8081 --reload

# Option B: set PYTHONPATH
PYTHONPATH=src uvicorn main:app --host 0.0.0.0 --port 8081 --reload
```

## Endpoints

### Health
- GET `/health` → basic heartbeat `{ "status": "ok" }`
- GET `/v1/healthcheck` → environment + DNS checks
  - Response example:
```
{
  "ok": true,
  "env": {
    "GOOGLE_API_KEY": true,
    "FIRECRAWL_API_KEY": true,
    "TAVILY_API_KEY": false
  },
  "dns": {
    "api.open-meteo.com": true,
    "nominatim.openstreetmap.org": true,
    "api.firecrawl.dev": true,
    "api.tavily.com": false
  }
}
```

### Chat Agent
- POST `/v1/agent/chat`
- Description: LLM-based travel assistant. Always performs web search (Firecrawl) to gather context. If LLM detects weather intent, it calls the weather tool (without web search).

Request body:
```
{
  "message": "string",           // required. e.g. "Đà Nẵng có món gì ngon?" hoặc "Thời tiết Hà Nội hôm nay"
  "user_id": "string",          // optional identifier
  "context": {                    // optional context object; will be passed-through
    "key": "value"
  },
  "location_hint": "string",    // optional; not required (LLM tự detect). If present and intent=weather, it will be used
  "intent_hint": "string"        // optional; not required. LLM tự detect (hints ignored if not valid)
}
```

Successful response (example):
```
{
  "response": "... câu trả lời tiếng Việt, tổng hợp rõ ràng ...",
  "cards": [                      // optional, array of web results (at most 3 items)
    {
      "type": "web",
      "data": {
        "title": "...",
        "snippet": "...",
        "url": "https://...",
        "provider": "firecrawl"
      }
    }
  ],
  "intent": "weather|food|discover|general",
  "trace_id": "uuid",
  "errors": ["..."]              // optional, present when tools report explicit errors
}
```

Error examples in `errors` field:
- `firecrawl_missing_api_key` → chưa cấu hình FIRECRAWL_API_KEY
- `firecrawl_empty` → Firecrawl không trả kết quả
- `weather_geocode_not_found` → không tìm được toạ độ từ địa danh
- `weather_http_error` → lỗi HTTP khi gọi provider thời tiết
- `weather_no_forecast` → tool không trả forecast hợp lệ

## Usage Examples

### cURL
- Ẩm thực Đà Nẵng:
```
curl -s -H "Content-Type: application/json" \
  -X POST http://127.0.0.1:8081/v1/agent/chat \
  -d "{\"message\":\"Đà Nẵng có món gì ngon?\",\"user_id\":\"u1\"}"
```

- Thời tiết Hà Nội (không cần location_hint – LLM tự detect):
```
curl -s -H "Content-Type: application/json" \
  -X POST http://127.0.0.1:8081/v1/agent/chat \
  -d "{\"message\":\"Thời tiết Hà Nội hôm nay\",\"user_id\":\"u1\"}"
```

### Python
```
import requests

url = "http://127.0.0.1:8081/v1/agent/chat"
payload = {"message": "Đà Nẵng có món gì ngon?", "user_id": "u1"}
r = requests.post(url, json=payload, timeout=20)
print(r.status_code, r.json())
```

## Logging & Debugging
- Mỗi request được gán `trace_id` (trả về trong JSON) để tra cứu log.
- Log chi tiết theo phase: `decide`, `tool`, `respond` kèm `intent`, `tool_keys`, `errors`.
- Khi nhận kết quả chưa đúng, gửi lại JSON trả về (kèm `trace_id`) để điều tra nhanh.

## Notes
- Web search: chỉ dùng Firecrawl, tối đa 3 kết quả/lần tìm kiếm.
- Weather: Open-Meteo + Nominatim; fallback OpenWeather nếu có `OPENWEATHER_API_KEY`.
- Không cần truyền `location_hint` hoặc `intent_hint`; LLM tự nhận diện.
