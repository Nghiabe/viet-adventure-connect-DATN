import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Check, XCircle, Edit, MapPin, Hotel, Star, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckpointReviewModalProps {
  checkpointId: 'checkpoint_1' | 'checkpoint_2' | 'checkpoint_3';
  data: any;
  prompt: string;
  onFeedback: (feedback: any) => void;
  onClose: () => void;
}

export const CheckpointReviewModal = ({
  checkpointId,
  data,
  prompt,
  onFeedback,
  onClose
}: CheckpointReviewModalProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [adjustmentRequest, setAdjustmentRequest] = useState<string>("");

  const handleApprove = () => {
    if (checkpointId === 'checkpoint_1') {
      if (selectedIndex !== null && data.matched_tours?.[selectedIndex]) {
        onFeedback({
          action: "use_existing",
          selected_tour_id: data.matched_tours[selectedIndex].tour_id
        });
      } else {
        onFeedback({ action: "create_new" });
      }
    } else if (checkpointId === 'checkpoint_2') {
      if (selectedIndex !== null && data.hotels?.[selectedIndex]) {
        onFeedback({
          action: "approve",
          selected_hotel_index: selectedIndex
        });
      } else {
        onFeedback({ action: "approve", selected_hotel_index: 0 });
      }
    } else if (checkpointId === 'checkpoint_3') {
      onFeedback({ action: "approve" });
    }
  };

  const handleAdjust = () => {
    if (checkpointId === 'checkpoint_2') {
      onFeedback({
        action: "adjust",
        adjustment_type: adjustmentRequest
      });
    } else {
      onFeedback({ action: "adjust" });
    }
  };

  const renderCheckpoint1 = () => {
    const tours = data.matched_tours || [];
    
    if (tours.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Không tìm thấy tours phù hợp</p>
          <Button onClick={() => onFeedback({ action: "create_new" })}>
            Tạo lịch trình mới
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {tours.map((tour: any, index: number) => (
          <Card
            key={index}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedIndex === index
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            )}
            onClick={() => setSelectedIndex(index)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{tour.title}</CardTitle>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Match: {Math.round(tour.match_score * 100)}%
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      {tour.price?.toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tour.duration}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                {tour.fit_reason}
              </p>
              {tour.itinerary_preview && (
                <p className="text-xs text-muted-foreground">
                  {tour.itinerary_preview}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderCheckpoint2 = () => {
    const hotels = data.hotels || [];
    
    if (hotels.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Không tìm thấy khách sạn</p>
          <Button onClick={handleAdjust}>Tìm lại</Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {hotels.map((hotel: any, index: number) => (
          <Card
            key={index}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              selectedIndex === index
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-muted/50"
            )}
            onClick={() => setSelectedIndex(index)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{hotel.name}</CardTitle>
                  <div className="flex items-center gap-4 mt-2">
                    {hotel.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{hotel.rating}</span>
                      </div>
                    )}
                    {hotel.price_per_night && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        {hotel.price_per_night.toLocaleString('vi-VN')} ₫/đêm
                      </div>
                    )}
                    {hotel.total_price && (
                      <div className="text-sm font-medium text-primary">
                        Tổng: {hotel.total_price.toLocaleString('vi-VN')} ₫
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hotel.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4" />
                  {hotel.location}
                </div>
              )}
              {hotel.why_recommended && (
                <p className="text-sm text-muted-foreground mb-2">
                  {hotel.why_recommended}
                </p>
              )}
              {hotel.amenities && hotel.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {hotel.amenities.slice(0, 5).map((amenity: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setAdjustmentRequest("cheaper");
              handleAdjust();
            }}
          >
            Tìm rẻ hơn
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setAdjustmentRequest("closer");
              handleAdjust();
            }}
          >
            Tìm gần trung tâm hơn
          </Button>
        </div>
      </div>
    );
  };

  const renderCheckpoint3 = () => {
    const itinerary = data.itinerary || {};
    const budget = data.budget || {};
    const tips = data.tips || [];
    
    return (
      <div className="space-y-6 max-h-[60vh] overflow-y-auto">
        <div>
          <h3 className="font-semibold mb-2">Lịch trình</h3>
          <p className="text-sm text-muted-foreground">
            {itinerary.name || "Kế hoạch du lịch"}
          </p>
        </div>
        
        {budget.total_estimated && (
          <div>
            <h3 className="font-semibold mb-2">Ngân sách</h3>
            <div className="text-lg font-bold text-primary">
              {budget.total_estimated.toLocaleString('vi-VN')} ₫
            </div>
            {budget.within_budget === false && (
              <p className="text-sm text-destructive mt-1">
                Vượt quá ngân sách dự kiến
              </p>
            )}
          </div>
        )}
        
        {tips.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Lưu ý quan trọng</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {tips.map((tip: string, i: number) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (checkpointId) {
      case 'checkpoint_1':
        return renderCheckpoint1();
      case 'checkpoint_2':
        return renderCheckpoint2();
      case 'checkpoint_3':
        return renderCheckpoint3();
      default:
        return <p>Unknown checkpoint</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Xem xét và phản hồi</h2>
            <p className="text-muted-foreground mt-1">{prompt}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
          <Button
            variant="outline"
            onClick={() => {
              if (checkpointId === 'checkpoint_2') {
                handleAdjust();
              } else {
                onFeedback({ action: "adjust" });
              }
            }}
          >
            {checkpointId === 'checkpoint_2' ? "Điều chỉnh" : "Chỉnh sửa"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleApprove}>
              <Check className="h-4 w-4 mr-2" />
              Xác nhận
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};



