import { Link } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink } from "lucide-react";

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

interface CommunityStoryCardProps {
  story: Story;
}

export const CommunityStoryCard = ({ story }: CommunityStoryCardProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <article className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      {/* Mobile: Vertical Layout, Desktop: Horizontal Layout */}
      <div className="flex flex-col md:flex-row md:min-h-[320px]">
        {/* Story Image */}
        <div className="relative md:w-1/3 flex-shrink-0">
          <img
            src={story.image}
            alt={story.title}
            className="w-full h-56 md:h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-r" />
        </div>

        {/* Story Content */}
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
          {/* Top Content */}
          <div className="flex-1">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {story.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs font-medium"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Story Title */}
            <h3 className="font-bold text-xl md:text-2xl mb-4 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
              {story.title}
            </h3>

            {/* Story Excerpt */}
            <p className="text-muted-foreground text-base md:text-lg mb-6 line-clamp-3 leading-relaxed">
              {story.excerpt}
            </p>
          </div>

          {/* Bottom Content - Author & Meta Info */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={story.author.avatar} alt={story.author.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {story.author.initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">
                    {story.author.name}
                  </span>
                  {story.author.verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{story.readTime}</span>
                  </div>
                  <span>•</span>
                  <span>{formatDate(story.publishedAt)}</span>
                </div>
              </div>
            </div>

            {/* Read More Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-shrink-0 ml-4 hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <Link to={`/community/story/${story.id}`}>
                <span className="hidden sm:inline mr-1">Đọc thêm</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
