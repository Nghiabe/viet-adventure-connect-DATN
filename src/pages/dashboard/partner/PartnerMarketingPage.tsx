
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, Tag, Calendar, Loader2, Pencil, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/sonner';
import apiClient from '@/services/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function PartnerMarketingPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<any>(null);
    const [deletingCoupon, setDeletingCoupon] = useState<any>(null);
    const queryClient = useQueryClient();

    // Fetch Coupons from Backend
    const { data, isLoading } = useQuery({
        queryKey: ['partnerCoupons'],
        queryFn: async () => {
            try {
                const res = await apiClient.get('/partner/marketing/coupons');
                if (res.success && res.data) return res.data;
                return []; // Default to empty array on failure/missing data
            } catch (error) {
                console.error("Failed to fetch coupons:", error);
                return []; // Default to empty array on network error
            }
        }
    });

    const coupons = Array.isArray(data) ? data : [];
    const filteredCoupons = coupons.filter((c: any) => c.code.toLowerCase().includes(searchTerm.toLowerCase()));

    // Create Coupon Mutation
    const createMutation = useMutation({
        mutationFn: async (formData: any) => {
            const res = await apiClient.post('/partner/marketing/coupons', formData);
            if (!res.success) throw new Error(res.error || 'Failed to create coupon');
            return res.data;
        },
        onSuccess: () => {
            toast.success('Đã tạo mã giảm giá thành công');
            setIsCreateDialogOpen(false);
            setEditingCoupon(null);
            queryClient.invalidateQueries({ queryKey: ['partnerCoupons'] });
        },
        onError: (err: any) => {
            toast.error(err.message || 'Có lỗi xảy ra khi tạo mã');
        }
    });

    // Update Coupon Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await apiClient.put(`/partner/marketing/coupons/${id}`, data);
            if (!res.success) throw new Error(res.error || 'Failed to update coupon');
            return res.data;
        },
        onSuccess: () => {
            toast.success('Đã cập nhật mã giảm giá thành công');
            setIsCreateDialogOpen(false);
            setEditingCoupon(null);
            queryClient.invalidateQueries({ queryKey: ['partnerCoupons'] });
        },
        onError: (err: any) => {
            toast.error(err.message || 'Có lỗi xảy ra khi cập nhật mã');
        }
    });

    // Delete Coupon Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await apiClient.delete(`/partner/marketing/coupons/${id}`);
            if (!res.success) throw new Error(res.error || 'Failed to delete coupon');
            return res.data;
        },
        onSuccess: () => {
            toast.success('Đã xóa mã giảm giá thành công');
            setDeletingCoupon(null);
            queryClient.invalidateQueries({ queryKey: ['partnerCoupons'] });
        },
        onError: (err: any) => {
            toast.error(err.message || 'Có lỗi xảy ra khi xóa mã');
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            code: formData.get('code'),
            discountType: formData.get('discountType'),
            discountValue: Number(formData.get('discountValue')),
            limit: Number(formData.get('limit')),
            expiry: formData.get('expiry')
        };

        if (editingCoupon) {
            updateMutation.mutate({ id: editingCoupon._id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleEditClick = (coupon: any) => {
        setEditingCoupon(coupon);
        setIsCreateDialogOpen(true);
    };

    const handleDeleteClick = (coupon: any) => {
        setDeletingCoupon(coupon);
    };

    const confirmDelete = () => {
        if (deletingCoupon) {
            deleteMutation.mutate(deletingCoupon._id);
        }
    };

    const handleDialogChange = (open: boolean) => {
        setIsCreateDialogOpen(open);
        if (!open) setEditingCoupon(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketing & Khuyến mãi</h1>
                    <p className="text-muted-foreground">Tạo và quản lý các mã giảm giá cho tour của bạn</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary">
                    <Plus className="mr-2 h-4 w-4" /> Tạo mã giảm giá
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm mã giảm giá..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : filteredCoupons.length === 0 ? (
                <div className="text-center p-12 bg-muted/20 rounded-lg text-muted-foreground">
                    Chưa có mã giảm giá nào. Hãy tạo mã đầu tiên!
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredCoupons.map((coupon: any) => (
                        <Card key={coupon._id} className="relative overflow-hidden border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow group">
                            <div className={`absolute top-0 right-0 p-1 px-3 ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} text-xs font-bold rounded-bl-lg uppercase`}>
                                {coupon.isActive ? 'Đang chạy' : 'Đã dừng'}
                            </div>

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-8 duration-200">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleEditClick(coupon)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(coupon)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Tag className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-xl font-bold font-mono tracking-wide">{coupon.code}</CardTitle>
                                    <CardDescription>
                                        Giảm <span className="font-semibold text-primary">{new Intl.NumberFormat('vi-VN').format(coupon.discountValue)}{coupon.discountType === 'percentage' ? '%' : 'đ'}</span>
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-2 text-sm mt-3 pt-3 border-t">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center"><Tag className="mr-1 h-3 w-3" /> Lượt dùng</span>
                                        <span className="font-medium">{coupon.usedCount} / {coupon.limits?.totalUses || '∞'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground flex items-center"><Calendar className="mr-1 h-3 w-3" /> Hết hạn</span>
                                        <span className="font-medium">{coupon.endDate ? new Date(coupon.endDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                                    </div>
                                    {coupon.limits?.totalUses > 0 && (
                                        <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full"
                                                style={{ width: `${Math.min((coupon.usedCount / coupon.limits.totalUses) * 100, 100)}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCoupon ? 'Cập Nhật Mã Giảm Giá' : 'Tạo Mã Giảm Giá Mới'}</DialogTitle>
                        <DialogDescription>
                            {editingCoupon ? 'Cập nhật thông tin mã giảm giá hiện tại.' : 'Thiết lập mã giảm giá để thu hút khách hàng cho Shop của bạn.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} key={editingCoupon ? editingCoupon._id : 'create'}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="code" className="text-right">Mã Code</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    placeholder="VD: SALE50"
                                    className="col-span-3 font-mono uppercase"
                                    required
                                    defaultValue={editingCoupon?.code}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="discount" className="text-right">Mức giảm</Label>
                                <div className="col-span-3 flex gap-2">
                                    <Input
                                        id="discount"
                                        name="discountValue"
                                        type="number"
                                        placeholder="10"
                                        className="flex-1"
                                        required
                                        min="1"
                                        defaultValue={editingCoupon?.discountValue}
                                    />
                                    <select
                                        name="discountType"
                                        className="border rounded px-2 bg-background"
                                        defaultValue={editingCoupon?.discountType || 'percentage'}
                                    >
                                        <option value="percentage">%</option>
                                        <option value="fixed_amount">VND</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="limit" className="text-right">Giới hạn</Label>
                                <Input
                                    id="limit"
                                    name="limit"
                                    type="number"
                                    placeholder="100"
                                    className="col-span-3"
                                    defaultValue={editingCoupon?.limits?.totalUses}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="expiry" className="text-right">Hết hạn</Label>
                                <Input
                                    id="expiry"
                                    name="expiry"
                                    type="date"
                                    className="col-span-3"
                                    defaultValue={editingCoupon?.endDate ? new Date(editingCoupon.endDate).toISOString().split('T')[0] : ''}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>Hủy</Button>
                            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                                {createMutation.isPending || updateMutation.isPending ? 'Đang lưu...' : (editingCoupon ? 'Cập nhật' : 'Tạo mã')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deletingCoupon} onOpenChange={(open) => !open && setDeletingCoupon(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Mã giảm giá <b>{deletingCoupon?.code}</b> sẽ bị xóa vĩnh viễn và không thể sử dụng nữa.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa mã'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
