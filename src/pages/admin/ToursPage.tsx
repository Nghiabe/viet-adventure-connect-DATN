import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import TableSkeletonLoader from '@/components/ui/TableSkeletonLoader';
import apiClient from '@/services/apiClient';

// Types for the API response
interface TourOwner {
  _id: string;
  name: string;
}

interface TourDestination {
  _id: string;
  name: string;
}

interface Tour {
  _id: string;
  title: string;
  mainImage?: string;
  price: number;
  owner: TourOwner;
  destination: TourDestination;
  averageRating: number;
  reviewCount: number;
  bookingCount: number;
  totalRevenue: number;
  status: 'published' | 'draft' | 'archived';
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalTours: number;
}

interface ToursResponse {
  success: boolean;
  data: {
    tours: Tour[];
    pagination: PaginationInfo;
  };
}

function StatusTag({ status }: { status: 'published'|'draft'|'archived' }) {
  const statusConfig = {
    published: { bg: 'bg-green-500/20', text: 'text-green-300', label: 'Đã xuất bản' },
    draft: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Bản nháp' },
    archived: { bg: 'bg-gray-500/20', text: 'text-gray-300', label: 'Đã lưu trữ' }
  };
  
  const config = statusConfig[status];
  return (
    <span className={`px-2 py-1 rounded text-xs ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-red-500 text-lg font-medium">Lỗi tải dữ liệu</div>
      <div className="text-muted-foreground mt-2">{message}</div>
    </div>
  );
}

function Pagination({ pagination, onPageChange }: { 
  pagination: PaginationInfo; 
  onPageChange: (page: number) => void;
}) {
  const { currentPage, totalPages } = pagination;
  
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  
  const pageNumbers = [];
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
      <div className="text-sm text-muted-foreground">
        Trang {currentPage} của {totalPages} ({pagination.totalTours} tours)
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </Button>
        
        {pageNumbers.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="w-8 h-8 p-0"
          >
            {page}
          </Button>
        ))}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ToursPage() {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Construct query parameters
  const queryParams = {
    search: searchTerm,
    destinationId: destinationId || undefined,
    ownerId: ownerId || undefined,
    status: statusFilter || undefined,
    page: currentPage,
    limit
  };

  // Main data query using @tanstack/react-query with centralized apiClient
  const toursQuery = useQuery({
    queryKey: ['adminTours', queryParams],
    queryFn: async (): Promise<ToursResponse> => {
      const params = new URLSearchParams();
      
      if (searchTerm) params.set('search', searchTerm);
      if (destinationId) params.set('destinationId', destinationId);
      if (ownerId) params.set('ownerId', ownerId);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', currentPage.toString());
      params.set('limit', limit.toString());

      // Use the centralized, robust API client with correct endpoint
      const response = await apiClient.get(`/admin/tours?${params.toString()}`);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to load tours');
      }
      
      return response as ToursResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Clone tour mutation using centralized apiClient
  const cloneMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post(`/admin/tours/${id}/clone`, {});
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Clone failed');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTours'] });
    }
  });

  // Delete tour mutation using centralized apiClient
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/tours/${id}`);
      if (!response.success) {
        throw new Error(response.error || 'Delete failed');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTours'] });
    }
  });

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Tours</h1>
          <p className="text-muted-foreground">Quản lý tất cả tours trong hệ thống</p>
        </div>
        <Button onClick={() => navigate('/dashboard/tours/edit/new')} className="flex items-center gap-2">
          + Thêm Tour
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-[300px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tiêu đề tour..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
              className="flex-1"
            />
          </div>
          
          <Input
            placeholder="ID Điểm đến"
            value={destinationId}
            onChange={(e) => {
              setDestinationId(e.target.value);
              handleFilterChange();
            }}
            className="w-[160px]"
          />
          
          <Input
            placeholder="ID Chủ tour"
            value={ownerId}
            onChange={(e) => {
              setOwnerId(e.target.value);
              handleFilterChange();
            }}
            className="w-[160px]"
          />
          
          <select
            className="bg-background border border-border rounded px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              handleFilterChange();
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
          
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setDestinationId('');
              setOwnerId('');
              setStatusFilter('');
              setCurrentPage(1);
            }}
          >
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
                <th className="p-3 text-left font-medium">Tour</th>
                <th className="p-3 text-left font-medium">Chủ tour</th>
                <th className="p-3 text-left font-medium">Điểm đến</th>
                <th className="p-3 text-right font-medium">Giá</th>
                <th className="p-3 text-center font-medium">Đánh giá</th>
                <th className="p-3 text-center font-medium">Đơn đặt</th>
                <th className="p-3 text-right font-medium">Doanh thu</th>
                <th className="p-3 text-center font-medium">Trạng thái</th>
                <th className="p-3 text-center font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {toursQuery.isPending ? (
                <TableSkeletonLoader rows={5} columns={9} />
              ) : toursQuery.isError ? (
                <tr>
                  <td colSpan={9}>
                    <ErrorMessage message={toursQuery.error?.message || 'Không thể tải dữ liệu tours'} />
                  </td>
                </tr>
              ) : toursQuery.data?.data.tours.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    Không tìm thấy tours nào
                  </td>
                </tr>
              ) : (
                toursQuery.data?.data.tours.map((tour) => (
                  <tr key={tour._id} className="border-t border-border hover:bg-secondary/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-[60px] h-[40px] bg-secondary rounded overflow-hidden">
                          {tour.mainImage ? (
                            <img 
                              src={tour.mainImage} 
                              alt={tour.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{tour.title}</div>
                          <div className="text-xs text-muted-foreground">ID: {tour._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{tour.owner.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {tour.owner._id}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm">{tour.destination.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {tour.destination._id}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-medium">
                        {tour.price.toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-medium">{tour.averageRating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({tour.reviewCount})</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-medium">{tour.bookingCount}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="font-medium text-green-600">
                        {tour.totalRevenue.toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <StatusTag status={tour.status} />
                    </td>
                    <td className="p-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a href={`/tours/${tour._id}`} target="_blank" rel="noopener noreferrer">
                              Xem trên site
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/tours/edit/${tour._id}`}>
                              Chỉnh sửa
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => cloneMutation.mutate(tour._id)}
                            disabled={cloneMutation.isPending}
                          >
                            {cloneMutation.isPending ? 'Đang nhân bản...' : 'Nhân bản'}
                          </DropdownMenuItem>
                          <DropdownMenuItem>Lưu trữ</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-500"
                            onClick={() => {
                              if (confirm('Bạn có chắc chắn muốn xóa tour này?')) {
                                deleteMutation.mutate(tour._id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa'}
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
        {toursQuery.data?.data.pagination && toursQuery.data.data.pagination.totalPages > 1 && (
          <Pagination
            pagination={toursQuery.data.data.pagination}
            onPageChange={handlePageChange}
          />
        )}
      </Card>
    </div>
  );
}

















