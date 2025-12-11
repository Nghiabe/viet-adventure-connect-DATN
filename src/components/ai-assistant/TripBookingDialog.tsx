import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plane, Bus, Train, Car, Clock, MapPin, Users, Calendar,
    CheckCircle2, Loader2, ExternalLink, PartyPopper
} from "lucide-react";
import { TripData } from "./TripCard";

interface TripBookingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trip: TripData | null;
}

const getTransportIcon = (type: string) => {
    switch (type) {
        case "may_bay": return <Plane className="w-6 h-6" />;
        case "xe_khach": return <Bus className="w-6 h-6" />;
        case "tau_hoa": return <Train className="w-6 h-6" />;
        case "taxi": return <Car className="w-6 h-6" />;
        default: return <Bus className="w-6 h-6" />;
    }
};

const getGradientByType = (type: string) => {
    switch (type) {
        case "may_bay": return "from-sky-500 to-blue-600";
        case "xe_khach": return "from-emerald-500 to-teal-600";
        case "tau_hoa": return "from-orange-500 to-red-600";
        case "taxi": return "from-yellow-500 to-amber-600";
        default: return "from-primary to-primary/80";
    }
};

export const TripBookingDialog = ({ open, onOpenChange, trip }: TripBookingDialogProps) => {
    const [passengers, setPassengers] = useState(1);
    const [travelDate, setTravelDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [bookingCode, setBookingCode] = useState("");

    if (!trip) return null;

    const gradient = getGradientByType(trip.type);
    const totalPrice = trip.price * passengers;
    const formattedTotal = `${totalPrice.toLocaleString("vi-VN")}₫`;

    const handleSubmit = async () => {
        setIsSubmitting(true);

        // Simulate booking process
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Generate booking code
        const code = `VAC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        setBookingCode(code);
        setIsSuccess(true);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after animation
        setTimeout(() => {
            setIsSuccess(false);
            setIsSubmitting(false);
            setPassengers(1);
            setTravelDate("");
            setBookingCode("");
        }, 300);
    };

    // Success State
    if (isSuccess) {
        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-md">
                    <div className="text-center py-6 space-y-4">
                        <div className="animate-bounce">
                            <PartyPopper className="w-16 h-16 mx-auto text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-green-600">Đặt vé thành công! 🎉</h2>

                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                            <p className="text-sm text-muted-foreground">Mã đặt vé của bạn:</p>
                            <p className="text-2xl font-mono font-bold text-green-700">{bookingCode}</p>
                        </div>

                        <div className="text-left bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                            <p><strong>Chuyến:</strong> {trip.departure} → {trip.destination}</p>
                            <p><strong>Nhà xe:</strong> {trip.provider}</p>
                            <p><strong>Số vé:</strong> {passengers}</p>
                            <p><strong>Tổng tiền:</strong> <span className="text-primary font-bold">{formattedTotal}</span></p>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            Thông tin chi tiết đã được gửi đến email của bạn.
                        </p>

                        <Button onClick={handleClose} className="w-full">
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Hoàn tất
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Booking Form
    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-r ${gradient} text-white`}>
                            {getTransportIcon(trip.type)}
                        </div>
                        <div>
                            <p className="text-lg">{trip.provider}</p>
                            <Badge variant="outline" className="mt-1">{trip.typeLabel}</Badge>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Route Info */}
                    <div className={`bg-gradient-to-r ${gradient} text-white rounded-xl p-4`}>
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{trip.departure.split(" ")[0]}</p>
                                <p className="text-xs opacity-80">{trip.departure}</p>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                <div className="w-full max-w-[120px] h-0.5 bg-white/30 relative">
                                    <Plane className="w-5 h-5 absolute -top-2.5 left-1/2 -translate-x-1/2 transform rotate-90" />
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{trip.destination.split(" ")[0]}</p>
                                <p className="text-xs opacity-80">{trip.destination}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-3 text-sm opacity-90">
                            <Clock className="w-4 h-4" />
                            <span>{trip.duration}</span>
                        </div>
                    </div>

                    {/* Description */}
                    {trip.description && (
                        <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 italic">
                            {trip.description}
                        </p>
                    )}

                    {/* Form Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="passengers" className="flex items-center gap-2">
                                <Users className="w-4 h-4" /> Số hành khách
                            </Label>
                            <Input
                                id="passengers"
                                type="number"
                                min={1}
                                max={10}
                                value={passengers}
                                onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date" className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Ngày đi
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={travelDate}
                                onChange={(e) => setTravelDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Giá vé ({passengers}x)</span>
                            <span>{trip.priceFormatted} × {passengers}</span>
                        </div>
                        <div className="flex items-center justify-between font-bold text-lg border-t pt-2">
                            <span>Tổng cộng</span>
                            <span className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                                {formattedTotal}
                            </span>
                        </div>
                    </div>

                    {/* Source */}
                    {trip.source_url && (
                        <a
                            href={trip.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                            Thông tin từ: {trip.source_title || "Nguồn web"}
                        </a>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleClose}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`bg-gradient-to-r ${gradient} text-white hover:opacity-90`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Xác nhận đặt vé
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TripBookingDialog;
