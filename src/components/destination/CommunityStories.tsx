import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CommunityStoryCard } from "./CommunityStoryCard";

interface Story {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  author: {
    name: string;
    avatar: string;
    initials: string;
    verified?: boolean;
  };
  readTime: string;
  publishedAt: string;
  tags: string[];
}

interface CommunityStoriesProps {
  stories: Story[];
  destinationName: string;
}

export const CommunityStories = ({ stories, destinationName }: CommunityStoriesProps) => {
  if (!stories.length) return null;

  return (
    <section className="w-full">
      {/* Section Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Câu chuyện từ Cộng đồng về {destinationName}
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl">
          Khám phá những trải nghiệm thực tế và câu chuyện cảm hứng từ cộng đồng du lịch 
          về {destinationName}. Những chia sẻ chân thực sẽ giúp bạn chuẩn bị tốt hơn cho chuyến đi.
        </p>
      </div>

      {/* Stories Grid */}
      <div className="space-y-6 mb-8">
        {stories.map((story) => (
          <CommunityStoryCard key={story.id} story={story} />
        ))}
      </div>

      {/* View All Stories Button */}
      <div className="text-center">
        <Button variant="outline" size="lg" asChild>
          <Link to="/community">
            Xem thêm câu chuyện về {destinationName}
          </Link>
        </Button>
      </div>
    </section>
  );
};



