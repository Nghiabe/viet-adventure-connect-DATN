import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { User, ShoppingCart, FileText, ShieldCheck } from 'lucide-react';

type Event = { id: string; type: 'user' | 'booking'; title: string; time: string };

export default function ActivityFeed({ live, moderation }: { live: Event[]; moderation: { pendingReviews: number; pendingPartners: number } }) {
  return (
    <Card className="bg-card border border-border p-4">
      <Tabs defaultValue="live">
        <TabsList>
          <TabsTrigger value="live">Hoạt động trực tiếp</TabsTrigger>
          <TabsTrigger value="queues">Hàng chờ</TabsTrigger>
        </TabsList>
        <TabsContent value="live">
          <div className="max-h-64 overflow-y-auto space-y-3">
            {live.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                {e.type === 'user' ? <User className="h-4 w-4 text-accent-foreground" /> : <ShoppingCart className="h-4 w-4 text-accent-foreground" />}
                <div className="flex-1">
                  <div>{e.title}</div>
                  <div className="text-xs text-secondary-foreground">{e.time}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="queues">
          <div className="space-y-2 text-sm">
            <Link to="/dashboard/moderation" className="block underline hover:no-underline">
              <div className="inline-flex items-center gap-2"><FileText className="h-4 w-4" /> {moderation.pendingReviews} đánh giá chờ duyệt</div>
            </Link>
            <Link to="/dashboard/users" className="block underline hover:no-underline">
              <div className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {moderation.pendingPartners} đối tác chờ phê duyệt</div>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}






















































