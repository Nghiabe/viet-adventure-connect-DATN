import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const CommunityPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-secondary">
      {/* Header skeleton */}
      <div className="h-20 bg-card border-b" />
      
      <main className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header Skeleton */}
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - Left Column */}
            <div className="lg:col-span-3">
              {/* Featured Story Skeleton */}
              <div className="mb-8">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="relative overflow-hidden rounded-xl bg-card border">
                  <Skeleton className="h-96 w-full" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            <Skeleton className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-8" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Story Feed Skeleton */}
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-card border rounded-xl overflow-hidden">
                      <div className="flex gap-4 p-4">
                        <Skeleton className="w-32 h-24 flex-shrink-0 rounded-lg" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback>
                                  <Skeleton className="h-3 w-3" />
                                </AvatarFallback>
                              </Avatar>
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-5 w-full mb-1" />
                          <Skeleton className="h-4 w-3/4 mb-3" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-5 w-16" />
                              <Skeleton className="h-5 w-12" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-4 w-6" />
                              <Skeleton className="h-4 w-6" />
                              <Skeleton className="h-4 w-4" />
                              <Skeleton className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Right Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Write Story Button Skeleton */}
                <Skeleton className="h-12 w-full" />

                {/* Trending Topics Skeleton */}
                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="space-y-3">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg">
                        <div>
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-3 w-4" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Authors Skeleton */}
                <div className="bg-card border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>
                            <Skeleton className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Community Stats Skeleton */}
                <div className="bg-card border rounded-xl p-6">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityPageSkeleton;
