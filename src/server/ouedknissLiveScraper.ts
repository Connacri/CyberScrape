/**
 * CYBER-VACUUM // Scraper Ouedkniss (API GraphQL publique) — données RÉELLES uniquement.
 * - Titres/descriptions conservés tels quels (arabe & français 100% préservés).
 * - Lien réel d'annonce = https://www.ouedkniss.com/:slug-d:id
 * - Téléphones & emails : extraction réelle via storeGet (boutiques) et analyse approfondie
 *   du texte/specs complet via announcementDetails.
 * - Aucune donnée factice : absent => '' / undefined.
 */
import type { ScrapedRawItem } from './catalogEngine.ts';
import type { SellerInfo } from '../types/index.ts';
import { OUEDKNISS_CATEGORIES } from '../data/ouedknissCategories.ts';

const OUEDKNISS_GRAPHQL_ENDPOINT = 'https://api.ouedkniss.com/graphql';

const BROWSER_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Origin': 'https://www.ouedkniss.com',
  'Referer': 'https://www.ouedkniss.com/',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Phone = { phone?: string; hasWhatsapp?: boolean; hasViber?: boolean };

interface OuedknissAnnouncementRaw {
  id: string;
  title: string;
  slug: string;
  description?: string;
  refreshedAt?: string;
  createdAt?: string;
  isFromStore?: boolean;
  hasPhone?: boolean;
  price?: number | null;
  pricePreview?: number | null;
  defaultMedia?: { mediaUrl?: string } | null;
  medias?: Array<{ mediaUrl?: string }> | null;
  cities?: Array<{ id?: string; name?: string; region?: { id?: string; name?: string } }>;
  specs?: Array<{ specification?: { codename?: string; label?: string }; valueText?: string[] }>;
  user?: { id?: string; username?: string; displayName?: string } | null;
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

/**
 * Robust extraction of Algerian phone numbers from text
 * Handles:
 * - 05xx, 06xx, 07xx (mobile: 10 digits)
 * - 02x, 03x, 04x (landline: 9 or 10 digits)
 * - International formats (+213, 00213, with optional (0))
 * - Arabic-Indic digits (٠-٩) and Persian digits (۰-۹)
 * - Various separators: spaces, dots, dashes, slashes
 */
export function extractAlgerianPhones(text?: string): Array<{ raw: string; clean: string; formatted: string }> {
  if (!text || typeof text !== 'string') return [];

  // Convert Arabic-Indic and Persian numerals to ASCII digits
  const clean = text
    .replace(/[\u0660-\u0669]/g, (d) => (d.charCodeAt(0) - 0x0660).toString())
    .replace(/[\u06F0-\u06F9]/g, (d) => (d.charCodeAt(0) - 0x06F0).toString());

  const results: Array<{ raw: string; clean: string; formatted: string }> = [];
  const seen = new Set<string>();

  const formatClean = (num: string) => {
    if (num.length === 10) {
      return `${num.slice(0, 4)} ${num.slice(4, 6)} ${num.slice(6, 8)} ${num.slice(8, 10)}`;
    }
    return `${num.slice(0, 3)} ${num.slice(3, 5)} ${num.slice(5, 7)} ${num.slice(7, 9)}`;
  };

  // Pattern 1: International with +213 or 00213, with optional (0)
  const intlRegex = /(?:(?:\+|00)213|\(\+213\))[\s.-]?(?:\(?0\)?[\s.-]?)?([2-7])(?:[\s./-]?\d){7,8}/gi;
  let m: RegExpExecArray | null;
  while ((m = intlRegex.exec(clean)) !== null) {
    const raw = m[0];
    const digits = raw.replace(/\D/g, '');
    const nat = digits.replace(/^(?:00213|213)/, '').replace(/^0/, '');
    const cleanNum = '0' + nat;
    if ((cleanNum.length === 10 || cleanNum.length === 9) && /^0[2-7]/.test(cleanNum) && !seen.has(cleanNum)) {
      seen.add(cleanNum);
      results.push({ raw: raw.trim(), clean: cleanNum, formatted: formatClean(cleanNum) });
    }
  }

  // Pattern 2: National numbers starting with 0 followed by 2-7
  const natRegex = /(?:^|[^\d+])(0[2-7](?:[\s./-]?\d){7,8})(?=[^\d]|$)/g;
  while ((m = natRegex.exec(clean)) !== null) {
    const raw = m[1];
    const digits = raw.replace(/\D/g, '');
    if ((digits.length === 10 || digits.length === 9) && !seen.has(digits)) {
      seen.add(digits);
      results.push({ raw: raw.trim(), clean: digits, formatted: formatClean(digits) });
    }
  }

  return results;
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

  const phones = extractAlgerianPhones(text);
  const p1 = phones[0];
  const p2 = phones[1];

  const hasWhatsappMention = /(whatsapp|واتساب|واتس|viber|فايبر|wa\.me)/i.test(text);

  let email: string | undefined;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    email = emailMatch[0].trim().toLowerCase();
  }

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
    whatsappClean: p1?.clean ? `213${p1.clean.replace(/^0/, '')}` : undefined,
    email,
    hasWhatsapp: hasWhatsappMention || (p1 ? /^(05|06|07)/.test(p1.clean) : false),
    operator: operator1,
    operator2,
  };
}

/** GraphQL POST helper with timeout and retries */
async function gql(
  query: string,
  variables: Record<string, unknown>,
  label: string,
  retries = 3,
  timeoutMs = 12000
): Promise<{ ok: true; json: any } | { ok: false; error: string; status?: number }> {
  let last = 'inconnu';
  let status: number | undefined;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(OUEDKNISS_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: BROWSER_HEADERS,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      status = res.status;

      if (res.ok) {
        const json = await res.json();
        if (json?.errors?.length && !json?.data) {
          last = `GraphQL: ${json.errors.map((e: { message: string }) => e.message).join(' | ')}`;
          break;
        }
        return { ok: true, json };
      }
      last = `HTTP ${res.status}`;
      if (res.status === 400 || res.status === 404) break;
    } catch (err) {
      clearTimeout(timer);
      last = err instanceof Error ? err.message : String(err);
    }

    if (attempt < retries) {
      await sleep(Math.round(400 * 2 ** (attempt - 1) + Math.random() * 200));
    }
  }

  return { ok: false, error: last, status };
}

const storeContactCache = new Map<string, StoreContactInfo>();
const failedStoreCache = new Set<string>();

/** Fetch store details and real phone numbers via storeGet */
async function fetchStoreContacts(storeId: string): Promise<StoreContactInfo | null> {
  if (storeContactCache.has(storeId)) return storeContactCache.get(storeId)!;
  if (failedStoreCache.has(storeId)) return null;

  const query = `
    query GetStoreDetails($id: ID!) {
      storeGet(id: $id) {
        id
        name
        slug
        url
        description
        imageUrl
        mainLocation {
          id
          phones { id phone hasWhatsapp }
        }
        locations {
          id
          phones { id phone hasWhatsapp }
        }
      }
    }
  `;

  const r = await gql(query, { id: storeId }, `store:${storeId}`, 1, 4000);
  if ('error' in r) {
    failedStoreCache.add(storeId);
    return null;
  }
  const store = r.json?.data?.storeGet;
  if (!store) {
    failedStoreCache.add(storeId);
    return null;
  }

  const phoneList: Array<{ phone: string; hasWhatsapp: boolean }> = [];
  const seen = new Set<string>();

  const add = (p?: Phone) => {
    if (!p?.phone) return;
    const clean = p.phone.trim();
    const digits = clean.replace(/\D/g, '').replace(/^(\+?213|00213|0)/, '');
    if (digits.length >= 8 && !seen.has(digits)) {
      seen.add(digits);
      phoneList.push({ phone: clean, hasWhatsapp: Boolean(p.hasWhatsapp) });
    }
  };

  (store.mainLocation?.phones || []).forEach(add);
  for (const loc of store.locations || []) {
    (loc?.phones || []).forEach(add);
  }

  const text = `${store.description || ''} ${store.url || ''}`;
  const fromText = extractContactsFromText(text);
  if (phoneList.length === 0) {
    if (fromText.phone) add({ phone: fromText.phone, hasWhatsapp: fromText.hasWhatsapp });
    if (fromText.phone2) add({ phone: fromText.phone2, hasWhatsapp: fromText.hasWhatsapp });
  }

  const info: StoreContactInfo = {
    name: store.name || '',
    phones: phoneList,
    email: fromText.email,
    imageUrl: store.imageUrl,
    description: store.description,
    url: store.url,
  };

  storeContactCache.set(storeId, info);
  return info;
}

/** Fetch full untruncated description & specs via announcementDetails */
async function fetchAnnouncementDetails(id: string): Promise<{ description?: string; specsText?: string } | null> {
  const query = `
    query GetDetails($id: ID!) {
      announcementDetails(id: $id) {
        id
        description
        specs {
          specification { label }
          valueText
        }
      }
    }
  `;

  const r = await gql(query, { id }, `details:${id}`, 1, 3000);
  if ('error' in r) return null;
  const d = r.json?.data?.announcementDetails;
  if (!d) return null;

  const specsText = (d.specs || [])
    .map((s: any) => `${s.specification?.label || ''}: ${(s.valueText || []).join(' ')}`)
    .join(' ');

  return { description: d.description, specsText };
}

export interface LiveScrapeOptions {
  categorySlug?: string;
  keywords?: string;
  page?: number;
  count?: number;
}

export interface LiveScrapeResult {
  products: ScrapedRawItem[];
  sellers: Map<string, SellerInfo>;
  totalEstimated: number;
  lastPage: number;
  hasMore: boolean;
  success: boolean;
  error?: string;
}

const SEARCH_QUERY = `
  query Search($q: String, $filter: SearchFilterInput) {
    search(q: $q, filter: $filter) {
      announcements {
        data {
          id
          title
          slug
          description
          refreshedAt
          createdAt
          isFromStore
          hasPhone
          price
          pricePreview
          defaultMedia { mediaUrl }
          medias { mediaUrl }
          cities { id name region { id name } }
          specs { specification { codename label } valueText }
          user { id username displayName }
          store { id name slug imageUrl description url }
        }
        paginatorInfo { lastPage hasMorePages total perPage }
      }
    }
  }
`;

const BRAND_RE =
  /\b(Renault|Volkswagen|Peugeot|Dacia|Toyota|Hyundai|Kia|BMW|Mercedes|Audi|Seat|Apple|Samsung|Xiaomi|Google|Honor|Asus|Lenovo|HP|Dell|Sony|Nintendo|Rolex|Nike|Adidas|Oppo|Realme|OnePlus|Infinix|Tecno|ZTE|TCL|LG|Canon|Nikon)\b/i;

const operatorOf = (n: string): 'Mobilis' | 'Djezzy' | 'Ooredoo' | undefined =>
  n.startsWith('05') ? 'Ooredoo' : n.startsWith('06') ? 'Mobilis' : n.startsWith('07') ? 'Djezzy' : undefined;

const operator2Of = (n?: string): 'Mobilis' | 'Djezzy' | 'Ooredoo' | 'Fixe' | undefined =>
  !n ? undefined : operatorOf(n) ?? (/^0[234]/.test(n) ? 'Fixe' : undefined);

export async function scrapeOuedknissLiveAnnouncements(options: LiveScrapeOptions): Promise<LiveScrapeResult> {
  const { categorySlug, keywords, page = 1, count = 28 } = options;
  const fail = (error: string): LiveScrapeResult => ({
    products: [],
    sellers: new Map(),
    totalEstimated: 0,
    lastPage: 0,
    hasMore: false,
    success: false,
    error,
  });

  // Ouedkniss API requires categorySlug or keywords. If neither is given (e.g. homepage crawl),
  // default to 'automobiles' (Algeria's #1 category) so the scraper never returns 0.
  let activeCatSlug = categorySlug;
  const hasKeywords = Boolean(keywords && keywords.trim().length > 0);
  if (!activeCatSlug || activeCatSlug === 'all' || activeCatSlug === 's') {
    if (!hasKeywords) {
      activeCatSlug = 'automobiles';
    } else {
      activeCatSlug = undefined;
    }
  }

  const filter: Record<string, unknown> = {
    page: Math.max(1, page),
    count: Math.min(100, Math.max(10, count)),
  };
  if (activeCatSlug) {
    filter.categorySlug = activeCatSlug;
  }

  const variables: Record<string, unknown> = { filter };
  if (hasKeywords) {
    variables.q = keywords!.trim();
  }

  const r = await gql(SEARCH_QUERY, variables, `search:${activeCatSlug || 'q'}:p${page}`);
  if ('error' in r) return fail(r.error);

  const ann = r.json?.data?.search?.announcements;
  if (!ann) return fail('Réponse GraphQL sans champ announcements');
  const dataList: OuedknissAnnouncementRaw[] = ann.data || [];
  const pag = ann.paginatorInfo || {};
  const base = {
    totalEstimated: Number(pag.total) || 0,
    lastPage: Number(pag.lastPage) || 0,
    hasMore: Boolean(pag.hasMorePages),
  };

  if (dataList.length === 0) {
    return { products: [], sellers: new Map(), success: true, ...base, hasMore: false };
  }

  // 1. Concurrently pre-fetch store contact info for store listings
  const storeIds = Array.from(new Set(dataList.map((i) => i.store?.id).filter(Boolean) as string[]));
  const uncachedStores = storeIds.filter((id) => !storeContactCache.has(id) && !failedStoreCache.has(id));
  if (uncachedStores.length > 0) {
    for (let i = 0; i < uncachedStores.length; i += 6) {
      const chunk = uncachedStores.slice(i, i + 6);
      await Promise.all(chunk.map((id) => fetchStoreContacts(id)));
    }
  }

  // 2. For items with hasPhone=true or short descriptions where phone wasn't found in search snippet,
  // prefetch full announcementDetails in small parallel batches
  const itemsNeedingDetails = dataList.filter((item) => {
    const fromSnippet = extractAlgerianPhones(`${item.title || ''} ${item.description || ''}`);
    const hasStorePhone = item.store?.id && storeContactCache.get(item.store.id)?.phones.length;
    return !hasStorePhone && fromSnippet.length === 0 && Boolean(item.hasPhone);
  });

  const fullDetailsMap = new Map<string, { description?: string; specsText?: string }>();
  if (itemsNeedingDetails.length > 0) {
    const toFetch = itemsNeedingDetails.slice(0, 12);
    const detailResults = await Promise.all(toFetch.map((it) => fetchAnnouncementDetails(it.id)));
    toFetch.forEach((it, idx) => {
      if (detailResults[idx]) {
        fullDetailsMap.set(it.id, detailResults[idx]!);
      }
    });
  }

  const catMeta = OUEDKNISS_CATEGORIES.find((c) => c.slug === activeCatSlug || c.id === activeCatSlug);
  const catName = catMeta?.name || activeCatSlug || 'Annonces Ouedkniss Algérie';
  const products: ScrapedRawItem[] = [];
  const sellers = new Map<string, SellerInfo>();

  for (const item of dataList) {
    const city = item.cities?.[0];
    const wilayaName = city?.region?.name || city?.name || '';
    const cityName = city?.name || wilayaName;

    // Real price calculation
    const rawPrice = Number(item.pricePreview || item.price) || 0;
    const price = rawPrice > 0 && rawPrice < 1000 ? rawPrice * 10000 : rawPrice;

    // Direct authentic URL
    const directUrl = item.slug
      ? `https://www.ouedkniss.com/${item.slug}-d${item.id}`
      : `https://www.ouedkniss.com/annonce-d${item.id}`;

    const specsMap: Record<string, string> = {
      'Réf Annonce': item.id,
      Type: item.isFromStore ? 'Boutique' : 'Particulier',
    };
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

    // Phone numbers & contacts extraction:
    const storeContact = item.store?.id ? storeContactCache.get(item.store.id) : undefined;
    const fullDetail = fullDetailsMap.get(item.id);
    const combinedText = `${item.title || ''} ${fullDetail?.description || item.description || ''} ${fullDetail?.specsText || ''}`;
    const textContacts = extractContactsFromText(combinedText);

    // Primary & secondary phones: store first, then text extraction
    let finalPhone = '';
    let finalPhoneClean = '';
    let finalPhone2: string | undefined;
    let finalPhone2Clean: string | undefined;
    let hasWhatsapp = false;

    if (storeContact?.phones && storeContact.phones.length > 0) {
      const p1 = storeContact.phones[0];
      finalPhone = p1.phone;
      finalPhoneClean = p1.phone.replace(/\D/g, '');
      hasWhatsapp = p1.hasWhatsapp;

      if (storeContact.phones.length > 1) {
        const p2 = storeContact.phones[1];
        finalPhone2 = p2.phone;
        finalPhone2Clean = p2.phone.replace(/\D/g, '');
      }
    } else if (textContacts.phone) {
      finalPhone = textContacts.phone;
      finalPhoneClean = textContacts.phoneClean || '';
      finalPhone2 = textContacts.phone2;
      finalPhone2Clean = textContacts.phone2Clean;
      hasWhatsapp = Boolean(textContacts.hasWhatsapp);
    }

    const whatsappClean = finalPhoneClean
      ? finalPhoneClean.startsWith('213')
        ? finalPhoneClean
        : `213${finalPhoneClean.replace(/^0/, '')}`
      : '';

    const email = storeContact?.email || textContacts.email || '';

    const sellerName = item.store?.name || item.user?.displayName || item.user?.username || (item.isFromStore ? 'Boutique Certifiée' : 'Particulier');

    const seller: SellerInfo = {
      name: sellerName,
      type: item.isFromStore ? 'Boutique / Store Certifié' : 'Particulier',
      phone: finalPhone, // Real or empty string
      phoneClean: finalPhoneClean,
      phone2: finalPhone2,
      phone2Clean: finalPhone2Clean,
      whatsappClean,
      email, // Real or empty string
      wilaya: wilayaName,
      commune: cityName,
      verified: Boolean(item.isFromStore),
      avatarUrl: item.store?.imageUrl || undefined,
      storeName: item.store?.name,
      operator: finalPhoneClean ? operatorOf(finalPhoneClean) : undefined,
      operator2: operator2Of(finalPhone2Clean),
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
      description: fullDetail?.description || item.description || '',
      publishedDate: item.refreshedAt
        ? `Actualisé le ${new Date(item.refreshedAt).toLocaleDateString('fr-DZ')}`
        : undefined,
      specs: specsMap,
    });

    sellers.set(`prod_ouedkniss_${item.id}`, seller);
  }

  return {
    products: products.slice(0, count),
    sellers,
    success: true,
    ...base,
  };
}
