import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/sonner';
import { MoreVertical } from 'lucide-react';
import { formatCurrencyVND, formatDate } from '@/utils/format';
import { translateRole, translateStatus } from '@/utils/translation';
import { useTranslation } from 'react-i18next';
import AddStaffModal from './AddStaffModal';
import apiClient from '@/services/apiClient';

async function fetchPendingPartners() {
  const response = await apiClient.get('/admin/users/pending-partners');
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to fetch');
  }
  return response.data as Array<{ _id: string; name: string; email: string; status: string }>;
}

async function approvePartner(userId: string) {
  const response = await apiClient.put(`/admin/users/${userId}/approve-partner`, {});
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to approve');
  }
  return response.data;
}

async function createStaff(payload: { name: string; email: string; password: string }) {
  console.log('STEP 4: createStaff function called, making API request with payload:', payload);
  const response = await apiClient.post('/admin/users/staff', payload);
  console.log('STEP 5: API response received:', response);
  if (!response.success || !response.data) {
    throw new Error(response.error || 'Failed to create staff');
  }
  return response.data;
}

export default function UserManagement() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'all' | 'user' | 'partner' | 'staff'>('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 15;

  const { data: pending = [], isLoading: loadingPending } = useQuery({ queryKey: ['pending-partners'], queryFn: fetchPendingPartners });
  const listQuery = useQuery({
    queryKey: ['adminUsers', { tab, search, status, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tab === 'user') params.set('role', 'user');
      else if (tab === 'partner') params.set('role', 'partner');
      else if (tab === 'staff') params.set('role', 'staff');
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      params.set('page', String(page));
      params.set('limit', String(limit));
      
      const response = await apiClient.get(`/admin/users?${params.toString()}`);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch users');
      }
      return response.data as { users: any[]; pagination: { currentPage: number; totalPages: number; totalUsers: number } };
    },
  });
  const approveMut = useMutation({ mutationFn: approvePartner, onSuccess: () => { toast.success(t('toasts.update_success','Cập nhật thành công!')); qc.invalidateQueries({ queryKey: ['pending-partners'] }); qc.invalidateQueries({ queryKey: ['adminUsers'] }); } });
  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'active'|'suspended'|'pending_approval' }) => {
      const response = await apiClient.put(`/admin/users/${id}/status`, { status });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed');
      }
      return response.data;
    },
    onSuccess: () => { toast.success(t('toasts.update_success','Cập nhật thành công!')); qc.invalidateQueries({ queryKey: ['adminUsers'] }); }
  });
  const updateRoleMut = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: 'user'|'partner'|'staff'|'admin' }) => {
      const response = await apiClient.put(`/admin/users/${id}/role`, { role });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed');
      }
      return response.data;
    },
    onSuccess: () => { toast.success(t('toasts.update_success','Cập nhật thành công!')); qc.invalidateQueries({ queryKey: ['adminUsers'] }); }
  });
  const deleteUserMut = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(`/admin/users/${id}`);
      if (!response.success) {
        throw new Error(response.error || 'Failed');
      }
      return true;
    },
    onSuccess: () => { toast.success(t('toasts.delete_success','Xóa thành công!')); qc.invalidateQueries({ queryKey: ['adminUsers'] }); }
  });

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  
  const createStaffMut = useMutation({ 
    mutationFn: (data) => {
      console.log('STEP 2: createStaff mutation function called with data:', data);
      return createStaff(data);
    }, 
    onSuccess: () => { 
      console.log('STEP 3: createStaff mutation succeeded');
      toast.success(t('toasts.create_success','Tạo mới thành công!')); 
      setIsAddStaffModalOpen(false); // Close modal on success
      qc.invalidateQueries({ queryKey: ['adminUsers'] }); 
    },
    onError: (error) => {
      console.log('STEP 3 ERROR: createStaff mutation failed:', error);
      toast.error(error.message || 'Failed to create staff');
    }
  });

  const handleCreateStaff = (formData: any) => {
    console.log('STEP 1: handleCreateStaff called with form data:', formData);
    createStaffMut.mutate(formData);
  };

  const Toolbar = (
    <div className="flex items-center gap-3 mb-4">
      <Input placeholder={t('common.search_placeholder','Tìm kiếm...')} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      <select className="bg-background border border-border rounded px-2 py-1 text-sm" value={status || ''} onChange={(e) => setStatus(e.target.value || undefined)}>
        <option value="">{t('common.status','Trạng thái')} - {t('common.all','Tất cả')}</option>
        <option value="active">{translateStatus('active', t)}</option>
        <option value="pending_approval">{translateStatus('pending_approval', t)}</option>
        <option value="suspended">{translateStatus('suspended', t)}</option>
      </select>
      {tab === 'partner' && (
        <Button variant="secondary" onClick={() => setStatus('pending_approval')}>
          {t('admin_users.pending_partners','Đối tác chờ phê duyệt')} ({pending.length})
        </Button>
      )}
      <div className="ml-auto" />
      {tab === 'staff' && (
        <Button onClick={() => setIsAddStaffModalOpen(true)}>
          {t('admin_users.add_staff_button', 'Thêm Nhân viên +')}
        </Button>
      )}
    </div>
  );

  const Table = (
    <Card className="bg-card border border-border p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr>
              <th className="text-left p-3">{t('admin_users.table_headers.user_info','Người dùng')}</th>
              <th className="text-left p-3">{t('admin_users.table_headers.email','Email')}</th>
              {tab === 'user' && (<><th className="p-3 text-right">{t('admin_users.table_headers.total_bookings','Tổng đơn hàng')}</th><th className="p-3 text-right">{t('admin_users.table_headers.total_spend','Tổng chi tiêu')}</th><th className="p-3">{t('common.status','Trạng thái')}</th><th className="p-3">{t('admin_users.table_headers.joined_date','Ngày tham gia')}</th></>)}
              {tab === 'partner' && (<><th className="p-3 text-right">{t('admin_tours.table_headers.bookings','Lượt đặt')}</th><th className="p-3 text-right">{t('admin_dashboard.avg_rating','Đánh giá TB')}</th><th className="p-3">{t('common.status','Trạng thái')}</th></>)}
              {tab === 'staff' && (<><th className="p-3">{t('common.role','Vai trò')}</th><th className="p-3">{t('admin_users.last_login','Lần đăng nhập cuối')}</th></>)}
              {tab === 'all' && (<><th className="p-3">{t('common.role','Vai trò')}</th><th className="p-3">{t('common.status','Trạng thái')}</th></>)}
              <th className="text-right p-3">{t('common.actions','Hành động')}</th>
            </tr>
          </thead>
          <tbody>
            {(listQuery.data?.users || []).map((u) => (
              <tr key={u._id} className="border-t border-border">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary" />
                    <div className="font-medium">{u.name}</div>
                  </div>
                </td>
                <td className="p-3">{u.email}</td>
                {tab === 'user' && (<><td className="p-3 text-right">{u.totalBookings ?? 0}</td><td className="p-3 text-right">{formatCurrencyVND(u.totalSpend ?? 0)}</td><td className="p-3"><span className={`px-2 py-1 rounded text-xs ${u.status==='active'?'bg-green-500/20 text-green-300':u.status==='pending_approval'?'bg-yellow-500/20 text-yellow-300':'bg-red-500/20 text-red-300'}`}>{translateStatus(u.status, t)}</span></td><td className="p-3">{formatDate(u.createdAt)}</td></>)}
                {tab === 'partner' && (<><td className="p-3 text-right">{u.tourCount ?? 0}</td><td className="p-3 text-right">{(u.avgRating ?? 0).toFixed(1)}</td><td className="p-3"><span className={`px-2 py-1 rounded text-xs ${u.status==='active'?'bg-green-500/20 text-green-300':u.status==='pending_approval'?'bg-yellow-500/20 text-yellow-300':'bg-red-500/20 text-red-300'}`}>{translateStatus(u.status, t)}</span></td></>)}
                {tab === 'staff' && (<><td className="p-3"><span className={`px-2 py-1 rounded text-xs ${u.role==='admin'?'bg-purple-500/20 text-purple-300':'bg-blue-500/20 text-blue-300'}`}>{translateRole(u.role, t)}</span></td><td className="p-3">{u.lastLogin ? formatDate(u.lastLogin, "d 'thg' M, yyyy HH:mm") : '—'}</td></>)}
                {tab === 'all' && (<><td className="p-3"><span className={`px-2 py-1 rounded text-xs ${u.role==='admin'?'bg-purple-500/20 text-purple-300':u.role==='staff'?'bg-blue-500/20 text-blue-300':u.role==='partner'?'bg-sky-500/20 text-sky-300':'bg-gray-500/20 text-gray-300'}`}>{translateRole(u.role, t)}</span></td><td className="p-3"><span className={`px-2 py-1 rounded text-xs ${u.status==='active'?'bg-green-500/20 text-green-300':u.status==='pending_approval'?'bg-yellow-500/20 text-yellow-300':'bg-red-500/20 text-red-300'}`}>{translateStatus(u.status, t)}</span></td></>)}
                <td className="p-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {tab === 'partner' && u.status === 'pending_approval' && (
                        <DropdownMenuItem onClick={() => approveMut.mutate(u._id)}>{t('admin_users.approve_partner','Phê duyệt đối tác')}</DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={()=> updateRoleMut.mutate({ id: u._id, role: u.role==='admin'?'staff':'admin' })}>{t('admin_users.toggle_admin','Chuyển quyền Admin')}</DropdownMenuItem>
                      <DropdownMenuItem onClick={()=> updateStatusMut.mutate({ id: u._id, status: u.status==='suspended'?'active':'suspended' })}>{u.status==='suspended'? t('admin_users.reactivate','Kích hoạt lại') : t('admin_users.suspend','Tạm khóa')}</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500" onClick={()=> { if (confirm(t('admin_users.confirm_delete','Bạn có chắc chắn muốn xóa người dùng này?'))) deleteUserMut.mutate(u._id); }}>{t('common.delete','Xóa')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-3 text-sm text-muted-foreground">
        <div>{t('admin_users.total','Tổng')} {listQuery.data?.pagination.totalUsers ?? 0}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={()=> setPage((p)=> Math.max(1, p-1))} disabled={(listQuery.data?.pagination.currentPage || 1) <= 1}>‹</Button>
          <div>{(listQuery.data?.pagination.currentPage) || 1} / {listQuery.data?.pagination.totalPages || 1}</div>
          <Button variant="outline" size="sm" onClick={()=> setPage((p)=> Math.min((listQuery.data?.pagination.totalPages || 1), p+1))} disabled={(listQuery.data?.pagination.currentPage || 1) >= (listQuery.data?.pagination.totalPages || 1)}>›</Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="user">Khách hàng</TabsTrigger>
          <TabsTrigger value="partner">Đối tác</TabsTrigger>
          <TabsTrigger value="staff">Nhân viên</TabsTrigger>
        </TabsList>
        <div className="mt-4" />
        <TabsContent value={tab}>
          {Toolbar}
          {Table}
        </TabsContent>
      </Tabs>

      {/* Pending Partners quick panel */}
      {tab === 'partner' && (
        <Card className="p-4">
          <div className="font-semibold mb-3">Đối tác chờ phê duyệt</div>
          {loadingPending ? 'Đang tải...' : (
            <div className="space-y-2">
              {pending.length === 0 && <div className="text-sm text-muted-foreground">Không có yêu cầu nào.</div>}
              {pending.map((u) => (
                <div key={u._id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-muted-foreground">{u.email}</div>
                  </div>
                  <Button size="sm" onClick={() => approveMut.mutate(u._id)} disabled={approveMut.isPending}>Phê duyệt</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddStaffModalOpen}
        onClose={() => setIsAddStaffModalOpen(false)}
        onSubmit={handleCreateStaff}
        isLoading={createStaffMut.isPending}
      />
    </div>
  );
}


