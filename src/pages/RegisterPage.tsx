import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "@/components/auth/RegistrationForm";
import { ResilientImage } from "@/components/ui/ResilientImage";
import { toast } from "@/components/ui/sonner";
import { authService } from "@/services/authService";

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  accountType: 'user' | 'partner';
};

export default function RegisterPage() {
  const navigate = useNavigate();

  // Implement the useMutation hook for registration
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterFormData) => {
      const res = await authService.register(userData);
      if (!(res as any).success) {
        throw new Error((res as any).error || "Có lỗi xảy ra");
      }
      return res;
    },
    onSuccess: (data, variables) => {
      if (variables.accountType === 'partner') {
        toast.success("Cảm ơn bạn đã đăng ký! Đơn xin trở thành Đối tác đang được xem xét. Bạn sẽ nhận thông báo qua email khi được phê duyệt.");
      } else {
        toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      }
      navigate("/login?status=success");
    },
    onError: (error: any) => {
      console.error('[RegisterPage] Registration failed:', error);
      // Extract the specific error message from the backend's JSON response
      const errorMessage = error.response?.data?.error || error.message || "Có lỗi xảy ra";
      toast.error(errorMessage);
    }
  });

  const handleRegister = (payload: RegisterFormData) => {
    registerMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="relative hidden md:block">
        <ResilientImage
          src={"/src/assets/dest-halong.jpg"}
          alt="Ha Long Bay"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      </div>

      <div className="bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <RegistrationForm 
            isLoading={registerMutation.isPending} 
            apiError={registerMutation.error?.message || null} 
            onSubmit={handleRegister} 
          />
        </div>
      </div>
    </div>
  );
}


