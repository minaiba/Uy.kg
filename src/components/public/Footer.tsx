import { Link } from 'react-router-dom';
import { Home, Phone, Mail, MapPin, Send, Clock, Instagram, Facebook, MessageCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { t, getTranslatedValue } from '@/lib/i18n';

type SocialLink = {
  platform: string;
  label: string;
  url: string;
  icon: string;
};

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  telegram: Send,
  whatsapp: MessageCircle,
};

export default function Footer() {
  const { settings, lang, menuPages } = useApp();

  const socialLinks: SocialLink[] = (() => {
    const raw = (settings as any)?.social_links;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    const fallback: SocialLink[] = [];
    if (settings?.instagram) fallback.push({ platform: 'instagram', label: 'Instagram', url: `https://instagram.com/${settings.instagram}`, icon: 'instagram' });
    if (settings?.facebook) fallback.push({ platform: 'facebook', label: 'Facebook', url: `https://facebook.com/${settings.facebook}`, icon: 'facebook' });
    if (settings?.telegram) fallback.push({ platform: 'telegram', label: 'Telegram', url: `https://t.me/${settings.telegram}`, icon: 'telegram' });
    if (settings?.whatsapp) fallback.push({ platform: 'whatsapp', label: 'WhatsApp', url: `https://wa.me/${settings.whatsapp}`, icon: 'whatsapp' });
    return fallback;
  })();

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {(() => {
                const logo = settings?.logo_dark_url || settings?.logo_url;
                return logo ? (
                  <img src={logo} alt={settings.site_name || 'Estate'} className="h-12 w-auto object-contain" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <Home className="w-6 h-6 text-white" />
                  </div>
                );
              })()}
              {settings?.show_site_name !== false && (
                <span className="font-display text-xl font-extrabold tracking-tight text-white">
                  {settings?.site_name || 'Estate Premium'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              {getTranslatedValue(settings?.hero_subtitle, lang)}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-2">
                {socialLinks.map((social) => {
                  const Icon = SOCIAL_ICONS[social.icon] || SOCIAL_ICONS[social.platform] || Send;
                  return (
                    <a
                      key={social.platform}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={social.label}
                      className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-all hover:scale-110"
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t(lang, 'footer.quickLinks')}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">{t(lang, 'nav.home')}</Link></li>
              <li><Link to="/properties?type=sale" className="hover:text-primary-400 transition-colors">{t(lang, 'nav.buy')}</Link></li>
              <li><Link to="/properties?type=rent" className="hover:text-primary-400 transition-colors">{t(lang, 'nav.rent')}</Link></li>
              <li><Link to="/about" className="hover:text-primary-400 transition-colors">{t(lang, 'nav.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-primary-400 transition-colors">{t(lang, 'nav.contact')}</Link></li>
              {menuPages.map((page) => (
                <li key={page.id}>
                  <Link to={`/page/${page.slug}`} className="hover:text-primary-400 transition-colors">
                    {getTranslatedValue(page.title, lang)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t(lang, 'footer.contact')}</h3>
            <ul className="space-y-3 text-sm">
              {settings?.phone && (
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <a href={`tel:${settings.phone}`} className="hover:text-primary-400 transition-colors">{settings.phone}</a>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <a href={`mailto:${settings.email}`} className="hover:text-primary-400 transition-colors break-all">{settings.email}</a>
                </li>
              )}
              {settings?.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <span>{getTranslatedValue(settings.address, lang)}</span>
                </li>
              )}
              {settings?.working_hours && (
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                  <span>{getTranslatedValue(settings.working_hours, lang)}</span>
                </li>
              )}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">{t(lang, 'contact.title')}</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">{t(lang, 'contact.subtitle')}</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-all hover:scale-105"
            >
              {t(lang, 'property.contact')}
              <Phone className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-800">
          <div className="text-sm text-gray-500 text-center">
            {getTranslatedValue(settings?.footer_text, lang) || `© ${new Date().getFullYear()} ${settings?.site_name || 'Estate Premium'}. ${t(lang, 'footer.rights')}`}
          </div>
        </div>
      </div>
    </footer>
  );
}
