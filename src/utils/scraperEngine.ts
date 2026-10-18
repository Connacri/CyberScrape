/**
 * CYBER-VACUUM // Client du moteur d'aspiration.
 * RÈGLE : le navigateur n'invente RIEN. L'ancien repli `runClientSideScraper` (qui générait de fausses
 * annonces Ouedkniss dès qu'une requête échouait, puis « définitivement » via isServerAvailable) est supprimé.
 * Erreur réseau / HTTP => retries avec backoff, puis ScrapeError. Réponse vide valide => liste vide (+ hasMore:false).
 */
import type { ScrapedProduct } from '../types';

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

function getApiEndpoint(route: string): string {
  const base = (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string; BASE_URL?: string } }).env;
  // Hôte statique (GitHub Pages / APK) : définir VITE_API_BASE_URL vers un vrai backend, sinon erreur explicite.
  const root = (base?.VITE_API_BASE_URL || base?.BASE_URL || '/').replace(/\/?$/, '/');
  return `${root}${route.replace(/^\//, '')}`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MAX_ATTEMPTS = 4;
const TIMEOUT_MS = 30000;

export async function executeScrapeRequest(params: ScrapeRequestParams): Promise<ScrapeResultResponse> {
  const endpoint = getApiEndpoint('/api/scrape');
  let lastError = 'Erreur inconnue';
  let lastStatus: number | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as ScrapeResultResponse;
        if (data && Array.isArray(data.products)) return data;
        lastError = 'Réponse du serveur invalide';
      } else {
        lastStatus = res.status;
        let detail = '';
        try { detail = (await res.json())?.error || ''; } catch { /* ignore */ }
        lastError = `HTTP ${res.status}${detail ? ` : ${detail}` : ''}`;
        if (res.status === 400) break; // erreur de requête : inutile de réessayer
      }
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s, 4s
  }
  throw new ScrapeError(`Aspiration impossible (page ${params.page ?? 1}, ${params.categorySlug ?? 'all'}) : ${lastError}`, lastStatus);
}

/**
 * Ancienne « simulation de variation de prix » (Math.random) supprimée :
 * un prix n'est modifié que par une vraie ré-aspiration. Conservée en no-op pour compatibilité.
 */
export async function executeSimulatePriceUpdate(products: ScrapedProduct[]): Promise<ScrapedProduct[]> {
  return products;
}
