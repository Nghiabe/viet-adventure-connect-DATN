// src/pages/itinerary/ItineraryDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, DollarSign, Heart, Share2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getItineraryById, updateItinerary, saveItinerary } from '@/services/plannerService';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

// Import the sub-components
import { ItineraryTimeline } from '@/components/itinerary/ItineraryTimeline';
import { SuggestionsSidebar } from '@/components/itinerary/SuggestionsSidebar';
import { InteractiveRouteMap } from '@/components/itinerary/InteractiveRouteMap';
import { HotelSection } from '@/components/itinerary/HotelSection';
import { BudgetSummary } from '@/components/itinerary/BudgetSummary';
import { ShareModal } from '@/components/common/ShareModal';


// Travel style Vietnamese mapping
const travelStyleVN: Record<string, string> = {
  'adventure': 'Mạo hiểm',
  'cultural': 'Văn hóa',
  'culinary': 'Ẩm thực',
  'leisure': 'Nghỉ dưỡng',
  'photography': 'Nhiếp ảnh',
  'budget': 'Tiết kiệm',
  'luxury': 'Cao cấp',
  'mid-range': 'Trung bình'
};

const ItineraryDetailPage: React.FC = () => {
  // DEBUG: Check if component mounts
  console.log("[ItineraryDetailPage] COMPONENT MOUNTING - If you see this, component is rendering");

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);


  const location = useLocation();
  const locationState = location.state as {
    planResult?: any;
    formData?: any;
    selectedTours?: string[];
    selectedHotel?: string;
    selectedHotelData?: any;  // Full hotel object from hotel agent
  };

  useEffect(() => {
    if (locationState?.planResult) {
      processAIResult(locationState.planResult, locationState.formData);
    } else if (id) {
      loadItinerary();
    } else {
      setLoading(false);
    }
  }, [id, locationState]);

  const processAIResult = (result: any, formData: any) => {
    try {
      setLoading(true);
      console.log("[ItineraryDetailPage] Processing AI result:", result);

      // Super Guide now returns enriched data directly as object
      let parsedData: any = {};
      const content = result.itinerary_content;

      if (typeof content === 'string') {
        try {
          const clean = content.replace(/^```json/, '').replace(/```$/, '').trim();
          parsedData = JSON.parse(clean);
        } catch (e) {
          console.error("Failed to parse AI JSON", e);
          parsedData = { days: [] };
        }
      } else if (typeof content === 'object') {
        parsedData = content;
      }

      console.log("[ItineraryDetailPage] Parsed data:", parsedData);

      // Map slot_type to Vietnamese display type
      const getDisplayType = (slot: any) => {
        const slotType = slot.slot_type || '';
        const mealType = slot.meal_type || '';

        if (slotType === 'transport') return 'Di chuyển';
        if (slotType === 'rest') return 'Nghỉ ngơi';
        if (slotType === 'meal') {
          if (mealType === 'breakfast') return 'Ăn sáng';
          if (mealType === 'lunch') return 'Ăn trưa';
          if (mealType === 'dinner') return 'Ăn tối';
          return 'Ăn uống';
        }
        if (slotType === 'attraction') return 'Tham quan';
        return 'Trải nghiệm';
      };

      // Map new Super Guide schema to UI structure
      const days = Array.isArray(parsedData.days) ? parsedData.days : [];
      const dailyPlan = days.map((d: any) => {
        const schedule = d.schedule || [];

        // Map each slot in schedule
        const activities = schedule.map((slot: any) => ({
          // Required fields
          time: slot.time || '',
          type: getDisplayType(slot),
          title: slot.slot_type === 'transport'
            ? `${slot.from || 'Điểm A'} → ${slot.to || 'Điểm B'}`
            : (slot.activity || 'Hoạt động'),
          description: slot.slot_type === 'transport'
            ? `Di chuyển: ${slot.method || 'Taxi'}`
            : (slot.activity || 'Trải nghiệm'),

          // Location
          location: typeof slot.location === 'object'
            ? slot.location?.name
            : slot.location,

          // Cost & duration
          cost: slot.cost || slot.estimated_cost || 0,
          duration: slot.duration || (slot.duration_minutes ? `${slot.duration_minutes} phút` : undefined),

          // Tips
          tips: slot.tips || null,

          // New: Images from enrichment
          images: slot.images || [],

          // New: Details from enrichment
          details: slot.details || null,

          // New: Transport specific
          transport: slot.slot_type === 'transport' ? {
            from: slot.from,
            to: slot.to,
            method: slot.method,
            distance_km: slot.distance_km,
            duration_minutes: slot.duration_minutes,
            alternative: slot.alternative
          } : null,

          // New: Meal specific
          dish_recommendation: slot.dish_recommendation || [],

          // Slot metadata
          slot_id: slot.slot_id,
          slot_type: slot.slot_type
        }));

        return {
          day: d.day,
          date: d.date,
          title: `Ngày ${d.day}`,
          activities,
          // New: Daily briefing
          daily_briefing: d.daily_briefing || null,
          // New: Start point
          start_point: d.start_point || null,
          // New: Day summary
          day_summary: d.day_summary || null
        };
      });

      // Build adapted itinerary for UI
      const tripOverview = parsedData.trip_overview || {};
      const tripSummary = parsedData.trip_summary || {};

      const adaptedItinerary = {
        _id: 'preview',
        name: `Hành trình khám phá ${tripOverview.destination || formData?.destination || 'Việt Nam'}`,
        startDate: formData?.startDate,
        endDate: formData?.endDate,
        status: 'draft',
        dailyPlan: dailyPlan,
        generationParams: {
          destination: tripOverview.destination || formData?.destination,
          travelers: formData?.travelers,
          budget: formData?.budget,
          style: formData?.travelStyle
        },
        totalCost: {
          total_estimated: result.total_cost || tripSummary.total_cost || 0,
          currency: 'VND',
          breakdown: tripSummary.cost_breakdown || null
        },
        hotels: locationState?.selectedHotelData
          ? [locationState.selectedHotelData]  // Full hotel object from hotel agent
          : (locationState?.selectedHotel ? [{
            name: locationState.selectedHotel,
            address: locationState.formData?.destination,
            rating: 4.5,
            price_per_night: 0
          }] : []),
        // New: Hero image
        heroImage: tripOverview.hero_image || null,
        // New: Packing checklist
        packingChecklist: tripSummary.packing_checklist || [],
        // Important notes
        importantNotes: [
          "Lịch trình này được tạo tự động bởi Super Guide AI.",
          "Hình ảnh và thông tin chi tiết được tìm kiếm từ internet.",
          "Chi phí là ước tính, vui lòng xác nhận trực tiếp."
        ]
      };

      console.log("[ItineraryDetailPage] Adapted itinerary:", adaptedItinerary);
      setItinerary(adaptedItinerary);
    } catch (err) {
      console.error("Error processing AI result", err);
      toast({ title: "Lỗi xử lý dữ liệu", description: "Không thể đọc dữ liệu từ AI", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadItinerary = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await getItineraryById(id);
      if (response.success && response.data) {
        setItinerary(response.data);
      } else {
        toast({
          title: "Không tìm thấy",
          description: "Kế hoạch không tồn tại hoặc bạn không có quyền truy cập.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error loading itinerary:', error);
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải kế hoạch.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Check if we have a saved ID from location state (passed from My Plans)
    // or if we already have a loaded 'id' param from URL
    const existingId = id || locationState?.savedItineraryId;

    if (existingId) {
      // UPDATE existing plan
      try {
        await updateItinerary(existingId, {
          status: 'published',
          // Also update basic info if coming from a re-plan
          // name, dates etc if changed
        });
        toast({
          title: "Đã cập nhật",
          description: "Kế hoạch đã được cập nhật thành công.",
        });
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error?.message || "Không thể cập nhật kế hoạch.",
          variant: "destructive",
        });
      }
      return;
    }

    // CREATE new plan logic ...
    // If no existing ID, treat as new (e.g. from Wizard preview)
    if (itinerary && user) {
      try {
        const result = await saveItinerary({
          name: itinerary.name || `Hành trình ${itinerary.generationParams?.destination || 'Việt Nam'}`,
          destination: itinerary.generationParams?.destination || 'Việt Nam',
          start_date: itinerary.startDate,
          end_date: itinerary.endDate,
          travelers: itinerary.generationParams?.travelers || 1,
          budget: itinerary.generationParams?.budget,
          travel_style: itinerary.generationParams?.style,
          itinerary_content: locationState?.planResult?.itinerary_content || {},
          hotel: itinerary.hotels?.[0] || null,
          selected_tours: locationState?.selectedTours || [],
          total_cost: itinerary.totalCost?.total_estimated || 0
        }, user._id);

        toast({
          title: "🎉 Đã lưu kế hoạch!",
          description: "Xem trong 'Kế hoạch của tôi' để quản lý.",
        });

        // Navigate to my plans
        navigate('/my-plans');
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error?.message || "Không thể lưu kế hoạch. Vui lòng đăng nhập.",
          variant: "destructive",
        });
      }
      return;
    }

    // If we have an existing ID, update it
    if (id) {
      try {
        await updateItinerary(id, { status: 'published' });
        toast({
          title: "Đã lưu",
          description: "Kế hoạch đã được lưu thành công.",
        });
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error?.message || "Không thể lưu kế hoạch.",
          variant: "destructive",
        });
      }
      return;
    }

    // No user - prompt login
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập",
        description: "Bạn cần đăng nhập để lưu kế hoạch.",
        variant: "warning",
      });
      navigate('/login');
    }
  };

  const handleShare = () => {
    // If we have an ID (either saved in DB or preview), we can share
    // But backend requires a valid ObjectId
    const currentId = id || (itinerary._id !== 'preview' ? itinerary._id : null);

    if (!currentId) {
      toast({
        title: "Chưa lưu kế hoạch",
        description: "Vui lòng lưu kế hoạch trước khi chia sẻ.",
        variant: "warning"
      });
      return;
    }

    setShowShareModal(true);
  };

  const handleShareComplete = () => {
    // Navigate home or stay, user requested to return to my-plans? 
    // Wait, user said "quay về lại my-plans" on share. 
    // Implementing that behavior:
    // Actually, staying on page is better UX, maybe just close modal?
    // But previous code redirected, so I'll keep it or just close.
    // Let's just close modal for now to keep them on the plan.
    setShowShareModal(false);
  };

  const handleViewHotelOnMap = (hotel: any) => {
    if (hotel.coordinates) {
      setSelectedDay(null);
      // In a real implementation, center map on hotel
      console.log('View hotel on map:', hotel);
    }
  };

  // Safe Rendering Helpers
  const safeDate = (dateStr: any) => {
    try {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch (e) {
      return '';
    }
  };

  const safeCurrency = (amount: any) => {
    try {
      if (!amount && amount !== 0) return '0 ₫';
      return amount.toLocaleString('vi-VN') + ' ₫';
    } catch (e) {
      return '0 ₫';
    }
  };

  // Handle Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải kế hoạch...</p>
        </div>
      </div>
    );
  }

  // Handle NotFound
  if (!itinerary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy kế hoạch của bạn</h1>
          <p className="text-gray-600 mb-6">Có vẻ như bạn đã truy cập trực tiếp. Hãy quay lại để tạo một kế hoạch mới nhé.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Tạo kế hoạch mới
          </Link>
        </div>
      </div>
    );
  }

  // Variables for Render
  let startDate = '', endDate = '', duration = '', userBudget = null, dailyPlan: any[] = [];
  let itineraryName = 'Kế hoạch du lịch';

  try {
    itineraryName = itinerary.name || itinerary.aiPlan?.itineraryName || 'Kế hoạch du lịch';
    startDate = safeDate(itinerary.startDate);
    endDate = safeDate(itinerary.endDate);
    duration = startDate && endDate ? `${startDate} - ${endDate}` : '';

    userBudget = itinerary.generationParams?.budget ?
      (itinerary.generationParams.budget === 'budget' ? 2000000 :
        itinerary.generationParams.budget === 'mid-range' ? 3500000 : 6000000) : null;

    // Daily Plan Logic
    if (itinerary.dailyPlan) {
      dailyPlan = itinerary.dailyPlan;
    } else if (itinerary.aiPlan?.schedule) {
      dailyPlan = itinerary.aiPlan.schedule.map((day: any) => ({
        day: day.day,
        date: day.date || '',
        title: day.title || `Ngày ${day.day}`,
        activities: day.activities || []
      }));
    }
  } catch (err) {
    console.error("Error calculating render variables:", err);
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-red-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Quay lại</span>
        </button>

        {/* Header Card */}
        <div className="bg-white p-8 rounded-xl shadow-lg mb-8 border border-orange-100">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {itineraryName}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                {duration && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span className="font-medium">{duration}</span>
                  </div>
                )}
                {itinerary.generationParams?.travelers && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">{itinerary.generationParams.travelers} người</span>
                  </div>
                )}
                {itinerary.totalCost?.total_estimated && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    <span className="font-medium">
                      {safeCurrency(itinerary.totalCost.total_estimated)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Chia sẻ
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Yêu thích
              </Button>
            </div>
          </div>

          {itinerary.generationParams?.style && (
            <div className="bg-gradient-to-r from-orange-100 to-red-100 p-4 rounded-lg border border-orange-200">
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">Phong cách du lịch:</span> {travelStyleVN[itinerary.generationParams.style] || itinerary.generationParams.style}
              </p>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Timeline (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
              {dailyPlan.length > 0 ? (
                <ItineraryTimeline schedule={dailyPlan} />
              ) : (
                <div className="text-center py-10 text-gray-500">Chưa có lịch trình chi tiết.</div>
              )}
            </div>

            {/* Important Notes */}
            {itinerary.importantNotes && itinerary.importantNotes.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-100">
                <h3 className="text-xl font-semibold mb-4">Lưu ý quan trọng</h3>
                <ul className="space-y-2">
                  {itinerary.importantNotes.map((note: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: Sidebar (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Map */}
            {itinerary.mapData && (
              <InteractiveRouteMap
                mapData={itinerary.mapData}
                selectedDay={selectedDay}
                onDayChange={setSelectedDay}
              />
            )}

            {/* Hotel Section */}
            {itinerary.hotels && itinerary.hotels.length > 0 && (
              <HotelSection
                hotels={itinerary.hotels}
                selectedHotelIndex={0}
                onViewOnMap={handleViewHotelOnMap}
              />
            )}

            {/* Budget Summary */}
            {itinerary.totalCost && (
              <BudgetSummary
                budget={itinerary.totalCost}
                userBudget={userBudget}
              />
            )}

            {/* Legacy Suggestions Sidebar (if aiPlan exists) */}
            {itinerary.aiPlan?.suggestions && (
              <SuggestionsSidebar suggestions={itinerary.aiPlan.suggestions} />
            )}
          </div>
        </div>

        {/* Summary Footer */}
        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-orange-100">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sẵn sàng cho hành trình tuyệt vời?
            </h3>
            <p className="text-gray-600 mb-4">
              Kế hoạch của bạn đã được tối ưu hóa để mang lại trải nghiệm du lịch hoàn hảo
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleSave} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                Lưu kế hoạch
              </Button>
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Chia sẻ với bạn bè
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Xuất PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            planName={itineraryName}
            planId={id || itinerary._id || 'preview'} // Pass ID
            onShare={handleShareComplete}
          />
        )}
      </div>
    </div>
  );
};

export default ItineraryDetailPage;
