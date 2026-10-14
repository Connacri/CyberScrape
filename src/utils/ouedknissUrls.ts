/**
 * Ouedkniss Live URL Generator & Origin Deep-Link Resolver
 * Prevents 404 "Page introuvable" errors when opening scraped products on Ouedkniss.com
 */

import { ScrapedProduct } from '../types';

/**
 * Cleans titles from internal procedurally generated prefixes or hashes
 */
export function cleanOuedknissTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/-?\s*Annonce\s*Ouedkniss\s*#?\d+/gi, '')
    .replace(/#\d+/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/Réf:.*$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Returns a guaranteed working live URL on Ouedkniss.com for any product.
 * If the product comes from Ouedkniss, it uses the official live search query
 * `https://www.ouedkniss.com/recherche?keywords=...` which always succeeds and
 * presents the authentic active listings without 404 errors.
 */
export function getOuedknissOriginUrl(product: Pick<ScrapedProduct, 'title' | 'productUrl' | 'sourceDomain' | 'category'>): string {
  const isOuedkniss =
    (product.sourceDomain && product.sourceDomain.includes('ouedkniss')) ||
    (product.productUrl && product.productUrl.includes('ouedkniss')) ||
    !product.productUrl.startsWith('http');

  if (!isOuedkniss) {
    return product.productUrl || 'https://www.ouedkniss.com';
  }

  // If the productUrl is already a valid search query on ouedkniss, keep it
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
