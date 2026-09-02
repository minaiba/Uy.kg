import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, X, Save, AlertCircle, Image as ImageIcon, Video, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type HeroSlide } from '@/lib/supabase';
import { t, LANGS, type Lang } from '@/lib/i18n';

type ML = Record<Lang, string>;
function emptyML(): ML { return { ru: '', en: '', kg: '' }; }

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all";

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
                rows={3}
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

type EditingSlide = {
  id?: string;
  title: ML;
  subtitle: ML;
  description: ML;
  media_url: string;
  media_type: 'image' | 'video';
  button_text: ML;
  button_link: string;
  sort_order: number;
  is_active: boolean;
};

function newSlide(sortOrder: number): EditingSlide {
  return {
    title: emptyML(),
    subtitle: emptyML(),
    description: emptyML(),
    media_url: '',
    media_type: 'image',
    button_text: emptyML(),
    button_link: '',
    sort_order: sortOrder,
    is_active: true,
  };
}

export default function AdminHeroSlides() {
  const { lang } = useApp();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingSlide | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadSlides = useCallback(async () => {
    const { data } = await supabase.from('hero_slides').select('*').order('sort_order', { ascending: true });
    setSlides((data as HeroSlide[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadSlides(); }, [loadSlides]);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `hero-slide-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('site-assets').upload(fileName, file);
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      const url = urlData.publicUrl;
      const isVideo = file.type.startsWith('video/');
      setEditing((prev) => prev ? { ...prev, media_url: url, media_type: isVideo ? 'video' : 'image' } : prev);
    }
    setUploading(false);
  }, []);

  const saveSlide = useCallback(async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const payload = {
      title: editing.title,
      subtitle: editing.subtitle,
      description: editing.description,
      media_url: editing.media_url || null,
      media_type: editing.media_type,
      button_text: editing.button_text,
      button_link: editing.button_link || null,
      sort_order: editing.sort_order,
      is_active: editing.is_active,
      updated_at: new Date().toISOString(),
    };
    try {
      if (editing.id) {
        const { error: updErr } = await supabase.from('hero_slides').update(payload).eq('id', editing.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await supabase.from('hero_slides').insert(payload);
        if (insErr) throw insErr;
      }
      setEditing(null);
      loadSlides();
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [editing, loadSlides]);

  const deleteSlide = useCallback(async (id: string) => {
    const { error: delErr } = await supabase.from('hero_slides').delete().eq('id', id);
    if (delErr) { setError(delErr.message); return; }
    loadSlides();
  }, [loadSlides]);

  const toggleActive = useCallback(async (slide: HeroSlide) => {
    const { error: updErr } = await supabase.from('hero_slides').update({ is_active: !slide.is_active, updated_at: new Date().toISOString() }).eq('id', slide.id);
    if (updErr) { setError(updErr.message); return; }
    loadSlides();
  }, [loadSlides]);

  const moveSlide = useCallback(async (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    setSlides(newSlides);
    const updates = newSlides.map((s, i) => supabase.from('hero_slides').update({ sort_order: i, updated_at: new Date().toISOString() }).eq('id', s.id));
    await Promise.all(updates);
    loadSlides();
  }, [slides, loadSlides]);

  const startEdit = (slide: HeroSlide) => {
    setEditing({
      id: slide.id,
      title: (slide.title as ML) || emptyML(),
      subtitle: (slide.subtitle as ML) || emptyML(),
      description: (slide.description as ML) || emptyML(),
      media_url: slide.media_url || '',
      media_type: slide.media_type,
      button_text: (slide.button_text as ML) || emptyML(),
      button_link: slide.button_link || '',
      sort_order: slide.sort_order,
      is_active: slide.is_active,
    });
  };

  const startNew = () => {
    setEditing(newSlide(slides.length));
  };

  if (editing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {editing.id ? (lang === 'ru' ? 'Редактировать слайд' : lang === 'en' ? 'Edit slide' : 'Слайдты оңдоо') : (lang === 'ru' ? 'Новый слайд' : lang === 'en' ? 'New slide' : 'Жаңы слайд')}
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(null)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-all hover:bg-gray-200 dark:hover:bg-gray-700">
              <X className="w-4 h-4" /> {t(lang, 'admin.cancel')}
            </button>
            <button onClick={saveSlide} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all disabled:opacity-50 shadow-lg shadow-primary-600/20">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {t(lang, 'admin.save')}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-xl p-3 border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Media upload */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4">
              {lang === 'ru' ? 'Медиа (изображение или видео)' : lang === 'en' ? 'Media (image or video)' : 'Медиа (сүрөт же видео)'}
            </h3>
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => setEditing({ ...editing, media_type: 'image' })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${editing.media_type === 'image' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              >
                <ImageIcon className="w-4 h-4" /> {lang === 'ru' ? 'Изображение' : lang === 'en' ? 'Image' : 'Сүрөт'}
              </button>
              <button
                onClick={() => setEditing({ ...editing, media_type: 'video' })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${editing.media_type === 'video' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              >
                <Video className="w-4 h-4" /> {lang === 'ru' ? 'Видео' : lang === 'en' ? 'Video' : 'Видео'}
              </button>
            </div>

            {editing.media_url && (
              <div className="relative group mb-3">
                {editing.media_type === 'video' ? (
                  <video src={editing.media_url} className="w-full h-48 object-cover rounded-lg" muted />
                ) : (
                  <img src={editing.media_url} alt="" className="w-full h-48 object-cover rounded-lg" />
                )}
                <button onClick={() => setEditing({ ...editing, media_url: '' })} className="absolute top-2 right-2 p-1.5 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer transition-colors w-full">
              {uploading ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              {t(lang, 'admin.uploadImage')}
              <input
                type="file"
                accept={editing.media_type === 'video' ? 'video/*' : 'image/*'}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
            <input type="text" value={editing.media_url} onChange={(e) => setEditing({ ...editing, media_url: e.target.value })} placeholder="URL" className={`mt-2 ${inputClass}`} />
          </div>

          {/* Text content */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
            <MLInput label={lang === 'ru' ? 'Заголовок' : lang === 'en' ? 'Title' : 'Аталышы'} value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
            <MLInput label={lang === 'ru' ? 'Подзаголовок' : lang === 'en' ? 'Subtitle' : 'Астыңкы аталыш'} value={editing.subtitle} onChange={(v) => setEditing({ ...editing, subtitle: v })} />
            <MLInput label={lang === 'ru' ? 'Описание' : lang === 'en' ? 'Description' : 'Сүрөттөмө'} value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} textarea />
          </div>

          {/* Button */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-5">
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
              {lang === 'ru' ? 'Кнопка (необязательно)' : lang === 'en' ? 'Button (optional)' : 'Баскыч (милдеттүү эмес)'}
            </h3>
            <MLInput label={lang === 'ru' ? 'Текст кнопки' : lang === 'en' ? 'Button text' : 'Баскыч тексті'} value={editing.button_text} onChange={(v) => setEditing({ ...editing, button_text: v })} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{lang === 'ru' ? 'Ссылка кнопки' : lang === 'en' ? 'Button link' : 'Баскыч шилтемеси'}</label>
              <input type="text" value={editing.button_link} onChange={(e) => setEditing({ ...editing, button_link: e.target.value })} placeholder="/properties?type=sale" className={inputClass} />
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditing({ ...editing, is_active: !editing.is_active })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editing.is_active ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {editing.is_active
                  ? (lang === 'ru' ? 'Слайд активен' : lang === 'en' ? 'Slide is active' : 'Слайд активдүү')
                  : (lang === 'ru' ? 'Слайд скрыт' : lang === 'en' ? 'Slide is hidden' : 'Слайд жашыруун')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {lang === 'ru' ? 'Слайды баннера' : lang === 'en' ? 'Hero slides' : 'Баннер слайддары'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {lang === 'ru' ? 'Управляйте слайдами главного баннера' : lang === 'en' ? 'Manage homepage hero slides' : 'Башкы баннер слайддарын башкаруу'}
          </p>
        </div>
        <button onClick={startNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all shadow-lg shadow-primary-600/20">
          <Plus className="w-4 h-4" /> {t(lang, 'admin.add')}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-xl p-3 border border-red-200 dark:border-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : slides.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 border border-gray-100 dark:border-gray-800 text-center shadow-sm">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-400 mb-4">
            {lang === 'ru' ? 'Слайдов пока нет' : lang === 'en' ? 'No slides yet' : 'Слайддар жок'}
          </p>
          <button onClick={startNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all">
            <Plus className="w-4 h-4" /> {lang === 'ru' ? 'Добавить первый слайд' : lang === 'en' ? 'Add first slide' : 'Биринчи слайд кошуу'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl p-4 border shadow-sm transition-all ${
                slide.is_active
                  ? 'border-gray-100 dark:border-gray-800'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Drag handle + reorder */}
                <div className="flex flex-col gap-1">
                  <GripVertical className="w-4 h-4 text-gray-300" />
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveSlide(idx, 'up')}
                      disabled={idx === 0}
                      className="p-0.5 text-gray-400 hover:text-primary-600 disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveSlide(idx, 'down')}
                      disabled={idx === slides.length - 1}
                      className="p-0.5 text-gray-400 hover:text-primary-600 disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Media preview */}
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                  {slide.media_url ? (
                    slide.media_type === 'video' ? (
                      <video src={slide.media_url} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={slide.media_url} alt="" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white truncate">
                    {(slide.title as ML)?.ru || (slide.title as ML)?.en || (lang === 'ru' ? 'Без заголовка' : 'Untitled')}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {(slide.subtitle as ML)?.ru || (slide.subtitle as ML)?.en || ''}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                      #{idx + 1}
                    </span>
                    {slide.media_type === 'video' ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Video className="w-3 h-3" /> Video
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> Image
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(slide)}
                    className={`p-2 rounded-lg transition-colors ${slide.is_active ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    title={slide.is_active ? (lang === 'ru' ? 'Скрыть' : 'Hide') : (lang === 'ru' ? 'Показать' : 'Show')}
                  >
                    {slide.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEdit(slide)}
                    className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    title={t(lang, 'admin.edit')}
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(t(lang, 'admin.confirmDelete'))) deleteSlide(slide.id); }}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title={t(lang, 'admin.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
