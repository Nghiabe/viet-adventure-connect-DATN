import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Check, Users, Send, Search, Sparkles, Mail, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UserResult {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: string;
    planId: string;
    onShare: () => void;
}

export const ShareModal = ({ isOpen, onClose, planName, planId, onShare }: ShareModalProps) => {
    const [copied, setCopied] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [permission, setPermission] = useState('view');
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserResult[]>([]);
    const [emailSearchResults, setEmailSearchResults] = useState<UserResult[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const { toast } = useToast();

    // Debounce Search for Friend Suggestions (Bottom Search)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    if (data.success) {
                        setSearchResults(data.data);
                    }
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    // Debounce Search for Email Input (Top Search)
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (inviteEmail.length >= 2) {
                // If it's a valid email being typed, we might still want to search for users with that email
                // or users with that name.
                setIsEmailLoading(true);
                try {
                    const res = await fetch(`/api/users/search?q=${encodeURIComponent(inviteEmail)}`);
                    const data = await res.json();
                    if (data.success) {
                        setEmailSearchResults(data.data);
                    }
                } catch (error) {
                    console.error("Email search failed", error);
                } finally {
                    setIsEmailLoading(false);
                }
            } else {
                setEmailSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [inviteEmail]);


    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
            title: "Đã sao chép!",
            description: "Liên kết đã được lưu vào bộ nhớ tạm.",
            className: "bg-emerald-50 border-emerald-200 text-emerald-800"
        });
    };

    const handleSelectUser = (user: UserResult) => {
        if (selectedUsers.find(u => u._id === user._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
        // If selected from email search, clear email input
        if (inviteEmail) {
            setInviteEmail('');
            setEmailSearchResults([]);
        }
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
    };

    const handleSend = async () => {
        if (!inviteEmail && selectedUsers.length === 0) return;

        setIsSending(true);
        try {
            const payload = {
                planId,
                emails: inviteEmail ? [inviteEmail] : [],
                userIds: selectedUsers.map(u => u._id),
                permission
            };

            const res = await fetch('/api/plans/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Gửi lời mời thành công! 🎉",
                    description: `Đã chia sẻ kế hoạch "${planName}" với bạn bè.`,
                    className: "bg-blue-50 border-blue-200 text-blue-800"
                });
                onClose();
                onShare();
                // Reset form
                setInviteEmail('');
                setSelectedUsers([]);
                setQuery('');
            } else {
                toast({
                    variant: "destructive",
                    title: "Có lỗi xảy ra",
                    description: data.error || "Không thể gửi lời mời."
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Lỗi kết nối",
                description: "Vui lòng kiểm tra kết nối mạng và thử lại."
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
                {/* Header with decorative background */}
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

                    <DialogHeader className="relative z-10 text-left">
                        <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                            <Share2 className="h-6 w-6 text-blue-100" />
                            Chia sẻ hành trình
                        </DialogTitle>
                        <DialogDescription className="text-blue-100/90 text-sm mt-1">
                            Mời bạn bè cùng lên kế hoạch cho chuyến đi <strong>"{planName}"</strong> của bạn.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6">
                    {/* Copy Link Section */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Liên kết chia sẻ</Label>
                        <div className="flex shadow-sm rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <div className="bg-gray-50 px-3 flex items-center border-r border-gray-200">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                            </div>
                            <Input
                                value="https://viettravel.com/plans/share/..."
                                readOnly
                                className="border-0 focus-visible:ring-0 rounded-none bg-white text-gray-600 font-medium"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleCopyLink}
                                className={`rounded-none px-4 hover:bg-blue-50 transition-colors ${copied ? 'text-emerald-600' : 'text-blue-600'}`}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Invite Section with Email Auto-complete */}
                    <div className="space-y-4">
                        <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                            Gửi lời mời
                            <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Email hoặc Tìm bạn bè</span>
                        </Label>

                        <div className="flex gap-2 relative z-20">
                            <div className="relative flex-1 group">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Nhập email hoặc tên..."
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="pl-9 focus-visible:ring-blue-500/30"
                                />

                                {/* Email Autocomplete Dropdown */}
                                {(isEmailLoading || emailSearchResults.length > 0) && inviteEmail.length >= 2 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        {isEmailLoading ? (
                                            <div className="p-3 text-center text-xs text-gray-500 italic">Đang tìm kiếm...</div>
                                        ) : (
                                            <ScrollArea className="max-h-[200px]">
                                                <div className="p-1">
                                                    {emailSearchResults.map(user => {
                                                        const isSelected = !!selectedUsers.find(u => u._id === user._id);
                                                        return (
                                                            <div
                                                                key={user._id}
                                                                onClick={() => handleSelectUser(user)}
                                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                                            >
                                                                <Avatar className="h-7 w-7 ring-1 ring-gray-100">
                                                                    <AvatarImage src={user.avatar} />
                                                                    <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                                                                        {user.name.charAt(0).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                                                </div>
                                                                {isSelected && <Check className="h-3 w-3 text-blue-600" />}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </ScrollArea>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Select value={permission} onValueChange={setPermission}>
                                <SelectTrigger className="w-[100px] bg-gray-50 border-gray-200 text-gray-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="view">Xem</SelectItem>
                                    <SelectItem value="edit">Sửa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Users (Bottom - kept for redundant clarity or specific friend search if needed, but user might strictly use top one now. Keeping both as requested "like the one below") */}
                        <div className="relative group">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input
                                    placeholder="Tìm kiếm người dùng trong hệ thống..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="pl-9 focus-visible:ring-blue-500/30"
                                />
                            </div>

                            {/* Search Results Dropdown */}
                            {(isLoading || searchResults.length > 0) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {isLoading ? (
                                        <div className="p-4 text-center text-sm text-gray-500">Đang tìm kiếm...</div>
                                    ) : (
                                        <ScrollArea className="max-h-[240px]">
                                            <div className="p-1">
                                                {searchResults.map(user => {
                                                    const isSelected = !!selectedUsers.find(u => u._id === user._id);
                                                    return (
                                                        <div
                                                            key={user._id}
                                                            onClick={() => handleSelectUser(user)}
                                                            className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                                        >
                                                            <Avatar className="h-8 w-8 ring-2 ring-white shadow-sm">
                                                                <AvatarImage src={user.avatar} />
                                                                <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white text-xs">
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{user.name}</p>
                                                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                                            </div>
                                                            {isSelected && <Check className="h-4 w-4 text-blue-600 animate-in zoom-in spin-in-90 duration-300" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </ScrollArea>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Users List */}
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {selectedUsers.map(user => (
                                    <Badge key={user._id} variant="secondary" className="pl-1 pr-2 py-1 gap-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer transition-colors group" onClick={() => handleRemoveUser(user._id)}>
                                        <Avatar className="h-5 w-5">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="text-[10px]">{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="max-w-[100px] truncate">{user.name}</span>
                                        <span className="sr-only">Remove</span>
                                        <span className="text-xs opacity-50 group-hover:opacity-100">×</span>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-gray-50/50 border-t border-gray-100 sm:justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>{selectedUsers.length} người được chọn</span>
                    </div>
                    <Button
                        onClick={handleSend}
                        disabled={(!inviteEmail && selectedUsers.length === 0) || isSending}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                    >
                        {isSending ? (
                            <>Sending...</>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Gửi lời mời
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
