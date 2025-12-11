import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plane, Bus, Train, Car, ExternalLink, Ticket, ArrowRight, Clock } from "lucide-react";

export interface TripData {
    id: string;
    provider: string;
    type: "may_bay" | "xe_khach" | "tau_hoa" | "taxi" | string;
    typeLabel: string;
    departure: string;
    destination: string;
    price: number;
    priceFormatted: string;
    duration: string;
    description?: string;
    source_url?: string;
    source_title?: string;
}

interface TripCardProps {
    trip: TripData;
    onBookClick: (trip: TripData) => void;
}

const getTransportIcon = (type: string) => {
    switch (type) {
        case "may_bay": return <Plane className="w-5 h-5" />;
        case "xe_khach": return <Bus className="w-5 h-5" />;
        case "tau_hoa": return <Train className="w-5 h-5" />;
        case "taxi": return <Car className="w-5 h-5" />;
        default: return <Ticket className="w-5 h-5" />;
    }
};

// Premium gradients for icon backgrounds
const getIconGradient = (type: string) => {
    switch (type) {
        case "may_bay": return "from-blue-500 to-indigo-600";
        case "xe_khach": return "from-emerald-400 to-teal-600";
        case "tau_hoa": return "from-orange-400 to-red-600";
        case "taxi": return "from-yellow-400 to-amber-600";
        default: return "from-gray-500 to-gray-700";
    }
};

// Stylized card component
export const TripCard = ({ trip, onBookClick }: TripCardProps) => {
    const iconGradient = getIconGradient(trip.type);

    return (
        <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
            {/* Top Decoration Line */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${iconGradient}`} />

            <CardContent className="p-4">
                {/* Header: Provider & Price - Responsive Layout */}
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`shrink-0 p-2 rounded-lg bg-gradient-to-br ${iconGradient} text-white shadow-sm`}>
                                {getTransportIcon(trip.type)}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-sm leading-tight text-foreground truncate max-w-[180px]" title={trip.provider}>
                                    {trip.provider}
                                </h3>
                                <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0 h-4 bg-secondary/70 font-normal border-0">
                                    {trip.typeLabel}
                                </Badge>
                            </div>
                        </div>

                        <div className="text-right shrink-0">
                            <span className={`block text-base font-bold bg-gradient-to-br ${iconGradient} bg-clip-text text-transparent`}>
                                {trip.priceFormatted}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Route Visualization - Compact */}
                <div className="relative py-2 my-2 bg-muted/30 rounded-lg border border-border/40 px-3">
                    <div className="flex justify-between items-center text-xs">
                        <div className="flex flex-col items-start min-w-[30%]">
                            <span className="font-bold text-foreground truncate max-w-full" title={trip.departure}>{trip.departure}</span>
                        </div>

                        <div className="flex flex-col items-center px-2">
                            <div className="text-[10px] text-muted-foreground bg-background px-1.5 rounded-full border border-border/50 mb-0.5">
                                {trip.duration}
                            </div>
                            <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
                        </div>

                        <div className="flex flex-col items-end min-w-[30%]">
                            <span className="font-bold text-foreground truncate max-w-full" title={trip.destination}>{trip.destination}</span>
                        </div>
                    </div>
                </div>

                {/* Description (Optional) */}
                {trip.description && (
                    <div className="mt-3 mb-4 p-2.5 bg-secondary/30 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {trip.description}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-auto pt-2">
                    <Button
                        onClick={() => onBookClick(trip)}
                        className={`flex-1 bg-gradient-to-r ${iconGradient} hover:opacity-90 text-white shadow-md shadow-primary/20 transition-all active:scale-95`}
                    >
                        Đặt vé ngay
                        <ArrowRight className="w-4 h-4 ml-1.5 opacity-80" />
                    </Button>

                    {trip.source_url && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            onClick={() => window.open(trip.source_url, '_blank')}
                            title="Xem nguồn"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default TripCard;
