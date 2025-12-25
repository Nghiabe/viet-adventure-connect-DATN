import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowLeft, Phone, MoreVertical, Paperclip, Search, FileText, Trash2, Flag } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import apiClient from "@/services/apiClient";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

interface User {
    _id: string;
    name: string;
    avatar?: string;
}

interface Message {
    _id: string;
    sender: User | string;
    text: string;
    createdAt: string;
}

interface ConversationResponse {
    conversation: any;
    messages: Message[];
}

export default function ChatPage() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const [newMessage, setNewMessage] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch current user
    const { data: currentUser } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await apiClient.get<any>('/auth/me');
            return res.data;
        }
    });

    // Fetch conversations list
    const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await apiClient.get<any[]>('/chat/conversations');
            return res.data || [];
        }
    });

    // Fetch Booking to get provider details (fallback)
    const { data: booking } = useQuery({
        queryKey: ['booking', bookingId],
        queryFn: async () => {
            const res = await apiClient.get<any>(`/bookings/${bookingId}`);
            return res.data;
        },
        enabled: !!bookingId
    });

    // Fetch Chat History
    const { data: chatData, isLoading, isError, error } = useQuery({
        queryKey: ['chat', bookingId],
        queryFn: async () => {
            const res = await apiClient.get<ConversationResponse>(`/chat/${bookingId}`);
            console.log('Chat API Response:', res); // Debug log
            // Handle both response formats:
            // 1. New: { success: true, data: { conversation, messages } } -> returns res.data
            // 2. Old/Fallback: { success: true, conversation, messages } -> returns res
            let result;
            if (res.data && (res.data as any).messages) {
                result = res.data;
            } else {
                result = res as any;
            }
            return result || { conversation: null, messages: [] };
        },
        enabled: !!bookingId,
        refetchInterval: 3000 // Poll every 3 seconds for new messages
    });


    const messages = chatData?.messages || [];

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (text: string) => {
            await apiClient.post(`/chat/${bookingId}/messages`, { text });
        },
        onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: ['chat', bookingId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] }); // Refresh list to show new last message
        },
        onError: (err: any) => {
            console.error('Send failed:', err);
            alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
        }
    });

    // Delete Conversation Mutation
    const deleteConversationMutation = useMutation({
        mutationFn: async () => {
            await apiClient.delete(`/chat/${bookingId}`);
        },
        onSuccess: () => {
            toast({
                title: "Thành công",
                description: "Đã xóa cuộc trò chuyện",
            });
            setShowDeleteDialog(false);
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            navigate('/chat');
        },
        onError: (err: any) => {
            console.error('Delete failed:', err);
            toast({
                title: "Lỗi",
                description: "Không thể xóa cuộc trò chuyện. Vui lòng thử lại.",
                variant: 'destructive'
            });
            setShowDeleteDialog(false);
        }
    });

    const providerName = booking?.tour?.title || booking?.partnerService?.name || "Nhà cung cấp dịch vụ";
    const providerImage = booking?.tour?.mainImage || booking?.partnerService?.image;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;
        sendMessageMutation.mutate(newMessage);
    };

    // Helper to check if message is from me
    const isMe = (msg: Message) => {
        const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
        return senderId === currentUser?._id;
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
            <Header />

            <div className="container w-[98%] mx-auto py-2 mt-24 mb-8 h-[88vh]">
                <div className="bg-background rounded-xl shadow-lg border overflow-hidden flex h-full">

                    {/* Sidebar - Conversation List */}
                    <div className="w-80 border-r flex flex-col hidden md:flex">
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-bold mb-4">Đoạn chat</h2>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Tìm kiếm tin nhắn"
                                    className="pl-9 bg-muted/50 rounded-full border-none focus-visible:ring-1"
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-2 space-y-1">
                                {isLoadingConversations ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">Đang tải...</div>
                                ) : conversations.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">Chưa có đoạn chat nào</div>
                                ) : (
                                    conversations.map((conv: any) => (
                                        <div
                                            key={conv._id}
                                            onClick={() => navigate(`/chat/${conv.bookingId}`)}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${bookingId === conv.bookingId ? 'bg-accent' : 'hover:bg-muted/50'
                                                }`}
                                        >
                                            <Avatar className="w-12 h-12 border">
                                                <AvatarImage src={conv.partner?.avatar} />
                                                <AvatarFallback>{conv.partner?.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <h4 className="font-medium truncate">{conv.partner?.name}</h4>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <span className="truncate max-w-[120px]">
                                                        {conv.lastMessage?.text || 'Bắt đầu trò chuyện'}
                                                    </span>
                                                    <span>·</span>
                                                    <span className="whitespace-nowrap text-xs">
                                                        {conv.updatedAt && formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false, locale: vi })}
                                                    </span>
                                                </div>
                                            </div>
                                            {!conv.lastMessage && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col w-full">
                        {/* Chat Header */}
                        {bookingId ? (
                            <>
                                <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-slate-950 z-10 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <Link to="/profile/bookings" className="md:hidden text-muted-foreground hover:text-primary">
                                            <ArrowLeft className="w-5 h-5" />
                                        </Link>
                                        <div className="relative">
                                            <Avatar>
                                                <AvatarImage src={providerImage} />
                                                <AvatarFallback>PV</AvatarFallback>
                                            </Avatar>
                                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-950 animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm md:text-base line-clamp-1">{providerName}</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-muted-foreground">Đang hoạt động</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="hidden md:flex text-primary">
                                            <Phone className="w-5 h-5" />
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-primary">
                                                    <MoreVertical className="w-5 h-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/profile/bookings/${bookingId}`)}>
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Xem chi tiết đơn hàng
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={() => setShowDeleteDialog(true)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Xóa cuộc trò chuyện
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        toast({
                                                            title: "Đã báo cáo",
                                                            description: "Chúng tôi đã ghi nhận báo cáo của bạn.",
                                                        });
                                                    }}
                                                >
                                                    <Flag className="w-4 h-4 mr-2" />
                                                    Báo cáo nhà cung cấp
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
                                    <div className="absolute inset-0 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                                        {isLoading ? (
                                            <div className="text-center text-muted-foreground mt-10">Đang tải tin nhắn...</div>
                                        ) : isError ? (
                                            <div className="text-center text-red-500 mt-10">
                                                <p>Có lỗi xảy ra khi tải tin nhắn.</p>
                                                <p className="text-xs">{(error as any)?.message || 'Vui lòng thử lại sau.'}</p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Booking Info Header */}
                                                {chatData?.conversation?.booking && (
                                                    <div className="mb-6 mx-auto max-w-2xl bg-white dark:bg-slate-950 rounded-xl border shadow-sm p-4">
                                                        {(chatData.conversation.booking as any).status === 'provisional' ? (
                                                            // Simplified Header for Tour/Story Inquiry
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex gap-4">
                                                                    {(chatData.conversation.booking as any).serviceInfo?.image && (
                                                                        <img
                                                                            src={(chatData.conversation.booking as any).serviceInfo.image}
                                                                            alt="Service"
                                                                            className="w-16 h-16 rounded-lg object-cover"
                                                                        />
                                                                    )}
                                                                    <div>
                                                                        <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">
                                                                            {(chatData.conversation.booking as any).serviceInfo?.title || 'Tư vấn'}
                                                                        </h3>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                                                {(chatData.conversation.booking as any).type === 'story' ? 'Thảo luận' : 'Tư vấn'}
                                                                            </span>
                                                                            {(chatData.conversation.booking as any).type !== 'story' && (
                                                                                <span className="text-sm text-primary font-semibold">
                                                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((chatData.conversation.booking as any).totalPrice)}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {(chatData.conversation.booking as any).tour && (
                                                                    <Button variant="outline" size="sm" asChild>
                                                                        <Link to={`/experience/${(chatData.conversation.booking as any).tour}`}>
                                                                            Xem tour
                                                                        </Link>
                                                                    </Button>
                                                                )}
                                                                {(chatData.conversation.booking as any).story && (
                                                                    <Button variant="outline" size="sm" asChild>
                                                                        <Link to={`/community/stories/${(chatData.conversation.booking as any).story}`}>
                                                                            Xem bài viết
                                                                        </Link>
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            // Standard Booking Header
                                                            <>
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div>
                                                                        <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">
                                                                            {(chatData.conversation.booking as any).serviceInfo?.title || 'Thông tin đơn hàng'}
                                                                        </h3>
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
                                                                            Mã đơn: <span className="text-primary font-semibold">{(chatData.conversation.booking as any)._id?.slice(-8).toUpperCase()}</span>
                                                                        </p>
                                                                    </div>
                                                                    <div className={`px-3 py-1 text-xs rounded-full font-medium capitalize border ${(chatData.conversation.booking as any).status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                        (chatData.conversation.booking as any).status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                            'bg-gray-100 text-gray-700 border-gray-200'
                                                                        }`}>
                                                                        {(chatData.conversation.booking as any).status === 'pending' ? 'Chờ xác nhận' :
                                                                            (chatData.conversation.booking as any).status === 'confirmed' ? 'Đã xác nhận' :
                                                                                (chatData.conversation.booking as any).status}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-3 gap-4 pt-3 border-t text-sm">
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground mb-1">Tổng tiền</p>
                                                                        <p className="font-semibold text-primary">
                                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((chatData.conversation.booking as any).totalPrice)}
                                                                        </p>
                                                                    </div>
                                                                    {(chatData.conversation.booking as any).checkInDate && (
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground mb-1">Ngày đi</p>
                                                                            <p className="font-medium">
                                                                                {new Date((chatData.conversation.booking as any).checkInDate).toLocaleDateString('vi-VN')}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground mb-1">Số khách</p>
                                                                        <p className="font-medium">
                                                                            {(chatData.conversation.booking as any).participants} người
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Messages */}
                                                {messages.length === 0 ? (
                                                    <div className="text-center text-muted-foreground mt-20">
                                                        <p className="text-lg font-medium mb-1">Chưa có tin nhắn nào</p>
                                                        <p className="text-sm">Hãy bắt đầu cuộc trò chuyện với nhà cung cấp!</p>
                                                    </div>
                                                ) : (
                                                    messages.map((msg) => (
                                                        <div
                                                            key={msg._id}
                                                            className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div className={`flex flex-col max-w-[75%] ${isMe(msg) ? 'items-end' : 'items-start'}`}>
                                                                <div
                                                                    className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm ${isMe(msg)
                                                                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-foreground border rounded-tl-sm'
                                                                        }`}
                                                                >
                                                                    {msg.text}
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Input Area */}
                                <div className="p-4 bg-white dark:bg-slate-950 border-t">
                                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:bg-muted/50 rounded-full">
                                            <Paperclip className="w-5 h-5" />
                                        </Button>
                                        <div className="flex-1 relative">
                                            <Input
                                                placeholder="Nhập tin nhắn..."
                                                className="w-full pl-4 pr-10 py-5 bg-muted/40 border-transparent hover:bg-muted/60 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary rounded-full transition-all"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                disabled={sendMessageMutation.isPending}
                                            />
                                            <Button
                                                type="submit"
                                                size="icon"
                                                className={`absolute right-1 top-1 h-8 w-8 rounded-full transition-all ${newMessage.trim() ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                                                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                            >
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Send className="w-8 h-8 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-medium mb-1">Chọn một đoạn chat</h3>
                                <p className="text-sm max-w-xs text-center">Chọn một cuộc trò chuyện từ danh sách bên trái để xem nội dung và gửi tin nhắn.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa cuộc trò chuyện?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cuộc trò chuyện này sẽ bị ẩn khỏi danh sách của bạn. Bạn không thể hoàn tác hành động này.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteConversationMutation.mutate()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
}
