from fastapi import APIRouter
import os
import socket

router = APIRouter()


@router.get("/healthcheck")
async def healthcheck():
	checks = {
		"GOOGLE_API_KEY": bool(os.getenv("GOOGLE_API_KEY")),
		"FIRECRAWL_API_KEY": bool(os.getenv("FIRECRAWL_API_KEY")),
		"TAVILY_API_KEY": bool(os.getenv("TAVILY_API_KEY")),
	}
	# Simple DNS probe
	probes = {}
	for host in ["api.open-meteo.com", "nominatim.openstreetmap.org", "api.firecrawl.dev", "api.tavily.com"]:
		try:
			socket.gethostbyname(host)
			probes[host] = True
		except Exception:
			probes[host] = False
	return {"ok": True, "env": checks, "dns": probes}


