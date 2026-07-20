// NorthSite backend — Express + Postgres. Runs on Railway (Node 20+).
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL env var. Add a Postgres database in Railway and set DATABASE_URL.");
  process.exit(1);
}

// TEMP DIAGNOSTIC: log a masked version of what the process actually received.
// Remove this block once the connection issue is resolved.
try {
  const u = new URL(process.env.DATABASE_URL);
  console.log("[diag] DATABASE_URL parsed -> protocol:", u.protocol, "user:", u.username,
    "password_length:", u.password.length, "password_preview:", u.password.slice(0, 3) + "..." + u.password.slice(-3),
    "host:", u.hostname, "port:", u.port, "db:", u.pathname);
} catch (e) {
  console.log("[diag] DATABASE_URL could not be parsed as a URL:", e.message, "raw_length:", process.env.DATABASE_URL.length);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});

async function q(text, params = []) {
  const res = await pool.query(text, params);
  return res.rows;
}
async function one(text, params = []) {
  const rows = await q(text, params);
  return rows[0] || null;
}

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, name TEXT, description TEXT, price DOUBLE PRECISION, image TEXT,
      category TEXT, keys TEXT, "deliveryInfo" TEXT, featured INTEGER, "createdAt" BIGINT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, username TEXT, items TEXT, total DOUBLE PRECISION,
      "receiptImage" TEXT, note TEXT, status TEXT, "createdAt" BIGINT, "completedAt" BIGINT,
      rating INTEGER, "reviewComment" TEXT, "reviewedAt" BIGINT
    );
    CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT, "createdAt" BIGINT);
    CREATE TABLE IF NOT EXISTS staff (
      username TEXT PRIMARY KEY, password TEXT, token TEXT, "createdAt" BIGINT
    );
    CREATE TABLE IF NOT EXISTS chat_threads (
      username TEXT PRIMARY KEY, accepted INTEGER DEFAULT 0, "acceptedBy" TEXT,
      "lastMessageAt" BIGINT, "unreadForAdmin" INTEGER DEFAULT 0, "unreadForUser" INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY, username TEXT, sender TEXT, "senderName" TEXT,
      text TEXT, "createdAt" BIGINT
    );
    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY, path TEXT, ip TEXT, country TEXT, city TEXT, "createdAt" BIGINT
    );
    CREATE TABLE IF NOT EXISTS coupons (
      code TEXT PRIMARY KEY, percent INTEGER NOT NULL, active INTEGER DEFAULT 1, "createdAt" BIGINT
    );
  `);
  // Backfill columns for databases created before this migration existed.
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "reviewHidden" INTEGER DEFAULT 0`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS "compareAtPrice" DOUBLE PRECISION`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS "couponCode" TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery TEXT`);
  await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DOUBLE PRECISION DEFAULT 0`);
  await pool.query(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS "excludedProductIds" TEXT DEFAULT '[]'`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "discordId" TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "discordAvatar" TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "discordBanner" TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "discordGlobalName" TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "discordUsername" TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "discordAccent" INTEGER`);
}

const DEFAULT_SETTINGS = {
  siteName: "NorthSite",
  tagline: "متجر المفاتيح الرقمية الأول",
  heroTitle: "NorthSite",
  heroSubtitle: "متجرك الأسطوري للمفاتيح الرقمية وسكربتات الألعاب — تسليم فوري بعد التحويل.",
  iban: "SA00 0000 0000 0000 0000 0000",
  bankName: "الراجحي",
  accountName: "North Store",
  phone: "05xxxxxxxx",
  currency: "ر.س",
  discordUrl: "",
  twitterUrl: "",
  footerText: "© NorthSite — جميع الحقوق محفوظة",
  paymentIcons: { stcPay: "/payment-icons/stcpay.svg", barq: "/payment-icons/barq.svg", ahliBank: "/payment-icons/alahli.svg" },
  banners: [],
  homeSections: [
    { id: "sec-featured", type: "featured", title: "المميزة" },
    { id: "sec-all", type: "all", title: "كل المنتجات" },
  ],
  ibans: [
    { id: "iban-1", bankName: "الراجحي", accountName: "North Store", iban: "SA00 0000 0000 0000 0000 0000" },
  ],
  announcementText: "",
  announcementEnabled: false,
};

async function getSettings() {
  const row = await one("SELECT v FROM kv WHERE k='settings'");
  if (!row) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.v) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
async function setSettings(patch) {
  const merged = { ...(await getSettings()), ...patch };
  await pool.query(
    `INSERT INTO kv (k,v) VALUES ('settings',$1) ON CONFLICT(k) DO UPDATE SET v=excluded.v`,
    [JSON.stringify(merged)]
  );
  return merged;
}

async function seedIfEmpty() {
  const { c } = await one("SELECT COUNT(*)::int as c FROM products");
  if (c > 0) return;
  const seed = [
    { id: "p1", name: "North Loader — Fivem", description: "لودر خفيف وسريع، حماية عالية، تحديثات مستمرة. صالح لمدة 30 يوم.",
      price: 75, image: "", category: "Loaders",
      keys: ["NORTH-DEMO-KEY-0001", "NORTH-DEMO-KEY-0002", "NORTH-DEMO-KEY-0003"],
      deliveryInfo: "رابط اللودر: https://example.com/loader\nقم بتشغيل اللودر ثم أدخل المفتاح.", featured: 1 },
    { id: "p2", name: "North Script — Menu", description: "منيو خرافي بتخصيص كامل، خيارات لا تنتهي، وأداء عالي.",
      price: 120, image: "", category: "Scripts",
      keys: ["NORTH-MENU-A1", "NORTH-MENU-A2"],
      deliveryInfo: "حمّل الملف من رابط اللودر بعد تفعيل المفتاح.", featured: 1 },
    { id: "p3", name: "North Spoofer", description: "سبوفر HWID بأعلى مستويات الأمان، دعم فني 24/7.",
      price: 200, image: "", category: "Spoofers", keys: [],
      deliveryInfo: "بعد التحويل نرسل لك الرابط والمفتاح خلال 5 دقائق.", featured: 0 },
  ];
  const now = Date.now();
  for (let i = 0; i < seed.length; i++) {
    const p = seed[i];
    await pool.query(
      `INSERT INTO products (id,name,description,price,image,category,keys,"deliveryInfo",featured,"createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [p.id, p.name, p.description, p.price, p.image, p.category, JSON.stringify(p.keys), p.deliveryInfo, p.featured, now - i * 1000]
    );
  }
}

function rowToProduct(r) {
  return {
    id: r.id, name: r.name, description: r.description, price: r.price, image: r.image,
    category: r.category, keys: JSON.parse(r.keys || "[]"), deliveryInfo: r.deliveryInfo || "",
    featured: !!r.featured, createdAt: Number(r.createdAt),
    variants: r.variants ? JSON.parse(r.variants) : [],
    compareAtPrice: r.compareAtPrice != null ? Number(r.compareAtPrice) : undefined,
    gallery: r.gallery ? JSON.parse(r.gallery) : [],
  };
}
function rowToOrder(r) {
  return {
    id: r.id, username: r.username, items: JSON.parse(r.items || "[]"), total: r.total,
    receiptImage: r.receiptImage || "", note: r.note || "",
    status: r.status, createdAt: Number(r.createdAt), completedAt: r.completedAt ? Number(r.completedAt) : undefined,
    rating: r.rating || undefined, reviewComment: r.reviewComment || undefined,
    reviewedAt: r.reviewedAt ? Number(r.reviewedAt) : undefined,
    reviewHidden: !!r.reviewHidden,
    couponCode: r.couponCode || undefined,
    discount: r.discount ? Number(r.discount) : 0,
  };
}

async function allProducts() {
  return (await q(`SELECT * FROM products ORDER BY "createdAt" DESC`)).map(rowToProduct);
}
async function allOrders() {
  return (await q(`SELECT * FROM orders ORDER BY "createdAt" DESC`)).map(rowToOrder);
}
async function allUsers() {
  // Never return password hashes to any client, including the admin panel.
  return q(`SELECT username, "createdAt" FROM users ORDER BY "createdAt" DESC`);
}

const ADMIN_USER = process.env.ADMIN_USER || "North";
const ADMIN_PASS = process.env.ADMIN_PASS || "North123";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || crypto.randomBytes(24).toString("hex");

// -------- Discord bot: order notifications --------
// Set DISCORD_BOT_TOKEN (the bot's token, NOT the OAuth client secret) and
// DISCORD_NOTIFY_USER_ID as Railway env vars. The bot must share a server
// with the recipient (or have DMs open) to be able to message them.
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
const DISCORD_NOTIFY_USER_ID = process.env.DISCORD_NOTIFY_USER_ID || "650307900090089503";
let discordDmChannelId = null;
async function getDiscordDmChannel() {
  if (discordDmChannelId) return discordDmChannelId;
  const res = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST",
    headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: DISCORD_NOTIFY_USER_ID }),
  });
  if (!res.ok) throw new Error(`discord channel open failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  discordDmChannelId = data.id;
  return discordDmChannelId;
}
async function notifyDiscordNewOrder(order) {
  if (!DISCORD_BOT_TOKEN) { console.warn("[discord] DISCORD_BOT_TOKEN not set, skipping order notification"); return; }
  try {
    const channelId = await getDiscordDmChannel();
    const itemsText = order.items.map((it) =>
      `• ${it.productName} × ${it.quantity} — ${it.price} (${it.deliveryInfo ? it.deliveryInfo : "بدون تفاصيل تسليم"})`
    ).join("\n") || "لا توجد عناصر";
    const content =
      `📦 **طلب جديد على NorthSite**\n` +
      `**رقم الطلب:** ${order.id}\n` +
      `**من:** ${order.username}\n` +
      `**الإجمالي:** ${order.total}\n` +
      (order.couponCode ? `**الكوبون:** ${order.couponCode} (خصم ${order.discount})\n` : "") +
      `**المنتجات:**\n${itemsText}\n` +
      (order.note ? `**ملاحظة العميل:** ${order.note}\n` : "") +
      `**الحالة:** بانتظار المراجعة`;
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 1900) }),
    });
    if (!res.ok) console.error("[discord] send failed:", res.status, await res.text());
  } catch (e) {
    console.error("[discord] notify error:", e.message);
  }
}

// -------- Discord OAuth2 --------
// Set DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET / DISCORD_REDIRECT_URI / SITE_URL
// as Railway env vars in production. The fallbacks below are only so local/dev
// runs don't crash — replace the secret in Railway and rotate it in the
// Discord Developer Portal since it was shared in plain text once.
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1473730011440873594";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "nV_bYdV-EoLiOzD2jnxMGO1DH4yMOCyN";
const SITE_URL = process.env.SITE_URL || "";
function discordRedirectUri(req) {
  if (process.env.DISCORD_REDIRECT_URI) return process.env.DISCORD_REDIRECT_URI;
  const base = SITE_URL || `${req.protocol}://${req.get("host")}`;
  return `${base}/api/auth/discord/callback`;
}
if (!process.env.ADMIN_TOKEN) {
  console.warn("WARNING: ADMIN_TOKEN not set — a random token was generated and will change on every restart. Set ADMIN_TOKEN in Railway variables.");
}

async function staffByToken(tok) {
  if (!tok) return null;
  return one("SELECT * FROM staff WHERE token=$1", [tok]);
}
async function requireAdmin(req, res, next) {
  const tok = req.headers["x-admin-token"];
  if (tok === ADMIN_TOKEN) { req.staffName = ADMIN_USER; return next(); }
  const staff = await staffByToken(tok);
  if (staff) { req.staffName = staff.username; return next(); }
  return res.status(401).json({ error: "unauthorized" });
}
async function isAdminToken(tok) {
  return tok === ADMIN_TOKEN || !!(await staffByToken(tok));
}

// -------- Password hashing (scrypt, salted) --------
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(plain, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const check = crypto.scryptSync(plain, salt, 64).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(check, "hex"));
  } catch {
    return false;
  }
}

// -------- Username suggestions when a name is taken --------
async function suggestUsernames(base) {
  const clean = base.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, "") || "User";
  const candidates = [];
  for (let i = 0; i < 30 && candidates.length < 4; i++) {
    const suffix = i === 0 ? Math.floor(10 + Math.random() * 89) : Math.floor(100 + Math.random() * 899);
    candidates.push(`${clean}${suffix}`);
  }
  const out = [];
  for (const c of candidates) {
    const exists = await one("SELECT username FROM users WHERE lower(username)=lower($1)", [c]);
    if (!exists) out.push(c);
    if (out.length >= 3) break;
  }
  return out;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

function asyncRoute(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// -------- Public state --------
app.get("/api/state", asyncRoute(async (req, res) => {
  const isAdmin = await isAdminToken(req.headers["x-admin-token"]);
  const uname = String(req.query.user || "").toLowerCase();
  const products = (await allProducts()).map((p) => isAdmin ? p : {
    ...p, keys: [],
    variants: (p.variants || []).map((v) => ({ ...v, keys: undefined })),
  });
  const orders = (await allOrders())
    .filter((o) => isAdmin || (uname && o.username.toLowerCase() === uname))
    .map((o) => isAdmin ? o : { ...o, receiptImage: "" });
  const users = isAdmin ? await allUsers() : [];
  const staffList = isAdmin
    ? await q(`SELECT username, "createdAt" FROM staff ORDER BY "createdAt" DESC`)
    : [];
  const coupons = isAdmin
    ? (await q(`SELECT * FROM coupons ORDER BY "createdAt" DESC`)).map((c) => ({ ...c, excludedProductIds: JSON.parse(c.excludedProductIds || "[]") }))
    : [];
  res.json({ products, orders, users, staff: staffList, settings: await getSettings(), coupons });
}));

// -------- Admin login --------
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ ok: true, token: ADMIN_TOKEN });
  }
  res.status(401).json({ ok: false });
});

// -------- Users --------
// Every account now requires a password. An existing username can only be
// logged into with the correct password; a new username registers together
// with the password the visitor chooses on the spot.
app.post("/api/users/check", asyncRoute(async (req, res) => {
  const uname = String(req.body?.username || req.query.username || "").trim();
  if (!uname) return res.json({ taken: false, suggestions: [] });
  const existing = await one("SELECT username FROM users WHERE lower(username)=lower($1)", [uname]);
  if (!existing) return res.json({ taken: false, suggestions: [] });
  const suggestions = await suggestUsernames(uname);
  res.json({ taken: true, suggestions });
}));

app.post("/api/users/login", asyncRoute(async (req, res) => {
  const uname = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!uname || uname.length < 2 || uname.length > 20) return res.status(400).json({ error: "invalid" });
  if (!password || password.length < 4) return res.status(400).json({ error: "weak_password" });

  const existing = await one("SELECT * FROM users WHERE lower(username)=lower($1)", [uname]);

  if (existing) {
    // Username already registered: must match the password on file.
    if (!verifyPassword(password, existing.password)) {
      const suggestions = await suggestUsernames(uname);
      return res.status(401).json({ error: "wrong_password", suggestions });
    }
    return res.json({ ok: true, username: existing.username });
  }

  // Brand-new username: register it with this password.
  await pool.query(
    `INSERT INTO users (username, password, "createdAt") VALUES ($1,$2,$3)`,
    [uname, hashPassword(password), Date.now()]
  );
  res.json({ ok: true, username: uname });
}));

// -------- Discord OAuth2 login --------
app.get("/api/auth/discord", (req, res) => {
  const redirectUri = discordRedirectUri(req);
  const url = "https://discord.com/api/oauth2/authorize?" + new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    prompt: "consent",
  });
  res.redirect(url);
});

app.get("/api/auth/discord/callback", asyncRoute(async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/login?discord_error=1");
  try {
    const redirectUri = discordRedirectUri(req);
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: String(code),
        redirect_uri: redirectUri,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect("/login?discord_error=1");

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const du = await userRes.json();
    if (!du?.id) return res.redirect("/login?discord_error=1");

    const avatar = du.avatar
      ? `https://cdn.discordapp.com/avatars/${du.id}/${du.avatar}.${du.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(du.id) >> 22n) % 6n)}.png`;
    const banner = du.banner
      ? `https://cdn.discordapp.com/banners/${du.id}/${du.banner}.${du.banner.startsWith("a_") ? "gif" : "png"}?size=900`
      : null;
    const globalName = du.global_name || du.username || ("لاعب" + du.id.slice(-4));
    const discordUsername = du.username || null;

    const existing = await one(`SELECT * FROM users WHERE "discordId"=$1`, [du.id]);
    let finalUsername;
    if (existing) {
      finalUsername = existing.username;
      await pool.query(
        `UPDATE users SET "discordAvatar"=$1, "discordBanner"=$2, "discordGlobalName"=$3, "discordAccent"=$4, "discordUsername"=$5 WHERE username=$6`,
        [avatar, banner, globalName, du.accent_color ?? null, discordUsername, finalUsername]
      );
    } else {
      // Pick a free username based on the Discord display name.
      const base = String(globalName).replace(/[^\p{L}\p{N}_ ]/gu, "").trim().slice(0, 18) || "player";
      let candidate = base; let n = 1;
      while (await one("SELECT username FROM users WHERE lower(username)=lower($1)", [candidate])) {
        candidate = `${base}${n}`; n++;
      }
      finalUsername = candidate;
      await pool.query(
        `INSERT INTO users (username, password, "createdAt", "discordId", "discordAvatar", "discordBanner", "discordGlobalName", "discordAccent", "discordUsername")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [finalUsername, null, Date.now(), du.id, avatar, banner, globalName, du.accent_color ?? null, discordUsername]
      );
    }

    // One-time-use handoff token: the frontend can't read Set-Cookie across
    // the redirect chain reliably, so we hand a short-lived token in the URL
    // and immediately exchange + delete it client-side.
    const handoff = crypto.randomBytes(24).toString("hex");
    await pool.query(
      `INSERT INTO kv (k, v) VALUES ($1, $2) ON CONFLICT(k) DO UPDATE SET v=excluded.v`,
      ["discord_handoff:" + handoff, JSON.stringify({ username: finalUsername, createdAt: Date.now() })]
    );
    res.redirect("/discord-login?token=" + handoff);
  } catch (e) {
    console.error("[discord oauth]", e);
    res.redirect("/login?discord_error=1");
  }
}));

app.post("/api/auth/discord/session", asyncRoute(async (req, res) => {
  const token = String(req.body?.token || "");
  const row = await one("SELECT v FROM kv WHERE k=$1", ["discord_handoff:" + token]);
  if (!row) return res.status(400).json({ error: "invalid_or_expired" });
  await pool.query("DELETE FROM kv WHERE k=$1", ["discord_handoff:" + token]);
  let data;
  try { data = JSON.parse(row.v); } catch { return res.status(400).json({ error: "invalid" }); }
  // Handoff tokens are single-use and only valid for 5 minutes.
  if (Date.now() - data.createdAt > 5 * 60 * 1000) return res.status(400).json({ error: "expired" });
  res.json({ ok: true, username: data.username });
}));

app.get("/api/users/:username/discord-profile", asyncRoute(async (req, res) => {
  const row = await one(
    `SELECT "discordId", "discordAvatar", "discordBanner", "discordGlobalName", "discordAccent", "discordUsername" FROM users WHERE lower(username)=lower($1)`,
    [req.params.username]
  );
  if (!row || !row.discordId) return res.json({ linked: false });
  res.json({
    linked: true,
    avatar: row.discordAvatar,
    banner: row.discordBanner,
    globalName: row.discordGlobalName,
    username: row.discordUsername,
    accentColor: row.discordAccent,
  });
}));


app.post("/api/coupons/validate", asyncRoute(async (req, res) => {
  const code = String(req.body?.code || "").trim().toUpperCase();
  if (!code) return res.json({ valid: false });
  const row = await one("SELECT * FROM coupons WHERE code=$1", [code]);
  if (!row || !row.active) return res.json({ valid: false });
  res.json({ valid: true, code: row.code, percent: row.percent, excludedProductIds: JSON.parse(row.excludedProductIds || "[]") });
}));
app.post("/api/admin/coupons", requireAdmin, asyncRoute(async (req, res) => {
  const code = String(req.body?.code || "").trim().toUpperCase();
  const percent = Math.max(1, Math.min(100, Number(req.body?.percent) || 0));
  const excludedProductIds = Array.isArray(req.body?.excludedProductIds) ? req.body.excludedProductIds : [];
  if (!code || !percent) return res.status(400).json({ error: "invalid" });
  await pool.query(
    `INSERT INTO coupons (code, percent, active, "createdAt", "excludedProductIds") VALUES ($1,$2,1,$3,$4)
     ON CONFLICT(code) DO UPDATE SET percent=excluded.percent, active=1, "excludedProductIds"=excluded."excludedProductIds"`,
    [code, percent, Date.now(), JSON.stringify(excludedProductIds)]
  );
  res.json({ ok: true });
}));
app.patch("/api/admin/coupons/:code", requireAdmin, asyncRoute(async (req, res) => {
  await pool.query("UPDATE coupons SET active=$1 WHERE code=$2", [req.body?.active ? 1 : 0, req.params.code.toUpperCase()]);
  res.json({ ok: true });
}));
app.delete("/api/admin/coupons/:code", requireAdmin, asyncRoute(async (req, res) => {
  await pool.query("DELETE FROM coupons WHERE code=$1", [req.params.code.toUpperCase()]);
  res.json({ ok: true });
}));

// -------- Orders --------
app.post("/api/orders", asyncRoute(async (req, res) => {
  const { username, items: cartItems, receiptImage, note, couponCode } = req.body || {};
  if (!username || !Array.isArray(cartItems) || !cartItems.length) return res.status(400).json({ error: "invalid" });
  const items = [];
  let total = 0;
  for (const ci of cartItems) {
    const r = await one("SELECT * FROM products WHERE id=$1", [ci.productId]);
    if (!r) continue;
    const p = rowToProduct(r);
    const qty = Math.max(1, Number(ci.quantity) || 1);
    let price = p.price;
    let variantLabel = "";
    if (ci.variantId && Array.isArray(p.variants)) {
      const v = p.variants.find((x) => x.id === ci.variantId);
      if (v) { price = Number(v.price); variantLabel = v.label; }
    }
    items.push({
      productId: p.id, productName: variantLabel ? `${p.name} — ${variantLabel}` : p.name,
      productDescription: p.description,
      price, quantity: qty, assignedKeys: [], deliveryInfo: p.deliveryInfo,
      variantId: ci.variantId || null,
    });
    total += price * qty;
  }
  if (!items.length) return res.status(400).json({ error: "no valid items" });

  let discount = 0;
  let appliedCoupon = "";
  if (couponCode) {
    const cr = await one("SELECT * FROM coupons WHERE code=$1", [String(couponCode).trim().toUpperCase()]);
    if (cr && cr.active) {
      const excluded = new Set(JSON.parse(cr.excludedProductIds || "[]"));
      const discountableTotal = items.reduce((sum, it) => excluded.has(it.productId) ? sum : sum + it.price * it.quantity, 0);
      discount = Math.round((discountableTotal * cr.percent) / 100 * 100) / 100;
      appliedCoupon = cr.code;
      total = Math.max(0, total - discount);
    }
  }

  const id = "N" + crypto.randomBytes(3).toString("hex").toUpperCase();
  await pool.query(
    `INSERT INTO orders (id,username,items,total,"receiptImage",note,status,"createdAt","couponCode",discount)
     VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9)`,
    [id, username, JSON.stringify(items), total, receiptImage || "", note || "", Date.now(), appliedCoupon || null, discount]
  );
  const row = await one("SELECT * FROM orders WHERE id=$1", [id]);
  const order = rowToOrder(row);
  notifyDiscordNewOrder(order); // fire-and-forget, never blocks the order response
  res.json({ ok: true, id, order });
}));

// -------- Admin: products --------
app.post("/api/admin/products", requireAdmin, asyncRoute(async (req, res) => {
  const p = req.body || {};
  const id = "p" + crypto.randomBytes(4).toString("hex");
  await pool.query(
    `INSERT INTO products (id,name,description,price,image,category,keys,"deliveryInfo",featured,"createdAt",variants,"compareAtPrice",gallery)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [id, p.name || "", p.description || "", Number(p.price) || 0, p.image || "",
     p.category || "", JSON.stringify(p.keys || []), p.deliveryInfo || "",
     p.featured ? 1 : 0, Date.now(),
     JSON.stringify(p.variants || []), p.compareAtPrice != null && p.compareAtPrice !== "" ? Number(p.compareAtPrice) : null,
     JSON.stringify(p.gallery || [])]
  );
  res.json({ ok: true, id });
}));
app.patch("/api/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => {
  const p = req.body || {};
  const existing = await one("SELECT * FROM products WHERE id=$1", [req.params.id]);
  if (!existing) return res.status(404).json({ error: "not found" });
  const merged = { ...rowToProduct(existing), ...p };
  await pool.query(
    `UPDATE products SET name=$1,description=$2,price=$3,image=$4,category=$5,keys=$6,"deliveryInfo"=$7,featured=$8,variants=$9,"compareAtPrice"=$10,gallery=$11 WHERE id=$12`,
    [merged.name, merged.description, Number(merged.price) || 0, merged.image,
     merged.category, JSON.stringify(merged.keys || []), merged.deliveryInfo,
     merged.featured ? 1 : 0, JSON.stringify(merged.variants || []),
     merged.compareAtPrice != null && merged.compareAtPrice !== "" ? Number(merged.compareAtPrice) : null,
     JSON.stringify(merged.gallery || []),
     req.params.id]
  );
  res.json({ ok: true });
}));
app.delete("/api/admin/products/:id", requireAdmin, asyncRoute(async (req, res) => {
  await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
}));

// -------- Admin: orders --------
app.post("/api/admin/orders/:id/complete", requireAdmin, asyncRoute(async (req, res) => {
  const row = await one("SELECT * FROM orders WHERE id=$1", [req.params.id]);
  if (!row) return res.status(404).json({ error: "not found" });
  const order = rowToOrder(row);
  const productRows = await q("SELECT * FROM products");
  const products = new Map(productRows.map((r) => [r.id, rowToProduct(r)]));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const items = [];
    for (const it of order.items) {
      const p = products.get(it.productId);
      if (!p) { items.push(it); continue; }
      const need = it.quantity - it.assignedKeys.length;
      if (need <= 0) { items.push(it); continue; }

      if (it.variantId && Array.isArray(p.variants) && p.variants.some((v) => v.id === it.variantId)) {
        // Subscription-tab product: pull keys from that specific variant's own pool
        // so monthly/weekly/etc keys never mix with one another.
        const vi = p.variants.findIndex((v) => v.id === it.variantId);
        const variant = p.variants[vi];
        const vKeys = Array.isArray(variant.keys) ? variant.keys : [];
        const taken = vKeys.slice(0, need);
        p.variants[vi] = { ...variant, keys: vKeys.slice(need) };
        await client.query('UPDATE products SET variants=$1 WHERE id=$2', [JSON.stringify(p.variants), p.id]);
        items.push({ ...it, assignedKeys: [...it.assignedKeys, ...taken] });
      } else {
        const taken = p.keys.slice(0, need);
        p.keys = p.keys.slice(need);
        await client.query('UPDATE products SET keys=$1 WHERE id=$2', [JSON.stringify(p.keys), p.id]);
        items.push({ ...it, assignedKeys: [...it.assignedKeys, ...taken] });
      }
    }
    await client.query(
      `UPDATE orders SET items=$1, status='completed', "completedAt"=$2 WHERE id=$3`,
      [JSON.stringify(items), Date.now(), req.params.id]
    );
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
  res.json({ ok: true });
}));
app.post("/api/admin/orders/:id/reject", requireAdmin, asyncRoute(async (req, res) => {
  await pool.query("UPDATE orders SET status='rejected' WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
}));
app.delete("/api/admin/orders/:id", requireAdmin, asyncRoute(async (req, res) => {
  await pool.query("DELETE FROM orders WHERE id=$1", [req.params.id]);
  res.json({ ok: true });
}));

// -------- Admin: settings --------
app.put("/api/admin/settings", requireAdmin, asyncRoute(async (req, res) => {
  const merged = await setSettings(req.body || {});
  res.json({ ok: true, settings: merged });
}));

// -------- Customer: order review --------
app.post("/api/orders/:id/review", asyncRoute(async (req, res) => {
  const { username, rating, comment } = req.body || {};
  const row = await one("SELECT * FROM orders WHERE id=$1", [req.params.id]);
  if (!row) return res.status(404).json({ error: "not found" });
  if (String(username || "").toLowerCase() !== String(row.username).toLowerCase())
    return res.status(403).json({ error: "not your order" });
  if (row.status !== "completed") return res.status(400).json({ error: "order not completed" });
  const r = Math.max(1, Math.min(5, Number(rating) || 0));
  if (!r) return res.status(400).json({ error: "invalid rating" });
  await pool.query(
    `UPDATE orders SET rating=$1, "reviewComment"=$2, "reviewedAt"=$3 WHERE id=$4`,
    [r, String(comment || "").slice(0, 500), Date.now(), req.params.id]
  );
  res.json({ ok: true });
}));

// -------- Public: real reviews for the homepage --------
app.get("/api/reviews", asyncRoute(async (req, res) => {
  const rows = await q(
    `SELECT id, username, rating, "reviewComment", "reviewedAt" FROM orders
     WHERE rating IS NOT NULL AND COALESCE("reviewHidden",0)=0
     ORDER BY "reviewedAt" DESC LIMIT 50`
  );
  res.json({
    reviews: rows.map((r) => ({
      orderId: r.id, username: r.username, rating: r.rating,
      comment: r.reviewComment || "", createdAt: Number(r.reviewedAt),
    })),
  });
}));

// -------- Admin: moderate a review (hide/unhide, wipe comment, delete review) --------
app.post("/api/admin/orders/:id/review/moderate", requireAdmin, asyncRoute(async (req, res) => {
  const { action } = req.body || {};
  const row = await one("SELECT * FROM orders WHERE id=$1", [req.params.id]);
  if (!row) return res.status(404).json({ error: "not found" });
  if (action === "hide") {
    await pool.query(`UPDATE orders SET "reviewHidden"=1 WHERE id=$1`, [req.params.id]);
  } else if (action === "unhide") {
    await pool.query(`UPDATE orders SET "reviewHidden"=0 WHERE id=$1`, [req.params.id]);
  } else if (action === "delete-comment") {
    await pool.query(`UPDATE orders SET "reviewComment"='' WHERE id=$1`, [req.params.id]);
  } else if (action === "delete-review") {
    await pool.query(`UPDATE orders SET rating=NULL, "reviewComment"=NULL, "reviewedAt"=NULL, "reviewHidden"=0 WHERE id=$1`, [req.params.id]);
  } else {
    return res.status(400).json({ error: "invalid action" });
  }
  res.json({ ok: true });
}));

// -------- Admin: staff (team) accounts --------
app.post("/api/admin/staff", requireAdmin, asyncRoute(async (req, res) => {
  const { username, password } = req.body || {};
  const u = String(username || "").trim();
  if (!u || !password) return res.status(400).json({ error: "invalid" });
  const token = crypto.randomBytes(20).toString("hex");
  await pool.query(
    `INSERT INTO staff (username, password, token, "createdAt") VALUES ($1,$2,$3,$4)
     ON CONFLICT(username) DO UPDATE SET password=excluded.password`,
    [u, password, token, Date.now()]
  );
  res.json({ ok: true });
}));
app.delete("/api/admin/staff/:username", requireAdmin, asyncRoute(async (req, res) => {
  await pool.query("DELETE FROM staff WHERE username=$1", [req.params.username]);
  res.json({ ok: true });
}));
app.post("/api/staff/login", asyncRoute(async (req, res) => {
  const { username, password } = req.body || {};
  const row = await one("SELECT * FROM staff WHERE username=$1", [String(username || "").trim()]);
  if (!row || row.password !== password) return res.status(401).json({ ok: false });
  res.json({ ok: true, token: row.token, username: row.username });
}));

// -------- Live chat --------
async function getThread(username) {
  let t = await one("SELECT * FROM chat_threads WHERE username=$1", [username]);
  if (!t) {
    await pool.query(
      `INSERT INTO chat_threads (username, accepted, "lastMessageAt") VALUES ($1,0,$2)`,
      [username, Date.now()]
    );
    t = await one("SELECT * FROM chat_threads WHERE username=$1", [username]);
  }
  return t;
}
app.get("/api/chat/:username", asyncRoute(async (req, res) => {
  const username = req.params.username;
  const thread = await getThread(username);
  const messages = await q(`SELECT * FROM chat_messages WHERE username=$1 ORDER BY "createdAt" ASC`, [username]);
  await pool.query(`UPDATE chat_threads SET "unreadForUser"=0 WHERE username=$1`, [username]);
  res.json({ thread, messages });
}));
app.post("/api/chat/:username/message", asyncRoute(async (req, res) => {
  const username = req.params.username;
  const text = String(req.body?.text || "").trim().slice(0, 1000);
  if (!text) return res.status(400).json({ error: "empty" });
  await getThread(username);
  const { c } = await one("SELECT COUNT(*)::int c FROM chat_messages WHERE username=$1", [username]);
  const isFirst = c === 0;
  const now = Date.now();
  await pool.query(
    `INSERT INTO chat_messages (id, username, sender, "senderName", text, "createdAt") VALUES ($1,$2,$3,$4,$5,$6)`,
    ["m" + crypto.randomBytes(4).toString("hex"), username, "user", username, text, now]
  );
  if (isFirst) {
    await pool.query(
      `INSERT INTO chat_messages (id, username, sender, "senderName", text, "createdAt") VALUES ($1,$2,$3,$4,$5,$6)`,
      ["m" + crypto.randomBytes(4).toString("hex"), username, "system", "النظام",
       "شكرًا لتواصلك معنا! سيقوم أحد أعضاء فريق الدعم بالرد عليك قريبًا.", now + 1]
    );
  }
  await pool.query(`UPDATE chat_threads SET "lastMessageAt"=$1, "unreadForAdmin"=1 WHERE username=$2`, [now, username]);
  res.json({ ok: true });
}));
app.get("/api/admin/chats", requireAdmin, asyncRoute(async (req, res) => {
  const threads = await q(`SELECT * FROM chat_threads ORDER BY "lastMessageAt" DESC`);
  const withLast = [];
  for (const t of threads) {
    const last = await one(`SELECT * FROM chat_messages WHERE username=$1 ORDER BY "createdAt" DESC LIMIT 1`, [t.username]);
    withLast.push({ ...t, lastMessage: last?.text || "", lastSender: last?.sender || "" });
  }
  res.json({ threads: withLast });
}));
app.post("/api/admin/chats/:username/accept", requireAdmin, asyncRoute(async (req, res) => {
  await pool.query(
    `UPDATE chat_threads SET accepted=1, "acceptedBy"=$1 WHERE username=$2`,
    [req.staffName, req.params.username]
  );
  const now = Date.now();
  await pool.query(
    `INSERT INTO chat_messages (id, username, sender, "senderName", text, "createdAt") VALUES ($1,$2,$3,$4,$5,$6)`,
    ["m" + crypto.randomBytes(4).toString("hex"), req.params.username, "system", "النظام",
     `${req.staffName} قبل محادثتك وسيتواصل معك الآن.`, now]
  );
  res.json({ ok: true });
}));
app.get("/api/admin/chats/:username/messages", requireAdmin, asyncRoute(async (req, res) => {
  const messages = await q(`SELECT * FROM chat_messages WHERE username=$1 ORDER BY "createdAt" ASC`, [req.params.username]);
  await pool.query(`UPDATE chat_threads SET "unreadForAdmin"=0 WHERE username=$1`, [req.params.username]);
  res.json({ messages });
}));
app.post("/api/admin/chats/:username/message", requireAdmin, asyncRoute(async (req, res) => {
  const text = String(req.body?.text || "").trim().slice(0, 1000);
  if (!text) return res.status(400).json({ error: "empty" });
  const now = Date.now();
  await pool.query(
    `INSERT INTO chat_messages (id, username, sender, "senderName", text, "createdAt") VALUES ($1,$2,$3,$4,$5,$6)`,
    ["m" + crypto.randomBytes(4).toString("hex"), req.params.username, "admin", req.staffName, text, now]
  );
  await pool.query(`UPDATE chat_threads SET "lastMessageAt"=$1, "unreadForUser"=1 WHERE username=$2`, [now, req.params.username]);
  res.json({ ok: true });
}));

// -------- Visitor analytics --------
const geoCache = new Map();
async function lookupGeo(ip) {
  if (!ip || ip === "::1" || ip.startsWith("127.") || ip.startsWith("::ffff:127")) return { country: "محلي", city: "" };
  if (geoCache.has(ip)) return geoCache.get(ip);
  try {
    const r = await fetch(`http://ip-api.com/json/${ip}?fields=country,city`);
    const d = await r.json();
    const geo = { country: d.country || "غير معروف", city: d.city || "" };
    geoCache.set(ip, geo);
    return geo;
  } catch {
    return { country: "غير معروف", city: "" };
  }
}
app.post("/api/visit", asyncRoute(async (req, res) => {
  const p = String(req.body?.path || "/").slice(0, 200);
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const geo = await lookupGeo(ip);
  await pool.query(
    `INSERT INTO visits (id, path, ip, country, city, "createdAt") VALUES ($1,$2,$3,$4,$5,$6)`,
    ["v" + crypto.randomBytes(5).toString("hex"), p, ip, geo.country, geo.city, Date.now()]
  );
  res.json({ ok: true });
}));
app.get("/api/admin/stats", requireAdmin, asyncRoute(async (req, res) => {
  const { c: total } = await one("SELECT COUNT(*)::int c FROM visits");
  const since = Date.now() - 24 * 3600 * 1000;
  const { c: today } = await one("SELECT COUNT(*)::int c FROM visits WHERE \"createdAt\">$1", [since]);
  const byCountry = await q(`SELECT country, COUNT(*)::int c FROM visits GROUP BY country ORDER BY c DESC LIMIT 15`);
  const byPath = await q(`SELECT path, COUNT(*)::int c FROM visits GROUP BY path ORDER BY c DESC LIMIT 15`);
  const recent = await q(`SELECT * FROM visits ORDER BY "createdAt" DESC LIMIT 30`);
  const orders = await allOrders();
  const completed = orders.filter((o) => o.status === "completed");
  const totalRevenue = completed.reduce((a, o) => a + o.total, 0);
  const rated = orders.filter((o) => o.rating);
  const avgRating = rated.length ? rated.reduce((a, o) => a + o.rating, 0) / rated.length : 0;
  res.json({ totalVisits: total, todayVisits: today, byCountry, byPath, recent, totalRevenue, avgRating });
}));

// -------- Static file serving (production) --------
const DIST = path.join(ROOT, "dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(DIST, "index.html"));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "server error" });
});

const PORT = process.env.PORT || 3001;
migrate()
  .then(seedIfEmpty)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`NorthSite backend running on :${PORT}`);
      if (!process.env.ADMIN_TOKEN) console.log(`Generated admin token (set ADMIN_TOKEN to keep it fixed): ${ADMIN_TOKEN}`);
    });
  })
  .catch((e) => {
    console.error("Failed to migrate/start:", e);
    process.exit(1);
  });
