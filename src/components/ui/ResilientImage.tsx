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
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (src) {
      setCurrentSrc(src);
      setHasError(false);
      setIsLoading(true);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    console.warn('[ResilientImage] onError for alt=', alt, 'src=', src);
    setHasError(true);
    setCurrentSrc(fallbackSrc);
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-md" />
      )}
      
      {/* Error state */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-md">
          <ImageIcon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      
      {/* Image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}

export default ResilientImage;


