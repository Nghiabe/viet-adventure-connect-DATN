import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <Tabs defaultValue={overview ? 'overview' : history ? 'history' : culture ? 'culture' : 'geography'} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        <TabsTrigger value="history">Lịch sử</TabsTrigger>
        <TabsTrigger value="culture">Văn hóa</TabsTrigger>
        <TabsTrigger value="geography">Địa lý</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        {overview ? (
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: overview }} />
        ) : (
          <div className="text-muted-foreground">Chưa có nội dung.</div>
        )}
      </TabsContent>
      <TabsContent value="history">
        {history ? (
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: history }} />
        ) : (
          <div className="text-muted-foreground">Chưa có nội dung.</div>
        )}
      </TabsContent>
      <TabsContent value="culture">
        {culture ? (
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: culture }} />
        ) : (
          <div className="text-muted-foreground">Chưa có nội dung.</div>
        )}
      </TabsContent>
      <TabsContent value="geography">
        {geography ? (
          <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: geography }} />
        ) : (
          <div className="text-muted-foreground">Chưa có nội dung.</div>
        )}
      </TabsContent>
    </Tabs>
  );
}


