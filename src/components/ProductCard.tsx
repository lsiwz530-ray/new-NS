import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/store";
import { cartActions, formatMoney, useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Zap } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const currency = useStore((s) => s.settings.currency);
  const inStock = product.keys.length > 0 || product.deliveryInfo.length > 0;
  return (
    <div className="group relative">
      <div className="absolute -inset-0.5 gradient-purple rounded-2xl opacity-0 group-hover:opacity-70 blur transition duration-500" />
      <div className="relative glass neon-border rounded-2xl overflow-hidden flex flex-col h-full">
        <Link to="/product/$id" params={{ id: product.id }} className="block relative">
          <ProductImage product={product} className="aspect-[4/3] w-full" />
          <div className="absolute top-3 right-3 flex flex-col gap-1">
            {product.featured && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/90 text-primary-foreground px-2 py-1 rounded-full neon-glow flex items-center gap-1">
                <Zap className="w-3 h-3" /> مميز
              </span>
            )}
          </div>
          <div className="absolute top-3 left-3">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${inStock ? "bg-emerald-500/80 text-white" : "bg-red-500/80 text-white"}`}>
              {inStock ? "متوفر" : "نفذت الكمية"}
            </span>
          </div>
        </Link>

        <div className="p-4 flex flex-col flex-1 gap-2">
          <div className="text-[11px] uppercase tracking-widest text-primary/80 font-bold">{product.category}</div>
          <Link to="/product/$id" params={{ id: product.id }}>
            <h3 className="font-display font-bold text-lg leading-tight line-clamp-1 hover:neon-text transition">{product.name}</h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary/20">
            <div className="font-display text-xl font-black neon-text">{formatMoney(product.price, currency)}</div>
            <Button
              size="sm"
              onClick={() => { cartActions.add(product.id); toast.success("تمت الإضافة للسلة"); }}
              className="gradient-purple neon-glow"
              disabled={!inStock}
            >
              <ShoppingCart className="w-4 h-4 ml-1" /> أضف
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
