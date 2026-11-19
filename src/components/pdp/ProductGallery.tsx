import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Sparkles } from 'lucide-react';
import { type ProductGalleryItem } from '../../data/pdpData';

interface ProductGalleryProps {
  gallery: ProductGalleryItem[];
  badge?: string;
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  gallery,
  badge,
  productName,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const activeImage = gallery[activeIndex] || gallery[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % gallery.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + gallery.length) % gallery.length);
  };

  // Mobile swipe handlers
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Main Large Display Card */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] rounded-3xl overflow-hidden bg-[#EAE5DC]/40 border border-[#E0D9CD] shadow-lg shadow-[#071F52]/5 group"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Floating Top Badge */}
        {badge && (
          <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0A2E73]/90 backdrop-blur-md text-[#F8FAFC] border border-[#E3262E]/40 shadow-md">
            <Sparkles className="w-3 h-3 text-[#E3262E]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {badge}
            </span>
          </div>
        )}

        {/* View Mode Tag */}
        <div className="absolute top-4 right-4 z-20 hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#071F52]/70 backdrop-blur-md text-[#F8FAFC] border border-white/10 text-[11px] font-medium tracking-wide">
          <span>{activeImage.label}</span>
        </div>

        {/* Fullscreen Zoom Trigger Button */}
        <button
          type="button"
          onClick={() => setIsZoomed(true)}
          className="absolute bottom-4 right-4 z-20 w-9 h-9 rounded-xl bg-white/80 hover:bg-white text-[#0A2E73] backdrop-blur-md shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer focus:opacity-100"
          aria-label="Zoom image"
          title="Zoom image"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Previous / Next Arrow Controls */}
        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#071F52] shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer focus:opacity-100"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#071F52] shadow-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer focus:opacity-100"
          aria-label="Next image"
        >
          <ChevronRight className="w-5 h-5 stroke-[2]" />
        </button>

        {/* The Active Image */}
        <div className="w-full h-full cursor-zoom-in bg-white flex items-center justify-center p-2" onClick={() => setIsZoomed(true)}>
          <img
            src={activeImage.url}
            alt={activeImage.alt || `${productName} view`}
            className="max-w-full max-h-full w-auto h-auto object-contain"
            key={activeImage.id}
          />
        </div>

        {/* Mobile Swipe Indicators Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex sm:hidden items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-xs">
          {gallery.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === idx ? 'w-4 bg-[#E3262E]' : 'w-1.5 bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail Navigation Strip */}
      <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
        {gallery.map((item, idx) => {
          const isActive = activeIndex === idx;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'border-[#E3262E] shadow-md ring-2 ring-[#E3262E]/30 scale-[1.02]'
                  : 'border-[#E3DDD1] hover:border-[#E3262E]/60 opacity-80 hover:opacity-100'
              }`}
              aria-label={`View ${item.label}`}
              aria-current={isActive ? 'true' : 'false'}
            >
              <img
                src={item.url}
                alt={item.label}
                className="w-full h-full object-cover object-center"
              />
              <span className="sr-only">{item.label}</span>
              {/* Subtle hover overlay */}
              <div className="absolute inset-0 bg-[#0A2E73]/0 group-hover:bg-[#0A2E73]/10 transition-colors pointer-events-none" />
            </button>
          );
        })}
      </div>

      {/* Lightbox / Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <button
            type="button"
            onClick={() => setIsZoomed(false)}
            className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close zoomed view"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="max-w-5xl max-h-[85vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            <img
              src={activeImage.url}
              alt={activeImage.alt}
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-sans tracking-wide">
            {activeImage.label} ({activeIndex + 1} of {gallery.length})
          </div>
        </div>
      )}
    </div>
  );
};
