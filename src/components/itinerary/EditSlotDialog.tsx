import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Edit2, Loader2, CheckCircle2 } from "lucide-react";
import { getAlternatives } from "@/services/plannerService";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface EditSlotDialogProps {
    isOpen: boolean;
    onClose: () => void;
    activity: any;
    onConfirm: (feedback: string) => void;
    isLoading: boolean;
}

export const EditSlotDialog: React.FC<EditSlotDialogProps> = ({
    isOpen, onClose, activity, onConfirm, isLoading
}) => {
    const [feedback, setFeedback] = useState("");
    const [activeTab, setActiveTab] = useState("manual");
    const [alternatives, setAlternatives] = useState<any[]>([]);
    const [loadingAlts, setLoadingAlts] = useState(false);
    const { toast } = useToast();

    const handleGetAlternatives = async () => {
        setLoadingAlts(true);
        try {
            const res = await getAlternatives({
                slot_context: {
                    activity: activity.title,
                    location: activity.location,
                    time: activity.time,
                    type: activity.type
                }
            });
            if (res && res.alternatives) {
                setAlternatives(res.alternatives);
            }
        } catch (e) {
            toast({
                title: "Lỗi",
                description: "Không thể lấy gợi ý lúc này",
                variant: "destructive"
            });
        } finally {
            setLoadingAlts(false);
        }
    };

    const handleSelectAlternative = (alt: any) => {
        setFeedback(`Đổi sang: ${alt.title}. Lý do: ${alt.description}`);
        setActiveTab("manual"); // Switch back to manual tab to show the filled text
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa hoạt động</DialogTitle>
                    <DialogDescription>
                        Thay đổi "{activity?.title}" sang một địa điểm hoặc hoạt động khác.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">
                            <Edit2 className="w-4 h-4 mr-2" /> Nhập yêu cầu
                        </TabsTrigger>
                        <TabsTrigger value="suggestions">
                            <Sparkles className="w-4 h-4 mr-2" /> Gợi ý AI
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4 py-4">
                        <Textarea
                            placeholder="VD: Tôi muốn đổi sang đi Cầu Rồng, hoặc đi ăn Mì Quảng..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            AI sẽ tạo lại lịch trình dựa trên yêu cầu của bạn, giữ nguyên các phần còn lại.
                        </p>
                    </TabsContent>

                    <TabsContent value="suggestions" className="py-4">
                        {alternatives.length === 0 && !loadingAlts ? (
                            <div className="text-center py-8 space-y-3">
                                <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    AI có thể gợi ý 3 lựa chọn thay thế phù hợp nhất cho khung giờ này.
                                </p>
                                <Button onClick={handleGetAlternatives} variant="outline" className="mt-2">
                                    Tìm gợi ý thay thế
                                </Button>
                            </div>
                        ) : loadingAlts ? (
                            <div className="flex flex-col items-center justify-center py-10 space-y-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Đang tìm kiếm địa điểm thú vị...</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alternatives.map((alt, idx) => (
                                    <Card
                                        key={idx}
                                        className="p-3 cursor-pointer hover:bg-accent transition-colors border-l-4 border-l-primary/0 hover:border-l-primary"
                                        onClick={() => handleSelectAlternative(alt)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-semibold text-sm">{alt.title}</h4>
                                            <div className="bg-primary/10 p-1 rounded-full opacity-0 group-hover:opacity-100">
                                                <CheckCircle2 className="w-3 h-3 text-primary" />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{alt.description}</p>
                                        <div className="mt-2 flex gap-2">
                                            <span className="text-[10px] bg-secondary px-2 py-0.5 rounded-full font-medium">
                                                {alt.reason ? alt.reason.slice(0, 20) + '...' : 'Gợi ý phù hợp'}
                                            </span>
                                        </div>
                                    </Card>
                                ))}
                                <div className="text-center mt-2">
                                    <Button variant="ghost" size="sm" onClick={handleGetAlternatives} className="text-xs">
                                        <Loader2 className="w-3 h-3 mr-1" /> Tìm gợi ý khác
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Hủy</Button>
                    <Button
                        onClick={() => onConfirm(feedback)}
                        disabled={!feedback.trim() || isLoading}
                        className="bg-gradient-to-r from-primary to-orange-600"
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cập nhật lịch trình
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
