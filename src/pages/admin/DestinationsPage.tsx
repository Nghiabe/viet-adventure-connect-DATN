import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash, Eye, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AddDestinationModal from '@/components/dashboard/destinations/AddDestinationModal';

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as any;
}

export default function DestinationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // State management for the modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [q, setQ] = useState('');

  const qs = useMemo(() => { const p = new URLSearchParams(); if (q) p.set('search', q); p.set('page', '1'); p.set('limit', '50'); return p.toString(); }, [q]);
  const { data } = useQuery({ queryKey: ['admin', 'destinations', qs], queryFn: () => api<{ success: boolean; data: any }>(`/api/admin/destinations?${qs}`) });
  const rows = data?.data?.rows || [];

  // Mutation for creating destinations
  const createDestinationMutation = useMutation({
    mutationFn: (newDestinationData: any) =>
      api<{ success: boolean; data: any }>('/api/admin/destinations', {
        method: 'POST',
        body: JSON.stringify(newDestinationData)
      }),

    onSuccess: () => {
      toast.success(t('toasts.create_success'));
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] });
      setIsCreateModalOpen(false);
    },

    onError: (error: any) => {
      toast.error(error.message || t('toasts.generic_error'));
    }
  });

  // Mutation for deleting destinations
  const deleteDestinationMutation = useMutation({
    mutationFn: (id: string) =>
      api<{ success: boolean; data: any }>(`/api/admin/destinations/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success(t('toasts.delete_success') || 'Xóa thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Không thể xóa điểm đến này (có thể đang có Tour sử dụng).');
    }
  });

  // Handler for creating
  const handleCreateDestination = (formData: any) => {
    createDestinationMutation.mutate(formData);
  };

  // Handler for deleting
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa điểm đến "${name}"? Hành động này không thể hoàn tác.`)) {
      deleteDestinationMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{t('admin_destinations.title')}</div>
          <div className="text-sm text-muted-foreground">{t('admin_destinations.subtitle')}</div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={t('admin_destinations.search_placeholder')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => setIsCreateModalOpen(true)}>
            {t('admin_destinations.add_new_button')}
          </Button>
        </div>
      </div>
      <div className="w-full overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">{t('admin_destinations.table_headers.destination')}</th>
              <th className="py-2 px-3">{t('admin_destinations.table_headers.slug')}</th>
              <th className="py-2 px-3">{t('admin_destinations.table_headers.tour_count')}</th>
              <th className="py-2 px-3">{t('admin_destinations.table_headers.total_bookings')}</th>
              <th className="py-2 px-3">{t('admin_destinations.table_headers.total_revenue')}</th>
              <th className="py-2 px-3">{t('admin_destinations.table_headers.last_updated')}</th>
              <th className="py-2 px-3">{t('admin_destinations.table_headers.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r._id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    {r.mainImage ? (<img src={r.mainImage} alt={r.name} className="w-[60px] h-[40px] object-cover rounded shadow-sm" />) : (<div className="w-[60px] h-[40px] bg-muted rounded" />)}
                    <div className="font-medium">{r.name}</div>
                  </div>
                </td>
                <td className="py-2 px-3 font-mono text-muted-foreground">{r.slug}</td>
                <td className="py-2 px-3">{r.tourCount || 0}</td>
                <td className="py-2 px-3">{r.totalBookings || 0}</td>
                <td className="py-2 px-3">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.totalRevenue || 0)}</td>
                <td className="py-2 px-3">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''}</td>
                <td className="py-2 px-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a href={`/destinations/${r.slug}`} target="_blank" rel="noreferrer" className="flex items-center cursor-pointer">
                          <Eye className="w-4 h-4 mr-2" />
                          {t('admin_destinations.actions.view')}
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/dashboard/destinations/edit/${r._id}`} className="flex items-center cursor-pointer">
                          <Pencil className="w-4 h-4 mr-2" />
                          {t('admin_destinations.actions.edit')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer flex items-center"
                        onClick={() => handleDelete(r._id, r.name)}
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        {t('admin_destinations.actions.delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Destination Modal */}
      <AddDestinationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateDestination}
        isLoading={createDestinationMutation.isPending}
      />
    </div>
  );
}


