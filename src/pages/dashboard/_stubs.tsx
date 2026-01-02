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
import { Check, Pencil, X, Star, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { IReview, IStory, IUser, ITour, IDestination } from '@/types/models';

// Temporary stub pages for other routes we referenced in the layout
export const UsersPage: React.FC = () => { return (<div className="p-6">Users management (coming soon)</div>); };
export const ToursPage: React.FC = () => { return (<div className="p-6">Tours management (coming soon)</div>); };
export const MyToursPage: React.FC = () => { return (<div className="p-6">My Tours (coming soon)</div>); };
export const MyBookingsPage: React.FC = () => { return (<div className="p-6">My Bookings (coming soon)</div>); };
export const MyReviewsPage: React.FC = () => { return (<div className="p-6">My Reviews (coming soon)</div>); };
export const BookingsPage: React.FC = () => { return (<div className="p-6">Bookings (coming soon)</div>); };
export const DestinationsPage: React.FC = () => { return (<div className="p-6">Destinations (coming soon)</div>); };
export const MarketingPage: React.FC = () => { return (<div className="p-6">Marketing (Coupons, Banners) (coming soon)</div>); };
export const AnalyticsPage: React.FC = () => { return (<div className="p-6">Analytics (coming soon)</div>); };
export const SettingsPage: React.FC = () => { return (<div className="p-6">Settings (Permissions, Payments) (coming soon)</div>); };

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
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Checkbox checked={selected} onCheckedChange={(v) => onSelect(!!v)} />
        <Avatar className="h-8 w-8">
          <AvatarImage src={author?.avatar || ''} />
          <AvatarFallback>{author?.name?.[0] || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
          <div className="font-medium">{author?.name || 'Người dùng ẩn'}</div>
          <Badge variant="secondary">{contributionTag((author as any)?.contributionScore)}</Badge>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">{createdAt}</div>
      </div>
      <div className="mt-3">
        {isReview ? (
          <div className="flex items-start gap-2">
            <a className="text-sm text-primary inline-flex items-center gap-1" href={(data.tour as any)?._id ? `/experience/${(data.tour as any)._id}` : '#'} target={(data.tour as any)?._id ? "_blank" : undefined} rel="noreferrer">
              Tour: {(data.tour as any)?.title || 'Unknown Tour'}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <a className="text-sm text-primary inline-flex items-center gap-1" href={(data.destination as any)?.slug ? `/destinations/${(data.destination as any).slug}` : '#'} target={(data.destination as any)?.slug ? "_blank" : undefined} rel="noreferrer">
              Địa điểm: {(data.destination as any)?.name || '—'}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        <div className="mt-2 space-y-2">
          {isReview ? (
            <div>
              <div className="flex items-center gap-1 text-yellow-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < (data as IReview).rating ? 'fill-yellow-400' : 'opacity-20'}`} />
                ))}
              </div>
              <p className="text-sm mt-1 whitespace-pre-line">{(data as IReview).comment}</p>
            </div>
          ) : (
            <div>
              <div className="font-semibold">{(data as IStory).title}</div>
              <ExpandableText text={(data as IStory).content} />
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        { /* Type assertion needed because IReview has 'approved'/'pending'/'rejected' and IStory has 'published'/'draft'/'archived'/'pending' */}
        { /* We check all potential status strings safely by treating status as string */}

        {(data.status as string) !== 'approved' && (data.status as string) !== 'published' && (
          <>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onApprove}>
              <Check className="w-4 h-4 mr-1" /> Duyệt
            </Button>
            <Button size="sm" variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700" onClick={onEditApprove}>
              <Pencil className="w-4 h-4 mr-1" /> Sửa & Duyệt
            </Button>
          </>
        )}

        {(data.status as string) !== 'rejected' && (data.status as string) !== 'archived' && (
          <Button size="sm" variant="destructive" onClick={onReject}>
            <X className="w-4 h-4 mr-1" /> Từ chối
          </Button>
        )}

        {((data.status as string) === 'approved' || (data.status as string) === 'published') && (
          <span className="text-sm text-emerald-600 font-medium flex items-center">
            <Check className="w-4 h-4 mr-1" /> Đã duyệt
          </span>
        )}

        {((data.status as string) === 'rejected' || (data.status as string) === 'archived') && (
          <span className="text-sm text-red-600 font-medium flex items-center">
            <X className="w-4 h-4 mr-1" /> Đã từ chối
          </span>
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
    <div className="text-sm text-muted-foreground">
      <p className="whitespace-pre-line">{expanded ? text : preview}</p>
      {isLong && (
        <button className="text-primary mt-1" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as any;
}

export const ModerationPage: React.FC = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'reviews' | 'stories'>('reviews');
  const [status, setStatus] = useState<string>('approved'); // Default status changed to 'approved'
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectIds, setRejectIds] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState<string>('Spam/Advertising');
  const [rejectNote, setRejectNote] = useState<string>('');
  const [notify, setNotify] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data: reviewResponse } = useQuery({
    queryKey: ['admin', 'reviews', status], // Include status in queryKey
    queryFn: () => api<{ success: boolean; data: ModerationItem[]; total: number }>(`/api/admin/reviews?status=${status}&page=1&limit=20`),
  });
  const { data: storyResponse } = useQuery({
    queryKey: ['admin', 'stories', status], // Include status in queryKey
    queryFn: () => api<{ success: boolean; data: ModerationItem[]; total: number }>(`/api/admin/stories?status=${status}&page=1&limit=20`),
  });

  const reviewData = reviewResponse?.data || [];
  const storyData = storyResponse?.data || [];

  const items = (tab === 'reviews' ? reviewData : storyData);
  const counts = {
    reviews: reviewResponse?.total || reviewData.length,
    stories: storyResponse?.total || storyData.length,
  };

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
      // ... existing mutation logic
      const path = tab === 'reviews' ? '/api/admin/reviews/bulk-update' : '/api/admin/stories/bulk-update';
      await api(path, { method: 'PUT', body: JSON.stringify({ action: 'approve', ids }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); setSelected({}); setSelectAll(false); }
  });

  const rejectMutation = useMutation({
    mutationFn: async (payload: { ids: string[]; reason?: string; notify?: boolean }) => {
      const path = tab === 'reviews' ? '/api/admin/reviews/bulk-update' : '/api/admin/stories/bulk-update';
      await api(path, { method: 'PUT', body: JSON.stringify({ action: 'reject', ids: payload.ids, reason: payload.reason, notify: payload.notify }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); setSelected({}); setSelectAll(false); setRejectOpen(false); }
  });

  const editApproveMutation = useMutation({
    mutationFn: async (payload: { id: string; content: string }) => {
      const path = tab === 'reviews' ? `/api/admin/reviews/${payload.id}` : `/api/admin/stories/${payload.id}`;
      await api(path, { method: 'PUT', body: JSON.stringify({ content: payload.content, action: 'approve' }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); setEditOpen(false); setEditContent(''); setEditId(null); }
  });

  const allSelectedIds = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{t('admin_moderation.title', 'Kiểm duyệt')}</div>
          <div className="text-sm text-muted-foreground">{t('admin_moderation.subtitle', 'Người gác cổng Chất lượng')}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t('common.status', 'Trạng thái')}:</span>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('common.status', 'Trạng thái')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Đã từ chối</SelectItem>
              <SelectItem value="all">Tất cả</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          <TabsTrigger value="stories">Bài viết</TabsTrigger>
        </TabsList>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox checked={selectAll} onCheckedChange={(v) => toggleAll(!!v)} />
            <span className="text-sm">{t('admin_moderation.select_all', 'Chọn tất cả')}</span>
          </div>
          <Button size="sm" onClick={() => approveMutation.mutate(allSelectedIds)} disabled={!allSelectedIds.length}>{t('admin_moderation.approve_selected', 'Duyệt mục đã chọn')}</Button>
          <Button size="sm" variant="destructive" onClick={() => { setRejectIds(allSelectedIds); setRejectOpen(true); }} disabled={!allSelectedIds.length}>{t('admin_moderation.reject_selected', 'Từ chối mục đã chọn')}</Button>
        </div>

        <TabsContent value="reviews">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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
        </TabsContent>
        <TabsContent value="stories">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
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
        </TabsContent>
      </Tabs>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{t('admin_moderation.buttons.reject', 'Từ chối')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-sm mb-1">{t('common.reason', 'Lý do')}</div>
              <Select value={rejectReason} onValueChange={setRejectReason}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select_reason', 'Chọn lý do')} />
                </SelectTrigger>
                <SelectContent>
                  {['Spam/Quảng cáo', 'Ngôn từ không phù hợp', 'Không liên quan du lịch', 'Chất lượng thấp'].map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm mb-1">{t('common.notes_optional', 'Ghi chú thêm (không bắt buộc)')}</div>
              <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={4} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={notify} onCheckedChange={(v) => setNotify(!!v)} /> {t('common.notify_user_email', 'Thông báo người dùng qua email')}
            </label>
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={() => rejectMutation.mutate({ ids: rejectIds, reason: rejectReason + (rejectNote ? ` - ${rejectNote}` : ''), notify })}>{t('common.confirm', 'Xác nhận')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa & Duyệt</DialogTitle>
          </DialogHeader>
          <div>
            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={12} />
          </div>
          <DialogFooter>
            <Button onClick={() => editId && editApproveMutation.mutate({ id: editId, content: editContent })}>Lưu & Duyệt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


