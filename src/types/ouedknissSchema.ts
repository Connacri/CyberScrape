/**
 * SOURCE UNIQUE DE VÉRITÉ : SCHÉMA SUPABASE & MODÈLES OUEDKNISS
 * Définit colonne par colonne la structure PostgreSQL, TypeScript et Dart.
 * Strictement aligné sur supabase/migrations/001_ouedkniss.sql
 */

export interface CategoryRow {
  slug: string;
  name_fr: string;
  name_ar: string;
  parent_slug: string | null;
  icon: string | null;
  site_count: number;
  created_at: string;
  updated_at: string;
}

export type SellerContactSource =
  | 'announcement_graphql'
  | 'user_graphql'
  | 'store_graphql'
  | 'description_regex';

export interface SellerPhone {
  number: string;
  has_whatsapp: boolean;
  has_viber: boolean;
  source: SellerContactSource;
}

export interface SellerRow {
  id: string; // UUID
  source_id: string; // ID source d'origine
  type: 'user' | 'store' | 'unknown';
  name: string | null;
  store_slug: string | null;
  profile_url: string | null;
  wilaya: string | null;
  commune: string | null;
  address: string | null;
  emails: string[] | null;
  phones: SellerPhone[];
  contacts_status: 'ok' | 'none' | 'failed';
  raw: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface ListingRow {
  id: string; // UUID
  source_id: string; // ID source d'origine Ouedkniss
  url: string;
  url_encoded: string;
  title: string;
  description: string | null;
  price: number | null;
  price_raw: string | null;
  price_unit: string | null;
  currency: string;
  negotiable: boolean | null;
  category_id: string | null;
  seller_id: string | null;
  region: string | null;
  city: string | null;
  published_at: string | null;
  refreshed_at: string | null;
  is_store: boolean;
  is_promo: boolean;
  is_flash: boolean;
  is_sponsored: boolean;
  is_urgent: boolean;
  specs: Record<string, any>;
  raw: Record<string, any> | null;
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

export interface ListingImageRow {
  id: string;
  listing_id: string;
  url: string;
  position: number;
  verified_at: string | null;
  is_broken: boolean;
  created_at: string;
}

export interface ListingSimilarRow {
  listing_id: string;
  similar_source_id: string;
  created_at: string;
}

export interface ListingPriceHistoryRow {
  id: string;
  listing_id: string;
  price: number;
  recorded_at: string;
  note: string | null;
}

export interface ScrapeCheckpointRow {
  id: string;
  category_slug: string;
  wilaya_id: string | null;
  filter_json: Record<string, any>;
  page: number;
  cursor: string | null;
  last_source_id: string | null;
  status: 'running' | 'paused' | 'completed' | 'error';
  scraped_count: number;
  error_count: number;
  created_at: string;
  updated_at: string;
}

export interface ScrapeErrorRow {
  id: string;
  source_id: string | null;
  url: string | null;
  category_slug: string | null;
  page: number | null;
  error_type: string;
  message: string;
  payload: Record<string, any>;
  created_at: string;
}

/**
 * Schéma déclaratif colonne par colonne servant de contrat d'intégrité
 */
export const OUEDKNISS_SCHEMA_CONTRACT = {
  categories: [
    'slug',
    'name_fr',
    'name_ar',
    'parent_slug',
    'icon',
    'site_count',
    'created_at',
    'updated_at',
  ],
  sellers: [
    'id',
    'source_id',
    'type',
    'name',
    'store_slug',
    'profile_url',
    'wilaya',
    'commune',
    'address',
    'emails',
    'phones',
    'contacts_status',
    'raw',
    'created_at',
    'updated_at',
  ],
  listings: [
    'id',
    'source_id',
    'url',
    'url_encoded',
    'title',
    'description',
    'price',
    'price_raw',
    'price_unit',
    'currency',
    'negotiable',
    'category_id',
    'seller_id',
    'region',
    'city',
    'published_at',
    'refreshed_at',
    'is_store',
    'is_promo',
    'is_flash',
    'is_sponsored',
    'is_urgent',
    'specs',
    'raw',
    'scraped_at',
    'created_at',
    'updated_at',
  ],
  listing_images: [
    'id',
    'listing_id',
    'url',
    'position',
    'verified_at',
    'is_broken',
    'created_at',
  ],
  listing_similars: [
    'listing_id',
    'similar_source_id',
    'created_at',
  ],
  listing_price_history: [
    'id',
    'listing_id',
    'price',
    'recorded_at',
    'note',
  ],
  scrape_checkpoints: [
    'id',
    'category_slug',
    'wilaya_id',
    'filter_json',
    'page',
    'cursor',
    'last_source_id',
    'status',
    'scraped_count',
    'error_count',
    'created_at',
    'updated_at',
  ],
  scrape_errors: [
    'id',
    'source_id',
    'url',
    'category_slug',
    'page',
    'error_type',
    'message',
    'payload',
    'created_at',
  ],
} as const;
