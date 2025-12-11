import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import ValidatedInput from "./ValidatedInput";
import RoleCard from "./RoleCard";
import PasswordStrength from "./PasswordStrength";
import { toast } from "@/components/ui/sonner";
import { authService } from "@/services/authService";
import { Mail, ShieldCheck, ShoppingBag, User2 } from "lucide-react";

type RegistrationFormProps = {
  isLoading: boolean;
  apiError?: string | null;
  onSubmit: (payload: { name: string; email: string; password: string; accountType: 'user' | 'partner' }) => Promise<void>;
};

export default function RegistrationForm({ isLoading, apiError, onSubmit }: RegistrationFormProps) {
  const [accountType, setAccountType] = useState<'user' | 'partner'>("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (apiError) toast.error(apiError);
  }, [apiError]);

  function validate() {
    const e: Record<string, string | null> = {};
    if (!name.trim()) e.name = "Vui lòng nhập họ tên";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email không hợp lệ";
    if (password.length < 6) e.password = "Mật khẩu tối thiểu 6 ký tự";
    if (confirmPassword !== password) e.confirmPassword = "Mật khẩu nhập lại không khớp";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  useEffect(() => {
    validate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, email, password, confirmPassword]);

  const isValid = useMemo(() => {
    return (
      name.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      password.length >= 6 &&
      confirmPassword === password
    );
  }, [name, email, password, confirmPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ name, email, password, accountType });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Tạo tài khoản Vietravel</h2>
        <p className="text-sm text-muted-foreground">Tham gia để đặt tour, lưu trải nghiệm và chia sẻ câu chuyện du lịch.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <RoleCard
          icon={<User2 className="h-5 w-5" />}
          title="Tôi là khách du lịch"
          subtitle="Đặt tour & trải nghiệm"
          isSelected={accountType === "user"}
          onClick={() => setAccountType("user")}
        />
        <RoleCard
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Tôi muốn trở thành Đối tác"
          subtitle="Tạo tour, bán trải nghiệm (cần phê duyệt)"
          isSelected={accountType === "partner"}
          onClick={() => setAccountType("partner")}
        />
      </div>

      <div className="space-y-4">
        <ValidatedInput label="Họ và tên" value={name} onChange={setName} placeholder="Nguyễn Văn A" error={errors.name} autoComplete="name" />
        <ValidatedInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" error={errors.email} autoComplete="email" />
        <div className="space-y-2">
          <ValidatedInput label="Mật khẩu" type="password" value={password} onChange={setPassword} placeholder="••••••••" error={errors.password} autoComplete="new-password" />
          <PasswordStrength password={password} />
        </div>
        <ValidatedInput label="Xác nhận mật khẩu" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="••••••••" error={errors.confirmPassword} autoComplete="new-password" />
      </div>

      <Button type="submit" disabled={!isValid || isLoading} className="w-full">
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Đang tạo tài khoản...
          </span>
        ) : (
          "Đăng ký"
        )}
      </Button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        <span>Chúng tôi sử dụng mã hóa để bảo vệ dữ liệu của bạn.</span>
      </div>
    </form>
  );
}




