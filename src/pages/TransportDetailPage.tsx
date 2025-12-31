
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/home/Header';
import { Footer } from '@/components/home/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Train, Bus, MapPin, Clock, Calendar, ArrowRight, User, Info, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const TransportDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { initiateBooking } = useBooking();

    // Query params for pre-filling
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('date');
    const passengersParam = searchParams.get('passengers');

    const [service, setService] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Booking State
    const [bookingDate, setBookingDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
    const [passengers, setPassengers] = useState(passengersParam ? parseInt(passengersParam) : 1);
    const [selectedTicketType, setSelectedTicketType] = useState<string>(''); // ID of ticket type
    const [isBooking, setIsBooking] = useState(false);

    useEffect(() => {
        const fetchService = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/transport/${id}`);
                const data = await res.json();

                if (data.success) {
                    setService(data.data);
                    // Select first ticket type by default
                    if (data.data.ticketTypes && data.data.ticketTypes.length > 0) {
                        setSelectedTicketType(data.data.ticketTypes[0]._id || data.data.ticketTypes[0].name);
                    }
                } else {
                    setError(data.error || 'Failed to load service');
                }
            } catch (err) {
                setError('Error connecting to server');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchService();
    }, [id]);

    // NEW: Availability State
    const [availability, setAvailability] = useState<any>({ ticketTypes: [], globalAvailable: null });
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    // Fetch availability when date changes
    useEffect(() => {
        if (!id || !bookingDate) return;

        const fetchAvailability = async () => {
            setCheckingAvailability(true);
            try {
                const res = await fetch(`/api/transport/${id}/availability?date=${bookingDate}`);
                const data = await res.json();
                if (data.success) {
                    setAvailability(data.data);
                }
            } catch (err) {
                console.error('Failed checking availability', err);
            } finally {
                setCheckingAvailability(false);
            }
        };

        fetchAvailability();
    }, [id, bookingDate]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'flight': return <Plane className="w-5 h-5" />;
            case 'train': return <Train className="w-5 h-5" />;
            case 'bus': return <Bus className="w-5 h-5" />;
            default: return <Plane className="w-5 h-5" />;
        }
    };

    const getTicketType = () => {
        if (!service?.ticketTypes) return null;
        // Match by ID or Name if ID missing
        return service.ticketTypes.find((t: any) => (t._id || t.name) === selectedTicketType) || service.ticketTypes[0];
    };

    const currentTicket = getTicketType();
    const unitPrice = currentTicket ? currentTicket.price : (service?.price || 0);
    const totalPrice = unitPrice * passengers;

    const handleBook = () => {
        if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để đặt vé");
            navigate('/login', { state: { from: location } });
            return;
        }

        if (!service) return;

        const currentTicket = getTicketType();

        // Check availability
        let availableQty = 50; // default
        if (currentTicket) {
            const ticketName = currentTicket.name || currentTicket._id;
            // Try to find in dynamic availability
            const dynamicTicket = availability.ticketTypes?.find((t: any) => t.name === ticketName || t.name === currentTicket._id);

            if (dynamicTicket) {
                availableQty = dynamicTicket.available;
            } else if (availability.globalAvailable !== null && (!service.ticketTypes || service.ticketTypes.length === 0)) {
                // Fallback to global if applicable
                availableQty = availability.globalAvailable;
            } else {
                // Fallback to static
                availableQty = currentTicket.quantity ?? 50;
            }
        } else {
            // No specific ticket type selected (unlikely if logic holds), check global
            if (availability.globalAvailable !== null) availableQty = availability.globalAvailable;
            else availableQty = service.quantity ?? 50;
        }

        if (passengers > availableQty) {
            toast.error(`Chỉ còn ${availableQty} vé cho hạng vé này vào ngày ${format(new Date(bookingDate), 'dd/MM/yyyy')}.`);
            return;
        }

        initiateBooking({
            type: service.type,
            title: `${service.type === 'flight' ? 'Vé máy bay' : service.type === 'train' ? 'Vé tàu' : 'Vé xe'} ${service.operator} - ${service?.departure?.station} đi ${service?.arrival?.station}`,
            operator: service.operator,
            transportNumber: service.id, // Or flight number
            origin: {
                city: service.departure.station,
                station: service.departure.station,
                time: service.departure.time
            },
            destination: {
                city: service.arrival.station,
                station: service.arrival.station,
                time: service.arrival.time
            },
            bookingDate: bookingDate,
            duration: service.duration,
            participantsTotal: passengers,
            unitPrice: unitPrice,
            clientComputedTotal: totalPrice,
            class: currentTicket?.name || 'Standard',
            // Pass raw service if needed
            raw: service
        });

        navigate('/checkout');
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Đang tải...</div>;
    if (error || !service) return <div className="min-h-screen flex items-center justify-center text-red-500">{error || 'Không tìm thấy dịch vụ'}</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 pt-24">
                <Button variant="ghost" className="mb-6 pl-0 hover:pl-2 transition-all" onClick={() => navigate(-1)}>
                    ← Quay lại kết quả tìm kiếm
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Info */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
                                    {service.logo ? (
                                        <img src={service.logo} alt={service.operator} className="w-full h-full object-contain" />
                                    ) : getTypeIcon(service.type)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-primary font-medium uppercase tracking-wide">
                                        {getTypeIcon(service.type)}
                                        {service.type === 'flight' ? 'Chuyến bay' : service.type === 'train' ? 'Tàu hỏa' : 'Xe khách'}
                                    </div>
                                    <h1 className="text-2xl font-bold mt-1">{service.operator}</h1>
                                    <p className="text-muted-foreground">{service.route || 'Hành trình'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg border border-dashed">
                                <div className="text-center md:text-left">
                                    <div className="text-xl font-bold">{service.departure.time}</div>
                                    <div className="text-sm font-medium">{service.departure.station}</div>
                                </div>
                                <div className="flex flex-col items-center justify-center text-sm text-muted-foreground">
                                    <span className="mb-1">{service.duration}</span>
                                    <div className="w-full h-[1px] bg-gray-300 relative max-w-[100px]">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    </div>
                                    <span className="mt-1 lowercase">Bay thẳng</span>
                                </div>
                                <div className="text-center md:text-right">
                                    <div className="text-xl font-bold">{service.arrival.time}</div>
                                    <div className="text-sm font-medium">{service.arrival.station}</div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border">
                            <h2 className="text-lg font-bold mb-4">Thông tin chi tiết</h2>
                            <div className="prose max-w-none text-muted-foreground">
                                {service.description || 'Chưa có mô tả chi tiết cho chuyến đi này.'}
                            </div>

                            {service.amenities && service.amenities.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="font-semibold mb-3">Tiện ích</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {service.amenities.map((item: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Gallery */}
                        {service.images && service.images.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border">
                                <h2 className="text-lg font-bold mb-4">Hình ảnh</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {service.images.map((img: string, idx: number) => (
                                        <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Booking Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg border p-6 sticky top-24">
                            <div className="text-lg font-bold mb-4 border-b pb-4">Đặt vé ngay</div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar className="w-4 h-4" /> Ngày khởi hành
                                    </label>
                                    <Input
                                        type="date"
                                        value={bookingDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setBookingDate(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <User className="w-4 h-4" /> Hành khách
                                    </label>
                                    <Select value={passengers.toString()} onValueChange={(v) => setPassengers(parseInt(v))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Số khách" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                                <SelectItem key={num} value={num.toString()}>{num} người</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Info className="w-4 h-4" /> Loại vé
                                    </label>
                                    <div className="space-y-2">
                                        {service.ticketTypes?.map((ticket: any) => {
                                            const tId = ticket._id || ticket.name;
                                            const isSelected = selectedTicketType === tId;

                                            // Dynamic availability logic
                                            let availableQty = ticket.quantity ?? 50;
                                            const dynamicTicket = availability.ticketTypes?.find((t: any) => t.name === ticket.name || t.name === tId);
                                            if (dynamicTicket) {
                                                availableQty = dynamicTicket.available;
                                            }

                                            const isSoldOut = availableQty <= 0;
                                            const isInsufficient = availableQty < passengers;

                                            return (
                                                <div
                                                    key={tId}
                                                    onClick={() => !isSoldOut ? setSelectedTicketType(tId) : null}
                                                    className={`
                                                        p-3 rounded-lg border-2 transition-all relative
                                                        ${isSoldOut ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200' : 'cursor-pointer'}
                                                        ${isSelected && !isSoldOut
                                                            ? 'border-primary bg-primary/5'
                                                            : !isSoldOut ? 'border-transparent bg-gray-50 hover:bg-gray-100' : ''
                                                        }
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className={`font-semibold ${isSelected && !isSoldOut ? 'text-primary' : ''}`}>
                                                                {ticket.name}
                                                            </div>
                                                            {ticket.description && (
                                                                <div className="text-xs text-muted-foreground mt-0.5">{ticket.description}</div>
                                                            )}
                                                            {isInsufficient && !isSoldOut && (
                                                                <div className="text-xs text-red-500 mt-1 font-medium">Không đủ vé cho {passengers} khách</div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold">
                                                                {new Intl.NumberFormat('vi-VN').format(ticket.price)}₫
                                                            </div>
                                                            <div className={`text-xs font-medium mt-0.5 ${isSoldOut || isInsufficient ? 'text-red-600' : 'text-green-600'}`}>
                                                                {isSoldOut ? 'Hết vé' : `Còn ${availableQty} vé`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-4 border-t mt-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-muted-foreground">Đơn giá</span>
                                        <span>{new Intl.NumberFormat('vi-VN').format(unitPrice)}₫</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg font-bold text-primary mt-2">
                                        <span>Tổng cộng</span>
                                        <span>{new Intl.NumberFormat('vi-VN').format(totalPrice)}₫</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-12 text-lg font-semibold shadow-md mt-4"
                                    onClick={handleBook}
                                    disabled={!selectedTicketType}
                                >
                                    Thanh toán ngay <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TransportDetailPage;
