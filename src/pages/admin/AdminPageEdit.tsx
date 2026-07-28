import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Upload, X, GripVertical } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type Page } from '@/lib/supabase';
import { t, LANGS, type Lang } from '@/lib/i18n';

type MultiLangField = Record<Lang, string>;
type Block = {
  type: 'text' | 'image' | 'gallery';
  title: MultiLangField | null;
  text: MultiLangField | null;
  image_url: string | null;
  images: string[] | null;
};

function emptyMultiLang(): MultiLangField { return { ru: '', en: '', kg: '' }; }

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all";

function MLInput({ label, value, onChange, textarea }: { label: string; value: MultiLangField; onChange: (v: MultiLangField) => void; textarea?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <div className="space-y-1">
        {LANGS.map((l) => (
          <div key={l.code} className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-6 pt-2 uppercase">{l.code}</span>
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

export default function AdminPageEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useApp();
  const isNew = !id || id === 'new';

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState<MultiLangField>(emptyMultiLang());
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState<MultiLangField>(emptyMultiLang());
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [showInMenu, setShowInMenu] = useState(true);
  const [showOnHome, setShowOnHome] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    if (!isNew && id) {
      (async () => {
        const { data } = await supabase.from('pages').select('*').eq('id', id).maybeSingle();
        if (data) {
          const p = data as Page;
          setTitle((p.title as MultiLangField) || emptyMultiLang());
          setSlug(p.slug);
          setExcerpt((p.excerpt as MultiLangField) || emptyMultiLang());
          setFeaturedImageUrl(p.featured_image_url || '');
          setIsPublished(p.is_published);
          setShowInMenu(p.show_in_menu);
          setShowOnHome(p.show_on_home ?? false);
          setSortOrder(p.sort_order);
          const content = p.content || {};
          setBlocks(Array.isArray(content.blocks) ? content.blocks : []);
        }
      })();
    }
  }, [id, isNew]);

  const save = async () => {
    setSaving(true);
    const finalSlug = slug || title.ru?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'page';
    const payload = {
      slug: finalSlug,
      title,
      excerpt,
      featured_image_url: featuredImageUrl || null,
      is_published: isPublished,
      show_in_menu: showInMenu,
      show_on_home: showOnHome,
      sort_order: sortOrder,
      content: { blocks },
    };

    if (isNew) {
      const { error } = await supabase.from('pages').insert(payload).select().single();
      if (!error) {
        const { data } = await supabase.from('pages').select('id').eq('slug', finalSlug).maybeSingle();
        if (data) navigate(`/admin/pages/${data.id}`);
      }
    } else {
      await supabase.from('pages').update(payload).eq('id', id!);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addBlock = (type: Block['type']) => {
    setBlocks([...blocks, { type, title: emptyMultiLang(), text: type === 'text' ? emptyMultiLang() : null, image_url: null, images: null }]);
  };

  const updateBlock = (index: number, updates: Partial<Block>) => {
    setBlocks(blocks.map((b, i) => (i === index ? { ...b, ...updates } : b)));
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const handleUpload = async (file: File, blockIndex: number, isGallery: boolean) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('site-assets').upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      const url = urlData.publicUrl;
      if (isGallery) {
        const block = blocks[blockIndex];
        const imgs = block.images || [];
        updateBlock(blockIndex, { images: [...imgs, url] });
      } else {
        updateBlock(blockIndex, { image_url: url });
      }
    }
    setUploading(false);
  };

  const handleFeaturedUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('site-assets').upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      setFeaturedImageUrl(urlData.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/pages" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {isNew ? t(lang, 'admin.newPage') : t(lang, 'admin.editPage')}
          </h1>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {t(lang, 'admin.save')}
        </button>
      </div>

      {saved && (
        <div className="mb-4 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm rounded-xl p-3 border border-primary-200 dark:border-primary-800 animate-fade-in">
          {t(lang, 'admin.saved')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Page settings */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5">
            <MLInput label={t(lang, 'admin.pageTitle')} value={title} onChange={setTitle} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'admin.slug')}</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about-us" className={inputClass} />
            </div>
            <MLInput label={t(lang, 'admin.excerpt')} value={excerpt} onChange={setExcerpt} textarea />
          </div>

          {/* Content blocks */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t(lang, 'admin.pageContent')}</h3>
              <div className="flex gap-2">
                <button onClick={() => addBlock('text')} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" /> {t(lang, 'admin.textBlock')}
                </button>
                <button onClick={() => addBlock('image')} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" /> {t(lang, 'admin.imageBlock')}
                </button>
                <button onClick={() => addBlock('gallery')} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium flex items-center gap-1 transition-colors">
                  <Plus className="w-3 h-3" /> {t(lang, 'admin.galleryBlock')}
                </button>
              </div>
            </div>

            {blocks.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">{t(lang, 'admin.addBlock')}</p>
            ) : (
              <div className="space-y-4">
                {blocks.map((block, i) => (
                  <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 uppercase">{block.type}</span>
                      </div>
                      <button onClick={() => removeBlock(i)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <MLInput label={t(lang, 'admin.blockTitle')} value={block.title || emptyMultiLang()} onChange={(v) => updateBlock(i, { title: v })} />

                    {block.type === 'text' && (
                      <MLInput label={t(lang, 'admin.blockText')} value={block.text || emptyMultiLang()} onChange={(v) => updateBlock(i, { text: v })} textarea />
                    )}

                    {block.type === 'image' && (
                      <div>
                        {block.image_url && (
                          <div className="relative group mb-2">
                            <img src={block.image_url} alt="" className="w-full h-40 object-cover rounded-lg" />
                            <button onClick={() => updateBlock(i, { image_url: null })} className="absolute top-2 right-2 p-1 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium cursor-pointer transition-colors">
                          {uploading ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                          {t(lang, 'admin.uploadImage')}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], i, false)} />
                        </label>
                        <input type="text" value={block.image_url || ''} onChange={(e) => updateBlock(i, { image_url: e.target.value })} placeholder="URL" className={`mt-2 ${inputClass}`} />
                      </div>
                    )}

                    {block.type === 'gallery' && (
                      <div>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {(block.images || []).map((url, j) => (
                            <div key={j} className="relative group">
                              <img src={url} alt="" className="w-full h-16 object-cover rounded-lg" />
                              <button onClick={() => updateBlock(i, { images: (block.images || []).filter((_, k) => k !== j) })} className="absolute top-1 right-1 p-1 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          {t(lang, 'admin.addImage')}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], i, true)} />
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">{t(lang, 'admin.settings')}</h3>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(lang, 'admin.published')}</span>
              <button onClick={() => setIsPublished(!isPublished)} className={`relative w-12 h-6 rounded-full transition-colors ${isPublished ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isPublished ? 'translate-x-6' : ''}`} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(lang, 'admin.showInMenu')}</span>
              <button onClick={() => setShowInMenu(!showInMenu)} className={`relative w-12 h-6 rounded-full transition-colors ${showInMenu ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showInMenu ? 'translate-x-6' : ''}`} />
              </button>
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(lang, 'admin.showOnHome')}</span>
              <button onClick={() => setShowOnHome(!showOnHome)} className={`relative w-12 h-6 rounded-full transition-colors ${showOnHome ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${showOnHome ? 'translate-x-6' : ''}`} />
              </button>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'admin.sortOrder')}</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className={inputClass} />
            </div>
          </div>

          {/* Featured image */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t(lang, 'admin.featuredImage')}</h3>
            {featuredImageUrl ? (
              <div className="relative group">
                <img src={featuredImageUrl} alt="" className="w-full h-40 object-cover rounded-xl" />
                <button onClick={() => setFeaturedImageUrl('')} className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full h-40 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-sm">{t(lang, 'admin.featuredImage')}</span>
              </div>
            )}
            <label className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer transition-colors">
              {uploading ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              {t(lang, 'admin.uploadImage')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFeaturedUpload(e.target.files[0])} />
            </label>
            <input type="text" value={featuredImageUrl} onChange={(e) => setFeaturedImageUrl(e.target.value)} placeholder="URL" className={`mt-2 ${inputClass}`} />
          </div>
        </div>
      </div>
    </div>
  );
}
