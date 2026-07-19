import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { useStore } from "@/lib/store";

const SEEN_KEY = "northsite:splash-seen";

export function LoadingScreen() {
  const { lang, setLang, t } = useLang();
  const settings = useStore((s) => s.settings);
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem(SEEN_KEY);
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const t1 = setTimeout(() => setLeaving(true), 1500);
    const t2 = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem(SEEN_KEY, "1");
    }, 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${leaving ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <button
        onClick={() => setLang(lang === "ar" ? "en" : "ar")}
        className="absolute top-6 left-6 rtl:left-auto rtl:right-6 text-xs font-bold px-3 py-1.5 rounded-full border border-primary/40 hover:bg-primary/20 transition"
      >
        {lang === "ar" ? "English" : "العربية"}
      </button>

      <div className="w-20 h-20 logo-mask animate-neon-pulse mb-6" />
      <div className="font-display text-2xl font-black neon-text-strong">
        {t("welcome")} {settings.siteName}
      </div>
      <div className="text-sm text-muted-foreground mt-2">{t("welcomeSub")}</div>

      <div className="mt-8 w-40 h-1 rounded-full bg-secondary overflow-hidden">
        <div className="h-full gradient-purple" style={{ animation: "splash-bar 1.6s ease forwards" }} />
      </div>
      <style>{`@keyframes splash-bar { from { width: 0%; } to { width: 100%; } }`}</style>
    </div>
  );
}
