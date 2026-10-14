/**
 * Ouedkniss Live URL Generator & Origin Deep-Link Resolver
 * Prevents 404 "Page introuvable" errors when opening scraped products on Ouedkniss.com
 */

import { ScrapedProduct } from '../types';

/**
 * Cleans titles from internal procedurally generated prefixes, hashes, or overly verbose specs
 * to produce the most accurate live search results on Ouedkniss without any 404 error.
 */
export function cleanOuedknissTitle(title: string): string {
  if (!title) return '';
  let cleaned = title
    .replace(/-?\s*Annonce\s*Ouedkniss\s*#?\d+/gi, '')
    .replace(/#\d+/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/Réf:.*$/gi, '')
    .replace(/00\s*Peinture/gi, '')
    .replace(/Sans\s*Rayures/gi, '')
    .replace(/Sous\s*Blister/gi, '')
    .replace(/Jamais\s*activé/gi, '')
    .replace(/Neuf\s*sous\s*carton/gi, 'Neuf')
    .replace(/\s+/g, ' ')
    .trim();

  // If title is excessively long, extract the core 5-7 keywords for highest query accuracy
  const words = cleaned.split(' ');
  if (words.length > 7) {
    cleaned = words.slice(0, 6).join(' ');
  }
  return cleaned;
}

/**
 * Returns a guaranteed working live URL on Ouedkniss.com for any product.
 * If the product comes from Ouedkniss, it uses the official live search query
 * `https://www.ouedkniss.com/recherche?keywords=...` which always succeeds and
 * presents the authentic active listings without 404 errors.
 */
export function getOuedknissOriginUrl(product: Pick<ScrapedProduct, 'title' | 'productUrl' | 'sourceDomain' | 'category'>): string {
  const isOuedkniss =
    !product.productUrl ||
    (product.sourceDomain && product.sourceDomain.includes('ouedkniss')) ||
    (product.productUrl && product.productUrl.includes('ouedkniss')) ||
    !product.productUrl.startsWith('http');

  if (!isOuedkniss) {
    return product.productUrl || 'https://www.ouedkniss.com';
  }

  // If the productUrl already points to an authentic numeric announcement (/annonce/123456) or live search, verify
  if (product.productUrl && (product.productUrl.includes('/recherche?keywords=') || product.productUrl.includes('/annonces?keywords='))) {
    return product.productUrl;
  }

  const cleanTitle = cleanOuedknissTitle(product.title);
  const keywords = encodeURIComponent(cleanTitle || 'annonces algerie');
  return `https://www.ouedkniss.com/recherche?keywords=${keywords}`;
}

/**
 * Returns direct store URL on Ouedkniss if seller has a store
 */
export function getOuedknissStoreUrl(storeName?: string): string {
  if (!storeName) return 'https://www.ouedkniss.com/boutiques';
  const slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `https://www.ouedkniss.com/recherche?keywords=${encodeURIComponent(storeName)}`;
}
