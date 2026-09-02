import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type HeroSlide } from '@/lib/supabase';
import { t, getTranslatedValue } from '@/lib/i18n';

const AUTOPLAY_INTERVAL = 8000;

export default function HeroSlider() {
  const { lang, settings } = useApp();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setSlides((data as HeroSlide[]) || []);
      setLoading(false);
    })();
  }, []);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % Math.max(slides.length, 1));
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % Math.max(slides.length, 1));
  }, [slides.length]);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  // Autoplay — resets when user manually changes slide
  useEffect(() => {
    if (slides.length <= 1) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, AUTOPLAY_INTERVAL);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, slides.length, next]);

  if (loading) {
    return (
      <section className="relative flex min-h-[600px] flex-col overflow-hidden lg:min-h-[85vh] bg-gray-900 animate-pulse" />
    );
  }

  if (slides.length === 0) {
    // Fallback to legacy hero from site_settings
    return (
      <section className="relative flex min-h-[600px] flex-col overflow-hidden lg:min-h-[85vh]">
        <div className="absolute inset-0">
          {(settings as any)?.hero_video_url ? (
            <video src={(settings as any).hero_video_url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : settings?.hero_image_url ? (
            <img src={settings.hero_image_url} alt="Hero" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-primary-900/50" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 md:pt-36 md:pb-16">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md animate-fade-in-up">
              <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
              {settings?.site_name || 'Estate Premium'}
            </div>
            <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-white animate-fade-in-up md:text-5xl lg:text-6xl" style={{ animationDelay: '0.1s', opacity: 0 }}>
              {getTranslatedValue(settings?.hero_title, lang)}
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-gray-200 animate-fade-in-up md:text-xl" style={{ animationDelay: '0.2s', opacity: 0 }}>
              {getTranslatedValue(settings?.hero_subtitle, lang)}
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
              <Link to="/properties?type=sale" className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-4 font-semibold text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/40 hover:scale-105">
                {t(lang, 'nav.buy')} <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/properties?type=rent" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105">
                {t(lang, 'nav.rent')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative flex min-h-[600px] flex-col overflow-hidden lg:min-h-[85vh]">
      {/* Slides */}
      <div className="absolute inset-0">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {slide.media_type === 'video' && slide.media_url ? (
              <video src={slide.media_url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
            ) : slide.media_url ? (
              <img src={slide.media_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary-800 to-primary-950" />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/50 to-primary-900/40" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 md:pt-36 md:pb-16 flex-1 flex items-center">
        <div className="max-w-3xl">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`transition-all duration-700 ease-in-out ${
                idx === current
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4 pointer-events-none absolute'
              }`}
            >
              {idx === current && (
                <>
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-primary-400 animate-pulse" />
                    {getTranslatedValue(slide.subtitle, lang) || (settings?.site_name || 'Estate Premium')}
                  </div>
                  <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
                    {getTranslatedValue(slide.title, lang)}
                  </h1>
                  <p className="mb-8 max-w-2xl text-lg leading-relaxed text-gray-200 md:text-xl">
                    {getTranslatedValue(slide.description, lang)}
                  </p>
                  {(slide.button_text && (slide.button_text[lang] || slide.button_text.ru)) && slide.button_link && (
                    <Link
                      to={slide.button_link}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-7 py-4 font-semibold text-white shadow-lg shadow-primary-600/30 transition-all hover:bg-primary-700 hover:shadow-xl hover:shadow-primary-600/40 hover:scale-105"
                    >
                      {slide.button_text[lang] || slide.button_text.ru}
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx === current ? 'w-8 bg-primary-400' : 'w-2.5 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
