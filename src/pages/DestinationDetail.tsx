import { useParams } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { DestinationHero } from "@/components/destination/DestinationHero";
import { TabbedContent } from "@/components/destination/TabbedContent";
import { InteractiveMap } from "@/components/destination/InteractiveMap";
import { AtAGlanceInfo } from "@/components/destination/AtAGlanceInfo";
import { ToursCarousel } from "@/components/destination/ToursCarousel";
import { StoriesGrid } from "@/components/destination/StoriesGrid";
import ErrorMessage from "@/components/ui/ErrorMessage";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { getDestinationBySlug } from "@/services/destinationService";

// Types for our destination data
interface DestinationImage {
  id: string;
  url: string;
  alt: string;
  caption?: string;
}

interface Tour {
  id: string;
  title: string;
  image: string;
  location: string;
  duration: string;
  rating: number;
  reviewCount: number;
  price: string;
  originalPrice?: string;
  category: string;
  highlights: string[];
  sustainable?: boolean;
}

interface Story {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: {
    name: string;
    avatar: string;
    initials: string;
    verified?: boolean;
  };
  readTime: string;
  publishedAt: string;
  tags: string[];
}

interface GuideItem {
  id: string;
  question: string;
  content: string | string[];
  type: 'text' | 'list';
}

interface DestinationData {
  slug: string;
  name: string;
  description: string;
  introduction: string;
  images: DestinationImage[];
  guideItems: GuideItem[];
  tours: Tour[];
  stories: Story[];
}

// Mock data for Ha Long Bay
const getDestinationData = (slug: string): DestinationData | null => {
  const destinations: Record<string, DestinationData> = {
    "ha-long-bay": {
      slug: "ha-long-bay",
      name: "Vịnh Hạ Long",
      description: "Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi kỳ vĩ",
      introduction: "Vịnh Hạ Long, được UNESCO công nhận là Di sản Thiên nhiên Thế giới, là một trong những kỳ quan thiên nhiên tuyệt đẹp nhất của Việt Nam. Với hơn 1.600 hòn đảo đá vôi nhô lên từ mặt nước xanh ngọc bích, vịnh tạo nên một cảnh quan hùng vĩ và thơ mộng không thể nào quên. Theo truyền thuyết, Vịnh Hạ Long được hình thành từ những viên ngọc do Rồng mẹ và đàn con nhả ra để bảo vệ đất nước khỏi kẻ thù xâm lược. Ngày nay, nơi đây không chỉ là điểm đến du lịch hàng đầu mà còn là biểu tượng của vẻ đẹp thiên nhiên Việt Nam, thu hút hàng triệu du khách từ khắp nơi trên thế giới.",
      images: [
        {
          id: "1",
          url: "/src/assets/dest-halong.jpg",
          alt: "Vịnh Hạ Long - Cảnh quan tổng thể",
          caption: "Vịnh Hạ Long với hàng nghìn đảo đá vôi kỳ vĩ"
        },
        {
          id: "2", 
          url: "/src/assets/exp-kayak-halong.jpg",
          alt: "Chèo kayak tại Vịnh Hạ Long",
          caption: "Trải nghiệm chèo kayak khám phá hang động"
        },
        {
          id: "3",
          url: "/src/assets/hero-vietnam.jpg",
          alt: "Hoàng hôn tại Vịnh Hạ Long",
          caption: "Hoàng hôn tuyệt đẹp trên vịnh"
        },
        {
          id: "4",
          url: "/src/assets/dest-danang.jpg",
          alt: "Du thuyền tại Vịnh Hạ Long",
          caption: "Du thuyền sang trọng trên vịnh"
        },
        {
          id: "5",
          url: "/src/assets/dest-hcm.jpg",
          alt: "Làng chài truyền thống",
          caption: "Làng chài truyền thống của người dân địa phương"
        }
      ],
      guideItems: [
        {
          id: "best-time",
          question: "Thời điểm lý tưởng nhất để ghé thăm?",
          content: "Thời gian tốt nhất để du lịch Vịnh Hạ Long là từ tháng 3 đến tháng 5 và từ tháng 9 đến tháng 11. Trong những tháng này, thời tiết mát mẻ, ít mưa và độ ẩm thấp, tạo điều kiện lý tưởng để tham quan và chụp ảnh. Tránh mùa hè (tháng 6-8) vì thời tiết nóng ẩm và có nhiều bão, cũng như mùa đông (tháng 12-2) khi thời tiết lạnh và có sương mù dày đặc.",
          type: "text"
        },
        {
          id: "transportation",
          question: "Di chuyển đến và đi lại tại Hạ Long?",
          content: "Từ Hà Nội, bạn có thể di chuyển đến Hạ Long bằng xe khách (2.5-3 tiếng), taxi hoặc xe riêng (2 tiếng). Tại Hạ Long, bạn có thể sử dụng taxi, Grab, hoặc thuê xe máy để di chuyển. Để khám phá vịnh, bạn cần đi thuyền - có nhiều lựa chọn từ thuyền kayak, thuyền buồm đến du thuyền sang trọng. Hầu hết các tour đều bao gồm dịch vụ đưa đón từ khách sạn.",
          type: "text"
        },
        {
          id: "must-try-food",
          question: "Ẩm thực không thể bỏ lỡ?",
          content: [
            "<strong>Chả mực Hạ Long</strong> - Đặc sản nổi tiếng được làm từ mực tươi, có vị ngọt tự nhiên",
            "<strong>Sá sùng nướng</strong> - Loại sâu biển độc đáo, được nướng với lá chuối thơm lừng",
            "<strong>Sam biển</strong> - Được chế biến thành nhiều món như nướng, hấp, xào tỏi",
            "<strong>Ngán Hạ Long</strong> - Loại ốc biển tươi ngon, thường được luộc hoặc nướng",
            "<strong>Bánh cuốn hải sản</strong> - Bánh cuốn truyền thống kết hợp với hải sản tươi sống"
          ],
          type: "list"
        },
        {
          id: "insider-tips",
          question: "Mẹo hay & Những 'Viên ngọc ẩn'",
          content: [
            "Hãy ghé thăm các hang động ít nổi tiếng hơn như <strong>hang Thiên Cung</strong> vào buổi sáng sớm để tránh đám đông",
            "Thuê một chiếc thuyền kayak để tự mình khám phá các vịnh nhỏ và hang động bí mật",
            "Tham gia tour <strong>làng chài Cửa Vạn</strong> để trải nghiệm cuộc sống của ngư dân địa phương",
            "Chụp ảnh hoàng hôn tại <strong>đảo Ti Tốp</strong> - góc nhìn tuyệt đẹp nhất của vịnh",
            "Đặt phòng du thuyền qua đêm để ngắm bình minh trên vịnh - trải nghiệm không thể quên",
            "Mang theo áo khoác nhẹ vì trên thuyền có thể lạnh, đặc biệt vào buổi tối"
          ],
          type: "list"
        }
      ],
      tours: [
        {
          id: "hl-001",
          title: "Du thuyền Hạ Long 2N1Đ - Trải nghiệm sang trọng",
          image: "/src/assets/dest-halong.jpg",
          location: "Vịnh Hạ Long",
          duration: "2 ngày 1 đêm",
          rating: 4.8,
          reviewCount: 324,
          price: "2.890.000",
          originalPrice: "3.200.000",
          category: "Du thuyền",
          highlights: [
            "Du thuyền 5 sao với cabin riêng",
            "Tham quan hang Sửng Sốt, hang Đầu Gỗ",
            "Chèo kayak khám phá hang động",
            "Bữa tối hải sản tươi sống"
          ],
          sustainable: true
        },
        {
          id: "hl-002", 
          title: "Khám phá Hạ Long bằng thủy phi cơ",
          image: "/src/assets/exp-kayak-halong.jpg",
          location: "Vịnh Hạ Long",
          duration: "1 ngày",
          rating: 4.9,
          reviewCount: 156,
          price: "4.500.000",
          category: "Thủy phi cơ",
          highlights: [
            "Bay ngắm toàn cảnh vịnh từ trên cao",
            "Hạ cánh trên mặt nước",
            "Chụp ảnh tại các điểm đẹp nhất",
            "Hướng dẫn viên chuyên nghiệp"
          ]
        },
        {
          id: "hl-003",
          title: "Tour Hạ Long - Cát Bà 3N2Đ",
          image: "/src/assets/hero-vietnam.jpg", 
          location: "Hạ Long - Cát Bà",
          duration: "3 ngày 2 đêm",
          rating: 4.7,
          reviewCount: 289,
          price: "1.950.000",
          category: "Combo tour",
          highlights: [
            "Khám phá đảo Cát Bà hoang sơ",
            "Trekking vườn quốc gia Cát Bà",
            "Tắm biển tại bãi Cát Cò",
            "Thưởng thức đặc sản địa phương"
          ],
          sustainable: true
        }
      ],
      stories: [
        {
          id: "story-1",
          title: "48 giờ khám phá vẻ đẹp huyền bí của Vịnh Hạ Long",
          excerpt: "Hành trình 2 ngày 1 đêm đầy cảm xúc với những trải nghiệm không thể quên tại di sản thiên nhiên thế giới này...",
          image: "/src/assets/dest-halong.jpg",
          author: {
            name: "Minh Anh",
            avatar: "/src/assets/ai-phone-mock.jpg",
            initials: "MA",
            verified: true
          },
          readTime: "8 phút đọc",
          publishedAt: "2024-01-15",
          tags: ["Du thuyền", "Hạ Long", "Trải nghiệm"]
        },
        {
          id: "story-2", 
          title: "Bí quyết chụp ảnh đẹp tại Vịnh Hạ Long",
          excerpt: "Những góc chụp và thời điểm vàng để có được những bức ảnh tuyệt đẹp tại Vịnh Hạ Long...",
          image: "/src/assets/exp-kayak-halong.jpg",
          author: {
            name: "Photographer Tuấn",
            avatar: "/src/assets/dest-sapa.jpg",
            initials: "PT"
          },
          readTime: "5 phút đọc", 
          publishedAt: "2024-01-10",
          tags: ["Photography", "Tips", "Hạ Long"]
        },
        {
          id: "story-3",
          title: "Ẩm thực Hạ Long - Hương vị biển cả",
          excerpt: "Khám phá những món ăn đặc sản không thể bỏ qua khi đến với Vịnh Hạ Long...",
          image: "/src/assets/hero-vietnam.jpg",
          author: {
            name: "Food Blogger Linh",
            avatar: "/src/assets/dest-phuquoc.jpg", 
            initials: "FL",
            verified: true
          },
          readTime: "6 phút đọc",
          publishedAt: "2024-01-08",
          tags: ["Ẩm thực", "Hải sản", "Hạ Long"]
        }
      ]
    }
  };

  return destinations[slug] || null;
};

const DestinationDetail = () => {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['destinationDetail', slug],
    queryFn: () => getDestinationBySlug(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Main Content */}
      <main className="pt-16 md:pt-20">
        {(() => {
          if (isLoading) {
            return (
              <div className="container mx-auto px-4">
                <div className="mb-8 text-center">
                  <div className="h-10 w-64 mx-auto mb-4 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-96 mx-auto bg-muted animate-pulse rounded" />
                </div>
                <div className="mb-12">
                  <div className="h-[60vh] md:h-[70vh] w-full bg-muted animate-pulse rounded-2xl" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              </div>
            );
          }

          if (isError || !data) {
            return (
              <div className="container mx-auto px-4">
                <ErrorMessage title="Không tải được dữ liệu" message={(error as any)?.message || 'Vui lòng thử lại sau.'} showRetry onRetry={() => refetch()} />
              </div>
            );
          }

          const destination = data.destination as any;
          const images = (destination.imageGallery || []).map((url: string, idx: number) => ({ id: String(idx), url, alt: destination.name }));
          const tours = data.associatedTours.map((t: any) => ({
            id: String(t._id),
            title: t.title,
            image: t.mainImage,
            location: t.destination?.name || destination.name,
            duration: t.duration,
            rating: t.averageRating ?? 0,
            reviewCount: t.reviewCount ?? 0,
            price: (t.price ?? 0).toLocaleString(),
            category: 'Tour',
            highlights: [],
            sustainable: t.isSustainable,
          }));
          const stories = (data as any).associatedStories?.map((s: any) => ({
            id: String(s._id),
            title: s.title,
            coverImage: s.coverImage,
            author: s.author,
            createdAt: s.createdAt,
          })) || [];

          return (
            <>
              {/* PHASE 1: Immersive Hero Section */}
              <section className="mb-12">
                <div className="container mx-auto px-4">
                  <DestinationHero images={images} title={destination.name} subtitle={destination.description} />
                </div>
              </section>

              {/* PHASE 2: Two-Column Core Content */}
              <section className="mb-12">
                <div className="container mx-auto px-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <TabbedContent 
                        overview={destination.description}
                        history={destination.history}
                        culture={destination.culture}
                        geography={destination.geography}
                      />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                      <InteractiveMap lat={destination.location?.lat} lng={destination.location?.lng} title={destination.name} />
                      <AtAGlanceInfo bestTimeToVisit={destination.bestTimeToVisit} essentialTips={destination.essentialTips} />
                    </div>
                  </div>
                </div>
              </section>

              {/* PHASE 3: Conversion & Social Proof */}
              <section className="mb-12">
                <div className="container mx-auto px-4">
                  <ToursCarousel tours={tours} destinationName={destination.name} />
                </div>
              </section>

              <section className="mb-12">
                <div className="container mx-auto px-4">
                  <StoriesGrid stories={stories} destinationName={destination.name} />
                  
                </div>
              </section>
            </>
          );
        })()}
      </main>

      <Footer />
    </div>
  );
};

export default DestinationDetail;
