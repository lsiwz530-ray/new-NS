import { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/store";

const VISIBLE = 4;   // كم منتج يظهر بنفس الوقت
const STEP = 2;       // كم منتج ينسحب مع كل سحبة/ضغطة سهم

export function ProductCarousel({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const overflowing = products.length > VISIBLE;

  function updateEdges() {
    const el = trackRef.current;
    if (!el) return;
    // RTL: scrollLeft starts at 0 and goes negative as you scroll toward the end.
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft >= -4);
    setAtEnd(Math.abs(el.scrollLeft) >= max - 4);
  }

  useEffect(() => { updateEdges(); }, [products.length]);

  function scrollByCards(dir: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const cardWidth = card ? card.getBoundingClientRect().width + 20 : el.clientWidth / VISIBLE;
    el.scrollBy({ left: dir * cardWidth * STEP * -1, behavior: "smooth" });
  }

  if (!overflowing) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mt-8">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    );
  }

  return (
    <div className="relative mt-8">
      {!atStart && (
        <button
          onClick={() => scrollByCards(-1)}
          aria-label="السابق"
          className="hidden md:flex absolute -right-4 top-[calc(50%-1.25rem)] -translate-y-1/2 z-10 w-10 h-10 rounded-full glass neon-border items-center justify-center hover:bg-primary/20 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      {!atEnd && (
        <button
          onClick={() => scrollByCards(1)}
          aria-label="التالي"
          className="hidden md:flex absolute -left-4 top-[calc(50%-1.25rem)] -translate-y-1/2 z-10 w-10 h-10 rounded-full glass neon-border items-center justify-center hover:bg-primary/20 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <div
        ref={trackRef}
        onScroll={updateEdges}
        className="flex gap-3 sm:gap-5 overflow-x-auto scrollbar-thin snap-x snap-mandatory scroll-smooth"
      >
        {products.map((p) => (
          <div
            key={p.id}
            data-card
            className="snap-start flex-shrink-0 w-[calc(50%-8px)] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
