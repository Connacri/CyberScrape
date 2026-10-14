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
    url: (import.meta.env.VITE_SUPABASE_URL as string) || '',
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
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

// ========================================================
// PERSISTENT STORAGE ENGINE: INDEXEDDB + LOCALSTORAGE DUAL LAYER
// Solves 5MB QuotaExceededError and prevents loss on page refresh
// ========================================================

const IDB_NAME = 'cyber_vacuum_matrix_db';
const IDB_VERSION = 1;
const IDB_STORE = 'products_store';

function openIndexedDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Loads all scraped products from IndexedDB (supports unlimited items without 5MB quota)
 */
export async function loadStoredProductsFromIndexedDB(): Promise<ScrapedProduct[]> {
  try {
    const db = await openIndexedDb();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = (req.result as ScrapedProduct[]) || [];
          resolve(list);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  } catch {
    return [];
  }
}

/**
 * Synchronous read from LocalStorage for immediate instant hydration on first frame
 */
export function getStoredProducts(): ScrapedProduct[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem('products') || localStorage.getItem(STORAGE_KEY_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return [];
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let latestProductsRef: ScrapedProduct[] | null = null;

function flushProductsSync(products: ScrapedProduct[]) {
  if (typeof window === 'undefined') return;

  // 1. Save to LocalStorage (with quota fallback)
  try {
    const serialized = JSON.stringify(products);
    localStorage.setItem('products', serialized);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, serialized);
  } catch {
    try {
      // If full array exceeds 5MB quota, save the latest 80 items into localStorage
      // while IndexedDB keeps 100% of the entire catalogue!
      const trimmed = products.slice(0, 80);
      const serialized = JSON.stringify(trimmed);
      localStorage.setItem('products', serialized);
      localStorage.setItem(STORAGE_KEY_PRODUCTS, serialized);
    } catch {
      // LocalStorage completely full or blocked; IndexedDB handles persistence
    }
  }

  // 2. Save asynchronously to IndexedDB (virtually unlimited capacity)
  openIndexedDb().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      // Clear and bulk insert
      store.clear().onsuccess = () => {
        for (const item of products) {
          store.put(item);
        }
      };
    } catch {
      // Ignore
    }
  }).catch(() => {});
}

// Hook page unload to flush any pending write immediately so refreshing never loses data
if (typeof window !== 'undefined') {
  const handleUnload = () => {
    if (latestProductsRef) {
      flushProductsSync(latestProductsRef);
    }
  };
  window.addEventListener('beforeunload', handleUnload);
  window.addEventListener('pagehide', handleUnload);
}

export function saveStoredProducts(products: ScrapedProduct[], immediate = false) {
  latestProductsRef = products;

  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  if (immediate) {
    flushProductsSync(products);
  } else {
    // Fast 150ms debounce for high-rate continuous scraping without blocking UI thread
    saveTimeout = setTimeout(() => {
      if (latestProductsRef) {
        flushProductsSync(latestProductsRef);
      }
    }, 150);
  }
}

export function clearStoredProducts() {
  latestProductsRef = [];
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_PRODUCTS);
      localStorage.removeItem('products');
    }
  } catch {
    // ignore
  }

  openIndexedDb().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.clear();
    } catch {
      // ignore
    }
  }).catch(() => {});
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
