import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, Calendar, Building, Layers, Phone, Mail, MessageCircle, Check, Home, Share2, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { supabase, type Property, type PropertyImage } from '@/lib/supabase';
import { t, getTranslatedValue, formatPrice, type CurrencyCode } from '@/lib/i18n';
import { get2gisSearchLink, get2gisCoordLink, buildAddressQuery } from '@/lib/2gis';
import PropertyCard from '@/components/public/PropertyCard';
import PropertyMap from '@/components/common/PropertyMap';

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, currency, settings } = useApp();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [inquirySent, setInquirySent] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: prop } = await supabase.from('properties').select('*').eq('id', id).maybeSingle();
      if (!prop) { setLoading(false); return; }
      setProperty(prop as Property);

      const { data: imgs } = await supabase.from('property_images').select('*').eq('property_id', id).order('sort_order', { ascending: true });
      setImages((imgs as PropertyImage[]) || []);

      if (prop) {
        const { data: sim } = await supabase
          .from('properties')
          .select('*')
          .eq('is_published', true)
          .eq('status', 'active')
          .eq('property_type', (prop as Property).property_type)
          .neq('id', id)
          .limit(3);
        setSimilar((sim as Property[]) || []);
      }
      setLoading(false);
    })();
  }, [id]);

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryForm.name || !inquiryForm.phone) return;
    await supabase.from('property_inquiries').insert({
      property_id: id,
      name: inquiryForm.name,
      phone: inquiryForm.phone,
      email: inquiryForm.email || null,
      message: inquiryForm.message || null,
      user_id: user?.id || null,
    });
    setInquirySent(true);
    setInquiryForm({ name: '', phone: '', email: '', message: '' });
    setTimeout(() => { setInquirySent(false); setShowInquiry(false); }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg mb-4">{t(lang, 'filter.noResults')}</p>
          <button onClick={() => navigate('/properties')} className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
            {t(lang, 'nav.properties')}
          </button>
        </div>
      </div>
    );
  }

  const allImages = [property.main_image_url, ...images.map((i) => i.image_url)].filter(Boolean) as string[];
  const features: string[] = Array.isArray(property.features) ? property.features : [];

  const specs = [
    property.bedrooms != null && { icon: Bed, label: t(lang, 'property.bedrooms'), value: property.bedrooms },
    property.bathrooms != null && { icon: Bath, label: t(lang, 'property.bathrooms'), value: property.bathrooms },
    { icon: Maximize, label: t(lang, 'property.area'), value: `${property.area} ${t(lang, 'property.area')}` },
    property.land_area != null && { icon: Maximize, label: t(lang, 'property.landArea'), value: `${property.land_area}` },
    property.floor != null && { icon: Layers, label: t(lang, 'property.floor'), value: `${property.floor}/${property.total_floors || ''}` },
    property.year_built != null && { icon: Calendar, label: t(lang, 'property.yearBuilt'), value: property.year_built },
    property.building_type && { icon: Building, label: t(lang, 'admin.propertyType'), value: property.building_type },
  ].filter(Boolean) as { icon: any; label: string; value: any }[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button onClick={() => navigate('/properties')} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t(lang, 'nav.properties')}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <div className="mb-6">
              <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden bg-gray-200 dark:bg-gray-800 group">
                {allImages.length > 0 ? (
                  <img src={allImages[activeImage]} alt={getTranslatedValue(property.title, lang)} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Home className="w-20 h-20" />
                  </div>
                )}
                {property.listing_type === 'sale' && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white bg-primary-600">{t(lang, 'property.sale')}</span>
                )}
                {property.listing_type === 'rent' && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white bg-accent-500">{t(lang, 'property.rent')}</span>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImage === i ? 'border-primary-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & price */}
            <div className="mb-6">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {getTranslatedValue(property.title, lang)}
              </h1>
              {property.city && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-4">
                  <MapPin className="w-5 h-5" />
                  <span>{property.city}{property.district ? `, ${property.district}` : ''}{property.address ? ` — ${property.address}` : ''}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {formatPrice(property.price, property.currency as CurrencyCode, currency, lang)}
                  {property.listing_type === 'rent' && <span className="text-base font-normal text-gray-400">/мес</span>}
                </p>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  property.status === 'active' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' :
                  property.status === 'sold' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {t(lang, `property.status.${property.status}`)}
                </span>
              </div>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {specs.map((spec, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <spec.icon className="w-5 h-5 text-primary-500 mb-2" />
                  <div className="text-sm text-gray-500 dark:text-gray-400">{spec.label}</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{spec.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-gray-800">
              <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-4">{t(lang, 'property.description')}</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {getTranslatedValue(property.description, lang)}
              </p>
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-gray-800">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-4">{t(lang, 'property.features')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            )}

            {/* Location map */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  {t(lang, 'property.location')}
                </h2>
                <a
                  href={property.latitude != null && property.longitude != null
                    ? get2gisCoordLink(property.latitude, property.longitude)
                    : get2gisSearchLink(buildAddressQuery(property.city, property.district, property.address))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  2GIS
                  <MapPin className="w-4 h-4" />
                </a>
              </div>

              {property.latitude != null && property.longitude != null ? (
                <PropertyMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  title={getTranslatedValue(property.title, lang)}
                />
              ) : (
                <div className="w-full h-64 rounded-xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-3">
                  <MapPin className="w-10 h-10 text-gray-400" />
                  <p className="text-gray-500 text-sm text-center px-4">
                    {buildAddressQuery(property.city, property.district, property.address) || (lang === 'ru' ? 'Адрес не указан' : lang === 'en' ? 'Address not specified' : 'Дарек көрсөтүлгөн жок')}
                  </p>
                  <a
                    href={get2gisSearchLink(buildAddressQuery(property.city, property.district, property.address))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline"
                  >
                    {lang === 'ru' ? 'Искать на 2GIS' : lang === 'en' ? 'Search on 2GIS' : '2GIS издөө'}
                  </a>
                </div>
              )}

              {(property.city || property.address) && (
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {buildAddressQuery(property.city, property.district, property.address)}
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Contact card */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-md">
                <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-4">{t(lang, 'property.contact')}</h3>

                {showInquiry ? (
                  inquirySent ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3">
                        <Check className="w-6 h-6 text-primary-600" />
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{t(lang, 'contact.sent')}</p>
                    </div>
                  ) : !user ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6 text-primary-600" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t(lang, 'auth.loginRequired')}</p>
                      <Link to="/auth" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors">
                        {t(lang, 'auth.login')}
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={submitInquiry} className="space-y-3">
                      <input
                        type="text"
                        required
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        placeholder={t(lang, 'contact.name')}
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                      <input
                        type="text"
                        required
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        placeholder={t(lang, 'contact.phone')}
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                      <input
                        type="email"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        placeholder={t(lang, 'contact.email')}
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                      <textarea
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                        placeholder={t(lang, 'contact.message')}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                      />
                      <button type="submit" className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors">
                        {t(lang, 'contact.send')}
                      </button>
                      <button type="button" onClick={() => setShowInquiry(false)} className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        {t(lang, 'admin.cancel')}
                      </button>
                    </form>
                  )
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowInquiry(true)}
                      className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      {t(lang, 'property.contact')}
                    </button>
                    {settings?.phone && (
                      <a href={`tel:${settings.phone}`} className="w-full py-3 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        {settings.phone}
                      </a>
                    )}
                    {settings?.whatsapp && (
                      <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                    )}
                    {settings?.telegram && (
                      <a href={`https://t.me/${settings.telegram}`} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Telegram
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar properties */}
        {similar.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {t(lang, 'property.similar')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
