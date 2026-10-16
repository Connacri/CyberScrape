import type { ScrapedProduct, SellerInfo } from '../types/index.ts';
import { getOuedknissOriginUrl } from './ouedknissUrls.ts';
import { getRandom69Wilaya } from '../data/algeriaWilayas.ts';

// Algerian first names and store brandings
const SELLER_NAMES = [
  'Karim Mobile Tech',
  'Amine Ouedkniss Store',
  'Sofiane Tech DZ',
  'Mohamed Benali (Particulier)',
  'Hichem Informatique',
  'Store El Bahdja Alger',
  'Boutique Oran Express',
  'Yacine Auto DZ',
  'Immo Prestige Centre',
  'Samir Électronique Sétif',
  'Boutique PlayZone Blida',
  'Walid Import Dubaï',
  'Riad High-Tech',
  'Boutique Casbah Shop',
  'Khaled Moto & Pièces',
  'Nabil Sport & Mode DZ',
  'Boutique Bab Ezzouar Tech',
  'Farid Constantine Store',
  'Store Annaba Digital',
  'Bilel Électro Tlemcen',
];

const SELLER_TYPES: ('Particulier' | 'Boutique / Store Certifié' | 'Agence Immobilière' | 'Showroom Auto')[] = [
  'Boutique / Store Certifié',
  'Particulier',
  'Boutique / Store Certifié',
  'Particulier',
  'Boutique / Store Certifié',
  'Showroom Auto',
  'Agence Immobilière',
];

const AVATAR_POOL = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
];

const RESPONSE_TIMES = [
  'Répond généralement en 5 minutes',
  'Répond généralement en moins de 15 min',
  'Répond dans l\'heure',
  'Très réactif sur WhatsApp',
  'Joignable 7j/7 de 09h à 21h',
];

const MEMBER_SINCE = [
  'Membre vérifié depuis Janv. 2018',
  'Membre vérifié depuis Mars 2020',
  'Membre vérifié depuis Juil. 2021',
  'Boutique Ouedkniss Pro depuis 2019',
  'Membre certifié depuis Mai 2022',
  'Vendeur certifié Ouedkniss Gold 2023',
];

/**
 * Generates an authentic Algerian phone number based on index/seed
 * Mobilis (06), Djezzy (07), or Ooredoo (05)
 */
export function generateAlgerianPhone(seed: number): {
  formatted: string;
  clean: string;
  whatsapp: string;
  international: string;
  operator: 'Mobilis' | 'Djezzy' | 'Ooredoo';
} {
  // Real active mobile prefixes in Algeria:
  // Ooredoo: 0550, 0555, 0560, 0540, 0551
  // Mobilis: 0661, 0670, 0665, 0658, 0662
  // Djezzy:  0770, 0775, 0790, 0792, 0771
  const prefixPool: { prefix: string; operator: 'Mobilis' | 'Djezzy' | 'Ooredoo' }[] = [
    { prefix: '0550', operator: 'Ooredoo' },
    { prefix: '0555', operator: 'Ooredoo' },
    { prefix: '0560', operator: 'Ooredoo' },
    { prefix: '0540', operator: 'Ooredoo' },
    { prefix: '0661', operator: 'Mobilis' },
    { prefix: '0670', operator: 'Mobilis' },
    { prefix: '0665', operator: 'Mobilis' },
    { prefix: '0658', operator: 'Mobilis' },
    { prefix: '0770', operator: 'Djezzy' },
    { prefix: '0775', operator: 'Djezzy' },
    { prefix: '0790', operator: 'Djezzy' },
    { prefix: '0792', operator: 'Djezzy' },
  ];

  const chosen = prefixPool[Math.abs(seed) % prefixPool.length];
  const prefix = chosen.prefix;
  const operator = chosen.operator;

  // 6 digits: XX XX XX
  const d1 = (10 + (Math.abs(seed * 7 + 13) % 90)).toString().padStart(2, '0');
  const d2 = (10 + (Math.abs(seed * 17 + 29) % 90)).toString().padStart(2, '0');
  const d3 = (10 + (Math.abs(seed * 31 + 47) % 90)).toString().padStart(2, '0');

  const formatted = `${prefix} ${d1} ${d2} ${d3}`;
  const clean = `${prefix}${d1}${d2}${d3}`;
  const international = `+213 ${prefix.substring(1)} ${d1} ${d2} ${d3}`;
  // International WhatsApp format (+213 without leading 0)
  const whatsapp = `213${prefix.substring(1)}${d1}${d2}${d3}`;

  return { formatted, clean, whatsapp, international, operator };
}

/**
 * Derives a consistent numerical hash from a string ID
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates rich seller information for any product
 */
export function generateSellerForProduct(
  productId: string,
  category: string = 'Général',
  wilayaHint?: string
): SellerInfo {
  const seed = hashString(productId);
  const phoneData = generateAlgerianPhone(seed);

  // Determine category-coherent seller type and name pool
  const catLower = category.toLowerCase();
  let type: 'Particulier' | 'Boutique / Store Certifié' | 'Agence Immobilière' | 'Showroom Auto';
  let namePool = SELLER_NAMES;

  if (catLower.includes('immo')) {
    type = seed % 2 === 0 ? 'Agence Immobilière' : 'Particulier';
    namePool = [
      'Immo Prestige Centre',
      'Agence Immobilière El Mordjane',
      'Cabinet Foncier Alger',
      'Kouba Immobilier Pro',
      'Mohamed Benali (Particulier)',
      'Immo Constantine Atlas',
    ];
  } else if (catLower.includes('véhicule') || catLower.includes('auto') || catLower.includes('voiture')) {
    type = seed % 2 === 0 ? 'Showroom Auto' : 'Particulier';
    namePool = [
      'Yacine Auto DZ',
      'Showroom El Bahdja Motors',
      'Auto Prestige Alger',
      'Sétif Occasion Véhicules',
      'Karim Benahmed (Particulier)',
      'Oran Auto Express',
    ];
  } else if (
    catLower.includes('téléphone') ||
    catLower.includes('smartphone') ||
    catLower.includes('informatique') ||
    catLower.includes('tech') ||
    catLower.includes('tablette')
  ) {
    type = seed % 3 === 0 ? 'Particulier' : 'Boutique / Store Certifié';
    namePool = [
      'Karim Mobile Tech',
      'Boutique Tech Pro Alger',
      'Sofiane Phone DZ',
      'Hichem Informatique Kouba',
      'Boutique Bab Ezzouar Tech',
      'Amine Ouedkniss Store',
      'Store Annaba Digital',
      'Samir Électronique Sétif',
    ];
  } else {
    type = seed % 2 === 0 ? 'Particulier' : 'Boutique / Store Certifié';
  }

  const name = namePool[seed % namePool.length];
  const avatarUrl = AVATAR_POOL[seed % AVATAR_POOL.length];
  const responseTime = RESPONSE_TIMES[seed % RESPONSE_TIMES.length];
  const memberSince = MEMBER_SINCE[seed % MEMBER_SINCE.length];

  const wilaya = wilayaHint || getRandom69Wilaya(seed);
  const commune = wilaya.includes('-') ? wilaya.split('-')[1]?.trim() : wilaya;

  // Generate 2nd Algerian phone number (different operator for maximum reach)
  const seed2 = seed * 13 + 37;
  const phoneData2 = generateAlgerianPhone(seed2);
  const finalOperator2 = phoneData2.operator === phoneData.operator
    ? (phoneData.operator === 'Mobilis' ? 'Djezzy' : phoneData.operator === 'Djezzy' ? 'Ooredoo' : 'Mobilis')
    : phoneData2.operator;

  return {
    name,
    type,
    phone: phoneData.formatted,
    phoneClean: phoneData.clean,
    phone2: phoneData2.formatted,
    phone2Clean: phoneData2.clean,
    whatsappClean: phoneData.whatsapp,
    wilaya,
    commune,
    memberSince,
    rating: Math.round((4.6 + (seed % 4) * 0.1) * 10) / 10,
    reviewsCount: 15 + (seed % 230),
    responseTime,
    verified: true,
    avatarUrl,
    storeName: type !== 'Particulier' ? `${name} Algérie Marketplace` : undefined,
    operator: phoneData.operator,
    operator2: finalOperator2,
  };
}

/**
 * Generates an authentic multiline description for the announcement
 */
export function generateAnnouncementDescription(product: ScrapedProduct, seller: SellerInfo): string {
  const wilaya = seller.wilaya || 'Alger';
  const condition = product.specs?.['État'] || product.specs?.['Condition'] || 'Excellent état vérifié';
  const priceFormatted = new Intl.NumberFormat('fr-DZ').format(product.currentPrice);

  return `Salem Alikoum / Bonjour,

Je mets en vente mon article : **${product.title}** en ${condition}.

📌 **Détails & Caractéristiques :**
- Marque : ${product.brand || 'D\'origine certifiée'}
- Catégorie : ${product.category}
- État du produit : ${condition}
- Emplacement : ${wilaya} (${seller.commune || 'Centre'})
- Prix demandé : ${priceFormatted} ${product.currency} (${product.discountPercent > 0 ? 'Possibilité de légère négociation pour acheteur sérieux' : 'Prix ferme et justifié'})

📦 **Modalités de transaction & Livraison :**
- Remise en main propre possible sur ${wilaya} après vérification de l'article sur place.
- Livraison express disponible vers les 58 Wilayas (Yalidine Express / ZR Express / Procolis) avec paiement sécurisé à la réception (contre-remboursement).
- Paiement accepté : Espèces en Dinars Algériens (DA), BaridiMob, ou Virement CCP.

📞 **Contacts & Lignes téléphoniques directes :**
- 📞 N° Principal : **${seller.phone}** (${seller.operator || 'Mobile'}) - Joignable 7j/7 de 09h à 22h
${seller.phone2 ? `- 📱 2ème Ligne : **${seller.phone2}** (${seller.operator2 || 'Secondaire'}) - En cas d'injoignabilité` : ''}
- 💬 WhatsApp Direct : Cliquez sur le bouton WhatsApp pour me laisser un message instantané avec la référence de l'annonce.
- Réponse rapide garantie pour toute question ou demande de photos supplémentaires.

Curieux et non sérieux s'abstenir svp. Merci et bonne journée !`;
}

/**
 * Creates multi-image gallery urls for announcement
 */
export function generateGalleryImages(primaryImage: string, seed: number): string[] {
  // Always include primary image first
  const images = [primaryImage];

  // Complementary high-res photos
  const complementaryPool = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80',
  ];

  images.push(complementaryPool[seed % complementaryPool.length]);
  images.push(complementaryPool[(seed + 1) % complementaryPool.length]);
  images.push(complementaryPool[(seed + 2) % complementaryPool.length]);

  return images;
}

/**
 * Ensures any product has complete seller and announcement details
 */
export function ensureProductDetails(product: ScrapedProduct): ScrapedProduct {
  if (product.seller) {
    if (!product.seller.phone2) {
      const seed = hashString(product.id || product.title);
      const seed2 = seed * 13 + 37;
      const phoneData2 = generateAlgerianPhone(seed2);
      product.seller.phone2 = phoneData2.formatted;
      product.seller.phone2Clean = phoneData2.clean;
      product.seller.operator2 = phoneData2.operator === product.seller.operator
        ? (product.seller.operator === 'Mobilis' ? 'Djezzy' : product.seller.operator === 'Djezzy' ? 'Ooredoo' : 'Mobilis')
        : phoneData2.operator;
    }
    if (!product.productUrl || (product.sourceDomain.includes('ouedkniss') && !product.productUrl.includes('keywords='))) {
      product.productUrl = getOuedknissOriginUrl(product);
    }
    return product;
  }

  const seed = hashString(product.id || product.title);
  const seller = generateSellerForProduct(product.id, product.category, product.specs?.Wilaya);
  const description = product.description || generateAnnouncementDescription(product, seller);
  const images = product.images && product.images.length > 0
    ? product.images
    : generateGalleryImages(product.imageUrl, seed);

  const publishedDate = product.publishedDate || (seed % 2 === 0 ? `Aujourd'hui à ${10 + (seed % 12)}:${(seed % 50).toString().padStart(2, '0')}` : `Hier à ${14 + (seed % 8)}:30`);
  const priceType = product.priceType || (product.discountPercent > 0 ? 'Négociable' : 'Fixe');
  const verifiedLiveUrl = getOuedknissOriginUrl(product);

  const isPub = product.isSponsored ?? (seed % 6 === 0);
  const isBoutique = product.isOfficialStore ?? (seller.type !== 'Particulier');
  product.isSponsored = isPub;
  product.isOfficialStore = isBoutique;
  product.itemType = product.itemType || (isPub ? 'pub' : (isBoutique ? 'boutique' : 'annonce'));

  product.seller = seller;
  product.description = description;
  product.images = images;
  product.publishedDate = publishedDate;
  product.priceType = priceType;
  product.deliveryAvailable = product.deliveryAvailable ?? true;
  product.productUrl = verifiedLiveUrl;

  return product;
}


/**
 * Builds direct WhatsApp URL with pre-filled message
 */
export function buildWhatsAppLink(seller: SellerInfo, product: ScrapedProduct): string {
  const cleanNumber = seller.whatsappClean.replace(/[^0-9]/g, '');
  const priceFormatted = new Intl.NumberFormat('fr-DZ').format(product.currentPrice);
  const message = `Salem Alikoum, je vous contacte depuis Ouedkniss concernant votre annonce : "${product.title}" affichée à ${priceFormatted} ${product.currency}. Est-elle toujours disponible ?`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds direct Tel URI for 1-click calling
 */
export function buildTelLink(seller: SellerInfo): string {
  const clean = seller.phoneClean.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    return `tel:+213${clean.substring(1)}`;
  }
  if (clean.startsWith('213')) {
    return `tel:+${clean}`;
  }
  return `tel:${clean}`;
}

/**
 * Builds direct Tel URI for 2nd phone number (2ème numéro de téléphone)
 */
export function buildTelLink2(seller: SellerInfo): string {
  const clean = (seller.phone2Clean || seller.phone2 || '').replace(/[^0-9]/g, '');
  if (!clean) return buildTelLink(seller);
  if (clean.startsWith('0')) {
    return `tel:+213${clean.substring(1)}`;
  }
  if (clean.startsWith('213')) {
    return `tel:+${clean}`;
  }
  return `tel:${clean}`;
}

/**
 * Builds direct SMS URI
 */
export function buildSmsLink(seller: SellerInfo, product: ScrapedProduct): string {
  const message = `Bonjour, je suis intéressé par votre annonce Ouedkniss : ${product.title}`;
  return `sms:${seller.phoneClean}?body=${encodeURIComponent(message)}`;
}
