import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AIWizardModal from "@/components/ai-planner/AIWizardModal";
import { UserMenu } from "./UserMenu";

const NAV_ITEMS = [
  { label: "Điểm đến", href: "/" },
  { label: "Tours & Trải nghiệm", href: "/tours/search" },
  { label: "Kế hoạch của tôi", href: "/my-plans" },
  { label: "Vé di chuyển", href: "/transportation" },
  { label: "Cộng đồng", href: "/community" },
  { label: "Ứng dụng", href: "/mobile-app" },
];

export const Header = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogin = () => {
    // Navigate to login instead of mock login
    window.location.href = '/login';
  };

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all ${scrolled ? "bg-background/70 backdrop-blur-md border-b" : "bg-transparent"
          }`}
        role="banner"
      >
        <nav className="container mx-auto flex items-center justify-between h-16 md:h-20 px-4" aria-label="Primary">
          <Link to="/" className="font-extrabold text-lg md:text-xl tracking-tight">
            VietTravel
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              item.href.startsWith('#') ? (
                <a
                  key={item.href}
                  href={item.href}
                  className="group relative text-sm font-semibold hover:text-primary transition-colors"
                >
                  <span className="pb-1">{item.label}</span>
                  <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
                </a>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group relative text-sm font-semibold hover:text-primary transition-colors"
                >
                  <span className="pb-1">{item.label}</span>
                  <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
                </Link>
              )
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <Button variant="default" className="hidden xl:inline-flex" onClick={() => setIsWizardOpen(true)}>Lập kế hoạch chuyến đi</Button>

            {!user ? (
              // Show login/register buttons when not logged in
              <>
                <Button variant="ghost" onClick={handleLogin}>Đăng nhập</Button>
                <Button variant="outline" asChild>
                  <Link to="/register">Đăng ký</Link>
                </Button>
              </>
            ) : (
              // Show profile dropdown when logged in
              <UserMenu user={user} logout={logout} />
            )}
          </div>

          {/* Mobile menu button and auth */}
          <div className="sm:hidden flex items-center gap-2">
            {!user ? (
              <Button variant="ghost" size="sm" onClick={handleLogin}>Đăng nhập</Button>
            ) : (
              <UserMenu user={user} logout={logout} />
            )}
            <button className="lg:hidden inline-flex items-center justify-center p-2 border rounded-md" aria-label="Mở menu">
              <Menu />
            </button>
          </div>

          {/* Desktop menu button (hidden on mobile since we have auth buttons above) */}
          <button className="hidden lg:inline-flex xl:hidden items-center justify-center p-2 border rounded-md" aria-label="Mở menu">
            <Menu />
          </button>
        </nav>
      </header>

      <AIWizardModal isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </>
  );
};

export default Header;
