import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore, cartActions, formatMoney } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ProductImage } from "./ProductImage";

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const settings = useStore((s) => s.settings);
  const navigate = useNavigate();

  const items = cart.map((ci) => {
    const p = products.find((pp) => pp.id === ci.productId);
    return p ? { ...ci, product: p } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);

  const total = items.reduce((a, it) => a + it.product.price * it.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="bg-background/95 backdrop-blur-xl border-primary/30 w-full sm:max-w-md flex flex-col p-0" dir="rtl">
        <SheetHeader className="p-6 border-b border-primary/20">
          <SheetTitle className="flex items-center gap-2 neon-text-strong font-display text-2xl">
            <ShoppingBag className="w-6 h-6" />
            سلة المشتريات
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/30 blur-2xl animate-neon-pulse" />
              <ShoppingBag className="relative w-20 h-20 text-primary/70" />
            </div>
            <div>
              <div className="font-display text-lg neon-text">السلة فارغة</div>
              <p className="text-sm text-muted-foreground mt-1">أضف منتجات لتراها هنا</p>
            </div>
            <Button onClick={() => { onOpenChange(false); navigate({ to: "/products" }); }} className="gradient-purple neon-glow">
              تصفح المنتجات
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
              {items.map((it) => (
                <div key={it.productId} className="glass neon-border rounded-xl p-3 flex gap-3">
                  <ProductImage product={it.product} className="w-16 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{it.product.name}</div>
                    <div className="text-primary font-bold text-sm neon-text">{formatMoney(it.product.price, settings.currency)}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => cartActions.setQty(it.productId, it.quantity - 1)} className="w-7 h-7 rounded-md bg-secondary hover:bg-primary/30 flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-semibold">{it.quantity}</span>
                      <button onClick={() => cartActions.setQty(it.productId, it.quantity + 1)} className="w-7 h-7 rounded-md bg-secondary hover:bg-primary/30 flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                      <button onClick={() => cartActions.remove(it.productId)} className="mr-auto p-1.5 rounded-md text-destructive hover:bg-destructive/20">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-primary/20 p-6 space-y-4 glass">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="font-display text-2xl font-black neon-text-strong">{formatMoney(total, settings.currency)}</span>
              </div>
              <Button
                onClick={() => { onOpenChange(false); navigate({ to: "/checkout" }); }}
                className="w-full gradient-purple neon-glow text-lg font-bold h-12"
              >
                إتمام الطلب
              </Button>
              <Link to="/products" onClick={() => onOpenChange(false)} className="block text-center text-sm text-muted-foreground hover:text-primary">
                متابعة التسوق
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
