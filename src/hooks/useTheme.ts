// ─────────────────────────────────────────────────────────────
//  KitsuyStore — useTheme
//  Controla o tema claro/escuro, persistindo em localStorage
//  e aplicando o atributo data-theme no <html>.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark";
const STORAGE_KEY = "kitsuy-theme";

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  // Sem preferência salva → segue o sistema operacional
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme, setTheme };
}
