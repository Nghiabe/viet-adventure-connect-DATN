import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";

// Step 1: Define the validation schema using Zod
const deleteAccountSchema = z.object({
  password: z.string().min(1, "Mật khẩu là bắt buộc để xác nhận xóa tài khoản"),
});

type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

const AdvancedTab = () => {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Step 2: Initialize react-hook-form with the Zod resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const deleteAccountMutation = useMutation({
    // THIS IS THE FIX: We are now passing the `data` object directly as the body.
    // The `data` variable itself is { password: '...' }, which is what the backend expects.
    mutationFn: (data: { password: string }) => 
      apiClient.delete('/users/profile', data),
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Tài khoản của bạn đã được xóa thành công.",
      });
      // The backend has already cleared the cookie, now we clear the client state
      logout();
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || error.message || "Xóa tài khoản thất bại.",
        variant: "destructive",
      });
    },
  });

  // Step 3: The submit handler now receives validated data
  const onSubmit = (data: DeleteAccountFormData) => {
    // The `data` object is guaranteed to have a `password` field here
    deleteAccountMutation.mutate(data);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    reset(); // Reset form when dialog closes
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Hành động nguy hiểm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Xóa tài khoản</h3>
          <p className="text-sm text-muted-foreground">
            Xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan. Hành động này không thể hoàn tác.
          </p>
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa tài khoản
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Bạn có chắc chắn muốn xóa tài khoản?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p className="font-semibold text-destructive">Hành động này không thể hoàn tác!</p>
                <p>Khi xóa tài khoản:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Tất cả thông tin cá nhân sẽ bị xóa vĩnh viễn</li>
                  <li>Các bài viết và đánh giá của bạn sẽ được ẩn danh (nội dung được giữ lại)</li>
                  <li>Lịch sử đặt tour sẽ được giữ lại cho mục đích kinh doanh</li>
                  <li>Bạn sẽ bị đăng xuất ngay lập tức</li>
                </ul>
                <p className="font-medium">Vui lòng nhập mật khẩu để xác nhận:</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {/* CRITICAL FIX: Wrap the form with handleSubmit */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deletePassword">Nhập mật khẩu để xác nhận</Label>
                  <Input
                    id="deletePassword"
                    type="password"
                    {...register('password')}
                    placeholder="Nhập mật khẩu của bạn"
                    className={errors.password ? "border-destructive" : ""}
                  />
                  {/* Display validation errors */}
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel 
                  type="button"
                  onClick={handleDialogClose}
                  disabled={isSubmitting || deleteAccountMutation.isPending}
                >
                  Hủy
                </AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  disabled={isSubmitting || deleteAccountMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isSubmitting || deleteAccountMutation.isPending ? "Đang xóa..." : "Xóa vĩnh viễn tài khoản của tôi"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>

        <div className="text-xs text-muted-foreground">
          <p>⚠️ Cảnh báo: Việc xóa tài khoản là hành động không thể hoàn tác.</p>
          <p>Liên hệ hỗ trợ khách hàng nếu bạn cần hỗ trợ thay vì xóa tài khoản.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedTab;
