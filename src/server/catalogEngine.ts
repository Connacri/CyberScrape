/**
 * Types + parseur HTML Ouedkniss.
 * Les anciens générateurs procéduraux d'annonces (generateOuedknissItems, generateGenericItems,
 * OUEDKNISS_PRODUCTS_DATABASE, CATEGORY_PROFILES) ont été SUPPRIMÉS : ils fabriquaient des annonces,
 * des prix, des notes, des images et des liens inexistants. Aucune donnée n'est inventée ici.
 * Champ absent = undefined / 0 (inconnu), jamais une valeur plausible.
 */

export interface ScrapedRawItem {
  id?: string;
  title: string;
  brand?: string;
  category: string;
  currentPrice: number;
  originalPrice?: number;
  currency: string;
  discountPercent?: number;
  rating?: number;
  reviewsCount?: number;
  inStock?: boolean;
  stockLevel?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  imageUrl: string;
  images?: string[];
  productUrl: string;
  description?: string;
  publishedDate?: string;
  specs?: Record<string, string>;
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/** Parse les cartes d'annonces du HTML réel. Prix inconnu => 0 (jamais estimé). */
export function extractProductsFromHtml(html: string, domain: string, isOuedkniss: boolean): ScrapedRawItem[] {
  const extracted: ScrapedRawItem[] = [];
  if (!html || typeof html !== 'string' || !isOuedkniss) return extracted;
  const seen = new Set<string>();
  const cardLinkRegex = /<a\s+[^>]*href="(\/([^"'\s>]+-d(\d+)))"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = cardLinkRegex.exec(html)) !== null) {
    const [, rawHref, slug, id, card] = m;
    const url = `https://www.ouedkniss.com${rawHref}`;
    if (seen.has(url)) continue;
    seen.add(url);

    const t = card.match(/<h3[^>]*class="[^"]*o-announ-card-title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
    let title = t ? stripTags(t[1]) : '';
    if (!title) {
      try { title = decodeURIComponent(slug).replace(/-d\d+$/i, '').replace(/-/g, ' ').trim(); } catch { title = ''; }
    }
    if (!title) continue; // pas de titre réel => on n'invente pas

    const img = card.match(/src="([^"]*medias\/announcements\/images\/[^"]+)"/i) || card.match(/<img[^>]*class="[^"]*ok-img[^"]*"[^>]*src="([^"]+)"/i);
    let imageUrl = img ? img[1] : '';
    if (imageUrl.startsWith('//')) imageUrl = `https:${imageUrl}`;
    else if (imageUrl.startsWith('/')) imageUrl = `https://www.ouedkniss.com${imageUrl}`;

    const p = card.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const priceRaw = p ? stripTags(p[1]) : '';
    let currentPrice = 0;
    const da = priceRaw.match(/(\d[\d\s.,]*)\s*(?:دج|DA|Dinar)/i);
    if (da) currentPrice = Math.round(parseFloat(da[1].replace(/\s/g, '').replace(',', '.'))) || 0;

    const loc = card.match(/<i[^>]*mdi-map-marker[^>]*><\/i>\s*([^<]+)/i);
    const specs: Record<string, string> = { 'Réf Annonce': id };
    if (priceRaw) specs['Prix brut (HTML)'] = priceRaw;
    if (loc) specs['Wilaya'] = loc[1].trim();

    extracted.push({ id, title, category: 'Annonces Ouedkniss', currentPrice, currency: 'DA', imageUrl, productUrl: url, specs });
  }
  void domain;
  return extracted;
}
