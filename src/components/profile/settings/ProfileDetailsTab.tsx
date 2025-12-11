import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import AvatarUploader from "@/components/ui/AvatarUploader";
import { uploadImage, validateImageFile } from "@/services/uploadService";

const profileDetailsSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(50, "Tên không được quá 50 ký tự"),
  // Accept either a URL string or a File provided by the uploader (handled at submit time)
  avatar: z.any().optional(),
});

type ProfileDetailsForm = z.infer<typeof profileDetailsSchema>;

const ProfileDetailsTab = () => {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileDetailsForm>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      name: user?.name || "",
      avatar: user?.avatar || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileDetailsForm) => {
      // If avatar is a File, validate and upload to get URL
      let avatarUrl: string | undefined = undefined;
      if (data.avatar instanceof File) {
        const validation = validateImageFile(data.avatar);
        if (!validation.isValid) {
          throw new Error(validation.error || "Ảnh không hợp lệ");
        }
        avatarUrl = await uploadImage(data.avatar);
      } else if (typeof data.avatar === 'string' && data.avatar.trim().length > 0) {
        avatarUrl = data.avatar.trim();
      }

      const payload: any = { name: data.name };
      if (typeof avatarUrl === 'string') payload.avatar = avatarUrl;

      const response = await apiClient.put("/users/profile/details", payload);
      if (!response.success) {
        throw new Error(response.error || "Cập nhật thất bại");
      }
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "Thành công",
        description: "Thông tin cá nhân đã được cập nhật",
      });
      // Revalidate global user (header, etc.) and local queries
      await refetchUser();
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["userNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["userProfileSettings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật thông tin",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileDetailsForm) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thông tin cá nhân</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Tên</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Nhập tên của bạn"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ảnh đại diện</Label>
            <Controller
              name="avatar"
              control={form.control}
              render={({ field }) => (
                <AvatarUploader
                  currentImageUrl={typeof field.value === 'string' ? field.value : (user?.avatar || '')}
                  onFileChange={(file) => field.onChange(file)}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email không thể thay đổi. Liên hệ hỗ trợ nếu cần thiết.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={updateProfileMutation.isPending}
            className="w-full"
          >
            {updateProfileMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileDetailsTab;
