import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  image: string;
  title: string;
  link: string;
  isActive: boolean;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const touchStartRef = useRef<number>(0);

  useEffect(() => {
    fetch("/api/banners")
      .then(res => res.json())
      .then(data => {
        const active = (Array.isArray(data) ? data : []).filter((b: Banner) => b.isActive);
        setBanners(active);
      })
      .catch(() => setBanners([]));
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length > 1) {
      timerRef.current = setInterval(() => {
        goTo(1);
      }, 3000);
    }
  }, [banners.length]);

  const goTo = useCallback((dir: number) => {
    if (isAnimating || banners.length <= 1) return;
    setIsAnimating(true);
    setCurrentIndex(prev => (prev + dir + banners.length) % banners.length);
    setTimeout(() => setIsAnimating(false), 500);
  }, [isAnimating, banners.length]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  const handlePrev = () => { goTo(-1); resetTimer(); };
  const handleNext = () => { goTo(1); resetTimer(); };
  const handleDot = (idx: number) => {
    if (isAnimating || idx === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(idx);
    setTimeout(() => setIsAnimating(false), 500);
    resetTimer();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  if (banners.length === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "#000", height: "clamp(280px, 55vh, 500px)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0">
        {banners.map((banner, idx) => (
          <div
            key={banner.id}
            className="absolute inset-0 transition-all duration-500 ease-in-out"
            style={{
              opacity: idx === currentIndex ? 1 : 0,
              pointerEvents: idx === currentIndex ? "auto" : "none",
            }}
          >
            {/* Fondo desenfocado — rellena todo el espacio en PC */}
            <img
              src={banner.image}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover scale-110"
              style={{ filter: 'blur(18px) brightness(0.55)', transform: 'scale(1.15)' }}
              draggable={false}
            />

            {/* Imagen completa centrada encima */}
            {banner.link ? (
              <a href={banner.link} target="_blank" rel="noopener noreferrer" className="relative block w-full h-full flex items-center justify-center">
                <img
                  src={banner.image}
                  alt={banner.title || "Oferta"}
                  className="relative max-w-full max-h-full object-contain drop-shadow-2xl"
                  style={{ maxHeight: '100%' }}
                  draggable={false}
                />
              </a>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={banner.image}
                  alt={banner.title || "Oferta"}
                  className="max-w-full max-h-full object-contain drop-shadow-2xl"
                  style={{ maxHeight: '100%' }}
                  draggable={false}
                />
              </div>
            )}

            {banner.title && idx === currentIndex && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-8">
                <h3 className="text-white font-display font-black text-lg md:text-3xl uppercase tracking-tight drop-shadow-lg">
                  {banner.title}
                </h3>
              </div>
            )}
          </div>
        ))}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 hover:bg-primary text-white flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 hover:bg-primary text-white flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDot(idx)}
                className={`rounded-full transition-all duration-400 ${
                  idx === currentIndex
                    ? "w-8 h-2.5 bg-primary shadow-lg shadow-primary/50"
                    : "w-2.5 h-2.5 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
