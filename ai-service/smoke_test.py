import asyncio
import json
import os
import sys
from typing import Any, Dict

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "src")
if SRC_DIR not in sys.path:
	sys.path.insert(0, SRC_DIR)

os.environ.setdefault("BACKEND_BASE_URL", os.getenv("BACKEND_BASE_URL", "http://localhost:5173"))


async def test_agent() -> Dict[str, Any]:
	from agents.chat.graph import ChatAgent
	agent = ChatAgent()
	result = await agent.run(
		message="Gợi ý lịch trình 2 ngày ở Đà Nẵng?",
		user_id="test-user",
		context={}
	)
	return result


async def test_agent_stream() -> Dict[str, Any]:
	from agents.chat.graph import ChatAgent
	agent = ChatAgent()
	collected = []
	async for chunk in agent.stream(
		message="Ăn gì đặc sản ở Huế?",
		user_id="test-user",
		context={}
	):
		print(chunk, end="", flush=True)
		collected.append(chunk)
	print()
	return {"length": sum(len(c) for c in collected)}


def test_api() -> Dict[str, Any]:
	import httpx
	url = os.getenv("AI_BASE_URL", "http://127.0.0.1:8081")
	payload = {"message": "Thời tiết Hạ Long hôm nay", "user_id": "test-user"}
	try:
		with httpx.Client(timeout=10.0) as client:
			resp = client.get(f"{url}/health")
			health_ok = (resp.status_code == 200)
			resp2 = client.post(f"{url}/v1/agent/chat", json=payload)
			# test streaming endpoint
			try:
				with client.stream("POST", f"{url}/v1/agent/chat/stream", json={"message": "Du lịch Hội An 1 ngày nên đi đâu?", "user_id": "test-user"}) as s:
					stream_ok = (s.status_code == 200)
					first_chunk = next(s.iter_text(), "")
			except Exception as _:
				stream_ok, first_chunk = False, ""
			return {"health_status": health_ok, "status_code": resp2.status_code, "json": resp2.json() if resp2.content else {}, "stream_ok": stream_ok, "first_chunk_len": len(first_chunk)}
	except Exception as exc:
		return {"error": str(exc)}


async def main() -> None:
	print("=== Agent test ===")
	agent_res = await test_agent()
	print(json.dumps(agent_res, ensure_ascii=False, indent=2))
	print("\n=== Agent stream test ===")
	stream_res = await test_agent_stream()
	print(json.dumps(stream_res, ensure_ascii=False, indent=2))
	print("\n=== API test ===")
	api_res = test_api()
	print(json.dumps(api_res, ensure_ascii=False, indent=2))


if __name__ == "__main__":
	try:
		asyncio.run(main())
	except KeyboardInterrupt:
		sys.exit(1)
