import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";

interface AvatarUploaderProps {
  currentImageUrl?: string | null;
  onFileChange: (file: File | null) => void;
}

const AvatarUploader = ({ currentImageUrl, onFileChange }: AvatarUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onFileChange(file);
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const displayUrl = useMemo(() => previewUrl || currentImageUrl || null, [previewUrl, currentImageUrl]);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border",
        isDragActive ? "ring-2 ring-primary" : "border-muted"
      )}
      aria-label="Tải ảnh đại diện"
    >
      <input {...getInputProps()} />
      {displayUrl ? (
        <img src={displayUrl} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
          <Camera className="w-8 h-8" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm transition-opacity">
        Thay đổi
      </div>
    </div>
  );
};

export default AvatarUploader;
