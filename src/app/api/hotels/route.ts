// app/api/hotels/route.ts
import { NextResponse } from "next/server";
import type { IHotel } from "@/data/mockHotels";

const STAYAPI_KEY = process.env.STAYAPI_KEY!;
const STAYAPI_BASE = process.env.STAYAPI_BASE ?? "https://api.stayapi.com/v1";

// Helper gọi StayAPI
async function stayGet(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(STAYAPI_BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  });

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-api-key": STAYAPI_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("StayAPI error", res.status, text);
    throw new Error(`StayAPI error: ${res.status}`);
  }

  return res.json();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const cityQuery = searchParams.get("city") || "Da Nang";
    const checkin = searchParams.get("checkin") || "2025-12-01";
    const checkout = searchParams.get("checkout") || "2025-12-03";
    const adults = searchParams.get("adults") || "2";
    const rooms = searchParams.get("rooms") || "1";

    // 1️⃣ Lookup dest_id từ tên thành phố
    // GET /v1/booking/destinations/lookup?query=...
    // Docs: Destinations Lookup API 
    const destData = await stayGet("/booking/destinations/lookup", {
      query: cityQuery,
      language: "en-us",
    });
    

    if (!destData.success || !destData.dest_id) {
      return NextResponse.json(
        { hotels: [], message: "Không tìm thấy điểm đến phù hợp" },
        { status: 200 }
      );
    }

    const destId = destData.dest_id; // ví dụ: "-3233180"
    const destType = destData.dest_type || "CITY";

    // 2️⃣ Search hotels với dest_id
    // GET /v1/booking/search?dest_id=...&checkin=... 
    const searchData = await stayGet("/booking/search", {
      dest_id: destId,
      dest_type: destType,
      checkin,
      checkout,
      adults,
      rooms,
      currency: "VND",
      language: "en-us",
      rows_per_page: 30,
    });

    const rawHotels = searchData.data ?? [];

    // 3️⃣ Map StayAPI → IHotel (cho HotelCard)
    const hotels: IHotel[] = rawHotels.map((item: any): IHotel => {
      // Booking dùng review_score 0–10, mình convert sang 0–5 cho đẹp
      const reviewScore = typeof item.review_score === "number" ? item.review_score : 0;
      const rating = reviewScore / 2; // ví dụ 8.8 → 4.4

      const reviewCount =
        typeof item.review_count === "number" ? item.review_count : 0;

      const price =
        typeof item.min_total_price === "number" ? item.min_total_price : 0;

      return {
        id: String(item.hotel_id ?? item.id ?? Math.random()),
        name: item.hotel_name ?? "Unknown hotel",
        location: item.address ?? destData.normalized_query ?? cityQuery,
        price,
        rating,
        reviewCount,
        // Search endpoint không trả amenities chi tiết, có thể để [] hoặc
        // sau này gọi thêm /booking/hotel/facilities nếu cần. 
        amenities: [],
        imageUrl:
          item.image_url ||
          "https://picsum.photos/seed/hotel-fallback/800/600",
      };
    });

    return NextResponse.json({ hotels });
  } catch (error) {
    console.error("Error in /api/hotels:", error);
    return NextResponse.json(
      { error: "Internal server error", hotels: [] },
      { status: 500 }
    );
  }
}
