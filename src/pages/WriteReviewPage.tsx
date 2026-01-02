
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MapPin } from 'lucide-react';
import ReviewForm from '@/components/reviews/ReviewForm';
import apiClient from '@/services/apiClient';
import { ResilientImage } from '@/components/ui/ResilientImage';
import { getTourImageUrl } from '@/lib/tourUtils';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

interface TourDetails {
    _id: string;
    title: string;
    mainImage?: string;
    imageGallery?: string[];
    destination?: {
        name: string;
    };
    duration?: string;
}

export default function WriteReviewPage() {
    const { tourId } = useParams<{ tourId: string }>();
    const navigate = useNavigate();
    const [tour, setTour] = useState<TourDetails | null>(null);
    const [existingReview, setExistingReview] = useState<any>(null); // Store existing review
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!tourId) return;
            try {
                // Parallel fetch
                const [tourRes, reviewRes] = await Promise.all([
                    apiClient.get<any>(`/tours/${tourId}`),
                    apiClient.get<any>(`/reviews/mine/${tourId}`)
                ]);

                // Handle Tour Data
                if (tourRes.success && tourRes.data) {
                    const tourData = tourRes.data.tour || tourRes.data;
                    setTour(tourData);
                }

                // Handle Review Data
                if (reviewRes.success && reviewRes.data) {
                    setExistingReview(reviewRes.data);
                }

            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tourId]);

    const handleSuccess = () => {
        // Redirect back to bookings or show success state
        setTimeout(() => {
            navigate('/profile?tab=bookings');
        }, 1500);
    };

    if (loading) return <FullScreenLoader />;

    if (!tour) {
        return (
            <div className="container mx-auto py-10 text-center">
                <h2 className="text-xl font-bold mb-4">Không tìm thấy thông tin Tour</h2>
                <Button onClick={() => navigate(-1)}>Quay lại</Button>
            </div>
        );
    }

    const imageUrl = getTourImageUrl(tour as any);

    return (
        <div className="container mx-auto py-8 max-w-3xl px-4">
            <Button
                variant="ghost"
                className="mb-6 pl-0 hover:pl-2 transition-all"
                onClick={() => navigate(-1)}
            >
                <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
            </Button>

            <div className="grid gap-8">
                {/* Tour Info Card */}
                <Card className="overflow-hidden border-none shadow-md bg-muted/20">
                    <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/3 h-48 md:h-auto relative">
                            <ResilientImage
                                src={imageUrl || ''}
                                alt={tour.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-center">
                            <h1 className="text-2xl font-bold mb-2 line-clamp-2">{tour.title}</h1>
                            {tour.destination && (
                                <div className="flex items-center text-muted-foreground mb-2">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    <span>{tour.destination.name}</span>
                                </div>
                            )}
                            {tour.duration && (
                                <p className="text-sm text-secondary-foreground">Thời lượng: {tour.duration}</p>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Review Form Section */}
                <div>
                    <ReviewForm
                        tourId={tour._id}
                        initialData={existingReview}
                        onSuccess={handleSuccess}
                    />
                </div>
            </div>
        </div>
    );
}
