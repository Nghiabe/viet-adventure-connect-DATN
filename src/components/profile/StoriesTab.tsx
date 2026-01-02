import React from "react";
import { Heart } from "lucide-react";

export interface StoryItem {
  _id: string;
  title: string;
  createdAt: string;
  coverImage?: string | null;
  excerpt?: string;
  likeCount?: number;
  status: 'draft' | 'published' | 'archived' | 'pending';
}

const StoryCard = ({ story }: { story: StoryItem }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">Đã đăng</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Chờ duyệt</span>;
      case 'archived':
      case 'rejected':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Bị từ chối</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="bg-background rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group">
      {story.coverImage ? (
        <img src={story.coverImage} alt={story.title} className="w-full h-40 object-cover" />
      ) : (
        <div className="w-full h-40 bg-muted" />
      )}
      <div className="absolute top-2 right-2">
        {getStatusBadge(story.status)}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{story.title}</h3>
        {story.excerpt && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{story.excerpt}</p>
        )}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{new Date(story.createdAt).toLocaleDateString("vi-VN")}</span>
          <span className="inline-flex items-center gap-1">
            <Heart className="w-4 h-4" /> {story.likeCount ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
};

interface StoriesTabProps {
  stories: StoryItem[];
}

const StoriesTab: React.FC<StoriesTabProps> = ({ stories }) => {
  if (!stories || stories.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Bài viết của bạn</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Chia sẻ những trải nghiệm du lịch và kết nối với cộng đồng
        </p>
        <button className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">
          Viết bài chia sẻ
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-2">
      {stories.map((story) => (
        <StoryCard key={story._id} story={story} />
      ))}
    </div>
  );
};

export default StoriesTab;
