import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/context/AuthContext";
import AvatarUploader from "@/components/ui/AvatarUploader";
import { uploadImage, validateImageFile } from "@/services/uploadService";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

const profileDetailsSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự").max(50, "Tên không được quá 50 ký tự"),
  avatar: z.any().optional(),
  phone: z.string().optional().refine((val) => !val || /^[0-9+]{9,15}$/.test(val), "Số điện thoại không hợp lệ"),
  address: z.string().max(200, "Địa chỉ quá dài").optional(),
  bio: z.string().max(500, "Giới thiệu không quá 500 ký tự").optional(),
  birthDate: z.date().optional().nullable(),
});

type ProfileDetailsForm = z.infer<typeof profileDetailsSchema>;

const ProfileDetailsTab = () => {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch full profile data to populate extended fields
  const { data: profileData } = useQuery({
    queryKey: ['userProfileFull'],
    queryFn: async () => {
      const res: any = await apiClient.get('/users/profile');
      if (res.success) return res.data.profile;
      return null;
    },
    enabled: !!user
  });

  const form = useForm<ProfileDetailsForm>({
    resolver: zodResolver(profileDetailsSchema),
    defaultValues: {
      name: user?.name || "",
      avatar: user?.avatar || "",
      phone: "",
      address: "",
      bio: "",
      birthDate: undefined
    },
    // Reset form when profileData loads
    values: profileData ? {
      name: profileData.name || user?.name || "",
      avatar: profileData.avatar || user?.avatar || "",
      phone: profileData.phone || "",
      address: profileData.address || "",
      bio: profileData.bio || "",
      birthDate: profileData.birthDate ? new Date(profileData.birthDate) : undefined
    } : undefined
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

      const payload: any = {
        name: data.name,
        phone: data.phone,
        address: data.address,
        bio: data.bio,
        birthDate: data.birthDate
      };
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
      queryClient.invalidateQueries({ queryKey: ["userProfileFull"] });
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
          {/* Avatar & Basic Info */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-4">
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

            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Họ và tên</Label>
                  <Input id="name" {...form.register("name")} placeholder="Nhập tên của bạn" />
                  {form.formState.errors.name && (<p className="text-sm text-destructive">{form.formState.errors.name.message}</p>)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" {...form.register("phone")} placeholder="09xxxxxxxx" />
                  {form.formState.errors.phone && (<p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>)}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
              </div>

              <div className="space-y-2">
                <Label>Ngày sinh</Label>
                <Controller
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "dd/MM/yyyy") : <span>Chọn ngày sinh</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                          locale={vi}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input id="address" {...form.register("address")} placeholder="Số nhà, đường, quận/huyện..." />
            {form.formState.errors.address && (<p className="text-sm text-destructive">{form.formState.errors.address.message}</p>)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Giới thiệu bản thân</Label>
            <Textarea id="bio" {...form.register("bio")} placeholder="Chia sẻ đôi chút về sở thích du lịch của bạn..." rows={4} />
            {form.formState.errors.bio && (<p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>)}
          </div>

          <Button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="w-full md:w-auto md:ml-auto block"
          >
            {updateProfileMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileDetailsTab;
