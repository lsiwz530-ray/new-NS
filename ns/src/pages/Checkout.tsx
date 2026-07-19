import { Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useStore, formatMoney, orderActions } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Upload, CheckCircle2, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "@/components/ProductImage";

export default function Checkout() {
  const cart = useStore((s) => s.cart);
  const products = useStore((s) => s.products);
  const settings = useStore((s) => s.settings);
  const currentUser = useStore((s) => s.currentUser);
  const navigate = useNavigate();

  const items = cart.map((ci) => {
    const p = products.find((pp) => pp.id === ci.productId);
    return p ? { ...ci, product: p } : null;
  }).filter((x): x is NonNullable<typeof x> => !!x);

  const total = items.reduce((a, it) => a + it.product.price * it.quantity, 0);

  const [receipt, setReceipt] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-4 py-24 text-center glass neon-border rounded-2xl mt-16">
          <h2 className="font-display text-2xl neon-text-strong">يجب تسجيل الدخول أولًا</h2>
          <p className="text-muted-foreground mt-2">أدخل اسم المستخدم لحفظ طلبك تحت حسابك.</p>
          <Link to="/login"><Button className="mt-4 gradient-purple neon-glow">تسجيل الدخول</Button></Link>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h2 className="font-display text-2xl neon-text-strong">سلتك فارغة</h2>
          <Link to="/products"><Button className="mt-4 gradient-purple neon-glow">تسوق الآن</Button></Link>
        </div>
      </Layout>
    );
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error("حجم الصورة أكبر من 4MB"); return; }
    const r = new FileReader();
    r.onload = () => setReceipt(String(r.result));
    r.readAsDataURL(f);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success("تم النسخ"));
  }

  async function submit() {
    if (!receipt) { toast.error("ارفع صورة إيصال التحويل"); return; }
    setSubmitting(true);
    try {
      const order = await orderActions.create({ username: currentUser!, receiptImage: receipt, note });
      toast.success("تم استلام طلبك — بانتظار التأكيد");
      navigate({ to: "/order/$id", params: { id: order.id } });
    } catch {
      toast.error("تعذر إرسال الطلب");
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-4xl font-black neon-text-strong mb-2">إتمام الطلب</h1>
        <p className="text-muted-foreground mb-8">ادفع بالتحويل البنكي وارفع صورة الإيصال</p>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="space-y-6">
            <div className="glass neon-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold neon-text">تفاصيل التحويل</h2>
              </div>
              <div className="space-y-3">
                <PayRow label="البنك" value={settings.bankName} icon={settings.paymentIcons.ahliBank} />
                <PayRow label="اسم المستفيد" value={settings.accountName} />
                <PayRow label="IBAN" value={settings.iban} onCopy={() => copy(settings.iban)} mono icon={settings.paymentIcons.ahliBank} />
                <PayRow
                  label="رقم الجوال (STC Pay / Barq)"
                  value={settings.phone}
                  onCopy={() => copy(settings.phone)}
                  icons={[settings.paymentIcons.stcPay, settings.paymentIcons.barq]}
                />
                <PayRow label="المبلغ" value={formatMoney(total, settings.currency)} highlight />
              </div>
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm text-muted-foreground">
                💡 قم بتحويل المبلغ بالضبط ثم ارفع صورة الإيصال أدناه ليتم تسليم مفاتيحك.
              </div>
            </div>

            <div className="glass neon-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-primary" />
                <h2 className="font-display text-xl font-bold neon-text">صورة إيصال التحويل</h2>
              </div>

              {receipt ? (
                <div className="relative rounded-xl overflow-hidden neon-border">
                  <img src={receipt} alt="receipt" className="w-full max-h-96 object-contain bg-black/50" />
                  <button onClick={() => setReceipt("")} className="absolute top-2 left-2 bg-destructive/80 text-white px-3 py-1 rounded-lg text-sm">إزالة</button>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-primary/40 rounded-xl p-8 text-center cursor-pointer hover:bg-primary/10 transition">
                  <Upload className="w-10 h-10 mx-auto text-primary mb-2" />
                  <div className="font-semibold">اضغط لرفع صورة الإيصال</div>
                  <div className="text-xs text-muted-foreground mt-1">JPG / PNG — حتى 4MB</div>
                  <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                </label>
              )}

              <div className="mt-4">
                <Label htmlFor="note">ملاحظات (اختياري)</Label>
                <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="أي ملاحظات حول طلبك..." className="mt-1 bg-secondary/50" />
              </div>
            </div>

            <Button disabled={submitting || !receipt} onClick={submit} className="w-full h-14 text-lg font-bold gradient-purple neon-glow">
              <CheckCircle2 className="w-5 h-5 ml-2" /> تأكيد الطلب
            </Button>
          </div>

          <div className="glass neon-border rounded-2xl p-6 h-fit lg:sticky lg:top-24">
            <h3 className="font-display text-lg font-bold neon-text mb-4">ملخص الطلب</h3>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.productId} className="flex gap-3 items-center">
                  <ProductImage product={it.product} className="w-12 h-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{it.product.name}</div>
                    <div className="text-xs text-muted-foreground">× {it.quantity}</div>
                  </div>
                  <div className="text-sm font-bold text-primary">{formatMoney(it.product.price * it.quantity, settings.currency)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-primary/20 mt-4 pt-4 flex items-center justify-between">
              <span className="text-muted-foreground">الإجمالي</span>
              <span className="font-display text-2xl font-black neon-text-strong">{formatMoney(total, settings.currency)}</span>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">المستخدم: <span className="text-primary font-semibold">{currentUser}</span></div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function PayRow({
  label, value, onCopy, mono, highlight, icon, icons,
}: {
  label: string; value: string; onCopy?: () => void; mono?: boolean; highlight?: boolean;
  icon?: string; icons?: string[];
}) {
  const shownIcons = (icons && icons.length ? icons : icon ? [icon] : []).filter(Boolean);
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary/40">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {shownIcons.map((src, i) => (
          <img key={i} src={src} alt="" className="w-6 h-6 rounded object-contain bg-white/90 p-0.5" />
        ))}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`${mono ? "font-mono" : "font-semibold"} ${highlight ? "neon-text text-xl" : ""}`}>{value}</div>
        {onCopy && (
          <button onClick={onCopy} className="p-1.5 rounded hover:bg-primary/30" aria-label="نسخ">
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
