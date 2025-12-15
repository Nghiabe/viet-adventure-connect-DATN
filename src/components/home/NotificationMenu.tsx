import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Notification {
    _id: string;
    type: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export const NotificationMenu = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id?: string) => {
        try {
            await fetch('/api/notifications/read', {
                method: 'PUT',
                body: JSON.stringify({ notificationId: id }),
                headers: { 'Content-Type': 'application/json' }
            });
            // Optimistic update
            if (id) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } else {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        if (notification.link) {
            window.location.href = notification.link;
        }
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-10 w-10 rounded-full transition-all duration-300 shadow-md bg-primary text-white hover:bg-white hover:text-primary"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-2 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0 mr-4 shadow-xl border-gray-100 rounded-xl overflow-hidden" align="end" sideOffset={8}>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
                            <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <h4 className="font-semibold text-gray-900 text-sm">Thông báo</h4>
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-3 text-xs font-medium text-primary hover:text-primary/80 hover:bg-primary/5 rounded-full"
                            onClick={() => markAsRead()}
                        >
                            Đánh dấu đã đọc
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px] bg-white">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center p-8 space-y-3">
                            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                                <Bell className="h-6 w-6 text-gray-300" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">Bạn chưa có thông báo mới nào</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`group relative p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${!notification.isRead ? 'bg-blue-50/40' : 'bg-white'}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex gap-4 items-start">
                                        <div className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 transition-colors ${!notification.isRead ? 'bg-primary shadow-sm shadow-primary/30' : 'bg-gray-200'}`} />
                                        <div className="flex-1 space-y-1.5">
                                            <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: vi })}</span>
                                            </p>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full hover:bg-white border border-transparent hover:border-gray-100 shadow-sm"
                                                    onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}
                                                >
                                                    <Check className="h-3.5 w-3.5 text-primary" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                    <Button variant="link" size="sm" className="text-xs text-gray-500 hover:text-primary no-underline hover:underline" asChild>
                        <a href="/notifications">Xem tất cả thông báo</a>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
