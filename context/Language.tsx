"use client";

import { createContext, useContext, useEffect, useState } from "react";
import id from "@/locales/id.json";
import en from "@/locales/en.json";

type Lang = "id" | "en";

type LanguageContextType = {
  lang: Lang;
  switchLanguage: () => void;
  t: (key: string) => string;
};

const dictionaries: any = { id, en };

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem("lang") as Lang) || "id";

    setLang(saved);
    setMounted(true);
  }, []);

  const switchLanguage = () => {
    const next = lang === "id" ? "en" : "id";

    setLang(next);
    localStorage.setItem("lang", next);
  };

  const t = (key: string) => {
    return dictionaries[lang]?.[key] || key;
  };

  if (!mounted) return null;

  return (
    <LanguageContext.Provider
      value={{
        lang,
        switchLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}
