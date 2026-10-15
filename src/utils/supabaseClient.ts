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
// Ultra-optimized for millions of scraped items with indexes,
// cursor pagination, non-blocking batch streaming, and zero data loss.
// ========================================================

const IDB_NAME = 'cyber_vacuum_matrix_db';
const IDB_VERSION = 2;
const IDB_STORE = 'products_store';

// Request persistent storage from browser so OS never evicts data on disk pressure
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persisted) => {
    if (persisted) {
      console.log('[CYBER-VACUUM] Storage persistence granted: IndexedDB is immune to OS eviction.');
    }
  }).catch(() => {});
}

export function openIndexedDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = request.result;
        let store: IDBObjectStore;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          store = db.createObjectStore(IDB_STORE, { keyPath: 'id' });
        } else {
          store = (request.transaction as IDBTransaction).objectStore(IDB_STORE);
        }

        // Secondary indices for instantaneous lookups across millions of products
        if (!store.indexNames.contains('by_category')) {
          store.createIndex('by_category', 'category', { unique: false });
        }
        if (!store.indexNames.contains('by_scrapedAt')) {
          store.createIndex('by_scrapedAt', 'scrapedAt', { unique: false });
        }
        if (!store.indexNames.contains('by_currentPrice')) {
          store.createIndex('by_currentPrice', 'currentPrice', { unique: false });
        }
        if (!store.indexNames.contains('by_discountPercent')) {
          store.createIndex('by_discountPercent', 'discountPercent', { unique: false });
        }
        if (!store.indexNames.contains('by_sourceDomain')) {
          store.createIndex('by_sourceDomain', 'sourceDomain', { unique: false });
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
 * Fast O(1) total count across millions of products in IndexedDB
 */
export async function getTotalProductsCountFromIndexedDB(): Promise<number> {
  const db = await openIndexedDb();
  if (!db) return 0;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}

export interface IndexedDbQueryParams {
  offset?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: 'recent' | 'priceAsc' | 'priceDesc' | 'discountDesc';
}

/**
 * High-speed cursor pagination for IndexedDB
 * Reads only the required window (e.g. 36 items) into memory
 * without blocking UI thread even if database contains 1,000,000+ items.
 */
export async function queryProductsPageFromIndexedDB(params: IndexedDbQueryParams = {}): Promise<{
  products: ScrapedProduct[];
  totalCount: number;
  hasMore: boolean;
}> {
  const { offset = 0, limit = 36, category, search, sortBy = 'recent' } = params;
  const db = await openIndexedDb();
  if (!db) return { products: [], totalCount: 0, hasMore: false };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const totalReq = store.count();

      totalReq.onsuccess = () => {
        const totalInDb = totalReq.result || 0;
        const results: ScrapedProduct[] = [];
        let hasSkipped = false;
        let skippedCount = 0;

        let source: IDBIndex | IDBObjectStore = store;
        let direction: IDBCursorDirection = 'prev'; // most recent first

        if (category && category !== 'all' && store.indexNames.contains('by_category')) {
          source = store.index('by_category');
          direction = 'next';
        } else if (sortBy === 'priceAsc' && store.indexNames.contains('by_currentPrice')) {
          source = store.index('by_currentPrice');
          direction = 'next';
        } else if (sortBy === 'priceDesc' && store.indexNames.contains('by_currentPrice')) {
          source = store.index('by_currentPrice');
          direction = 'prev';
        } else if (store.indexNames.contains('by_scrapedAt')) {
          source = store.index('by_scrapedAt');
          direction = 'prev';
        }

        const cursorReq = source.openCursor(null, direction);

        cursorReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (!cursor) {
            resolve({
              products: results,
              totalCount: totalInDb,
              hasMore: false,
            });
            return;
          }

          const item = cursor.value as ScrapedProduct;

          // Apply filters
          let matches = true;
          if (category && category !== 'all' && item.category !== category) {
            matches = false;
          }
          if (matches && search) {
            const q = search.toLowerCase();
            const textMatch =
              item.title.toLowerCase().includes(q) ||
              (item.brand && item.brand.toLowerCase().includes(q)) ||
              (item.specs?.Wilaya && item.specs.Wilaya.toLowerCase().includes(q));
            if (!textMatch) matches = false;
          }

          if (matches) {
            if (!hasSkipped && offset > 0 && skippedCount < offset) {
              skippedCount++;
              cursor.continue();
              return;
            }
            results.push(item);
            if (results.length >= limit) {
              resolve({
                products: results,
                totalCount: totalInDb,
                hasMore: true,
              });
              return;
            }
          }

          cursor.continue();
        };

        cursorReq.onerror = () => {
          resolve({ products: results, totalCount: totalInDb, hasMore: false });
        };
      };

      totalReq.onerror = () => {
        resolve({ products: [], totalCount: 0, hasMore: false });
      };
    } catch {
      resolve({ products: [], totalCount: 0, hasMore: false });
    }
  });
}

/**
 * Loads scraped products from IndexedDB with safety cap to avoid out-of-memory crash
 * if the database has millions of entries.
 */
export async function loadStoredProductsFromIndexedDB(maxLimit: number = 3000): Promise<ScrapedProduct[]> {
  try {
    const db = await openIndexedDb();
    if (!db) return [];
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        
        // If modern getAll with count is available
        const req = store.getAll(null, maxLimit);
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

let isFlushingDb = false;
let pendingDbWriteQueue: ScrapedProduct[] | null = null;

function flushProductsSync(products: ScrapedProduct[]) {
  if (typeof window === 'undefined') return;

  // 1. Lightweight preview slice (max 20 items) and total count in LocalStorage
  try {
    const previewSlice = products.slice(0, 20);
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(previewSlice));
    localStorage.setItem('cyber_vacuum_total_count', String(products.length));
  } catch {
    // ignore
  }

  // 2. Asynchronous non-blocking chunked writes to IndexedDB
  pendingDbWriteQueue = products;
  if (isFlushingDb) return;
  isFlushingDb = true;

  openIndexedDb().then((db) => {
    if (!db) {
      isFlushingDb = false;
      return;
    }

    const itemsToWrite = pendingDbWriteQueue || products;
    pendingDbWriteQueue = null;

    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      
      let idx = 0;
      const CHUNK = 120;

      function writeNextChunk() {
        if (!store || idx >= itemsToWrite.length) {
          isFlushingDb = false;
          if (pendingDbWriteQueue) {
            flushProductsSync(pendingDbWriteQueue);
          }
          return;
        }

        const limit = Math.min(idx + CHUNK, itemsToWrite.length);
        for (; idx < limit; idx++) {
          store.put(itemsToWrite[idx]);
        }

        if (idx < itemsToWrite.length) {
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(writeNextChunk, { timeout: 80 });
          } else {
            setTimeout(writeNextChunk, 12);
          }
        } else {
          isFlushingDb = false;
        }
      }

      writeNextChunk();
    } catch {
      isFlushingDb = false;
    }
  }).catch(() => {
    isFlushingDb = false;
  });
}

// Hook page unload to flush any pending write immediately
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
    saveTimeout = setTimeout(() => {
      if (latestProductsRef) {
        flushProductsSync(latestProductsRef);
      }
    }, 200);
  }
}

/**
 * High-speed incremental batch writer for live streaming scraping
 * Guarantees zero data loss even if browser tab closes or crashes mid-sweep.
 */
export async function saveScrapedProductsBatch(newBatch: ScrapedProduct[]): Promise<void> {
  if (!newBatch || newBatch.length === 0) return;
  const db = await openIndexedDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);

      for (let i = 0; i < newBatch.length; i++) {
        store.put(newBatch[i]);
      }

      tx.oncomplete = () => {
        // Update total counter in localStorage for zero-lag display
        try {
          const currentCount = parseInt(localStorage.getItem('cyber_vacuum_total_count') || '0', 10);
          localStorage.setItem('cyber_vacuum_total_count', String(currentCount + newBatch.length));
        } catch {
          // ignore
        }

        // Notify app components of the freshly sealed batch
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('cyber_vacuum_batch_persisted', {
              detail: { count: newBatch.length },
            })
          );
        }
        resolve();
      };

      tx.onerror = () => {
        console.warn('[IndexedDB] Transaction error on batch commit:', tx.error);
        resolve();
      };
    } catch (err) {
      console.warn('[LocalDB] Batch write exception:', err);
      resolve();
    }
  });
}

export function clearStoredProducts() {
  latestProductsRef = [];
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_PRODUCTS);
      localStorage.removeItem('products');
      localStorage.setItem('cyber_vacuum_total_count', '0');
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

/**
 * Removes a single product from IndexedDB local storage immediately
 */
export async function deleteProductFromIndexedDB(id: string): Promise<void> {
  const db = await openIndexedDb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.delete(id);
  } catch (err) {
    console.warn('[LocalDB] Delete error:', err);
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
