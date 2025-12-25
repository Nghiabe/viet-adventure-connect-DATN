import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';
import { Link, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-3 py-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <Link to="/" className="font-semibold">Vietravel</Link>
          </div>
          <div className="text-xs text-muted-foreground mt-1">{(user?.role === 'admin' || user?.role === 'staff') ? t('admin_sidebar.admin_portal') : t('admin_sidebar.partner_portal', 'Partner Portal')}</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {(user?.role === 'admin' || user?.role === 'staff') ? (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard">{t('admin_sidebar.dashboard')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/users">{t('admin_sidebar.users')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/tours">{t('admin_sidebar.tours')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/services">{t('admin_sidebar.services', 'Dịch vụ')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/moderation">{t('admin_sidebar.moderation')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/bookings">{t('admin_sidebar.bookings')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/destinations">{t('admin_sidebar.destinations')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/marketing">{t('admin_sidebar.marketing')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/analytics">{t('admin_sidebar.analytics')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/settings">{t('admin_sidebar.settings')}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            ) : (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard">Bảng điều khiển</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/tours">Tour của tôi</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/services">Dịch vụ của tôi</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/bookings">Đơn đặt của tôi</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/marketing">Marketing</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/analytics">Phân tích</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/chat">Tin nhắn</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/reviews">Đánh giá</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/profile">Hồ sơ Doanh nghiệp</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/dashboard/settings">Cài đặt & Tài chính</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}

            {/* Logout button at the bottom */}
            <div className="mt-auto border-t pt-4">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button onClick={logout} className="w-full text-left text-red-600 hover:text-red-700 hover:bg-red-50">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('common.logout', 'Đăng xuất')}</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="admin-theme bg-background text-foreground">
        <div className="min-h-svh bg-background text-foreground">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


