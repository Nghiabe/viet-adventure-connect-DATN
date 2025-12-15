import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getUserItineraries, deleteItinerary } from '@/services/plannerService';
import { Header } from '@/components/home/Header';
import { PlanCard } from '@/components/my-plans/PlanCard';
import { ShareModal } from '@/components/common/ShareModal';
import { ItineraryItem } from '@/types/planner';

const MyPlansPage: React.FC = () => {
    const [itineraries, setItineraries] = useState<ItineraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [sharePlan, setSharePlan] = useState<ItineraryItem | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        if (user) {
            loadItineraries();
        }
    }, [user]);

    const loadItineraries = async () => {
        try {
            setLoading(true);
            if (user?._id) {
                const response = await getUserItineraries(user._id);
                if (response.success) {
                    setItineraries(response.data || []);
                }
            }
        } catch (error: any) {
            console.error('Error loading itineraries:', error);
            toast({
                title: "Lỗi",
                description: "Không thể tải danh sách kế hoạch",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;

        try {
            if (user?._id) {
                await deleteItinerary(deleteId, user._id);
                setItineraries(prev => prev.filter(i => i._id !== deleteId));
                toast({
                    title: "Thành công",
                    description: "Đã xóa kế hoạch khỏi tài khoản của bạn.",
                });
            } else {
                toast({ title: "Lỗi", description: "Vui lòng đăng nhập lại", variant: "destructive" });
            }
        } catch (error) {
            toast({
                title: "Lỗi",
                description: "Không thể xóa kế hoạch",
                variant: "destructive"
            });
        } finally {
            setDeleteId(null);
        }
    };

    const handleViewPlan = (itinerary: ItineraryItem) => {
        navigate('/itinerary-detail', {
            state: {
                // Pass existing data so we don't strictly need to refetch
                planResult: { itinerary_content: itinerary.itinerary_content, total_cost: itinerary.total_cost },
                formData: {
                    destination: itinerary.destination,
                    startDate: itinerary.start_date,
                    endDate: itinerary.end_date,
                    travelers: itinerary.travelers,
                    travelStyle: itinerary.travel_style
                },
                savedItineraryId: itinerary._id // CRITICAL: Pass ID to identify it as saved
            }
        });
    };

    const handleStartPlan = async (itinerary: ItineraryItem) => {
        try {
            // Mock API call for start
            // const response = await fetch(`/api/itineraries/${itinerary._id}/start`, ...);

            toast({
                title: "🎉 Bắt đầu hành trình!",
                description: "Chuyển sang chế độ theo dõi..."
            });

            navigate('/itinerary-detail', {
                state: {
                    planResult: { itinerary_content: itinerary.itinerary_content, total_cost: itinerary.total_cost },
                    formData: {
                        destination: itinerary.destination,
                        startDate: itinerary.start_date,
                        endDate: itinerary.end_date,
                        travelers: itinerary.travelers,
                        travelStyle: itinerary.travel_style
                    },
                    savedItineraryId: itinerary._id,
                    trackingMode: true
                }
            });
        } catch (error) {
            toast({ title: "Lỗi", description: "Không thể bắt đầu hành trình", variant: "destructive" });
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
                <Header />
                <div className="container mx-auto px-4 py-32 text-center">
                    <h1 className="text-2xl font-bold mb-4">Vui lòng đăng nhập</h1>
                    <Button onClick={() => navigate('/login')}>Đăng nhập</Button>
                </div>
            </div>
        );
    }

    // --- Invitation Logic ---
    const [inviteData, setInviteData] = useState<{ token: string, planId: string, planName: string, ownerName: string } | null>(null);

    useEffect(() => {
        const checkInvite = async () => {
            const params = new URLSearchParams(window.location.search);
            const inviteId = params.get('inviteId');
            const planId = params.get('planId');

            if (inviteId && planId && user) {
                try {
                    const res = await fetch(`/api/invitations/pending-by-token?token=${inviteId}&planId=${planId}`);
                    const data = await res.json();
                    if (data.success) {
                        setInviteData({
                            token: inviteId,
                            planId,
                            planName: data.data.planName,
                            ownerName: data.data.ownerName
                        });
                        // Clean URL but keep state? Or just waiting for user action. 
                        // To avoid re-triggering on refresh if accepted, we rely on the API check returning 404 or success.
                    } else {
                        toast({ title: "Thông báo", description: "Lời mời không hợp lệ hoặc đã hết hạn" });
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };
        checkInvite();
    }, [user, location.search]); // location needs to be imported if not available, but window.location works for initial load

    const handleAcceptInvite = async () => {
        if (!inviteData) return;
        try {
            const res = await fetch('/api/invitations/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: inviteData.token, planId: inviteData.planId })
            });
            const data = await res.json();
            if (data.success) {
                toast({ title: "Thành công", description: "Bạn đã tham gia kế hoạch!" });
                setInviteData(null);
                // Remove query params
                window.history.replaceState({}, '', '/my-plans');
                loadItineraries(); // Refresh list to show new plan
            } else {
                toast({ variant: "destructive", title: "Lỗi", description: data.error || "Không thể chấp nhận lời mời" });
            }
        } catch (e) {
            toast({ variant: "destructive", title: "Lỗi", description: "Lỗi kết nối" });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="container mx-auto px-4 py-24">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kế hoạch của tôi</h1>
                        <p className="text-gray-600">Quản lý các chuyến đi sắp tới và đã hoàn thành của bạn.</p>
                    </div>
                    <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
                        <Plus className="h-5 w-5 mr-2" /> Tạo mới
                    </Button>
                </div>

                {/* Invitation Dialog */}
                <AlertDialog open={!!inviteData} onOpenChange={(open) => !open && setInviteData(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Lời mời tham gia kế hoạch</AlertDialogTitle>
                            <AlertDialogDescription>
                                <strong>{inviteData?.ownerName}</strong> đã mời bạn tham gia vào kế hoạch <strong>"{inviteData?.planName}"</strong>.
                                <br />
                                Bạn có muốn chấp nhận lời mời này không?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => {
                                setInviteData(null);
                                window.history.replaceState({}, '', '/my-plans');
                            }}>Từ chối</AlertDialogCancel>
                            <AlertDialogAction onClick={handleAcceptInvite} className="bg-blue-600 hover:bg-blue-700">
                                Chấp nhận
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : itineraries.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="h-10 w-10 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-gray-900">Chưa có kế hoạch nào</h2>
                        <p className="text-gray-500 mb-6">Hãy bắt đầu tạo hành trình mơ ước của bạn ngay hôm nay!</p>
                        <Button onClick={() => navigate('/')}>Tạo kế hoạch mới</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {itineraries.map((plan) => (
                            <PlanCard
                                key={plan._id}
                                plan={plan}
                                onView={handleViewPlan}
                                onShare={setSharePlan}
                                onDelete={setDeleteId}
                                onStart={handleStartPlan}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Kế hoạch này sẽ bị xóa vĩnh viễn khỏi dữ liệu của bạn.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Xóa vĩnh viễn
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Share Modal */}
            {sharePlan && (
                <ShareModal
                    isOpen={!!sharePlan}
                    onClose={() => setSharePlan(null)}
                    planName={sharePlan.name}
                    planId={sharePlan._id}
                    onShare={() => {
                        // Just close, maybe refresh logic if needed
                        setSharePlan(null);
                    }}
                />
            )}
        </div>
    );
};

export default MyPlansPage;

