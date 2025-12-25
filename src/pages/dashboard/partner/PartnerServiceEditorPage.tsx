import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import apiClient from '@/services/apiClient';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Hotel, Plane, Train, Bus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDropzone } from 'react-dropzone';
import { Loader2 } from 'lucide-react';

interface ServiceItem {
    _id?: string;
    id?: string; // Legacy
    type: 'hotel' | 'flight' | 'train' | 'bus';
    name: string;
    price: number;
    location?: string;
    address?: string;
    route?: string;
    rating: number; // usually read-only or managed separately
    status: 'active' | 'inactive';
    image: string;
    images: string[];
    description?: string;
    facilities: string[];
    inclusions: string[];
    exclusions: string[];
    roomTypes: {
        name: string;
        price: number;
        description?: string;
        amenities?: string[];
        images?: string[];
    }[];
}

export default function PartnerServiceEditorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === 'new';
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [destinations, setDestinations] = useState<any[]>([]);

    const [service, setService] = useState<ServiceItem>({
        type: 'hotel',
        name: '',
        price: 0,
        status: 'active',
        image: '',
        images: [],
        rating: 0,
        facilities: [],
        inclusions: [],
        exclusions: [],
        roomTypes: []
    });

    // Helper state for adding array items
    const [tempFacility, setTempFacility] = useState('');
    const [tempInclusion, setTempInclusion] = useState('');
    const [tempExclusion, setTempExclusion] = useState('');

    // Helper state for adding room types
    const [newRoom, setNewRoom] = useState({ name: '', price: 0, description: '' });

    useEffect(() => {
        fetchDestinations();
        if (!isNew && id) {
            fetchService(id);
        }
    }, [id, isNew]);

    const fetchDestinations = async () => {
        try {
            const res = await apiClient.get('/partner/destinations') as any;
            if (res.success) setDestinations(res.data);
        } catch (error) {
            console.error('Failed to fetch destinations:', error);
        }
    };

    const fetchService = async (serviceId: string) => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/partner/services/${serviceId}`) as any;
            if (res.success) {
                // Ensure arrays are initialized
                const data = res.data;
                setService({
                    ...data,
                    images: data.images || [],
                    facilities: data.facilities || [],
                    inclusions: data.inclusions || [],
                    exclusions: data.exclusions || [],
                    roomTypes: data.roomTypes || []
                });
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

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            return data.success ? data.url : null;
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    };

    const ImageUploader = ({ onUpload, currentImage, className }: { onUpload: (url: string) => void, currentImage?: string, className?: string }) => {
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
                    } else {
                        toast.error('Tải ảnh thất bại');
                    }
                }
            }
        });

        if (currentImage) {
            return (
                <div className={`relative group rounded-lg overflow-hidden border ${className}`}>
                    <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="destructive" size="sm" onClick={() => onUpload('')}>Xóa ảnh</Button>
                    </div>
                </div>
            );
        }

        return (
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors ${className} ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'}`}>
                <input {...getInputProps()} />
                <div className="text-center p-4">
                    <p className="text-sm text-muted-foreground">Tải ảnh lên</p>
                </div>
            </div>
        );
    };

    const handleSave = async () => {
        if (!service.name || !service.price) {
            toast.error('Vui lòng nhập tên và giá dịch vụ');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...service,
                // Ensure number types
                price: Number(service.price),
                rating: Number(service.rating || 0),
                roomTypes: service.roomTypes.map(r => ({ ...r, price: Number(r.price) }))
            };

            const endpoint = isNew ? '/partner/services' : `/partner/services/${id}`;
            const method = isNew ? 'post' : 'put';

            const res = await (apiClient as any)[method](endpoint, payload);

            if (res.success) {
                toast.success(isNew ? 'Thêm dịch vụ thành công' : 'Cập nhật dịch vụ thành công');
                navigate('/dashboard/services');
            } else {
                toast.error(res.error || 'Có lỗi xảy ra');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Lỗi lưu dữ liệu');
        } finally {
            setSaving(false);
        }
    };

    // Array manipulation helpers
    const addArrayItem = (field: keyof ServiceItem, value: string, setter: (v: string) => void) => {
        if (!value.trim()) return;
        setService(prev => ({ ...prev, [field]: [...(prev[field] as string[]), value] }));
        setter('');
    };

    const removeArrayItem = (field: keyof ServiceItem, index: number) => {
        setService(prev => ({
            ...prev,
            [field]: (prev[field] as string[]).filter((_, i) => i !== index)
        }));
    };

    const addRoomType = () => {
        if (!newRoom.name || !newRoom.price) {
            toast.error('Vui lòng nhập tên và giá phòng');
            return;
        }
        setService(prev => ({
            ...prev,
            roomTypes: [...(prev.roomTypes || []), { ...newRoom }]
        }));
        setNewRoom({ name: '', price: 0, description: '' });
    };

    const removeRoomType = (index: number) => {
        setService(prev => ({
            ...prev,
            roomTypes: (prev.roomTypes || []).filter((_, i) => i !== index)
        }));
    };

    if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-5xl mx-auto pb-10 space-y-6">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
                    <h1 className="text-xl font-bold">{isNew ? 'Thêm dịch vụ mới' : 'Chỉnh sửa dịch vụ'}</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>Hủy</Button>
                    <Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tên dịch vụ <span className="text-red-500">*</span></Label>
                                <Input value={service.name} onChange={e => setService({ ...service, name: e.target.value })} placeholder="VD: Khách sạn Mường Thanh" />
                            </div>
                            <div className="space-y-2">
                                <Label>Loại dịch vụ</Label>
                                <Select value={service.type} onValueChange={(v: any) => setService({ ...service, type: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hotel"><div className="flex items-center"><Hotel className="mr-2 h-4 w-4" /> Khách sạn</div></SelectItem>
                                        <SelectItem value="flight"><div className="flex items-center"><Plane className="mr-2 h-4 w-4" /> Chuyến bay</div></SelectItem>
                                        <SelectItem value="train"><div className="flex items-center"><Train className="mr-2 h-4 w-4" /> Tàu hỏa</div></SelectItem>
                                        <SelectItem value="bus"><div className="flex items-center"><Bus className="mr-2 h-4 w-4" /> Xe khách</div></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Mô tả chi tiết</Label>
                            <Textarea value={service.description} onChange={e => setService({ ...service, description: e.target.value })} className="min-h-[150px]" placeholder="Mô tả về dịch vụ của bạn..." />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Giá cơ bản (VND) <span className="text-red-500">*</span></Label>
                                <Input type="number" value={service.price} onChange={e => setService({ ...service, price: Number(e.target.value) })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Trạng thái</Label>
                                <Select value={service.status} onValueChange={(v: any) => setService({ ...service, status: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Hoạt động</SelectItem>
                                        <SelectItem value="inactive">Tạm ẩn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </Card>

                    {service.type === 'hotel' && (
                        <Card className="p-6 space-y-4">
                            <h3 className="font-semibold text-lg">Địa điểm & Tiện ích</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Khu vực / Thành phố</Label>
                                    <Select value={service.location} onValueChange={v => setService({ ...service, location: v })}>
                                        <SelectTrigger><SelectValue placeholder="Chọn địa điểm" /></SelectTrigger>
                                        <SelectContent>
                                            {destinations.map(d => <SelectItem key={d._id} value={d.name}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Địa chỉ chi tiết</Label>
                                    <Input value={service.address} onChange={e => setService({ ...service, address: e.target.value })} placeholder="Số nhà, đường..." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Tiện nghi (Facilities)</Label>
                                <div className="flex gap-2">
                                    <Input value={tempFacility} onChange={e => setTempFacility(e.target.value)} placeholder="VD: Wifi, Hồ bơi..." onKeyDown={e => e.key === 'Enter' && addArrayItem('facilities', tempFacility, setTempFacility)} />
                                    <Button type="button" onClick={() => addArrayItem('facilities', tempFacility, setTempFacility)}>Thêm</Button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {service.facilities?.map((item, idx) => (
                                        <Badge key={idx} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                            {item} <Trash2 className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeArrayItem('facilities', idx)} />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    )}

                    {service.type === 'hotel' && (
                        <Card className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-lg">Các loại phòng</h3>
                            </div>

                            <div className="grid gap-4 p-4 border rounded-lg bg-muted/20">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input placeholder="Tên phòng (VD: Deluxe King)" value={newRoom.name} onChange={e => setNewRoom({ ...newRoom, name: e.target.value })} />
                                    <Input type="number" placeholder="Giá phòng" value={newRoom.price || ''} onChange={e => setNewRoom({ ...newRoom, price: Number(e.target.value) })} />
                                </div>
                                <Input placeholder="Mô tả ngắn" value={newRoom.description} onChange={e => setNewRoom({ ...newRoom, description: e.target.value })} />
                                <Button type="button" variant="secondary" onClick={addRoomType} className="w-full">Thêm loại phòng</Button>
                            </div>

                            <div className="space-y-3">
                                {service.roomTypes?.map((room, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 border rounded-lg bg-card">
                                        <div>
                                            <p className="font-medium">{room.name}</p>
                                            <p className="text-sm text-muted-foreground">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.price)}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => removeRoomType(idx)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Hình ảnh</h3>
                        <div className="space-y-2">
                            <Label>Ảnh đại diện (Cover)</Label>
                            <ImageUploader currentImage={service.image} onUpload={(url) => setService({ ...service, image: url })} className="aspect-video" />
                        </div>
                        <div className="space-y-2">
                            <Label>Thư viện ảnh</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {service.images?.map((img, idx) => (
                                    <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Trash2 className="text-white h-4 w-4 cursor-pointer" onClick={() => removeArrayItem('images', idx)} />
                                        </div>
                                    </div>
                                ))}
                                <ImageUploader onUpload={(url) => addArrayItem('images', url, () => { })} className="aspect-square" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-4">
                        <h3 className="font-semibold text-lg">Thông tin thêm</h3>
                        <div className="space-y-2">
                            <Label>Bao gồm (Inclusions)</Label>
                            <div className="flex gap-2">
                                <Input value={tempInclusion} onChange={e => setTempInclusion(e.target.value)} placeholder="Thêm mục..." onKeyDown={e => e.key === 'Enter' && addArrayItem('inclusions', tempInclusion, setTempInclusion)} />
                                <Button type="button" size="icon" onClick={() => addArrayItem('inclusions', tempInclusion, setTempInclusion)}><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {service.inclusions?.map((item, idx) => (
                                    <Badge key={idx} variant="outline" className="pl-2 pr-1 py-1 flex items-center gap-1">
                                        {item} <Trash2 className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeArrayItem('inclusions', idx)} />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Không bao gồm (Exclusions)</Label>
                            <div className="flex gap-2">
                                <Input value={tempExclusion} onChange={e => setTempExclusion(e.target.value)} placeholder="Thêm mục..." onKeyDown={e => e.key === 'Enter' && addArrayItem('exclusions', tempExclusion, setTempExclusion)} />
                                <Button type="button" size="icon" onClick={() => addArrayItem('exclusions', tempExclusion, setTempExclusion)}><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {service.exclusions?.map((item, idx) => (
                                    <Badge key={idx} variant="outline" className="pl-2 pr-1 py-1 flex items-center gap-1 border-red-200 bg-red-50 text-red-900">
                                        {item} <Trash2 className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeArrayItem('exclusions', idx)} />
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
