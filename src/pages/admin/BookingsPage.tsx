import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IBooking } from '@/types/models';
import { useTranslation } from 'react-i18next';
import { formatCurrencyVND, formatDate } from '@/utils/format';
import { translateStatus } from '@/utils/translation';


async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as any;
}

const statusColor: Record<string, { className: string }> = {
  pending: { className: 'bg-yellow-100 text-yellow-800' },
  confirmed: { className: 'bg-emerald-100 text-emerald-800' },
  cancelled: { className: 'bg-red-100 text-red-800' },
  completed: { className: 'bg-gray-100 text-gray-800' },
  refunded: { className: 'bg-blue-100 text-blue-800' },
};

export default function BookingsPage() {
  const qc = useQueryClient();
  const { t } = useTranslation();

  // Consolidated filter state - single source of truth
  const [filters, setFilters] = useState({
    search: '',
    status: 'all', // 'all' represents no filter
    page: 1,
    limit: 50
  });


  // Unified filter change handler
  const handleFilterChange = (filterName: string, value: string | number) => {
    setFilters((prevFilters: any) => ({
      ...prevFilters,
      [filterName]: value,
      // Reset page to 1 on any filter change except pagination itself
      page: filterName !== 'page' ? 1 : value,
    }));
  };

  // Construct query parameters from the filters state
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({
      page: filters.page.toString(),
      limit: filters.limit.toString(),
    });

    if (filters.search) params.set('q', filters.search);
    if (filters.status !== 'all') params.set('status', filters.status);

    return params.toString();
  }, [filters]);

  const { data, isLoading, isError, error } = useQuery({
    // CRITICAL: The entire filters object is now a dependency
    queryKey: ['adminBookings', filters],
    queryFn: async () => {
      const response = await api<{ success: boolean; data: any[]; total: number }>(`/api/admin/bookings?${queryParams}`);
      if (!response.success) {
        throw new Error('Failed to fetch bookings');
      }
      return response;
    },
    placeholderData: (prev) => prev, // UX improvement to prevent UI flashing during pagination
  });

  const rows = (data?.data || []) as any[];

  const statusMutation = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => {
      await api(`/api/admin/bookings/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: next }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['adminBookings'] })
  });

  function exportCsv() {
    const header = [t('admin_bookings.columns.booking_id'), t('admin_bookings.columns.status'), t('admin_bookings.columns.tour'), t('admin_bookings.columns.customer'), t('common.email'), t('admin_bookings.columns.tour_date'), t('admin_bookings.columns.booking_date'), t('admin_bookings.columns.total_price')];
    const lines = rows.map((r) => [
      r._id,
      r.status,
      r.tour?.title || r.tourInfo?.title || '',
      r.user?.name || '',
      r.user?.email || '',
      r.bookingDate ? new Date(r.bookingDate).toISOString().slice(0, 10) : '',
      r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
      String(r.totalPrice || 0),
    ].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'bookings.csv'; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{t('admin_bookings.title')}</div>
          <div className="text-sm text-muted-foreground">{t('admin_bookings.subtitle')}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t('admin_bookings.search_placeholder')}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-64"
        />
        <Select onValueChange={(v) => handleFilterChange('status', v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder={t('admin_bookings.status_filter_label')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all_statuses')}</SelectItem>
            {['pending', 'confirmed', 'completed', 'cancelled', 'refunded'].map(s => (
              <SelectItem key={s} value={s}>{translateStatus(s, t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}>{t('admin_bookings.export_csv')}</Button>
      </div>

      <div className="w-full overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">{t('admin_bookings.columns.booking_id')}</th>
              <th className="py-2 px-3">{t('admin_bookings.columns.status')}</th>
              <th className="py-2 px-3">{t('admin_bookings.columns.tour')}</th>
              <th className="py-2 px-3">{t('admin_bookings.columns.customer')}</th>
              <th className="py-2 px-3">{t('admin_bookings.columns.tour_date')}</th>
              <th className="py-2 px-3">{t('admin_bookings.columns.booking_date')}</th>
              <th className="py-2 px-3">{t('admin_bookings.columns.total_price')}</th>
              <th className="py-2 px-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-b hover:bg-muted/30">
                <td className="py-2 px-3 font-mono">#BK-{String(r._id).slice(-6)}</td>
                <td className="py-2 px-3"><span className={`px-2 py-1 rounded-full text-xs ${statusColor[r.status]?.className || ''}`}>{translateStatus(r.status, t)}</span></td>
                <td className="py-2 px-3">
                  <div className="font-medium">{r.tour?.title || r.tourInfo?.title}</div>
                  <div className="text-xs text-muted-foreground">by {r.owner?.name || r.tour?.owner?.name || '—'}</div>
                </td>
                <td className="py-2 px-3">
                  <div className="font-medium">{r.user?.name}</div>
                  <div className="text-xs text-muted-foreground">{r.user?.email}</div>
                </td>
                <td className="py-2 px-3">{formatDate(r.bookingDate)}</td>
                <td className="py-2 px-3">{formatDate(r.createdAt)}</td>
                <td className="py-2 px-3">{formatCurrencyVND(r.totalPrice)}</td>
                <td className="py-2 px-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/dashboard/bookings/${r._id}`}>{t('admin_bookings.actions.view_details')}</a>
                      </DropdownMenuItem>
                      {r.status !== 'cancelled' && (
                        <DropdownMenuItem onClick={() => statusMutation.mutate({ id: r._id, next: 'cancelled' })}>{t('admin_bookings.actions.cancel_booking')}</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div >
  );
}


