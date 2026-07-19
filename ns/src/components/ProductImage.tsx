import type { Product } from "@/lib/store";

export function ProductImage({ product, className = "" }: { product: Product; className?: string }) {
  if (product.image) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  // Generative fallback: neon initials on gradient
  const initials = product.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const hue = Math.abs(hash(product.id)) % 60 + 270; // purples/pinks
  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{
        background: `radial-gradient(circle at 30% 20%, hsl(${hue} 70% 40%), hsl(${hue + 30} 60% 15%) 70%)`,
      }}
    >
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,.3) 1px, transparent 1px)", backgroundSize: "12px 12px" }} />
      <span className="relative font-display font-black text-white neon-text-strong text-xl">{initials}</span>
    </div>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}
