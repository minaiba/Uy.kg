import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText, Inbox, Send, TrendingUp, Plus, Eye } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type PropertyInquiry, type Property } from '@/lib/supabase';
import { t, getTranslatedValue } from '@/lib/i18n';

export default function AdminDashboard() {
  const { lang } = useApp();
  const { user } = useAuth();
  const [stats, setStats] = useState({ properties: 0, activeProperties: 0, pages: 0, inquiries: 0, subscribers: 0, activeSubscribers: 0 });
  const [recentInquiries, setRecentInquiries] = useState<(PropertyInquiry & { properties: Property | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [props, activeProps, pgs, inqs, subs, recentInq] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('pages').select('*', { count: 'exact', head: true }),
        supabase.from('property_inquiries').select('*', { count: 'exact', head: true }),
        supabase.from('telegram_subscribers').select('*', { count: 'exact', head: true }),
        supabase.from('property_inquiries').select('*, properties(title)').order('created_at', { ascending: false }).limit(5),
      ]);

      setStats({
        properties: props.count || 0,
        activeProperties: activeProps.count || 0,
        pages: pgs.count || 0,
        inquiries: inqs.count || 0,
        subscribers: subs.count || 0,
        activeSubscribers: 0,
      });
      setRecentInquiries((recentInq.data as any) || []);
      setLoading(false);
    })();
  }, []);

  const statCards = [
    { icon: Building2, label: t(lang, 'admin.totalProperties'), value: stats.properties, sub: `${stats.activeProperties} ${t(lang, 'admin.activeProperties')}`, color: 'primary', link: '/admin/properties' },
    { icon: FileText, label: t(lang, 'admin.totalPages'), value: stats.pages, color: 'accent', link: '/admin/pages' },
    { icon: Inbox, label: t(lang, 'admin.totalInquiries'), value: stats.inquiries, color: 'primary', link: '/admin/inquiries' },
    { icon: Send, label: t(lang, 'admin.totalSubscribers'), value: stats.subscribers, color: 'accent', link: '/admin/telegram' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-1">{t(lang, 'admin.dashboard')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t(lang, 'admin.welcome')}, {user?.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card, i) => (
          <Link
            key={i}
            to={card.link}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
              card.color === 'primary' ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-accent-50 dark:bg-accent-900/20'
            }`}>
              <card.icon className={`w-6 h-6 ${card.color === 'primary' ? 'text-primary-600 dark:text-primary-400' : 'text-accent-600 dark:text-accent-400'}`} />
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{loading ? '...' : card.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
            {card.sub && <div className="text-xs text-primary-600 dark:text-primary-400 mt-1">{card.sub}</div>}
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4">{t(lang, 'admin.recentInquiries')}</h2>
          {recentInquiries.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">{t(lang, 'admin.noInquiries')}</p>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map((inq) => (
                <div key={inq.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{inq.name}</div>
                    <div className="text-xs text-gray-500">{inq.phone}</div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(inq.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin/inquiries" className="mt-4 inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">
            {t(lang, 'admin.inquiries')} →
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4">{t(lang, 'admin.add')}</h2>
          <div className="space-y-3">
            <Link to="/admin/properties/new" className="flex items-center gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{t(lang, 'admin.newProperty')}</div>
                <div className="text-xs text-gray-500">{t(lang, 'admin.properties')}</div>
              </div>
            </Link>
            <Link to="/admin/pages/new" className="flex items-center gap-3 p-4 rounded-xl bg-accent-50 dark:bg-accent-900/20 hover:bg-accent-100 dark:hover:bg-accent-900/30 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-accent-500 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{t(lang, 'admin.newPage')}</div>
                <div className="text-xs text-gray-500">{t(lang, 'admin.pages')}</div>
              </div>
            </Link>
            <Link to="/admin/settings" className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{t(lang, 'admin.settings')}</div>
                <div className="text-xs text-gray-500">{t(lang, 'admin.siteName')}</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
