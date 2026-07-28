import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Building2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { supabase, type Property } from '@/lib/supabase';
import { t, CURRENCIES, type CurrencyCode } from '@/lib/i18n';
import PropertyCard from '@/components/public/PropertyCard';

export default function PropertiesPage() {
  const { lang, currency } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState('');
  const [listingType, setListingType] = useState<'all' | 'sale' | 'rent'>(
    (searchParams.get('type') as 'sale' | 'rent') || 'all'
  );
  const [propertyType, setPropertyType] = useState<'all' | 'house' | 'apartment' | 'commercial' | 'land'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priceLow' | 'priceHigh'>('newest');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'sale' || type === 'rent') {
      setListingType(type);
    } else {
      setListingType('all');
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from('properties').select('*').eq('is_published', true).eq('status', 'active');
      if (listingType !== 'all') query = query.eq('listing_type', listingType);
      if (propertyType !== 'all') query = query.eq('property_type', propertyType);
      if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else query = query.order('price', { ascending: sortBy === 'priceLow' });

      const { data } = await query;
      setProperties((data as Property[]) || []);
      setLoading(false);
    })();
  }, [listingType, propertyType, sortBy]);

  const filtered = useMemo(() => {
    let result = properties;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => {
        const title = Object.values(p.title).join(' ').toLowerCase();
        const city = p.city?.toLowerCase() || '';
        const district = p.district?.toLowerCase() || '';
        return title.includes(q) || city.includes(q) || district.includes(q);
      });
    }
    if (priceMin || priceMax) {
      const min = priceMin ? parseFloat(priceMin) : 0;
      const max = priceMax ? parseFloat(priceMax) : Infinity;
      result = result.filter((p) => {
        const rate = 1; // prices are in their own currency
        return p.price >= min && p.price <= max;
      });
    }
    return result;
  }, [properties, search, priceMin, priceMax]);

  const resetFilters = () => {
    setSearch('');
    setListingType('all');
    setPropertyType('all');
    setPriceMin('');
    setPriceMax('');
    setSortBy('newest');
    setSearchParams({});
  };

  const propertyTypes = [
    { value: 'all', label: t(lang, 'filter.all') },
    { value: 'house', label: t(lang, 'property.house') },
    { value: 'apartment', label: t(lang, 'property.apartment') },
    { value: 'commercial', label: t(lang, 'property.commercial') },
    { value: 'land', label: t(lang, 'property.land') },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="bg-gradient-to-br from-gray-900 to-primary-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
            {listingType === 'sale' ? t(lang, 'nav.buy') : listingType === 'rent' ? t(lang, 'nav.rent') : t(lang, 'nav.properties')}
          </h1>
          <p className="text-gray-300">{filtered.length} {t(lang, 'filter.results')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & filter bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${t(lang, 'filter.search')}...`}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {t(lang, 'filter.type')}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-5 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">{t(lang, 'filter.newest')}</option>
              <option value="priceLow">{t(lang, 'filter.priceLow')}</option>
              <option value="priceHigh">{t(lang, 'filter.priceHigh')}</option>
            </select>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'admin.listingType')}</label>
                  <div className="flex gap-2">
                    {(['all', 'sale', 'rent'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setListingType(type);
                          if (type === 'all') setSearchParams({});
                          else setSearchParams({ type });
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          listingType === type
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {type === 'all' ? t(lang, 'filter.all') : type === 'sale' ? t(lang, 'property.sale') : t(lang, 'property.rent')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'filter.type')}</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as any)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {propertyTypes.map((pt) => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t(lang, 'filter.priceRange')} ({CURRENCIES[currency].symbol})</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="Min"
                      className="w-1/2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="Max"
                      className="w-1/2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={resetFilters}
                className="mt-4 flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                <X className="w-4 h-4" />
                {t(lang, 'filter.reset')}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden">
                <div className="skeleton h-64" />
                <div className="skeleton h-32" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
            <p className="text-gray-400 text-lg">{t(lang, 'filter.noResults')}</p>
            <button onClick={resetFilters} className="mt-4 text-primary-600 dark:text-primary-400 font-medium hover:underline">
              {t(lang, 'filter.reset')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
