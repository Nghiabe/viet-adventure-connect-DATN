import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AddDestinationModal from '@/components/dashboard/destinations/AddDestinationModal';

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as any;
}

export default function DestinationsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  // State management for the modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [q, setQ] = useState('');
  
  const qs = useMemo(()=> { const p = new URLSearchParams(); if (q) p.set('search', q); p.set('page','1'); p.set('limit','50'); return p.toString(); }, [q]);
  const { data } = useQuery({ queryKey: ['admin','destinations',qs], queryFn: ()=> api<{ success:boolean; data:any }>(`/api/admin/destinations?${qs}`) });
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
      // Automatically refresh the destination list
      queryClient.invalidateQueries({ queryKey: ['admin', 'destinations'] });
      setIsCreateModalOpen(false);
    },
    
    onError: (error: any) => {
      const errorMessage = error.message || t('toasts.generic_error');
      toast.error(errorMessage);
    }
  });
  
  // Handler for creating destinations
  const handleCreateDestination = (formData: any) => {
    createDestinationMutation.mutate(formData);
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
            onChange={(e)=> setQ(e.target.value)} 
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
            {rows.map((r:any)=> (
              <tr key={r._id} className="border-b">
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    {r.mainImage ? (<img src={r.mainImage} alt={r.name} className="w-[60px] h-[40px] object-cover rounded" />) : (<div className="w-[60px] h-[40px] bg-muted rounded" />)}
                    <div className="font-medium">{r.name}</div>
                  </div>
                </td>
                <td className="py-2 px-3 font-mono">{r.slug}</td>
                <td className="py-2 px-3">{r.tourCount||0}</td>
                <td className="py-2 px-3">{r.totalBookings||0}</td>
                <td className="py-2 px-3">{new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(r.totalRevenue||0)}</td>
                <td className="py-2 px-3">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''}</td>
                <td className="py-2 px-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild><a href={`/destinations/${r.slug}`} target="_blank" rel="noreferrer">{t('admin_destinations.actions.view')}</a></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={`/dashboard/destinations/edit/${r._id}`}>{t('admin_destinations.actions.edit')}</a></DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">{t('admin_destinations.actions.delete')}</DropdownMenuItem>
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


