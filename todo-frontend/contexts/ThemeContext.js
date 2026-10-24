'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => {},
});

const STORAGE_KEY = 'taskflow-theme';
const THEMES = ['dark', 'light', 'system'];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('dark');
  const [resolvedTheme, setResolvedTheme] = useState('dark');

  // Resolve system preference
  const getSystemTheme = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';

  const applyTheme = useCallback((t) => {
    const resolved = t === 'system' ? getSystemTheme() : t;
    const root = document.documentElement;
    root.setAttribute('data-theme', resolved);
    setResolvedTheme(resolved);
  }, []);

  // Initialise from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial = THEMES.includes(stored) ? stored : 'dark';
    setThemeState(initial);
    applyTheme(initial);
  }, [applyTheme]);

  // Listen for system preference changes when theme === 'system'
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const setTheme = useCallback((t) => {
    if (!THEMES.includes(t)) return;
    localStorage.setItem(STORAGE_KEY, t);
    setThemeState(t);
    applyTheme(t);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
