import { Link } from 'react-router-dom';
import { Home, Phone, Mail, MapPin, Instagram, Facebook, Send, MessageCircle, Lock, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { t, getTranslatedValue } from '@/lib/i18n';

export default function Footer() {
  const { settings, lang, menuPages } = useApp();

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1.5 mb-4">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt={settings.site_name || 'Estate'} className="h-14 w-auto object-contain" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Home className="w-7 h-7 text-white" />
                </div>
              )}
              {settings?.show_site_name !== false && (
                <span className="font-display text-2xl font-extrabold tracking-tight text-white">
                  {settings?.site_name || 'Estate Premium'}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {settings?.instagram && (
                <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {settings?.facebook && (
                <a href={`https://facebook.com/${settings.facebook}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings?.telegram && (
                <a href={`https://t.me/${settings.telegram}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                  <Send className="w-5 h-5" />
                </a>
              )}
              {settings?.whatsapp && (
                <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-gray-800 hover:bg-primary-600 flex items-center justify-center transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t(lang, 'footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
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
            <h3 className="text-white font-semibold mb-4">{t(lang, 'footer.contact')}</h3>
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
                  <a href={`mailto:${settings.email}`} className="hover:text-primary-400 transition-colors">{settings.email}</a>
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
            <h3 className="text-white font-semibold mb-4">{t(lang, 'contact.title')}</h3>
            <p className="text-sm text-gray-400 mb-4">{t(lang, 'contact.subtitle')}</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors"
            >
              {t(lang, 'property.contact')}
              <Phone className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            {getTranslatedValue(settings?.footer_text, lang) || `© ${new Date().getFullYear()} ${settings?.site_name || 'Estate Premium'}. ${t(lang, 'footer.rights')}`}
          </div>
          <Link
            to="/admin/login"
            className="text-sm text-gray-500 hover:text-primary-400 transition-colors flex items-center gap-1.5"
          >
            <Lock className="w-4 h-4" />
            {t(lang, 'admin.login')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
