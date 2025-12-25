import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';

type ResilientImageProps = {
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
};

const defaultFallback = '/placeholder.svg';

export function ResilientImage({ src, alt, className, fallbackSrc = defaultFallback }: ResilientImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc);
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setImgError(false);
      setIsLoading(true);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setImgError(false);
  };

  const handleError = () => {
    if (!imgError && currentSrc !== fallbackSrc) {
      // Try fallback
      setCurrentSrc(fallbackSrc);
      setImgError(true); // Mark primary as failed, but don't show error UI yet if fallback loads
    } else {
      // Fallback also failed or we are already on fallback
      setIsLoading(false);
      setImgError(true);
    }
  };

  return (
    <div className={`relative ${className} overflow-hidden bg-gray-100 rounded-md`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse z-10" />
      )}

      {/* Actual Error UI (Only if fallback fails too) */}
      {imgError && currentSrc === fallbackSrc && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50 z-0">
          <ImageIcon className="h-8 w-8 mb-2" />
          <span className="text-xs">No Image</span>
        </div>
      )}

      {/* Image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}

export default ResilientImage;


