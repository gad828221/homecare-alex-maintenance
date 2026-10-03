import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = true, // جعل التبديل متاحاً افتراضياً
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined" && switchable) {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    const isStaffPath = /^\/(login|orders|tech-portal|data-entry)(?:\/|$)/.test(window.location.pathname);
    const staffThemeClasses = ["manager-light-theme", "operations-light-theme", "staff-night-theme"];

    if (theme === "dark" && isStaffPath) {
      root.classList.add("dark");
      root.classList.add("manager-light-theme", "operations-light-theme", "staff-night-theme");
    } else if (theme === "light" && isStaffPath) {
      root.classList.remove("dark");
      root.classList.add("manager-light-theme", "operations-light-theme");
      root.classList.remove("staff-night-theme");
    } else {
      // صفحات الزوار تبقى على ثيمها الأصلي ولا ترث ثيم لوحة الموظفين.
      root.classList.remove("dark", ...staffThemeClasses);
    }

    if (switchable && typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
