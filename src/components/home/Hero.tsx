// src/components/home/Hero.tsx
import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Users, Calendar, MapPin, Hotel, Plane } from "lucide-react";
import heroImg from "@/assets/hero-vietnam.jpg";
import DestinationAutosuggest, { DestinationSuggestion } from "@/components/home/DestinationAutosuggest";
import { toast } from "@/hooks/use-toast";

type HotelSearchForm = {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
};

type FlightSearchForm = {
  flightOrigin: string;
  flightDestination: string;
  departureDate: string;
};

type DestinationForm = {
  selectedDestination: DestinationSuggestion | null;
};

type TourSearchForm = {
  tourDestination: string;
  tourDate: string;
  tourGuests: number | "";
};

// helper: format date -> "YYYY-MM-DD"
function formatDateYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
const today = formatDateYYYYMMDD(new Date());

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"tours" | "hotels" | "flights" | "places">("hotels");

  const { register, handleSubmit, reset, control, getValues, watch, setValue } = useForm<
    HotelSearchForm & FlightSearchForm & DestinationForm & TourSearchForm
  >({
    defaultValues: {
      destination: "",
      checkInDate: "",
      checkOutDate: "",
      flightOrigin: "",
      flightDestination: "",
      departureDate: "",
      selectedDestination: null,
      tourDestination: "",
      tourDate: "",
      tourGuests: "",
    },
  });

  // watch checkInDate for dynamic min on checkOut
  const watchCheckIn = watch("checkInDate");

  // on submit
  const onFormSubmit = (
    data: HotelSearchForm & FlightSearchForm & DestinationForm & TourSearchForm
  ) => {
    const params = new URLSearchParams();

    // HOTELS
    if (activeTab === "hotels") {
      const dest = (data.destination || "").trim();
      const checkIn = (data.checkInDate || "").trim();
      const checkOut = (data.checkOutDate || "").trim();

      if (!dest) {
        toast({ title: "Thiếu thông tin", description: "Vui lòng nhập thành phố." });
        return;
      }
      if (!checkIn || !checkOut) {
        toast({ title: "Thiếu ngày", description: "Bạn phải chọn ngày nhận và trả phòng." });
        return;
      }
      // ensure correct order
      if (new Date(checkOut) <= new Date(checkIn)) {
        toast({ title: "Ngày không hợp lệ", description: "Ngày trả phòng phải sau ngày nhận phòng." });
        return;
      }

      params.set("city", dest);
      params.set("checkin", checkIn);
      params.set("checkout", checkOut);

      navigate(`/hotels/search?${params.toString()}`);
      return;
    }

    // FLIGHTS
    if (activeTab === "flights") {
      if (data.flightOrigin) params.set("from", String(data.flightOrigin));
      if (data.flightDestination) params.set("to", String(data.flightDestination));
      if (data.departureDate) params.set("date", String(data.departureDate));
      navigate(`/flights/search?${params.toString()}`);
      return;
    }

    // PLACES
    if (activeTab === "places") {
      if (!data.selectedDestination?.slug) {
        toast({ title: "Chưa chọn địa điểm", description: "Vui lòng chọn địa điểm từ gợi ý." });
        return;
      }
      navigate(`/destinations/${data.selectedDestination.slug}`);
      return;
    }

    // TOURS
    if (activeTab === "tours") {
      if (data.tourDestination) params.set("destinationSlug", data.tourDestination);
      if (data.tourDate) params.set("startDate", data.tourDate);
      const guests = Number(data.tourGuests || 0);
      if (guests > 0) params.set("adults", String(guests));
      navigate(`/tours/search?${params.toString()}`);
      return;
    }
  };

  // compute checkOut min (checkIn + 1) else tomorrow
  const checkOutMin = useMemo(() => {
    try {
      if (watchCheckIn) {
        const d = new Date(watchCheckIn + "T00:00:00");
        d.setDate(d.getDate() + 1);
        return formatDateYYYYMMDD(d);
      }
    } catch {}
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return formatDateYYYYMMDD(t);
  }, [watchCheckIn]);

  return (
    <section className="relative min-h-screen flex items-center" aria-label="Trang chủ - Khám phá Việt Nam">
      <img src={heroImg} alt="Cảnh đẹp Việt Nam nhìn từ trên cao" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
      <div className="absolute inset-0 hero-overlay" />

      <div className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-[hsl(var(--on-media-foreground))]">Khám Phá Việt Nam Diệu Kỳ</h1>
          <p className="mt-4 text-lg md:text-xl text-[hsl(var(--on-media-foreground))]/90">Người bạn đồng hành tin cậy trên mọi hành trình.</p>
        </div>

        <div className="mt-10">
          <form onSubmit={handleSubmit(onFormSubmit)}>
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v as any);
                // keep dates on tab switch? currently reset to defaults
                reset();
              }}
              className="max-w-5xl"
            >
              <TabsList className="grid grid-cols-4 w-full font-medium">
                <TabsTrigger value="hotels">Khách sạn</TabsTrigger>
                <TabsTrigger value="tours">Tours</TabsTrigger>
                <TabsTrigger value="flights">Chuyến bay</TabsTrigger>
                <TabsTrigger value="places">Địa điểm</TabsTrigger>
              </TabsList>

              {/* HOTELS */}
              <TabsContent value="hotels" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 rounded-md border bg-background/80 px-3 py-2 backdrop-blur">
                    <Hotel className="text-muted-foreground" />
                    <Input placeholder="Thành phố?" className="border-none shadow-none focus-visible:ring-0" {...register("destination")} />
                  </div>

                  {/* Check-in */}
                  <div className="flex items-center gap-2 rounded-md border bg-background/80 px-3 py-2 backdrop-blur">
                    <Calendar className="text-muted-foreground" />
                    <Input
                      type="date"
                      {...register("checkInDate", {
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          const v = e.target.value;
                          // set checkIn value explicitly
                          setValue("checkInDate", v, { shouldValidate: true, shouldDirty: true });

                          // auto set checkout to checkin + 1 if empty or earlier
                          try {
                            if (!v) return;
                            const inDate = new Date(v + "T00:00:00");
                            const minOut = new Date(inDate.getTime() + 24 * 60 * 60 * 1000);
                            const minOutStr = formatDateYYYYMMDD(minOut);
                            const curOut = getValues("checkOutDate");
                            if (!curOut || curOut < minOutStr) {
                              setValue("checkOutDate", minOutStr, { shouldValidate: true, shouldDirty: true });
                            }
                          } catch (err) {
                            // ignore
                          }
                        },
                      })}
                      min={today}
                      className="border-none shadow-none focus-visible:ring-0"
                    />
                  </div>

                  {/* Check-out */}
                  <div className="flex items-center gap-2 rounded-md border bg-background/80 px-3 py-2 backdrop-blur">
                    <Calendar className="text-muted-foreground" />
                    <Input type="date" {...register("checkOutDate")} min={checkOutMin} className="border-none shadow-none focus-visible:ring-0" />
                  </div>

                  <Button size="lg" type="submit" variant="hero" className="w-full md:w-auto">
                    <Search /> Tìm khách sạn
                  </Button>
                </div>
              </TabsContent>

              {/* FLIGHTS */}
              <TabsContent value="flights" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 border rounded-md bg-background/80 px-3 py-2">
                    <Plane className="text-muted-foreground" />
                    <Input placeholder="Từ" {...register("flightOrigin")} />
                  </div>

                  <div className="flex items-center gap-2 border rounded-md bg-background/80 px-3 py-2">
                    <Plane className="text-muted-foreground" />
                    <Input placeholder="Đến" {...register("flightDestination")} />
                  </div>

                  <div className="flex items-center gap-2 border rounded-md bg-background/80 px-3 py-2">
                    <Calendar className="text-muted-foreground" />
                    <Input type="date" {...register("departureDate")} min={today} />
                  </div>

                  <Button size="lg" type="submit" variant="hero" className="w-full md:w-auto">
                    <Search /> Tìm chuyến bay
                  </Button>
                </div>
              </TabsContent>

              {/* PLACES */}
              <TabsContent value="places" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Controller
                    name="selectedDestination"
                    control={control}
                    render={({ field }) => <DestinationAutosuggest value={field.value} onSelect={(d) => field.onChange(d)} />}
                  />
                  <div className="hidden md:block" />
                  <div className="hidden md:block" />

                  <Button size="lg" type="submit" variant="hero" className="w-full md:w-auto">
                    <Search /> Khám phá
                  </Button>
                </div>
              </TabsContent>

              {/* TOURS */}
              <TabsContent value="tours" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 border rounded-md bg-background/80 px-3 py-2">
                    <MapPin className="text-muted-foreground" />
                    <Input placeholder="Điểm đến tour?" {...register("tourDestination")} />
                  </div>

                  <div className="flex items-center gap-2 border rounded-md bg-background/80 px-3 py-2">
                    <Calendar className="text-muted-foreground" />
                    <Input type="date" {...register("tourDate")} min={today} />
                  </div>

                  <div className="flex items-center gap-2 border rounded-md bg-background/80 px-3 py-2">
                    <Users className="text-muted-foreground" />
                    <Input type="number" placeholder="Số người?" {...register("tourGuests")} min={1} />
                  </div>

                  <Button size="lg" type="submit" variant="hero" className="w-full md:w-auto">
                    <Search /> Tìm tour
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Hero;
