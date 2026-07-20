import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

export default function Products() {
  const products = useStore((s) => s.products);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const filtered = products.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    if (q && !(p.name + p.description).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-5xl font-black neon-text-strong">المنتجات</h1>
          <p className="text-muted-foreground mt-2">تصفح كل مفاتيح NorthSite</p>
        </div>
        <div className="glass neon-border rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-3">
          <Input placeholder="ابحث..." value={q} onChange={(e) => setQ(e.target.value)} className="bg-secondary/50 flex-1" />
          <div className="flex gap-2 flex-wrap">
            <CatBtn active={cat === "all"} onClick={() => setCat("all")}>الكل</CatBtn>
            {categories.map((c) => (
              <CatBtn key={c} active={cat === c} onClick={() => setCat(c)}>{c}</CatBtn>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">لا توجد منتجات</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </Layout>
  );
}

function CatBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${active ? "gradient-purple neon-glow text-white" : "bg-secondary hover:bg-primary/20 text-muted-foreground"}`}>
      {children}
    </button>
  );
}
