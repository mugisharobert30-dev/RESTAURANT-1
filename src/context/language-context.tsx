"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type Lang } from "@/lib/i18n";

interface LanguageCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const Ctx = createContext<LanguageCtx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("luwombo_lang") as Lang | null;
    if (saved && ["en", "rw", "fr"].includes(saved)) setLangState(saved);
  }, []);

  const value = useMemo<LanguageCtx>(
    () => ({
      lang,
      setLang: (l) => {
        setLangState(l);
        window.localStorage.setItem("luwombo_lang", l);
        document.documentElement.lang = l;
      },
      t: (key) => translate(lang, key),
    }),
    [lang]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLanguage = () => useContext(Ctx);
