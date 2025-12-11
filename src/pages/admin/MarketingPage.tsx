import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AddCouponModal } from '@/components/dashboard/marketing/AddCouponModal';
import { AddBannerModal } from '@/components/dashboard/marketing/AddBannerModal';
import ReferralsPage from './marketing/ReferralsPage';

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as any;
}

function CouponsTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin','coupons'], queryFn: ()=> api<{ success:boolean; data:any[] }>(`/api/admin/coupons`) });
  const [open, setOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  
  const couponMutation = useMutation({
    mutationFn: async ({ formData, couponId }: { formData: any, couponId?: string }) => {
      if (couponId) {
        // Update existing coupon
        return await api(`/api/admin/coupons/${couponId}`, { method: 'PUT', body: JSON.stringify(formData) });
      } else {
        // Create new coupon
        return await api(`/api/admin/coupons`, { method: 'POST', body: JSON.stringify(formData) });
      }
    },
    onSuccess: () => { 
      setOpen(false); 
      setEditingCoupon(null);
      qc.invalidateQueries({ queryKey: ['admin','coupons'] }); 
    }
  });

  const handleAddNew = () => {
    setEditingCoupon(null);
    setOpen(true);
  };

  const handleEdit = (coupon: any) => {
    setEditingCoupon(coupon);
    setOpen(true);
  };

  const handleSubmit = (formData: any, couponId?: string) => {
    couponMutation.mutate({ formData, couponId });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{t('admin_marketing.coupons.title')}</div>
        <Button onClick={handleAddNew}>{t('admin_marketing.coupons.create_new')}</Button>
      </div>
      
      <div className="w-full overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">{t('admin_marketing.coupons.code')}</th>
              <th className="py-2 px-3">{t('admin_marketing.coupons.type')}</th>
              <th className="py-2 px-3">{t('admin_marketing.coupons.value')}</th>
              <th className="py-2 px-3">{t('admin_marketing.coupons.usage')}</th>
              <th className="py-2 px-3">{t('admin_marketing.coupons.status')}</th>
              <th className="py-2 px-3">{t('admin_marketing.coupons.expires_at')}</th>
              <th className="py-2 px-3" />
            </tr>
          </thead>
          <tbody>
            {(data?.data||[]).map((r:any)=> (
              <tr key={r._id} className="border-b">
                <td className="py-2 px-3 font-mono">{r.code}</td>
                <td className="py-2 px-3">{r.discountType}</td>
                <td className="py-2 px-3">{r.discountValue}</td>
                <td className="py-2 px-3">{r.usedCount} / {r.limits?.totalUses||'∞'}</td>
                <td className="py-2 px-3">{r.isActive ? t('admin_marketing.coupons.active') : t('admin_marketing.coupons.inactive')}</td>
                <td className="py-2 px-3">{r.endDate ? new Date(r.endDate).toLocaleDateString() : '—'}</td>
                <td className="py-2 px-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEdit(r)}
                  >
                    {t('admin_marketing.coupons.edit')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddCouponModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleSubmit}
        isLoading={couponMutation.isPending}
        existingCoupon={editingCoupon}
      />
    </div>
  );
}

function BannersTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin','banners'], queryFn: ()=> api<{ success:boolean; data:any[] }>(`/api/admin/banners`) });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const rows = data?.data || [];

  const createBannerMutation = useMutation({
    mutationFn: async (newBannerData: any) => {
      return await api(`/api/admin/banners`, { method: 'POST', body: JSON.stringify(newBannerData) });
    },
    onSuccess: () => {
      // CRITICAL: This automatically and efficiently refetches the banner list
      qc.invalidateQueries({ queryKey: ['admin','banners'] });
      setIsCreateModalOpen(false); // Close the modal on success
    },
    onError: (error: any) => {
      console.error('Failed to create banner:', error);
      // You can add toast notification here if you have a toast system
    }
  });

  const handleCreateBanner = (formData: any) => {
    createBannerMutation.mutate(formData);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">{t('admin_marketing.banners.title')}</div>
        <Button onClick={() => setIsCreateModalOpen(true)}>{t('admin_marketing.banners.add_new')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((b:any)=> (
          <Card key={b._id} className="p-3 flex items-center gap-3">
            <img src={b.imageUrl} alt={b.title||''} className="w-28 h-16 object-cover rounded" />
            <div className="flex-1">
              <div className="font-medium">{b.title || '—'}</div>
              <div className="text-xs text-muted-foreground">{b.subtitle || ''}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">{b.isActive ? t('admin_marketing.coupons.active') : t('admin_marketing.coupons.inactive')}</span>
            </div>
          </Card>
        ))}
      </div>

      <AddBannerModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateBanner}
        isLoading={createBannerMutation.isPending}
      />
    </div>
  );
}

function CollectionsTab() {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ['admin','collections'], queryFn: ()=> api<{ success:boolean; data:any[] }>(`/api/admin/collections`) });
  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold">{t('admin_marketing.collections.title')}</div>
      <div className="w-full overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-3">{t('admin_marketing.collections.name')}</th>
              <th className="py-2 px-3">{t('admin_marketing.collections.description')}</th>
              <th className="py-2 px-3">{t('admin_marketing.collections.tour_count')}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.data||[]).map((r:any)=> (
              <tr key={r._id} className="border-b">
                <td className="py-2 px-3">{r.name}</td>
                <td className="py-2 px-3">{r.description||''}</td>
                <td className="py-2 px-3">{(r.tours||[]).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



export default function MarketingPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'promotions'|'storefront'|'referrals'>('promotions');
  return (
    <div className="p-6 space-y-4">
      <div className="text-2xl font-semibold">{t('admin_marketing.title')}</div>
      <Tabs value={tab} onValueChange={(v)=> setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="promotions">{t('admin_marketing.tabs.promotions')}</TabsTrigger>
          <TabsTrigger value="storefront">{t('admin_marketing.tabs.storefront')}</TabsTrigger>
          <TabsTrigger value="referrals">{t('admin_marketing.tabs.referrals')}</TabsTrigger>
        </TabsList>
        <TabsContent value="promotions"><CouponsTab /></TabsContent>
        <TabsContent value="storefront"><BannersTab /></TabsContent>
        <TabsContent value="referrals"><ReferralsPage /></TabsContent>
      </Tabs>
    </div>
  );
}


