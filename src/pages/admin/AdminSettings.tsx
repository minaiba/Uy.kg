import { useEffect, useState, useCallback, useRef } from 'react';
import { Save, Upload, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type SiteSettings } from '@/lib/supabase';
import { t, LANGS, type Lang, type CurrencyCode, CURRENCIES } from '@/lib/i18n';

type ML = Record<Lang, string>;
function emptyML(): ML { return { ru: '', en: '', kg: '' }; }

type Stat = { icon: string; value: string; label: Record<Lang, string> };
type Features = Record<Lang, string[]>;
type SocialLink = { platform: string; label: string; url: string; icon: string };

const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'website', label: 'Website' },
];

const ICON_OPTIONS = [
  { value: 'award', label: 'Award' },
  { value: 'building', label: 'Building' },
  { value: 'users', label: 'Users' },
  { value: 'trending', label: 'Trending' },
  { value: 'home', label: 'Home' },
  { value: 'star', label: 'Star' },
  { value: 'check', label: 'Check' },
  { value: 'phone', label: 'Phone' },
  { value: 'mail', label: 'Mail' },
  { value: 'map', label: 'Map' },
];

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all";

// Module-level components to prevent focus loss
function MLInput({ label, value, onChange, textarea }: { label: string; value: ML; onChange: (v: ML) => void; textarea?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="space-y-2">
        {LANGS.map((l) => (
          <div key={l.code} className="flex items-start gap-2">
            <span className="text-xs font-medium text-gray-500 w-8 pt-2 uppercase">{l.code}</span>
            {textarea ? (
              <textarea
                value={value[l.code as Lang] || ''}
                onChange={(e) => onChange({ ...value, [l.code]: e.target.value })}
                rows={4}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm transition-all"
              />
            ) : (
              <input
                type="text"
                value={value[l.code as Lang] || ''}
                onChange={(e) => onChange({ ...value, [l.code]: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const { lang, settings, refreshSettings } = useApp();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const initialLoadRef = useRef(false);

  const [form, setForm] = useState({
    site_name: '',
    logo_url: '',
    show_site_name: true,
    hero_title: emptyML() as ML,
    hero_subtitle: emptyML() as ML,
    hero_image_url: '',
    hero_video_url: '',
    phone: '',
    email: '',
    address: emptyML() as ML,
    whatsapp: '',
    instagram: '',
    facebook: '',
    telegram: '',
    footer_text: emptyML() as ML,
    default_currency: 'KGS' as CurrencyCode,
    about_text: emptyML() as ML,
    working_hours: emptyML() as ML,
  });

  const [stats, setStats] = useState<Stat[]>([]);
  const [features, setFeatures] = useState<Features>({ ru: [], en: [], kg: [] });
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  // Load settings into form — only when settings data actually changes
  useEffect(() => {
    if (settings) {
      const newForm = {
        site_name: settings.site_name || '',
        logo_url: settings.logo_url || '',
        show_site_name: settings.show_site_name !== false,
        hero_title: (settings.hero_title as ML) || emptyML(),
        hero_subtitle: (settings.hero_subtitle as ML) || emptyML(),
        hero_image_url: settings.hero_image_url || '',
        hero_video_url: (settings as any).hero_video_url || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: (settings.address as ML) || emptyML(),
        whatsapp: settings.whatsapp || '',
        instagram: settings.instagram || '',
        facebook: settings.facebook || '',
        telegram: settings.telegram || '',
        footer_text: (settings.footer_text as ML) || emptyML(),
        default_currency: (settings.default_currency as CurrencyCode) || 'KGS',
        about_text: (settings.about_text as ML) || emptyML(),
        working_hours: (settings.working_hours as ML) || emptyML(),
      };
      setForm(newForm);

      const rawStats = (settings as any).about_stats;
      if (Array.isArray(rawStats) && rawStats.length > 0) {
        setStats(rawStats.map((s: any) => ({
          icon: s.icon || 'award',
          value: s.value || '',
          label: s.label || emptyML(),
        })));
      }
      const rawFeatures = (settings as any).about_features;
      if (rawFeatures && typeof rawFeatures === 'object') {
        setFeatures({
          ru: Array.isArray(rawFeatures.ru) ? rawFeatures.ru : [],
          en: Array.isArray(rawFeatures.en) ? rawFeatures.en : [],
          kg: Array.isArray(rawFeatures.kg) ? rawFeatures.kg : [],
        });
      }
      const rawSocial = (settings as any).social_links;
      if (Array.isArray(rawSocial)) {
        setSocialLinks(rawSocial);
      }
      initialLoadRef.current = true;
      setDirty(false);
    }
  }, [settings]);

  // Unsaved changes guard
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Stable updaters — no inline closures
  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }, []);

  const updateML = useCallback((field: keyof typeof form, value: ML) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }, []);

  const save = useCallback(async () => {
    if (!form.site_name.trim()) {
      setError(lang === 'ru' ? 'Название сайта обязательно' : lang === 'en' ? 'Site name is required' : 'Сайт аты милдеттүү');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      site_name: form.site_name,
      logo_url: form.logo_url || null,
      show_site_name: form.show_site_name,
      hero_title: form.hero_title,
      hero_subtitle: form.hero_subtitle,
      hero_image_url: form.hero_image_url || null,
      hero_video_url: form.hero_video_url || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address,
      whatsapp: form.whatsapp || null,
      instagram: form.instagram || null,
      facebook: form.facebook || null,
      telegram: form.telegram || null,
      footer_text: form.footer_text,
      default_currency: form.default_currency,
      about_text: form.about_text,
      working_hours: form.working_hours,
      about_stats: stats,
      about_features: features,
      social_links: socialLinks,
    };
    try {
      if (settings?.id) {
        const { error: updateError } = await supabase.from('site_settings').update(payload).eq('id', settings.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('site_settings').insert(payload);
        if (insertError) throw insertError;
      }
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      refreshSettings();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [form, stats, features, settings, refreshSettings, lang]);

  const handleUpload = useCallback(async (file: File, field: 'logo' | 'hero' | 'hero_video') => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('site-assets').upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      const url = urlData.publicUrl;
      if (field === 'logo') setForm((prev) => ({ ...prev, logo_url: url }));
      else if (field === 'hero') setForm((prev) => ({ ...prev, hero_image_url: url }));
      else setForm((prev) => ({ ...prev, hero_video_url: url }));
      setDirty(true);
    }
    setUploading(false);
  }, []);

  const addSocialLink = useCallback(() => {
    setSocialLinks((prev) => [...prev, { platform: 'instagram', label: 'Instagram', url: '', icon: 'instagram' }]);
    setDirty(true);
  }, []);
  const updateSocialLink = useCallback((i: number, key: keyof SocialLink, val: string) => {
    setSocialLinks((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: val, icon: key === 'platform' ? val : s.icon } : s)));
    setDirty(true);
  }, []);
  const removeSocialLink = useCallback((i: number) => {
    setSocialLinks((prev) => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  }, []);

  const addStat = useCallback(() => {
    setStats((prev) => [...prev, { icon: 'award', value: '', label: emptyML() }]);
    setDirty(true);
  }, []);
  const updateStat = useCallback((i: number, key: keyof Stat, val: any) => {
    setStats((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));
    setDirty(true);
  }, []);
  const removeStat = useCallback((i: number) => {
    setStats((prev) => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  }, []);

  const addFeature = useCallback((l: Lang) => {
    setFeatures((prev) => ({ ...prev, [l]: [...(prev[l] || []), ''] }));
    setDirty(true);
  }, []);
  const updateFeature = useCallback((l: Lang, i: number, val: string) => {
    setFeatures((prev) => ({ ...prev, [l]: (prev[l] || []).map((f, idx) => (idx === i ? val : f)) }));
    setDirty(true);
  }, []);
  const removeFeature = useCallback((l: Lang, i: number) => {
    setFeatures((prev) => ({ ...prev, [l]: (prev[l] || []).filter((_, idx) => idx !== i) }));
    setDirty(true);
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">{t(lang, 'admin.settings')}</h1>
          {dirty && <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {lang === 'ru' ? 'Несохранённые изменения' : lang === 'en' ? 'Unsaved changes' : 'Сакталбаган өзгөрүүлөр'}</p>}
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {t(lang, 'admin.save')}
        </button>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-xl p-3 border border-green-200 dark:border-green-800 animate-fade-in">
          {t(lang, 'admin.saved')}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-xl p-3 border border-red-200 dark:border-red-800 animate-fade-in flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5 shadow-sm">
          <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">{t(lang, 'admin.siteName')}</h3>

          <Field label={t(lang, 'admin.siteName')}>
            <input type="text" value={form.site_name} onChange={(e) => updateField('site_name', e.target.value)} className={inputClass} placeholder="Estate Premium" />
          </Field>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateField('show_site_name', form.show_site_name ? 'false' : 'true')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.show_site_name ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.show_site_name ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">{lang === 'ru' ? 'Показывать название сайта' : lang === 'en' ? 'Show site name' : 'Сайт атын көрсөтүү'}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'admin.logo')}</label>
            {form.logo_url ? (
              <div className="relative group mb-2">
                <img src={form.logo_url} alt="Logo" className="h-20 object-contain rounded-lg bg-gray-50 dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700" />
                <button onClick={() => updateField('logo_url', '')} className="absolute top-1 right-1 p-1 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : null}
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer transition-colors">
              {uploading ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              {t(lang, 'admin.uploadImage')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')} />
            </label>
            <input type="text" value={form.logo_url} onChange={(e) => updateField('logo_url', e.target.value)} placeholder="URL" className={`mt-2 ${inputClass}`} />
          </div>

          <Field label={t(lang, 'admin.defaultCurrency')}>
            <select value={form.default_currency} onChange={(e) => updateField('default_currency', e.target.value)} className={inputClass}>
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {/* Hero */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5 shadow-sm">
          <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">Hero</h3>
          <MLInput label={t(lang, 'admin.heroTitle')} value={form.hero_title} onChange={(v) => updateML('hero_title', v)} />
          <MLInput label={t(lang, 'admin.heroSubtitle')} value={form.hero_subtitle} onChange={(v) => updateML('hero_subtitle', v)} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'admin.heroImage')}</label>
            {form.hero_image_url && (
              <div className="relative group mb-2">
                <img src={form.hero_image_url} alt="Hero" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={() => updateField('hero_image_url', '')} className="absolute top-2 right-2 p-1 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer transition-colors">
              {uploading ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              {t(lang, 'admin.uploadImage')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'hero')} />
            </label>
            <input type="text" value={form.hero_image_url} onChange={(e) => updateField('hero_image_url', e.target.value)} placeholder="URL" className={`mt-2 ${inputClass}`} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{lang === 'ru' ? 'Видео для баннера' : lang === 'en' ? 'Banner video' : 'Баннер видео'}</label>
            {form.hero_video_url && (
              <div className="relative group mb-2">
                <video src={form.hero_video_url} className="w-full h-32 object-cover rounded-lg" muted />
                <button onClick={() => updateField('hero_video_url', '')} className="absolute top-2 right-2 p-1 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer transition-colors">
              {uploading ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              {lang === 'ru' ? 'Загрузить видео' : lang === 'en' ? 'Upload video' : 'Видео жүктөө'}
              <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'hero_video')} />
            </label>
            <input type="text" value={form.hero_video_url} onChange={(e) => updateField('hero_video_url', e.target.value)} placeholder="URL" className={`mt-2 ${inputClass}`} />
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5 shadow-sm">
          <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">{t(lang, 'footer.contact')}</h3>
          <Field label={t(lang, 'admin.phone')}><input type="text" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className={inputClass} placeholder="+996 555 123 456" /></Field>
          <Field label={t(lang, 'admin.emailField')}><input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={inputClass} placeholder="info@example.com" /></Field>
          <MLInput label={t(lang, 'contact.address')} value={form.address} onChange={(v) => updateML('address', v)} />
          <MLInput label={t(lang, 'admin.workingHours')} value={form.working_hours} onChange={(v) => updateML('working_hours', v)} />
        </div>

        {/* Social links — dynamic */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">{t(lang, 'footer.followUs')}</h3>
            <button onClick={addSocialLink} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <Plus className="w-4 h-4" /> {t(lang, 'admin.add')}
            </button>
          </div>
          {socialLinks.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">{lang === 'ru' ? 'Нет соцсетей' : lang === 'en' ? 'No social links' : 'Социалдык шилтеме жок'}</p>
          ) : (
            <div className="space-y-3">
              {socialLinks.map((social, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">#{i + 1}</span>
                    <button onClick={() => removeSocialLink(i)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={lang === 'ru' ? 'Платформа' : lang === 'en' ? 'Platform' : 'Платформа'}>
                      <select value={social.platform} onChange={(e) => updateSocialLink(i, 'platform', e.target.value)} className={inputClass}>
                        {SOCIAL_PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </Field>
                    <Field label={lang === 'ru' ? 'Название' : lang === 'en' ? 'Label' : 'Аталышы'}>
                      <input type="text" value={social.label} onChange={(e) => updateSocialLink(i, 'label', e.target.value)} className={inputClass} />
                    </Field>
                  </div>
                  <Field label="URL">
                    <input type="text" value={social.url} onChange={(e) => updateSocialLink(i, 'url', e.target.value)} placeholder="https://..." className={inputClass} />
                  </Field>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About text & footer */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5 shadow-sm">
          <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">{t(lang, 'admin.aboutText')}</h3>
          <MLInput label={t(lang, 'admin.aboutText')} value={form.about_text} onChange={(v) => updateML('about_text', v)} textarea />
          <MLInput label={t(lang, 'admin.footerText')} value={form.footer_text} onChange={(v) => updateML('footer_text', v)} />
        </div>

        {/* About stats */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
              {lang === 'ru' ? 'Статистика (О нас)' : lang === 'en' ? 'Stats (About)' : 'Статистика (Биз жөнүндө)'}
            </h3>
            <button onClick={addStat} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <Plus className="w-4 h-4" /> {t(lang, 'admin.add')}
            </button>
          </div>
          {stats.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm">{lang === 'ru' ? 'Нет статистики' : lang === 'en' ? 'No stats' : 'Статистика жок'}</p>
          ) : (
            <div className="space-y-3">
              {stats.map((stat, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">#{i + 1}</span>
                    <button onClick={() => removeStat(i)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={lang === 'ru' ? 'Иконка' : lang === 'en' ? 'Icon' : 'Иконка'}>
                      <select value={stat.icon} onChange={(e) => updateStat(i, 'icon', e.target.value)} className={inputClass}>
                        {ICON_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </Field>
                    <Field label={lang === 'ru' ? 'Значение' : lang === 'en' ? 'Value' : 'Мааниси'}>
                      <input type="text" value={stat.value} onChange={(e) => updateStat(i, 'value', e.target.value)} placeholder="12+" className={inputClass} />
                    </Field>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{lang === 'ru' ? 'Подпись' : lang === 'en' ? 'Label' : 'Белги'}</label>
                    <div className="space-y-2">
                      {LANGS.map((l) => (
                        <div key={l.code} className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500 w-8 uppercase">{l.code}</span>
                          <input
                            type="text"
                            value={stat.label[l.code as Lang] || ''}
                            onChange={(e) => updateStat(i, 'label', { ...stat.label, [l.code]: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About features */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5 shadow-sm">
          <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
            {lang === 'ru' ? 'Преимущества (О нас)' : lang === 'en' ? 'Features (About)' : 'Артыкчылыктар (Биз жөнүндө)'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LANGS.map((l) => (
              <div key={l.code} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase">{l.code}</span>
                  <button onClick={() => addFeature(l.code as Lang)} className="p-1 rounded text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {(features[l.code as Lang] || []).map((feat, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => updateFeature(l.code as Lang, i, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all"
                    />
                    <button onClick={() => removeFeature(l.code as Lang, i)} className="p-1.5 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
