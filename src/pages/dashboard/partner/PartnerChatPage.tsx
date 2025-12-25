import { useState, useRef, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export default function PartnerChatPage() {
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

    // Fetch Booking info (fallback)
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
            let result;
            if (res.data && (res.data as any).messages) {
                result = res.data;
            } else {
                result = res as any;
            }
            return result || { conversation: null, messages: [] };
        },
        enabled: !!bookingId,
        refetchInterval: 3000 // Poll every 3 seconds
    });


    const messages = chatData?.messages || [];
    const conversationBooking = chatData?.conversation?.booking;

    // Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (text: string) => {
            await apiClient.post(`/chat/${bookingId}/messages`, { text });
        },
        onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: ['chat', bookingId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (err: any) => {
            console.error('Send failed:', err);
            toast({
                title: "Lỗi",
                description: "Không thể gửi tin nhắn. Vui lòng thử lại.",
                variant: 'destructive'
            });
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
            navigate('/dashboard/chat');
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

    const otherPersonName = booking?.user?.name || "Khách hàng"; // Partner chats with User
    // Note: The original ChatPage logic was slightly ambiguous on "who is the other person". 
    // Usually, the API returns the partner object or user object depending on who is viewing.
    // For now I'll stick to generic display or rely on what the conversation list returns.

    // In ChatPage it was: 
    // const providerName = booking?.tour?.title || booking?.partnerService?.name || "Nhà cung cấp dịch vụ";
    // This implies ChatPage was user-facing. 
    // For PartnerChatPage, we want to see the User (Consumer).
    // Let's assume the API handles this somewhat or we might need to adjust.
    // However, the conversation list (lines 198-223 in original) uses `conv.partner?.name`. 
    // If I am a partner, `conv.partner` might be populated with MY info or null, and I want `conv.user`.
    // Let's check the API response structure if possible, but for now I will try to use `conv.user` or fallback.

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

    const isMe = (msg: Message) => {
        const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
        return senderId === currentUser?._id;
    };

    return (
        <div className="flex flex-col h-[100vh] bg-background">
            {/* Adjusted height for dashboard context - Full screen */}
            <div className="flex h-full bg-card overflow-hidden">

                {/* Sidebar - Conversation List */}
                <div className="w-80 border-r flex flex-col">
                    <div className="p-4 border-b">
                        <h2 className="text-xl font-bold mb-4">Tin nhắn</h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Tìm kiếm..."
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
                                        onClick={() => navigate(`/dashboard/chat/${conv.bookingId}`)}
                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${bookingId === conv.bookingId ? 'bg-accent' : 'hover:bg-muted/50'
                                            }`}
                                    >
                                        <Avatar className="w-12 h-12 border">
                                            {/* Logic to show User avatar if I am Partner */}
                                            <AvatarImage src={conv.user?.avatar || conv.partner?.avatar} />
                                            <AvatarFallback>{(conv.user?.name || conv.partner?.name || "?").charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <h4 className="font-medium truncate">{conv.user?.name || conv.partner?.name || "Người dùng"}</h4>
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
                            <div className="p-4 border-b flex items-center justify-between bg-card z-10 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Link to="/dashboard/chat" className="md:hidden text-muted-foreground hover:text-primary">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Link>
                                    <div className="relative">
                                        <Avatar>
                                            {/* Header Avatar - use booking.user if available */}
                                            <AvatarImage src={booking?.user?.avatar} />
                                            <AvatarFallback>{booking?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-sm md:text-base line-clamp-1">{booking?.user?.name || "Khách hàng"}</h3>
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
                                            <DropdownMenuItem onClick={() => navigate(`/dashboard/bookings`)}>
                                                {/* Adjusted link to partner bookings */}
                                                <FileText className="w-4 h-4 mr-2" />
                                                Xem quản lý đơn
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
                                                Báo cáo người dùng
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 bg-muted/20 relative overflow-hidden">
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
                                            {/* Booking Info Header context - Simplified for Partner */}
                                            {(booking || chatData?.conversation?.booking) && (
                                                <div className="mb-6 mx-auto max-w-2xl bg-white dark:bg-slate-950 rounded-xl border shadow-sm p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="font-medium text-lg text-slate-800 dark:text-slate-200">
                                                                {booking?.tour?.title || booking?.partnerService?.name || booking?.serviceInfo?.title || 'Thông tin đơn hàng'}
                                                            </h3>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">
                                                                Mã đơn: <span className="text-primary font-semibold">{(booking?._id || conversationBooking?._id)?.slice(-6).toUpperCase()}</span>
                                                            </p>
                                                        </div>
                                                        <div className={`px-3 py-1 text-xs rounded-full font-medium capitalize border ${(booking?.status || conversationBooking?.status) === 'confirmed' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                                                            (booking?.status || conversationBooking?.status) === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                                                                'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                                            }`}>
                                                            {(booking?.status || conversationBooking?.status) === 'pending' ? 'Chờ xác nhận' :
                                                                (booking?.status || conversationBooking?.status) === 'confirmed' ? 'Đã xác nhận' :
                                                                    (booking?.status || conversationBooking?.status)}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 pt-3 border-t dark:border-slate-800 text-sm">
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tổng tiền</p>
                                                            <p className="font-semibold text-primary">
                                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking?.totalPrice || conversationBooking?.totalPrice)}
                                                            </p>
                                                        </div>
                                                        {((booking?.serviceInfo?.checkIn || booking?.bookingDate) || conversationBooking?.checkInDate) && (
                                                            <div>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ngày đi</p>
                                                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                                                    {new Date(booking?.serviceInfo?.checkIn || booking?.bookingDate || conversationBooking?.checkInDate).toLocaleDateString('vi-VN')}
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Số người</p>
                                                            <p className="font-medium text-slate-700 dark:text-slate-300">
                                                                {booking?.participants || conversationBooking?.participants} người
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Messages */}
                                            {messages.length === 0 ? (
                                                <div className="text-center text-slate-500 mt-20">
                                                    <p className="text-lg font-medium mb-1">Chưa có tin nhắn nào</p>
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
                                                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                                                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border dark:border-slate-700 rounded-tl-sm'
                                                                    }`}
                                                            >
                                                                {msg.text}
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 px-1">
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
                            <div className="p-4 bg-white dark:bg-slate-950 border-t dark:border-slate-800">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-4xl mx-auto">
                                    <Button type="button" variant="ghost" size="icon" className="shrink-0 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                        <Paperclip className="w-5 h-5" />
                                    </Button>
                                    <div className="flex-1 relative">
                                        <Input
                                            placeholder="Nhập tin nhắn..."
                                            className="w-full pl-4 pr-10 py-5 bg-slate-100 dark:bg-slate-900 border-transparent hover:bg-slate-200 dark:hover:bg-slate-800 focus-visible:bg-white dark:focus-visible:bg-slate-950 focus-visible:ring-1 focus-visible:ring-primary rounded-full transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            disabled={sendMessageMutation.isPending}
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            className={`absolute right-1 top-1 h-8 w-8 rounded-full transition-all bg-primary text-primary-foreground hover:bg-primary/90 ${newMessage.trim() ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
                                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                <Send className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-1 text-foreground">Chọn một đoạn chat</h3>
                            <p className="text-sm max-w-xs text-center text-muted-foreground">Chọn một cuộc trò chuyện từ danh sách bên trái.</p>
                        </div>
                    )}
                </div>
            </div>

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
        </div>
    );
}
