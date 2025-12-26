import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageSquare, Share2, ArrowLeft, Calendar, Eye } from 'lucide-react';
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { useToast } from "@/components/ui/use-toast";

interface Story {
    _id: string;
    title: string;
    content: string;
    coverImage?: string;
    tags: string[];
    likeCount: number;
    views: number;
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

    const { data, isLoading, error } = useQuery({
        queryKey: ['story', id],
        queryFn: async () => {
            // Assuming a GET endpoint exists for fetching a single story
            // If not, we might need to rely on the list or create the endpoint.
            // Based on previous work, I haven't seen a specific GET /stories/:id in `community.js` yet.
            // I should probably add that or check if I can fetch from the list cache?
            // For now, let's assume the endpoint exists or use a mock if needed.
            // Wait, I created community.js, let me check what I added.
            // I added GET /hub and POST /stories. I did NOT add GET /stories/:id.
            // So this query will fail unless I implement it.
            // But the user just asked to move to the page. 
            // I will implement the UI first and maybe mocking the data or implementing the endpoint next.
            // Actually, I can implement the endpoint quickly.
            const response = await apiClient.get<Story>(`/stories/${id}`);
            if (!response.success || !response.data) {
                throw new Error(response.error || 'Failed to load story');
            }
            return response.data;
        }
    });

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

    if (error || !data) {
        return (
            <div className="min-h-screen bg-secondary">
                <Header />
                <main className="pt-20">
                    <div className="container mx-auto px-4 py-8 text-center">
                        <h2 className="text-2xl font-bold text-red-500 mb-4">Không tìm thấy bài viết</h2>
                        <Button onClick={() => navigate('/community')}>Quay lại Cộng đồng</Button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    const story = data;
    const { toast } = useToast();

    console.log('StoryDetailPage State:', { isLoading, error, data, id });

    if (story) {
        console.log('Story Object:', story);
    }

    const handleChat = async () => {
        // Check auth (simplified for now, ideally useAuth context)
        // Assuming apiClient handles 401 redirection or we can check a stored token/user
        // But for now let's just try to call the API
        try {
            const res = await apiClient.post<any>('/chat/inquiry', { storyId: story._id });
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
                                    alt={story.title}
                                    className="w-full h-full object-cover"
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
                                {story.title}
                            </h1>

                            <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                        <AvatarImage src={story.author?.avatar} alt={story.author?.name} />
                                        <AvatarFallback>{story.author?.name?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{story.author?.name || 'Unknown Author'}</h3>
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
                                    <Button variant="outline" size="sm" className="gap-2 rounded-full">
                                        <Share2 className="w-4 h-4" /> Chia sẻ
                                    </Button>
                                </div>
                            </div>

                            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {story.content}
                            </div>

                            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <div className="flex gap-4">
                                    <Button variant="ghost" className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                                        <Heart className="w-5 h-5" /> {story.likeCount} Yêu thích
                                    </Button>
                                    <Button variant="ghost" className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                                        <MessageSquare className="w-5 h-5" /> Bình luận
                                    </Button>
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
