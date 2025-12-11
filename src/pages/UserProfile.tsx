import { useQuery } from "@tanstack/react-query";
import Header from "@/components/home/Header";
import Footer from "@/components/home/Footer";
import ErrorMessage from "@/components/ui/ErrorMessage";
import ProfilePageSkeleton from "@/components/profile/JourneyCardSkeleton";
import JourneysTab from "@/components/profile/JourneysTab";
import StoriesTab from "@/components/profile/StoriesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import apiClient from "@/services/apiClient";
import BadgeIcon from "@/components/ui/BadgeIcon";

// Define the shape of the expected payload
interface UserProfilePayload {
  profile: {
    name: string;
    avatarInitials: string;
    memberSince: string;
    level: string;
  };
  gamification: {
    earnedBadgesCount: number;
    totalBadgesCount: number;
    completionPercentage: number;
    allBadges: Array<{
      _id: string;
      name: string;
      iconUrl?: string | null;
      isEarned: boolean;
      earnedAt?: string | null;
      category?: string;
      [key: string]: any;
    }>;
    categorizedBadges?: Array<{
      category: string;
      earnedCount: number;
      totalCount: number;
      badges: Array<any>;
    }>;
  };
  journeys: Array<{
    _id: string;
    tourTitle: string;
    bookingDate: string;
    status: string;
    [key: string]: any;
  }>;
  stories: Array<{
    _id: string;
    title: string;
    createdAt: string;
    coverImage?: string | null;
    excerpt?: string;
    likeCount?: number;
  }>;
}

const fetchUserProfile = async (): Promise<UserProfilePayload> => {
  const response = await apiClient.get<UserProfilePayload>("/users/profile");
  if (!(response as any)?.success || !(response as any)?.data) {
    throw new Error((response as any)?.error || "Failed to fetch profile data.");
  }
  return (response as any).data as UserProfilePayload;
};

const UserProfile = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <div className="container mx-auto px-4 py-8 mt-16">
          <ProfilePageSkeleton />
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <div className="container mx-auto px-4 py-8 mt-16">
          <ErrorMessage title="Không thể tải hồ sơ" message={(error as any)?.message || "Vui lòng thử lại sau."} />
        </div>
        <Footer />
      </div>
    );
  }

  const { profile, gamification, journeys, stories } = data;
  const categorizedBadges = gamification.categorizedBadges || [];

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <div className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="bg-background rounded-lg p-6 md:p-8 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile.avatarInitials || "VT"}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-3">Chào mừng trở lại, {profile.name || "bạn"}!</h1>
                <p className="text-muted-foreground mb-4 text-base md:text-lg">
                  Thành viên từ {new Date(profile.memberSince).toLocaleDateString("vi-VN")} • {gamification.earnedBadgesCount} huy hiệu đã đạt được
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    Cấp độ: {profile.level}
                  </Badge>
                  <div className="flex items-center gap-2 text-base text-muted-foreground">
                    <Trophy className="w-5 h-5" />
                    <span>{gamification.completionPercentage}% hoàn thành bộ sưu tập</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="journeys" className="w-full">
            <div className="bg-background rounded-lg shadow-sm">
              <TabsList className="grid w-full grid-cols-3 h-auto p-0 bg-transparent border-b">
                <TabsTrigger value="journeys" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-6 px-8 text-base font-medium border-b-2 border-transparent">Chuyến đi của tôi</TabsTrigger>
                <TabsTrigger value="badges" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-6 px-8 text-base font-medium border-b-2 border-transparent">Huy hiệu</TabsTrigger>
                <TabsTrigger value="posts" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-6 px-8 text-base font-medium border-b-2 border-transparent">Bài viết</TabsTrigger>
              </TabsList>

              <div className="p-8">
                <TabsContent value="journeys" className="mt-0">
                  <JourneysTab journeys={journeys as any} />
                </TabsContent>

                <TabsContent value="badges" className="mt-0">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-3xl font-bold">Bộ sưu tập Huy hiệu của bạn</h2>
                      <div className="text-lg text-muted-foreground">
                        {gamification.earnedBadgesCount} / {gamification.totalBadgesCount} huy hiệu
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-12">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-medium">Tiến độ hoàn thành</span>
                        <span className="text-base text-muted-foreground">{gamification.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500" style={{ width: `${gamification.completionPercentage}%` }} />
                      </div>
                    </div>

                    {/* Badge Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                      {gamification.allBadges.map((b) => (
                        <div key={String((b as any)._id)} className="flex flex-col items-center p-6 rounded-xl hover:bg-muted/30 transition-all duration-200 cursor-pointer">
                          <div className={`${b.isEarned ? "bg-gradient-to-br from-primary to-accent text-white shadow-xl hover:shadow-2xl hover:scale-105" : "bg-muted text-muted-foreground grayscale opacity-50"} w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300`}>
                            <BadgeIcon iconName={(b as any).iconUrl || (b as any).name} className="w-10 h-10" earned={b.isEarned} title={(b as any).name} />
                          </div>
                          <p className={`text-sm font-semibold text-center leading-tight mb-1 ${b.isEarned ? "text-foreground" : "text-muted-foreground"}`}>{(b as any).name}</p>
                          {b.isEarned && (b as any).earnedAt && (
                            <p className="text-xs text-muted-foreground">{new Date((b as any).earnedAt).toLocaleDateString("vi-VN")}</p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Badge Categories */}
                    <div className="mt-16">
                      <h3 className="text-2xl font-semibold mb-6">Danh mục huy hiệu</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {categorizedBadges.map((cat) => (
                          <div key={cat.category} className="bg-background rounded-lg p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-lg">{cat.category}</span>
                              <span className="text-sm text-muted-foreground">{cat.earnedCount} / {cat.totalCount} đã đạt được</span>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-3">
                              {cat.badges.slice(0, 6).map((b: any) => (
                                <div key={String(b._id)} className={`w-10 h-10 rounded-full flex items-center justify-center ${b.isEarned ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                  <BadgeIcon iconName={b.iconUrl || b.name} className="w-5 h-5" earned={b.isEarned} title={b.name} />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="mt-0">
                  <StoriesTab stories={stories} />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserProfile;
