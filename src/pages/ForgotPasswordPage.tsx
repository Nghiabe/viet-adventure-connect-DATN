import { useState } from "react";
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

// Validation schema for forgot password form
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập địa chỉ email.")
    .email("Địa chỉ email không hợp lệ."),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const response = await apiClient.post('/auth/forgot-password', data);
      return response;
    },
    onSuccess: (data) => {
      console.log("[ForgotPassword] Email sent successfully");
      setEmailSent(true);
      toast.success(t("auth.email_sent"));
    },
    onError: (error: any) => {
      console.error("[ForgotPassword] Failed to send email:", error);
      const errorMessage = error.response?.data?.error || error.message || t("auth.server_error");
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    if (isValid) {
      forgotPasswordMutation.mutate(data);
    }
  };

  const isFormLoading = forgotPasswordMutation.isPending;

  if (emailSent) {
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
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-green-600">
                  {t("auth.reset_success")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("auth.email_sent")}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn trong email để đặt lại mật khẩu.
                </p>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Không nhận được email? Kiểm tra thư mục spam hoặc thử lại sau vài phút.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
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
                {t("auth.forgot_password_title")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("auth.forgot_password_subtitle")}
              </p>
            </div>

            <div className="space-y-4">
              {/* Email Input */}
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
                t("auth.send_reset_email")
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
