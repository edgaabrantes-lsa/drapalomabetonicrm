import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "pb-theme";

const ThemeContext = createContext({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
});

function aplicarTema(theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function temaInicial() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    return salvo === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(temaInicial);

  useEffect(() => {
    aplicarTema(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* preferência não persistida */
    }
  }, [theme]);

  const value = {
    theme,
    setTheme,
    toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}