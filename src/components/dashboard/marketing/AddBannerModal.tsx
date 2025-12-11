import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ImageUploader } from '@/components/ui/ImageUploader';

interface BannerFormData {
  imageUrl: string;
  title: string;
  subtitle: string;
  linkUrl: string;
  isActive: boolean;
}

interface AddBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BannerFormData) => void;
  isLoading?: boolean;
}

export function AddBannerModal({ open, onOpenChange, onSubmit, isLoading = false }: AddBannerModalProps) {
  const { t } = useTranslation();
  
  const form = useForm<BannerFormData>({
    defaultValues: {
      imageUrl: '',
      title: '',
      subtitle: '',
      linkUrl: '',
      isActive: true,
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  const onFormSubmit = (data: BannerFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('admin_marketing.banners.add_new_modal_title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label htmlFor="imageUrl">{t('admin_marketing.banners.image_url_label')}</Label>
            <Controller
              name="imageUrl"
              control={form.control}
              rules={{ required: 'Ảnh banner là bắt buộc' }}
              render={({ field, fieldState: { error } }) => (
                <div className="space-y-2">
                  <ImageUploader
                    value={field.value}
                    onChange={field.onChange}
                    onError={(errorMsg) => {
                      // Handle upload errors
                      console.error('Upload error:', errorMsg);
                    }}
                    disabled={isLoading}
                  />
                  {error && (
                    <p className="text-sm text-red-500">{error.message}</p>
                  )}
                </div>
              )}
            />
          </div>

          {/* Title Section */}
          <div className="space-y-3">
            <Label htmlFor="title">{t('admin_marketing.banners.title_label')}</Label>
            <Input
              id="title"
              {...register('title', { required: 'Tiêu đề banner là bắt buộc' })}
              placeholder={t('admin_marketing.banners.title_placeholder')}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Subtitle Section */}
          <div className="space-y-3">
            <Label htmlFor="subtitle">{t('admin_marketing.banners.subtitle_label')}</Label>
            <Input
              id="subtitle"
              {...register('subtitle')}
              placeholder={t('admin_marketing.banners.subtitle_placeholder')}
            />
          </div>

          {/* Link URL Section */}
          <div className="space-y-3">
            <Label htmlFor="linkUrl">{t('admin_marketing.banners.link_url_label')}</Label>
            <Input
              id="linkUrl"
              type="url"
              {...register('linkUrl', {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://'
                }
              })}
              placeholder={t('admin_marketing.banners.link_url_placeholder')}
            />
            {errors.linkUrl && (
              <p className="text-sm text-red-500">{errors.linkUrl.message}</p>
            )}
          </div>

          {/* Active Status Section */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              {...register('isActive')}
              defaultChecked={true}
            />
            <Label htmlFor="isActive">{t('admin_marketing.banners.is_active_label')}</Label>
          </div>

          {/* Action Buttons */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('admin_marketing.banners.cancel_button')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Đang tạo...' : t('admin_marketing.banners.create_button')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
