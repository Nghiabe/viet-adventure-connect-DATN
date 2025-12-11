// src/components/itinerary/ItineraryTimeline.tsx
import React, { useState } from 'react';
import { Clock, MapPin, Star, DollarSign, Lightbulb, ChefHat, Camera, Info, ChevronRight, Volume2, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DailyBriefingCard } from './DailyBriefingCard';
import { TransportSegment } from './TransportSegment';

interface Activity {
  time: string;
  type: string;
  title: string;
  description: string;
  location?: string;
  duration?: string;
  rating?: number;
  cost?: number;
  tips?: string | null;
  // New Super Guide fields
  images?: Array<{ url: string; caption: string }>;
  details?: any;
  transport?: {
    from: string;
    to: string;
    method: string;
    distance_km?: number;
    duration_minutes?: number;
    alternative?: string;
  };
  dish_recommendation?: string[];
  slot_type?: string;
}

interface DaySchedule {
  day: number;
  title: string;
  date?: string;
  activities: Activity[];
  daily_briefing?: any;
  start_point?: any;
  day_summary?: any;
}

interface ItineraryTimelineProps {
  schedule: DaySchedule[];
}

const getTypeColor = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('sáng') || t.includes('breakfast')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (t.includes('trưa') || t.includes('lunch')) return 'bg-orange-100 text-orange-800 border-orange-200';
  if (t.includes('tối') || t.includes('dinner')) return 'bg-purple-100 text-purple-800 border-purple-200';
  if (t.includes('tham quan') || t.includes('attraction')) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (t.includes('di chuyển') || t.includes('transport')) return 'bg-slate-100 text-slate-800 border-slate-200';
  if (t.includes('nghỉ') || t.includes('rest')) return 'bg-green-100 text-green-800 border-green-200';
  if (t.includes('mua sắm')) return 'bg-pink-100 text-pink-800 border-pink-200';
  return 'bg-gray-100 text-gray-800 border-gray-200';
};

const getTypeIcon = (slotType: string) => {
  if (slotType === 'meal') return <ChefHat className="h-4 w-4" />;
  if (slotType === 'attraction') return <Camera className="h-4 w-4" />;
  return null;
};

const formatCost = (cost: number) => {
  if (cost === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(cost);
};

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
    />
  ));
};

// Image gallery component
const ImageGallery: React.FC<{ images: Array<{ url: string; caption: string }> }> = ({ images }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
      {images.map((img, idx) => (
        <div key={idx} className="flex-shrink-0 relative group">
          <img
            src={img.url}
            alt={img.caption}
            className="h-24 w-32 object-cover rounded-lg border shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
            }}
          />
          {img.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {img.caption}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Detail Modal component
const DetailModal: React.FC<{ activity: Activity; children: React.ReactNode }> = ({ activity, children }) => {
  const details = activity.details;

  if (!details) return <>{children}</>;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="cursor-pointer hover:shadow-lg transition-shadow">
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {activity.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* TTS Button Placeholder */}
          <div className="flex justify-end">
            <button className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md">
              <Volume2 className="h-4 w-4" />
              Nghe giới thiệu
            </button>
          </div>

          {/* Images */}
          {activity.images && activity.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {activity.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-40 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
              ))}
            </div>
          )}

          {/* Description - Color Block */}
          {details.description && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border-l-4 border-orange-400">
              <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Giới thiệu
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{details.description}</p>
            </div>
          )}

          {/* Origin for food - Color Block */}
          {details.origin && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-l-4 border-green-400">
              <h4 className="font-bold text-green-800 mb-2">🌿 Nguồn gốc</h4>
              <p className="text-gray-700 text-sm">{details.origin}</p>
            </div>
          )}

          {/* Eating guide for food - Color Block */}
          {details.eating_guide && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border-l-4 border-amber-400">
              <h4 className="font-bold text-amber-800 mb-2">🍴 Cách thưởng thức</h4>
              <p className="text-gray-700 text-sm">{details.eating_guide}</p>
            </div>
          )}

          {/* Best time for attractions - Color Block */}
          {details.best_time && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border-l-4 border-blue-400">
              <h4 className="font-bold text-blue-800 mb-2">⏰ Thời điểm đẹp nhất</h4>
              <p className="text-gray-700 text-sm">{details.best_time}</p>
            </div>
          )}

          {/* Restaurant info - Color Block */}
          {details.rating && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-l-4 border-purple-400">
              <h4 className="font-bold text-purple-800 mb-2">⭐ Đánh giá</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  {renderStars(details.rating)}
                  <span className="ml-2 text-sm text-gray-600">{details.rating.toFixed(1)}</span>
                </div>
                {details.review_count && (
                  <span className="text-sm text-gray-500">({details.review_count} đánh giá)</span>
                )}
              </div>
            </div>
          )}

          {/* Opening hours & Price - Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            {details.opening_hours && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-500">Giờ mở cửa</p>
                <p className="text-sm text-gray-900 font-medium">{details.opening_hours}</p>
              </div>
            )}
            {details.price_range && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-500">Khoảng giá</p>
                <p className="text-sm text-gray-900 font-medium">{details.price_range}</p>
              </div>
            )}
          </div>

          {/* Source */}
          {details.source_url && (
            <a
              href={details.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              Xem thêm <ChevronRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ schedule }) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Lịch trình chi tiết</h2>
        <p className="text-gray-600">Khám phá từng ngày của hành trình tuyệt vời</p>
      </div>

      {schedule.map((day) => (
        <div key={day.day} className="relative">
          {/* Daily Briefing Card */}
          {day.daily_briefing && (
            <DailyBriefingCard
              day={day.day}
              date={day.date || ''}
              briefing={day.daily_briefing}
              startPoint={day.start_point}
            />
          )}

          {/* Day Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg shadow-lg">
              {day.day}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{day.title}</h3>
              <p className="text-sm text-gray-600">
                {day.date ? new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }) : `Ngày ${day.day} của hành trình`}
              </p>
            </div>
          </div>

          {/* Timeline Items */}
          <div className="ml-6 border-l-2 border-orange-200 pl-6 space-y-4">
            {day.activities.map((activity, index) => {
              // Special rendering for transport slots
              if (activity.slot_type === 'transport' && activity.transport) {
                return (
                  <TransportSegment
                    key={`${day.day}-${index}`}
                    time={activity.time}
                    transport={activity.transport}
                    cost={activity.cost || 0}
                  />
                );
              }

              // Normal activity rendering
              return (
                <div key={`${day.day}-${index}`} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-9 w-4 h-4 bg-orange-500 rounded-full border-4 border-white shadow-md" />

                  <DetailModal activity={activity}>
                    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md overflow-hidden">
                      <div className="flex">
                        {/* Left: Main Content */}
                        <div className="flex-1">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-full">
                                  <Clock className="h-4 w-4" />
                                  <span className="font-medium">{activity.time}</span>
                                </div>
                                <Badge className={`${getTypeColor(activity.type)} border flex items-center gap-1`}>
                                  {getTypeIcon(activity.slot_type || '')}
                                  {activity.type}
                                </Badge>
                              </div>
                              {activity.rating && activity.rating > 0 && (
                                <div className="flex items-center gap-1">
                                  {renderStars(activity.rating)}
                                  <span className="text-sm text-gray-600 ml-1">
                                    {activity.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-lg text-gray-900 mb-2">
                              {activity.title}
                            </CardTitle>
                          </CardHeader>

                          <CardContent className="pt-0">
                            <p className="text-gray-700 mb-3 leading-relaxed text-sm">
                              {activity.description}
                            </p>

                            {/* Dish Recommendations for meals */}
                            {activity.dish_recommendation && activity.dish_recommendation.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-500 mb-1">🍽️ Nên thử:</p>
                                <div className="flex flex-wrap gap-1">
                                  {activity.dish_recommendation.map((dish, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs bg-amber-50 text-amber-700">
                                      {dish}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Images Gallery - only show if no featured image or multiple images */}
                            {activity.images && activity.images.length > 1 && (
                              <ImageGallery images={activity.images.slice(1)} />
                            )}

                            {/* Activity Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                              {activity.location && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-gray-900">Địa điểm</p>
                                    <p className="text-xs text-gray-600">{activity.location}</p>
                                  </div>
                                </div>
                              )}

                              {activity.duration && (
                                <div className="flex items-start gap-2">
                                  <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-gray-900">Thời gian</p>
                                    <p className="text-xs text-gray-600">{activity.duration}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Cost and Tips */}
                            <div className="flex flex-col sm:flex-row gap-3 mt-3">
                              {activity.cost !== undefined && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-700">
                                    {formatCost(activity.cost)}
                                  </span>
                                </div>
                              )}

                              {activity.tips && (
                                <div className="flex items-start gap-2 bg-yellow-50 p-2 rounded-lg border border-yellow-200 flex-1">
                                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-medium text-yellow-800">Mẹo hay</p>
                                    <p className="text-xs text-yellow-700">{activity.tips}</p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Click for more indicator */}
                            {activity.details && (
                              <div className="mt-3 text-xs text-blue-500 flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                Nhấp để xem thông tin chi tiết
                              </div>
                            )}
                          </CardContent>
                        </div>

                        {/* Right: Featured Image in bordered box */}
                        {activity.images && activity.images.length > 0 && (
                          <div className="hidden md:flex w-36 flex-shrink-0 border-2 border-gray-300 rounded-lg overflow-hidden self-stretch">
                            <img
                              src={activity.images[0].url}
                              alt={activity.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </Card>
                  </DetailModal>
                </div>
              );
            })}
          </div>

          {/* Day Summary */}
          {
            day.day_summary && (
              <div className="mt-6 ml-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng chi phí ngày {day.day}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCost(day.day_summary.total_cost || 0)}
                    </p>
                  </div>
                  {day.day_summary.total_distance_km && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">Quãng đường</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {day.day_summary.total_distance_km} km
                      </p>
                    </div>
                  )}
                </div>
                {day.day_summary.breakdown && (
                  <div className="flex gap-4 mt-3 text-xs text-gray-600">
                    {day.day_summary.breakdown.transport > 0 && (
                      <span>🚕 Di chuyển: {formatCost(day.day_summary.breakdown.transport)}</span>
                    )}
                    {day.day_summary.breakdown.food > 0 && (
                      <span>🍽️ Ăn uống: {formatCost(day.day_summary.breakdown.food)}</span>
                    )}
                    {day.day_summary.breakdown.attractions > 0 && (
                      <span>🎟️ Vé: {formatCost(day.day_summary.breakdown.attractions)}</span>
                    )}
                  </div>
                )}
              </div>
            )
          }
        </div>
      ))}
    </div>
  );
};
