/**
 * CYBER-VACUUM // Client du moteur d'aspiration.
 * RÈGLE : le navigateur n'invente RIEN. L'ancien repli `runClientSideScraper` (qui générait de fausses
 * annonces Ouedkniss dès qu'une requête échouait, puis « définitivement » via isServerAvailable) est supprimé.
 * Erreur réseau / HTTP => retries avec backoff, puis ScrapeError. Réponse vide valide => liste vide (+ hasMore:false).
 */
import type { ScrapedProduct } from '../types';
import { telemetryTracker } from './telemetryTracker';
import { scrapeOuedknissLiveAnnouncements } from '../server/ouedknissLiveScraper';
import { detectOuedknissCategory } from '../data/ouedknissCategories';

export interface ScrapeRequestParams {
  url: string;
  maxItems?: number;
  engineMode?: 'direct' | 'ai';
  page?: number;
  categorySlug?: string | null;
  targetTypeFilter?: 'all' | 'boutique' | 'annonce' | 'pub';
}

export interface ScrapeResultResponse {
  success: boolean;
  targetUrl: string;
  domain: string;
  modelUsed: string;
  isFallbackMode: boolean;
  isClientSideFallback?: boolean;
  fallbackNotice?: string | null;
  page: number;
  hasMore: boolean;
  totalCatalogEstimated: number;
  totalCategoryPages?: number;
  productsCount: number;
  products: ScrapedProduct[];
  telemetry?: { rawHtmlSizeKb: number; domNodesInspected: number; tokensProcessed: number; executionTimeMs: number };
}

export class ScrapeError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'ScrapeError';
  }
}

export function getCustomBackendUrl(): string {
  try {
    return localStorage.getItem('cyber_backend_url') || '';
  } catch {
    return '';
  }
}

export function setCustomBackendUrl(url: string): void {
  try {
    if (url) {
      localStorage.setItem('cyber_backend_url', url.trim());
    } else {
      localStorage.removeItem('cyber_backend_url');
    }
  } catch {
    // ignore
  }
}

export function isStaticHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname || '';
  const proto = window.location.protocol || '';
  return (
    host.includes('github.io') ||
    host.includes('androidplatform.net') ||
    proto === 'file:'
  );
}

function getApiEndpoint(route: string): string {
  const custom = getCustomBackendUrl();
  if (custom) {
    return `${custom.replace(/\/+$/, '')}/${route.replace(/^\//, '')}`;
  }

  const base = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string; BASE_URL?: string } }).env;
  if (base?.VITE_API_BASE_URL) {
    return `${base.VITE_API_BASE_URL.replace(/\/+$/, '')}/${route.replace(/^\//, '')}`;
  }

  const root = (base?.BASE_URL || '/').replace(/\/?$/, '/');
  return `${root}${route.replace(/^\//, '')}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 12000; // 12s max par tentative avec AbortController individuel anti-gel

/**
 * Aspiration directe côté client via l'API GraphQL publique Ouedkniss.
 * L'API Ouedkniss autorise 'Access-Control-Allow-Origin: *', ce qui permet
 * à l'APK Android (WebView) et à GitHub Pages de fonctionner de manière 100% autonome
 * sans dépendre d'un serveur relais éphémère.
 */
export async function executeDirectClientScrape(params: ScrapeRequestParams): Promise<ScrapeResultResponse> {
  const { url, maxItems = 28, page = 1, categorySlug } = params;
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    throw new ScrapeError('URL invalide. Fournissez une URL complète débutant par http:// ou https://', 400);
  }

  let domain = 'ouedkniss.com';
  try {
    domain = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    // ignore
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const count = Math.max(8, Number(maxItems) || 28);
  let searchKeywords = '';
  try {
    const parsed = new URL(url);
    searchKeywords = parsed.searchParams.get('keywords') || parsed.searchParams.get('q') || '';
  } catch {
    // ignore
  }

  const activeCategorySlug: string | undefined = categorySlug || detectOuedknissCategory(url)?.slug;

  const t0 = Date.now();
  const live = await scrapeOuedknissLiveAnnouncements({
    categorySlug: activeCategorySlug,
    keywords: searchKeywords,
    page: pageNum,
    count,
  });

  if (!live.success) {
    throw new ScrapeError(live.error || "Échec de l'API GraphQL Ouedkniss", 502);
  }

  const nowIso = new Date().toISOString();
  const products: ScrapedProduct[] = live.products.map((item) => {
    const seller = live.sellers.get(`prod_ouedkniss_${item.id}`);
    const isStore = seller?.type === 'Boutique / Store Certifié';
    const price = Math.round(item.currentPrice);
    return {
      id: `prod_ouedkniss_${item.id}`,
      title: item.title,
      brand: item.brand,
      category: item.category,
      currentPrice: price,
      originalPrice: price,
      currency: 'DA',
      discountPercent: 0,
      rating: 0,
      reviewsCount: 0,
      inStock: true,
      stockLevel: 'IN_STOCK' as const,
      imageUrl: item.imageUrl,
      images: item.images || [],
      productUrl: item.productUrl,
      sourceDomain: domain,
      scrapedAt: nowIso,
      lastUpdated: nowIso,
      priceHistory: [],
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

  const latencyMs = Math.max(1, Date.now() - t0);
  telemetryTracker.recordSample({
    timestamp: Date.now(),
    domain: 'api.ouedkniss.com',
    latencyMs,
    bytesReceived: 35000,
    statusCode: 200,
    success: true,
  });

  return {
    success: true,
    targetUrl: url,
    domain,
    modelUsed: 'OUEDKNISS_GRAPHQL (Direct Client / Sans Relais)',
    isFallbackMode: false,
    isClientSideFallback: true,
    fallbackNotice: null,
    page: pageNum,
    hasMore: live.hasMore,
    totalCatalogEstimated: live.totalEstimated,
    totalCategoryPages: live.lastPage,
    productsCount: products.length,
    products,
    telemetry: {
      rawHtmlSizeKb: 0,
      domNodesInspected: 0,
      tokensProcessed: 0,
      executionTimeMs: latencyMs,
    },
  };
}

export async function executeScrapeRequest(params: ScrapeRequestParams): Promise<ScrapeResultResponse> {
  const custom = getCustomBackendUrl();
  const isStatic = isStaticHost();

  // Si l'application s'exécute sur un environnement statique (APK Android ou GitHub Pages)
  // sans relais backend personnalisé explicite, exécuter directement l'API GraphQL native.
  if (isStatic && !custom) {
    return executeDirectClientScrape(params);
  }

  const endpoint = getApiEndpoint('/api/scrape');
  let lastError = 'Erreur inconnue';
  let lastStatus: number | undefined;

  let requestDomain = 'api.ouedkniss.com';
  try {
    requestDomain = new URL(endpoint, window.location.href).hostname;
  } catch {
    // fallback
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const tStart = Date.now();

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const latencyMs = Math.max(1, Date.now() - tStart);

      if (res.ok) {
        const text = await res.text();
        const bytes = text.length;
        let data: ScrapeResultResponse | null = null;
        try {
          data = JSON.parse(text) as ScrapeResultResponse;
        } catch {
          // ignore
        }

        telemetryTracker.recordSample({
          timestamp: Date.now(),
          domain: requestDomain,
          latencyMs,
          bytesReceived: bytes || 35000,
          statusCode: res.status,
          success: Boolean(data && Array.isArray(data.products)),
        });

        if (data && Array.isArray(data.products)) return data;
        lastError = 'Réponse du serveur invalide';
      } else {
        lastStatus = res.status;
        let detail = '';
        try { detail = (await res.json())?.error || ''; } catch { /* ignore */ }
        lastError = `HTTP ${res.status}${detail ? ` : ${detail}` : ''}`;

        telemetryTracker.recordSample({
          timestamp: Date.now(),
          domain: requestDomain,
          latencyMs,
          bytesReceived: 512,
          statusCode: res.status,
          success: false,
        });

        // Si le serveur répond 404 (par exemple conteneur de prévisualisation expiré ou route absente),
        // basculer immédiatement sur l'aspiration directe côté client sans échouer
        if (res.status === 404 || res.status === 502) {
          console.warn(`[SCRAPER] Relais backend ${endpoint} a renvoyé ${res.status}. Basculement direct client...`);
          return executeDirectClientScrape(params);
        }

        if (res.status === 400) break;
      }
    } catch (err) {
      clearTimeout(timer);
      const latencyMs = Math.max(1, Date.now() - tStart);
      lastError = err instanceof Error ? err.message : String(err);

      telemetryTracker.recordSample({
        timestamp: Date.now(),
        domain: requestDomain,
        latencyMs,
        bytesReceived: 0,
        statusCode: 0,
        success: false,
      });

      // Si erreur réseau (relais indisponible/injoignable), basculer sur l'aspiration directe côté client
      if (attempt === MAX_ATTEMPTS) {
        console.warn(`[SCRAPER] Échec de connexion au relais (${lastError}). Basculement automatique client direct...`);
        return executeDirectClientScrape(params);
      }
    }
    if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
  }

  // En dernier recours de sécurité, tenter l'aspiration client directe
  try {
    return await executeDirectClientScrape(params);
  } catch (directErr) {
    throw new ScrapeError(`Aspiration impossible (page ${params.page ?? 1}, ${params.categorySlug ?? 'all'}) : ${lastError} (Direct: ${directErr instanceof Error ? directErr.message : String(directErr)})`, lastStatus);
  }
}

/**
 * Ancienne « simulation de variation de prix » (Math.random) supprimée :
 * un prix n'est modifié que par une vraie ré-aspiration. Conservée en no-op pour compatibilité.
 */
export async function executeSimulatePriceUpdate(products: ScrapedProduct[]): Promise<ScrapedProduct[]> {
  return products;
}
