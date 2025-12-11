import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { ResilientImage } from "@/components/ui/ResilientImage";
import { Link } from "react-router-dom";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";

// Validation schema for reset password form
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, "Mật khẩu tối thiểu 6 ký tự"),
  confirmPassword: z
    .string()
    .min(6, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu và xác nhận mật khẩu không khớp",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [isValidToken, setIsValidToken] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const response = await apiClient.put(`/auth/reset-password/${token}`, {
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      return response;
    },
    onSuccess: async (data) => {
      console.log("[ResetPassword] Password reset successful");
      toast.success(t("auth.password_reset_success"));
      
      // Auto-login the user if the response includes user data
      if (data.data) {
        // The backend should have set the auth cookie, so we can navigate to dashboard
        navigate('/dashboard');
      } else {
        // Fallback: navigate to login page
        navigate('/login');
      }
    },
    onError: (error: any) => {
      console.error("[ResetPassword] Password reset failed:", error);
      const errorMessage = error.response?.data?.error || error.message || t("auth.server_error");
      
      if (errorMessage.includes("Token không hợp lệ") || errorMessage.includes("hết hạn")) {
        setIsValidToken(false);
      }
      
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    if (isValid && token) {
      resetPasswordMutation.mutate(data);
    }
  };

  const isFormLoading = resetPasswordMutation.isPending;

  // Check if token is present
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
    }
  }, [token]);

  if (!isValidToken) {
    return (
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
        <div className="relative hidden md:block">
          <ResilientImage
            src="/src/assets/hero-vietnam.jpg"
            alt="Vietnam landscape"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        </div>

        <div className="bg-background flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-red-600">
                  {t("auth.token_invalid")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Vui lòng yêu cầu đặt lại mật khẩu mới từ trang đăng nhập.
                </p>
              </div>

              <div className="space-y-2">
                <Link to="/forgot-password">
                  <Button className="w-full">
                    Yêu cầu đặt lại mật khẩu mới
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    {t("auth.back_to_login")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="relative hidden md:block">
        <ResilientImage
          src="/src/assets/hero-vietnam.jpg"
          alt="Vietnam landscape"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      </div>

      <div className="bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {t("auth.reset_password_title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("auth.reset_password_subtitle")}
              </p>
            </div>

            <div className="space-y-4">
              {/* New Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.new_password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirm_password")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isFormLoading || !isValid}
              className="w-full"
            >
              {isFormLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                  {t("auth.processing")}
                </span>
              ) : (
                t("auth.reset_password_button")
              )}
            </Button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                {t("auth.back_to_login")}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
