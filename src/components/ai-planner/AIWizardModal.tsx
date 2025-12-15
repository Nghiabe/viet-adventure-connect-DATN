import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, MapPin, Calendar, Users, Hotel, CheckCircle, Sparkles, ArrowRight, ArrowLeft, Building2, Palmtree, Mountain, Wheat, Landmark, Store, Utensils, Flower2, ShoppingBag, Music, Camera } from "lucide-react";

// ... existing code ...


import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { runResearch, runHotelSearch, runPlanning } from "@/services/plannerService";
import { ExpandableTourCard } from "./ExpandableTourCard";
import { WizardHotelCard } from "./WizardHotelCard";


import { PlannerData } from "@/types/planner";

interface AIWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { TRAVEL_STYLES, INTERESTS } from "@/data/constants";

const interestIcons: Record<string, any> = {
  "Bãi biển": Palmtree,
  "Núi non": Mountain,
  "Thành phố": Building2,
  "Làng quê": Wheat,
  "Chùa chiền": Landmark,
  "Bảo tàng": Camera,
  "Chợ đêm": Store,
  "Ẩm thực đường phố": Utensils,
  "Spa & Wellness": Flower2,
  "Mua sắm": ShoppingBag
};

export const AIWizardModal = ({ isOpen, onClose }: AIWizardModalProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [formData, setFormData] = useState<PlannerData>({
    destination: "",
    startDate: "",
    endDate: "",
    travelers: 2,
    budget: "mid-range",
    travelStyle: "cultural",
    interests: [],
  });

  // Micro-Agent Data States
  const [tours, setTours] = useState<any[]>([]);
  const [selectedTours, setSelectedTours] = useState<string[]>([]);

  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>("");

  // Planner Result
  const [planResult, setPlanResult] = useState<{ itinerary_content: string; total_cost?: number } | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 6; // 1: Dest/Date, 2: Travelers/Budget, 3: Style, 4: Interests, 5: Tour Select, 6: Hotel Select

  if (!isOpen) return null;

  // --- API Handlers ---

  const handleRunResearch = async () => {
    setLoadingStep("Đang tìm kiếm trải nghiệm...");
    try {
      const budgetVal = formData.budget === 'budget' ? 1000000 : formData.budget === 'mid-range' ? 3000000 : 6000000;

      const result = await runResearch({
        destination: formData.destination,
        dates: { start: formData.startDate, end: formData.endDate },
        budget: budgetVal,
        style: formData.travelStyle,
        interests: formData.interests,
      });

      if (result.matched_tours && result.matched_tours.length > 0) {
        setTours(result.matched_tours);
        // Auto-select all by default or top 3
        setSelectedTours(result.matched_tours.map((t: any) => t.tour_id));
        setCurrentStep(5); // Go to Tour Selection
      } else {
        toast({ title: "Không tìm thấy tour", description: "Vui lòng thử thay đổi sở thích.", variant: "default" });
      }
    } catch (e: any) {
      toast({ title: "Lỗi", description: e.message, variant: "destructive" });
    } finally {
      setLoadingStep(null);
    }
  };

  const handleRunHotel = async () => {
    setLoadingStep("Đang tìm khách sạn...");
    try {
      // Basic budget mapping
      const budgetVal = formData.budget === 'budget' ? 800000 : formData.budget === 'mid-range' ? 1500000 : 3000000;

      const result = await runHotelSearch({
        destination_id: formData.destination,
        check_in: formData.startDate,
        check_out: formData.endDate,
        budget: budgetVal,
        guests: formData.travelers
      });

      if (result.hotels && result.hotels.length > 0) {
        setHotels(result.hotels);
        setSelectedHotel(result.hotels[0].name); // Default select first
        setCurrentStep(6); // Go to Hotel Selection
      } else {
        toast({ title: "Không tìm thấy khách sạn", description: "Chúng tôi sẽ tự động chọn.", variant: "default" });
        handleRunPlanning(); // Use API default
      }
    } catch (e: any) {
      toast({ title: "Lỗi tìm khách sạn", description: e.message, variant: "destructive" });
    } finally {
      setLoadingStep(null);
    }
  };

  const handleRunPlanning = async () => {
    setLoadingStep("Đang tổng hợp lịch trình...");
    try {
      const selectedHotelData = hotels.find(h => h.name === selectedHotel) || {};

      const result = await runPlanning({
        destination_id: formData.destination,
        dates: { start: formData.startDate, end: formData.endDate },
        selected_tours: selectedTours,
        tours_data: tours.filter(t => selectedTours.includes(t.tour_id)),
        selected_hotel: selectedHotel,
        hotel_data: selectedHotelData
      });

      onClose(); // Close modal immediately
      toast({ title: "Thành công!", description: "Đang chuyển đến trang chi tiết lịch trình..." });

      // Navigate to the beautiful result page
      navigate('/itinerary-detail', {
        state: {
          planResult: result,
          formData: formData,
          selectedTours: selectedTours,
          selectedHotel: selectedHotel,
          selectedHotelData: selectedHotelData  // Full hotel object for display
        }
      });

    } catch (e: any) {
      toast({ title: "Lỗi tạo lịch trình", description: e.message, variant: "destructive" });
    } finally {
      setLoadingStep(null);
    }
  };

  // --- Step Logic ---

  const handleNext = () => {
    if (currentStep === 4) {
      // Finish preferences -> Run Research
      handleRunResearch();
    } else if (currentStep === 5) {
      // Finish Tour Select -> Run Hotel
      handleRunHotel();
    } else if (currentStep === 6) {
      // Finish Hotel Select -> Run Planning
      handleRunPlanning();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!formData.destination && !!formData.startDate && !!formData.endDate;
      case 2: return formData.travelers > 0;
      case 3: return !!formData.travelStyle;
      case 4: return formData.interests.length > 0;
      case 5: return selectedTours.length > 0;
      case 6: return !!selectedHotel;
      default: return true;
    }
  };

  // --- Rendering ---

  // --- Premium Rendering Components ---

  const StepHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="mb-6 text-center">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
        {title}
      </h2>
      <p className="text-muted-foreground">{subtitle}</p>
    </div>
  );

  const renderTourSelection = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StepHeader title="Trải Nghiệm Đề Xuất" subtitle="AI đã tìm thấy những hoạt động phù hợp nhất với phong cách của bạn." />

      <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg border border-secondary mb-4">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <span>Được cá nhân hóa cho chuyến đi {formData.destination}</span>
        </div>
        <span className="text-sm font-semibold bg-white px-2 py-1 rounded shadow-sm">{selectedTours.length} đã chọn</span>
      </div>

      <ScrollArea className="h-[450px] pr-4">
        <div className="grid grid-cols-1 gap-4">
          {tours.map((tour) => (
            <ExpandableTourCard
              key={tour.tour_id}
              tour={tour}
              isSelected={selectedTours.includes(tour.tour_id)}
              onSelect={(tourId) => {
                if (selectedTours.includes(tourId)) {
                  setSelectedTours(selectedTours.filter(id => id !== tourId));
                } else {
                  setSelectedTours([...selectedTours, tourId]);
                }
              }}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  const renderHotelSelection = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <StepHeader title="Nơi Lưu Trú Hoàn Hảo" subtitle="AI đã tìm thấy những khách sạn tốt nhất phù hợp ngân sách của bạn." />

      {/* Stats Bar */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-xl border border-emerald-100 mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-600" />
          <span className="font-medium text-emerald-700">
            {hotels.length} khách sạn phù hợp
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{formData.startDate} đến {formData.endDate}</span>
        </div>
      </div>

      {hotels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Hotel className="h-8 w-8 text-gray-400" />
          </div>
          <h4 className="font-semibold text-gray-700 mb-2">Không tìm thấy khách sạn</h4>
          <p className="text-sm text-gray-500 max-w-xs">Vui lòng thử thay đổi ngày hoặc ngân sách để tìm thêm lựa chọn.</p>
        </div>
      ) : (
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-4">
            {hotels.map((hotel, index) => (
              <WizardHotelCard
                key={hotel.hotel_id || hotel.name || index}
                hotel={hotel}
                isSelected={selectedHotel === hotel.name}
                onSelect={() => setSelectedHotel(hotel.name)}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Selected Indicator */}
      {selectedHotel && (
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-200 animate-in slide-in-from-bottom-2">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Đã chọn: {selectedHotel}</span>
        </div>
      )}
    </div>
  );


  const renderStepContent = () => {
    // Loading State with nicer animation
    if (loadingStep) {
      return (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
            <Sparkles className="h-16 w-16 text-primary relative z-10 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{loadingStep}</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">AI đang phân tích hàng triệu dữ liệu để tìm ra lựa chọn tốt nhất cho bạn.</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            <StepHeader title="Bắt Đầu Hành Trình" subtitle="Hãy cho chúng tôi biết về chuyến đi mơ ước của bạn." />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="destination" className="text-base font-semibold">Điểm đến</Label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="destination"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    placeholder="Ví dụ: Đà Nẵng, Sa Pa, Phú Quốc..."
                    className="pl-10 h-12 text-lg shadow-sm border-gray-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Ngày đi</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="pl-10 h-11" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">Ngày về</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="pl-10 h-11" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-300">
            <StepHeader title="Chi Tiết Chuyến Đi" subtitle="Giúp chúng tôi tối ưu chi phí và trải nghiệm." />

            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Số người tham gia</Label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="number"
                      min="1"
                      value={formData.travelers}
                      onChange={(e) => setFormData({ ...formData, travelers: parseInt(e.target.value) })}
                      className="pl-10 h-12 text-lg"
                    />
                  </div>
                  <span className="text-muted-foreground text-sm font-medium">Người lớn</span>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Ngân sách dự kiến (mỗi người)</Label>
                <RadioGroup value={formData.budget} onValueChange={(v) => setFormData({ ...formData, budget: v })} className="grid grid-cols-1 gap-3">
                  {[
                    { val: "budget", label: "Tiết kiệm", desc: "< 2 triệu", icon: "💰" },
                    { val: "mid-range", label: "Phổ thông", desc: "2 - 5 triệu", icon: "💎" },
                    { val: "luxury", label: "Sang trọng", desc: "> 5 triệu", icon: "👑" }
                  ].map((b) => (
                    <div key={b.val} className={cn(
                      "flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50",
                      formData.budget === b.val ? "border-primary bg-primary/5" : "border-transparent bg-gray-50/50"
                    )}>
                      <RadioGroupItem value={b.val} id={b.val} className="hidden" />
                      <Label htmlFor={b.val} className="flex-1 flex items-center gap-3 cursor-pointer">
                        <span className="text-2xl">{b.icon}</span>
                        <div>
                          <div className="font-bold text-gray-900">{b.label}</div>
                          <div className="text-xs text-muted-foreground">{b.desc}</div>
                        </div>
                      </Label>
                      {formData.budget === b.val && <CheckCircle className="h-5 w-5 text-primary" />}
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            <StepHeader title="Phong Cách Du Lịch" subtitle="Bạn thích tận hưởng chuyến đi như thế nào?" />

            <div className="grid grid-cols-2 gap-4">
              {TRAVEL_STYLES.map(s => (
                <div
                  key={s.id}
                  className={cn(
                    "cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02]",
                    formData.travelStyle === s.id
                      ? "border-primary bg-primary text-primary-foreground shadow-lg"
                      : "border-gray-200 bg-white hover:border-primary/30"
                  )}
                  onClick={() => setFormData({ ...formData, travelStyle: s.id })}
                >
                  <div className="text-3xl mb-2">{s.emoji}</div>
                  <h3 className={cn("font-bold", formData.travelStyle === s.id ? "text-white" : "text-gray-900")}>{s.title}</h3>
                  <p className={cn("text-xs mt-1 opacity-80", formData.travelStyle === s.id ? "text-white" : "text-gray-500")}>{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
            <StepHeader title="Sở Thích Cá Nhân" subtitle="Chọn những điều bạn quan tâm nhất để chúng tôi thiết kế lịch trình phù hợp (Chọn nhiều)." />

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
                {INTERESTS.map(i => {
                  const selected = formData.interests.includes(i);
                  const Icon = interestIcons[i] || Sparkles;

                  return (
                    <div
                      key={i}
                      onClick={() => {
                        const newInt = selected ? formData.interests.filter(x => x !== i) : [...formData.interests, i];
                        setFormData({ ...formData, interests: newInt });
                      }}
                      className={cn(
                        "group cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg flex flex-col items-center justify-center gap-3 text-center h-40",
                        selected
                          ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                          : "border-gray-100 bg-white hover:border-primary/40 hover:scale-[1.02]"
                      )}
                    >
                      {/* Selection Check Circle */}
                      <div className={cn(
                        "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                        selected ? "bg-primary text-white scale-100" : "bg-gray-100 text-gray-300 scale-90 opacity-0 group-hover:opacity-100"
                      )}>
                        <CheckCircle className="w-4 h-4" />
                      </div>

                      {/* Icon Background Blob */}
                      <div className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                        selected ? "bg-white text-primary shadow-sm" : "bg-gray-50 text-gray-500 group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        <Icon className="w-7 h-7" />
                      </div>

                      <span className={cn(
                        "font-semibold text-sm transition-colors",
                        selected ? "text-primary" : "text-gray-600 group-hover:text-gray-900"
                      )}>
                        {i}
                      </span>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="text-center text-sm text-gray-500">
              Đã chọn: <span className="font-bold text-primary">{formData.interests.length}</span> sở thích
            </div>
          </div>
        )
      case 5: return renderTourSelection();
      case 6: return renderHotelSelection();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Abstract Background Shapes */}
      <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-6xl min-h-[600px] max-h-[90vh] flex flex-col border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase">Beta</span>
              <span className="text-sm text-muted-foreground font-medium">AI Travel Planner</span>
            </div>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className={cn("h-1 w-6 rounded-full transition-all duration-300",
                  i + 1 <= currentStep ? "bg-primary" : "bg-gray-200"
                )} />
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100"><X className="h-5 w-5 text-gray-500" /></Button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          {renderStepContent()}
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-b-2xl">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || !!loadingStep}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isStepValid() || !!loadingStep}
            size="lg"
            className="px-8 bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-700 shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02]"
          >
            {loadingStep ? "Đang xử lý..." : currentStep === 6 ? "Hoàn tất & Tạo lịch trình" : "Tiếp tục"}
            {!loadingStep && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ... constants
export default AIWizardModal;
