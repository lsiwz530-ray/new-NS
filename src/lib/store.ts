// API-backed store — talks to the Express backend, syncs via polling.
import { useSyncExternalStore } from "react";

export type GalleryItem = { type: "image" | "gif" | "video"; url: string };
export type ProductVariant = { id: string; label: string; price: number; keys?: string[] };
export type Product = {
  id: string; name: string; description: string; price: number;
  compareAtPrice?: number;
  image: string; category: string; keys: string[]; deliveryInfo: string;
  featured?: boolean; createdAt: number;
  variants?: ProductVariant[];
  gallery?: GalleryItem[];
};
export type OrderItem = {
  productId: string; productName: string; productDescription: string;
  price: number; quantity: number; assignedKeys: string[]; deliveryInfo: string;
  variantId?: string | null;
};
export type Order = {
  id: string; username: string; items: OrderItem[]; total: number;
  receiptImage: string; note: string;
  status: "pending" | "completed" | "rejected";
  createdAt: number; completedAt?: number;
  rating?: number; reviewComment?: string; reviewedAt?: number; reviewHidden?: boolean;
  couponCode?: string; discount?: number;
};
export type User = { username: string; createdAt: number };
export type DiscordProfile = { linked: boolean; avatar?: string; banner?: string; globalName?: string; username?: string; accentColor?: number | null };
export type StaffUser = { username: string; createdAt: number };
export type HomeSection = {
  id: string; type: "featured" | "all" | "category" | "reviews" | "banners"; title: string;
  category?: string; productIds?: string[];
};
export type IbanEntry = { id: string; bankName: string; accountName: string; iban: string };
export type Coupon = { code: string; percent: number; active: boolean; createdAt: number; excludedProductIds?: string[] };
export type SiteSettings = {
  siteName: string; tagline: string; heroTitle: string; heroSubtitle: string;
  iban: string; bankName: string; accountName: string; phone: string;
  currency: string; discordUrl: string; twitterUrl: string; footerText: string;
  paymentIcons: { stcPay: string; barq: string; ahliBank: string };
  banners: string[];
  homeSections: HomeSection[];
  ibans: IbanEntry[];
  announcementText: string;
  announcementEnabled: boolean;
};
export type PublicReview = { orderId: string; username: string; rating: number; comment: string; createdAt: number };
export type CartItem = { productId: string; quantity: number; variantId?: string };
export type ChatMessage = { id: string; username: string; sender: "user" | "admin" | "system"; senderName: string; text: string; createdAt: number };
export type ChatThread = {
  username: string; accepted: number; acceptedBy: string | null;
  lastMessageAt: number; unreadForAdmin: number; unreadForUser: number;
  lastMessage?: string; lastSender?: string;
};

type State = {
  products: Product[]; orders: Order[]; users: User[]; staff: StaffUser[]; coupons: Coupon[];
  settings: SiteSettings; cart: CartItem[];
  currentUser: string | null; adminToken: string | null; staffName: string | null;
};

const CLIENT_KEY = "northsite:client:v1";
const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "NorthSite", tagline: "متجر المفاتيح الرقمية الأول",
  heroTitle: "NorthSite",
  heroSubtitle: "متجرك الأسطوري للمفاتيح الرقمية وسكربتات الألعاب — تسليم فوري بعد التحويل.",
  iban: "SA00 0000 0000 0000 0000 0000", bankName: "الراجحي",
  accountName: "North Store", phone: "05xxxxxxxx", currency: "ر.س",
  discordUrl: "", twitterUrl: "", footerText: "© NorthSite — جميع الحقوق محفوظة",
  paymentIcons: { stcPay: "/payment-icons/stcpay.svg", barq: "/payment-icons/barq.svg", ahliBank: "/payment-icons/alahli.svg" },
  banners: [],
  homeSections: [
    { id: "sec-featured", type: "featured", title: "المميزة" },
    { id: "sec-all", type: "all", title: "كل المنتجات" },
  ],
  ibans: [{ id: "iban-1", bankName: "الراجحي", accountName: "North Store", iban: "SA00 0000 0000 0000 0000 0000" }],
  announcementText: "",
  announcementEnabled: false,
};
const INITIAL: State = {
  products: [], orders: [], users: [], staff: [], coupons: [], settings: DEFAULT_SETTINGS,
  cart: [], currentUser: null, adminToken: null, staffName: null,
};

let state: State = INITIAL;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }
function set(patch: Partial<State>) { state = { ...state, ...patch }; emit(); }

function loadClient() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CLIENT_KEY);
    if (raw) {
      const c = JSON.parse(raw) as { cart?: CartItem[]; currentUser?: string | null; adminToken?: string | null; staffName?: string | null };
      state = { ...state, cart: c.cart ?? [], currentUser: c.currentUser ?? null, adminToken: c.adminToken ?? null, staffName: c.staffName ?? null };
    }
  } catch {}
}
function saveClient() {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_KEY, JSON.stringify({
    cart: state.cart, currentUser: state.currentUser, adminToken: state.adminToken, staffName: state.staffName,
  }));
}

async function fetchState() {
  const params = new URLSearchParams();
  if (state.currentUser) params.set("user", state.currentUser);
  const headers: Record<string, string> = {};
  if (state.adminToken) headers["x-admin-token"] = state.adminToken;
  try {
    const res = await fetch("/api/state?" + params.toString(), { headers });
    if (!res.ok) return;
    const data = await res.json();
    state = {
      ...state,
      products: data.products || [],
      orders: data.orders || [],
      users: data.users || [],
      staff: data.staff || [],
      coupons: data.coupons || [],
      settings: {
        ...DEFAULT_SETTINGS, ...(data.settings || {}),
        paymentIcons: { ...DEFAULT_SETTINGS.paymentIcons, ...(data.settings?.paymentIcons || {}) },
        banners: data.settings?.banners || [],
        ibans: (data.settings?.ibans && data.settings.ibans.length) ? data.settings.ibans : DEFAULT_SETTINGS.ibans,
      },
    };
    emit();
  } catch {}
}

let started = false;
function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  loadClient();
  fetchState();
  setInterval(fetchState, 3000);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => { start(); listeners.add(cb); return () => listeners.delete(cb); },
    () => { start(); return selector(state); },
    () => selector(INITIAL),
  );
}
export function getState() { start(); return state; }

async function api(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(opts.headers as any) };
  if (state.adminToken) headers["x-admin-token"] = state.adminToken;
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "request failed");
  return data;
}

// ---------- Products (admin) ----------
export const productActions = {
  async add(p: Omit<Product, "id" | "createdAt">) {
    await api("/api/admin/products", { method: "POST", body: JSON.stringify(p) });
    await fetchState();
  },
  async update(id: string, patch: Partial<Product>) {
    await api("/api/admin/products/" + id, { method: "PATCH", body: JSON.stringify(patch) });
    await fetchState();
  },
  async remove(id: string) {
    await api("/api/admin/products/" + id, { method: "DELETE" });
    await fetchState();
  },
};

// ---------- Cart (client) ----------
export const cartActions = {
  add(productId: string, quantity = 1, variantId?: string) {
    const existing = state.cart.find((c) => c.productId === productId && c.variantId === variantId);
    const cart = existing
      ? state.cart.map((c) => (c.productId === productId && c.variantId === variantId) ? { ...c, quantity: c.quantity + quantity } : c)
      : [...state.cart, { productId, quantity, variantId }];
    set({ cart }); saveClient();
  },
  setQty(productId: string, quantity: number, variantId?: string) {
    const cart = quantity <= 0
      ? state.cart.filter((c) => !(c.productId === productId && c.variantId === variantId))
      : state.cart.map((c) => (c.productId === productId && c.variantId === variantId) ? { ...c, quantity } : c);
    set({ cart }); saveClient();
  },
  remove(productId: string, variantId?: string) {
    set({ cart: state.cart.filter((c) => !(c.productId === productId && c.variantId === variantId)) }); saveClient();
  },
  clear() { set({ cart: [] }); saveClient(); },
};

// ---------- Users ----------
export type LoginResult = { ok: boolean; error?: string; suggestions?: string[] };
export const userActions = {
  async loginOrRegister(username: string, password: string): Promise<LoginResult> {
    const u = username.trim();
    if (!u) return { ok: false, error: "أدخل اسم المستخدم" };
    if (u.length < 2 || u.length > 20) return { ok: false, error: "الاسم بين 2 و 20 حرف" };
    if (!password || password.length < 4) return { ok: false, error: "كلمة المرور 4 أحرف على الأقل" };
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.error === "wrong_password") {
        return { ok: false, error: "هذا الاسم محجوز لصاحبه — كلمة المرور غير صحيحة", suggestions: data.suggestions || [] };
      }
      return { ok: false, error: "تعذر تسجيل الدخول" };
    }
    set({ currentUser: data.username }); saveClient();
    fetchState();
    return { ok: true };
  },
  // Live check while typing, so the UI can warn + suggest before submitting.
  async checkUsername(username: string): Promise<{ taken: boolean; suggestions: string[] }> {
    try {
      const res = await fetch("/api/users/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });
      return await res.json();
    } catch {
      return { taken: false, suggestions: [] };
    }
  },
  logout() { set({ currentUser: null }); saveClient(); fetchState(); },
  async loginWithDiscordToken(token: string): Promise<LoginResult> {
    try {
      const res = await fetch("/api/auth/discord/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) return { ok: false, error: "تعذر تسجيل الدخول عبر ديسكورد" };
      set({ currentUser: data.username }); saveClient(); fetchState();
      return { ok: true };
    } catch {
      return { ok: false, error: "تعذر تسجيل الدخول عبر ديسكورد" };
    }
  },
  async fetchDiscordProfile(username: string): Promise<DiscordProfile> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/discord-profile`);
      return await res.json();
    } catch {
      return { linked: false };
    }
  },
};

// ---------- Admin ----------
export const adminActions = {
  async login(u: string, p: string): Promise<boolean> {
    try {
      const data = await api("/api/admin/login", { method: "POST", body: JSON.stringify({ username: u, password: p }) });
      if (data.ok) { set({ adminToken: data.token }); saveClient(); fetchState(); return true; }
    } catch {}
    return false;
  },
  logout() { set({ adminToken: null, staffName: null }); saveClient(); fetchState(); },
};

// ---------- Settings (admin) ----------
export const settingsActions = {
  async update(patch: Partial<SiteSettings>) {
    await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(patch) });
    await fetchState();
  },
};

// ---------- Orders ----------
export const orderActions = {
  async create(input: { username: string; receiptImage: string; note: string; couponCode?: string }): Promise<Order> {
    const data = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        username: input.username,
        items: state.cart,
        receiptImage: input.receiptImage,
        note: input.note,
        couponCode: input.couponCode,
      }),
    });
    set({ cart: [] }); saveClient();
    await fetchState();
    return data.order;
  },
  async complete(id: string) {
    await api("/api/admin/orders/" + id + "/complete", { method: "POST" });
    await fetchState();
  },
  async reject(id: string) {
    await api("/api/admin/orders/" + id + "/reject", { method: "POST" });
    await fetchState();
  },
  async remove(id: string) {
    await api("/api/admin/orders/" + id, { method: "DELETE" });
    await fetchState();
  },
};

// ---------- Reviews ----------
export const reviewActions = {
  async submit(orderId: string, rating: number, comment: string) {
    await api(`/api/orders/${orderId}/review`, {
      method: "POST",
      body: JSON.stringify({ username: state.currentUser, rating, comment }),
    });
    await fetchState();
  },
  // Public real reviews for the homepage (no admin token needed).
  async fetchPublic(): Promise<PublicReview[]> {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      return data.reviews || [];
    } catch {
      return [];
    }
  },
};

// ---------- Review moderation (admin) ----------
export const reviewAdminActions = {
  async moderate(orderId: string, action: "hide" | "unhide" | "delete-comment" | "delete-review") {
    await api(`/api/admin/orders/${orderId}/review/moderate`, { method: "POST", body: JSON.stringify({ action }) });
    await fetchState();
  },
};

// ---------- Staff / team accounts (admin) ----------
export const staffActions = {
  async add(username: string, password: string) {
    await api("/api/admin/staff", { method: "POST", body: JSON.stringify({ username, password }) });
    await fetchState();
  },
  async remove(username: string) {
    await api("/api/admin/staff/" + username, { method: "DELETE" });
    await fetchState();
  },
  async login(username: string, password: string): Promise<boolean> {
    try {
      const data = await api("/api/staff/login", { method: "POST", body: JSON.stringify({ username, password }) });
      if (data.ok) { set({ adminToken: data.token, staffName: data.username }); saveClient(); fetchState(); return true; }
    } catch {}
    return false;
  },
};

// ---------- Coupons ----------
export const couponActions = {
  async validate(code: string): Promise<{ valid: boolean; code?: string; percent?: number }> {
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      return await res.json();
    } catch {
      return { valid: false };
    }
  },
  async add(code: string, percent: number, excludedProductIds: string[] = []) {
    await api("/api/admin/coupons", { method: "POST", body: JSON.stringify({ code, percent, excludedProductIds }) });
    await fetchState();
  },
  async setActive(code: string, active: boolean) {
    await api("/api/admin/coupons/" + code, { method: "PATCH", body: JSON.stringify({ active }) });
    await fetchState();
  },
  async remove(code: string) {
    await api("/api/admin/coupons/" + code, { method: "DELETE" });
    await fetchState();
  },
};

// ---------- Live chat ----------
export const chatActions = {
  async fetchMine(username: string): Promise<{ thread: ChatThread; messages: ChatMessage[] }> {
    return api("/api/chat/" + encodeURIComponent(username));
  },
  async send(username: string, text: string) {
    await api(`/api/chat/${encodeURIComponent(username)}/message`, { method: "POST", body: JSON.stringify({ text }) });
  },
  async fetchThreads(): Promise<{ threads: ChatThread[] }> {
    return api("/api/admin/chats");
  },
  async accept(username: string) {
    await api(`/api/admin/chats/${encodeURIComponent(username)}/accept`, { method: "POST" });
  },
  async fetchThreadMessages(username: string): Promise<{ messages: ChatMessage[] }> {
    return api(`/api/admin/chats/${encodeURIComponent(username)}/messages`);
  },
  async sendAsAdmin(username: string, text: string) {
    await api(`/api/admin/chats/${encodeURIComponent(username)}/message`, { method: "POST", body: JSON.stringify({ text }) });
  },
};

// ---------- Visitor analytics ----------
export function logVisit(path: string) {
  if (typeof window === "undefined") return;
  fetch("/api/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  }).catch(() => {});
}
export type SiteStats = {
  totalVisits: number; todayVisits: number;
  byCountry: { country: string; c: number }[]; byPath: { path: string; c: number }[];
  recent: { path: string; country: string; city: string; createdAt: number }[];
  totalRevenue: number; avgRating: number;
};
export const statsActions = {
  async fetch(): Promise<SiteStats> {
    return api("/api/admin/stats");
  },
};

// ---------- Compat helpers for existing UI ----------
export const adminAuthed = () => !!state.adminToken;

export function formatMoney(n: number, currency = state.settings.currency) {
  return `${n.toFixed(2)} ${currency}`;
}
