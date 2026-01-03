import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/ui/ImageUploader';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { X, Search, MapPin, Tag, Loader2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import apiClient from '@/services/apiClient';
import { toast } from 'sonner';

// Enhanced validation schema with better user feedback
const CreateStorySchema = z.object({
  title: z.string()
    .min(5, 'Tiêu đề phải có ít nhất 5 ký tự')
    .max(200, 'Tiêu đề không được vượt quá 200 ký tự')
    .refine(val => val.trim().length > 0, 'Tiêu đề không được để trống'),
  content: z.string()
    .min(20, 'Nội dung phải có ít nhất 20 ký tự để chia sẻ một câu chuyện có ý nghĩa')
    .refine(val => val.trim().length > 0, 'Nội dung không được để trống'),
  coverImageUrl: z.string()
    .min(1, "Vui lòng tải lên một ảnh bìa.")
    .refine(val => val.startsWith('/'), "Đường dẫn ảnh không hợp lệ."),
  tags: z.array(z.string().min(1, 'Tag không được để trống'))
    .min(1, 'Vui lòng thêm ít nhất một tag để giúp người khác dễ dàng tìm thấy bài viết')
    .max(10, 'Không được vượt quá 10 tags')
    .refine(tags => tags.every(tag => tag.trim().length > 0), 'Tất cả tags phải có nội dung'),
  destinationId: z.string().optional()
});

type CreateStoryFormData = z.infer<typeof CreateStorySchema>;

interface Destination {
  _id: string;
  name: string;
  slug: string;
  location: string | { address: string };
  image?: string;
}

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStoryFormData) => void;
  isSubmitting: boolean;
}

const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDestinationResults, setShowDestinationResults] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Debounce the search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Use React Query for destination search
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['destinationSearch', debouncedSearchQuery],
    queryFn: async () => {
      if (!debouncedSearchQuery.trim()) {
        return { success: true, data: [], total: 0 };
      }
      const response = await apiClient.get(`/destinations/search?q=${encodeURIComponent(debouncedSearchQuery)}&limit=5`);
      return response;
    },
    enabled: !!debouncedSearchQuery.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const destinations = searchResults?.data || [];

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty, touchedFields },
    setValue,
    watch,
    reset,
    trigger
  } = useForm<CreateStoryFormData>({
    resolver: zodResolver(CreateStorySchema),
    mode: 'onChange', // Validate as user types for instant feedback
    reValidateMode: 'onChange', // Re-validate on change
    defaultValues: {
      title: '',
      content: '',
      coverImageUrl: '',
      tags: [],
      destinationId: ''
    }
  });

  const watchedTags = watch('tags');
  const watchedDestinationId = watch('destinationId');
  const watchedTitle = watch('title');
  const watchedContent = watch('content');



  // Add tag with validation
  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !watchedTags.includes(trimmedTag)) {
      const newTags = [...watchedTags, trimmedTag];
      setValue('tags', newTags, { shouldValidate: true });
      setNewTag('');
      // Trigger validation to update form state
      trigger('tags');
    }
  };

  // Remove tag with validation
  const removeTag = (tagToRemove: string) => {
    const newTags = watchedTags.filter(tag => tag !== tagToRemove);
    setValue('tags', newTags, { shouldValidate: true });
    // Trigger validation to update form state
    trigger('tags');
  };

  // Handle form submission
  const handleFormSubmit = (data: CreateStoryFormData) => {
    onSubmit(data);
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSearchQuery('');
      setShowDestinationResults(false);
      setNewTag('');
    }
  }, [isOpen, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Viết bài chia sẻ</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Cover Image */}
          <div className="space-y-2">
            <Label htmlFor="coverImage">Ảnh bìa *</Label>
            <Controller
              name="coverImageUrl"
              control={control}
              render={({ field }) => (
                <ImageUploader
                  value={field.value}
                  onChange={(url) => {
                    field.onChange(url);
                  }}
                  onUploadStart={() => setIsImageUploading(true)}
                  onUploadEnd={() => setIsImageUploading(false)}
                  onUploadSuccess={async (url) => {
                    // --- THE CRITICAL FIX ---
                    // 1. Update the form's state with the new URL.
                    setValue('coverImageUrl', url, { shouldDirty: true });

                    // 2. Manually trigger validation for THIS SPECIFIC FIELD.
                    // This tells react-hook-form to re-evaluate the rules for
                    // coverImageUrl now that it has a new, valid value.
                    await trigger('coverImageUrl');
                    // --- END CRITICAL FIX ---

                    // Also update the field for the Controller
                    field.onChange(url);
                    setIsImageUploading(false);

                    // Show success feedback to user
                    toast.success("Tải ảnh lên thành công!");
                  }}
                  onError={(error) => {
                    console.error('Image upload error:', error);
                    setIsImageUploading(false);
                    toast.error(`Lỗi tải ảnh: ${error.message || 'Đã có lỗi xảy ra'}`);
                  }}
                />
              )}
            />
            {errors.coverImageUrl && (
              <p className="text-sm text-destructive">{errors.coverImageUrl.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Nhập tiêu đề bài viết..."
                  className="text-lg"
                />
              )}
            />
            <div className="flex justify-between items-center">
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
              <p className={`text-xs ml-auto ${watchedTitle.length > 180
                ? 'text-red-500'
                : watchedTitle.length > 150
                  ? 'text-amber-500'
                  : 'text-muted-foreground'
                }`}>
                {watchedTitle.length}/200
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Nội dung *</Label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Viết nội dung bài viết của bạn..."
                />
              )}
            />
            <div className="flex justify-between items-center">
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content.message}</p>
              )}
              <p className={`text-xs ml-auto ${watchedContent.length < 20
                ? 'text-red-500'
                : watchedContent.length < 50
                  ? 'text-amber-500'
                  : 'text-green-600'
                }`}>
                {watchedContent.length} ký tự
                {watchedContent.length < 20 && ` (cần ít nhất 20)`}
              </p>
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label htmlFor="destination">Điểm đến (tùy chọn)</Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm điểm đến..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDestinationResults(true);
                  }}
                  onFocus={() => setShowDestinationResults(true)}
                  className="pl-10"
                />
              </div>

              {/* Destination Results */}
              {showDestinationResults && (searchQuery || destinations.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                      Đang tìm kiếm...
                    </div>
                  ) : destinations.length > 0 ? (
                    <div className="py-2">
                      {destinations.map((destination) => (
                        <button
                          key={destination._id}
                          type="button"
                          onClick={() => {
                            setValue('destinationId', destination._id);
                            setSearchQuery(destination.name);
                            setShowDestinationResults(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-muted flex items-center gap-3"
                        >
                          {destination.image && (
                            <img
                              src={destination.image}
                              alt={destination.name}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{destination.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {typeof destination.location === 'object' ? destination.location.address : destination.location}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Không tìm thấy điểm đến nào
                    </div>
                  ) : null}
                </div>
              )}

              {/* Selected Destination */}
              {watchedDestinationId && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="gap-2">
                    <MapPin className="w-3 h-3" />
                    {destinations.find(d => d._id === watchedDestinationId)?.name || 'Điểm đến đã chọn'}
                    <button
                      type="button"
                      onClick={() => {
                        setValue('destinationId', '');
                        setSearchQuery('');
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags *</Label>
            <div className="space-y-3">
              {/* Tag Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập tag và nhấn Enter..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                >
                  Thêm
                </Button>
              </div>

              {/* Tags Display */}
              {watchedTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {watchedTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-2">
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {errors.tags && (
                <p className="text-sm text-destructive">{errors.tags.message}</p>
              )}
            </div>
          </div>

          {/* Validation Summary */}
          {!isValid && isDirty && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-800 mb-2">
                📋 Cần hoàn thiện để có thể chia sẻ:
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {errors.title && <li>• {errors.title.message}</li>}
                {errors.content && <li>• {errors.content.message}</li>}
                {errors.coverImageUrl && <li>• {errors.coverImageUrl.message}</li>}
                {errors.tags && <li>• {errors.tags.message}</li>}
              </ul>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting || isImageUploading}
              className={`min-w-[120px] transition-all duration-200 ${!isValid && isDirty
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105'
                }`}
              title={
                !isValid && isDirty
                  ? 'Vui lòng hoàn thiện tất cả các trường bắt buộc'
                  : 'Chia sẻ câu chuyện của bạn'
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang chia sẻ...
                </>
              ) : isImageUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang tải ảnh...
                </>
              ) : (
                <>
                  <span className="mr-2">📝</span>
                  Chia sẻ
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryModal;
