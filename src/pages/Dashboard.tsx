import { useNavigate, Link } from "@tanstack/react-router";
import {
  useStore, adminActions, productActions, settingsActions, orderActions,
  staffActions, chatActions, statsActions, reviewAdminActions, couponActions,
  formatMoney, type Product, type Order, type SiteSettings, type HomeSection,
  type ChatThread, type ChatMessage, type SiteStats, type Coupon,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, Key, Package, ShoppingBag, Settings as SettingsIcon,
  LogOut, CheckCircle2, XCircle, Eye, Home, Users, LayoutList, ArrowUp, ArrowDown,
  UserCog, MessageCircle, BarChart3, Star, Send, EyeOff, MessageSquareOff, Image as ImageIcon, Tag,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { NetworkBackground } from "@/components/NetworkBackground";
import { ProductImage } from "@/components/ProductImage";
import { OrderDetailsView } from "@/components/OrderDetails";

export default function Dashboard() {
  const authed = useStore((s) => !!s.adminToken);
  const navigate = useNavigate();
  useEffect(() => { if (!authed) navigate({ to: "/auth" }); }, [authed, navigate]);
  const products = useStore((s) => s.products);
  const orders = useStore((s) => s.orders);
  const users = useStore((s) => s.users);
  if (!authed) return null;

  return (
    <div className="relative min-h-screen" dir="rtl">
      <NetworkBackground />
      <div className="relative z-10">
        <header className="glass border-b border-primary/20 sticky top-0 z-30">
          <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-4">
            <div className="font-display text-2xl font-black neon-text-strong">لوحة NorthSite</div>
            <div className="mr-auto flex gap-2">
              <Link to="/"><Button variant="outline" size="sm" className="border-primary/50"><Home className="w-4 h-4 ml-1" /> الموقع</Button></Link>
              <Button variant="outline" size="sm" className="border-destructive/50 text-destructive" onClick={() => { adminActions.logout(); navigate({ to: "/" }); }}>
                <LogOut className="w-4 h-4 ml-1" /> خروج
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <StatCard icon={<Package />} label="المنتجات" value={products.length} />
            <StatCard icon={<ShoppingBag />} label="الطلبات" value={orders.length} />
            <StatCard icon={<CheckCircle2 />} label="مكتملة" value={orders.filter((o) => o.status === "completed").length} />
            <StatCard icon={<Users />} label="المستخدمون" value={users.length} />
          </div>

          <Tabs defaultValue="products">
            <TabsList className="bg-secondary/50 flex-wrap h-auto">
              <TabsTrigger value="products"><Package className="w-4 h-4 ml-1" /> المنتجات</TabsTrigger>
              <TabsTrigger value="orders"><ShoppingBag className="w-4 h-4 ml-1" /> الطلبات</TabsTrigger>
              <TabsTrigger value="users"><Users className="w-4 h-4 ml-1" /> المستخدمون</TabsTrigger>
              <TabsTrigger value="sections"><LayoutList className="w-4 h-4 ml-1" /> الأقسام</TabsTrigger>
              <TabsTrigger value="coupons"><Tag className="w-4 h-4 ml-1" /> الكوبونات</TabsTrigger>
              <TabsTrigger value="reviews"><Star className="w-4 h-4 ml-1" /> التقييمات</TabsTrigger>
              <TabsTrigger value="team"><UserCog className="w-4 h-4 ml-1" /> الفريق</TabsTrigger>
              <TabsTrigger value="chats"><MessageCircle className="w-4 h-4 ml-1" /> الدردشات</TabsTrigger>
              <TabsTrigger value="stats"><BarChart3 className="w-4 h-4 ml-1" /> الإحصائيات</TabsTrigger>
              <TabsTrigger value="settings"><SettingsIcon className="w-4 h-4 ml-1" /> الإعدادات</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="mt-4"><ProductsAdmin /></TabsContent>
            <TabsContent value="orders" className="mt-4"><OrdersAdmin /></TabsContent>
            <TabsContent value="users" className="mt-4"><UsersAdmin /></TabsContent>
            <TabsContent value="sections" className="mt-4"><SectionsAdmin /></TabsContent>
            <TabsContent value="coupons" className="mt-4"><CouponsAdmin /></TabsContent>
            <TabsContent value="reviews" className="mt-4"><ReviewsAdmin /></TabsContent>
            <TabsContent value="team" className="mt-4"><TeamAdmin /></TabsContent>
            <TabsContent value="chats" className="mt-4"><ChatsAdmin /></TabsContent>
            <TabsContent value="stats" className="mt-4"><StatsAdmin /></TabsContent>
            <TabsContent value="settings" className="mt-4"><SettingsAdmin /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ---------- Coupons ----------
function CouponsAdmin() {
  const coupons = useStore((s) => s.coupons);
  const products = useStore((s) => s.products);
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  function toggleExcluded(id: string) {
    setExcluded((e) => e.includes(id) ? e.filter((x) => x !== id) : [...e, id]);
  }

  async function add() {
    if (!code.trim() || !percent) { toast.error("أدخل الكود ونسبة الخصم"); return; }
    const p = Math.max(1, Math.min(100, parseInt(percent) || 0));
    setSaving(true);
    try {
      await couponActions.add(code.trim().toUpperCase(), p, excluded);
      toast.success("تم إضافة الكوبون");
      setCode(""); setPercent(""); setExcluded([]);
    } catch { toast.error("تعذر إضافة الكوبون"); }
    setSaving(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="glass neon-border rounded-2xl p-5 h-fit">
        <h3 className="font-display text-lg font-bold neon-text mb-4">إضافة كوبون جديد</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground">كود الكوبون</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="مثال: NORTH20" className="bg-secondary/50 mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">نسبة الخصم %</Label>
            <Input type="number" min={1} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="مثال: 20" className="bg-secondary/50 mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">منتجات مستثناة من الخصم (اختياري)</Label>
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="w-full mt-1 bg-secondary/50 border border-primary/20 rounded-md px-3 py-2 text-sm text-right flex items-center justify-between"
            >
              <span className="text-muted-foreground">
                {excluded.length === 0 ? "كل المنتجات تتأثر بالكوبون" : `${excluded.length} منتج مستثنى`}
              </span>
              <span className="text-xs">▾</span>
            </button>
            {pickerOpen && (
              <div className="mt-1 max-h-56 overflow-y-auto scrollbar-thin border border-primary/20 rounded-md bg-secondary/30 p-2 space-y-1">
                {products.length === 0 && <div className="text-xs text-muted-foreground p-2">لا توجد منتجات بعد</div>}
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded hover:bg-primary/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={excluded.includes(p.id)}
                      onChange={() => toggleExcluded(p.id)}
                      className="accent-primary"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="text-[11px] text-muted-foreground mt-1">المنتجات المختارة هنا ما راح ينطبق عليها خصم هذا الكوبون، والباقي ينخصم عادي.</div>
          </div>
          <Button onClick={add} disabled={saving} className="w-full gradient-purple neon-glow">
            <Plus className="w-4 h-4 ml-1" /> إضافة الكوبون
          </Button>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold neon-text mb-4">الكوبونات ({coupons.length})</h2>
        {coupons.length === 0 && <div className="text-center py-16 text-muted-foreground glass neon-border rounded-xl">لا توجد كوبونات بعد</div>}
        <div className="grid gap-3">
          {coupons.map((c) => (
            <div key={c.code} className="glass neon-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg gradient-purple neon-glow flex items-center justify-center text-white shrink-0"><Tag className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="font-mono font-bold">{c.code}</div>
                <div className="text-xs text-muted-foreground">
                  خصم {c.percent}%
                  {!!c.excludedProductIds?.length && ` • ${c.excludedProductIds.length} منتج مستثنى`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={!!c.active} onCheckedChange={(v) => couponActions.setActive(c.code, v)} />
                <Button size="sm" variant="outline" className="border-destructive/50 text-destructive"
                  onClick={async () => { if (confirm("حذف الكوبون؟")) { await couponActions.remove(c.code); toast.success("تم الحذف"); } }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="glass neon-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-lg gradient-purple neon-glow flex items-center justify-center text-white">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-black font-display neon-text">{value}</div>
      </div>
    </div>
  );
}

function ProductsAdmin() {
  const products = useStore((s) => s.products);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl font-bold neon-text">المنتجات ({products.length})</h2>
        <Button onClick={() => setCreating(true)} className="gradient-purple neon-glow"><Plus className="w-4 h-4 ml-1" /> إضافة منتج</Button>
      </div>
      <div className="grid gap-3">
        {products.map((p) => (
          <div key={p.id} className="glass neon-border rounded-xl p-4 flex items-center gap-4">
            <ProductImage product={p} className="w-16 h-16 rounded-lg flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-bold truncate">{p.name}</div>
                {p.featured && <Badge className="gradient-purple">مميز</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">
                {p.category} • {p.variants && p.variants.length > 0
                  ? p.variants.map((v) => `${v.label}: ${(v.keys || []).length}`).join(" • ")
                  : `${p.keys.length} مفتاح متاح`}
              </div>
              <div className="text-sm font-bold neon-text mt-1 flex items-center gap-2">
                {p.variants && p.variants.length > 0 ? (
                  <span>من {formatMoney(Math.min(...p.variants.map((v) => v.price)))} ({p.variants.length} خيارات اشتراك)</span>
                ) : (
                  <>
                    {formatMoney(p.price)}
                    {p.compareAtPrice && p.compareAtPrice > p.price && (
                      <span className="text-xs text-muted-foreground line-through font-normal">{formatMoney(p.compareAtPrice)}</span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-primary/50" onClick={() => setEditing(p)}><Pencil className="w-3 h-3" /></Button>
              <Button size="sm" variant="outline" className="border-destructive/50 text-destructive"
                onClick={async () => { if (confirm("حذف المنتج؟")) { await productActions.remove(p.id); toast.success("تم الحذف"); } }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <ProductDialog open={creating} onOpenChange={setCreating} categories={categories} />
      <ProductDialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)} product={editing || undefined} categories={categories} />
    </div>
  );
}

function ProductDialog({ open, onOpenChange, product, categories = [] }: { open: boolean; onOpenChange: (v: boolean) => void; product?: Product; categories?: string[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [image, setImage] = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [featured, setFeatured] = useState(false);
  const [keysText, setKeysText] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [variants, setVariants] = useState<{ id: string; label: string; price: string; keysText: string }[]>([]);

  useEffect(() => {
    if (product) {
      setName(product.name); setDescription(product.description); setPrice(String(product.price));
      setCategory(product.category); setImage(product.image); setDeliveryInfo(product.deliveryInfo);
      setFeatured(!!product.featured); setKeysText(product.keys.join("\n"));
      setAddingCategory(!!product.category && !categories.includes(product.category));
      setCompareAtPrice(product.compareAtPrice != null ? String(product.compareAtPrice) : "");
      setVariants((product.variants || []).map((v) => ({ id: v.id, label: v.label, price: String(v.price), keysText: (v.keys || []).join("\n") })));
    } else if (open) {
      setName(""); setDescription(""); setPrice(""); setCategory(""); setImage("");
      setDeliveryInfo(""); setFeatured(false); setKeysText(""); setAddingCategory(categories.length === 0);
      setCompareAtPrice(""); setVariants([]);
    }
  }, [product, open]);

  function addVariant() {
    setVariants((v) => [...v, { id: "v" + Date.now() + Math.random().toString(36).slice(2, 6), label: "", price: "", keysText: "" }]);
  }
  function updateVariant(i: number, patch: Partial<{ label: string; price: string; keysText: string }>) {
    setVariants((v) => v.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  }
  function removeVariant(i: number) {
    setVariants((v) => v.filter((_, idx) => idx !== i));
  }

  function onImgFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error("الصورة أكبر من 2MB"); return; }
    const r = new FileReader(); r.onload = () => setImage(String(r.result)); r.readAsDataURL(f);
  }
  async function save() {
    if (!name.trim() || !price) { toast.error("الاسم والسعر مطلوبان"); return; }
    const keys = keysText.split("\n").map((k) => k.trim()).filter(Boolean);
    const cleanVariants = variants
      .filter((v) => v.label.trim() && v.price)
      .map((v) => ({
        id: v.id, label: v.label.trim(), price: parseFloat(v.price) || 0,
        keys: v.keysText.split("\n").map((k) => k.trim()).filter(Boolean),
      }));
    const data = {
      name: name.trim(), description: description.trim(), price: parseFloat(price) || 0,
      category: category.trim() || "عام", image, deliveryInfo: deliveryInfo.trim(), featured, keys,
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      variants: cleanVariants,
    };
    if (product) { await productActions.update(product.id, data); toast.success("تم التعديل"); }
    else { await productActions.add(data); toast.success("تم إضافة المنتج"); }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background border-primary/30 max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader><DialogTitle className="font-display text-2xl neon-text">{product ? "تعديل منتج" : "إضافة منتج"}</DialogTitle></DialogHeader>
        <Tabs defaultValue="basic">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="basic">أساسي</TabsTrigger>
            <TabsTrigger value="pricing">الاشتراكات والخصم</TabsTrigger>
            <TabsTrigger value="delivery">التسليم والمفاتيح</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>اسم المنتج *</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary/50 mt-1" /></div>
              <div>
                <Label>التصنيف</Label>
                {addingCategory ? (
                  <div className="flex gap-2 mt-1">
                    <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="اكتب اسم قسم جديد" className="bg-secondary/50" autoFocus />
                    {categories.length > 0 && (
                      <Button type="button" variant="outline" className="border-primary/50 shrink-0" onClick={() => { setAddingCategory(false); setCategory(categories[0] || ""); }}>
                        اختيار من القائمة
                      </Button>
                    )}
                  </div>
                ) : (
                  <Select value={category} onValueChange={(v) => { if (v === "__new__") { setAddingCategory(true); setCategory(""); } else { setCategory(v); } }}>
                    <SelectTrigger className="bg-secondary/50 mt-1 w-full"><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      <SelectItem value="__new__">+ إضافة قسم جديد</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div><Label>الوصف</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="bg-secondary/50 mt-1" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>السعر *</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="bg-secondary/50 mt-1" /></div>
              <div className="flex items-end"><div className="flex items-center gap-2 h-10"><Switch checked={featured} onCheckedChange={setFeatured} id="featured" /><Label htmlFor="featured">منتج مميز</Label></div></div>
            </div>
            <div>
              <Label>الصورة</Label>
              <div className="mt-1 flex items-center gap-3">
                {image && (
                  <div className="relative">
                    <img src={image} className="w-24 h-24 object-cover rounded-lg neon-border" alt="preview" />
                    <button onClick={() => setImage("")} className="absolute -top-2 -left-2 bg-destructive text-white w-6 h-6 rounded-full text-xs">×</button>
                  </div>
                )}
                <label className="cursor-pointer px-4 py-2 rounded-lg bg-secondary hover:bg-primary/30 text-sm">
                  رفع صورة<input type="file" accept="image/*" className="hidden" onChange={onImgFile} />
                </label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-5 mt-4">
            <div>
              <Label>السعر قبل الخصم (تسويقي — اختياري)</Label>
              <Input type="number" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="مثال: 150 (سيظهر مشطوبًا فوق السعر الحالي)" className="bg-secondary/50 mt-1" />
              <div className="text-xs text-muted-foreground mt-1">يُستخدم فقط إذا لم يكن للمنتج خيارات اشتراك.</div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>خيارات الاشتراك (يومي / أسبوعي / شهري...)</Label>
                <Button type="button" size="sm" variant="outline" className="border-primary/50" onClick={addVariant}>
                  <Plus className="w-3 h-3 ml-1" /> إضافة خيار
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mb-3">إذا أضفت خيارات هنا، سيختار العميل المدة من صفحة المنتج ويتغير السعر تلقائيًا حسب اختياره، ويُتجاهل السعر الأساسي في هذه الحالة.</div>
              <div className="space-y-2">
                {variants.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-2">
                    <Input value={v.label} onChange={(e) => updateVariant(i, { label: e.target.value })} placeholder="مثال: شهري" className="bg-secondary/50 flex-1" />
                    <Input type="number" value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} placeholder="السعر" className="bg-secondary/50 w-28" />
                    <Button type="button" size="sm" variant="outline" className="border-destructive/50 text-destructive shrink-0" onClick={() => removeVariant(i)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {variants.length === 0 && <div className="text-xs text-muted-foreground">لا توجد خيارات اشتراك — المنتج بسعر ثابت.</div>}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4 mt-4">
            <div>
              <Label>معلومات التسليم (تظهر للعميل بعد الشراء)</Label>
              <Textarea value={deliveryInfo} onChange={(e) => setDeliveryInfo(e.target.value)} placeholder="رابط اللودر، تعليمات..." rows={3} className="bg-secondary/50 mt-1" />
            </div>

            {variants.length > 0 ? (
              <div>
                <Label className="flex items-center gap-1 mb-1"><Key className="w-4 h-4" /> مفاتيح كل خيار اشتراك</Label>
                <div className="text-xs text-muted-foreground mb-3">هذا المنتج فيه خيارات اشتراك، فكل خيار (تاب) له مخزون مفاتيح منفصل بالكامل — ما تختلط مفاتيح الشهري بالاسبوعي.</div>
                <Tabs defaultValue={variants[0]?.id} dir="rtl">
                  <TabsList className="bg-secondary/50 flex-wrap h-auto">
                    {variants.map((v) => (
                      <TabsTrigger key={v.id} value={v.id} className="text-xs">
                        {v.label.trim() || "بدون اسم"}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {variants.map((v, i) => (
                    <TabsContent key={v.id} value={v.id} className="mt-3">
                      <Textarea
                        value={v.keysText}
                        onChange={(e) => updateVariant(i, { keysText: e.target.value })}
                        placeholder={"KEY-0001\nKEY-0002"}
                        rows={6}
                        className="bg-secondary/50 font-mono text-sm"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {v.keysText.split("\n").map((k) => k.trim()).filter(Boolean).length} مفتاح متاح لخيار «{v.label.trim() || "بدون اسم"}»
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            ) : (
              <div>
                <Label className="flex items-center gap-1"><Key className="w-4 h-4" /> المفاتيح (سطر لكل مفتاح)</Label>
                <Textarea value={keysText} onChange={(e) => setKeysText(e.target.value)} placeholder={"KEY-0001\nKEY-0002"} rows={6} className="bg-secondary/50 mt-1 font-mono text-sm" />
                <div className="text-xs text-muted-foreground mt-1">تُعطى بالترتيب. كل مفتاح يُسلَّم في رسالة منفصلة للعميل.</div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={save} className="gradient-purple neon-glow">حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrdersAdmin() {
  const orders = useStore((s) => s.orders);
  const [viewing, setViewing] = useState<Order | null>(null);
  const currency = useStore((s) => s.settings.currency);
  return (
    <div>
      <h2 className="font-display text-2xl font-bold neon-text mb-4">الطلبات ({orders.length})</h2>
      {orders.length === 0 && <div className="text-center py-16 text-muted-foreground glass neon-border rounded-xl">لا توجد طلبات بعد</div>}
      <div className="grid gap-3">
        {orders.map((o) => (
          <div key={o.id} className="glass neon-border rounded-xl p-4 flex items-center gap-4">
            <StatusBadge status={o.status} />
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold">#{o.id} — {o.username}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("ar")} • {o.items.length} منتج</div>
            </div>
            <div className="text-left"><div className="font-bold neon-text">{formatMoney(o.total, currency)}</div></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-primary/50" onClick={() => setViewing(o)}><Eye className="w-3 h-3" /></Button>
              {o.status === "pending" && (
                <>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={async () => { await orderActions.complete(o.id); toast.success("تم التسليم"); }}><CheckCircle2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="border-destructive/50 text-destructive" onClick={async () => { await orderActions.reject(o.id); toast.success("تم الرفض"); }}><XCircle className="w-3 h-3" /></Button>
                </>
              )}
              <Button size="sm" variant="outline" className="border-destructive/50 text-destructive" onClick={async () => { if (confirm("حذف؟")) await orderActions.remove(o.id); }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-2xl bg-background border-primary/30 max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="neon-text">تفاصيل الطلب #{viewing?.id}</DialogTitle></DialogHeader>
          {viewing && <OrderDetailsView order={viewing} currency={currency} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: Order["status"] }) {
  const map = {
    pending: "bg-primary/20 text-primary border-primary/40",
    completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    rejected: "bg-red-500/20 text-red-300 border-red-500/40",
  } as const;
  const label = status === "pending" ? "معلق" : status === "completed" ? "مكتمل" : "مرفوض";
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${map[status]}`}>{label}</span>;
}

function UsersAdmin() {
  const users = useStore((s) => s.users);
  const orders = useStore((s) => s.orders);
  return (
    <div>
      <h2 className="font-display text-2xl font-bold neon-text mb-4">المستخدمون ({users.length})</h2>
      <div className="grid gap-2">
        {users.map((u) => (
          <div key={u.username} className="glass neon-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center font-black text-white">{u.username[0].toUpperCase()}</div>
            <div className="flex-1">
              <div className="font-bold">{u.username}</div>
              <div className="text-xs text-muted-foreground">انضم {new Date(u.createdAt).toLocaleDateString("ar")}</div>
            </div>
            <div className="text-sm text-muted-foreground">{orders.filter((o) => o.username === u.username).length} طلب</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsAdmin() {
  const settings = useStore((s) => s.settings);
  const [form, setForm] = useState<SiteSettings>(settings);
  const settingsLoaded = useRef(false);
  useEffect(() => {
    if (settingsLoaded.current) return;
    settingsLoaded.current = true;
    setForm(settings);
  }, [settings]);
  function up<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) { setForm((f) => ({ ...f, [k]: v })); }
  async function save() { await settingsActions.update(form); toast.success("تم الحفظ"); }
  return (
    <div className="glass neon-border rounded-2xl p-6 max-w-3xl">
      <h2 className="font-display text-2xl font-bold neon-text mb-6">إعدادات الموقع</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="اسم الموقع"><Input value={form.siteName} onChange={(e) => up("siteName", e.target.value)} /></Field>
        <Field label="Tagline"><Input value={form.tagline} onChange={(e) => up("tagline", e.target.value)} /></Field>
        <Field label="عنوان الهيرو"><Input value={form.heroTitle} onChange={(e) => up("heroTitle", e.target.value)} /></Field>
        <Field label="العملة"><Input value={form.currency} onChange={(e) => up("currency", e.target.value)} /></Field>
        <Field label="الوصف تحت العنوان" full><Textarea value={form.heroSubtitle} onChange={(e) => up("heroSubtitle", e.target.value)} rows={2} /></Field>
        <Field label="رقم الجوال"><Input value={form.phone} onChange={(e) => up("phone", e.target.value)} /></Field>
        <Field label="Discord URL"><Input value={form.discordUrl} onChange={(e) => up("discordUrl", e.target.value)} /></Field>
        <Field label="Twitter URL"><Input value={form.twitterUrl} onChange={(e) => up("twitterUrl", e.target.value)} /></Field>
        <Field label="نص الفوتر" full><Input value={form.footerText} onChange={(e) => up("footerText", e.target.value)} /></Field>
      </div>

      <h3 className="font-display text-lg font-bold neon-text mt-8 mb-3">الحسابات البنكية (IBAN)</h3>
      <div className="text-xs text-muted-foreground mb-3">أضف أكثر من حساب بنكي — تظهر كلها للعميل عند الدفع.</div>
      <IbansField value={form.ibans && form.ibans.length ? form.ibans : [{ id: "iban-1", bankName: form.bankName, accountName: form.accountName, iban: form.iban }]} onChange={(v) => up("ibans", v)} />

      <h3 className="font-display text-lg font-bold neon-text mt-8 mb-3">شريط الإعلان المتحرك</h3>
      <div className="glass rounded-xl p-4 space-y-3 border border-primary/20">
        <div className="flex items-center gap-2">
          <Switch checked={form.announcementEnabled} onCheckedChange={(v) => up("announcementEnabled", v)} id="announcementEnabled" />
          <Label htmlFor="announcementEnabled">تفعيل الشريط أعلى الموقع</Label>
        </div>
        <Input value={form.announcementText} onChange={(e) => up("announcementText", e.target.value)} placeholder="مثال: 🎉 خصم 20% على جميع السكربتات هذا الأسبوع!" className="bg-secondary/50" />
      </div>

      <h3 className="font-display text-lg font-bold neon-text mt-8 mb-3">أيقونات وسائل الدفع</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <IconUploadField label="STC Pay" value={form.paymentIcons.stcPay} onChange={(v) => setForm((f) => ({ ...f, paymentIcons: { ...f.paymentIcons, stcPay: v } }))} />
        <IconUploadField label="Barq" value={form.paymentIcons.barq} onChange={(v) => setForm((f) => ({ ...f, paymentIcons: { ...f.paymentIcons, barq: v } }))} />
        <IconUploadField label="البنك الأهلي" value={form.paymentIcons.ahliBank} onChange={(v) => setForm((f) => ({ ...f, paymentIcons: { ...f.paymentIcons, ahliBank: v } }))} />
      </div>

      <h3 className="font-display text-lg font-bold neon-text mt-8 mb-3">بنرات المتجر</h3>
      <div className="text-xs text-muted-foreground mb-3">تُعرض الصورة كاملة بأبعادها الأصلية بدون أي قص. أضف قسم "البنرات" من تبويب الأقسام لعرضها بالصفحة الرئيسية.</div>
      <BannersUploadField value={form.banners} onChange={(v) => up("banners", v)} />

      <div className="mt-6 flex justify-end"><Button onClick={save} className="gradient-purple neon-glow">حفظ</Button></div>
    </div>
  );
}

function IbansField({ value, onChange }: { value: SiteSettings["ibans"]; onChange: (v: SiteSettings["ibans"]) => void }) {
  function update(i: number, patch: Partial<SiteSettings["ibans"][number]>) {
    onChange(value.map((b, idx) => idx === i ? { ...b, ...patch } : b));
  }
  function add() {
    onChange([...value, { id: "iban-" + Date.now(), bankName: "", accountName: "", iban: "" }]);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  return (
    <div className="space-y-3">
      {value.map((b, i) => (
        <div key={b.id} className="grid sm:grid-cols-[1fr_1fr_1.4fr_auto] gap-2 items-end glass rounded-xl p-3 border border-primary/10">
          <div><Label className="text-xs text-muted-foreground">اسم البنك</Label><Input value={b.bankName} onChange={(e) => update(i, { bankName: e.target.value })} className="bg-secondary/50 mt-1" /></div>
          <div><Label className="text-xs text-muted-foreground">اسم المستفيد</Label><Input value={b.accountName} onChange={(e) => update(i, { accountName: e.target.value })} className="bg-secondary/50 mt-1" /></div>
          <div><Label className="text-xs text-muted-foreground">IBAN</Label><Input value={b.iban} onChange={(e) => update(i, { iban: e.target.value })} className="bg-secondary/50 mt-1 font-mono" /></div>
          <Button type="button" size="sm" variant="outline" className="border-destructive/50 text-destructive" onClick={() => remove(i)} disabled={value.length <= 1}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" className="border-primary/50" onClick={add}>
        <Plus className="w-4 h-4 ml-1" /> إضافة حساب بنكي آخر
      </Button>
    </div>
  );
}

function BannersUploadField({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((f) => {
      if (f.size > 3 * 1024 * 1024) { toast.error(`${f.name} أكبر من 3MB`); return; }
      const r = new FileReader();
      r.onload = () => onChange([...value, String(r.result)]);
      r.readAsDataURL(f);
    });
    e.target.value = "";
  }
  function remove(i: number) { onChange(value.filter((_, idx) => idx !== i)); }
  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {value.map((src, i) => (
          <div key={i} className="relative">
            <img src={src} className="w-28 h-20 object-contain rounded-lg bg-black/30 p-1 neon-border" alt={`banner-${i}`} />
            <button onClick={() => remove(i)} className="absolute -top-2 -left-2 bg-destructive text-white w-6 h-6 rounded-full text-xs">×</button>
          </div>
        ))}
      </div>
      <label className="cursor-pointer inline-block px-4 py-2 rounded-lg bg-secondary hover:bg-primary/30 text-sm">
        رفع صور بنرات (يمكن اختيار أكثر من صورة)
        <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
      </label>
    </div>
  );
}

function IconUploadField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 1024 * 1024) { toast.error("الصورة أكبر من 1MB"); return; }
    const r = new FileReader(); r.onload = () => onChange(String(r.result)); r.readAsDataURL(f);
  }
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 flex items-center gap-2">
        {value ? (
          <div className="relative">
            <img src={value} className="w-12 h-12 object-contain rounded-lg bg-white/90 p-1 neon-border" alt={label} />
            <button onClick={() => onChange("")} className="absolute -top-2 -left-2 bg-destructive text-white w-5 h-5 rounded-full text-xs">×</button>
          </div>
        ) : (
          <label className="cursor-pointer px-3 py-2 rounded-lg bg-secondary hover:bg-primary/30 text-xs flex-1 text-center">
            رفع أيقونة<input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        )}
      </div>
    </div>
  );
}

// ---------- Home sections editor ----------
function SectionsAdmin() {
  const settings = useStore((s) => s.settings);
  const products = useStore((s) => s.products);
  const [sections, setSections] = useState<HomeSection[]>(settings.homeSections);
  useEffect(() => setSections(settings.homeSections), [settings.homeSections]);
  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  function move(i: number, dir: -1 | 1) {
    const next = [...sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  }
  function remove(i: number) {
    setSections(sections.filter((_, idx) => idx !== i));
  }
  function addCategorySection() {
    if (!categories.length) { toast.error("لا توجد تصنيفات منتجات بعد"); return; }
    const cat = categories[0];
    setSections([...sections, { id: "sec-" + Date.now(), type: "category", title: cat, category: cat }]);
  }
  function addReviewsSection() {
    if (sections.some((s) => s.type === "reviews")) { toast.error("قسم التقييمات مضاف بالفعل"); return; }
    setSections([...sections, { id: "sec-reviews-" + Date.now(), type: "reviews", title: "آراء عملائنا" }]);
  }
  function addBannersSection() {
    if (sections.some((s) => s.type === "banners")) { toast.error("قسم البنرات مضاف بالفعل"); return; }
    setSections([...sections, { id: "sec-banners-" + Date.now(), type: "banners", title: "تعرف على متجرنا" }]);
  }
  async function save() {
    await settingsActions.update({ homeSections: sections });
    toast.success("تم حفظ ترتيب الأقسام");
  }

  return (
    <div className="glass neon-border rounded-2xl p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-display text-2xl font-bold neon-text">أقسام الصفحة الرئيسية</h2>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={addCategorySection} className="gradient-purple neon-glow" size="sm">
            <Plus className="w-4 h-4 ml-1" /> قسم تصنيف
          </Button>
          <Button onClick={addReviewsSection} variant="outline" className="border-primary/50" size="sm">
            <Star className="w-4 h-4 ml-1" /> قسم التقييمات
          </Button>
          <Button onClick={addBannersSection} variant="outline" className="border-primary/50" size="sm">
            <ImageIcon className="w-4 h-4 ml-1" /> قسم البنرات
          </Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground mb-3">استخدم الأسهم لترتيب الأقسام — رتّب قسم التقييمات أو البنرات في أعلى الصفحة أو أسفلها كيفما تحب.</div>
      <div className="space-y-2">
        {sections.map((sec, i) => (
          <div key={sec.id} className="flex items-center gap-3 glass neon-border rounded-xl p-3">
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
            </div>
            <div className="flex-1">
              <Input
                value={sec.title}
                onChange={(e) => setSections(sections.map((s, idx) => idx === i ? { ...s, title: e.target.value } : s))}
                className="bg-secondary/50"
              />
              {sec.type === "category" ? (
                <div className="mt-2">
                  <Select
                    value={sec.category || ""}
                    onValueChange={(v) => setSections(sections.map((s, idx) => idx === i ? { ...s, category: v, title: s.title === s.category ? v : s.title } : s))}
                  >
                    <SelectTrigger className="bg-secondary/50 h-8 text-xs w-full max-w-[220px]"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground mt-1">
                  {sec.type === "featured" ? "قسم المنتجات المميزة"
                    : sec.type === "all" ? "قسم كل المنتجات"
                    : sec.type === "reviews" ? "قسم التقييمات الحقيقية"
                    : "قسم بنرات المتجر"}
                </div>
              )}
              {(sec.type === "featured" || sec.type === "all" || sec.type === "category") && (
                <ProductPicker
                  products={products}
                  selected={sec.productIds || []}
                  onChange={(ids) => setSections(sections.map((s, idx) => idx === i ? { ...s, productIds: ids } : s))}
                />
              )}
            </div>
            {sec.type !== "featured" && sec.type !== "all" && (
              <Button size="sm" variant="outline" className="border-destructive/50 text-destructive" onClick={() => remove(i)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end"><Button onClick={save} className="gradient-purple neon-glow">حفظ الترتيب</Button></div>
    </div>
  );
}

function ProductPicker({ products, selected, onChange }: { products: Product[]; selected: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-primary/20 border border-primary/20"
      >
        {selected.length > 0 ? `منتجات محددة يدويًا (${selected.length})` : "اختيار منتجات محددة (اختياري)"}
      </button>
      {selected.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="text-xs text-destructive mr-2 hover:underline">مسح الاختيار</button>
      )}
      {open && (
        <div className="mt-2 max-h-56 overflow-y-auto scrollbar-thin border border-primary/20 rounded-lg p-2 space-y-1 bg-secondary/20">
          {products.length === 0 && <div className="text-xs text-muted-foreground p-2">لا توجد منتجات بعد</div>}
          {products.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-primary/10 cursor-pointer">
              <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} className="accent-primary" />
              <span className="flex-1 truncate">{p.name}</span>
              <span className="text-muted-foreground">{p.category}</span>
            </label>
          ))}
        </div>
      )}
      <div className="text-[11px] text-muted-foreground mt-1">إذا اخترت منتجات هنا، سيعرض القسم هذه المنتجات فقط بدل العرض التلقائي.</div>
    </div>
  );
}

// ---------- Reviews moderation ----------
function ReviewsAdmin() {
  const orders = useStore((s) => s.orders);
  const reviewed = orders.filter((o) => !!o.rating);

  async function act(id: string, action: "hide" | "unhide" | "delete-comment" | "delete-review") {
    if (action === "delete-review" && !confirm("حذف التقييم بالكامل نهائيًا؟")) return;
    if (action === "delete-comment" && !confirm("حذف نص التعليق (تبقى النجوم فقط)؟")) return;
    await reviewAdminActions.moderate(id, action);
    toast.success("تم التحديث");
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-bold neon-text mb-4">التقييمات ({reviewed.length})</h2>
      {reviewed.length === 0 && (
        <div className="text-center py-16 text-muted-foreground glass neon-border rounded-xl">لا توجد تقييمات بعد</div>
      )}
      <div className="grid gap-3">
        {reviewed.map((o) => (
          <div key={o.id} className={`glass neon-border rounded-xl p-4 ${o.reviewHidden ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{o.username}</span>
                  <span className="text-xs text-muted-foreground">#{o.id}</span>
                  {o.reviewHidden && <Badge variant="outline" className="border-muted-foreground/40 text-muted-foreground">مخفي</Badge>}
                </div>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-4 h-4 ${n <= (o.rating || 0) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  ))}
                </div>
                {o.reviewComment ? (
                  <p className="text-sm text-muted-foreground mt-2 max-w-xl">{o.reviewComment}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic mt-2">بدون تعليق نصي</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {o.reviewHidden ? (
                  <Button size="sm" variant="outline" className="border-primary/50" onClick={() => act(o.id, "unhide")}>
                    <Eye className="w-3 h-3 ml-1" /> إظهار
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="border-primary/50" onClick={() => act(o.id, "hide")}>
                    <EyeOff className="w-3 h-3 ml-1" /> إخفاء
                  </Button>
                )}
                {o.reviewComment && (
                  <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400" onClick={() => act(o.id, "delete-comment")}>
                    <MessageSquareOff className="w-3 h-3 ml-1" /> حذف النص فقط
                  </Button>
                )}
                <Button size="sm" variant="outline" className="border-destructive/50 text-destructive" onClick={() => act(o.id, "delete-review")}>
                  <Trash2 className="w-3 h-3 ml-1" /> حذف التقييم
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Team accounts ----------
function TeamAdmin() {
  const staff = useStore((s) => s.staff);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function add() {
    if (!username.trim() || password.length < 4) { toast.error("اسم مستخدم وكلمة مرور (4 أحرف على الأقل)"); return; }
    await staffActions.add(username.trim(), password);
    toast.success("تم إضافة عضو الفريق");
    setUsername(""); setPassword("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <h2 className="font-display text-2xl font-bold neon-text mb-4">أعضاء الفريق ({staff.length})</h2>
        {staff.length === 0 && <div className="text-center py-16 text-muted-foreground glass neon-border rounded-xl">لا يوجد أعضاء بعد</div>}
        <div className="grid gap-2">
          {staff.map((u) => (
            <div key={u.username} className="glass neon-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-purple flex items-center justify-center font-black text-white">{u.username[0].toUpperCase()}</div>
              <div className="flex-1">
                <div className="font-bold">{u.username}</div>
                <div className="text-xs text-muted-foreground">انضم {new Date(u.createdAt).toLocaleDateString("ar")}</div>
              </div>
              <Button size="sm" variant="outline" className="border-destructive/50 text-destructive"
                onClick={async () => { if (confirm("إزالة هذا العضو؟")) { await staffActions.remove(u.username); toast.success("تمت الإزالة"); } }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="glass neon-border rounded-2xl p-5 h-fit">
        <h3 className="font-display font-bold neon-text mb-3">إضافة عضو</h3>
        <div className="space-y-3">
          <div><Label>اسم المستخدم</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-secondary/50 mt-1" /></div>
          <div><Label>كلمة المرور</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary/50 mt-1" /></div>
          <Button onClick={add} className="w-full gradient-purple neon-glow">إضافة</Button>
          <div className="text-xs text-muted-foreground">يدخل العضو من نفس صفحة تسجيل دخول الإدارة برقم المستخدم وكلمة المرور هذه.</div>
        </div>
      </div>
    </div>
  );
}

// ---------- Live chat admin ----------
function ChatsAdmin() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const refreshThreads = useCallback(async () => {
    try { const { threads: t } = await chatActions.fetchThreads(); setThreads(t); } catch {}
  }, []);
  const refreshMessages = useCallback(async () => {
    if (!active) return;
    try { const { messages: m } = await chatActions.fetchThreadMessages(active); setMessages(m); } catch {}
  }, [active]);

  useEffect(() => { refreshThreads(); const iv = setInterval(refreshThreads, 3000); return () => clearInterval(iv); }, [refreshThreads]);
  useEffect(() => { refreshMessages(); const iv = setInterval(refreshMessages, 2000); return () => clearInterval(iv); }, [refreshMessages]);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function accept(username: string) {
    await chatActions.accept(username);
    toast.success("تم قبول المحادثة");
    setActive(username);
    refreshThreads();
  }
  async function send() {
    if (!text.trim() || !active) return;
    const val = text.trim(); setText("");
    await chatActions.sendAsAdmin(active, val);
    refreshMessages();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr] h-[560px]">
      <div className="glass neon-border rounded-2xl overflow-y-auto scrollbar-thin">
        {threads.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">لا توجد محادثات بعد</div>}
        {threads.map((th) => (
          <button
            key={th.username}
            onClick={() => setActive(th.username)}
            className={`w-full text-right p-4 border-b border-primary/10 hover:bg-primary/10 transition ${active === th.username ? "bg-primary/15" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">{th.username}</span>
              {!!th.unreadForAdmin && <span className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-1">{th.lastMessage || "—"}</div>
            <div className="text-xs mt-1">{th.accepted ? <span className="text-emerald-400">مقبولة — {th.acceptedBy}</span> : <span className="text-primary">بانتظار القبول</span>}</div>
          </button>
        ))}
      </div>
      <div className="glass neon-border rounded-2xl flex flex-col">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">اختر محادثة من القائمة</div>
        ) : (
          <>
            <div className="p-3 border-b border-primary/20 flex items-center justify-between">
              <span className="font-display font-bold">{active}</span>
              {!threads.find((t) => t.username === active)?.accepted && (
                <Button size="sm" className="gradient-purple neon-glow" onClick={() => accept(active)}>قبول المحادثة</Button>
              )}
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    m.sender === "admin" ? "gradient-purple text-white" :
                    m.sender === "system" ? "bg-secondary/60 text-muted-foreground italic text-xs" : "bg-secondary"
                  }`}>
                    {m.sender === "admin" && <div className="text-[10px] font-bold mb-0.5 opacity-80">{m.senderName}</div>}
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-primary/20 flex items-center gap-2">
              <input
                value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="اكتب ردك..." className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={send} className="gradient-purple neon-glow rounded-lg p-2 text-white"><Send className="w-4 h-4" /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Real visitor statistics ----------
function StatsAdmin() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  useEffect(() => {
    let mounted = true;
    function load() { statsActions.fetch().then((d) => mounted && setStats(d)).catch(() => {}); }
    load();
    const iv = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, []);
  if (!stats) return <div className="text-muted-foreground text-sm">جاري تحميل الإحصائيات...</div>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Eye />} label="زيارات اليوم" value={stats.todayVisits} />
        <StatCard icon={<Eye />} label="إجمالي الزيارات" value={stats.totalVisits} />
        <StatCard icon={<ShoppingBag />} label="إجمالي الأرباح (مكتمل)" value={Math.round(stats.totalRevenue)} />
        <StatCard icon={<Star />} label="متوسط التقييم" value={Number(stats.avgRating.toFixed(1))} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass neon-border rounded-2xl p-5">
          <h3 className="font-display font-bold neon-text mb-3">الزيارات حسب الدولة</h3>
          <div className="space-y-2">
            {stats.byCountry.length === 0 && <div className="text-sm text-muted-foreground">لا توجد بيانات بعد</div>}
            {stats.byCountry.map((c) => (
              <div key={c.country} className="flex items-center justify-between text-sm">
                <span>{c.country}</span>
                <span className="font-bold text-primary">{c.c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass neon-border rounded-2xl p-5">
          <h3 className="font-display font-bold neon-text mb-3">أكثر الصفحات زيارة</h3>
          <div className="space-y-2">
            {stats.byPath.length === 0 && <div className="text-sm text-muted-foreground">لا توجد بيانات بعد</div>}
            {stats.byPath.map((p) => (
              <div key={p.path} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{p.path}</span>
                <span className="font-bold text-primary">{p.c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="glass neon-border rounded-2xl p-5">
        <h3 className="font-display font-bold neon-text mb-3">آخر الزيارات</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
          {stats.recent.map((v, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-muted-foreground border-b border-primary/10 py-1.5">
              <span className="font-mono">{v.path}</span>
              <span>{v.city ? `${v.city}, ` : ""}{v.country}</span>
              <span>{new Date(v.createdAt).toLocaleTimeString("ar")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1 [&_input]:bg-secondary/50 [&_textarea]:bg-secondary/50">{children}</div>
    </div>
  );
}
