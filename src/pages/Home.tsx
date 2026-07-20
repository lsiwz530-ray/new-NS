import { Link } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCarousel } from "@/components/ProductCarousel";
import { ReviewsSection } from "@/components/ReviewsSection";
import { BannersSection } from "@/components/BannersSection";
import { useStore, type HomeSection, type Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck, Zap, ArrowLeft } from "lucide-react";
import { useLang } from "@/lib/i18n";

export default function Home() {
  const { q } = useSearch({ strict: false }) as { q?: string };
  const products = useStore((s) => s.products);
  const settings = useStore((s) => s.settings);
  const { t } = useLang();
  const filtered = q
    ? products.filter((p) => (p.name + p.description + p.category).toLowerCase().includes(q.toLowerCase()))
    : products;
  const featured = filtered.filter((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  const sections: HomeSection[] = settings.homeSections?.length
    ? settings.homeSections
    : [{ id: "sec-featured", type: "featured", title: "المميزة" }, { id: "sec-all", type: "all", title: "كل المنتجات" }];

  return (
    <Layout>
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 glass neon-border px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 animate-neon-pulse">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> {settings.tagline}
            </div>
            <h1 className="font-display text-6xl md:text-8xl font-black neon-text-strong leading-none animate-float">
              {settings.heroTitle}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground">{settings.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link to="/products">
                <Button size="lg" className="gradient-purple neon-glow text-lg h-12 px-8 font-bold">
                  {t("shopNow")} <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </Link>
              <a href="#featured">
                <Button size="lg" variant="outline" className="text-lg h-12 px-8 border-primary/50 hover:bg-primary/20">
                  {t("featured")}
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <FeatureCard icon={<Zap />} title="تسليم فوري" desc="استلم مفتاحك خلال دقائق بعد تأكيد التحويل" />
            <FeatureCard icon={<ShieldCheck />} title="حماية كاملة" desc="حسابك وطلباتك محفوظة باسمك ومحمية" />
            <FeatureCard icon={<Sparkles />} title="جودة أسطورية" desc="مفاتيح أصلية وسكربتات محدثة باستمرار" />
          </div>
        </div>
      </section>

      {q ? (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4">
            <SectionTitle title={`نتائج البحث "${q}"`} subtitle={`${filtered.length} منتج`} />
            {filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">لا توجد منتجات مطابقة</div>
            ) : (
              <ProductCarousel products={filtered} />
            )}
          </div>
        </section>
      ) : (
        sections.map((sec) => (
          <HomeSectionBlock key={sec.id} section={sec} featured={featured} rest={rest} all={filtered} banners={settings.banners} />
        ))
      )}
    </Layout>
  );
}

function HomeSectionBlock({
  section, featured, rest, all, banners,
}: { section: HomeSection; featured: Product[]; rest: Product[]; all: Product[]; banners: string[] }) {
  const pickManual = (base: Product[]) => {
    if (!section.productIds || section.productIds.length === 0) return base;
    const byId = new Map(all.map((p) => [p.id, p]));
    return section.productIds.map((id) => byId.get(id)).filter((p): p is Product => !!p);
  };

  if (section.type === "featured") {
    const items = pickManual(featured);
    if (items.length === 0) return null;
    return (
      <section id="featured" className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title={section.title} subtitle="اختياراتنا الأسطورية" />
          <ProductCarousel products={items} />
        </div>
      </section>
    );
  }
  if (section.type === "category") {
    const items = pickManual(all.filter((p) => p.category === section.category));
    if (items.length === 0) return null;
    return (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle title={section.title} subtitle={section.category || ""} />
          <ProductCarousel products={items} />
        </div>
      </section>
    );
  }
  if (section.type === "reviews") {
    return <ReviewsSection title={section.title} />;
  }
  if (section.type === "banners") {
    return <BannersSection title={section.title} banners={banners} />;
  }
  // type === "all"
  const items = pickManual(rest.length ? rest : all);
  if (items.length === 0) return null;
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <SectionTitle title={section.title} subtitle={`${items.length} منتج`} />
        <ProductCarousel products={items} />
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="glass neon-border rounded-2xl p-5 text-right">
      <div className="w-11 h-11 rounded-xl gradient-purple neon-glow flex items-center justify-center text-white mb-3">{icon}</div>
      <div className="font-display font-bold text-lg neon-text">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{desc}</div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-bold">{subtitle}</div>
        <h2 className="font-display text-3xl md:text-4xl font-black neon-text-strong mt-1">{title}</h2>
      </div>
      <div className="h-px flex-1 mx-6 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>
  );
}
