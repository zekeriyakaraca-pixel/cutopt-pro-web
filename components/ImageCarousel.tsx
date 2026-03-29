"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageCarousel({ images }: { images: { src: string; alt: string }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => setCurrentIndex((prev) => (prev + 1) % images.length), [images.length]);
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <div className="relative w-full aspect-video rounded-[24px] overflow-hidden bg-slate-900 border border-white/5 group">
      <AnimatePresence mode="popLayout">
        <motion.img
          key={currentIndex}
          src={images[currentIndex].src}
          alt={images[currentIndex].alt}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `/placeholder-screenshot.svg`;
          }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent opacity-40 pointer-events-none" />

      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-xl z-20">
        <ChevronLeft size={24} />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 shadow-xl z-20">
        <ChevronRight size={24} />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? "bg-blue-500 w-8 shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "bg-white/40 w-2 hover:bg-white"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
