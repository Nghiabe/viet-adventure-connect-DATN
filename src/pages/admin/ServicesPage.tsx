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
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';

// Types
type ServiceType = 'hotel' | 'flight' | 'train' | 'bus';

interface ServiceItem {
    _id: string; // MongoDB ID uses _id
    type: ServiceType;
    name: string;
    owner: {
        _id: string;
        name: string;
    };
    price: number;
    location?: string;
    route?: string;
    rating: number;
    reviewCount?: number; // Optional in model but good for UI
    totalBookings?: number; // Calculated or aggregated
    status: 'active' | 'inactive' | 'pending';
    createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        active: 'bg-green-100 text-green-700',
        inactive: 'bg-gray-100 text-gray-700',
        pending: 'bg-yellow-100 text-yellow-700'
    };
    const labels: Record<string, string> = {
        active: 'Hoạt động',
        inactive: 'Ngừng hoạt động',
        pending: 'Chờ duyệt'
    };
    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
            {labels[status] || status}
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
    const queryClient = useQueryClient();

    // Fetch Services
    const { data, isLoading, isError } = useQuery({
        queryKey: ['admin-services', currentPage, itemsPerPage, searchTerm, statusFilter, typeFilter],
        queryFn: () => adminService.getServices({
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            status: statusFilter,
            type: typeFilter
        })
    });

    // Mutations
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
            adminService.updateServiceStatus(id, status),
        onSuccess: () => {
            toast.success('Cập nhật trạng thái thành công');
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
        },
        onError: () => toast.error('Cập nhật thất bại')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminService.deleteService(id),
        onSuccess: () => {
            toast.success('Xóa dịch vụ thành công');
            queryClient.invalidateQueries({ queryKey: ['admin-services'] });
        },
        onError: () => toast.error('Xóa thất bại')
    });

    const handleDelete = (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleApprove = (id: string) => {
        updateStatusMutation.mutate({ id, status: 'active' });
    };

    const handleSuspend = (id: string) => {
        updateStatusMutation.mutate({ id, status: 'inactive' });
    };

    const services: ServiceItem[] = data?.data || [];
    const totalPages = data?.pagination?.pages || 1;
    const totalItems = data?.pagination?.total || 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý Dịch vụ</h1>
                    <p className="text-muted-foreground">Kiểm duyệt và quản lý các dịch vụ (Khách sạn, Vé xe, ...)</p>
                </div>
                {/* <div className="flex gap-2">
                    <Button>Thêm Dịch vụ</Button>
                </div> */}
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
                                {/* <th className="p-3 text-center font-medium">Bookings</th> */}
                                <th className="p-3 text-center font-medium">Trạng thái</th>
                                <th className="p-3 text-center font-medium">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</td>
                                </tr>
                            ) : services.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-muted-foreground">Không tìm thấy dịch vụ nào</td>
                                </tr>
                            ) : (
                                services.map((service) => (
                                    <tr key={service._id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-shrink-0 w-10 h-10 bg-secondary rounded flex items-center justify-center">
                                                    <ServiceIcon type={service.type} />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{service.name}</div>
                                                    <div className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                                                        {service.type} <span className="text-[10px] bg-slate-100 px-1 rounded">ID: {service._id.slice(-6)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="text-sm">{service.owner?.name || 'Unknown'}</div>
                                            {/* <div className="text-xs text-muted-foreground">ID: {service.owner?._id}</div> */}
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
                                                <Star className="h-3 w-3 fill-current" /> {service.rating || 0}
                                            </div>
                                            <div className="text-xs text-muted-foreground text-center">({service.reviewCount || 0})</div>
                                        </td>
                                        {/* <td className="p-3 text-center font-medium">
                                            {service.totalBookings || 0}
                                        </td> */}
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
                                                    {service.status === 'pending' && (
                                                        <DropdownMenuItem onClick={() => handleApprove(service._id)}>
                                                            Duyệt / Kích hoạt
                                                        </DropdownMenuItem>
                                                    )}
                                                    {service.status === 'inactive' && (
                                                        <DropdownMenuItem onClick={() => handleApprove(service._id)}>
                                                            Kích hoạt lại
                                                        </DropdownMenuItem>
                                                    )}
                                                    {service.status === 'active' && (
                                                        <DropdownMenuItem onClick={() => handleSuspend(service._id)} className="text-yellow-600">
                                                            Ngừng hoạt động
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        className="text-red-500"
                                                        onClick={() => handleDelete(service._id)}
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
                            Trang {currentPage} của {totalPages} ({totalItems} dịch vụ)
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
