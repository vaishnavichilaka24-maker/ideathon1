import React, { createContext, useContext, useState, useEffect } from 'react';
import { SanctuaryTheme, ThemeConfig } from '../types';
import { THEME_REGISTRY, DEFAULT_THEME } from '../lib/themeRegistry';

interface ThemeContextType {
  theme: SanctuaryTheme;
  themeConfig: ThemeConfig;
  setTheme: (theme: SanctuaryTheme) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'haven_sanctuary_theme_preference';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<SanctuaryTheme>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY) as SanctuaryTheme;
      if (saved && THEME_REGISTRY[saved]) {
        return saved;
      }
    } catch {}
    return DEFAULT_THEME;
  });

  const setTheme = (newTheme: SanctuaryTheme) => {
    if (THEME_REGISTRY[newTheme]) {
      setThemeState(newTheme);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, newTheme);
      } catch {}
    }
  };

  const themeConfig = THEME_REGISTRY[theme] || THEME_REGISTRY[DEFAULT_THEME];
  const availableThemes = Object.values(THEME_REGISTRY);

  // Sync css custom properties on root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--sanctuary-accent', themeConfig.accentColor);
    root.style.setProperty('--sanctuary-glow', themeConfig.glowColor);
  }, [themeConfig]);

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useSanctuaryTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    const fallbackConfig = THEME_REGISTRY[DEFAULT_THEME];
    return {
      theme: DEFAULT_THEME,
      themeConfig: fallbackConfig,
      setTheme: () => {},
      availableThemes: Object.values(THEME_REGISTRY),
    };
  }
  return context;
};
