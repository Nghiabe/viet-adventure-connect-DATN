import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, History, Users, Map as MapIcon } from 'lucide-react';

interface TabbedContentProps {
  overview?: string;
  history?: string;
  culture?: string;
  geography?: string;
}

export function TabbedContent({ overview, history, culture, geography }: TabbedContentProps) {
  const hasAny = overview || history || culture || geography;
  if (!hasAny) return null;

  return (
    <div className="bg-card/30 rounded-xl border border-border/40 p-1">
      <Tabs defaultValue={overview ? 'overview' : history ? 'history' : culture ? 'culture' : 'geography'} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-2 bg-transparent gap-2 border-b border-border/40 rounded-none mb-6">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-full px-4 py-2 flex gap-2 items-center"
          >
            <BookOpen className="w-4 h-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-full px-4 py-2 flex gap-2 items-center"
          >
            <History className="w-4 h-4" />
            Lịch sử
          </TabsTrigger>
          <TabsTrigger
            value="culture"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-full px-4 py-2 flex gap-2 items-center"
          >
            <Users className="w-4 h-4" />
            Văn hóa
          </TabsTrigger>
          <TabsTrigger
            value="geography"
            className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none rounded-full px-4 py-2 flex gap-2 items-center"
          >
            <MapIcon className="w-4 h-4" />
            Địa lý
          </TabsTrigger>
        </TabsList>

        <div className="px-4 pb-6">
          <TabsContent value="overview" className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden animate-in fade-in-50 duration-300">
            {overview ? (
              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: overview }} />
            ) : (
              <EmptyState />
            )}
          </TabsContent>
          <TabsContent value="history" className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden animate-in fade-in-50 duration-300">
            {history ? (
              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: history }} />
            ) : (
              <EmptyState />
            )}
          </TabsContent>
          <TabsContent value="culture" className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden animate-in fade-in-50 duration-300">
            {culture ? (
              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: culture }} />
            ) : (
              <EmptyState />
            )}
          </TabsContent>
          <TabsContent value="geography" className="mt-0 focus-visible:outline-none data-[state=inactive]:hidden animate-in fade-in-50 duration-300">
            {geography ? (
              <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: geography }} />
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-border/40 border-dashed">
      <p>Chưa có thông tin cập nhật cho mục này.</p>
    </div>
  );
}


