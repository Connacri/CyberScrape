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

const LIVE_FALLBACK_BACKEND = 'https://ais-pre-b4kaeo4womjndvbx3asyg3-924307861079.europe-west2.run.app';

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
  return window.location.hostname.includes('github.io') || window.location.protocol === 'file:';
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

export async function executeScrapeRequest(params: ScrapeRequestParams): Promise<ScrapeResultResponse> {
  const custom = getCustomBackendUrl();
  if (isStaticHost() && !custom) {
    throw new ScrapeError(
      "Relais backend requis sur GitHub Pages : GitHub Pages est un hébergement statique sans serveur Node.js (bloqué par CORS navigateur). Configurez l'URL d'un relais dans l'onglet 'Moteur Turbo' ou lancez le script Python fast_scraper.py.",
      400
    );
  }

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
        if (res.status === 400 || res.status === 404) break; // inutile de retenter en boucle sur 400/404
      }
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err.message : String(err);
    }
    if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
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
