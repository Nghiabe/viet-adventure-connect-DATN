import { ItineraryItem } from '@/types/planner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, DollarSign, Clock, MoreVertical, Trash2, Share2, Eye, Play } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TRAVEL_STYLES } from '@/data/constants';

interface PlanCardProps {
    plan: ItineraryItem;
    onView: (plan: ItineraryItem) => void;
    onShare: (plan: ItineraryItem) => void;
    onDelete: (id: string) => void; // Just triggers confirmation logic in parent
    onStart: (plan: ItineraryItem) => void;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    'draft': { label: 'Nháp', color: 'text-gray-700', bg: 'bg-gray-100' },
    'saved': { label: 'Đã lưu', color: 'text-blue-700', bg: 'bg-blue-100' },
    'active': { label: 'Đang đi', color: 'text-green-700', bg: 'bg-green-100' },
    'completed': { label: 'Hoàn thành', color: 'text-purple-700', bg: 'bg-purple-100' },
};

export const PlanCard = ({ plan, onView, onShare, onDelete, onStart }: PlanCardProps) => {
    const status = statusConfig[plan.status] || statusConfig['saved'];

    // Format helpers
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN');
        } catch { return dateStr; }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const dayCount = Array.isArray(plan.itinerary_content?.days) ? plan.itinerary_content.days.length : 0;

    // Find style implementation
    const styleObj = TRAVEL_STYLES.find(s => s.id === plan.travel_style);
    const styleLabel = styleObj ? styleObj.title : (plan.travel_style || 'Tự do');
    const styleEmoji = styleObj ? styleObj.emoji : '✈️';

    // Get hero image (mock logic based on destination or from data)
    const heroImage = plan.itinerary_content?.trip_overview?.hero_image ||
        `https://source.unsplash.com/800x600/?${plan.destination},travel`;

    return (
        <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-white">
            {/* Image Header */}
            <div className="relative h-48 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <img
                    src={heroImage}
                    alt={plan.destination}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3';
                    }}
                />

                <div className="absolute top-3 right-3 z-20">
                    <Badge className={cn("backdrop-blur-md border-0 pt-1", status.bg, status.color)}>
                        {status.label}
                    </Badge>
                </div>

                <div className="absolute bottom-3 left-4 right-4 z-20">
                    <h3 className="text-white font-bold text-xl line-clamp-1 mb-1">{plan.name}</h3>
                    <div className="flex items-center text-white/90 text-sm gap-3">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {plan.destination}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {dayCount} ngày</span>
                    </div>
                </div>
            </div>

            <CardContent className="p-4 flex-1">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{plan.start_date ? formatDate(plan.start_date) : 'Chưa định ngày'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{plan.travelers} người</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <span className="text-lg">{styleEmoji}</span>
                        <span>Phong cách: <span className="font-medium text-gray-900">{styleLabel}</span></span>
                    </div>

                    {plan.total_cost > 0 && (
                        <div className="flex items-center gap-2 text-green-600 font-semibold col-span-2 mt-1 bg-green-50 p-2 rounded-lg">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(plan.total_cost)}</span>
                        </div>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0 flex gap-2 border-t border-gray-50 bg-gray-50/30">
                <Button
                    className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shadow-sm"
                    onClick={() => onStart(plan)}
                >
                    <Play className="h-4 w-4 mr-2" /> Bắt đầu
                </Button>

                <Button variant="outline" size="icon" onClick={() => onView(plan)} title="Xem chi tiết">
                    <Eye className="h-4 w-4 text-gray-600" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onShare(plan)}>
                            <Share2 className="h-4 w-4 mr-2" /> Chia sẻ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(plan._id)} className="text-red-600 focus:text-red-700">
                            <Trash2 className="h-4 w-4 mr-2" /> Xóa kế hoạch
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardFooter>
        </Card>
    );
};
