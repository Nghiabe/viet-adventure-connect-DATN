import { Card } from '@/components/ui/card';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line } from 'recharts';
import { useTranslation } from 'react-i18next';

type DataPoint = { month: string; revenue: number; bookings: number };

export default function CombinedRevenueChart({ data }: { data: DataPoint[] }) {
  const { t } = useTranslation();
  return (
    <Card className="bg-card border border-border p-4">
      <div className="font-semibold mb-3">{t('admin_analytics.charts.revenue_and_bookings_title', 'Doanh thu & Số đơn')}</div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="month" stroke="#9ca3af" />
            <YAxis yAxisId="left" stroke="#9ca3af" />
            <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
            <Tooltip contentStyle={{ background: 'rgb(31,41,55)', border: '1px solid rgb(55,65,81)', color: 'white' }} />
            <Bar yAxisId="right" dataKey="bookings" fill="#94a3b8" radius={[3,3,0,0]} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}



