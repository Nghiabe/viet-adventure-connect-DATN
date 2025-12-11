const HotelCardSkeleton = () => {
  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      <div className="w-full h-48 bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
          <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
          <div className="h-6 w-16 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="h-8 w-full bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
};

export default HotelCardSkeleton;


