import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Bookmark, TrendingUp, Users, PenTool, MapPin, Calendar } from "lucide-react";
import CreateStoryModal from "@/components/story/CreateStoryModal";
import CommunityPageSkeleton from "@/components/community/CommunityPageSkeleton";
import ErrorMessage from "@/components/community/ErrorMessage";
import { useAuth } from "@/context/AuthContext";
import apiClient from "@/services/apiClient";

// Types for our API response
interface CommunityHubData {
  featuredStory: {
    _id: string;
    title: string;
    content: string;
    coverImage?: string;
    tags: string[];
    likeCount: number;
    createdAt: string;
    author: {
      _id: string;
      name: string;
      avatar?: string;
    };
  } | null;
  latestStories: Array<{
    _id: string;
    title: string;
    content: string;
    coverImage?: string;
    tags: string[];
    likeCount: number;
    createdAt: string;
    author: {
      _id: string;
      name: string;
      avatar?: string;
    };
  }>;
  trendingTags: Array<{
    tag: string;
    count: number;
  }>;
  topAuthors: Array<{
    _id: string;
    name: string;
    avatar?: string;
    followerCount: number;
    storyCount: number;
  }>;
  communityStats: {
    totalStories: number;
    totalMembers: number;
    storiesThisWeek: number;
  };
}

// Story Card Component
const StoryCard = ({ story, featured = false }: { story: any; featured?: boolean }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Helper function to get excerpt from content
  const getExcerpt = (content: string) => {
    return content.length > 150 ? content.substring(0, 150) + '...' : content;
  };

  // Helper function to calculate read time
  const getReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} phút đọc`;
  };

  if (featured) {
    return (
      <article className="relative overflow-hidden rounded-xl bg-card border group cursor-pointer">
        <div className="relative h-96">
          <img 
            src={story.coverImage || "/src/assets/hero-vietnam.jpg"} 
            alt={story.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              {story.tags.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-white/30">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <h2 className="text-2xl font-bold mb-2 line-clamp-2">{story.title}</h2>
            <p className="text-white/90 mb-4 line-clamp-2">{getExcerpt(story.content)}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={story.author.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(story.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm">{story.author.name}</span>
                  </div>
                  <div className="text-xs text-white/70">
                    {getReadTime(story.content)} • {new Date(story.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-white/80">
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">{story.likeCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 group">
      <div className="flex gap-4 p-4">
        {/* Image */}
        <div className="w-32 h-24 flex-shrink-0">
          <img 
            src={story.coverImage || "/src/assets/hero-vietnam.jpg"} 
            alt={story.title}
            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={story.author.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(story.author.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{story.author.name}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {new Date(story.createdAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
          
          <h3 className="font-bold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {story.title}
          </h3>
          
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {getExcerpt(story.content)}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {story.tags.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">• {getReadTime(story.content)}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsLiked(!isLiked)}
                className="flex items-center gap-1 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-xs">{story.likeCount}</span>
              </button>
              
              <button 
                onClick={() => setIsBookmarked(!isBookmarked)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
              </button>
              
              <button className="text-muted-foreground hover:text-primary transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const CommunityHub = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch community hub data
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['communityHubData'],
    queryFn: () => apiClient.get<CommunityHubData>('/community/hub'),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create story mutation
  const createStoryMutation = useMutation({
    mutationFn: (newStoryData: any) => apiClient.post('/stories', newStoryData),
    
    onSuccess: () => {
      // Close the modal and show a success message
      setIsCreateModalOpen(false);
      toast.success("Bài viết của bạn đã được gửi và đang chờ kiểm duyệt. Cảm ơn bạn đã chia sẻ!");
      
      // Invalidate community hub data to refresh the page
      queryClient.invalidateQueries({ queryKey: ['communityHubData'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    
    onError: (error: any) => {
      // Display a specific error message from the backend if available
      toast.error(error.response?.data?.error || 'Đã có lỗi xảy ra, không thể gửi bài viết của bạn.');
    }
  });

  const handleCreateStory = (formData: any) => {
    // --- CRITICAL DIAGNOSTIC LOG ---
    console.log('--- Submitting Story Payload ---');
    console.log('Data being sent to the API:', formData);
    console.log('Data type:', typeof formData);
    console.log('Data keys:', Object.keys(formData));
    console.log('Data values:', Object.values(formData));
    console.log('---------------------------------');
    
    // The mutation is called after the log.
    createStoryMutation.mutate(formData);
  };

  // Show loading state
  if (isLoading) {
    return <CommunityPageSkeleton />;
  }

  // Show error state
  if (isError) {
    return (
      <ErrorMessage 
        error={error?.message} 
        onRetry={() => refetch()} 
      />
    );
  }

  // Extract data from API response
  const communityData = data?.data;

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Cộng đồng du lịch</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Chia sẻ câu chuyện du lịch của bạn, khám phá những trải nghiệm thú vị từ cộng đồng yêu du lịch Việt Nam
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-3">
              {/* Featured Story */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Câu chuyện nổi bật</h2>
                {communityData?.featuredStory ? (
                  <StoryCard story={communityData.featuredStory} featured={true} />
                ) : (
                  <div className="bg-card border rounded-xl p-8 text-center">
                    <p className="text-muted-foreground">Chưa có câu chuyện nổi bật nào</p>
                  </div>
                )}
              </div>

              {/* Story Feed */}
              <div>
                <h2 className="text-xl font-bold mb-4">Câu chuyện mới nhất</h2>
                <div className="space-y-4">
                  {communityData?.latestStories && communityData.latestStories.length > 0 ? (
                    communityData.latestStories.map((story) => (
                      <StoryCard key={story._id} story={story} />
                    ))
                  ) : (
                    <div className="bg-card border rounded-xl p-8 text-center">
                      <p className="text-muted-foreground">Chưa có câu chuyện nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Write Story Button */}
                {isAuthenticated ? (
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Viết bài chia sẻ
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    size="lg" 
                    variant="outline"
                    onClick={() => {
                      toast.error("Vui lòng đăng nhập để viết bài chia sẻ");
                    }}
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Đăng nhập để viết bài
                  </Button>
                )}

                {/* Trending Topics */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Chủ đề thịnh hành
                  </h3>
                  <div className="space-y-3">
                    {communityData?.trendingTags && communityData.trendingTags.length > 0 ? (
                      communityData.trendingTags.map((topic, index) => (
                        <button 
                          key={topic.tag}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div>
                            <div className="font-medium text-sm">#{topic.tag}</div>
                            <div className="text-xs text-muted-foreground">{topic.count} bài viết</div>
                          </div>
                          <div className="text-xs text-muted-foreground">#{index + 1}</div>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Chưa có dữ liệu thống kê
                      </p>
                    )}
                  </div>
                </div>

                {/* Top Authors */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Tác giả nổi bật
                  </h3>
                  <div className="space-y-4">
                    {communityData?.topAuthors && communityData.topAuthors.length > 0 ? (
                      communityData.topAuthors.map((author) => (
                        <div key={author._id} className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={author.avatar} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {author.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-sm truncate">{author.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {author.followerCount.toLocaleString()} người theo dõi • {author.storyCount} bài viết
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            Theo dõi
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Chưa có dữ liệu tác giả
                      </p>
                    )}
                  </div>
                </div>

                {/* Community Stats */}
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="font-bold mb-4">Thống kê cộng đồng</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Tổng bài viết</span>
                      <span className="font-semibold">
                        {communityData?.communityStats?.totalStories?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Thành viên</span>
                      <span className="font-semibold">
                        {communityData?.communityStats?.totalMembers?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Bài viết tuần này</span>
                      <span className="font-semibold text-primary">
                        +{communityData?.communityStats?.storiesThisWeek?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Create Story Modal */}
      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateStory}
        isSubmitting={createStoryMutation.isPending}
      />
    </div>
  );
};

export default CommunityHub;




