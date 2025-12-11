// src/components/ui/SkeletonCard.tsx
export default function SkeletonCard() {
  return (
    <div className="animate-pulse bg-card rounded-xl border p-4 shadow-sm">
      {/* Image skeleton */}
      <div className="bg-gray-200 rounded-lg h-48 mb-4" />
      
      {/* Content skeleton */}
      <div className="space-y-3">
        {/* Category badge */}
        <div className="h-6 bg-gray-200 rounded-full w-20" />
        
        {/* Title */}
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        
        {/* Location */}
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        
        {/* Duration */}
        <div className="h-4 bg-gray-200 rounded w-24" />
        
        {/* Rating */}
        <div className="h-4 bg-gray-200 rounded w-32" />
        
        {/* Highlights */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-4/5" />
          <div className="h-3 bg-gray-200 rounded w-3/4" />
        </div>
        
        {/* Price and button */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-8 bg-gray-200 rounded w-24" />
          <div className="h-9 bg-gray-200 rounded w-28" />
        </div>
      </div>
    </div>
  );
}












