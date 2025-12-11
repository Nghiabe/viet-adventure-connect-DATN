import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Image as ImageIcon, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/services/uploadService';

interface GalleryImage {
  id: string;
  url: string;
  file?: File;
}

interface GalleryUploaderProps {
  value?: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export function GalleryUploader({ value = [], onChange, className }: GalleryUploaderProps) {
  const [images, setImages] = useState<GalleryImage[]>(
    value.map((url, index) => ({ id: `existing-${index}`, url }))
  );

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles?.length) return;

    // 1) Add previews immediately for UX
    const now = Date.now();
    const previews: GalleryImage[] = acceptedFiles.map((file, index) => ({
      id: `new-${now}-${index}`,
      url: URL.createObjectURL(file),
      file,
    }));
    const withPreviews = [...images, ...previews];
    setImages(withPreviews);

    // 2) Begin uploads and replace blob: URLs with public URLs
    const uploadedUrls: { id: string; url: string }[] = [];
    for (const item of previews) {
      try {
        const publicUrl = await uploadImage(item.file as File);
        uploadedUrls.push({ id: item.id, url: publicUrl });
        // Revoke preview to free memory
        if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
      } catch {
        // If upload fails, keep the preview only in local state but do NOT propagate blob to parent
      }
    }

    if (uploadedUrls.length) {
      const merged = withPreviews.map((img) => {
        const uploaded = uploadedUrls.find((u) => u.id === img.id);
        return uploaded ? { ...img, url: uploaded.url, file: undefined } : img;
      });
      setImages(merged);
      updateParent(merged);
    } else {
      // Ensure parent never receives blob: URLs
      updateParent(withPreviews);
    }
  }, [images]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  });

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    updateParent(updatedImages);
  };

  const updateParent = (imageList: GalleryImage[]) => {
    // Only propagate persistent URLs
    const urls = imageList
      .map((img) => img.url)
      .filter((u) => typeof u === 'string' && !u.startsWith('blob:'));
    onChange(urls);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    setImages(updatedImages);
    updateParent(updatedImages);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex) {
      moveImage(dragIndex, dropIndex);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            {isDragActive ? (
              <p>Thả ảnh vào đây...</p>
            ) : (
              <div>
                <p className="font-medium">Thêm ảnh vào thư viện</p>
                <p className="text-xs text-gray-500">Kéo thả hoặc click để chọn nhiều ảnh</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="relative">
                <img
                  src={image.url}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg">
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white cursor-move" />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(image.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                Ảnh {index + 1}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
