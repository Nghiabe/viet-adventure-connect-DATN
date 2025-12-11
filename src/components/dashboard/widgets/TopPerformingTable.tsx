import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';

type Row = { rank: number; name: string; value: number; link: string };

export default function TopPerformingTable({ tours, partners }: { tours: Row[]; partners: Row[] }) {
  const Table = ({ rows }: { rows: Row[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60">
          <tr>
            <th className="text-left p-3">#</th>
            <th className="text-left p-3">Tên</th>
            <th className="text-right p-3">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank} className="border-t border-border">
              <td className="p-3">{r.rank}</td>
              <td className="p-3"><Link to={r.link} className="text-accent-foreground underline hover:no-underline">{r.name}</Link></td>
              <td className="p-3 text-right">{r.value.toLocaleString('vi-VN')}₫</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  return (
    <Card className="bg-card border border-border p-4">
      <Tabs defaultValue="tours">
        <TabsList>
          <TabsTrigger value="tours">Top Tours</TabsTrigger>
          <TabsTrigger value="partners">Top Đối tác</TabsTrigger>
        </TabsList>
        <TabsContent value="tours"><Table rows={tours} /></TabsContent>
        <TabsContent value="partners"><Table rows={partners} /></TabsContent>
      </Tabs>
    </Card>
  );
}













