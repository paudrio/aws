import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";

interface CategoryBarProps {
  onCategorySelect?: (categoryName: string) => void;
}

export default function CategoryBar({ onCategorySelect }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: categories = [] } = useQuery<Category[]>({ 
    queryKey: ["/api/categories"] 
  });

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 200;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <section className="bg-[#0f172a] py-8 relative">
      <div className="container mx-auto px-4 relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div
          ref={scrollRef}
          className="flex items-center gap-12 overflow-x-auto px-10 scroll-smooth scrollbar-hide"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="flex flex-col items-center gap-3 min-w-[90px] text-white hover:text-blue-300 transition-all group flex-shrink-0"
              onClick={() => {
                if (onCategorySelect) onCategorySelect(cat.name.trim().toLowerCase());
                const el = document.getElementById('catalogo');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center transition-all group-hover:scale-110">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-2xl font-black italic">{cat.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className="text-xs font-bold whitespace-nowrap uppercase tracking-wider">{cat.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
