import { Award, Building2, Users, TrendingUp, Check, Phone, Mail, Home, Star, MapPin } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { t, getTranslatedValue, type Lang } from '@/lib/i18n';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  award: Award,
  building: Building2,
  users: Users,
  trending: TrendingUp,
  home: Home,
  star: Star,
  check: Check,
  phone: Phone,
  mail: Mail,
  map: MapPin,
};

export default function AboutPage() {
  const { lang, settings } = useApp();

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

  const aboutText = getTranslatedValue(settings?.about_text, lang) ||
    (lang === 'ru'
      ? 'Мы — команда профессионалов в сфере недвижимости с более чем 12-летним опытом работы на рынке Кыргызстана. Наша миссия — помочь вам найти идеальный дом, квартиру или коммерческое помещение. Мы предлагаем полный спектр услуг: от подбора объекта до оформления сделки.'
      : lang === 'en'
      ? 'We are a team of real estate professionals with over 12 years of experience in the Kyrgyzstan market. Our mission is to help you find the perfect home, apartment, or commercial space. We offer a full range of services: from property selection to deal processing.'
      : 'Биз — Кыргызстан рыногунда 12 жылдан ашык тажрыйбасы бар жылжымай мүлк профессионалдарынын командасыбыз. Биздин миссиябыз — сизге идеалдуу үй, квартира же коммерциялык жай табууга жардам берүү.');

  const rawFeatures = (settings as any)?.about_features;
  const features = rawFeatures && typeof rawFeatures === 'object' && Array.isArray(rawFeatures[lang])
    ? rawFeatures[lang] as string[]
    : lang === 'ru'
    ? ['Полный спектр услуг', 'Опытные риелторы', 'Юридическое сопровождение', 'Индивидуальный подход', 'Бесплатные консультации', 'Безопасные сделки']
    : lang === 'en'
    ? ['Full range of services', 'Experienced realtors', 'Legal support', 'Individual approach', 'Free consultations', 'Safe transactions']
    : ['Кызматтардын толук спектри', 'Тажрыйбалуу риелторлор', 'Юридикалык колдоо', 'Жеке мамиле', 'Акысыз кеңештер', 'Коопсуз сделкалар'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-br from-gray-900 to-primary-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">{t(lang, 'about.title')}</h1>
          <p className="text-gray-300 text-lg">{settings?.site_name || 'Estate Premium'}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-center border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
              <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* About text */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-6">{t(lang, 'about.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg mb-6">{aboutText}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary-600 dark:text-primary-400" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <img
              src={settings?.hero_image_url || 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg'}
              alt="About"
              className="rounded-2xl shadow-xl w-full h-[400px] object-cover"
            />
            {stats[0] && (
              <div className="absolute -bottom-6 -left-6 bg-primary-600 text-white rounded-2xl p-6 shadow-xl hidden md:block">
                <div className="text-3xl font-bold">{stats[0].value}</div>
                <div className="text-sm text-primary-100">{stats[0].label}</div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-primary-700 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">{t(lang, 'contact.title')}</h2>
          <p className="text-primary-100 mb-6">{t(lang, 'contact.subtitle')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            {settings?.phone && (
              <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-semibold hover:shadow-lg transition-shadow">
                <Phone className="w-5 h-5" />
                {settings.phone}
              </a>
            )}
            {settings?.email && (
              <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/30 text-white font-semibold hover:bg-white/20 transition-colors">
                <Mail className="w-5 h-5" />
                {settings.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
