const FlightCardSkeleton = () => {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-muted animate-pulse rounded" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
          <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-9 w-20 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
};

export default FlightCardSkeleton;


