import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '@/services/apiClient';
import { toast } from '@/components/ui/sonner';

interface Tour {
  _id: string;
  title: string;
  price: number;
  duration: string;
  status: 'draft' | 'published' | 'archived';
  description?: string;
  destination: {
    _id: string;
    name: string;
    slug: string;
  };
  averageRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ToursResponse {
  tours: Tour[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function PartnerToursPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    duration: '',
    description: '',
    destination: '',
    maxGroupSize: '',
    inclusions: '',
    exclusions: ''
  });

  useEffect(() => {
    fetchTours();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await apiClient.get(`/partner/tours?${params}`);
      if (response.success) {
        setTours(response.data.tours);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to load tours');
      }
    } catch (err) {
      console.error('Error fetching tours:', err);
      setError('Failed to load tours');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTour = async () => {
    try {
      const tourData = {
        ...formData,
        price: parseFloat(formData.price),
        maxGroupSize: formData.maxGroupSize ? parseInt(formData.maxGroupSize) : undefined,
        inclusions: formData.inclusions ? formData.inclusions.split('\n').filter(item => item.trim()) : [],
        exclusions: formData.exclusions ? formData.exclusions.split('\n').filter(item => item.trim()) : []
      };

      const response = await apiClient.post('/partner/tours', tourData);
      if (response.success) {
        toast.success('Tour đã được tạo thành công');
        setIsCreateDialogOpen(false);
        resetForm();
        fetchTours();
      } else {
        toast.error('Không thể tạo tour');
      }
    } catch (err) {
      console.error('Error creating tour:', err);
      toast.error('Không thể tạo tour');
    }
  };

  const handleEditTour = async () => {
    if (!editingTour) return;

    try {
      const tourData = {
        ...formData,
        price: parseFloat(formData.price),
        maxGroupSize: formData.maxGroupSize ? parseInt(formData.maxGroupSize) : undefined,
        inclusions: formData.inclusions ? formData.inclusions.split('\n').filter(item => item.trim()) : [],
        exclusions: formData.exclusions ? formData.exclusions.split('\n').filter(item => item.trim()) : []
      };

      const response = await apiClient.put(`/partner/tours/${editingTour._id}`, tourData);
      if (response.success) {
        toast.success('Tour đã được cập nhật thành công');
        setIsEditDialogOpen(false);
        setEditingTour(null);
        resetForm();
        fetchTours();
      } else {
        toast.error('Không thể cập nhật tour');
      }
    } catch (err) {
      console.error('Error updating tour:', err);
      toast.error('Không thể cập nhật tour');
    }
  };

  const handleDeleteTour = async () => {
    if (!tourToDelete) return;

    try {
      const response = await apiClient.delete(`/partner/tours/${tourToDelete._id}`);
      if (response.success) {
        toast.success('Tour đã được xóa thành công');
        setIsDeleteDialogOpen(false);
        setTourToDelete(null);
        fetchTours();
      } else {
        toast.error('Không thể xóa tour');
      }
    } catch (err) {
      console.error('Error deleting tour:', err);
      toast.error('Không thể xóa tour');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      price: '',
      duration: '',
      description: '',
      destination: '',
      maxGroupSize: '',
      inclusions: '',
      exclusions: ''
    });
  };

  const openEditDialog = (tour: Tour) => {
    setEditingTour(tour);
    setFormData({
      title: tour.title,
      price: tour.price.toString(),
      duration: tour.duration,
      description: tour.description || '',
      destination: tour.destination._id,
      maxGroupSize: '',
      inclusions: '',
      exclusions: ''
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (tour: Tour) => {
    setTourToDelete(tour);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Đã xuất bản</Badge>;
      case 'draft':
        return <Badge variant="secondary">Bản nháp</Badge>;
      case 'archived':
        return <Badge variant="outline">Lưu trữ</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Tour</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý các tour của bạn
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm Tour
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Tạo Tour Mới</DialogTitle>
              <DialogDescription>
                Điền thông tin để tạo tour mới
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tên Tour *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Nhập tên tour"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Giá (VND) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Nhập giá tour"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Thời gian *</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="VD: 3 ngày 2 đêm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxGroupSize">Số người tối đa</Label>
                  <Input
                    id="maxGroupSize"
                    type="number"
                    value={formData.maxGroupSize}
                    onChange={(e) => setFormData({ ...formData, maxGroupSize: e.target.value })}
                    placeholder="Nhập số người tối đa"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết về tour"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inclusions">Bao gồm (mỗi dòng một mục)</Label>
                <Textarea
                  id="inclusions"
                  value={formData.inclusions}
                  onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                  placeholder="Vé tham quan&#10;Hướng dẫn viên&#10;Ăn sáng"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exclusions">Không bao gồm (mỗi dòng một mục)</Label>
                <Textarea
                  id="exclusions"
                  value={formData.exclusions}
                  onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
                  placeholder="Chi phí cá nhân&#10;Bảo hiểm&#10;Tip"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleCreateTour}>Tạo Tour</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm tour..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="archived">Lưu trữ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tours Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Tour ({pagination.total})</CardTitle>
          <CardDescription>
            Quản lý tất cả tour của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tours.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Tour</TableHead>
                  <TableHead>Điểm đến</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tours.map((tour) => (
                  <TableRow key={tour._id}>
                    <TableCell className="font-medium">{tour.title}</TableCell>
                    <TableCell>{tour.destination.name}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(tour.price)}
                    </TableCell>
                    <TableCell>{tour.duration}</TableCell>
                    <TableCell>{getStatusBadge(tour.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">{tour.averageRating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({tour.reviewCount})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(tour)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(tour)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chưa có tour nào</p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo tour đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Tour</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin tour
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Tên Tour *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Giá (VND) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Thời gian *</Label>
                <Input
                  id="edit-duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxGroupSize">Số người tối đa</Label>
                <Input
                  id="edit-maxGroupSize"
                  type="number"
                  value={formData.maxGroupSize}
                  onChange={(e) => setFormData({ ...formData, maxGroupSize: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditTour}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tour</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa tour "{tourToDelete?.title}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteTour}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
