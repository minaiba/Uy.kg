import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Sun, Moon, Globe, ChevronDown, Home, Building2, FileText, Phone, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { LANGS, type Lang, type CurrencyCode, CURRENCIES, t, getTranslatedValue } from '@/lib/i18n';

export default function Header() {
  const { theme, toggleTheme, lang, setLang, currency, setCurrency, settings, menuPages } = useApp();
  const { user, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setCurrencyOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const navLinks = [
    { to: '/', label: t(lang, 'nav.home'), icon: Home },
    { to: '/properties?type=sale', label: t(lang, 'nav.buy'), icon: Building2 },
    { to: '/properties?type=rent', label: t(lang, 'nav.rent'), icon: Building2 },
    { to: '/about', label: t(lang, 'nav.about'), icon: FileText },
    { to: '/contact', label: t(lang, 'nav.contact'), icon: Phone },
  ];

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/');
  }, [signOut, navigate]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg shadow-gray-200/20 dark:shadow-black/20'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Site Name */}
          <Link to="/" className="flex items-center gap-1 group flex-shrink-0">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.site_name || 'Estate'}
                className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
                <Home className="w-6 h-6 text-white" />
              </div>
            )}
            {settings?.show_site_name !== false && (
              <span className="font-display text-xl font-extrabold tracking-tight text-gray-900 dark:text-white whitespace-nowrap">
                {settings?.site_name || 'Estate Premium'}
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              >
                {link.label}
              </Link>
            ))}
            {menuPages.map((page) => (
              <Link
                key={page.id}
                to={`/page/${page.slug}`}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              >
                {getTranslatedValue(page.title, lang)}
              </Link>
            ))}
          </nav>

          {/* Right controls — desktop only, burger handles mobile */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* Currency selector */}
            <div className="relative" ref={currencyRef}>
              <button
                onClick={() => setCurrencyOpen(!currencyOpen)}
                className="flex items-center gap-1 px-1.5 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="font-semibold">{CURRENCIES[currency].symbol}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {currencyOpen && (
                <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 py-1 animate-scale-in origin-top-right">
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                    <button
                      key={code}
                      onClick={() => { setCurrency(code); setCurrencyOpen(false); }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg mx-1 transition-colors ${
                        currency === code
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {CURRENCIES[code].symbol} {CURRENCIES[code].label[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language selector */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-1.5 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{lang}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 py-1 animate-scale-in origin-top-right">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code as Lang); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-lg mx-1 transition-colors ${
                        lang === l.code
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span>{l.flag}</span>
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-0.5">
                <Link
                  to={role === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                >
                  {role === 'admin' ? <LayoutDashboard className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  {role === 'admin' ? t(lang, 'admin.dashboard') : t(lang, 'auth.profile')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title={t(lang, 'auth.signOut')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Link
                  to="/auth?mode=login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <User className="w-4 h-4" />
                  {t(lang, 'auth.login')}
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
                >
                  {t(lang, 'auth.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: only burger + theme toggle visible */}
          <div className="flex lg:hidden items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav — includes currency, language, auth */}
        {mobileOpen && (
          <nav className="lg:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              ))}
              {menuPages.map((page) => (
                <Link
                  key={page.id}
                  to={`/page/${page.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  {getTranslatedValue(page.title, lang)}
                </Link>
              ))}

              {/* Currency & Language in mobile menu */}
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="relative flex-1" ref={currencyRef}>
                  <button
                    onClick={() => setCurrencyOpen(!currencyOpen)}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 transition-colors"
                  >
                    <span className="font-semibold">{CURRENCIES[currency].symbol}</span>
                    {CURRENCIES[currency].label[lang]}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {currencyOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-10">
                      {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
                        <button
                          key={code}
                          onClick={() => { setCurrency(code); setCurrencyOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-sm rounded-lg mx-1 transition-colors ${
                            currency === code
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {CURRENCIES[code].symbol} {CURRENCIES[code].label[lang]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="relative flex-1" ref={langRef}>
                  <button
                    onClick={() => setLangOpen(!langOpen)}
                    className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="uppercase">{lang}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {langOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-10">
                      {LANGS.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { setLang(l.code as Lang); setLangOpen(false); }}
                          className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-lg mx-1 transition-colors ${
                            lang === l.code
                              ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span>{l.flag}</span>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {user ? (
                <div className="flex flex-col gap-1 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <Link
                    to={role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    {role === 'admin' ? <LayoutDashboard className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    {role === 'admin' ? t(lang, 'admin.dashboard') : t(lang, 'auth.profile')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    {t(lang, 'auth.signOut')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <Link
                    to="/auth?mode=login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    {t(lang, 'auth.login')}
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
                  >
                    {t(lang, 'auth.register')}
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
