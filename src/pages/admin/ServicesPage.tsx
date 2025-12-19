
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    MoreVertical,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    Hotel,
    Plane,
    Train,
    Bus,
    MapPin,
    Star
} from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';

// Mock Data Types
type ServiceType = 'hotel' | 'flight' | 'train' | 'bus';

interface ServiceItem {
    id: string;
    type: ServiceType;
    name: string;
    provider: {
        id: string;
        name: string;
    };
    price: number;
    location?: string;
    route?: string;
    rating: number;
    reviewCount: number;
    totalBookings: number;
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
}

// Mock Data
const MOCK_SERVICES: ServiceItem[] = [
    {
        id: '1',
        type: 'hotel',
        name: 'Sapa Horizon Hotel',
        provider: { id: 'p1', name: 'Sapa Tourism' },
        price: 1200000,
        location: 'Sapa, Lao Cai',
        rating: 4.8,
        reviewCount: 120,
        totalBookings: 450,
        status: 'active',
        createdAt: '2023-10-15T08:00:00Z'
    },
    {
        id: '2',
        type: 'flight',
        name: 'VJ123: HAN - SGN',
        provider: { id: 'p2', name: 'VietJet Air' },
        price: 1500000,
        route: 'Hanoi -> Ho Chi Minh',
        rating: 4.2,
        reviewCount: 85,
        totalBookings: 1200,
        status: 'active',
        createdAt: '2023-11-01T10:30:00Z'
    },
    {
        id: '3',
        type: 'hotel',
        name: 'Ha Long Bay Resort',
        provider: { id: 'p3', name: 'Ha Long Services' },
        price: 2500000,
        location: 'Ha Long, Quang Ninh',
        rating: 4.5,
        reviewCount: 50,
        totalBookings: 200,
        status: 'pending', // Waiting for approval
        createdAt: '2023-12-05T09:15:00Z'
    },
    {
        id: '4',
        type: 'train',
        name: 'SE1: Hanoi - Sapa',
        provider: { id: 'p4', name: 'Vietnam Railways' },
        price: 500000,
        route: 'Hanoi -> Lao Cai',
        rating: 4.0,
        reviewCount: 300,
        totalBookings: 800,
        status: 'inactive',
        createdAt: '2023-09-20T14:45:00Z'
    }
];

function StatusBadge({ status }: { status: string }) {
    const styles = {
        active: 'bg-green-100 text-green-700',
        inactive: 'bg-gray-100 text-gray-700',
        pending: 'bg-yellow-100 text-yellow-700'
    };
    const labels = {
        active: 'Hoạt động',
        inactive: 'Ngừng hoạt động',
        pending: 'Chờ duyệt'
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}

function ServiceIcon({ type }: { type: ServiceType }) {
    switch (type) {
        case 'hotel': return <Hotel className="h-4 w-4 text-blue-500" />;
        case 'flight': return <Plane className="h-4 w-4 text-sky-500" />;
        case 'train': return <Train className="h-4 w-4 text-orange-500" />;
        case 'bus': return <Bus className="h-4 w-4 text-purple-500" />;
        default: return <MapPin className="h-4 w-4" />;
    }
}

export default function ServicesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const navigate = useQueryClient(); // Just for mock hydration if needed

    // Filter data (Mocking API behavior)
    const filteredServices = MOCK_SERVICES.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.provider.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
        const matchesType = typeFilter === 'all' || service.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const currentServices = filteredServices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleDelete = (id: string) => {
        toast.success(`Dịch vụ ${id} đã được xóa (Demo)`);
    };

    const handleApprove = (id: string) => {
        toast.success(`Dịch vụ ${id} đã được duyệt (Demo)`);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý Dịch vụ</h1>
                    <p className="text-muted-foreground">Kiểm duyệt và quản lý các dịch vụ (Khách sạn, Vé xe, ...)</p>
                </div>
                <div className="flex gap-2">
                    <Button>Thêm Dịch vụ</Button>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2 min-w-[300px]">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm dịch vụ, nhà cung cấp..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                        />
                    </div>

                    <select
                        className="bg-background border border-border rounded px-3 py-2 text-sm"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="all">Tất cả loại hình</option>
                        <option value="hotel">Khách sạn</option>
                        <option value="flight">Vé máy bay</option>
                        <option value="train">Tàu hỏa</option>
                        <option value="bus">Xe khách</option>
                    </select>

                    <select
                        className="bg-background border border-border rounded px-3 py-2 text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="inactive">Dừng hoạt động</option>
                    </select>

                    <Button variant="outline" onClick={() => { setSearchTerm(''); setTypeFilter('all'); setStatusFilter('all'); }}>
                        Xóa bộ lọc
                    </Button>
                </div>
            </Card>

            {/* Data Table */}
            <Card className="bg-card border border-border p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-secondary/60">
                            <tr>
                                <th className="p-3 text-left font-medium">Dịch vụ</th>
                                <th className="p-3 text-left font-medium">Nhà cung cấp</th>
                                <th className="p-3 text-left font-medium">Chi tiết</th>
                                <th className="p-3 text-right font-medium">Giá</th>
                                <th className="p-3 text-center font-medium">Đánh giá</th>
                                <th className="p-3 text-center font-medium">Bookings</th>
                                <th className="p-3 text-center font-medium">Trạng thái</th>
                                <th className="p-3 text-center font-medium">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentServices.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-muted-foreground">Không tìm thấy dịch vụ nào</td>
                                </tr>
                            ) : (
                                currentServices.map((service) => (
                                    <tr key={service.id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-secondary rounded flex items-center justify-center">
                                                    <ServiceIcon type={service.type} />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{service.name}</div>
                                                    <div className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                                        {service.type} <span className="text-[10px] bg-slate-100 px-1 rounded">ID: {service.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="text-sm">{service.provider.name}</div>
                                            <div className="text-xs text-muted-foreground">ID: {service.provider.id}</div>
                                        </td>
                                        <td className="p-3">
                                            <div className="text-sm">
                                                {service.type === 'hotel' ? (
                                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {service.location}</span>
                                                ) : (
                                                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {service.route}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-bold text-primary">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-1 text-yellow-500 font-bold">
                                                <Star className="h-3 w-3 fill-current" /> {service.rating}
                                            </div>
                                            <div className="text-xs text-muted-foreground text-center">({service.reviewCount})</div>
                                        </td>
                                        <td className="p-3 text-center font-medium">
                                            {service.totalBookings}
                                        </td>
                                        <td className="p-3 text-center">
                                            <StatusBadge status={service.status} />
                                        </td>
                                        <td className="p-3 text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleApprove(service.id)}>Duyệt / Kích hoạt</DropdownMenuItem>
                                                    <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-500"
                                                        onClick={() => handleDelete(service.id)}
                                                    >
                                                        Xóa
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                            Trang {currentPage} của {totalPages} ({filteredServices.length} dịch vụ)
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
