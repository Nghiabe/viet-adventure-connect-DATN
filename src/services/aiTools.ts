import dbConnect from '../lib/dbConnect';
import Tour from '../models/Tour';
import Story from '../models/Story';
import Booking from '../models/Booking';

export type ToolSearchResults = {
  results: Array<{
    type: 'tour' | 'story';
    _id: string;
    title?: string;
    slug?: string;
    summary?: string;
    price?: number;
    averageRating?: number;
    destination?: { name: string; slug: string } | null;
    coverImage?: string | null;
  }>;
};

export type ToolUserBookings = {
  bookings: Array<{
    _id: string;
    tourId: string;
    tourTitle: string;
    startDate: string;
    totalPrice: number;
    status: string;
  }>;
};

export type ToolWeatherForecast = {
  forecast?: string;
  error?: string;
};

// Tool 1: Search our own database for tours and stories
export const searchVietravelDatabase = async ({ query }: { query: string }): Promise<ToolSearchResults> => {
  await dbConnect();
  const regex = new RegExp(query, 'i');

  const [tours, stories] = await Promise.all([
    Tour.find({ $or: [{ title: regex }, { description: regex }] })
      .limit(10)
      .populate('destination', 'name slug')
      .lean(),
    Story.find({ $or: [{ title: regex }, { content: regex }, { tags: regex }] })
      .limit(10)
      .lean(),
  ]);

  const results: ToolSearchResults['results'] = [
    ...tours.map((t: any) => ({
      type: 'tour',
      _id: String(t._id),
      title: t.title,
      price: t.price,
      averageRating: t.averageRating,
      destination: t.destination ? { name: t.destination.name, slug: t.destination.slug } : null,
      coverImage: t.images?.[0] || null,
      slug: t.slug,
    })),
    ...stories.map((s: any) => ({
      type: 'story',
      _id: String(s._id),
      title: s.title,
      summary: s.excerpt || (s.content ? String(s.content).slice(0, 160) : ''),
      coverImage: s.coverImage || null,
      slug: s.slug,
      destination: null,
    })),
  ];

  return { results };
};

// Tool 2: Get a user's booking history (requires user context)
export const getUserBookings = async ({ userId }: { userId: string }): Promise<ToolUserBookings> => {
  await dbConnect();
  const bookings = await Booking.find({ user: userId })
    .sort({ createdAt: -1 })
    .populate('tour', 'title startDates')
    .lean();

  const normalized: ToolUserBookings['bookings'] = bookings.map((b: any) => ({
    _id: String(b._id),
    tourId: String(b.tour),
    tourTitle: b.tour?.title || 'Tour',
    startDate: b.bookingDate ? new Date(b.bookingDate).toISOString() : (b.tour?.startDates?.[0] ? new Date(b.tour.startDates[0]).toISOString() : new Date().toISOString()),
    totalPrice: Number(b.totalPrice || 0),
    status: b.status || 'confirmed',
  }));

  return { bookings: normalized };
};

// Tool 3: Get real-time weather (OpenWeather integration)
export const getWeatherForecast = async ({ location, date }: { location: string; date?: string }): Promise<ToolWeatherForecast> => {
  console.log(`[Tool Execution] Running getWeatherForecast for location: ${location}`);
  try {
    const axios = (await import('axios')).default;
    const apiKey = process.env.VITE_OPENWEATHER_API_KEY || (globalThis as any).VITE_OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeather API key is not configured. Set VITE_OPENWEATHER_API_KEY');
    }

    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: `${location},VN`,
        appid: apiKey,
        units: 'metric',
        lang: 'vi',
      },
      timeout: 8000,
    });

    const data = response.data;
    const description = Array.isArray(data.weather) && data.weather[0]?.description ? data.weather[0].description : 'không rõ';
    const temperature = Math.round(Number(data.main?.temp ?? 0));
    const cityName = data.name || location;
    const forecast = `Thời tiết tại ${cityName} là ${description}, nhiệt độ khoảng ${temperature}°C.`;
    console.log(`[Tool Execution] Success. Forecast: ${forecast}`);
    return { forecast };
  } catch (error: any) {
    console.error('[Tool Execution] Error fetching weather:', error?.response?.data || error?.message || String(error));
    return { error: 'Không thể lấy được dữ liệu thời tiết vào lúc này.' };
  }
};

export type AgentCard =
  | { type: 'tour'; data: { id: string; title: string; price?: number; rating?: number; destinationName?: string; slug?: string; image?: string } }
  | { type: 'story'; data: { id: string; title: string; summary?: string; slug?: string; image?: string } };

export type AgentResponseShape = {
  response: string;
  cards?: AgentCard[];
};


