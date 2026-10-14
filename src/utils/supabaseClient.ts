import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScrapedProduct, SupabaseConfig } from '../types';

const STORAGE_KEY_SUPABASE = 'cyber_vacuum_supabase_config';
const STORAGE_KEY_PRODUCTS = 'cyber_vacuum_products_cache';

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    url: '',
    anonKey: '',
    tableName: 'scraped_products',
    isConnected: false,
    autoSync: false,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function getStoredProducts(): ScrapedProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return [];
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function saveStoredProducts(products: ScrapedProduct[], immediate = false) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  };

  if (immediate) {
    persist();
  } else {
    // Non-blocking debounced storage to keep UI at 60fps during intense aspiration
    saveTimeout = setTimeout(persist, 1000);
  }
}

export function clearStoredProducts() {
  try {
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
  } catch {
    // ignore
  }
}

let activeClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabaseClient(config: SupabaseConfig): SupabaseClient | null {
  if (!config.url || !config.anonKey) return null;
  const key = `${config.url}_${config.anonKey}`;
  if (activeClient && currentClientKey === key) {
    return activeClient;
  }
  try {
    activeClient = createClient(config.url, config.anonKey, {
      auth: { persistSession: false },
    });
    currentClientKey = key;
    return activeClient;
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(config: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  if (!config.url || !config.anonKey) {
    return { success: false, message: 'URL ou clé anonyme Supabase manquante.' };
  }
  try {
    const client = getSupabaseClient(config);
    if (!client) {
      return { success: false, message: 'Configuration Supabase invalide.' };
    }
    // Attempt simple read query on the table (limit 1)
    const { error } = await client
      .from(config.tableName || 'scraped_products')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // Relation does not exist
        return {
          success: true,
          message: `Connecté à Supabase ! Note : la table "${config.tableName}" n'existe pas encore. Utilisez le script SQL ci-dessous pour la créer en 1 clic.`,
        };
      }
      return { success: false, message: `Erreur Supabase: ${error.message} (${error.code || 'ERR'})` };
    }

    return { success: true, message: `Connexion établie avec succès à Supabase (Table: ${config.tableName}) !` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur réseau';
    return { success: false, message: `Échec de connexion : ${message}` };
  }
}

export async function syncProductsToSupabase(
  products: ScrapedProduct[],
  config: SupabaseConfig
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!config.url || !config.anonKey) {
    return { success: false, count: 0, error: 'Supabase non configuré.' };
  }
  const client = getSupabaseClient(config);
  if (!client) {
    return { success: false, count: 0, error: 'Impossible d\'initialiser le client Supabase.' };
  }

  try {
    const rows = products.map((p) => ({
      id: p.id,
      title: p.title,
      brand: p.brand || null,
      category: p.category,
      current_price: p.currentPrice,
      original_price: p.originalPrice,
      currency: p.currency,
      discount_percent: p.discountPercent,
      rating: p.rating,
      reviews_count: p.reviewsCount,
      in_stock: p.inStock,
      stock_level: p.stockLevel,
      image_url: p.imageUrl,
      product_url: p.productUrl,
      source_domain: p.sourceDomain,
      price_history: p.priceHistory,
      specs: p.specs || {},
      ai_confidence: p.aiConfidence,
      matrix_hash: p.matrixHash || null,
      scraped_at: p.scrapedAt,
      last_updated: new Date().toISOString(),
    }));

    const { error } = await client
      .from(config.tableName || 'scraped_products')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: rows.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    return { success: false, count: 0, error: message };
  }
}

export function generateSupabaseSqlSchema(tableName = 'scraped_products'): string {
  return `-- -------------------------------------------------------------
-- CYBER-VACUUM // SUPABASE SQL SCHEMA GENERATOR
-- Exécutez ce script dans votre éditeur Supabase SQL
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.${tableName} (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  current_price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  currency VARCHAR(10) DEFAULT '€',
  discount_percent INT DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  in_stock BOOLEAN DEFAULT true,
  stock_level VARCHAR(30) DEFAULT 'IN_STOCK',
  image_url TEXT,
  product_url TEXT,
  source_domain TEXT NOT NULL,
  price_history JSONB DEFAULT '[]'::jsonb,
  specs JSONB DEFAULT '{}'::jsonb,
  ai_confidence NUMERIC(5, 2) DEFAULT 95.0,
  matrix_hash TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour recherche rapide et analytics de prix
CREATE INDEX IF NOT EXISTS idx_${tableName}_category ON public.${tableName}(category);
CREATE INDEX IF NOT EXISTS idx_${tableName}_source ON public.${tableName}(source_domain);
CREATE INDEX IF NOT EXISTS idx_${tableName}_price ON public.${tableName}(current_price);
CREATE INDEX IF NOT EXISTS idx_${tableName}_discount ON public.${tableName}(discount_percent DESC);

-- Sécurité Row Level Security (RLS) permissive pour API Anon Key
ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON public.${tableName}
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert and update"
  ON public.${tableName}
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
`;
}
