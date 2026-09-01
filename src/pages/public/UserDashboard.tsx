import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Save, Home, LogOut, Check, AlertCircle, Heart, MessageSquare, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';

export default function UserDashboard() {
  const { lang } = useApp();
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ full_name: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .maybeSingle();
    if (data) {
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        email: data.email || user.email || '',
      });
    }
  }, [user]);

  const loadInquiries = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('property_inquiries')
      .select('*, property:properties(title, main_image_url)')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(10);
    setInquiries(data || []);
  }, [user]);

  useEffect(() => {
    loadProfile();
    loadInquiries();
  }, [loadProfile, loadInquiries]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq('id', user.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const inputClass = "w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-gray-900 dark:text-white">{t(lang, 'auth.myProfile')}</h1>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{t(lang, 'admin.backToSite')}</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t(lang, 'auth.signOut')}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Profile card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-6">
            {lang === 'ru' ? 'Личные данные' : lang === 'en' ? 'Personal info' : 'Жеке маалымат'}
          </h2>

          {saved && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-xl p-3 border border-green-200 dark:border-green-800 flex items-center gap-2">
              <Check className="w-4 h-4" /> {t(lang, 'admin.saved')}
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl p-3 border border-red-200 dark:border-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.fullName')}</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'auth.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className={`${inputClass} opacity-60 cursor-not-allowed`}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {t(lang, 'admin.save')}
            </button>
          </div>
        </div>

        {/* Inquiries card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            {lang === 'ru' ? 'Мои заявки' : lang === 'en' ? 'My inquiries' : 'Менин арыздарым'}
          </h2>
          {inquiries.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400 text-sm">
                {lang === 'ru' ? 'У вас пока нет заявок' : lang === 'en' ? 'No inquiries yet' : 'Арыздалар жок'}
              </p>
              <Link to="/properties" className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-medium mt-2 hover:underline">
                {t(lang, 'nav.properties')}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div key={inq.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {inq.property?.main_image_url ? (
                    <img src={inq.property.main_image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <Home className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {inq.property?.title ? (inq.property.title[lang] || inq.property.title.ru || '') : '—'}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(inq.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex-shrink-0">
                    {inq.property_id ? t(lang, 'property.contact') : t(lang, 'contact.title')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
