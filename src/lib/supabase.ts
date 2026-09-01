import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'estate-admin-auth',
  },
});

export type SiteSettings = {
  id: string;
  site_name: string;
  logo_url: string | null;
  show_site_name: boolean;
  hero_title: Record<string, string>;
  hero_subtitle: Record<string, string>;
  hero_image_url: string | null;
  hero_video_url: string | null;
  phone: string | null;
  email: string | null;
  address: Record<string, string>;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  telegram: string | null;
  footer_text: Record<string, string>;
  default_currency: string;
  about_text: Record<string, string> | null;
  working_hours: Record<string, string>;
  about_stats: { icon: string; value: string; label: Record<string, string> }[] | null;
  about_features: Record<string, string[]> | null;
  social_links: { platform: string; label: string; url: string; icon: string }[] | null;
  updated_at: string;
};

export type Page = {
  id: string;
  slug: string;
  title: Record<string, string>;
  content: Record<string, any>;
  excerpt: Record<string, string> | null;
  featured_image_url: string | null;
  is_published: boolean;
  show_in_menu: boolean;
  show_on_home: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  price: number;
  currency: string;
  listing_type: 'sale' | 'rent';
  property_type: 'house' | 'apartment' | 'commercial' | 'land';
  status: 'active' | 'sold' | 'rented' | 'draft';
  location: Record<string, any>;
  address: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number;
  land_area: number | null;
  floor: number | null;
  total_floors: number | null;
  building_type: string | null;
  year_built: number | null;
  features: string[];
  is_featured: boolean;
  is_published: boolean;
  main_image_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PropertyImage = {
  id: string;
  property_id: string;
  image_url: string;
  caption: Record<string, string> | null;
  sort_order: number;
  created_at: string;
};

export type TelegramSubscriber = {
  id: string;
  chat_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  language_code: string | null;
  is_active: boolean;
  subscribed_at: string;
  bot_language: string;
  bot_state: string | null;
};

export type PropertyInquiry = {
  id: string;
  property_id: string | null;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  created_at: string;
};
