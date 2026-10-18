import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { OUEDKNISS_CATEGORIES, detectOuedknissCategory } from './src/data/ouedknissCategories.ts';
import { scrapeOuedknissLiveAnnouncements } from './src/server/ouedknissLiveScraper.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Enable CORS for all origins (vital for GitHub Pages at connacri.github.io, APK, PWA)
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// GET /api/ouedkniss/categories
app.get('/api/ouedkniss/categories', (_req: Request, res: Response): void => {
  res.json({ categories: OUEDKNISS_CATEGORIES });
});

/**
 * POST /api/scrape — données RÉELLES uniquement (API GraphQL Ouedkniss).
 * - Aucun repli généré : en cas d'échec => HTTP 502 + message d'erreur (le client réessaie puis échoue explicitement).
 * - Page vide valide => 200, products: [], hasMore:false (vraie fin de catégorie selon l'API).
 * - Aucune note, remise, historique de prix, confiance IA, image de remplacement ni vendeur inventés.
 */
app.post('/api/scrape', async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, maxItems = 28, page = 1, categorySlug } = req.body ?? {};
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      res.status(400).json({ success: false, error: 'URL invalide. Fournissez une URL complète débutant par http:// ou https://' });
      return;
    }
    let domain = '';
    try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
    if (!domain.includes('ouedkniss')) {
      res.status(400).json({ success: false, error: 'Seul ouedkniss.com est supporté (aucune donnée générique n\'est fabriquée).' });
      return;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const count = Math.max(8, Number(maxItems) || 28);
    const parsed = new URL(url);
    const searchKeywords = parsed.searchParams.get('keywords') || parsed.searchParams.get('q') || '';
    const activeCategorySlug: string | undefined = categorySlug || detectOuedknissCategory(url)?.slug;

    const t0 = Date.now();
    const live = await scrapeOuedknissLiveAnnouncements({ categorySlug: activeCategorySlug, keywords: searchKeywords, page: pageNum, count });
    if (!live.success) {
      console.error(`[SCRAPE] échec cat=${activeCategorySlug || 'all'} page=${pageNum} : ${live.error}`);
      res.status(502).json({ success: false, error: live.error || 'Échec de l\'API Ouedkniss', page: pageNum, categorySlug: activeCategorySlug });
      return;
    }

    const nowIso = new Date().toISOString();
    const products = live.products.map((item) => {
      const seller = live.sellers.get(`prod_ouedkniss_${item.id}`);
      const isStore = seller?.type === 'Boutique / Store Certifié';
      const price = Math.round(item.currentPrice);
      return {
        id: `prod_ouedkniss_${item.id}`,
        title: item.title,
        brand: item.brand,
        category: item.category,
        currentPrice: price,
        originalPrice: price, // pas de prix barré fourni par l'API => égal au prix courant, aucune remise inventée
        currency: 'DA',
        discountPercent: 0,
        rating: 0, // inconnu (jamais affiché comme une vraie note)
        reviewsCount: 0,
        inStock: true,
        stockLevel: 'IN_STOCK' as const,
        imageUrl: item.imageUrl,
        images: item.images || [],
        productUrl: item.productUrl,
        sourceDomain: domain,
        scrapedAt: nowIso,
        lastUpdated: nowIso,
        priceHistory: [], // aucun historique inventé
        specs: item.specs || {},
        seller,
        description: item.description,
        publishedDate: item.publishedDate,
        aiConfidence: 0,
        syncedToSupabase: false,
        itemType: (isStore ? 'boutique' : 'annonce') as 'boutique' | 'annonce',
        isOfficialStore: isStore,
      };
    });

    res.json({
      success: true,
      targetUrl: url,
      domain,
      modelUsed: 'OUEDKNISS_GRAPHQL (données réelles)',
      isFallbackMode: false,
      fallbackNotice: null,
      page: pageNum,
      hasMore: live.hasMore,
      totalCatalogEstimated: live.totalEstimated,
      totalCategoryPages: live.lastPage,
      productsCount: products.length,
      products,
      telemetry: { rawHtmlSizeKb: 0, domNodesInspected: 0, tokensProcessed: 0, executionTimeMs: Date.now() - t0 },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur interne lors de l\'aspiration';
    console.error('[SCRAPE] erreur interne :', err);
    res.status(500).json({ success: false, error: message });
  }
});

/**
 * POST /api/supabase/sync — upsert côté serveur avec la clé service_role (jamais exposée au navigateur).
 * Variables : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, (optionnel) SYNC_TOKEN => en-tête x-sync-token.
 */
app.post('/api/supabase/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      res.status(503).json({ success: false, error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY non configurés côté serveur.' });
      return;
    }
    if (process.env.SYNC_TOKEN && req.header('x-sync-token') !== process.env.SYNC_TOKEN) {
      res.status(401).json({ success: false, error: 'Jeton de synchronisation invalide.' });
      return;
    }
    const { tableName = 'scraped_products', rows } = req.body ?? {};
    if (typeof tableName !== 'string' || !/^[a-z_][a-z0-9_]{0,62}$/.test(tableName)) {
      res.status(400).json({ success: false, error: 'Nom de table invalide.' });
      return;
    }
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
      res.status(400).json({ success: false, error: 'rows doit contenir entre 1 et 500 lignes.' });
      return;
    }
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from(tableName).upsert(rows, { onConflict: 'id' });
    if (error) {
      console.error('[SYNC] Supabase :', error.message);
      res.status(500).json({ success: false, error: error.message });
      return;
    }
    res.json({ success: true, count: rows.length });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Erreur de synchronisation' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const fs = await import('fs');
    const vite = await createViteServer({ server: { middlewareMode: true, allowedHosts: true }, appType: 'spa' });
    app.use(vite.middlewares);
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) return next();
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CYBER-VACUUM] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[CYBER-VACUUM] Failed to start server:', err);
});
