import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/home/Header';
import { Footer } from '@/components/home/Footer';
import { Button } from '@/components/ui/button';

export default function BookingSuccessPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-3">Cảm ơn bạn đã đặt tour!</h1>
        <p className="text-muted-foreground mb-6">Mã đặt chỗ của bạn: <span className="font-mono font-semibold">{id}</span></p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild><Link to="/">Về trang chủ</Link></Button>
          <Button variant="outline" asChild><Link to="/profile">Xem đơn của tôi</Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}


