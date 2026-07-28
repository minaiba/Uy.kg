// 2GIS helper utilities for generating map links and embeds

/**
 * Generate a 2GIS search link for a given address query.
 * Example: https://2gis.kg/bishkek/search/Бишкек, ул. Чуй, 95
 */
export function get2gisSearchLink(query: string): string {
  const encoded = encodeURIComponent(query);
  return `https://2gis.kg/bishkek/search/${encoded}`;
}

/**
 * Generate a 2GIS link for exact coordinates.
 * Example: https://2gis.kg/bishkek/geo/74.5698,42.8746
 */
export function get2gisCoordLink(lat: number, lng: number): string {
  return `https://2gis.kg/bishkek/geo/${lng},${lat}`;
}

/**
 * Generate a 2GIS card link for a firm/organization by query.
 */
export function get2gisCardLink(query: string): string {
  const encoded = encodeURIComponent(query);
  return `https://2gis.kg/bishkek/search/${encoded}/tab%2Fresults`;
}

/**
 * Build a full address query string from property fields.
 */
export function buildAddressQuery(city?: string | null, district?: string | null, address?: string | null): string {
  const parts = [city, district, address].filter(Boolean);
  return parts.join(', ');
}
