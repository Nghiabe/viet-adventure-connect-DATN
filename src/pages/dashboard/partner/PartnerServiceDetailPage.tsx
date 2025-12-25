import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Star, MapPin, ArrowLeft, Loader2, Check, X as XIcon, Calendar, Clock, Edit, Trash2 } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { toast } from 'sonner';

interface ServiceItem {
    _id?: string;
    id?: string;
    type: 'hotel' | 'flight' | 'train' | 'bus';
    name: string;
    price: number;
    location?: string;
    address?: string;
    route?: string;
    rating: number;
    status: 'active' | 'inactive';
    image: string;
    images?: string[];
    description?: string;
    facilities?: string[];
    inclusions?: string[];
    exclusions?: string[];
    roomTypes?: {
        name: string;
        price: number;
        description?: string;
        amenities?: string[];
        images?: string[];
    }[];
    updatedAt?: string;
    createdAt?: string;
}

export default function PartnerServiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [service, setService] = useState<ServiceItem | null>(null);
    const [loading, setLoading] = useState(true);

    const handleDelete = async () => {
        try {
            const res = await apiClient.delete(`/partner/services/${id}`) as any;
            if (res.success) {
                toast.success('Đã xóa dịch vụ thành công');
                navigate('/dashboard/services');
            } else {
                toast.error(res.error || 'Xóa thất bại');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Lỗi khi xóa dịch vụ');
        }
    };

    useEffect(() => {
        const fetchService = async () => {
            if (!id) return;
            try {
                const res = await apiClient.get(`/partner/services/${id}`) as any;
                if (res.success) {
                    setService(res.data);
                } else {
                    toast.error('Không tìm thấy dịch vụ');
                    navigate('/dashboard/services');
                }
            } catch (error) {
                console.error('Error fetching service:', error);
                toast.error('Lỗi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };

        fetchService();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!service) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header Navigation */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground" onClick={() => navigate('/dashboard/services')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
                </Button>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Cập nhật lần cuối: {service.updatedAt ? new Date(service.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Hero Section */}
                    <div className="space-y-4">
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-muted relative shadow-sm border border-border/50 group">
                            <img src={service.image} alt={service.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute top-4 right-4 z-10">
                                <Badge variant={service.status === 'active' ? 'default' : 'secondary'} className={service.status === 'active' ? 'bg-green-500/90 hover:bg-green-600 backdrop-blur-sm' : 'bg-secondary/90 backdrop-blur-sm'}>
                                    {service.status === 'active' ? 'Đang hoạt động' : 'Tạm ẩn'}
                                </Badge>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 shadow-sm">{service.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-white/90">
                                    <div className="flex items-center bg-yellow-400/20 backdrop-blur-md px-2 py-1 rounded-md border border-yellow-400/30 text-yellow-300 font-bold">
                                        <Star className="h-4 w-4 fill-current mr-1.5" />
                                        {service.rating}
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-1.5" />
                                        {service.location || service.route || service.address || "Chưa cập nhật địa điểm"}
                                    </div>
                                    <div className="uppercase text-xs font-bold tracking-widest bg-white/20 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                                        {service.type}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Gallery */}
                    {service.images && service.images.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Thư viện ảnh
                            </h3>
                            <div className="grid grid-cols-4 gap-4">
                                {service.images.map((img, idx) => (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/50 hover:shadow-lg transition-all cursor-pointer group">
                                        <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="prose max-w-none dark:prose-invert">
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 not-prose">
                            <span className="w-1 h-6 bg-primary rounded-full"></span>
                            Mô tả chi tiết
                        </h3>
                        <div className="bg-card rounded-xl p-6 border shadow-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                            {service.description || "Chưa có mô tả chi tiết cho dịch vụ này."}
                        </div>
                    </div>

                    {/* Facilities & Amenities */}
                    {(service.facilities?.length || 0) > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Tiện nghi & Dịch vụ
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {service.facilities?.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-secondary hover:bg-secondary/50 transition-colors">
                                        <div className="h-2 w-2 rounded-full bg-primary/60"></div>
                                        <span className="font-medium text-sm">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Room Types */}
                    {service.roomTypes && service.roomTypes.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <span className="w-1 h-6 bg-primary rounded-full"></span>
                                Các loại phòng / Vé
                            </h3>
                            <div className="grid gap-4">
                                {service.roomTypes.map((room, idx) => (
                                    <Card key={idx} className="overflow-hidden border-border/60 hover:border-primary/50 transition-colors">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Room Image - Placeholder or real if available */}
                                            <div className="w-full md:w-48 h-48 md:h-auto bg-muted relative shrink-0">
                                                {room.images && room.images.length > 0 ? (
                                                    <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                                        <span className="text-xs">No Image</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 p-6 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-lg">{room.name}</h4>
                                                        <p className="text-xl font-bold text-blue-600">
                                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}
                                                        </p>
                                                    </div>
                                                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                                        {room.description || "Không có mô tả thêm"}
                                                    </p>
                                                    {room.amenities && room.amenities.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {room.amenities.map((amenity, i) => (
                                                                <Badge key={i} variant="secondary" className="text-xs font-normal bg-secondary/50">
                                                                    {amenity}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    <Card className="sticky top-6 border-border/60 shadow-lg shadow-primary/5 overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-primary to-blue-600"></div>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Thông tin giá</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Giá tham khảo từ</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-extrabold text-blue-600">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        /{service.type === 'hotel' ? 'đêm' : 'vé'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-dashed">
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        Bao gồm
                                    </h4>
                                    {service.inclusions && service.inclusions.length > 0 ? (
                                        <ul className="space-y-2">
                                            {service.inclusions.map((item, idx) => (
                                                <li key={idx} className="text-sm text-foreground/80 flex items-start gap-2">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic pl-6">Chưa cập nhật thông tin</p>
                                    )}
                                </div>

                                {service.exclusions && service.exclusions.length > 0 && (
                                    <div className="space-y-3 pt-2">
                                        <h4 className="font-semibold text-sm flex items-center gap-2">
                                            <XIcon className="h-4 w-4 text-red-500" />
                                            Không bao gồm
                                        </h4>
                                        <ul className="space-y-2">
                                            {service.exclusions.map((item, idx) => (
                                                <li key={idx} className="text-sm text-foreground/80 flex items-start gap-2">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 mt-2 space-y-3">
                                <Button
                                    className="w-full font-bold h-12 text-base shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                                    size="lg"
                                    onClick={() => navigate(`/dashboard/services/edit/${id}`)}
                                >
                                    <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa dịch vụ
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                                            <Trash2 className="mr-2 h-4 w-4" /> Xóa dịch vụ
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Hành động này không thể hoàn tác. Dịch vụ này sẽ bị xóa vĩnh viễn khỏi hệ thống.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                                                Xóa dịch vụ
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>

                                <p className="text-xs text-center text-muted-foreground mt-1">
                                    Quản lý và cập nhật thông tin dịch vụ của bạn
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Address Card if Hotel */}
                    {service.type === 'hotel' && service.address && (
                        <Card className="border-border/60">
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shrink-0">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-1">Địa chỉ</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{service.address}</p>
                                    <p className="text-xs text-blue-500 font-medium mt-2 hover:underline cursor-pointer">Xem trên bản đồ</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
