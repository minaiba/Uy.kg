import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { supabase, type SiteSettings } from '@/lib/supabase';
import { type Lang, type CurrencyCode } from '@/lib/i18n';

type Theme = 'light' | 'dark';

type AppContextType = {
  theme: Theme;
  toggleTheme: () => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  settings: SiteSettings | null;
  loadingSettings: boolean;
  refreshSettings: () => Promise<void>;
  menuPages: { id: string; slug: string; title: Record<string, string> }[];
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('estate-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('estate-lang') as Lang;
    return saved || 'ru';
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('estate-currency') as CurrencyCode;
    return saved || 'KGS';
  });

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [menuPages, setMenuPages] = useState<{ id: string; slug: string; title: Record<string, string> }[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('estate-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('estate-lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('estate-currency', currency);
  }, [currency]);

  const refreshSettings = useCallback(async () => {
    try {
      const { data } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
      if (data) {
        setSettings(data as SiteSettings);
        if (data.default_currency) {
          setCurrencyState(data.default_currency as CurrencyCode);
        }
      }
    } catch {
      // silent
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const loadMenuPages = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('pages')
        .select('id, slug, title')
        .eq('is_published', true)
        .eq('show_in_menu', true)
        .order('sort_order', { ascending: true });
      if (data) setMenuPages(data as any);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    loadMenuPages();
  }, [refreshSettings, loadMenuPages]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);
  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const setCurrency = useCallback((c: CurrencyCode) => setCurrencyState(c), []);

  const value = useMemo<AppContextType>(
    () => ({ theme, toggleTheme, lang, setLang, currency, setCurrency, settings, loadingSettings, refreshSettings, menuPages }),
    [theme, toggleTheme, lang, setLang, currency, setCurrency, settings, loadingSettings, refreshSettings, menuPages],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
