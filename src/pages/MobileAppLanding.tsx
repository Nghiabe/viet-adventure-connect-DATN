import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Smartphone, MapPin, Bell, Camera, Navigation, Phone, Star, Download } from "lucide-react";

// Mock app features data
const features = [
  {
    id: "ar",
    title: "Hồi sinh Lịch sử",
    description: "Sử dụng công nghệ Thực tế Ảo tăng cường (AR) để khám phá lịch sử và văn hóa địa phương một cách sống động. Chỉ cần hướng camera vào di tích, bạn sẽ thấy những câu chuyện lịch sử hiện ra trước mắt.",
    icon: Camera,
    image: "/src/assets/ai-phone-mock.jpg",
    highlights: [
      "Khám phá 500+ di tích lịch sử",
      "Thông tin đa ngôn ngữ",
      "Trải nghiệm tương tác 3D",
      "Offline mode cho vùng sóng yếu"
    ]
  },
  {
    id: "sos",
    title: "An toàn là trên hết",
    description: "Tính năng SOS thông minh kết nối trực tiếp với các dịch vụ cứu hộ địa phương. Một chạm để gửi vị trí chính xác và thông tin cá nhân đến đội ngũ hỗ trợ 24/7.",
    icon: Shield,
    image: "/src/assets/ai-phone-mock.jpg",
    highlights: [
      "Kết nối 24/7 với đội cứu hộ",
      "Chia sẻ vị trí GPS chính xác",
      "Thông tin y tế khẩn cấp",
      "Liên hệ đại sứ quán tự động"
    ]
  },
  {
    id: "suggestions",
    title: "Không bao giờ bỏ lỡ một viên ngọc ẩn",
    description: "AI thông minh phân tích vị trí, thời gian và sở thích của bạn để gợi ý những trải nghiệm độc đáo xung quanh. Từ quán ăn ẩn mình trong hẻm đến những điểm check-in chỉ người địa phương mới biết.",
    icon: Bell,
    image: "/src/assets/ai-phone-mock.jpg",
    highlights: [
      "Gợi ý theo thời gian thực",
      "Cá nhân hóa theo sở thích",
      "Đánh giá từ cộng đồng",
      "Điều hướng tối ưu"
    ]
  }
];

const appStats = [
  { label: "Lượt tải", value: "500K+", icon: Download },
  { label: "Đánh giá", value: "4.8", icon: Star },
  { label: "Quốc gia", value: "25+", icon: MapPin },
  { label: "Người dùng hàng ngày", value: "50K+", icon: Smartphone }
];

const testimonials = [
  {
    name: "Nguyễn Minh Anh",
    location: "Hà Nội",
    comment: "App này đã cứu chuyến đi của tôi! Tính năng AR ở Hoàng thành Thăng Long thật tuyệt vời.",
    rating: 5,
    avatar: "MA"
  },
  {
    name: "David Johnson",
    location: "USA",
    comment: "The SOS feature gave me peace of mind while traveling solo in Vietnam. Highly recommended!",
    rating: 5,
    avatar: "DJ"
  },
  {
    name: "Trần Thị Lan",
    location: "TP. Hồ Chí Minh",
    comment: "Những gợi ý ẩm thực từ app rất chính xác. Tôi đã tìm được nhiều quán ngon mà trước đây không biết.",
    rating: 5,
    avatar: "TL"
  }
];

// Feature Section Component
const FeatureSection = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const isEven = index % 2 === 0;

  return (
    <section className={`py-16 md:py-20 ${isEven ? 'bg-background' : 'bg-secondary'}`}>
      <div className="container mx-auto px-4">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:grid-flow-col-dense' : ''}`}>
          {/* Content */}
          <div className={!isEven ? 'lg:col-start-2' : ''}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-primary text-primary-foreground rounded-xl">
                <feature.icon className="w-6 h-6" />
              </div>
              <Badge variant="secondary">Tính năng độc quyền</Badge>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">{feature.title}</h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              {feature.description}
            </p>

            <div className="space-y-3 mb-8">
              {feature.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image/Video */}
          <div className={!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}>
            <div className="relative">
              <img
                src={feature.image}
                alt={feature.title}
                className="w-full max-w-md mx-auto rounded-2xl shadow-2xl"
              />
              {feature.id === 'ar' && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl flex items-end justify-center pb-8">
                  <Button variant="secondary" className="bg-white/90 text-black hover:bg-white">
                    ▶ Xem demo AR
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Testimonial Card Component
const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
  <div className="bg-card border rounded-xl p-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-semibold">
        {testimonial.avatar}
      </div>
      <div>
        <div className="font-semibold">{testimonial.name}</div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {testimonial.location}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-1 mb-3">
      {[...Array(testimonial.rating)].map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
    </div>

    <p className="text-muted-foreground italic">"{testimonial.comment}"</p>
  </div>
);

const MobileAppLanding = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              Ứng dụng di động
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Trợ lý Du lịch của bạn,<br />
              <span className="text-primary">ngay trong túi quần</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Khám phá Việt Nam với công nghệ AR tiên tiến, tính năng SOS thông minh và gợi ý cá nhân hóa.
              Tải ngay để có trải nghiệm du lịch an toàn và thú vị nhất.
            </p>

            {/* App Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {appStats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="bg-black text-white hover:bg-black/90">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📱</div>
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </div>
              </Button>

              <Button size="lg" className="bg-black text-white hover:bg-black/90">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🤖</div>
                  <div className="text-left">
                    <div className="text-xs">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </div>
              </Button>
            </div>

            {/* Phone Mockup */}
            <div className="relative max-w-sm mx-auto">
              <img
                src="/src/assets/ai-phone-mock.jpg"
                alt="VietTravel Mobile App"
                className="w-full rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* Feature Sections */}
        {features.map((feature, index) => (
          <FeatureSection key={feature.id} feature={feature} index={index} />
        ))}

        {/* Testimonials Section */}
        <section className="py-16 md:py-20 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Người dùng nói gì về chúng tôi
              </h2>
              <p className="text-muted-foreground text-lg">
                Hàng nghìn du khách đã tin tưởng VietTravel trong hành trình khám phá Việt Nam
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.name} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Sẵn sàng khám phá Việt Nam?
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Tải ứng dụng ngay hôm nay và bắt đầu hành trình của bạn
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📱</div>
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </div>
              </Button>

              <Button size="lg" variant="secondary">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🤖</div>
                  <div className="text-left">
                    <div className="text-xs">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default MobileAppLanding;




