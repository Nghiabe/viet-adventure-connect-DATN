
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Search, Hotel, Plane, Train, Bus, MapPin, Calendar, Star, Filter, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X } from 'lucide-react';

// Mock Data Types
type ServiceType = 'hotel' | 'flight' | 'train' | 'bus';

interface ServiceItem {
    _id?: string; // MongoDB ID
    id?: string; // Legacy ID
    type: ServiceType;
    name: string;
    price: number;
    location?: string; // For hotels (display location legacy)
    address?: string; // Detailed address
    route?: string; // For transport (e.g. Hanoi -> Sapa)
    rating: number;
    status: 'active' | 'inactive';
    image: string; // Thumbnail
    images?: string[]; // Gallery
    description?: string;
    inclusions?: string[];
    exclusions?: string[];
    roomTypes?: {
        name: string;
        price: number;
        description?: string;
    }[];
}

const MOCK_SERVICES: ServiceItem[] = [];

export default function PartnerServicesPage() {
    const [activeTab, setActiveTab] = useState<ServiceType>('hotel');
    const [searchTerm, setSearchTerm] = useState('');
    const [services, setServices] = useState<ServiceItem[]>(MOCK_SERVICES);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [newItem, setNewItem] = useState<Partial<ServiceItem>>({
        name: '',
        price: 0,
        location: '',
        address: '',
        route: '',
        image: '',
        images: [],
        description: '',
        inclusions: [],
        exclusions: [],
        roomTypes: []
    });

    // Helper for array inputs (images, inclusions)
    const [tempImage, setTempImage] = useState('');
    const [tempInclusion, setTempInclusion] = useState('');
    const [tempRoom, setTempRoom] = useState({ name: '', price: 0 });
    const [destinations, setDestinations] = useState<any[]>([]);

    useEffect(() => {
        fetchServices();
        fetchDestinations();
    }, []);

    const fetchDestinations = async () => {
        try {
            const res = await apiClient.get('/partner/destinations') as any;
            if (res.success) {
                setDestinations(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch destinations:', error);
        }
    };

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/partner/services') as any;
            if (res.success) {
                setServices(res.data);
            }
        } catch (error) {
            console.error('Failed to fetch services:', error);
            toast.error('Không thể tải danh sách dịch vụ');
        } finally {
            setLoading(false);
        }
    };

    const addArrayItem = (field: 'images' | 'inclusions' | 'roomTypes', value?: string) => {
        if (field === 'images') {
            const val = value || tempImage;
            if (val) {
                setNewItem({ ...newItem, images: [...(newItem.images || []), val] });
                setTempImage('');
            }
        }
        if (field === 'inclusions' && tempInclusion) {
            setNewItem({ ...newItem, inclusions: [...(newItem.inclusions || []), tempInclusion] });
            setTempInclusion('');
        }
        if (field === 'roomTypes' && tempRoom.name && tempRoom.price) {
            setNewItem({ ...newItem, roomTypes: [...(newItem.roomTypes || []), { ...tempRoom }] });
            setTempRoom({ name: '', price: 0 });
        }
    };

    const removeArrayItem = (field: 'images' | 'inclusions' | 'roomTypes', index: number) => {
        if (field === 'images') {
            const updated = [...(newItem.images || [])];
            updated.splice(index, 1);
            setNewItem({ ...newItem, images: updated });
        }
        if (field === 'inclusions') {
            const updated = [...(newItem.inclusions || [])];
            updated.splice(index, 1);
            setNewItem({ ...newItem, inclusions: updated });
        }
        if (field === 'roomTypes') {
            const updated = [...(newItem.roomTypes || [])];
            updated.splice(index, 1);
            setNewItem({ ...newItem, roomTypes: updated });
        }
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                return data.url;
            } else {
                toast.error('Upload failed: ' + data.error);
                return null;
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload error');
            return null;
        }
    };

    const ImageDropzone = ({ onUpload, className, compact = false }: { onUpload: (url: string) => void, className?: string, compact?: boolean }) => {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            accept: { 'image/*': [] },
            multiple: false,
            onDrop: async (acceptedFiles) => {
                const file = acceptedFiles[0];
                if (file) {
                    const toastId = toast.loading('Đang tải ảnh lên...');
                    const url = await uploadFile(file);
                    toast.dismiss(toastId);
                    if (url) {
                        onUpload(url);
                        toast.success('Đã tải ảnh lên');
                    }
                }
            }
        });

        return (
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ease-in-out
                    flex flex-col items-center justify-center text-center
                    ${isDragActive ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50'}
                    ${className}
                `}
            >
                <input {...getInputProps()} />
                <div className={`flex flex-col items-center gap-2 p-4 ${compact ? 'py-2' : 'py-6'}`}>
                    <div className={`p-3 rounded-full bg-background shadow-sm ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}>
                        <UploadCloud className={compact ? "h-4 w-4" : "h-6 w-6"} />
                    </div>
                    {!compact && (
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Tải ảnh lên</p>
                            <p className="text-xs text-muted-foreground">Kéo thả hoặc click để chọn</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const filteredServices = services.filter(
        (s) => s.type === activeTab && s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddService = async () => {
        if (!newItem.name || !newItem.price) {
            toast.error('Vui lòng nhập tên và giá dịch vụ');
            return;
        }

        try {
            const payload = {
                ...newItem,
                type: activeTab,
                price: Number(newItem.price),
                // Use random placeholder if no image provided
                image: newItem.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000'
            };

            const res = await apiClient.post('/partner/services', payload) as any;
            if (res.success) {
                toast.success('Thêm dịch vụ thành công');
                setServices([res.data, ...services]);
                setIsAddDialogOpen(false);
                setNewItem({ name: '', price: 0, location: '', route: '', image: '' });
            } else {
                toast.error(res.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Error adding service:', error);
            toast.error('Không thể thêm dịch vụ');
        }
    };

    const handleViewDetail = (id: string) => {
        navigate(`/dashboard/services/${id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dịch vụ của tôi</h1>
                    <p className="text-muted-foreground">Quản lý khách sạn, vé máy bay, tàu hỏa và xe khách</p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Thêm dịch vụ
                </Button>
            </div>

            <Tabs defaultValue="hotel" value={activeTab} onValueChange={(val) => setActiveTab(val as ServiceType)} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="hotel"><Hotel className="mr-2 h-4 w-4" /> Hotel</TabsTrigger>
                    <TabsTrigger value="flight"><Plane className="mr-2 h-4 w-4" /> Flight</TabsTrigger>
                    <TabsTrigger value="train"><Train className="mr-2 h-4 w-4" /> Train</TabsTrigger>
                    <TabsTrigger value="bus"><Bus className="mr-2 h-4 w-4" /> Bus</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 mb-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Tìm kiếm dịch vụ..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                <TabsContent value={activeTab} className="space-y-4">
                    {filteredServices.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredServices.map((service) => (
                                <Card key={service._id || service.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                    <div className="relative h-48 w-full">
                                        <img
                                            src={service.image}
                                            alt={service.name}
                                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <Badge variant={service.status === 'active' ? 'default' : 'secondary'} className={service.status === 'active' ? 'bg-green-500' : ''}>
                                                {service.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardHeader className="p-4 pb-2">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-xl line-clamp-1" title={service.name}>{service.name}</CardTitle>
                                            <div className="flex items-center text-yellow-500 text-sm font-bold">
                                                {service.rating > 0 ? (
                                                    <>
                                                        <Star className="h-3 w-3 fill-current mr-1" />
                                                        {service.rating}
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs font-normal italic">Chưa có đánh giá</span>
                                                )}
                                            </div>
                                        </div>
                                        <CardDescription className="flex items-center mt-1">
                                            {service.type === 'hotel' ? <MapPin className="h-3 w-3 mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                                            {service.location || service.route}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="text-lg font-extrabold text-blue-600">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                                                <span className="text-xs font-normal text-muted-foreground ml-1">/{service.type === 'hotel' ? 'đêm' : 'vé'}</span>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetail(service._id || service.id || '')}>Chi tiết</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-8 border-2 border-dashed rounded-lg">
                            <div className="bg-muted/50 p-4 rounded-full mb-4">
                                {activeTab === 'hotel' && <Hotel className="h-8 w-8 text-muted-foreground" />}
                                {activeTab === 'flight' && <Plane className="h-8 w-8 text-muted-foreground" />}
                                {activeTab === 'train' && <Train className="h-8 w-8 text-muted-foreground" />}
                                {activeTab === 'bus' && <Bus className="h-8 w-8 text-muted-foreground" />}
                            </div>
                            <h3 className="text-lg font-medium">Chưa có dịch vụ nào</h3>
                            <p className="text-muted-foreground mt-1 mb-4">Bắt đầu bằng cách thêm dịch vụ mới vào danh mục này.</p>
                            <Button onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> Thêm mới ngay
                            </Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Add Service Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Thêm Dịch Vụ Mới</DialogTitle>
                        <DialogDescription>
                            Tạo dịch vụ mới cho danh mục <span className="font-semibold uppercase">{activeTab}</span>.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[60vh] pr-4 -mr-4">
                        <div className="grid gap-6 px-1">
                            {/* Main Info Section */}
                            <div className="grid gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Tên dịch vụ <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="name"
                                            placeholder={activeTab === 'hotel' ? "VD: Khách sạn Mường Thanh" : activeTab === 'flight' ? "VD: Chuyến bay VN123" : activeTab === 'train' ? "VD: Chuyến tàu VN123" : "VD: Chuyến bus VN 123"}
                                            value={newItem.name}
                                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Giá cơ bản (VND) <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            placeholder="0"
                                            value={newItem.price || ''}
                                            onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="desc">Mô tả dịch vụ</Label>
                                    <Textarea
                                        id="desc"
                                        placeholder="Mô tả chi tiết về dịch vụ, tiện ích nổi bật..."
                                        className="resize-none min-h-[100px]"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">Hình ảnh & Media</h3>
                                <div className="grid gap-6">
                                    <div className="space-y-2">
                                        <Label>Ảnh đại diện (Cover)</Label>
                                        {newItem.image ? (
                                            <div className="relative w-full h-48 rounded-xl overflow-hidden border shadow-sm group">
                                                <img src={newItem.image} alt="Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => setNewItem({ ...newItem, image: '' })}
                                                        className="h-8 px-3"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-1" /> Xóa ảnh
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <ImageDropzone onUpload={(url) => setNewItem({ ...newItem, image: url })} className="h-32" />
                                        )}
                                    </div>

                                    {activeTab === 'hotel' && (
                                        <div className="space-y-2">
                                            <Label>Thư viện ảnh (Gallery)</Label>
                                            <div className="grid grid-cols-4 gap-3">
                                                {newItem.images?.map((img, idx) => (
                                                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                                                        <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                                                        <button
                                                            onClick={() => removeArrayItem('images', idx)}
                                                            className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <ImageDropzone
                                                    onUpload={(url) => addArrayItem('images', url)}
                                                    className="aspect-square"
                                                    compact
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Type Specific Fields */}
                            {activeTab === 'hotel' ? (
                                <>
                                    <div className="border-t pt-4">
                                        <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">Thông tin chi tiết</h3>
                                        <div className="grid gap-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="address">Địa chỉ chi tiết</Label>
                                                    <Input
                                                        id="address"
                                                        placeholder="Số nhà, tên đường..."
                                                        value={newItem.address}
                                                        onChange={(e) => setNewItem({ ...newItem, address: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="location">Khu vực / Thành phố</Label>
                                                    <Select
                                                        value={newItem.location}
                                                        onValueChange={(value) => setNewItem({ ...newItem, location: value })}
                                                    >
                                                        <SelectTrigger id="location">
                                                            <SelectValue placeholder="Chọn khu vực / thành phố" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {destinations.map((dest) => (
                                                                <SelectItem key={dest._id} value={dest.name}>
                                                                    {dest.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Tiện ích & Bao gồm</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Thêm tiện ích (VD: Wifi, Hồ bơi...)"
                                                        value={tempInclusion}
                                                        onChange={(e) => setTempInclusion(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('inclusions'))}
                                                        className="flex-1"
                                                    />
                                                    <Button type="button" onClick={() => addArrayItem('inclusions')} variant="secondary">
                                                        <Plus className="h-4 w-4 mr-1" /> Thêm
                                                    </Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {newItem.inclusions?.map((inc, idx) => (
                                                        <Badge key={idx} variant="outline" className="pl-2 pr-1 py-1 gap-1 text-sm font-normal">
                                                            {inc}
                                                            <div
                                                                className="cursor-pointer hover:bg-muted p-0.5 rounded-full"
                                                                onClick={() => removeArrayItem('inclusions', idx)}
                                                            >
                                                                <X className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        </Badge>
                                                    ))}
                                                    {(!newItem.inclusions || newItem.inclusions.length === 0) && (
                                                        <span className="text-sm text-muted-foreground italic">Chưa có tiện ích nào</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Room Types */}
                                    <div className="border-t pt-4">
                                        <h3 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">Loại phòng (Room Types)</h3>

                                        <div className="bg-muted/30 rounded-xl p-4 border space-y-4">
                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                <div className="col-span-7 space-y-1.5">
                                                    <Label className="text-xs">Tên loại phòng</Label>
                                                    <Input
                                                        placeholder="VD: Deluxe King Room"
                                                        value={tempRoom.name}
                                                        onChange={(e) => setTempRoom({ ...tempRoom, name: e.target.value })}
                                                        className="bg-background"
                                                    />
                                                </div>
                                                <div className="col-span-4 space-y-1.5">
                                                    <Label className="text-xs">Giá mỗi đêm</Label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={tempRoom.price || ''}
                                                        onChange={(e) => setTempRoom({ ...tempRoom, price: Number(e.target.value) })}
                                                        className="bg-background"
                                                    />
                                                </div>
                                                <div className="col-span-1">
                                                    <Button type="button" size="icon" className="w-full" onClick={() => addArrayItem('roomTypes')}>
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                {newItem.roomTypes?.map((room, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-3 bg-background border rounded-lg shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                <Hotel className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-sm">{room.name}</div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => removeArrayItem('roomTypes', idx)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {(!newItem.roomTypes || newItem.roomTypes.length === 0) && (
                                                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                                        <p className="text-sm">Chưa có loại phòng nào</p>
                                                        <p className="text-xs opacity-70">Thêm loại phòng ở trên để bắt đầu</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2 pt-2">
                                    <Label>Tuyến đường <span className="text-red-500">*</span></Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Điểm đi</Label>
                                            <Select
                                                value={newItem.route?.split(' - ')[0] || ''}
                                                onValueChange={(val) => {
                                                    const currentArr = newItem.route?.split(' - ')[1] || '';
                                                    setNewItem({ ...newItem, route: `${val} - ${currentArr}` });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn điểm đi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {destinations.map((d) => (
                                                        <SelectItem key={`from-${d._id}`} value={d.name}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground">Điểm đến</Label>
                                            <Select
                                                value={newItem.route?.split(' - ')[1] || ''}
                                                onValueChange={(val) => {
                                                    const currentDep = newItem.route?.split(' - ')[0] || '';
                                                    setNewItem({ ...newItem, route: `${currentDep} - ${val}` });
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn điểm đến" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {destinations.map((d) => (
                                                        <SelectItem key={`to-${d._id}`} value={d.name}>{d.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {newItem.route && !newItem.route.includes(' - ') && (
                                        <p className="text-xs text-red-500">Vui lòng chọn cả điểm đi và điểm đến</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Chọn điểm đi và điểm đến từ danh sách có sẵn.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleAddService}>Lưu dịch vụ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
