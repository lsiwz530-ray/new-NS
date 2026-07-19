import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useStore, cartActions, formatMoney } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowRight, ShieldCheck, Zap, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ProductPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const product = useStore((s) => s.products.find((p) => p.id === id));
  const settings = useStore((s) => s.settings);
  const [qty, setQty] = useState(1);
  const navigate = useNavigate();

  if (!product) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-display text-3xl neon-text">المنتج غير موجود</h1>
          <Link to="/products" className="text-primary mt-4 inline-block">العودة للمنتجات</Link>
        </div>
      </Layout>
    );
  }
  const inStock = true; // stock hidden from public; assume available

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <Link to="/products" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-6">
          <ArrowRight className="w-4 h-4" /> رجوع للمنتجات
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative">
            <div className="absolute -inset-1 gradient-purple rounded-3xl blur-xl opacity-40" />
            <ProductImage product={product} className="relative aspect-square rounded-3xl neon-border" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-xs uppercase tracking-widest text-primary font-bold">{product.category}</div>
            <h1 className="font-display text-4xl md:text-5xl font-black neon-text-strong leading-tight">{product.name}</h1>
            <div className="font-display text-4xl font-black neon-text">{formatMoney(product.price, settings.currency)}</div>

            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>

            <div className="glass neon-border rounded-xl p-4 mt-2 flex items-center gap-3">
              <span className="text-sm text-muted-foreground">الكمية:</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-lg bg-secondary hover:bg-primary/30">-</button>
                <span className="w-10 text-center font-bold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-lg bg-secondary hover:bg-primary/30">+</button>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <Button
                onClick={() => { cartActions.add(product.id, qty); toast.success("تمت الإضافة للسلة"); }}
                disabled={!inStock}
                className="flex-1 gradient-purple neon-glow h-12 text-lg font-bold"
              >
                <ShoppingCart className="w-5 h-5 ml-2" /> أضف للسلة
              </Button>
              <Button
                onClick={() => { cartActions.add(product.id, qty); navigate({ to: "/checkout" }); }}
                disabled={!inStock}
                variant="outline"
                className="h-12 text-lg font-bold border-primary/50 hover:bg-primary/20"
              >
                شراء الآن
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <MiniFeature icon={<Zap />} label="تسليم فوري" />
              <MiniFeature icon={<ShieldCheck />} label="آمن 100%" />
              <MiniFeature icon={<Package />} label="أصلي" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function MiniFeature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="glass neon-border rounded-lg p-3 text-center">
      <div className="mx-auto w-8 h-8 rounded-lg gradient-purple flex items-center justify-center text-white mb-1">{icon}</div>
      <div className="text-xs font-semibold">{label}</div>
    </div>
  );
}
