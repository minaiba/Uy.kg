import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Upload, Star, X, MapPin, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type Property, type PropertyImage, type PropertyPrivate } from '@/lib/supabase';
import { t, LANGS, type Lang, type CurrencyCode, CURRENCIES } from '@/lib/i18n';
import MapPicker from '@/components/common/MapPicker';
import { get2gisSearchLink, buildAddressQuery } from '@/lib/2gis';

type MultiLangField = Record<Lang, string>;

function emptyMultiLang(): MultiLangField {
  return { ru: '', en: '', kg: '' };
}

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all";

function MLInput({ label, value, onChange, textarea }: { label: string; value: MultiLangField; onChange: (v: MultiLangField) => void; textarea?: boolean }) {
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

export default function AdminPropertyEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang } = useApp();
  const [searchParams] = useSearchParams();
  const isNew = !id || id === 'new';

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: emptyMultiLang() as MultiLangField,
    description: emptyMultiLang() as MultiLangField,
    price: 0,
    currency: 'KGS' as CurrencyCode,
    listing_type: 'sale' as 'sale' | 'rent',
    property_type: 'apartment' as 'house' | 'apartment' | 'commercial' | 'land' | 'dacha' | 'cottage' | 'townhouse' | 'office' | 'warehouse' | 'industrial',
    status: 'active' as 'active' | 'sold' | 'rented' | 'draft',
    address: '',
    city: '',
    district: '',
    bedrooms: '' as string | number,
    bathrooms: '' as string | number,
    area: '' as string | number,
    land_area: '' as string | number,
    floor: '' as string | number,
    total_floors: '' as string | number,
    year_built: '' as string | number,
    building_type: '',
    features: [] as string[],
    is_featured: false,
    is_published: true,
    moderation_status: 'approved' as 'pending' | 'approved' | 'rejected',
    main_image_url: '',
    latitude: null as number | null,
    longitude: null as number | null,
    admin_comment: '',
    owner_phone: '',
    hand_price: '',
  });
  const [privateLoaded, setPrivateLoaded] = useState(false);

  const [featuresText, setFeaturesText] = useState('');
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (isNew) {
      const type = searchParams.get('type');
      if (type) setForm((prev) => ({ ...prev, property_type: type as any }));
      return;
    }
    if (id) {
      (async () => {
        const { data: prop } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
        if (prop) {
          const p = prop as Property;
          setForm((prev) => ({
            title: (p.title as MultiLangField) || emptyMultiLang(),
            description: (p.description as MultiLangField) || emptyMultiLang(),
            price: p.price,
            currency: p.currency as CurrencyCode,
            listing_type: p.listing_type,
            property_type: p.property_type,
            status: p.status,
            address: p.address || '',
            city: p.city || '',
            district: p.district || '',
            bedrooms: p.bedrooms ?? '',
            bathrooms: p.bathrooms ?? '',
            area: p.area ?? '',
            land_area: p.land_area ?? '',
            floor: p.floor ?? '',
            total_floors: p.total_floors ?? '',
            year_built: p.year_built ?? '',
            building_type: p.building_type || '',
            features: Array.isArray(p.features) ? p.features : [],
            is_featured: p.is_featured,
            is_published: p.is_published,
            moderation_status: (p as any).moderation_status || 'approved',
            main_image_url: p.main_image_url || '',
            latitude: p.latitude,
            longitude: p.longitude,
            admin_comment: prev.admin_comment,
            owner_phone: prev.owner_phone,
            hand_price: prev.hand_price,
          }));
          setFeaturesText((Array.isArray(p.features) ? p.features : []).join(', '));
        }
        const { data: imgs } = await supabase.from('property_images').select('*').eq('property_id', id).order('sort_order', { ascending: true });
        setImages((imgs as PropertyImage[]) || []);
        // Load private author-only fields
        const { data: priv } = await supabase.from('property_private').select('*').eq('property_id', id).maybeSingle();
        if (priv) {
          const pp = priv as PropertyPrivate;
          setForm((prev) => ({ ...prev, admin_comment: pp.admin_comment || '', owner_phone: pp.owner_phone || '', hand_price: pp.hand_price || '' }));
        }
        setPrivateLoaded(true);
      })();
    }
  }, [id, isNew]);

  const handleUpload = async (file: File, field: 'main' | 'gallery') => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('property-images').upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName);
      const url = urlData.publicUrl;
      if (field === 'main') {
        setForm({ ...form, main_image_url: url });
      } else if (field === 'gallery' && id) {
        await supabase.from('property_images').insert({ property_id: id, image_url: url, sort_order: images.length });
        const { data: imgs } = await supabase.from('property_images').select('*').eq('property_id', id).order('sort_order', { ascending: true });
        setImages((imgs as PropertyImage[]) || []);
      } else if (field === 'gallery' && !id) {
        // Store in form for later
        setNewImageUrl(url);
      }
    }
    setUploading(false);
  };

  const addGalleryUrl = async () => {
    if (!newImageUrl) return;
    if (id) {
      await supabase.from('property_images').insert({ property_id: id, image_url: newImageUrl, sort_order: images.length });
      const { data: imgs } = await supabase.from('property_images').select('*').eq('property_id', id).order('sort_order', { ascending: true });
      setImages((imgs as PropertyImage[]) || []);
    }
    setNewImageUrl('');
  };

  const deleteImage = async (imageId: string) => {
    await supabase.from('property_images').delete().eq('id', imageId);
    if (id) {
      const { data: imgs } = await supabase.from('property_images').select('*').eq('property_id', id).order('sort_order', { ascending: true });
      setImages((imgs as PropertyImage[]) || []);
    }
  };

  const save = async () => {
    setSaving(true);
    const features = featuresText.split(',').map((f) => f.trim()).filter(Boolean);
    const payload = {
      title: form.title,
      description: form.description,
      price: parseFloat(String(form.price)) || 0,
      currency: form.currency,
      listing_type: form.listing_type,
      property_type: form.property_type,
      status: form.status,
      address: form.address || null,
      city: form.city || null,
      district: form.district || null,
      bedrooms: form.bedrooms !== '' ? parseInt(String(form.bedrooms)) : null,
      bathrooms: form.bathrooms !== '' ? parseInt(String(form.bathrooms)) : null,
      area: parseFloat(String(form.area)) || 0,
      land_area: form.land_area !== '' ? parseFloat(String(form.land_area)) : null,
      floor: form.floor !== '' ? parseInt(String(form.floor)) : null,
      total_floors: form.total_floors !== '' ? parseInt(String(form.total_floors)) : null,
      year_built: form.year_built !== '' ? parseInt(String(form.year_built)) : null,
      building_type: form.building_type || null,
      features,
      is_featured: form.is_featured,
      is_published: form.is_published,
      moderation_status: form.moderation_status,
      main_image_url: form.main_image_url || null,
      latitude: form.latitude,
      longitude: form.longitude,
    };

    let propertyId = id;
    if (isNew) {
      const { data, error } = await supabase.from('properties').insert(payload).select().single();
      if (!error && data) {
        propertyId = data.id;
      }
    } else {
      await supabase.from('properties').update(payload).eq('id', id!);
    }

    // Save pending gallery image
    if (newImageUrl && propertyId) {
      await supabase.from('property_images').insert({ property_id: propertyId, image_url: newImageUrl, sort_order: images.length });
    }

    // Save private author-only fields
    if (propertyId) {
      const privPayload = {
        property_id: propertyId,
        admin_comment: form.admin_comment || '',
        owner_phone: form.owner_phone || '',
        hand_price: form.hand_price || '',
        updated_at: new Date().toISOString(),
      };
      if (privateLoaded) {
        await supabase.from('property_private').update(privPayload).eq('property_id', propertyId);
      } else {
        const { data: existing } = await supabase.from('property_private').select('id').eq('property_id', propertyId).maybeSingle();
        if (existing) {
          await supabase.from('property_private').update(privPayload).eq('property_id', propertyId);
        } else {
          await supabase.from('property_private').insert({ ...privPayload, created_by: (await supabase.auth.getUser()).data.user?.id });
        }
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (isNew && propertyId) {
      const fromDashboard = window.location.pathname.startsWith('/dashboard/');
      navigate(fromDashboard ? `/dashboard/edit/${propertyId}` : `/admin/properties/${propertyId}`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={window.location.pathname.startsWith('/dashboard/') ? '/dashboard' : '/admin/properties'} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            {isNew ? t(lang, 'admin.newProperty') : t(lang, 'admin.editProperty')}
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
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5">
            <MLInput label={t(lang, 'admin.title')} value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <MLInput label={t(lang, 'admin.description')} value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label={t(lang, 'admin.price')}>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </Field>
              <Field label={t(lang, 'admin.currency')}>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as CurrencyCode })} className={inputClass}>
                  {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label={t(lang, 'admin.listingType')}>
                <select value={form.listing_type} onChange={(e) => setForm({ ...form, listing_type: e.target.value as any })} className={inputClass}>
                  <option value="sale">{t(lang, 'property.sale')}</option>
                  <option value="rent">{t(lang, 'property.rent')}</option>
                </select>
              </Field>
              <Field label={t(lang, 'admin.propertyType')}>
                <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value as any })} className={inputClass}>
                  <option value="house">{t(lang, 'property.house')}</option>
                  <option value="apartment">{t(lang, 'property.apartment')}</option>
                  <option value="commercial">{t(lang, 'property.commercial')}</option>
                  <option value="land">{t(lang, 'property.land')}</option>
                  <option value="dacha">{lang === 'ru' ? 'Дача' : lang === 'en' ? 'Dacha' : 'Дача'}</option>
                  <option value="cottage">{lang === 'ru' ? 'Коттедж' : lang === 'en' ? 'Cottage' : 'Коттедж'}</option>
                  <option value="townhouse">{lang === 'ru' ? 'Таунхаус' : lang === 'en' ? 'Townhouse' : 'Таунхаус'}</option>
                  <option value="office">{lang === 'ru' ? 'Офис' : lang === 'en' ? 'Office' : 'Офис'}</option>
                  <option value="warehouse">{lang === 'ru' ? 'Склад' : lang === 'en' ? 'Warehouse' : 'Склад'}</option>
                  <option value="industrial">{lang === 'ru' ? 'Производство' : lang === 'en' ? 'Industrial' : 'Өндүрүш'}</option>
                </select>
              </Field>
              <Field label={t(lang, 'admin.status')}>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className={inputClass}>
                  <option value="active">{t(lang, 'property.status.active')}</option>
                  <option value="sold">{t(lang, 'property.status.sold')}</option>
                  <option value="rented">{t(lang, 'property.status.rented')}</option>
                  <option value="draft">Draft</option>
                </select>
              </Field>
              <Field label={t(lang, 'admin.area')}>
                <input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Field label={t(lang, 'admin.bedrooms')}>
                <input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t(lang, 'admin.bathrooms')}>
                <input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t(lang, 'admin.floor')}>
                <input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t(lang, 'admin.totalFloors')}>
                <input type="number" value={form.total_floors} onChange={(e) => setForm({ ...form, total_floors: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t(lang, 'admin.landArea')}>
                <input type="number" value={form.land_area} onChange={(e) => setForm({ ...form, land_area: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t(lang, 'admin.yearBuilt')}>
                <input type="number" value={form.year_built} onChange={(e) => setForm({ ...form, year_built: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t(lang, 'admin.city')}>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
              </Field>
              <Field label={t(lang, 'admin.district')}>
                <input type="text" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={inputClass} />
              </Field>
            </div>

            <Field label={t(lang, 'admin.address')}>
              <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
            </Field>

            <Field label={t(lang, 'admin.features')}>
              <input type="text" value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder="Парковка, Лифт, Балкон, ..." className={inputClass} />
            </Field>
          </div>

          {/* Map picker */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                {t(lang, 'property.location')}
              </h3>
              <a
                href={get2gisSearchLink(buildAddressQuery(form.city, form.district, form.address) || 'Бишкек')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                2GIS
                <MapPin className="w-3.5 h-3.5" />
              </a>
            </div>
            <p className="text-xs text-gray-500">{lang === 'ru' ? 'Кликните на карте, чтобы установить точный адрес объекта' : lang === 'en' ? 'Click on the map to set the exact property location' : 'Объекттин так дарегин коюу үчүн картага басыңыз'}</p>
            <MapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) => setForm({ ...form, latitude: lat, longitude: lng })}
            />
            {(form.latitude != null && form.longitude != null) && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</span>
                <button
                  onClick={() => setForm({ ...form, latitude: null, longitude: null })}
                  className="text-xs text-red-500 hover:underline"
                >
                  {t(lang, 'admin.delete')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Main image */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t(lang, 'admin.mainImage')}</h3>
            {form.main_image_url ? (
              <div className="relative group">
                <img src={form.main_image_url} alt="" className="w-full h-48 object-cover rounded-xl" />
                <button
                  onClick={() => setForm({ ...form, main_image_url: '' })}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full h-48 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <span className="text-gray-400 text-sm">{t(lang, 'admin.mainImage')}</span>
              </div>
            )}
            <label className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer transition-colors">
              {uploading ? <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-600 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              {t(lang, 'admin.uploadImage')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'main')} />
            </label>
            <input type="text" value={form.main_image_url} onChange={(e) => setForm({ ...form, main_image_url: e.target.value })} placeholder="URL" className={`mt-2 ${inputClass}`} />
          </div>

          {/* Gallery */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t(lang, 'admin.images')}</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img src={img.image_url} alt="" className="w-full h-20 object-cover rounded-lg" />
                  <button onClick={() => deleteImage(img.id)} className="absolute top-1 right-1 p-1 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              {t(lang, 'admin.uploadImage')}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'gallery')} />
            </label>
            <div className="flex gap-2 mt-2">
              <input type="text" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} placeholder="URL" className={`flex-1 ${inputClass}`} />
              <button onClick={addGalleryUrl} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Flags */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Star className="w-4 h-4 text-accent-500" />
                {t(lang, 'admin.featured')}
              </span>
              <button
                onClick={() => setForm({ ...form, is_featured: !form.is_featured })}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_featured ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_featured ? 'translate-x-6' : ''}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t(lang, 'admin.published')}</span>
              <button
                onClick={() => setForm({ ...form, is_published: !form.is_published })}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_published ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_published ? 'translate-x-6' : ''}`} />
              </button>
            </label>
            <Field label={lang === 'ru' ? 'Статус модерации' : lang === 'en' ? 'Moderation status' : 'Модерация статусу'}>
              <select value={form.moderation_status} onChange={(e) => setForm({ ...form, moderation_status: e.target.value as any })} className={inputClass}>
                <option value="approved">{lang === 'ru' ? 'Одобрено' : lang === 'en' ? 'Approved' : 'Бекитилди'}</option>
                <option value="pending">{lang === 'ru' ? 'На модерации' : lang === 'en' ? 'Pending' : 'Күтүүдө'}</option>
                <option value="rejected">{lang === 'ru' ? 'Отклонено' : lang === 'en' ? 'Rejected' : 'Реджект'}</option>
              </select>
            </Field>
          </div>

          {/* Private author-only fields */}
          <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-6 border border-amber-200 dark:border-amber-800 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                {lang === 'ru' ? 'Приватные поля (только для автора)' : lang === 'en' ? 'Private fields (author only)' : 'Жеке талаалар (автор гана)'}
              </h3>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-500">
              {lang === 'ru' ? 'Эти поля видны только вам. Другие пользователи их не увидят.' : lang === 'en' ? 'These fields are visible only to you. Other users will not see them.' : 'Бул талаалар силге гана көрүнөт. Башка колдонуучулар көрбөйт.'}
            </p>
            <Field label={lang === 'ru' ? 'Админский комментарий' : lang === 'en' ? 'Admin comment' : 'Админ комментарий'}>
              <textarea
                value={form.admin_comment}
                onChange={(e) => setForm({ ...form, admin_comment: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm resize-none transition-all"
                placeholder={lang === 'ru' ? 'Внутренний комментарий...' : lang === 'en' ? 'Internal note...' : 'Ички эскертүү...'}
              />
            </Field>
            <Field label={lang === 'ru' ? 'Номер телефона собственника' : lang === 'en' ? 'Owner phone number' : 'Ээсинин телефон номери'}>
              <input
                type="text"
                value={form.owner_phone}
                onChange={(e) => setForm({ ...form, owner_phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-all"
                placeholder="+996..."
              />
            </Field>
            <Field label={lang === 'ru' ? 'Цена на руки' : lang === 'en' ? 'Hand price' : 'Кол баасы'}>
              <input
                type="text"
                value={form.hand_price}
                onChange={(e) => setForm({ ...form, hand_price: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition-all"
                placeholder={lang === 'ru' ? 'Фактическая цена...' : lang === 'en' ? 'Actual price...' : 'Чыныгы баа...'}
              />
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
