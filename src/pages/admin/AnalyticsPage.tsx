import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/dashboard/ui/PageHeader';
import DateRangePicker from '@/components/ui/DateRangePicker';
import KpiCard from '@/components/dashboard/ui/KpiCard';
import CombinedRevenueChart from '@/components/dashboard/widgets/CombinedRevenueChart';

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers||{}) } });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as any;
}

function formatRangeQS(start: Date, end: Date) {
  const s = start.toISOString().slice(0,10);
  const e = end.toISOString().slice(0,10);
  return `startDate=${s}&endDate=${e}`;
}

function OverviewTab({ qs }: { qs: string }) {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ['analytics','overview',qs], queryFn: ()=> api<{ success:boolean; data:any }>(`/api/admin/analytics/overview?${qs}`) });
  const revAgg = data?.data?.revAgg || [];
  const chartData = revAgg.map((d:any)=> ({ month: d._id, revenue: d.revenue, bookings: d.bookings }));
  const kpi = data?.data?.kpis?.[0]?.[0] || { revenue: 0, bookings: 0 };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* KPI Cards - Full width on large screens */}
      <div className="lg:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          title={t('admin_analytics.overview.monthly_revenue')}
          value={new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(kpi.revenue||0)}
          subtitle="Tổng doanh thu trong khoảng thời gian đã chọn"
        />
        <KpiCard
          title={t('admin_analytics.overview.new_bookings')}
          value={kpi.bookings||0}
          subtitle="Số lượng đơn hàng mới trong kỳ"
        />
        <KpiCard
          title={t('admin_analytics.overview.new_users')}
          value={data?.data?.kpis?.[1] || 0}
          subtitle="Người dùng mới đăng ký trong kỳ"
        />
      </div>
      
      {/* Main Chart - Full width */}
      <div className="lg:col-span-12">
        <CombinedRevenueChart data={chartData} />
      </div>
    </div>
  );
}

function RevenueTab({ qs }: { qs: string }) {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ['analytics','revenue',qs], queryFn: ()=> api<{ success:boolean; data:any[] }>(`/api/admin/analytics/revenue?${qs}`) });
  const rows = data?.data || [];
  
  function exportCsv() {
    const header = [t('admin_analytics.revenue.table_headers.date'),t('admin_analytics.revenue.table_headers.total_revenue'),t('admin_analytics.revenue.table_headers.booking_fees'),t('admin_analytics.revenue.table_headers.refunds')];
    const lines = rows.map((r:any)=> [r._id, r.totalRevenue, r.bookingFees, r.refunds].join(','));
    const csv = [header.join(','), ...lines].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = 'revenue.csv'; a.click();
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          {t('admin_analytics.tabs.revenue')} - {t('admin_analytics.revenue.table_headers.date')}
        </h3>
        <Button variant="outline" onClick={exportCsv} className="shrink-0">
          {t('admin_analytics.revenue.export_csv')}
        </Button>
      </div>
      
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border/50">
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.revenue.table_headers.date')}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.revenue.table_headers.total_revenue')}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.revenue.table_headers.booking_fees')}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.revenue.table_headers.refunds')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r:any)=> (
                <tr key={r._id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-6">{r._id}</td>
                  <td className="py-4 px-6 font-medium">{new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(r.totalRevenue||0)}</td>
                  <td className="py-4 px-6">{new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(r.bookingFees||0)}</td>
                  <td className="py-4 px-6">{new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(r.refunds||0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ProductsTab({ qs }: { qs: string }) {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ['analytics','products',qs], queryFn: ()=> api<{ success:boolean; data:any[] }>(`/api/admin/analytics/product-performance?${qs}`) });
  const rows = data?.data || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          {t('admin_analytics.tabs.products')}
        </h3>
      </div>
      
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border/50">
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.products.table_headers.tour')}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.products.table_headers.page_views')}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.products.table_headers.bookings')}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.products.table_headers.conversion_rate')}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.products.table_headers.avg_rating')}</th>
                <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.products.table_headers.total_revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r:any)=> (
                <tr key={r.tourId} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-6 font-medium">{r.name}</td>
                  <td className="py-4 px-6">{r.pageViews?.toLocaleString() || 0}</td>
                  <td className="py-4 px-6">{r.bookings || 0}</td>
                  <td className="py-4 px-6">{r.conversionRate?.toFixed(2) || '0.00'}%</td>
                  <td className="py-4 px-6">{r.avgRating?.toFixed(1) || '0.0'}</td>
                  <td className="py-4 px-6 font-medium">{new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(r.totalRevenue||0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CustomersTab({ qs }: { qs: string }) {
  const { t } = useTranslation();
  const { data: vip } = useQuery({ queryKey: ['analytics','customers','vip',qs], queryFn: ()=> api<{ success:boolean; data:any[] }>(`/api/admin/analytics/customer-segments?segment=vip&${qs}`) });
  const { data: fresh } = useQuery({ queryKey: ['analytics','customers','new',qs], queryFn: ()=> api<{ success:boolean; data:any[] }>(`/api/admin/analytics/customer-segments?segment=new&${qs}`) });
  const { data: risk } = useQuery({ queryKey: ['analytics','customers','at_risk',qs], queryFn: ()=> api<{ success:boolean; data:any[] }>(`/api/admin/analytics/customer-segments?segment=at_risk&${qs}`) });
  function ExportTable({ rows, filename }: { rows:any[]; filename:string }) {
    function download() {
      const header = Object.keys(rows[0]||{});
      const lines = rows.map((r)=> header.map((k)=> JSON.stringify((r as any)[k] ?? '')).join(','));
      const csv = [header.join(','), ...lines].join('\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = filename; a.click();
    }
    return <Button variant="outline" onClick={download}>{t('admin_analytics.customers.export_list')}</Button>;
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          {t('admin_analytics.tabs.customers')}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-white">{t('admin_analytics.customers.vip_customers')}</h4>
              <ExportTable rows={vip?.data||[]} filename="vip.csv" />
            </div>
            <div className="space-y-3 max-h-80 overflow-auto">
              {(vip?.data||[]).map((r:any)=> (
                <div key={String(r._id)} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="font-medium">{r.user?.name || 'N/A'}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND'}).format(r.totalSpend||0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-white">{t('admin_analytics.customers.new_customers')}</h4>
              <ExportTable rows={fresh?.data||[]} filename="new_customers.csv" />
            </div>
            <div className="space-y-3 max-h-80 overflow-auto">
              {(fresh?.data||[]).map((r:any)=> (
                <div key={String(r._id)} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="font-medium">{r.name || 'N/A'}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        
        <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-white">{t('admin_analytics.customers.at_risk_customers')}</h4>
              <ExportTable rows={risk?.data||[]} filename="at_risk.csv" />
            </div>
            <div className="space-y-3 max-h-80 overflow-auto">
              {(risk?.data||[]).map((r:any)=> (
                <div key={String(r._id)} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <span className="font-medium">{r.name || 'N/A'}</span>
                  <span className="text-sm text-muted-foreground">{r.email || 'N/A'}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MarketingTab({ qs }: { qs: string }) {
  const { t } = useTranslation();
  const { data } = useQuery({ queryKey: ['analytics','marketing',qs], queryFn: ()=> api<{ success:boolean; data:any[] }>(`/api/admin/analytics/coupon-performance?${qs}`) });
  const rows = data?.data || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">
          {t('admin_analytics.tabs.marketing')}
        </h3>
      </div>
      
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
        <div className="p-6">
          <h4 className="font-semibold mb-4 text-white">{t('admin_analytics.marketing.coupon_performance')}</h4>
          <div className="w-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-border/50">
                  <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.marketing.table_headers.coupon_code')}</th>
                  <th className="py-4 px-6 font-medium text-muted-foreground">{t('admin_analytics.marketing.table_headers.times_used')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r:any)=> (
                  <tr key={r._id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-4 px-6 font-medium">{r.code}</td>
                    <td className="py-4 px-6">{r.usedCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'overview'|'revenue'|'products'|'customers'|'marketing'>('overview');
  const [start, setStart] = useState<Date>(()=> { const d = new Date(); d.setMonth(d.getMonth()-1); return d; });
  const [end, setEnd] = useState<Date>(new Date());
  const qs = useMemo(()=> formatRangeQS(start,end), [start,end]);
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={t('admin_analytics.title')}
        subtitle={t('admin_analytics.subtitle')}
      >
        <DateRangePicker
          startDate={start}
          endDate={end}
          onStartDateChange={setStart}
          onEndDateChange={setEnd}
        />
      </PageHeader>

      <Tabs value={tab} onValueChange={(v)=> setTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{t('admin_analytics.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="revenue">{t('admin_analytics.tabs.revenue')}</TabsTrigger>
          <TabsTrigger value="products">{t('admin_analytics.tabs.products')}</TabsTrigger>
          <TabsTrigger value="customers">{t('admin_analytics.tabs.customers')}</TabsTrigger>
          <TabsTrigger value="marketing">{t('admin_analytics.tabs.marketing')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <OverviewTab qs={qs} />
        </TabsContent>
        <TabsContent value="revenue" className="mt-6">
          <RevenueTab qs={qs} />
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          <ProductsTab qs={qs} />
        </TabsContent>
        <TabsContent value="customers" className="mt-6">
          <CustomersTab qs={qs} />
        </TabsContent>
        <TabsContent value="marketing" className="mt-6">
          <MarketingTab qs={qs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


