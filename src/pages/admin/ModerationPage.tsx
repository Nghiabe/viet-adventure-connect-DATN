import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, X, Star, ExternalLink, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { IReview, IStory, IUser, ITour, IDestination } from '@/types/models';
import apiClient from '@/services/apiClient';
import { toast } from 'sonner';

// Moderation Types
type ModerationItem =
    | ({ kind: 'review' } & IReview & { user: IUser; tour: Pick<ITour, '_id' | 'title'> })
    | ({ kind: 'story' } & IStory & { author: IUser; destination?: Pick<IDestination, '_id' | 'name' | 'slug'> });

function contributionTag(score?: number) {
    if (!score || score < 10) return 'Thành viên mới';
    if (score < 100) return 'Người đóng góp';
    return 'Đóng góp tích cực';
}

function ModerationCard({
    data,
    selected,
    onSelect,
    onApprove,
    onEditApprove,
    onReject
}: {
    data: ModerationItem;
    selected: boolean;
    onSelect: (v: boolean) => void;
    onApprove: () => void;
    onEditApprove: () => void;
    onReject: () => void;
}) {
    const isReview = data.kind === 'review';
    const author = isReview ? (data.user as IUser) : (data.author as IUser);
    const createdAt = formatDistanceToNow(new Date(data.createdAt), { addSuffix: true, locale: vi });

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                <Checkbox checked={selected} onCheckedChange={(v) => onSelect(!!v)} />
                <Avatar className="h-8 w-8">
                    <AvatarImage src={author?.avatar || ''} />
                    <AvatarFallback>{author?.name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                    <div className="font-medium">{author?.name || 'Người dùng ẩn'}</div>
                    <Badge variant="outline" className="text-xs font-normal">{contributionTag((author as any)?.contributionScore)}</Badge>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">{createdAt}</div>
            </div>
            <div className="mt-3 pl-11">
                {isReview ? (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">Đánh giá tour:</span>
                        <a className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1" href={(data.tour as any)?._id ? `/experience/${(data.tour as any)._id}` : '#'} target={(data.tour as any)?._id ? "_blank" : undefined} rel="noreferrer">
                            {(data.tour as any)?.title || 'Unknown Tour'}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">Bài viết</span>
                        {(data.destination as any)?.name && (
                            <>
                                <span className="text-xs text-muted-foreground">• tại</span>
                                <a className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1" href={(data.destination as any)?.slug ? `/destinations/${(data.destination as any).slug}` : '#'} target={(data.destination as any)?.slug ? "_blank" : undefined} rel="noreferrer">
                                    {(data.destination as any)?.name}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </>
                        )}
                    </div>
                )}

                <div className="bg-muted/30 p-3 rounded-md">
                    {isReview ? (
                        <div>
                            <div className="flex items-center gap-1 text-yellow-500 mb-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < (data as IReview).rating ? 'fill-yellow-400' : 'opacity-20'}`} />
                                ))}
                            </div>
                            <p className="text-sm whitespace-pre-line">{(data as IReview).comment}</p>
                        </div>
                    ) : (
                        <div>
                            <div className="font-semibold text-base mb-1">{(data as IStory).title}</div>
                            <ExpandableText text={(data as IStory).content} />

                            {/* Show associated images/tags if any */}
                            {(data as IStory).tags && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {(data as IStory).tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
                {(data.status as string) !== 'approved' && (data.status as string) !== 'published' && (
                    <>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={onApprove}>
                            <Check className="w-3 h-3 mr-1" /> Duyệt
                        </Button>
                        <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 h-8" onClick={onEditApprove}>
                            <Pencil className="w-3 h-3 mr-1" /> Sửa
                        </Button>
                    </>
                )}

                {(data.status as string) !== 'rejected' && (data.status as string) !== 'archived' && (
                    <Button size="sm" variant="destructive" className="h-8" onClick={onReject}>
                        <X className="w-3 h-3 mr-1" /> Từ chối
                    </Button>
                )}
            </div>
        </Card>
    );
}

function ExpandableText({ text, max = 220 }: { text: string; max?: number }) {
    const [expanded, setExpanded] = useState(false);
    const isLong = text.length > max;
    const preview = isLong ? text.slice(0, max) + '…' : text;
    return (
        <div className="text-sm text-foreground/90">
            <p className="whitespace-pre-line">{expanded ? text : preview}</p>
            {isLong && (
                <button className="text-primary text-xs font-medium mt-1 hover:underline" onClick={() => setExpanded(!expanded)}>
                    {expanded ? 'Thu gọn' : 'Xem thêm'}
                </button>
            )}
        </div>
    );
}

const ModerationPage: React.FC = () => {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const [tab, setTab] = useState<'reviews' | 'stories'>('reviews');
    // FIXED: Default status is now 'pending' to focus on action items
    const [status, setStatus] = useState<string>('pending');
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [selectAll, setSelectAll] = useState(false);

    // Reject Modal State
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectIds, setRejectIds] = useState<string[]>([]);
    const [rejectReason, setRejectReason] = useState<string>('Spam/Quảng cáo');
    const [rejectNote, setRejectNote] = useState<string>('');
    const [notify, setNotify] = useState(true);

    // Edit Modal State
    const [editOpen, setEditOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Fetch Data
    // Fetch Data
    const { data: reviewResponse, isLoading: isLoadingReviews } = useQuery({
        queryKey: ['admin', 'reviews', status],
        queryFn: () => apiClient.get<ModerationItem[]>(`/admin/reviews?status=${status}&page=1&limit=50`),
    });

    const { data: storyResponse, isLoading: isLoadingStories } = useQuery({
        queryKey: ['admin', 'stories', status],
        queryFn: () => apiClient.get<ModerationItem[]>(`/admin/stories?status=${status}&page=1&limit=50`),
    });

    // FIXED: Correctly access data from the response body. 
    // apiClient returns the body, which matches { success, data, total }.
    // So 'reviewResponse' IS the body. 'reviewResponse.data' Is the array.
    // The previous code 'reviewResponse?.data?.data' was incorrect.
    const reviewData = reviewResponse?.data || [];
    const storyData = storyResponse?.data || [];

    const items = (tab === 'reviews' ? reviewData : storyData);
    // Use 'any' cast to access 'total' because standard ApiResponse interface might not include it explicitly if T is just the array
    const totalItems = (tab === 'reviews' ? (reviewResponse as any)?.total : (storyResponse as any)?.total) || 0;

    function toggleAll(v: boolean) {
        setSelectAll(v);
        const next: Record<string, boolean> = {};
        (items as any[]).forEach((it: any) => next[it._id] = v);
        setSelected(next);
    }

    function toggleOne(id: string, v: boolean) {
        setSelected((s) => ({ ...s, [id]: v }));
    }

    const approveMutation = useMutation({
        mutationFn: async (ids: string[]) => {
            const path = tab === 'reviews' ? '/admin/reviews/bulk-update' : '/admin/stories/bulk-update';
            await apiClient.put(path, { action: 'approve', ids });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin'] });
            setSelected({});
            setSelectAll(false);
            toast.success('Đã duyệt thành công');
        },
        onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
    });

    const rejectMutation = useMutation({
        mutationFn: async (payload: { ids: string[]; reason?: string; notify?: boolean }) => {
            const path = tab === 'reviews' ? '/admin/reviews/bulk-update' : '/admin/stories/bulk-update';
            await apiClient.put(path, { action: 'reject', ids: payload.ids, reason: payload.reason, notify: payload.notify });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin'] });
            setSelected({});
            setSelectAll(false);
            setRejectOpen(false);
            toast.success('Đã từ chối thành công');
        },
        onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
    });

    const editApproveMutation = useMutation({
        mutationFn: async (payload: { id: string; content: string }) => {
            const path = tab === 'reviews' ? `/admin/reviews/${payload.id}` : `/admin/stories/${payload.id}`;
            await apiClient.put(path, { content: payload.content, action: 'approve' });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin'] });
            setEditOpen(false);
            setEditContent('');
            setEditId(null);
            toast.success('Đã sửa và duyệt thành công');
        },
        onError: (err: any) => toast.error(`Lỗi: ${err.message}`)
    });

    const allSelectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kiểm duyệt Nội dung</h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý chất lượng bài viết và đánh giá từ cộng đồng
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-card p-2 rounded-lg border shadow-sm">
                    <span className="text-sm font-medium px-2">Bộ lọc:</span>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                    Chờ duyệt
                                </div>
                            </SelectItem>
                            <SelectItem value="approved">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Đã duyệt
                                </div>
                            </SelectItem>
                            <SelectItem value="rejected">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500" />
                                    Đã từ chối
                                </div>
                            </SelectItem>
                            <SelectItem value="all">Tất cả</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSelected({}); setSelectAll(false); }} className="w-full">
                <TabsList className="w-full justify-start h-12 bg-background border rounded-lg p-1 mb-6">
                    <TabsTrigger value="reviews" className="flex-1 max-w-[200px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        Đánh giá ({(reviewResponse as any)?.total || 0})
                    </TabsTrigger>
                    <TabsTrigger value="stories" className="flex-1 max-w-[200px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        Bài viết ({(storyResponse as any)?.total || 0})
                    </TabsTrigger>
                </TabsList>

                <div className="flex items-center justify-between mb-4 bg-muted/50 p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="select-all"
                            checked={selectAll}
                            onCheckedChange={(v) => toggleAll(!!v)}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            Chọn tất cả ({allSelectedIds.length})
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => approveMutation.mutate(allSelectedIds)}
                            disabled={!allSelectedIds.length}
                        >
                            <Check className="w-4 h-4 mr-1" /> Duyệt ({allSelectedIds.length})
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => { setRejectIds(allSelectedIds); setRejectOpen(true); }}
                            disabled={!allSelectedIds.length}
                        >
                            <X className="w-4 h-4 mr-1" /> Từ chối ({allSelectedIds.length})
                        </Button>
                    </div>
                </div>

                <TabsContent value="reviews" className="mt-0">
                    {isLoadingReviews ? (
                        <div className="text-center py-12">Đang tải dữ liệu...</div>
                    ) : (
                        <>
                            {reviewData.length === 0 ? (
                                <div className="text-center py-16 bg-card border rounded-xl border-dashed">
                                    <Check className="w-12 h-12 mx-auto text-emerald-500 mb-4 bg-emerald-100 p-2 rounded-full" />
                                    <h3 className="text-lg font-medium">Không có đánh giá nào</h3>
                                    <p className="text-muted-foreground text-sm mt-1">Tuyệt vời! Bạn đã xử lý hết các đánh giá {status === 'pending' ? 'chờ duyệt' : ''}.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reviewData.map((it: any) => (
                                        <ModerationCard
                                            key={it._id}
                                            data={{ ...it, kind: 'review' } as any}
                                            selected={!!selected[it._id]}
                                            onSelect={(v) => toggleOne(it._id, v)}
                                            onApprove={() => approveMutation.mutate([it._id])}
                                            onEditApprove={() => { setEditId(it._id); setEditContent(it.comment || ''); setEditOpen(true); }}
                                            onReject={() => { setRejectIds([it._id]); setRejectOpen(true); }}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="stories" className="mt-0">
                    {isLoadingStories ? (
                        <div className="text-center py-12">Đang tải dữ liệu...</div>
                    ) : (
                        <>
                            {storyData.length === 0 ? (
                                <div className="text-center py-16 bg-card border rounded-xl border-dashed">
                                    <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-medium">Không có bài viết nào</h3>
                                    <p className="text-muted-foreground text-sm mt-1">Danh sách bài viết {status === 'pending' ? 'chờ duyệt' : ''} đang trống.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {storyData.map((it: any) => (
                                        <ModerationCard
                                            key={it._id}
                                            data={{ ...it, kind: 'story' } as any}
                                            selected={!!selected[it._id]}
                                            onSelect={(v) => toggleOne(it._id, v)}
                                            onApprove={() => approveMutation.mutate([it._id])}
                                            onEditApprove={() => { setEditId(it._id); setEditContent(it.content || ''); setEditOpen(true); }}
                                            onReject={() => { setRejectIds([it._id]); setRejectOpen(true); }}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Reject Modal */}
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Từ chối nội dung</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lý do từ chối</label>
                            <Select value={rejectReason} onValueChange={setRejectReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lý do" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Spam/Quảng cáo">Spam / Quảng cáo</SelectItem>
                                    <SelectItem value="Ngôn từ không phù hợp">Ngôn từ không phù hợp / Thô tục</SelectItem>
                                    <SelectItem value="Nọi dung sai lệch">Nội dung sai lệch / Fake News</SelectItem>
                                    <SelectItem value="Vi phạm bản quyền">Vi phạm bản quyền hình ảnh</SelectItem>
                                    <SelectItem value="Chất lượng thấp">Chất lượng quá thấp</SelectItem>
                                    <SelectItem value="Khác">Lý do khác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ghi chú (Tùy chọn)</label>
                            <Textarea
                                placeholder="Nhập thêm chi tiết cho người dùng..."
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="notify"
                                checked={notify}
                                onCheckedChange={(v) => setNotify(!!v)}
                            />
                            <label htmlFor="notify" className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Gửi email thông báo cho người dùng
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectOpen(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={() => rejectMutation.mutate({ ids: rejectIds, reason: rejectReason + (rejectNote ? ` - ${rejectNote}` : ''), notify })}>
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa & Duyệt ngay</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nội dung</label>
                            <Textarea
                                className="min-h-[300px] font-sans"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Hủy</Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => editId && editApproveMutation.mutate({ id: editId, content: editContent })}>
                            <Check className="w-4 h-4 mr-2" />
                            Lưu thay đổi & Duyệt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ModerationPage;
