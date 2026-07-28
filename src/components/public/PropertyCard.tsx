import { Link } from 'react-router-dom';
import { Bed, Bath, Maximize, MapPin, Heart, Home } from 'lucide-react';
import type { Property } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { t, getTranslatedValue, formatPrice, type CurrencyCode } from '@/lib/i18n';

export default function PropertyCard({ property }: { property: Property }) {
  const { lang, currency } = useApp();

  const statusColors: Record<string, string> = {
    active: 'bg-primary-500',
    sold: 'bg-red-500',
    rented: 'bg-amber-500',
    draft: 'bg-gray-500',
  };

  const typeBadge = property.listing_type === 'sale'
    ? t(lang, 'property.sale')
    : t(lang, 'property.rent');

  const propertyTypeLabel: Record<string, string> = {
    house: t(lang, 'property.house'),
    apartment: t(lang, 'property.apartment'),
    commercial: t(lang, 'property.commercial'),
    land: t(lang, 'property.land'),
  };

  return (
    <Link
      to={`/properties/${property.id}`}
      className="group block bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 dark:border-gray-800"
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        {property.main_image_url ? (
          <img
            src={property.main_image_url}
            alt={getTranslatedValue(property.title, lang)}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <Home className="w-16 h-16 text-primary-300 dark:text-gray-600" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${statusColors[property.status] || 'bg-primary-500'}`}>
            {t(lang, `property.status.${property.status}`)}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-gray-900/80 backdrop-blur-sm">
            {typeBadge}
          </span>
        </div>

        {property.is_featured && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-accent-500 shadow-lg flex items-center gap-1">
              <Heart className="w-3 h-3 fill-white" />
              {t(lang, 'admin.featured')}
            </span>
          </div>
        )}

        {/* Price overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 z-10">
          <p className="text-white text-xl font-bold">
            {formatPrice(property.price, property.currency as CurrencyCode, currency, lang)}
            {property.listing_type === 'rent' && (
              <span className="text-sm font-normal text-gray-200">/мес</span>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
            {propertyTypeLabel[property.property_type]}
          </span>
        </div>
        <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {getTranslatedValue(property.title, lang)}
        </h3>

        {property.city && (
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{property.city}{property.district ? `, ${property.district}` : ''}</span>
          </div>
        )}

        {/* Specs */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
          {property.bedrooms != null && (
            <div className="flex items-center gap-1">
              <Bed className="w-4 h-4 text-primary-500" />
              <span>{property.bedrooms} {t(lang, 'property.bedrooms')}</span>
            </div>
          )}
          {property.bathrooms != null && (
            <div className="flex items-center gap-1">
              <Bath className="w-4 h-4 text-primary-500" />
              <span>{property.bathrooms} {t(lang, 'property.bathrooms')}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Maximize className="w-4 h-4 text-primary-500" />
            <span>{property.area} {t(lang, 'property.area')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
