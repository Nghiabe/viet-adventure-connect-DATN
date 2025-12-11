import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";
import { FcGoogle } from "react-icons/fc";
import { SiFacebook } from "react-icons/si";
import { Link } from "react-router-dom";
import { ResilientImage } from "@/components/ui/ResilientImage";

type LoginFormData = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const location = useLocation();
  const { login, clearError } = useAuth();
  const { t } = useTranslation();

  const [serverError, setServerError] = useState<string | null>(null);

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t("auth.email_required"))
      .email(t("auth.email_invalid")),
    password: z.string().min(1, t("auth.password_required")),
  });

  useRoleRedirect();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      setServerError(null);
      clearError();
      await login(data.email, data.password);
    },
    onSuccess: () => {
      console.log("[LoginPage] Login successful");
      toast.success(t("auth.login_success"));
    },
    onError: (error: any) => {
      console.error("[LoginPage] Login failed:", error);
      console.log("🔍 Server error payload:", error.response?.data);

      // ✔️ Xử lý lỗi từ backend đúng cấu trúc
      const serverErr = error.response?.data?.error;

      const translatedError =
        typeof serverErr === "string"
          ? t(serverErr)
          : serverErr?.message || t("auth.server_error");

      setServerError(translatedError);
      toast.error(translatedError);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    if (isValid) {
      loginMutation.mutate(data);
    }
  };

  const isFormLoading = loginMutation.isPending;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("status") === "success") {
      toast.success(t("toasts.register_success"));
    }
  }, [location.search, t]);

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="relative hidden md:block">
        <ResilientImage
          src={"/src/assets/hero-vietnam.jpg"}
          alt="Vietnam Landscape"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
      </div>

      <div className="bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {t("auth.welcome_back")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("auth.continue_journey")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="w-full">
                <span className="inline-flex items-center gap-2">
                  <FcGoogle className="h-5 w-5" /> Đăng nhập với Google
                </span>
              </Button>
              <Button
                type="button"
                style={{ backgroundColor: "#1877F2", color: "white" }}
                className="w-full hover:opacity-90"
              >
                <span className="inline-flex items-center gap-2">
                  <SiFacebook className="h-5 w-5" /> Facebook
                </span>
              </Button>
            </div>

            <div className="relative">
              <div
                className="absolute inset-0 flex items-center"
                aria-hidden="true"
              >
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Hoặc
                </span>
              </div>
            </div>

            {/* ✔️ THÔNG BÁO LỖI BACKEND */}
            {serverError && (
              <div
                className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-300"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
                <div className="flex justify-end">
                  <Link to="#" className="text-xs text-primary hover:underline">
                    {t("auth.forgot_password")}
                  </Link>
                </div>
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
                t("auth.login_button")
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              {t("auth.no_account")}{" "}
              <Link to="/register" className="text-primary hover:underline">
                {t("auth.create_account")}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
