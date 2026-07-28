import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, FileText, Eye, EyeOff, Home } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type Page } from '@/lib/supabase';
import { t, getTranslatedValue } from '@/lib/i18n';

export default function AdminPages() {
  const { lang } = useApp();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('pages').select('*').order('sort_order', { ascending: true });
    setPages((data as Page[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'admin.confirmDelete'))) return;
    await supabase.from('pages').delete().eq('id', id);
    load();
  };

  const togglePublish = async (page: Page) => {
    await supabase.from('pages').update({ is_published: !page.is_published }).eq('id', page.id);
    load();
  };

  const toggleHome = async (page: Page) => {
    await supabase.from('pages').update({ show_on_home: !page.show_on_home }).eq('id', page.id);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{t(lang, 'admin.pages')}</h1>
        <Link
          to="/admin/pages/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t(lang, 'admin.newPage')}
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">{t(lang, 'admin.noPages')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${page.is_published ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <FileText className={`w-5 h-5 ${page.is_published ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{getTranslatedValue(page.title, lang)}</div>
                    <div className="text-xs text-gray-500">/{page.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleHome(page)} title={t(lang, 'admin.showOnHome')} className={`p-2 rounded-lg transition-colors ${page.show_on_home ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <Home className="w-4 h-4" />
                  </button>
                  <button onClick={() => togglePublish(page)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    {page.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <Link to={`/page/${page.slug}`} target="_blank" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link to={`/admin/pages/${page.id}`} className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(page.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
