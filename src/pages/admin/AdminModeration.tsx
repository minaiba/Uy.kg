import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Check, X, Trash2, Eye, Search, AlertCircle, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, type Property } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { getTranslatedValue, formatPrice, type CurrencyCode } from '@/lib/i18n';

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminModeration() {
  const { lang, currency } = useApp();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('moderation_status', filter);
    const { data, error: err } = await query;
    if (err) { setError(err.message); setLoading(false); return; }
    setProperties((data as Property[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setModeration = async (id: string, status: 'pending' | 'approved' | 'rejected') => {
    const { error: err } = await supabase.from('properties').update({ moderation_status: status, updated_at: new Date().toISOString() }).eq('id', id);
    if (err) { setError(err.message); return; }
    setProperties((prev) => prev.filter((p) => p.id !== id || filter === 'all'));
    if (filter !== 'all') {
      setProperties((prev) => prev.map((p) => p.id === id ? { ...p, moderation_status: status } : p));
    }
  };

  const deleteProperty = async (id: string) => {
    if (!confirm(lang === 'ru' ? 'Удалить объявление?' : lang === 'en' ? 'Delete listing?' : 'Жарнаманы өчүрөсүзбү?')) return;
    const { error: err } = await supabase.from('properties').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = properties.filter((p) => {
    const q = search.toLowerCase();
    return Object.values(p.title).join(' ').toLowerCase().includes(q) || (p.city || '').toLowerCase().includes(q);
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels: Record<string, Record<string, string>> = {
      pending: { ru: 'На модерации', en: 'Pending', kg: 'Күтүүдө' },
      approved: { ru: 'Опубликовано', en: 'Approved', kg: 'Бекитилди' },
      rejected: { ru: 'Отклонено', en: 'Rejected', kg: 'Реджект' },
    };
    return { class: colors[status], label: labels[status]?.[lang] || status };
  };

  const tabs: { key: FilterStatus; label: string }[] = [
    { key: 'pending', label: lang === 'ru' ? 'На модерации' : lang === 'en' ? 'Pending' : 'Күтүүдө' },
    { key: 'approved', label: lang === 'ru' ? 'Одобрено' : lang === 'en' ? 'Approved' : 'Бекитилди' },
    { key: 'rejected', label: lang === 'ru' ? 'Отклонено' : lang === 'en' ? 'Rejected' : 'Реджект' },
    { key: 'all', label: lang === 'ru' ? 'Все' : lang === 'en' ? 'All' : 'Бардык' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {lang === 'ru' ? 'Модерация' : lang === 'en' ? 'Moderation' : 'Модерация'}
        </h1>
        <p className="text-gray-500 text-sm">
          {lang === 'ru' ? 'Проверка и модерация объявлений' : lang === 'en' ? 'Review and moderate listings' : 'Жарнамаларды текшерүү жана модерация'}
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-xl p-3 border border-red-200 dark:border-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto text-xs underline">OK</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${lang === 'ru' ? 'Поиск' : lang === 'en' ? 'Search' : 'Издөө'}...`}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-100 dark:border-gray-800 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">
              {lang === 'ru' ? 'Нет объявлений' : lang === 'en' ? 'No listings' : 'Жарнамалар жок'}
            </p>
          </div>
        ) : (
          filtered.map((p) => {
            const badge = statusBadge(p.moderation_status);
            return (
              <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                    {p.main_image_url ? (
                      <img src={p.main_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">
                      {getTranslatedValue(p.title, lang)}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {p.city || '—'} · {formatPrice(p.price, p.currency as CurrencyCode, currency, lang)}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>{badge.label}</span>
                      <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Link to={`/properties/${p.id}`} target="_blank" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                    {p.moderation_status !== 'approved' && (
                      <button
                        onClick={() => setModeration(p.id, 'approved')}
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                        title={lang === 'ru' ? 'Одобрить' : lang === 'en' ? 'Approve' : 'Бекитүү'}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    {p.moderation_status !== 'rejected' && (
                      <button
                        onClick={() => setModeration(p.id, 'rejected')}
                        className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                        title={lang === 'ru' ? 'Отклонить' : lang === 'en' ? 'Reject' : 'Реджект'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <Link to={`/admin/properties/${p.id}`} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => deleteProperty(p.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
