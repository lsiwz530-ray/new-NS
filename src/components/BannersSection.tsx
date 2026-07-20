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

        <div className="flex gap-0 overflow-x-auto scrollbar-thin snap-x snap-mandatory rounded-2xl neon-border">
          {banners.map((src, i) => (
            <div
              key={i}
              className="w-full flex-shrink-0 snap-center overflow-hidden bg-black/20"
              style={{ minHeight: "80vh" }}
            >
              <img src={src} alt={`banner-${i}`} className="w-full h-full object-cover" style={{ minHeight: "80vh" }} />
            </div>
          ))}
        </div>
        {banners.length > 1 && (
          <p className="text-center text-xs text-muted-foreground mt-3">اسحب يمينًا لعرض البنر التالي — {banners.length} بنرات</p>
        )}
      </div>
    </section>
  );
}
