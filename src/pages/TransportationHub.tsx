import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Train, Bus, Calendar as CalendarIcon, MapPin, Clock, Star, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";

// Mock data removed in favor of API
const flightResults = [];
const trainResults = [];
const busResults = [];


// Result Card Component
const ResultCard = ({ result, type, onSelect, onChat }: { result: any; type: 'flight' | 'train' | 'bus'; onSelect: (result: any) => void; onChat: (result: any) => void }) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'flight': return <Plane className="h-5 w-5" />;
      case 'train': return <Train className="h-5 w-5" />;
      case 'bus': return <Bus className="h-5 w-5" />;
    }
  };

  const getOperatorName = () => {
    return result.operator || result.airline;
  };

  return (
    <div className="bg-white rounded-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 flex-1">
        {/* Operator Info */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {result.logo && (result.logo.startsWith('http') || result.logo.startsWith('/')) ?
              <img src={result.logo} alt={getOperatorName()} className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> :
              result.logo
            }
          </div>
          <div>
            <div className="font-semibold">{getOperatorName()}</div>
            <div className="text-sm text-muted-foreground">{result.class}</div>
          </div>
        </div>

        {/* Journey Info */}
        <div className="flex-1 flex items-center justify-center gap-8 text-center">
          <div>
            <div className="text-xl font-bold">{result.departure.time}</div>
            <div className="text-sm text-muted-foreground">{result.departure.station || result.departure.airport || 'Điểm đi'}</div>
          </div>
          <div className="flex flex-col items-center gap-1 min-w-[120px]">
            <div className="text-xs text-muted-foreground">{result.duration}</div>
            <div className="w-full flex items-center gap-1">
              <div className="h-[1px] flex-1 bg-border relative">
                <div className="absolute right-0 -top-0.5 w-1 h-1 rounded-full bg-border" />
              </div>
              {getTypeIcon()}
              <div className="h-[1px] flex-1 bg-border relative">
                <div className="absolute left-0 -top-0.5 w-1 h-1 rounded-full bg-border" />
              </div>
            </div>
          </div>
          <div>
            <div className="text-xl font-bold">{result.arrival.time}</div>
            <div className="text-sm text-muted-foreground">{result.arrival.station || result.arrival.airport || 'Điểm đến'}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 min-w-[140px]">
        <div className="text-xl font-bold text-primary">
          {new Intl.NumberFormat('vi-VN').format(result.price)}₫
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <Button onClick={() => onSelect(result)} className="w-full">Chọn</Button>
        <Button onClick={() => onChat(result)} variant="outline" className="w-full gap-2 text-primary border-primary/20 hover:bg-primary/5">
          <MessageCircle className="w-4 h-4" />
          Tin nhắn
        </Button>
      </div>
    </div>
  );
};

const TransportationHub = () => {
  const navigate = useNavigate();
  const { initiateBooking } = useBooking();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState("flights");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState(1);
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isDepartureDateOpen, setIsDepartureDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  const handleSearch = async () => {
    if (!departureDate) return;

    setIsSearching(true);
    setShowResults(false);

    try {
      // Map activeTab to API type
      let type = activeTab.slice(0, -1); // flights -> flight, trains -> train
      if (activeTab === 'buses') type = 'bus';

      const params = new URLSearchParams({
        type,
        from: departure,
        to: destination,
        date: departureDate.toISOString(),
        passengers: passengers.toString()
      });

      const response = await fetch(`/api/transport?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setResults(data.data);
      } else {
        console.error("Search failed:", data.error);
        setResults([]);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
      setShowResults(true);
    }
  };

  const getResults = () => {
    return results;
  };

  const handleSelect = (result: any) => {
    let type: any = activeTab.slice(0, -1);
    if (activeTab === 'buses') type = 'bus';

    // Fallback for ID generation or mapping
    const id = result.id || result._id || Math.random().toString(36).substr(2, 9);
    const operator = result.operator || result.airline;

    initiateBooking({
      type,
      title: `${type === 'flight' ? 'Vé máy bay' : type === 'train' ? 'Vé tàu' : 'Vé xe'} ${operator} - ${result.departure.station || result.departure.airport} đi ${result.arrival.station || result.arrival.airport}`,
      operator: operator,
      transportNumber: id,
      flightNumber: type === 'flight' ? id : undefined,
      origin: {
        code: result.departure.station || result.departure.airport,
        city: result.departure.station || result.departure.airport,
        station: result.departure.station,
        time: result.departure.time
      },
      destination: {
        code: result.arrival.station || result.arrival.airport,
        city: result.arrival.station || result.arrival.airport,
        station: result.arrival.station,
        time: result.arrival.time
      },
      bookingDate: departureDate?.toISOString(),
      duration: result.duration,
      participantsTotal: passengers,
      unitPrice: result.price,
      clientComputedTotal: result.price * passengers,
      class: result.class,
    });
    navigate('/checkout');
  };

  const handleChat = async (result: any) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để chat với nhà cung cấp");
      navigate('/login');
      return;
    }

    let type: any = activeTab.slice(0, -1);
    if (activeTab === 'buses') type = 'bus';

    // Construct transport data for API
    const transportData = {
      type: type,
      title: `${type === 'flight' ? 'Vé máy bay' : type === 'train' ? 'Vé tàu' : 'Vé xe'} ${result.operator || result.airline} - ${result.departure.station || result.departure.airport} đi ${result.arrival.station || result.arrival.airport}`,
      operator: result.operator || result.airline,
      unitPrice: result.price,
      totalPrice: result.price * passengers,
      passengers: passengers,
      originCode: result.departure.station || result.departure.airport,
      destinationCode: result.arrival.station || result.arrival.airport,
      destination: result.arrival.city || result.arrival.station || result.arrival.airport, // Approx destination name
      duration: result.duration,
      departureTime: departureDate ? departureDate.toISOString() : new Date().toISOString(),
      image: result.logo // Pass logo as image
    };

    try {
      const res = await apiClient.post<any>('/chat/inquiry', { transportData });
      if (res.success && res.data) {
        navigate(`/chat/${res.data.bookingId}`);
      } else {
        toast.error("Không thể tạo cuộc trò chuyện");
      }
    } catch (error) {
      console.error("Chat error", error);
      toast.error("Đã có lỗi xảy ra khi kết nối trò chuyện");
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'flights': return <Plane className="w-4 h-4" />;
      case 'trains': return <Train className="w-4 h-4" />;
      case 'buses': return <Bus className="w-4 h-4" />;
      default: return <Plane className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold mb-4">Đặt vé di chuyển</h1>
            <p className="text-muted-foreground text-lg">
              Tìm và đặt vé máy bay, tàu hỏa, xe khách với giá tốt nhất
            </p>
          </div>

          <div className="bg-card rounded-2xl shadow-lg border p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="flights" className="gap-2">
                  <Plane className="w-4 h-4" /> Vé máy bay
                </TabsTrigger>
                <TabsTrigger value="trains" className="gap-2">
                  <Train className="w-4 h-4" /> Tàu hỏa
                </TabsTrigger>
                <TabsTrigger value="buses" className="gap-2">
                  <Bus className="w-4 h-4" /> Xe khách
                </TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Input Fields */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Điểm đi</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Nhập điểm đi..."
                        value={departure}
                        onChange={(e) => setDeparture(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Điểm đến</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Nhập điểm đến..."
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ngày đi</label>
                    <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={`w-full justify-start text-left font-normal ${!departureDate && "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {departureDate ? format(departureDate, "dd/MM/yyyy") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={departureDate}
                          onSelect={(date) => {
                            setDepartureDate(date);
                            setIsDepartureDateOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hành khách</label>
                    <Select value={passengers.toString()} onValueChange={(v) => setPassengers(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Số khách" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} hành khách
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search Button */}
                <Button
                  onClick={handleSearch}
                  className="w-full lg:h-10 lg:self-end"
                  disabled={isSearching || !departureDate}
                >
                  {isSearching ? "Đang tìm kiếm..." : "Tìm kiếm"}
                </Button>
              </div>
            </Tabs>

            {/* Search Results */}
            {showResults && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-2">Kết quả tìm kiếm</h2>
                <p className="text-muted-foreground">
                  Tìm thấy {results.length} lựa chọn cho chuyến đi của bạn
                </p>

                <div className="space-y-4 mt-4">
                  {results.map((result, index) => (
                    <ResultCard
                      key={index}
                      result={result}
                      type={activeTab === 'buses' ? 'bus' : activeTab.slice(0, -1) as 'flight' | 'train'}
                      onSelect={handleSelect}
                      onChat={handleChat}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TransportationHub;
