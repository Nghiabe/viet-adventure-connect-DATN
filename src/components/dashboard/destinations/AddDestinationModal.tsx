import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { ImageUploader } from '@/components/ui/image-uploader';
import { GalleryUploader } from '@/components/ui/gallery-uploader';
import { MultiSelect } from '@/components/ui/multi-select';

// Zod schema for form validation
const destinationSchema = z.object({
  name: z.string().min(1, 'Tên điểm đến là bắt buộc').max(100, 'Tên phải ít hơn 100 ký tự'),
  slug: z.string()
    .min(1, 'Đường dẫn là bắt buộc')
    .max(50, 'Đường dẫn phải ít hơn 50 ký tự')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Đường dẫn chỉ được chứa chữ thường, số và dấu gạch ngang'),
  description: z.string().optional(),
  history: z.string().optional(),
  culture: z.string().optional(),
  geography: z.string().optional(),
  mainImage: z.string().optional(),
  imageGallery: z.array(z.string()).default([]),
  bestTimeToVisit: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
});

type DestinationFormData = z.infer<typeof destinationSchema>;

interface AddDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DestinationFormData) => void;
  isLoading: boolean;
}

export default function AddDestinationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}: AddDestinationModalProps) {
  const { t } = useTranslation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<DestinationFormData>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      history: '',
      culture: '',
      geography: '',
      mainImage: '',
      imageGallery: [],
      bestTimeToVisit: [],
      status: 'draft'
    }
  });

  const watchedName = watch('name');

  // Month options for best time to visit
  const monthOptions = [
    { value: 'january', label: t('common.months.january') },
    { value: 'february', label: t('common.months.february') },
    { value: 'march', label: t('common.months.march') },
    { value: 'april', label: t('common.months.april') },
    { value: 'may', label: t('common.months.may') },
    { value: 'june', label: t('common.months.june') },
    { value: 'july', label: t('common.months.july') },
    { value: 'august', label: t('common.months.august') },
    { value: 'september', label: t('common.months.september') },
    { value: 'october', label: t('common.months.october') },
    { value: 'november', label: t('common.months.november') },
    { value: 'december', label: t('common.months.december') },
  ];

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove Vietnamese diacritics
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Update slug when name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue('name', name);
    if (name) {
      setValue('slug', generateSlug(name));
    }
  };

  // Handle main image change
  const handleMainImageChange = (value: string) => {
    setValue('mainImage', value);
  };

  // Handle image gallery change
  const handleImageGalleryChange = (value: string[]) => {
    setValue('imageGallery', value);
  };

  // Handle best time to visit change
  const handleBestTimeChange = (value: string[]) => {
    setValue('bestTimeToVisit', value);
  };

  const handleFormSubmit = (data: DestinationFormData) => {
    onSubmit(data);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin_destinations.add_new_button')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('admin_destinations.editor.basic_info')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('admin_destinations.editor.name_label')} *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  onChange={handleNameChange}
                  placeholder={t('admin_destinations.editor.name_placeholder')}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">{t('admin_destinations.editor.slug_label')} *</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder={t('admin_destinations.editor.slug_placeholder')}
                />
                {errors.slug && (
                  <p className="text-sm text-red-600">{errors.slug.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">{t('admin_destinations.editor.description_label')}</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder={t('admin_destinations.editor.description_placeholder')}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">{t('admin_destinations.editor.status_label')}</Label>
                <Select onValueChange={(value) => setValue('status', value as 'draft' | 'published')} defaultValue="draft">
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin_destinations.editor.status_label')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t('admin_destinations.editor.status_draft')}</SelectItem>
                    <SelectItem value="published">{t('admin_destinations.editor.status_published')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bestTimeToVisit">{t('admin_destinations.editor.best_time_label')}</Label>
                <MultiSelect
                  options={monthOptions}
                  value={watch('bestTimeToVisit')}
                  onChange={handleBestTimeChange}
                  placeholder={t('admin_destinations.editor.best_time_placeholder')}
                />
              </div>
            </div>
          </div>
          
          {/* Media Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('admin_destinations.editor.main_image_label')}</h3>
            <ImageUploader
              value={watch('mainImage')}
              onChange={handleMainImageChange}
              onRemove={() => setValue('mainImage', '')}
              placeholder="Kéo thả ảnh chính vào đây hoặc click để chọn"
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('admin_destinations.editor.image_gallery_label')}</h3>
            <GalleryUploader
              value={watch('imageGallery')}
              onChange={handleImageGalleryChange}
            />
          </div>
          
          {/* Content Sections */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t('admin_destinations.editor.content_section_title')}</h3>
            
            <div className="space-y-2">
              <Label htmlFor="history">{t('admin_destinations.editor.history_tab')}</Label>
              <Textarea
                id="history"
                {...register('history')}
                placeholder="Nhập thông tin lịch sử về điểm đến"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="culture">{t('admin_destinations.editor.culture_tab')}</Label>
              <Textarea
                id="culture"
                {...register('culture')}
                placeholder="Nhập thông tin văn hóa về điểm đến"
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="geography">{t('admin_destinations.editor.geography_tab')}</Label>
              <Textarea
                id="geography"
                {...register('geography')}
                placeholder="Nhập thông tin địa lý về điểm đến"
                rows={4}
              />
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Đang tạo...' : t('common.save_changes')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
