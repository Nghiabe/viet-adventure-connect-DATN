import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadImage, validateImageFile } from '@/services/uploadService';

// 1. Define a clear props interface with defensive defaults
interface ImageUploaderProps {
  value?: string;
  onChange: (value: string) => void;
  onError?: (error: string) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  onUploadSuccess?: (url: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ImageUploader({ 
  value, 
  onChange, 
  onError, 
  onUploadStart,
  onUploadEnd,
  onUploadSuccess,
  className,
  disabled = false 
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Validate file using our service
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      // Defensive check for error callback
      if (onError && typeof onError === 'function') {
        onError(validation.error || 'File không hợp lệ');
      }
      return;
    }

    setIsUploading(true);
    
    // 2. Defensive check before calling the prop function
    if (onUploadStart && typeof onUploadStart === 'function') {
      onUploadStart();
    }
    
    try {
      // Create preview URL for immediate display
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      
      // Upload to our self-hosted server using our service
      const uploadUrl = await uploadImage(file);
      
      // Update the form with the real, public URL
      onChange(uploadUrl);
      
      // Clean up the preview URL since we now have the real one
      URL.revokeObjectURL(preview);
      setPreviewUrl(uploadUrl);
      
      // 3. Call the success callback if provided
      if (onUploadSuccess && typeof onUploadSuccess === 'function') {
        onUploadSuccess(uploadUrl);
      }
      
    } catch (error: any) {
      // 4. Defensive check for the error callback
      if (onError && typeof onError === 'function') {
        onError(error.message || 'Lỗi khi tải ảnh lên. Vui lòng thử lại.');
      }
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      
      // 5. Defensive check for the end callback
      if (onUploadEnd && typeof onUploadEnd === 'function') {
        onUploadEnd();
      }
    }
  }, [onChange, onError, onUploadStart, onUploadEnd, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    disabled: disabled || isUploading
  });

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange('');
  };

  const handleChange = () => {
    // This allows users to click to select a new file even when preview is shown
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onDrop([file]);
      }
    };
    input.click();
  };

  if (previewUrl) {
    return (
      <div className={cn("relative group", className)}>
        <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
              <button
                type="button"
                onClick={handleChange}
                disabled={disabled || isUploading}
                className="px-3 py-1.5 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Thay đổi
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled || isUploading}
                className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-white text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-sm">Đang tải ảnh lên...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "w-full h-48 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer",
        isDragActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        {isUploading ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-gray-600" />
            <p className="text-sm text-gray-600">Đang tải ảnh lên...</p>
          </>
        ) : (
          <>
            <Upload className={cn(
              "w-12 h-12 mb-3",
              isDragActive ? "text-blue-500" : "text-gray-400"
            )} />
            <p className={cn(
              "text-sm font-medium mb-1",
              isDragActive ? "text-blue-600" : "text-gray-600"
            )}>
              {isDragActive 
                ? "Thả ảnh vào đây" 
                : "Kéo và thả ảnh vào đây, hoặc nhấp để chọn tệp"
              }
            </p>
            <p className="text-xs text-gray-500">
              Hỗ trợ: JPG, PNG, GIF, WebP (tối đa 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
}
