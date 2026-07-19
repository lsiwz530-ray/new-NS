import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { reviewActions, type PublicReview } from "@/lib/store";

export function ReviewsSection({ title }: { title: string }) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    reviewActions.fetchPublic().then((r) => { if (mounted) { setReviews(r); setLoaded(true); } });
    return () => { mounted = false; };
  }, []);

  if (loaded && reviews.length === 0) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-primary font-bold">آراء عملائنا</div>
            <h2 className="font-display text-3xl md:text-4xl font-black neon-text-strong mt-1">{title}</h2>
          </div>
          <div className="h-px flex-1 mx-6 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        {!loaded ? (
          <div className="mt-8 text-center text-muted-foreground text-sm">جاري تحميل التقييمات...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
            {reviews.slice(0, 6).map((r) => (
              <div key={r.orderId} className="glass neon-border rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full gradient-purple flex items-center justify-center font-black text-white text-sm">
                    {r.username[0]?.toUpperCase()}
                  </div>
                  <div className="font-bold">{r.username}</div>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-4 h-4 ${n <= r.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  ))}
                </div>
                {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
