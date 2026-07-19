export function BannersSection({ title, banners }: { title: string; banners: string[] }) {
  if (!banners || banners.length === 0) return null;
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

        <div className="flex gap-4 overflow-x-auto scrollbar-thin snap-x snap-mandatory pb-2">
          {banners.map((src, i) => (
            <div
              key={i}
              className="glass neon-border rounded-2xl flex-shrink-0 snap-center overflow-hidden bg-black/20 flex items-center justify-center"
              style={{ width: "min(90vw, 640px)", maxHeight: "70vh" }}
            >
              {/* object-contain: the full image is always shown, nothing gets cropped */}
              <img src={src} alt={`banner-${i}`} className="w-full h-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
