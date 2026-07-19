import type { Order } from "@/lib/store";
import { formatMoney, reviewActions } from "@/lib/store";
import { Key, Copy, MessageSquare, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function OrderDetailsView({ order, currency }: { order: Order; currency: string }) {
  function copy(t: string) { navigator.clipboard.writeText(t).then(() => toast.success("تم النسخ")); }
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <InfoRow label="رقم الطلب" value={"#" + order.id} />
        <InfoRow label="المستخدم" value={order.username} />
        <InfoRow label="الحالة" value={statusLabel(order.status)} />
        <InfoRow label="الإجمالي" value={formatMoney(order.total, currency)} />
      </div>

      {order.note && (
        <div className="glass rounded-lg p-3 text-sm">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1"><MessageSquare className="w-3 h-3" /> ملاحظاتك</div>
          <div>{order.note}</div>
        </div>
      )}

      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">المنتجات</div>
        <div className="space-y-3">
          {order.items.map((it, i) => (
            <div key={i} className="glass neon-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold">{it.productName}</div>
                  <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{it.productDescription}</div>
                </div>
                <div className="text-left flex-shrink-0">
                  <div className="text-xs text-muted-foreground">× {it.quantity}</div>
                  <div className="font-bold neon-text">{formatMoney(it.price * it.quantity, currency)}</div>
                </div>
              </div>

              {order.status === "completed" && (
                <>
                  {it.deliveryInfo && (
                    <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/30 text-sm whitespace-pre-wrap">
                      <div className="text-xs font-bold text-primary mb-1">📦 معلومات التسليم</div>
                      {it.deliveryInfo}
                    </div>
                  )}
                  {it.assignedKeys.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-bold text-primary flex items-center gap-1"><Key className="w-3 h-3" /> المفاتيح</div>
                      {it.assignedKeys.map((k, ki) => (
                        <div key={ki} className="flex items-center gap-2 bg-black/40 border border-primary/40 rounded-lg p-3">
                          <code className="flex-1 font-mono text-sm text-emerald-300 break-all">{k}</code>
                          <button onClick={() => copy(k)} className="p-1.5 rounded hover:bg-primary/30"><Copy className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
              {order.status === "pending" && (
                <div className="mt-3 text-xs text-muted-foreground italic">⏳ في انتظار تأكيد المسؤول — ستظهر المفاتيح هنا.</div>
              )}
              {order.status === "rejected" && (
                <div className="mt-3 text-xs text-red-400">✗ تم رفض الطلب. تواصل معنا.</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {order.receiptImage && (
        <details className="glass rounded-lg p-3">
          <summary className="cursor-pointer text-xs text-muted-foreground">عرض إيصال التحويل</summary>
          <img src={order.receiptImage} alt="receipt" className="mt-2 rounded-lg max-h-72 mx-auto" />
        </details>
      )}

      {order.status === "completed" && <ReviewBlock order={order} />}
    </div>
  );
}

function ReviewBlock({ order }: { order: Order }) {
  const [rating, setRating] = useState(order.rating || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(order.reviewComment || "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(!!order.rating);

  async function submit() {
    if (!rating) { toast.error("اختر تقييمًا أولًا"); return; }
    setSubmitting(true);
    try {
      await reviewActions.submit(order.id, rating, comment);
      toast.success("شكرًا لتقييمك!");
      setDone(true);
    } catch {
      toast.error("تعذر إرسال التقييم");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="glass neon-border rounded-xl p-4 text-center">
        <div className="flex justify-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`w-5 h-5 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          ))}
        </div>
        <div className="text-sm text-muted-foreground">شكرًا لتقييمك تجربتك معنا 💜</div>
        {order.reviewComment && <div className="text-sm mt-2">{order.reviewComment}</div>}
      </div>
    );
  }

  return (
    <div className="glass neon-border rounded-xl p-4">
      <div className="text-center mb-3">
        <div className="font-display font-bold neon-text">نتمنى لك يوم سعيد 🌟</div>
        <div className="text-xs text-muted-foreground mt-1">إذا حاب تسعدنا وتعلّمنا، رجاءً قيّم تجربتك معنا</div>
      </div>
      <div className="flex justify-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
            <Star className={`w-8 h-8 transition ${n <= (hover || rating) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="اكتب رأيك (اختياري)..."
        rows={2}
        className="w-full bg-secondary/50 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        disabled={submitting}
        onClick={submit}
        className="w-full mt-2 gradient-purple neon-glow rounded-lg py-2 text-sm font-bold text-white"
      >
        إرسال التقييم
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/40">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function statusLabel(s: Order["status"]) {
  return s === "completed" ? "مكتمل ✓" : s === "rejected" ? "مرفوض ✗" : "قيد المعالجة ⏳";
}
