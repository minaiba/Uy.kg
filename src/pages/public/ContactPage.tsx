import { useState } from 'react';
import { Phone, Mail, MapPin, Send, Check, MessageCircle, Clock, ExternalLink, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { t, getTranslatedValue } from '@/lib/i18n';
import { get2gisSearchLink } from '@/lib/2gis';
import ContactMap from '@/components/common/ContactMap';

export default function ContactPage() {
  const { lang, settings } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    await supabase.from('property_inquiries').insert({
      name: form.name,
      phone: form.phone,
      email: form.email || null,
      message: form.message || null,
      user_id: user?.id || null,
    });
    setLoading(false);
    setSent(true);
    setForm({ name: '', phone: '', email: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  const contactCards = [
    settings?.phone && { icon: Phone, label: t(lang, 'admin.phone'), value: settings.phone, href: `tel:${settings.phone}` },
    settings?.email && { icon: Mail, label: t(lang, 'admin.emailField'), value: settings.email, href: `mailto:${settings.email}` },
    settings?.address && { icon: MapPin, label: t(lang, 'contact.address'), value: getTranslatedValue(settings.address, lang), href: null },
    settings?.working_hours && { icon: Clock, label: t(lang, 'contact.workingHours'), value: getTranslatedValue(settings.working_hours, lang), href: null },
  ].filter(Boolean) as { icon: any; label: string; value: string; href: string | null }[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="bg-gradient-to-br from-gray-900 to-primary-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">{t(lang, 'contact.title')}</h1>
          <p className="text-gray-300 text-lg">{t(lang, 'contact.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {contactCards.map((card, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-3">
                    <card.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{card.label}</div>
                  {card.href ? (
                    <a href={card.href} className="text-gray-900 dark:text-white font-semibold hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {card.value}
                    </a>
                  ) : (
                    <div className="text-gray-900 dark:text-white font-semibold">{card.value}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4">{t(lang, 'footer.followUs')}</h3>
              <div className="flex gap-3">
                {settings?.whatsapp && (
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </a>
                )}
                {settings?.instagram && (
                  <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 hover:opacity-90 flex items-center justify-center transition-opacity">
                    <span className="text-white font-bold text-sm">IG</span>
                  </a>
                )}
                {settings?.facebook && (
                  <a href={`https://facebook.com/${settings.facebook}`} target="_blank" rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors">
                    <span className="text-white font-bold text-sm">FB</span>
                  </a>
                )}
                {settings?.telegram && (
                  <a href={`https://t.me/${settings.telegram}`} target="_blank" rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-sky-500 hover:bg-sky-600 flex items-center justify-center transition-colors">
                    <Send className="w-6 h-6 text-white" />
                  </a>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  {t(lang, 'contact.address')}
                </h3>
                <a
                  href={get2gisSearchLink(getTranslatedValue(settings?.address, lang) || 'Бишкек')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  2GIS
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <ContactMap address={getTranslatedValue(settings?.address, lang) || 'Бишкек'} />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-md">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">{t(lang, 'contact.sent')}</h3>
              </div>
            ) : !user ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-2">{t(lang, 'auth.loginRequired')}</h3>
                <Link to="/auth" className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors">
                  {t(lang, 'auth.login')}
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white mb-6">{t(lang, 'contact.send')}</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'contact.name')} *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'contact.phone')} *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'contact.email')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'contact.message')}</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {t(lang, 'contact.send')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
