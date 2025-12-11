// src/pages/UnauthorizedPage.tsx
import { Link } from 'react-router-dom';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <ShieldX className="h-24 w-24 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Truy cập bị từ chối
          </h1>
          <p className="text-muted-foreground max-w-md">
            Bạn không có quyền truy cập vào trang này. 
            {user && (
              <span className="block mt-2">
                Tài khoản của bạn: <strong>{user.email}</strong> (Vai trò: {user.role})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={user?.role === 'admin' || user?.role === 'partner' ? '/dashboard' : '/'}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            {user?.role === 'admin' || user?.role === 'partner' ? 'Về bảng điều khiển' : 'Về trang chủ'}
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}


