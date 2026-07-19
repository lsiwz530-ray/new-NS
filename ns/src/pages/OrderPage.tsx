import { Link, useParams } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useStore } from "@/lib/store";
import { OrderDetailsView } from "@/components/OrderDetails";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function OrderPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const order = useStore((s) => s.orders.find((o) => o.id === id));
  const currency = useStore((s) => s.settings.currency);

  if (!order) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h2 className="font-display text-2xl neon-text">الطلب غير موجود</h2>
          <Link to="/"><Button className="mt-4 gradient-purple neon-glow">الرئيسية</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="glass neon-border rounded-2xl p-6 mb-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full gradient-purple neon-glow flex items-center justify-center animate-neon-pulse">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-black neon-text-strong mt-4">تم استلام طلبك!</h1>
          <p className="text-muted-foreground mt-2">رقم الطلب: <span className="font-mono text-primary">#{order.id}</span></p>
          <p className="text-sm text-muted-foreground mt-1">سنراجع الإيصال ونرسل المفاتيح خلال دقائق.</p>
        </div>
        <div className="glass neon-border rounded-2xl p-6">
          <OrderDetailsView order={order} currency={currency} />
        </div>
        <div className="flex gap-2 justify-center mt-6">
          <Link to="/account"><Button className="gradient-purple neon-glow">طلباتي</Button></Link>
          <Link to="/products"><Button variant="outline" className="border-primary/50">متابعة التسوق</Button></Link>
        </div>
      </div>
    </Layout>
  );
}
