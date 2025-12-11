import { Facebook, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground" aria-label="Chân trang">
      <div className="container mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="text-xl font-extrabold mb-3">VietTravel</div>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="Facebook" className="hover:opacity-80"><Facebook /></a>
            <a href="#" aria-label="Instagram" className="hover:opacity-80"><Instagram /></a>
            <a href="#" aria-label="YouTube" className="hover:opacity-80"><Youtube /></a>
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3">Công ty</h3>
          <ul className="space-y-2 text-primary-foreground/90">
            <li><a href="#" className="hover:underline">Về chúng tôi</a></li>
            <li><a href="#" className="hover:underline">Tuyển dụng</a></li>
            <li><a href="#" className="hover:underline">Báo chí</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-3">Hỗ trợ</h3>
          <ul className="space-y-2 text-primary-foreground/90">
            <li><a href="#" className="hover:underline">FAQ</a></li>
            <li><a href="#" className="hover:underline">Liên hệ</a></li>
            <li><a href="#" className="hover:underline">Điều khoản dịch vụ</a></li>
            <li><a href="#" className="hover:underline">Chính sách bảo mật</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-3">Newsletter</h3>
          <p className="text-primary-foreground/90 mb-3">Nhận ưu đãi du lịch mới nhất mỗi tuần.</p>
          <div className="flex gap-2">
            <Input type="email" placeholder="Email của bạn" className="bg-primary-foreground text-primary" />
            <Button className="shrink-0">Đăng ký</Button>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20">
        <div className="container mx-auto px-4 py-4 text-sm text-primary-foreground/80 flex items-center justify-between">
          <span>© {new Date().getFullYear()} VietTravel. All rights reserved.</span>
          <a href="#" className="hover:underline">Sơ đồ trang</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
