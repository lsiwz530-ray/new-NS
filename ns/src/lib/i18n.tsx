import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

const DICT: Record<Lang, Record<string, string>> = {
  ar: {
    home: "الرئيسية", products: "المنتجات", account: "حسابي", login: "دخول",
    shopNow: "تسوق الآن", featured: "المميز", cartLabel: "السلة", searchPlaceholder: "ابحث عن منتج...",
    welcome: "أهلًا بك في", welcomeSub: "جاري تجهيز أفضل تجربة لك", chatPrompt: "عندك استفسار؟",
  },
  en: {
    home: "Home", products: "Products", account: "My Account", login: "Login",
    shopNow: "Shop Now", featured: "Featured", cartLabel: "Cart", searchPlaceholder: "Search products...",
    welcome: "Welcome to", welcomeSub: "Setting up the best experience for you", chatPrompt: "Need help?",
  },
};

const LANG_KEY = "northsite:lang";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string };
const LangContext = createContext<Ctx>({ lang: "ar", setLang: () => {}, t: (k) => k });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    return (localStorage.getItem(LANG_KEY) as Lang) || "ar";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }

  function t(key: string) {
    return DICT[lang][key] ?? DICT.ar[key] ?? key;
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
