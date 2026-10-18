/**
 * CYBER-VACUUM // Scraper Ouedkniss (API GraphQL publique) — données RÉELLES uniquement.
 * - Titres/descriptions conservés tels quels (arabe inclus), lien = slug + id réels de l'API.
 * - Téléphones/emails : uniquement ceux fournis par l'API ou présents dans le texte de l'annonce.
 *   Absent => '' / undefined. JAMAIS de valeur inventée, de note, de remise, d'image de remplacement.
 * - Aucune erreur n'est avalée : retries avec backoff, puis erreur explicite remontée à l'appelant.
 */
import type { ScrapedRawItem } from './catalogEngine.ts';
import type { SellerInfo } from '../types/index.ts';
import { OUEDKNISS_CATEGORIES } from '../data/ouedknissCategories.ts';

const OUEDKNISS_GRAPHQL_ENDPOINT = 'https://api.ouedkniss.com/graphql';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phone = { phone?: string; hasWhatsapp?: boolean; hasViber?: boolean };

interface OuedknissAnnouncementRaw {
  id: string; title: string; slug: string; description?: string; refreshedAt?: string; createdAt?: string;
  isFromStore?: boolean; price?: number | null; pricePreview?: number | null;
  phones?: Phone[] | null;
  defaultMedia?: { mediaUrl?: string } | null;
  medias?: Array<{ mediaUrl?: string }> | null;
  cities?: Array<{ id?: string; name?: string; region?: { id?: string; name?: string } }>;
  specs?: Array<{ specification?: { codename?: string; label?: string }; valueText?: string[] }>;
  user?: { id?: string; username?: string; phones?: Phone[] | null } | null;
  store?: { id: string; name: string; slug: string; imageUrl?: string; description?: string; url?: string } | null;
}

export interface StoreContactInfo {
  name: string;
  phones: Array<{ phone: string; hasWhatsapp: boolean }>;
  email?: string;
  imageUrl?: string;
  description?: string;
  url?: string;
}

/** POST GraphQL avec timeout, retries (réseau, 429, 5xx) et backoff exponentiel. Jamais silencieux. */
async function gql(query: string, variables: Record<string, unknown>, label: string, retries = 4, timeoutMs = 20000):
  Promise<{ ok: true; json: any } | { ok: false; error: string; status?: number }> {
  let last = 'inconnu';
  let status: number | undefined;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(OUEDKNISS_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': UA, Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      status = res.status;
      if (res.ok) {
        const json = await res.json();
        if (json?.errors?.length && !json?.data) {
          last = `GraphQL: ${json.errors.map((e: { message: string }) => e.message).join(' | ')}`;
          break; // erreur de requête : inutile de réessayer
        }
        return { ok: true, json };
      }
      last = `HTTP ${res.status}`;
      if (res.status !== 429 && res.status < 500) break;
    } catch (err) {
      clearTimeout(timer);
      last = err instanceof Error ? err.message : String(err);
    }
    console.warn(`[Ouedkniss:${label}] tentative ${attempt}/${retries} échouée : ${last}`);
    if (attempt < retries) await sleep(1000 * 2 ** (attempt - 1));
  }
  console.error(`[Ouedkniss:${label}] ABANDON : ${last}`);
  return { ok: false, error: last, status };
}

const storeContactCache = new Map<string, StoreContactInfo>();

/** Contacts d'une boutique via storeGet. null = ÉCHEC de récupération (distinct de « aucun contact »). */
async function fetchStoreContacts(storeId: string): Promise<StoreContactInfo | null> {
  if (storeContactCache.has(storeId)) return storeContactCache.get(storeId)!;
  const query = `query GetStoreDetails($id: ID!) { storeGet(id: $id) { id name slug url description imageUrl
    mainLocation { id phones { id phone hasWhatsapp } } locations { id phones { id phone hasWhatsapp } } } }`;
  const r = await gql(query, { id: storeId }, `store:${storeId}`, 3, 15000);
  if ('error' in r) return null;
  const store = r.json?.data?.storeGet;
  if (!store) return null;

  const phoneList: Array<{ phone: string; hasWhatsapp: boolean }> = [];
  const seen = new Set<string>();
  const add = (p?: Phone) => {
    if (!p?.phone) return;
    const clean = p.phone.trim();
    const digits = clean.replace(/\D/g, '').replace(/^(\+?213|00213|0)/, '');
    if (digits.length >= 8 && !seen.has(digits)) { seen.add(digits); phoneList.push({ phone: clean, hasWhatsapp: Boolean(p.hasWhatsapp) }); }
  };
  (store.mainLocation?.phones || []).forEach(add);
  for (const loc of store.locations || []) (loc?.phones || []).forEach(add);

  const text = `${store.description || ''} ${store.url || ''}`;
  const fromText = extractContactsFromText(text);
  if (phoneList.length === 0) {
    if (fromText.phone) add({ phone: fromText.phone, hasWhatsapp: fromText.hasWhatsapp });
    if (fromText.phone2) add({ phone: fromText.phone2, hasWhatsapp: fromText.hasWhatsapp });
  }
  const info: StoreContactInfo = { name: store.name || '', phones: phoneList, email: fromText.email, imageUrl: store.imageUrl, description: store.description, url: store.url };
  storeContactCache.set(storeId, info);
  return info;
}

/**
 * Extracts real Algerian phone numbers (primary & secondary) and email from announcement text/description
 */
export function extractContactsFromText(text?: string): {
  phone?: string;
  phoneClean?: string;
  phone2?: string;
  phone2Clean?: string;
  whatsappClean?: string;
  email?: string;
  hasWhatsapp?: boolean;
  operator?: 'Mobilis' | 'Djezzy' | 'Ooredoo';
  operator2?: 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Fixe';
} {
  if (!text || typeof text !== 'string') return {};

  // 1. Convert Arabic-Indic and Persian numerals to ASCII digits
  const clean = text
    .replace(/[\u0660-\u0669]/g, (d) => (d.charCodeAt(0) - 0x0660).toString())
    .replace(/[\u06F0-\u06F9]/g, (d) => (d.charCodeAt(0) - 0x06F0).toString());

  const candidates: string[] = [];

  // International prefix: +213, 00213, (+213), (00213), or 213 followed by 8 or 9 digits
  const intlRegex = /(?:(?:\+|00|\(\+?|\(00)213[\s./_-]*(?:\(0\)[\s./_-]*)?|(?:\b213[\s./_-]+))([2-7](?:[\s./_()-]*\d){7,8})/gi;
  let m: RegExpExecArray | null;
  while ((m = intlRegex.exec(clean)) !== null) {
    const rawDigits = m[1].replace(/\D/g, '');
    if (rawDigits.length === 8 || rawDigits.length === 9) {
      candidates.push('0' + rawDigits);
    }
  }

  // National mobile and landline: Starts with 0[2-7], followed by 7 or 8 digits with optional separators
  const nationalRegex = /(?:^|[^\d+])(0[2-7](?:[\s./_()-]*\d){7,8})(?=[^\d]|$)/gi;
  while ((m = nationalRegex.exec(clean)) !== null) {
    const rawDigits = m[1].replace(/\D/g, '');
    if (rawDigits.length === 9 || rawDigits.length === 10) {
      candidates.push(rawDigits);
    }
  }

  // 9-digit mobile numbers without leading 0 after keyword (e.g. "Tél: 550 12 34 56" or "appelez au 770...")
  const kwRegex = /(?:tel|tél|telephone|téléphone|phone|mob|mobile|contact|whatsapp|wa|appeler|numéro|numero|num|اتصل|هاتف|رقم|واتساب)[\s.:/_-]*(?:au|a|sur|par)?[\s.:/_-]*([567](?:[\s./_()-]*\d){8})(?=[^\d]|$)/gi;
  while ((m = kwRegex.exec(clean)) !== null) {
    const rawDigits = m[1].replace(/\D/g, '');
    if (rawDigits.length === 9) {
      candidates.push('0' + rawDigits);
    }
  }

  // Also catch contiguous 10-digit Algerian numbers embedded without spaces (e.g. .0655778710.3tn)
  const embedRegex = /(0[567]\d{8})/g;
  while ((m = embedRegex.exec(clean)) !== null) {
    candidates.push(m[1]);
  }

  // Deduplicate candidates preserving order
  const seen = new Set<string>();
  const phoneList: Array<{ formatted: string; clean: string; whatsappClean: string }> = [];

  for (const c of candidates) {
    if (!seen.has(c) && (c.length === 9 || c.length === 10) && /^0[2-7]/.test(c)) {
      seen.add(c);
      const formatted = c.length === 10
        ? `${c.slice(0, 4)} ${c.slice(4, 6)} ${c.slice(6, 8)} ${c.slice(8, 10)}`
        : `${c.slice(0, 3)} ${c.slice(3, 5)} ${c.slice(5, 7)} ${c.slice(7, 9)}`;
      const cleanPhone = c;
      const whatsappClean = '213' + c.slice(1);
      phoneList.push({ formatted, clean: cleanPhone, whatsappClean });
    }
  }

  // Check if WhatsApp or Viber mentioned in text
  const hasWhatsappMention = /(whatsapp|واتساب|واتس|viber|فايبر|wa\.me)/i.test(clean);

  // Email extraction
  let email: string | undefined;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = clean.match(emailRegex);
  if (emailMatch) {
    email = emailMatch[0].trim().toLowerCase();
  }

  const p1 = phoneList[0];
  const p2 = phoneList[1];

  const operator1: 'Mobilis' | 'Djezzy' | 'Ooredoo' | undefined = p1?.clean.startsWith('05')
    ? 'Ooredoo'
    : p1?.clean.startsWith('06')
    ? 'Mobilis'
    : p1?.clean.startsWith('07')
    ? 'Djezzy'
    : undefined;

  const operator2: 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Fixe' | undefined = p2?.clean.startsWith('05')
    ? 'Ooredoo'
    : p2?.clean.startsWith('06')
    ? 'Mobilis'
    : p2?.clean.startsWith('07')
    ? 'Djezzy'
    : p2?.clean.startsWith('02') || p2?.clean.startsWith('03') || p2?.clean.startsWith('04')
    ? 'Fixe'
    : undefined;

  return {
    phone: p1?.formatted,
    phoneClean: p1?.clean,
    phone2: p2?.formatted,
    phone2Clean: p2?.clean,
    whatsappClean: p1?.whatsappClean,
    email,
    hasWhatsapp: hasWhatsappMention || (p1 ? /^(05|06|07)/.test(p1.clean) : false),
    operator: operator1,
    operator2,
  };
}

export interface LiveScrapeOptions { categorySlug?: string; keywords?: string; page?: number; count?: number }

export interface LiveScrapeResult {
  products: ScrapedRawItem[];
  sellers: Map<string, SellerInfo>;
  totalEstimated: number;
  lastPage: number;
  hasMore: boolean;
  success: boolean;
  error?: string;
}

const SEARCH_QUERY = `query Search($q: String, $filter: SearchFilterInput) { search(q: $q, filter: $filter) { announcements {
  data { id title slug description refreshedAt createdAt isFromStore price pricePreview
    phones { phone hasWhatsapp hasViber } defaultMedia { mediaUrl } medias { mediaUrl }
    cities { id name region { id name } } specs { specification { codename label } valueText }
    user { id username phones { phone hasWhatsapp hasViber } } store { id name slug imageUrl description url } }
  paginatorInfo { lastPage hasMorePages total perPage } } } }`;

const BRAND_RE = /\b(Renault|Volkswagen|Peugeot|Dacia|Toyota|Hyundai|Kia|BMW|Mercedes|Audi|Seat|Apple|Samsung|Xiaomi|Google|Honor|Asus|Lenovo|HP|Dell|Sony|Nintendo|Rolex|Nike|Adidas|Oppo|Realme|OnePlus|Infinix|Tecno|ZTE|TCL|LG|Canon|Nikon)\b/i;
const operatorOf = (n: string): 'Mobilis' | 'Djezzy' | 'Ooredoo' | undefined => n.startsWith('05') ? 'Ooredoo' : n.startsWith('06') ? 'Mobilis' : n.startsWith('07') ? 'Djezzy' : undefined;
const operator2Of = (n?: string): 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Fixe' | undefined => !n ? undefined : operatorOf(n) ?? (/^0[234]/.test(n) ? 'Fixe' : undefined);

export async function scrapeOuedknissLiveAnnouncements(options: LiveScrapeOptions): Promise<LiveScrapeResult> {
  const { categorySlug, keywords, page = 1, count = 28 } = options;
  const fail = (error: string): LiveScrapeResult => ({ products: [], sellers: new Map(), totalEstimated: 0, lastPage: 0, hasMore: false, success: false, error });

  const filter: Record<string, unknown> = { page: Math.max(1, page), count: Math.min(100, Math.max(10, count)) };
  if (categorySlug && categorySlug !== 's' && categorySlug !== 'all') filter.categorySlug = categorySlug;
  const variables: Record<string, unknown> = { filter };
  if (keywords && keywords.trim()) variables.q = keywords.trim();

  const r = await gql(SEARCH_QUERY, variables, `search:${categorySlug || 'all'}:p${page}`);
  if ('error' in r) return fail(r.error);

  const ann = r.json?.data?.search?.announcements;
  if (!ann) return fail('Réponse GraphQL sans champ announcements');
  const dataList: OuedknissAnnouncementRaw[] = ann.data || [];
  const pag = ann.paginatorInfo || {};
  const base = { totalEstimated: Number(pag.total) || 0, lastPage: Number(pag.lastPage) || 0, hasMore: Boolean(pag.hasMorePages) };
  if (dataList.length === 0) return { products: [], sellers: new Map(), success: true, ...base, hasMore: false };

  // Contacts de TOUTES les boutiques de la page (pas de plafond silencieux), 5 requêtes en parallèle.
  const storeIds = Array.from(new Set(dataList.map((i) => i.store?.id).filter(Boolean) as string[]));
  const failedStores = new Set<string>();
  for (let i = 0; i < storeIds.length; i += 5) {
    const chunk = storeIds.slice(i, i + 5);
    const res = await Promise.all(chunk.map((id) => fetchStoreContacts(id)));
    res.forEach((v, k) => { if (!v) failedStores.add(chunk[k]); });
  }

  const catName = OUEDKNISS_CATEGORIES.find((c) => c.slug === categorySlug || c.id === categorySlug)?.name || categorySlug || '';
  const products: ScrapedRawItem[] = [];
  const sellers = new Map<string, SellerInfo>();

  for (const item of dataList) {
    const city = item.cities?.[0];
    const wilayaName = city?.region?.name || city?.name || '';
    const cityName = city?.name || wilayaName;

    // Prix : valeur API telle quelle. Convention « millions de centimes » (valeur < 1000) conservée de l'ancien code,
    // la valeur brute est tracée dans specs['Prix brut API'] pour audit. À valider avec le champ d'unité de l'API.
    const rawPrice = Number(item.pricePreview || item.price) || 0;
    const price = rawPrice > 0 && rawPrice < 1000 ? rawPrice * 10000 : rawPrice;

    const directUrl = item.slug ? `https://www.ouedkniss.com/${item.slug}-d${item.id}` : `https://www.ouedkniss.com/annonce-d${item.id}`;

    const specsMap: Record<string, string> = { 'Réf Annonce': item.id, Type: item.isFromStore ? 'Boutique' : 'Particulier' };
    if (wilayaName) specsMap.Wilaya = cityName && cityName !== wilayaName ? `${wilayaName} (${cityName})` : wilayaName;
    if (rawPrice) specsMap['Prix brut API'] = String(rawPrice);
    if (item.createdAt) specsMap['Publiée (ISO)'] = item.createdAt;
    if (item.refreshedAt) specsMap['Actualisée (ISO)'] = item.refreshedAt;
    for (const s of item.specs || []) {
      const label = s.specification?.label || s.specification?.codename;
      const val = s.valueText?.[0];
      if (label && val) specsMap[label] = val;
    }

    const brandMatch = item.title.match(BRAND_RE);
    const medias = (item.medias || []).map((m) => m?.mediaUrl).filter(Boolean) as string[];
    const primaryImage = item.defaultMedia?.mediaUrl || medias[0] || '';
    const gallery = Array.from(new Set([primaryImage, ...medias].filter(Boolean)));

    // Téléphones : API (boutique, annonce, utilisateur) puis texte de l'annonce. Provenance tracée.
    const storeContact = item.store?.id ? storeContactCache.get(item.store.id) : undefined;
    const phones: Array<{ formatted: string; clean: string; wa: boolean }> = [];
    const seen = new Set<string>();
    const sources = new Set<string>();
    const register = (p: string | undefined, wa: boolean | undefined, src: string) => {
      if (!p) return;
      const digits = p.replace(/\D/g, '').replace(/^(\+?213|00213|0)/, '');
      if (digits.length < 8 || digits.length > 9 || seen.has(digits)) return;
      seen.add(digits); sources.add(src);
      const full = `0${digits}`;
      const formatted = full.length === 10 ? `${full.slice(0, 4)} ${full.slice(4, 6)} ${full.slice(6, 8)} ${full.slice(8, 10)}` : `${full.slice(0, 3)} ${full.slice(3, 5)} ${full.slice(5, 7)} ${full.slice(7, 9)}`;
      phones.push({ formatted, clean: full, wa: Boolean(wa) });
    };
    storeContact?.phones.forEach((p) => register(p.phone, p.hasWhatsapp, 'boutique(API)'));
    (item.phones || []).forEach((p) => register(p?.phone, p?.hasWhatsapp, 'annonce(API)'));
    (item.user?.phones || []).forEach((p) => register(p?.phone, p?.hasWhatsapp, 'utilisateur(API)'));

    let text = `${item.title || ''} ${item.description || ''}`;
    for (const s of item.specs || []) text += ` ${s.specification?.label || ''}: ${(s.valueText || []).join(' ')}`;
    const fromText = extractContactsFromText(text);
    register(fromText.phoneClean, fromText.hasWhatsapp, 'texte annonce');
    register(fromText.phone2Clean, fromText.hasWhatsapp, 'texte annonce');

    const p1 = phones[0];
    const p2 = phones[1];
    const email = storeContact?.email || fromText.email || '';
    if (sources.size) specsMap['Source contacts'] = Array.from(sources).join(', ');
    if (item.store?.id && failedStores.has(item.store.id)) specsMap['Contacts boutique'] = 'récupération échouée';

    const seller: SellerInfo = {
      name: item.store?.name || item.user?.username || '',
      type: item.isFromStore ? 'Boutique / Store Certifié' : 'Particulier',
      phone: p1?.formatted || '',
      phoneClean: p1?.clean || '',
      phone2: p2?.formatted,
      phone2Clean: p2?.clean,
      whatsappClean: p1?.wa ? `213${p1.clean.replace(/^0/, '')}` : '',
      email,
      wilaya: wilayaName,
      commune: cityName,
      verified: false, // non fourni par l'API
      avatarUrl: item.store?.imageUrl || undefined,
      storeName: item.store?.name,
      operator: p1 ? operatorOf(p1.clean) : undefined,
      operator2: operator2Of(p2?.clean),
    };

    products.push({
      id: item.id,
      title: item.title,
      brand: brandMatch ? brandMatch[1] : undefined,
      category: catName,
      currentPrice: price,
      currency: 'DA',
      imageUrl: primaryImage,
      images: gallery,
      productUrl: directUrl,
      description: item.description || '',
      publishedDate: item.refreshedAt ? `Actualisé le ${new Date(item.refreshedAt).toLocaleDateString('fr-DZ')}` : undefined,
      specs: specsMap,
    });
    sellers.set(`prod_ouedkniss_${item.id}`, seller);
  }

  return { products: products.slice(0, count), sellers, success: true, ...base };
}
