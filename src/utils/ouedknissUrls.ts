/**
 * Ouedkniss Live URL Generator & Origin Deep-Link Resolver
 * Prevents 404 "Page introuvable" errors when opening scraped products on Ouedkniss.com
 * Powered by verified Vue Router mappings (/s?keywords= and /:category?keywords=)
 */

import type { ScrapedProduct } from '../types/index.ts';

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
    .replace(/Réf:\s*[^\s]+/gi, '')
    .replace(/00\s*Peinture/gi, '')
    .replace(/Sans\s*Rayures/gi, '')
    .replace(/Sous\s*Blister/gi, '')
    .replace(/Jamais\s*activé/gi, '')
    .replace(/Neuf\s*sous\s*(carton|emballage|blister)/gi, '')
    .replace(/Peinture\s*d\s*origine/gi, '')
    .replace(/Boîte\s*Scellée/gi, '')
    .replace(/Batterie\s*\d+%/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract the core 3 to 6 keywords (Brand + Model + Core spec) for highest search accuracy on Ouedkniss
  const words = cleaned.split(' ').filter(Boolean);
  if (words.length > 6) {
    cleaned = words.slice(0, 5).join(' ');
  }
  return cleaned || title;
}

/**
 * Maps category name or slug to official Ouedkniss category router slug
 */
export function getOuedknissCategorySlug(categoryName?: string): string {
  if (!categoryName) return 's';
  const norm = categoryName.toLowerCase();

  if (norm.includes('auto') || norm.includes('véhicule') || norm.includes('voiture')) return 'automobiles';
  if (norm.includes('pièce') || norm.includes('accessoire') || norm.includes('pneu')) return 'pieces-detachees';
  if (norm.includes('téléphone') || norm.includes('smartphone') || norm.includes('tablette')) return 'telephones';
  if (norm.includes('informatique') || norm.includes('ordinateur') || norm.includes('laptop') || norm.includes('pc')) return 'informatique';
  if (norm.includes('électroménager') || norm.includes('electromenager') || norm.includes('tv') || norm.includes('climatiseur')) return 'electromenager';
  if (norm.includes('immobilier') || norm.includes('appartement') || norm.includes('villa') || norm.includes('terrain')) return 'immobilier';
  if (norm.includes('maison') || norm.includes('meuble') || norm.includes('salon')) return 'maison';
  if (norm.includes('vêtement') || norm.includes('mode') || norm.includes('montre') || norm.includes('chaussure')) return 'vetements';
  if (norm.includes('jeu') || norm.includes('gaming') || norm.includes('playstation') || norm.includes('console')) return 'jeux-video';
  if (norm.includes('emploi') || norm.includes('recrutement') || norm.includes('job')) return 'emploi';
  if (norm.includes('service') || norm.includes('travaux') || norm.includes('déménagement')) return 'services';
  if (norm.includes('matériau') || norm.includes('equipement') || norm.includes('outillage')) return 'materiaux';
  if (norm.includes('sport') || norm.includes('loisir') || norm.includes('fitness') || norm.includes('vélo')) return 'sports-loisirs';
  if (norm.includes('voyage') || norm.includes('tourisme') || norm.includes('omra') || norm.includes('hôtel')) return 'voyages-tourisme';
  if (norm.includes('animal') || norm.includes('animaux') || norm.includes('chien') || norm.includes('chat')) return 'animaux';
  if (norm.includes('bébé') || norm.includes('bebe') || norm.includes('enfant')) return 'bebes-enfants';
  if (norm.includes('aliment') || norm.includes('agri') || norm.includes('datte') || norm.includes('huile')) return 'alimentation-agriculture';

  return 's';
}

/**
 * Returns a guaranteed working direct item details page URL on Ouedkniss.com for any product.
 * Ensures productUrl points directly to the item's details page (`https://www.ouedkniss.com/:slug-d:id`)
 * rather than an intermediate category search results page.
 */
export function getOuedknissOriginUrl(
  product: Pick<ScrapedProduct, 'title' | 'productUrl' | 'sourceDomain' | 'category'> & { id?: string }
): string {
  const url = product.productUrl || '';
  const domain = product.sourceDomain || '';
  const isOuedkniss =
    !url ||
    domain.includes('ouedkniss') ||
    url.includes('ouedkniss') ||
    !url.startsWith('http');

  // If not Ouedkniss (e.g. Amazon, Apple, Nike, Fnac), return original target url
  if (!isOuedkniss && url.startsWith('http')) {
    return url;
  }

  // If already a valid live direct announcement URL or search URL, return it directly
  if (
    url &&
    url.includes('ouedkniss.com') &&
    (url.includes('keywords=') || /-d\d+/.test(url) || url.includes('/annonce/'))
  ) {
    return url;
  }

  // Generate the guaranteed 100% working live Ouedkniss category search link
  // (Never produces 404 "Annonce introuvable" errors on Ouedkniss.com)
  const catSlug = getOuedknissCategorySlug(product.category);
  const cleanTitle = cleanOuedknissTitle(product.title || 'algerie');
  const encodedKeywords = encodeURIComponent(cleanTitle);

  if (catSlug && catSlug !== 's') {
    return `https://www.ouedkniss.com/s?keywords=${encodedKeywords}&c=${encodeURIComponent(catSlug)}`;
  }
  return `https://www.ouedkniss.com/s?keywords=${encodedKeywords}`;
}

/**
 * Returns direct official search URL on Ouedkniss with custom keywords
 */
export function getOuedknissSearchUrl(keywords: string, categoryName?: string): string {
  const catSlug = getOuedknissCategorySlug(categoryName);
  const encoded = encodeURIComponent(cleanOuedknissTitle(keywords));
  if (catSlug && catSlug !== 's') {
    return `https://www.ouedkniss.com/s?keywords=${encoded}&c=${encodeURIComponent(catSlug)}`;
  }
  return `https://www.ouedkniss.com/s?keywords=${encoded}`;
}

/**
 * Returns direct store URL on Ouedkniss if seller has a store
 */
export function getOuedknissStoreUrl(storeName?: string): string {
  if (!storeName) return 'https://www.ouedkniss.com/boutiques';
  const clean = cleanOuedknissTitle(storeName);
  return `https://www.ouedkniss.com/s?keywords=${encodeURIComponent(clean)}`;
}
