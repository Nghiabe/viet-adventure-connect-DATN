import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Copy, Check, Users, Send } from 'lucide-react';
import { MOCK_FRIENDS } from '@/data/friends';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: string;
    onShare: () => void; // Callback after sharing
}

export const ShareModal = ({ isOpen, onClose, planName, onShare }: ShareModalProps) => {
    const [copied, setCopied] = useState(false);
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('view');
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
    const { toast } = useToast();

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ description: "Đã sao chép liên kết vào bộ nhớ tạm" });
    };

    const handleSend = () => {
        // Mock sending logic
        toast({
            title: "Đã gửi lời mời",
            description: `Đã chia sẻ kế hoạch "${planName}" thành công!`,
        });
        onClose();
        onShare();
    };

    const toggleFriend = (id: string) => {
        if (selectedFriends.includes(id)) {
            setSelectedFriends(selectedFriends.filter(fid => fid !== id));
        } else {
            setSelectedFriends([...selectedFriends, id]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Chia sẻ kế hoạch</DialogTitle>
                    <DialogDescription>
                        Mời bạn bè cùng xem hoặc chỉnh sửa kế hoạch "{planName}".
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 my-2">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">Link</Label>
                        <Input id="link" defaultValue="https://viettravel.com/plans/share/..." readOnly className="bg-muted" />
                    </div>
                    <Button type="submit" size="sm" className="px-3" onClick={handleCopyLink}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Gửi qua email</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="nhap_email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Select value={permission} onValueChange={setPermission}>
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="view">Xem</SelectItem>
                                    <SelectItem value="edit">Sửa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> Gợi ý bạn bè
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            {MOCK_FRIENDS.map(friend => (
                                <div
                                    key={friend.id}
                                    onClick={() => toggleFriend(friend.id)}
                                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${selectedFriends.includes(friend.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={friend.avatar} />
                                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-medium truncate">{friend.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
                                    </div>
                                    {selectedFriends.includes(friend.id) && <Check className="h-4 w-4 text-primary ml-auto" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between">
                    <span className="text-xs text-muted-foreground self-center">
                        {selectedFriends.length} người đã chọn
                    </span>
                    <Button type="button" onClick={handleSend} disabled={!email && selectedFriends.length === 0}>
                        <Send className="h-4 w-4 mr-2" />
                        Gửi lời mời
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
