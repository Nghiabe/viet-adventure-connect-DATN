
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MapPin, Star, Calendar } from "lucide-react";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import { getItineraryById } from "@/services/plannerService";

interface ItineraryItem {
  id: string;
  day: number;
  time: string;
  title: string;
  description: string;
  location: string;
  duration: string;
  type: "attraction" | "meal" | "transport" | "accommodation";
  rating?: number;
  price?: string;
  image?: string;
}

interface BookingCard {
  id: string;
  type: "hotel" | "restaurant" | "transport";
  title: string;
  description: string;
  price: string;
  rating: number;
  image: string;
  location: string;
}

// Mock data for demonstration
const mockItinerary: ItineraryItem[] = [
  {
    id: "1",
    day: 1,
    time: "08:00",
    title: "Khám phá Phố cổ Hà Nội",
    description: "Dạo bộ qua các con phố cổ kính, thưởng thức cà phê vỉa hè và mua sắm đồ lưu niệm",
    location: "Hoàn Kiếm, Hà Nội",
    duration: "3 giờ",
    type: "attraction",
    rating: 4.8,
  },
  {
    id: "2",
    day: 1,
    time: "12:00",
    title: "Bún chả Hương Liên",
    description: "Thưởng thức món bún chả nổi tiếng mà cựu Tổng thống Obama đã từng ăn",
    location: "24 Lê Văn Hưu, Hai Bà Trưng",
    duration: "1 giờ",
    type: "meal",
    rating: 4.6,
    price: "80,000 VNĐ",
  },
  {
    id: "3",
    day: 1,
    time: "14:00",
    title: "Văn Miếu - Quốc Tử Giám",
    description: "Tham quan ngôi đền đầu tiên của Việt Nam, tìm hiểu về lịch sử giáo dục",
    location: "58 Quốc Tử Giám, Đống Đa",
    duration: "2 giờ",
    type: "attraction",
    rating: 4.7,
    price: "30,000 VNĐ",
  },
];

const mockBookings: BookingCard[] = [
  {
    id: "1",
    type: "hotel",
    title: "Khách sạn Metropole Hà Nội",
    description: "Khách sạn 5 sao sang trọng trong lòng phố cổ",
    price: "3,500,000 VNĐ/đêm",
    rating: 4.9,
    image: "/placeholder.svg",
    location: "15 Ngô Quyền, Hoàn Kiếm",
  },
  {
    id: "2",
    type: "restaurant",
    title: "Nhà hàng Madame Hiền",
    description: "Ẩm thực Việt Nam tinh tế trong không gian cổ điển",
    price: "500,000 VNĐ/người",
    rating: 4.7,
    image: "/placeholder.svg",
    location: "15 Chân Cầm, Hoàn Kiếm",
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "attraction":
      return "Camera";
    case "meal":
      return "Utensils";
    case "transport":
      return "Car";
    default:
      return "MapPin";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "attraction":
      return "bg-blue-100 text-blue-800";
    case "meal":
      return "bg-orange-100 text-orange-800";
    case "transport":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const ItineraryResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["itinerary", id],
    queryFn: async () => {
      if (!id) throw new Error("Thiếu mã kế hoạch");
      return getItineraryById(id);
    },
    enabled: !!id,
  });

  const aiPlan = data?.aiPlan;
  const schedule: Array<{ day: number; date?: string; title: string; activities: Array<{ time: string; description: string }> }> = aiPlan?.schedule || [];

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại trang chủ
          </Button>
          
          <div className="bg-background rounded-lg p-6 shadow-sm">
            <h1 className="text-3xl font-bold mb-2">
              {aiPlan?.itineraryName || "Kế hoạch du lịch"}
            </h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{data?.startDate ? new Date(data.startDate).toLocaleDateString() : ""} - {data?.endDate ? new Date(data.endDate).toLocaleDateString() : ""}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          {/* Left Column - Timeline (70%) */}
          <div className="lg:col-span-7">
            <div className="bg-background rounded-lg p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Lịch trình của bạn</h2>
              
              {isLoading && <div className="text-muted-foreground">AI đang tải kế hoạch...</div>}
              {error && <div className="text-destructive">Không tải được kế hoạch.</div>}
              {!isLoading && !error && (
                <div className="space-y-8">
                  {schedule.map((dayBlock) => (
                    <div key={dayBlock.day} className="relative">
                      {/* Day Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center font-bold">
                          {dayBlock.day}
                        </div>
                        <h3 className="text-xl font-semibold">{dayBlock.title}</h3>
                      </div>

                      {/* Timeline Items */}
                      <div className="ml-6 border-l-2 border-muted pl-6 space-y-6">
                        {dayBlock.activities.map((act, index) => (
                            <div key={`${dayBlock.day}-${index}`} className="relative">
                              {/* Timeline dot */}
                              <div className="absolute -left-9 w-4 h-4 bg-primary rounded-full border-2 border-background" />
                              
                              <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" />
                                        <span>{act.time}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <CardTitle className="text-lg">{act.description}</CardTitle>
                                </CardHeader>
                                <CardContent />
                              </Card>
                            </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar (30%) */}
          <div className="lg:col-span-3">
            <div className="sticky top-8 space-y-6">
              {/* Map Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bản đồ hành trình</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Bản đồ tương tác</p>
                      <p className="text-xs">Sẽ hiển thị các điểm đến</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              
              {/* Action Buttons */}
              <div className="space-y-3">
                <Button className="w-full" size="lg">
                  Lưu kế hoạch
                </Button>
                <Button variant="outline" className="w-full">
                  Chia sẻ kế hoạch
                </Button>
                <Button variant="outline" className="w-full">
                  Chỉnh sửa kế hoạch
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ItineraryResults;
