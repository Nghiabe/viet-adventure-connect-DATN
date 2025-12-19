
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Hotel, Plane, Train, Bus, MapPin, Calendar, Star, Filter } from 'lucide-react';
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

// Mock Data Types
type ServiceType = 'hotel' | 'flight' | 'train' | 'bus';

interface ServiceItem {
    id: string;
    type: ServiceType;
    name: string;
    price: number;
    location?: string; // For hotels
    route?: string; // For transport (e.g. Hanoi -> Sapa)
    rating: number;
    status: 'active' | 'inactive';
    image: string;
}

const MOCK_SERVICES: ServiceItem[] = [
    { id: '1', type: 'hotel', name: 'Sapa Horizon Hotel', price: 1200000, location: 'Sapa, Lao Cai', rating: 4.8, status: 'active', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000' },
    { id: '2', type: 'hotel', name: 'Ha Long Bay Resort', price: 2500000, location: 'Ha Long, Quang Ninh', rating: 4.5, status: 'active', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000' },
    { id: '3', type: 'flight', name: 'VJ123: HAN - SGN', price: 1500000, route: 'Hanoi -> Ho Chi Minh', rating: 4.2, status: 'active', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1000' },
    { id: '4', type: 'train', name: 'SE1: Hanoi - Sapa', price: 500000, route: 'Hanoi -> Lao Cai', rating: 4.0, status: 'active', image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=1000' },
    { id: '5', type: 'bus', name: 'InterBusLines: Sleeper', price: 300000, route: 'Hanoi -> Sapa', rating: 4.3, status: 'inactive', image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=1000' },
];

export default function PartnerServicesPage() {
    const [activeTab, setActiveTab] = useState<ServiceType>('hotel');
    const [searchTerm, setSearchTerm] = useState('');
    const [services, setServices] = useState<ServiceItem[]>(MOCK_SERVICES);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const filteredServices = services.filter(
        (s) => s.type === activeTab && s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddService = () => {
        toast.success('Tính năng đang được phát triển (Backend integration required)');
        setIsAddDialogOpen(false);
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
                                <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
                                                <Star className="h-3 w-3 fill-current mr-1" />
                                                {service.rating}
                                            </div>
                                        </div>
                                        <CardDescription className="flex items-center mt-1">
                                            {service.type === 'hotel' ? <MapPin className="h-3 w-3 mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                                            {service.location || service.route}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="text-lg font-bold text-primary">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                                                <span className="text-xs font-normal text-muted-foreground">/{service.type === 'hotel' ? 'đêm' : 'vé'}</span>
                                            </div>
                                            <Button variant="outline" size="sm">Chi tiết</Button>
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Thêm Dịch Vụ Mới</DialogTitle>
                        <DialogDescription>
                            Tạo dịch vụ mới cho danh mục <span className="font-semibold uppercase">{activeTab}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Tên
                            </Label>
                            <Input id="name" placeholder="Ví dụ: Khách sạn Mường Thanh" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Giá
                            </Label>
                            <Input id="price" type="number" placeholder="0" className="col-span-3" />
                        </div>
                        {activeTab === 'hotel' ? (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="location" className="text-right">
                                    Địa điểm
                                </Label>
                                <Input id="location" placeholder="Địa chỉ chi tiết" className="col-span-3" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="route" className="text-right">
                                    Tuyến đường
                                </Label>
                                <Input id="route" placeholder="VD: Hà Nội - Sapa" className="col-span-3" />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleAddService}>Lưu dịch vụ</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
