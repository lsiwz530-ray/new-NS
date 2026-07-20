import { useEffect, useRef, useState } from "react";

export function BannersSection({ title, banners }: { title: string; banners: string[] }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = banners?.length || 0;

  // Auto-advance to the next banner every 4 seconds.
  useEffect(() => {
    if (count <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 4000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count]);

  if (!banners || banners.length === 0) return null;

  function goTo(i: number) {
    setIndex(((i % count) + count) % count);
    // Reset the auto-timer so a manual click doesn't get instantly overridden.
    if (timerRef.current) clearInterval(timerRef.current);
    if (count > 1) {
      timerRef.current = setInterval(() => setIndex((v) => (v + 1) % count), 4000);
    }
  }

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-bold">لمحة عن متجرنا</div>
            <h2 className="font-display text-3xl md:text-4xl font-black neon-text-strong mt-1">{title}</h2>
          </div>
          <div className="h-px flex-1 mx-6 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        <div className="relative overflow-hidden rounded-2xl neon-border glass">
          {/* Track: slides right-to-left since the site is RTL. */}
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(${index * 100}%)` }}
          >
            {banners.map((src, i) => (
              <div key={i} className="w-full flex-shrink-0 aspect-[21/9] sm:aspect-[3/1] bg-black/20">
                <img src={src} alt={`banner-${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {count > 1 && (
            <>
              <button
                onClick={() => goTo(index - 1)}
                aria-label="السابق"
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass neon-border items-center justify-center hover:bg-primary/20 transition"
              >
                ›
              </button>
              <button
                onClick={() => goTo(index + 1)}
                aria-label="التالي"
                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full glass neon-border items-center justify-center hover:bg-primary/20 transition"
              >
                ‹
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`بنر ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-primary neon-glow" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
