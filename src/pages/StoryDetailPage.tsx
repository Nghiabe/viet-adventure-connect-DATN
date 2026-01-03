import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Share2, ArrowLeft, Calendar, Eye } from 'lucide-react';
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

interface Story {
    _id: string;
    title: string;
    content: string;
    coverImage?: string;
    tags: string[];
    likeCount: number;
    views: number;
    likes?: string[];
    createdAt: string;
    author: {
        _id: string;
        name: string;
        avatar?: string;
    };
}

const StoryDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isAuthenticated, user } = useAuth();

    // State for interactive features
    const [likes, setLikes] = useState<string[]>([]);
    const [likeCount, setLikeCount] = useState(0);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Fetch story and comments
    const { data, isLoading, error } = useQuery({
        queryKey: ['story', id],
        queryFn: async () => {
            const [storyRes, commentsRes] = await Promise.all([
                apiClient.get<Story>(`/stories/${id}`),
                apiClient.get<{ data: any[] }>(`/stories/${id}/comments`).catch(() => ({ data: [] }))
            ]);

            if (!storyRes.success || !storyRes.data) {
                throw new Error(storyRes.error || 'Failed to load story');
            }

            return { story: storyRes.data, comments: commentsRes.data || [] };
        }
    });

    // Update local state when data is loaded
    useEffect(() => {
        if (data?.story) {
            setLikes(data.story.likes || []);
            setLikeCount(data.story.likeCount || 0);
            setComments(data.comments || []);
        }
    }, [data]);

    const isLiked = user ? likes.includes(user.userId || user._id) : false;

    const handleLike = async () => {
        if (!isAuthenticated) {
            toast({
                title: "Thông báo",
                description: "Vui lòng đăng nhập để thích bài viết",
                variant: "default"
            });
            return;
        }

        // Optimistic update
        const previousLikes = [...likes];
        const previousCount = likeCount;

        if (isLiked) {
            setLikes(likes.filter(uid => uid !== (user?.userId || user?._id)));
            setLikeCount(prev => prev - 1);
        } else {
            setLikes([...likes, (user?.userId || user?._id) as string]);
            setLikeCount(prev => prev + 1);
        }

        try {
            const res = await apiClient.post<{ success: boolean, likeCount: number, isLiked: boolean }>(`/stories/${id}/like`);
            if (res.success) {
                setLikeCount(res.likeCount);
            } else {
                // Revert on failure
                setLikes(previousLikes);
                setLikeCount(previousCount);
            }
        } catch (error) {
            setLikes(previousLikes);
            setLikeCount(previousCount);
            console.error("Like error", error);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast({ title: "Thông báo", description: "Vui lòng đăng nhập để bình luận", variant: "default" });
            return;
        }
        if (!newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            const res = await apiClient.post<{ success: boolean, data: any }>(`/stories/${id}/comments`, { content: newComment });
            if (res.success && res.data) {
                setComments([res.data, ...comments]);
                setNewComment('');
                toast({ title: "Thành công", description: "Đã đăng bình luận" });
            }
        } catch (error) {
            console.error("Comment error", error);
            toast({ title: "Lỗi", description: "Không thể đăng bình luận", variant: "destructive" });
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleChat = async () => {
        try {
            if (!data?.story?._id) return;
            const res = await apiClient.post<any>('/chat/inquiry', { storyId: data.story._id });
            if (res.success && res.data) {
                navigate(`/chat/${res.data.bookingId}`);
            } else {
                if ((res as any).error === 'Authentication required' || (res as any).statusCode === 401) {
                    navigate('/login');
                } else {
                    toast({
                        title: "Lỗi",
                        description: (res as any).error || "Không thể tạo cuộc trò chuyện",
                        variant: "destructive"
                    });
                }
            }
        } catch (error: any) {
            console.error("Chat error", error);
            if (error.status === 401) {
                navigate('/login');
            } else {
                toast({
                    title: "Lỗi",
                    description: "Không thể kết nối máy chủ",
                    variant: "destructive"
                });
            }
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-secondary">
                <Header />
                <main className="pt-20">
                    <div className="container mx-auto px-4 py-8 max-w-4xl">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
                        </Button>
                        <Skeleton className="w-full h-[400px] rounded-xl mb-8" />
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-3/4" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !data || !data.story) {
        return (
            <div className="min-h-screen bg-secondary">
                <Header />
                <main className="pt-20">
                    <div className="container mx-auto px-4 py-8 text-center">
                        <h2 className="text-2xl font-bold text-red-500 mb-4">Không tìm thấy bài viết</h2>
                        <p className="text-gray-500 mb-6">Có thể bài viết đã bị xóa hoặc xảy ra lỗi kết nối.</p>
                        <Button onClick={() => navigate('/community')}>Quay lại Cộng đồng</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const { story } = data;

    return (
        <div className="min-h-screen bg-secondary">
            <Header />
            <main className="pt-20">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <Button variant="ghost" onClick={() => navigate('/community')} className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại Cộng đồng
                    </Button>

                    <article className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                        {story.coverImage && (
                            <div className="relative h-[400px] w-full">
                                <img
                                    src={story.coverImage}
                                    alt={story.title || 'Hình ảnh bài viết'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=No+Image';
                                    }}
                                />
                            </div>
                        )}

                        <div className="p-8">
                            <div className="flex flex-wrap gap-2 mb-6">
                                {(story.tags || []).map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="px-3 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 border-none">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>

                            <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100 leading-tight">
                                {story.title || 'Không có tiêu đề'}
                            </h1>

                            <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                        <AvatarImage src={story.author?.avatar} alt={story.author?.name} />
                                        <AvatarFallback>{story.author?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{story.author?.name || 'Tác giả ẩn danh'}</h3>
                                        <div className="flex items-center text-sm text-gray-500 gap-4">
                                            <span className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {story.createdAt ? new Date(story.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                                            </span>
                                            <span className="flex items-center">
                                                <Eye className="w-4 h-4 mr-1" />
                                                {story.views || 0} lượt xem
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleChat}
                                        className="gap-2 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all hover:scale-105"
                                    >
                                        <MessageSquare className="w-4 h-4" /> Nhắn tin
                                    </Button>
                                    <Button onClick={() => window.location.href = `mailto:?subject=${story.title}&body=${window.location.href}`} variant="outline" size="sm" className="gap-2 rounded-full">
                                        <Share2 className="w-4 h-4" /> Chia sẻ
                                    </Button>
                                </div>
                            </div>

                            <div
                                className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: story.content || '<p>Nội dung đang được cập nhật...</p>' }}
                            />

                            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-4 mb-8">
                                    <Button
                                        variant="ghost"
                                        onClick={handleLike}
                                        className={`gap-2 ${isLiked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                                        {likeCount} Yêu thích
                                    </Button>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MessageSquare className="w-5 h-5" /> {comments.length} Bình luận
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-bold">Bình luận</h3>

                                    {/* Comment Input */}
                                    {isAuthenticated ? (
                                        <form onSubmit={handleCommentSubmit} className="flex gap-4 items-start">
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={user?.avatar} />
                                                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 space-y-2">
                                                <textarea
                                                    className="w-full p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    placeholder="Viết bình luận của bạn..."
                                                    rows={3}
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                />
                                                <div className="flex justify-end">
                                                    <Button type="submit" disabled={isSubmittingComment || !newComment.trim()}>
                                                        {isSubmittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                                            <p className="text-muted-foreground mb-2">Vui lòng đăng nhập để bình luận</p>
                                            <Button variant="outline" onClick={() => navigate('/login')}>Đăng nhập ngay</Button>
                                        </div>
                                    )}

                                    {/* Comments Feed */}
                                    <div className="space-y-6 mt-6">
                                        {comments.length > 0 ? (
                                            comments.map((comment: any) => (
                                                <div key={comment._id} className="flex gap-4">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage src={comment.author?.avatar} />
                                                        <AvatarFallback>{comment.author?.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-semibold">{comment.author?.name || 'Người dùng ẩn danh'}</h4>
                                                            <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-muted-foreground py-4">Chưa có bình luận nào. Hãy là người đầu tiên bình luận!</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default StoryDetailPage;
