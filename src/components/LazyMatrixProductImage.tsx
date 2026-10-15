import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Sparkles } from 'lucide-react';

interface LazyMatrixProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=70';

export const LazyMatrixProductImage: React.FC<LazyMatrixProductImageProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'square',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, load immediately
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '250px 0px' } // Pre-load 250px before entering viewport for smooth scrolling
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const imageSrc = hasError || !src ? FALLBACK_IMAGE : src;

  return (
    <div
      ref={imgRef}
      className={`relative w-full overflow-hidden bg-slate-900/90 ${
        aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : 'aspect-[4/3]'
      } ${className}`}
    >
      {/* Neon Cyber Shimmer Skeleton while loading or not yet in view */}
      {(!isInView || !isLoaded) && !hasError && (
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-slate-950/95 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00ff66]/10 to-transparent animate-pulse-slow" />
          <div className="flex flex-col items-center gap-2 text-slate-700">
            <Sparkles className="w-5 h-5 text-emerald-500/40 animate-pulse" />
            <span className="text-[9px] font-mono tracking-widest text-emerald-500/50 uppercase">MATRIX STREAM</span>
          </div>
        </div>
      )}

      {/* Actual Image with Fade-In upon load */}
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-95 blur-sm'
          }`}
        />
      )}

      {/* Cyberpunk subtle holographic edge highlight */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
    </div>
  );
};
