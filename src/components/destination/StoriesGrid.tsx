import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

interface StoryItem {
  id: string;
  title: string;
  coverImage?: string;
  author?: { name: string; avatar?: string };
  createdAt?: string;
}

export function StoriesGrid({ stories, destinationName }: { stories: StoryItem[]; destinationName: string }) {
  if (!stories?.length) return null;
  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">Câu chuyện từ Cộng đồng</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((s) => (
          <Link key={s.id} to={`/community`}>
            <Card className="overflow-hidden">
              {s.coverImage && (
                <img src={s.coverImage} alt={s.title} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="text-sm text-muted-foreground mb-1">{destinationName}</div>
                <div className="font-semibold line-clamp-2">{s.title}</div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}


