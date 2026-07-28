import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type Page } from '@/lib/supabase';
import { t, getTranslatedValue } from '@/lib/i18n';

export default function DynamicPage() {
  const { slug } = useParams();
  const { lang } = useApp();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('pages').select('*').eq('slug', slug).eq('is_published', true).maybeSingle();
      setPage(data as Page | null);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg mb-4">{t(lang, 'filter.noResults')}</p>
          <Link to="/" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">{t(lang, 'nav.home')}</Link>
        </div>
      </div>
    );
  }

  const content = page.content || {};
  const blocks: any[] = Array.isArray(content.blocks) ? content.blocks : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 to-primary-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            {getTranslatedValue(page.title, lang)}
          </h1>
          {page.excerpt && (
            <p className="text-gray-300 text-lg">{getTranslatedValue(page.excerpt, lang)}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t(lang, 'nav.home')}
        </Link>

        {page.featured_image_url && (
          <img src={page.featured_image_url} alt={getTranslatedValue(page.title, lang)} className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8" />
        )}

        <div className="space-y-8">
          {blocks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t(lang, 'admin.noPages')}</p>
          ) : (
            blocks.map((block, i) => {
              if (block.type === 'text') {
                return (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                    {block.title && block.title[lang] && (
                      <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-3">{block.title[lang]}</h2>
                    )}
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {block.text ? (block.text[lang] || block.text['ru'] || block.text['en'] || '') : ''}
                    </p>
                  </div>
                );
              }
              if (block.type === 'image') {
                return (
                  <div key={i} className="rounded-2xl overflow-hidden">
                    {block.title && block.title[lang] && (
                      <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-3">{block.title[lang]}</h2>
                    )}
                    <img src={block.image_url} alt="" className="w-full rounded-2xl" />
                  </div>
                );
              }
              if (block.type === 'gallery' && Array.isArray(block.images)) {
                return (
                  <div key={i}>
                    {block.title && block.title[lang] && (
                      <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-3">{block.title[lang]}</h2>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {block.images.map((url: string, j: number) => (
                        <img key={j} src={url} alt="" className="w-full h-48 object-cover rounded-xl" />
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })
          )}
        </div>
      </div>
    </div>
  );
}
