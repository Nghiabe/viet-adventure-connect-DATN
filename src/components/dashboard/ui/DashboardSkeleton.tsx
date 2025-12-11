import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const KpiCardSkeleton = () => (
  <Card className="bg-card border border-border p-4">
    <Skeleton className="h-4 w-24 mb-2" />
    <Skeleton className="h-8 w-20 mb-1" />
    <Skeleton className="h-3 w-16" />
  </Card>
);

const ChartSkeleton = () => (
  <Card className="bg-card border border-border p-4">
    <Skeleton className="h-6 w-32 mb-4" />
    <Skeleton className="h-64 w-full" />
  </Card>
);

const TableSkeleton = () => (
  <Card className="bg-card border border-border p-4">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </Card>
);

const RecentBookingsSkeleton = () => (
  <Card className="bg-card border border-border p-0 overflow-hidden">
    <div className="p-4">
      <Skeleton className="h-6 w-32" />
    </div>
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  </Card>
);

const ActivityFeedSkeleton = () => (
  <Card className="bg-card border border-border p-4">
    <Skeleton className="h-6 w-24 mb-4" />
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3">
          <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const BookingHeatmapSkeleton = () => (
  <Card className="bg-card border border-border p-4">
    <Skeleton className="h-6 w-24 mb-4" />
    <div className="grid grid-cols-7 gap-1">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-8" />
      ))}
    </div>
  </Card>
);

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </div>

      {/* Middle Row - Charts and Top Performing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <div>
          <TableSkeleton />
        </div>
      </div>

      {/* Bottom Row - Recent Bookings and Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RecentBookingsSkeleton />
        </div>
        <div className="space-y-4">
          <BookingHeatmapSkeleton />
          <ActivityFeedSkeleton />
        </div>
      </div>
    </div>
  );
}
