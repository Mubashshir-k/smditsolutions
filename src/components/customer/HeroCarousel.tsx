import { useEffect, useState, useCallback } from "react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

const slides = [hero1, hero2, hero3];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 3500);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="px-4 pt-3 pb-2">
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
        <div
          className="flex h-full transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Featured dish ${i + 1}`}
              className="w-full h-full object-cover shrink-0"
            />
          ))}
        </div>
        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current
                  ? "w-2.5 h-2.5 bg-primary-foreground"
                  : "w-2 h-2 bg-primary-foreground/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
