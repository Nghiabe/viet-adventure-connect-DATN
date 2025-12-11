import { useState } from "react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Train, Bus, Calendar as CalendarIcon, MapPin, Clock, Star } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Mock data for search results
const flightResults = [
  {
    id: "VN101",
    airline: "Vietnam Airlines",
    logo: "🇻🇳",
    departure: { time: "06:00", airport: "SGN" },
    arrival: { time: "08:15", airport: "HAN" },
    duration: "2h 15m",
    price: 2450000,
    class: "Economy"
  },
  {
    id: "VJ201",
    airline: "VietJet Air", 
    logo: "✈️",
    departure: { time: "09:30", airport: "SGN" },
    arrival: { time: "11:45", airport: "HAN" },
    duration: "2h 15m",
    price: 1890000,
    class: "Economy"
  },
  {
    id: "BL301",
    airline: "Jetstar Pacific",
    logo: "⭐",
    departure: { time: "14:20", airport: "SGN" },
    arrival: { time: "16:35", airport: "HAN" },
    duration: "2h 15m", 
    price: 2100000,
    class: "Economy"
  }
];

const trainResults = [
  {
    id: "SE1",
    operator: "Đường sắt Việt Nam",
    logo: "🚂",
    departure: { time: "19:30", station: "Ga Sài Gòn" },
    arrival: { time: "04:30+1", station: "Ga Hà Nội" },
    duration: "33h",
    price: 1250000,
    class: "Giường nằm khoang 4"
  },
  {
    id: "SE3",
    operator: "Đường sắt Việt Nam",
    logo: "🚂", 
    departure: { time: "22:00", station: "Ga Sài Gòn" },
    arrival: { time: "06:00+2", station: "Ga Hà Nội" },
    duration: "32h",
    price: 890000,
    class: "Ghế ngồi cứng"
  }
];

const busResults = [
  {
    id: "PH001",
    operator: "Phương Trang",
    logo: "🚌",
    departure: { time: "08:00", station: "Bến xe Miền Đông" },
    arrival: { time: "06:00+1", station: "Bến xe Giáp Bát" },
    duration: "22h",
    price: 450000,
    class: "Giường nằm"
  },
  {
    id: "TH002", 
    operator: "Thành Bưởi",
    logo: "🚐",
    departure: { time: "20:30", station: "Bến xe Miền Đông" },
    arrival: { time: "18:30+1", station: "Bến xe Giáp Bát" },
    duration: "22h",
    price: 380000,
    class: "Ghế ngồi"
  }
];

// Result Card Component
const ResultCard = ({ result, type }: { result: any; type: 'flight' | 'train' | 'bus' }) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'train': return <Train className="w-5 h-5" />;
      case 'bus': return <Bus className="w-5 h-5" />;
    }
  };

  const getOperatorName = () => {
    switch (type) {
      case 'flight': return result.airline;
      case 'train': return result.operator;
      case 'bus': return result.operator;
    }
  };

  const getDepartureLocation = () => {
    switch (type) {
      case 'flight': return result.departure.airport;
      case 'train': return result.departure.station;
      case 'bus': return result.departure.station;
    }
  };

  const getArrivalLocation = () => {
    switch (type) {
      case 'flight': return result.arrival.airport;
      case 'train': return result.arrival.station;
      case 'bus': return result.arrival.station;
    }
  };

  return (
    <div className="bg-card border rounded-xl p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Operator Info */}
          <div className="flex items-center gap-3">
            <div className="text-2xl">{result.logo}</div>
            <div>
              <div className="font-semibold">{getOperatorName()}</div>
              <div className="text-sm text-muted-foreground">{result.class}</div>
            </div>
          </div>

          {/* Route Info */}
          <div className="flex items-center gap-4 flex-1">
            <div className="text-center">
              <div className="font-bold text-lg">{result.departure.time}</div>
              <div className="text-sm text-muted-foreground">{getDepartureLocation()}</div>
            </div>
            
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-px bg-border"></div>
              <div className="flex items-center gap-1 text-muted-foreground">
                {getTypeIcon()}
                <span className="text-xs">{result.duration}</span>
              </div>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            
            <div className="text-center">
              <div className="font-bold text-lg">{result.arrival.time}</div>
              <div className="text-sm text-muted-foreground">{getArrivalLocation()}</div>
            </div>
          </div>
        </div>

        {/* Price and Action */}
        <div className="text-right ml-6">
          <div className="text-2xl font-bold text-primary mb-2">
            {result.price.toLocaleString()}₫
          </div>
          <Button>Chọn</Button>
        </div>
      </div>
    </div>
  );
};

const TransportationHub = () => {
  const [activeTab, setActiveTab] = useState("flights");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [passengers, setPassengers] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isDepartureDateOpen, setIsDepartureDateOpen] = useState(false);
  const [isReturnDateOpen, setIsReturnDateOpen] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 1500);
  };

  const getResults = () => {
    switch (activeTab) {
      case 'flights': return flightResults;
      case 'trains': return trainResults;
      case 'buses': return busResults;
      default: return [];
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'flights': return <Plane className="w-4 h-4" />;
      case 'trains': return <Train className="w-4 h-4" />;
      case 'buses': return <Bus className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Đặt vé di chuyển</h1>
            <p className="text-muted-foreground">Tìm và đặt vé máy bay, tàu hỏa, xe khách với giá tốt nhất</p>
          </div>

          {/* Main Search Card */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-xl border shadow-lg p-6">
              {/* Tab Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="flights" className="flex items-center gap-2">
                    <Plane className="w-4 h-4" />
                    Vé máy bay
                  </TabsTrigger>
                  <TabsTrigger value="trains" className="flex items-center gap-2">
                    <Train className="w-4 h-4" />
                    Tàu hỏa
                  </TabsTrigger>
                  <TabsTrigger value="buses" className="flex items-center gap-2">
                    <Bus className="w-4 h-4" />
                    Xe khách
                  </TabsTrigger>
                </TabsList>

                {/* Search Form */}
                <TabsContent value="flights">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Điểm đi</label>
                      <Select defaultValue="sgn">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sgn">TP. Hồ Chí Minh (SGN)</SelectItem>
                          <SelectItem value="han">Hà Nội (HAN)</SelectItem>
                          <SelectItem value="dad">Đà Nẵng (DAD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Điểm đến</label>
                      <Select defaultValue="han">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="han">Hà Nội (HAN)</SelectItem>
                          <SelectItem value="sgn">TP. Hồ Chí Minh (SGN)</SelectItem>
                          <SelectItem value="dad">Đà Nẵng (DAD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Ngày đi</label>
                      <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {departureDate ? format(departureDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={departureDate}
                            onSelect={(date) => {
                              setDepartureDate(date);
                              setIsDepartureDateOpen(false);
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Hành khách</label>
                      <Select value={passengers.toString()} onValueChange={(value) => setPassengers(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8,9].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'hành khách' : 'hành khách'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trains">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Ga đi</label>
                      <Select defaultValue="saigon">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saigon">Ga Sài Gòn</SelectItem>
                          <SelectItem value="hanoi">Ga Hà Nội</SelectItem>
                          <SelectItem value="danang">Ga Đà Nẵng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Ga đến</label>
                      <Select defaultValue="hanoi">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hanoi">Ga Hà Nội</SelectItem>
                          <SelectItem value="saigon">Ga Sài Gòn</SelectItem>
                          <SelectItem value="danang">Ga Đà Nẵng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Ngày đi</label>
                      <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {departureDate ? format(departureDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={departureDate}
                            onSelect={(date) => {
                              setDepartureDate(date);
                              setIsDepartureDateOpen(false);
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Hành khách</label>
                      <Select value={passengers.toString()} onValueChange={(value) => setPassengers(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8,9].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'hành khách' : 'hành khách'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="buses">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Điểm đi</label>
                      <Select defaultValue="hcm">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                          <SelectItem value="hanoi">Hà Nội</SelectItem>
                          <SelectItem value="danang">Đà Nẵng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Điểm đến</label>
                      <Select defaultValue="hanoi">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hanoi">Hà Nội</SelectItem>
                          <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                          <SelectItem value="danang">Đà Nẵng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Ngày đi</label>
                      <Popover open={isDepartureDateOpen} onOpenChange={setIsDepartureDateOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {departureDate ? format(departureDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={departureDate}
                            onSelect={(date) => {
                              setDepartureDate(date);
                              setIsDepartureDateOpen(false);
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Hành khách</label>
                      <Select value={passengers.toString()} onValueChange={(value) => setPassengers(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8,9].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'hành khách' : 'hành khách'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Search Button */}
                <Button 
                  onClick={handleSearch}
                  className="w-full lg:w-auto lg:px-12"
                  size="lg"
                  disabled={isSearching || !departureDate}
                >
                  {isSearching ? "Đang tìm kiếm..." : "Tìm kiếm"}
                </Button>
              </Tabs>
            </div>

            {/* Search Results */}
            {showResults && (
              <div className="mt-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Kết quả tìm kiếm</h2>
                  <p className="text-muted-foreground">
                    Tìm thấy {getResults().length} lựa chọn cho chuyến đi của bạn
                  </p>
                </div>
                
                <div className="space-y-4">
                  {getResults().map((result) => (
                    <ResultCard 
                      key={result.id} 
                      result={result} 
                      type={activeTab.slice(0, -1) as 'flight' | 'train' | 'bus'} 
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




