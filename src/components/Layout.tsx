import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, User, LogOut, Search, Menu, X, LayoutDashboard } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useStore, userActions } from "@/lib/store";
import { NetworkBackground } from "./NetworkBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CartSheet } from "./CartSheet";
import { ChatWidget } from "./ChatWidget";
import { useLang } from "@/lib/i18n";

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const settings = useStore((s) => s.settings);
  const currentUser = useStore((s) => s.currentUser);
  const cartCount = useStore((s) => s.cart.reduce((a, c) => a + c.quantity, 0));
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ to: "/", search: { q: search } as never });
  }

  return (
    <div className="relative min-h-screen text-foreground" dir="rtl">
      <NetworkBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 glass border-b border-primary/20">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <div className="absolute inset-0 rounded-lg bg-primary/40 blur-md animate-neon-pulse" />
                <div className="relative w-10 h-10 rounded-lg neon-glow bg-secondary/40 p-1.5 flex items-center justify-center">
                  <div className="logo-mask w-full h-full" />
                </div>
              </div>
              <span className="font-display text-xl font-black neon-text-strong hidden sm:inline">
                {settings.siteName}
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 mr-2">
              <NavLink to="/" active={pathname === "/"}>{t("home")}</NavLink>
              <NavLink to="/products" active={pathname.startsWith("/products")}>{t("products")}</NavLink>
              {currentUser && <NavLink to="/account" active={pathname.startsWith("/account")}>{t("account")}</NavLink>}
            </nav>

            <form onSubmit={submitSearch} className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="pr-9 bg-secondary/50 border-primary/30 focus:border-primary"
                />
              </div>
            </form>

            <div className="flex items-center gap-2 mr-auto">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg hover:bg-primary/20 transition-colors"
                aria-label="السلة"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center neon-glow">
                    {cartCount}
                  </span>
                )}
              </button>

              {currentUser ? (
                <div className="flex items-center gap-2">
                  <Link to="/account" className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 transition text-sm font-medium">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{currentUser}</span>
                  </Link>
                  <button
                    onClick={() => { userActions.logout(); navigate({ to: "/" }); }}
                    className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground"
                    aria-label="تسجيل الخروج"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link to="/login">
                  <Button size="sm" className="gradient-purple neon-glow font-semibold">
                    دخول
                  </Button>
                </Link>
              )}

              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button className="md:hidden p-2 rounded-lg hover:bg-primary/20" aria-label="القائمة">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-background/95 border-primary/30">
                  <SheetHeader><SheetTitle className="neon-text">القائمة</SheetTitle></SheetHeader>
                  <div className="mt-6 flex flex-col gap-2 px-4">
                    <MobileLink to="/" onClick={() => setMenuOpen(false)}>الرئيسية</MobileLink>
                    <MobileLink to="/products" onClick={() => setMenuOpen(false)}>المنتجات</MobileLink>
                    {currentUser && <MobileLink to="/account" onClick={() => setMenuOpen(false)}>حسابي</MobileLink>}
                    <form onSubmit={(e) => { submitSearch(e); setMenuOpen(false); }} className="mt-4">
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث..." />
                    </form>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <main className="flex-1 relative">{children}</main>

        <footer className="relative border-t border-primary/20 glass mt-16">
          <div className="mx-auto max-w-7xl px-4 py-10 grid gap-8 md:grid-cols-3">
            <div>
              <div className="font-display text-2xl font-black neon-text-strong">{settings.siteName}</div>
              <p className="text-sm text-muted-foreground mt-2">{settings.tagline}</p>
            </div>
            <div>
              <h4 className="font-display font-bold mb-3 neon-text">روابط</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/" className="hover:text-primary">الرئيسية</Link></li>
                <li><Link to="/products" className="hover:text-primary">المنتجات</Link></li>
                <li><Link to="/login" className="hover:text-primary">تسجيل الدخول</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold mb-3 neon-text">تواصل</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {settings.discordUrl && <li><a href={settings.discordUrl} className="hover:text-primary">Discord</a></li>}
                {settings.twitterUrl && <li><a href={settings.twitterUrl} className="hover:text-primary">Twitter</a></li>}
                <li>{settings.phone}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary/10 py-4 text-center text-xs text-muted-foreground">
            {settings.footerText}
            <Link to="/auth" className="mx-2 opacity-30 hover:opacity-100 transition inline-flex items-center gap-1">
              <LayoutDashboard className="w-3 h-3" /> admin
            </Link>
          </div>
        </footer>
      </div>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
      <ChatWidget />
    </div>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={`relative text-sm font-medium transition ${active ? "text-white neon-text" : "text-muted-foreground hover:text-white"}`}
    >
      {children}
      {active && <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary neon-glow rounded-full" />}
    </Link>
  );
}

function MobileLink({ to, onClick, children }: { to: string; onClick: () => void; children: ReactNode }) {
  return (
    <Link to={to} onClick={onClick} className="py-3 px-3 rounded-lg hover:bg-primary/20 text-lg font-medium">
      {children}
    </Link>
  );
}
