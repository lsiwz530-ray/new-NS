import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useStore, formatMoney, type Order } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Clock, CheckCircle2, XCircle } from "lucide-react";
import { OrderDetailsView } from "@/components/OrderDetails";
import { Button } from "@/components/ui/button";

export default function Account() {
  const currentUser = useStore((s) => s.currentUser);
  const allOrders = useStore((s) => s.orders);
  const settings = useStore((s) => s.settings);
  const orders = useMemo(
    () => allOrders.filter((o) => o.username === currentUser),
    [allOrders, currentUser]
  );

  if (!currentUser) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-4 py-24 text-center glass neon-border rounded-2xl">
          <h2 className="font-display text-2xl neon-text-strong">يجب تسجيل الدخول</h2>
          <Link to="/login"><Button className="mt-4 gradient-purple neon-glow">دخول</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="glass neon-border rounded-2xl p-6 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-purple neon-glow flex items-center justify-center text-2xl font-black text-white font-display">
            {currentUser[0].toUpperCase()}
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest">أهلًا</div>
            <h1 className="font-display text-3xl font-black neon-text-strong">{currentUser}</h1>
            <div className="text-sm text-muted-foreground">{orders.length} طلب</div>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="all">جميع الطلبات ({orders.length})</TabsTrigger>
            <TabsTrigger value="pending">قيد المعالجة ({orders.filter((o) => o.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="completed">مكتملة ({orders.filter((o) => o.status === "completed").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all"><OrdersList orders={orders} currency={settings.currency} /></TabsContent>
          <TabsContent value="pending"><OrdersList orders={orders.filter((o) => o.status === "pending")} currency={settings.currency} /></TabsContent>
          <TabsContent value="completed"><OrdersList orders={orders.filter((o) => o.status === "completed")} currency={settings.currency} /></TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function OrdersList({ orders, currency }: { orders: Order[]; currency: string }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16 glass neon-border rounded-2xl mt-4">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
        <div className="text-muted-foreground">لا توجد طلبات</div>
      </div>
    );
  }
  return (
    <div className="space-y-3 mt-4">
      {orders.map((o) => (
        <details key={o.id} className="glass neon-border rounded-xl overflow-hidden group">
          <summary className="p-4 cursor-pointer flex items-center gap-4 list-none">
            <StatusIcon status={o.status} />
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-lg">طلب #{o.id}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("ar")}</div>
            </div>
            <div className="text-left">
              <div className="font-bold neon-text">{formatMoney(o.total, currency)}</div>
              <div className="text-xs text-muted-foreground">{o.items.length} منتج</div>
            </div>
          </summary>
          <div className="border-t border-primary/20 p-4">
            <OrderDetailsView order={o} currency={currency} />
          </div>
        </details>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: Order["status"] }) {
  if (status === "completed") return <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><CheckCircle2 className="w-5 h-5" /></div>;
  if (status === "rejected") return <div className="w-10 h-10 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center"><XCircle className="w-5 h-5" /></div>;
  return <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center"><Clock className="w-5 h-5" /></div>;
}
