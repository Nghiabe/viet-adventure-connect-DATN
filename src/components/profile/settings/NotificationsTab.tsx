import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";

const notificationsSchema = z.object({
  marketingEmails: z.boolean(),
});

type NotificationsForm = z.infer<typeof notificationsSchema>;

const NotificationsTab = () => {
  const { toast } = useToast();
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<NotificationsForm>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      marketingEmails: user?.preferences?.marketingEmails || true,
    },
  });

  // Pre-populate the form when user data is available
  useEffect(() => {
    if (user) {
      form.reset({ 
        marketingEmails: user.preferences?.marketingEmails || true 
      });
    }
  }, [user, form]);

  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationsForm) => {
      const response = await apiClient.put("/users/profile/notifications", data);
      if (!response.success) {
        throw new Error(response.error || "Cập nhật thông báo thất bại");
      }
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "Thành công",
        description: "Cài đặt thông báo đã được cập nhật",
      });
      // Refetch user data in the global context to ensure consistency
      await refetchUser();
      // Also invalidate any local queries if needed
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["userProfileSettings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật cài đặt thông báo",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NotificationsForm) => {
    updateNotificationsMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cài đặt thông báo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails">Email marketing</Label>
              <p className="text-sm text-muted-foreground">
                Nhận email về các tour mới, ưu đãi đặc biệt và tin tức du lịch
              </p>
            </div>
            <Controller
              name="marketingEmails"
              control={form.control}
              render={({ field }) => (
                <Switch
                  id="marketingEmails"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          <Button 
            type="submit" 
            disabled={updateNotificationsMutation.isPending}
            className="w-full"
          >
            {updateNotificationsMutation.isPending ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
