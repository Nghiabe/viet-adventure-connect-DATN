import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  placeholder?: string;
  className?: string;
}

export function ImageUploader({ value, onChange, onRemove, placeholder, className }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPreview(result);
        onChange(result);
      };
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  });

  const handleRemove = () => {
    setPreview(null);
    onRemove();
  };

  return (
    <div className={cn('space-y-3', className)}>
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-dashed border-gray-300"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          )}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>Thả ảnh vào đây...</p>
              ) : (
                <div>
                  <p className="font-medium">{placeholder || 'Kéo thả ảnh vào đây hoặc click để chọn'}</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF tối đa 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
