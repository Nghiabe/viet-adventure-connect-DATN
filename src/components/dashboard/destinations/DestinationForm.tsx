// src/components/dashboard/destinations/DestinationForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/ui/image-uploader';
import { GalleryUploader } from '@/components/ui/gallery-uploader';
import { MultiSelect } from '@/components/ui/multi-select';

// Zod schema for form validation (matching AddDestinationModal)
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

interface DestinationFormProps {
  initialData?: Partial<DestinationFormData>;
  onSubmit: (data: DestinationFormData) => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

const DestinationForm: React.FC<DestinationFormProps> = ({ 
  initialData, 
  onSubmit, 
  isLoading = false,
  mode = 'edit'
}) => {
  const { t } = useTranslation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<DestinationFormData>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      description: initialData?.description || '',
      history: initialData?.history || '',
      culture: initialData?.culture || '',
      geography: initialData?.geography || '',
      mainImage: initialData?.mainImage || '',
      imageGallery: initialData?.imageGallery || [],
      bestTimeToVisit: initialData?.bestTimeToVisit || [],
      status: initialData?.status || 'draft'
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
    if (name && mode === 'create') {
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

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">Thông tin cơ bản</h3>
        
        {/* Name */}
        <div>
          <Label htmlFor="name" className="text-gray-300">
            {t('admin_destinations.editor.name_label')} *
          </Label>
          <Input
            id="name"
            {...register('name')}
            onChange={handleNameChange}
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            placeholder={t('admin_destinations.editor.name_placeholder')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
          )}
        </div>

        {/* Slug */}
        <div>
          <Label htmlFor="slug" className="text-gray-300">
            {t('admin_destinations.editor.slug_label')} *
          </Label>
          <Input
            id="slug"
            {...register('slug')}
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            placeholder={t('admin_destinations.editor.slug_placeholder')}
          />
          {errors.slug && (
            <p className="mt-1 text-sm text-red-400">{errors.slug.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description" className="text-gray-300">
            Mô tả
          </Label>
          <Textarea
            id="description"
            {...register('description')}
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            placeholder="Mô tả ngắn gọn về điểm đến..."
            rows={3}
          />
        </div>
      </div>

      {/* Detailed Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">Thông tin chi tiết</h3>
        
        {/* History */}
        <div>
          <Label htmlFor="history" className="text-gray-300">
            Lịch sử
          </Label>
          <Textarea
            id="history"
            {...register('history')}
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            placeholder="Lịch sử và nguồn gốc của điểm đến..."
            rows={4}
          />
        </div>

        {/* Culture */}
        <div>
          <Label htmlFor="culture" className="text-gray-300">
            Văn hóa
          </Label>
          <Textarea
            id="culture"
            {...register('culture')}
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            placeholder="Đặc điểm văn hóa, phong tục tập quán..."
            rows={4}
          />
        </div>

        {/* Geography */}
        <div>
          <Label htmlFor="geography" className="text-gray-300">
            Địa lý
          </Label>
          <Textarea
            id="geography"
            {...register('geography')}
            className="mt-1 bg-gray-700 border-gray-600 text-white"
            placeholder="Đặc điểm địa lý, khí hậu, địa hình..."
            rows={4}
          />
        </div>
      </div>

      {/* Media */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">Hình ảnh</h3>
        
        {/* Main Image */}
        <div>
          <Label className="text-gray-300">Hình ảnh chính</Label>
          <ImageUploader
            value={watch('mainImage')}
            onChange={handleMainImageChange}
            className="mt-1"
          />
        </div>

        {/* Image Gallery */}
        <div>
          <Label className="text-gray-300">Thư viện ảnh</Label>
          <GalleryUploader
            value={watch('imageGallery')}
            onChange={handleImageGalleryChange}
            className="mt-1"
          />
        </div>
      </div>

      {/* Travel Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-200">Thông tin du lịch</h3>
        
        {/* Best Time to Visit */}
        <div>
          <Label className="text-gray-300">Thời gian tốt nhất để thăm</Label>
          <MultiSelect
            options={monthOptions}
            value={watch('bestTimeToVisit')}
            onChange={handleBestTimeChange}
            placeholder="Chọn các tháng..."
            className="mt-1"
          />
        </div>

        {/* Status */}
        <div>
          <Label htmlFor="status" className="text-gray-300">
            Trạng thái
          </Label>
          <Select
            value={watch('status')}
            onValueChange={(value) => setValue('status', value as 'draft' | 'published')}
          >
            <SelectTrigger className="mt-1 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Bản nháp</SelectItem>
              <SelectItem value="published">Đã xuất bản</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {isLoading ? 'Đang lưu...' : (mode === 'create' ? 'Tạo điểm đến' : 'Cập nhật điểm đến')}
        </Button>
      </div>
    </form>
  );
};

export default DestinationForm;
