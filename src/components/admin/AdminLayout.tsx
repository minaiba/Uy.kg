import { Navigate, NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { LayoutDashboard, Building2, FileText, Settings, Send, Inbox, LogOut, Home, Sun, Moon, X } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useState, useCallback } from 'react';

export default function AdminLayout() {
  const { user, loading, signOut } = useAuth();
  const { lang, theme, toggleTheme, settings } = useApp();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/auth');
  }, [signOut, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const menuItems = [
    { to: '/admin', icon: LayoutDashboard, label: t(lang, 'admin.dashboard'), end: true },
    { to: '/admin/properties', icon: Building2, label: t(lang, 'admin.properties') },
    { to: '/admin/pages', icon: FileText, label: t(lang, 'admin.pages') },
    { to: '/admin/inquiries', icon: Inbox, label: t(lang, 'admin.inquiries') },
    { to: '/admin/telegram', icon: Send, label: t(lang, 'admin.telegram') },
    { to: '/admin/settings', icon: Settings, label: t(lang, 'admin.settings') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-gray-900 dark:bg-black border-r border-gray-800 z-50 transition-transform duration-300 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Home className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-display text-lg font-bold text-white truncate">{settings?.site_name || 'Estate'}</div>
              <div className="text-xs text-gray-500">Admin Panel</div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom controls */}
        <div className="p-4 border-t border-gray-800 space-y-3">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
          >
            <Home className="w-4 h-4" />
            {t(lang, 'admin.goHome')}
          </Link>
          <div className="flex items-center justify-between">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
              title={t(lang, 'admin.signOut')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="text-xs text-gray-500 truncate px-1">{user.email}</div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-gray-900 dark:text-white">{settings?.site_name || 'Admin'}</span>
          <Link
            to="/"
            className="p-2 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            title={t(lang, 'admin.goHome')}
          >
            <Home className="w-5 h-5" />
          </Link>
        </div>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
