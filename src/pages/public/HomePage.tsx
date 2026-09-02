import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Home as HomeIcon, MapPin, Award, Users, TrendingUp, Search, Star, Check, Phone, Mail, FileText, ImageIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type Property, type Page } from '@/lib/supabase';
import { t, getTranslatedValue } from '@/lib/i18n';
import PropertyCard from '@/components/public/PropertyCard';
import HeroSlider from '@/components/public/HeroSlider';

export default function HomePage() {
  const { lang, settings } = useApp();
  const [featured, setFeatured] = useState<Property[]>([]);
  const [recent, setRecent] = useState<Property[]>([]);
  const [homePages, setHomePages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: feat }, { data: rec }, { data: pages }] = await Promise.all([
        supabase.from('properties').select('*').eq('is_published', true).eq('is_featured', true).eq('status', 'active').order('created_at', { ascending: false }).limit(6),
        supabase.from('properties').select('*').eq('is_published', true).eq('status', 'active').order('created_at', { ascending: false }).limit(6),
        supabase.from('pages').select('*').eq('is_published', true).eq('show_on_home', true).order('sort_order', { ascending: true }),
      ]);
      setFeatured((feat as Property[]) || []);
      setRecent((rec as Property[]) || []);
      setHomePages((pages as Page[]) || []);
      setLoading(false);
    })();
  }, []);

  const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    award: Award, building: Building2, users: Users, trending: TrendingUp,
    home: HomeIcon, star: Star, check: Check, phone: Phone, mail: Mail, map: MapPin,
  };
  const rawStats = (settings as any)?.about_stats;
  const stats = Array.isArray(rawStats) && rawStats.length > 0
    ? rawStats.map((s: any) => ({
        icon: ICON_MAP[s.icon] || Award,
        value: s.value,
        label: typeof s.label === 'object' ? (s.label as Record<string, string>)[lang] || (s.label as Record<string, string>)['ru'] || '' : s.label,
      }))
    : [
        { icon: Award, value: '12+', label: t(lang, 'about.experience') },
        { icon: Building2, value: '500+', label: t(lang, 'about.properties') },
        { icon: Users, value: '1200+', label: t(lang, 'about.clients') },
        { icon: TrendingUp, value: '98%', label: t(lang, 'about.clients') },
      ];

  const renderBlock = (block: any, i: number) => {
    if (block.type === 'text') {
      return (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
          {block.title && block.title[lang] && (
            <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-3">{block.title[lang]}</h3>
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
            <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-3">{block.title[lang]}</h3>
          )}
          <img src={block.image_url} alt="" className="w-full rounded-2xl" />
        </div>
      );
    }
    if (block.type === 'gallery' && Array.isArray(block.images)) {
      return (
        <div key={i}>
          {block.title && block.title[lang] && (
            <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-3">{block.title[lang]}</h3>
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
  };

  return (
    <div>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Stats bar */}
      <section className="relative border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 md:py-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="mx-auto mb-2 h-6 w-6 text-primary-600 dark:text-primary-400" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {t(lang, 'admin.featured')} {t(lang, 'nav.properties')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">{getTranslatedValue(settings?.hero_subtitle, lang)}</p>
            </div>
            <Link
              to="/properties"
              className="hidden md:inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:gap-3 transition-all"
            >
              {t(lang, 'hero.viewAll')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="skeleton h-64" />
                  <div className="skeleton h-32" />
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : recent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recent.slice(0, 6).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-4" />
              <p>{t(lang, 'filter.noResults')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Dynamic page sections (pages with show_on_home=true) */}
      {homePages.map((page, idx) => {
        const content = page.content || {};
        const blocks: any[] = Array.isArray(content.blocks) ? content.blocks : [];
        const isEven = idx % 2 === 0;

        return (
          <section
            key={page.id}
            className={`py-20 ${isEven ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950'}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {getTranslatedValue(page.title, lang)}
                </h2>
                {page.excerpt && (
                  <p className="text-gray-500 dark:text-gray-400 text-lg">
                    {getTranslatedValue(page.excerpt, lang)}
                  </p>
                )}
              </div>

              {page.featured_image_url && (
                <img
                  src={page.featured_image_url}
                  alt={getTranslatedValue(page.title, lang)}
                  className="w-full h-64 md:h-96 object-cover rounded-2xl mb-10"
                />
              )}

              {blocks.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blocks.map((block, i) => renderBlock(block, i))}
                </div>
              )}

              <div className="mt-8 text-center">
                <Link
                  to={`/page/${page.slug}`}
                  className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 font-semibold hover:gap-3 transition-all"
                >
                  {t(lang, 'hero.viewAll')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 to-primary-900 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            {getTranslatedValue(settings?.hero_title, lang)}
          </h2>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            {getTranslatedValue(settings?.hero_subtitle, lang)}
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-primary-700 shadow-lg transition-all hover:shadow-xl hover:scale-105"
          >
            {t(lang, 'contact.title')}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
