import { Link, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useStore, formatMoney, orderActions, couponActions } from "@/lib/store";
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
    if (!p) return null;
    const variant = ci.variantId ? p.variants?.find((v) => v.id === ci.variantId) : undefined;
    return { ...ci, product: p, unitPrice: variant ? variant.price : p.price, variantLabel: variant?.label };
  }).filter((x): x is NonNullable<typeof x> => !!x);

  const subtotal = items.reduce((a, it) => a + it.unitPrice * it.quantity, 0);

  const [receipt, setReceipt] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const discount = coupon ? Math.round(subtotal * coupon.percent) / 100 : 0;
  const total = Math.max(0, subtotal - discount);

  async function applyCoupon() {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    const res = await couponActions.validate(couponInput.trim());
    setCheckingCoupon(false);
    if (res.valid) {
      setCoupon({ code: res.code!, percent: res.percent! });
      toast.success(`تم تفعيل كوبون خصم ${res.percent}%`);
    } else {
      setCoupon(null);
      toast.error("كوبون غير صالح");
    }
  }

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
      const order = await orderActions.create({ username: currentUser!, receiptImage: receipt, note, couponCode: coupon?.code });
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
              <div className="space-y-4">
                {(settings.ibans && settings.ibans.length ? settings.ibans : [{ id: "x", bankName: settings.bankName, accountName: settings.accountName, iban: settings.iban }]).map((b) => (
                  <div key={b.id} className="rounded-xl border border-primary/20 p-3 space-y-2 bg-secondary/20">
                    <PayRow label="البنك" value={b.bankName} icon={settings.paymentIcons.ahliBank} />
                    <PayRow label="اسم المستفيد" value={b.accountName} />
                    <PayRow label="IBAN" value={b.iban} onCopy={() => copy(b.iban)} mono />
                  </div>
                ))}
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
                <div key={it.productId + (it.variantId || "")} className="flex gap-3 items-center">
                  <ProductImage product={it.product} className="w-12 h-12 rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{it.product.name}{it.variantLabel ? ` — ${it.variantLabel}` : ""}</div>
                    <div className="text-xs text-muted-foreground">× {it.quantity}</div>
                  </div>
                  <div className="text-sm font-bold text-primary">{formatMoney(it.unitPrice * it.quantity, settings.currency)}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="كود الخصم"
                className="flex-1 rounded-lg bg-secondary/50 border border-primary/20 px-3 py-2 text-sm"
              />
              <Button size="sm" variant="outline" disabled={checkingCoupon} onClick={applyCoupon} className="border-primary/40">تطبيق</Button>
            </div>
            {coupon && (
              <div className="mt-2 text-xs text-emerald-400 flex items-center justify-between">
                <span>كوبون {coupon.code} مُفعّل (-{coupon.percent}%)</span>
                <button onClick={() => { setCoupon(null); setCouponInput(""); }} className="text-muted-foreground hover:text-destructive">إزالة</button>
              </div>
            )}

            <div className="border-t border-primary/20 mt-4 pt-4 space-y-1">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>المجموع الفرعي</span>
                <span>{formatMoney(subtotal, settings.currency)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-400">
                  <span>الخصم</span>
                  <span>- {formatMoney(discount, settings.currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="font-display text-2xl font-black neon-text-strong">{formatMoney(total, settings.currency)}</span>
              </div>
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
