import { ScrapedProduct } from '../types';
import { isOfficialStoreProduct } from './sellerGenerator';

/**
 * Text normalizer: removes diacritics/accents, converts to lowercase,
 * replaces punctuation with spaces, and condenses multiple spaces into one.
 * e.g. "Téléphones & Tablettes!" -> "telephones tablettes"
 */
export function normalizeText(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (é->e, à->a, etc.)
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // preserves all Unicode letters (Arabic, Latin) & numbers
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Simple French/English word stemmer (strips plural 's', 'es', 'x')
 */
export function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') || word.endsWith('x')) return word.slice(0, -1);
  return word;
}

const COMMON_ABBREVIATIONS: Record<string, string[]> = {
  ps5: ['playstation 5', 'playstation', 'ps 5'],
  ps4: ['playstation 4', 'playstation', 'ps 4'],
  ps3: ['playstation 3', 'ps 3'],
  pc: ['ordinateur', 'laptop', 'desktop'],
  tv: ['television', 'televiseur', 'smart tv', 'qled', 'oled'],
  vtt: ['velo', 'bicyclette', 'rockrider'],
  tel: ['telephone', 'smartphone'],
  auto: ['automobile', 'voiture', 'vehicule'],
  btp: ['travaux', 'chantier', 'engin'],
};

/**
 * Checks whether text or its compressed form contains a token,
 * with plural/singular stemming, abbreviations (ps5, tv, pc...),
 * and joined-word flexibility (e.g. "r line" vs "rline").
 */
export function tokenMatchesText(text: string, compressedText: string, token: string): boolean {
  if (!token) return true;
  // 1. Direct substring
  if (text.includes(token)) return true;

  // 2. Compressed substring (e.g. "rline" matches "r line", "ps5" matches "ps 5")
  const compToken = token.replace(/\s+/g, '');
  if (compToken.length >= 3 && compressedText.includes(compToken)) return true;

  // 3. Common abbreviations (e.g. "ps5" matches "playstation 5")
  if (COMMON_ABBREVIATIONS[compToken]) {
    const aliases = COMMON_ABBREVIATIONS[compToken];
    if (
      aliases.some(
        (al) => text.includes(al) || compressedText.includes(al.replace(/\s+/g, ''))
      )
    ) {
      return true;
    }
  }

  // 4. Stemmed token (e.g. token "iphones" matches "iphone", "voitures" matches "voiture")
  const st = stem(token);
  if (st.length >= 3 && text.includes(st)) return true;

  // 5. Word-by-word stem check
  const words = text.split(' ');
  for (const w of words) {
    if (w.length >= 3) {
      if (stem(w) === st || (w.length >= 4 && token.includes(w))) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks whether text contains all search tokens (in any order).
 */
export function containsAllTokens(text: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const compressed = text.replace(/\s+/g, '');
  for (const token of tokens) {
    if (!tokenMatchesText(text, compressed, token)) return false;
  }
  return true;
}

/**
 * Checks whether text contains at least one search token.
 */
export function containsAnyToken(text: string, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const compressed = text.replace(/\s+/g, '');
  for (const token of tokens) {
    if (tokenMatchesText(text, compressed, token)) return true;
  }
  return false;
}

/**
 * Comprehensive Category Semantic Keywords dictionary
 * Maps category keys to aliases, brand names, product types, and vocabulary.
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  telephones: [
    'telephone', 'telephones', 'smartphone', 'smartphones', 'tablette', 'tablettes',
    'iphone', 'apple', 'samsung', 'galaxy', 'redmi', 'xiaomi', 'oppo', 'realme',
    'huawei', 'pixel', 'ipad', 'smartwatch', 'montre connectee', 'airpods',
    'chargeur', 'coque', 'ecouteur', 'ecouteurs', 'bluetooth', '5g', '4g', 'infinix', 'tecno'
  ],
  automobiles: [
    'automobile', 'automobiles', 'vehicule', 'vehicules', 'voiture', 'voitures',
    'auto', 'moto', 'motos', 'scooter', 'scooters', 'camion', 'camions', 'engin', 'engins',
    'clio', 'golf', 'renault', 'volkswagen', 'peugeot', 'seat', 'dacia', 'hyundai',
    'kia', 'audi', 'bmw', 'mercedes', 'toyota', 'skoda', 'chevrolet', 'nissan',
    'r line', 'gt line', 'tdi', 'dci', 'hdi', 'boite auto', 'dsg', 'safia', '00 peinture',
    'bateau', 'barque', 'remorque', 'caravane'
  ],
  informatique: [
    'informatique', 'ordinateur', 'ordinateurs', 'laptop', 'laptops', 'pc', 'bureau',
    'macbook', 'asus', 'rog', 'dell', 'hp', 'lenovo', 'acer', 'msi', 'gamer', 'gaming',
    'rtx', 'gtx', 'intel', 'core', 'ryzen', 'amd', 'ssd', 'ram', 'ecran', 'moniteur',
    'clavier', 'souris', 'imprimante', 'scanner', 'serveur', 'wifi', 'routeur'
  ],
  electromenager: [
    'electromenager', 'electromenagers', 'tv', 'television', 'televiseur', 'climatiseur',
    'climatiseurs', 'refrigerateur', 'frigo', 'congelateur', 'machine a laver', 'lave linge',
    'lave vaisselle', 'four', 'cuisiniere', 'micro ondes', 'aspirateur', 'condor',
    'brandt', 'lg', 'samsung', 'beko', 'iris', 'sonashi', 'inverter', 'qled', 'oled', '4k'
  ],
  'pieces-detachees': [
    'piece', 'pieces', 'detachee', 'detachees', 'accessoire', 'accessoires',
    'pneu', 'pneus', 'jante', 'jantes', 'roue', 'roues', 'moteur', 'boite', 'boites',
    'turbo', 'injecteur', 'injecteurs', 'optique', 'optiques', 'phare', 'phares',
    'feu', 'feux', 'frein', 'freins', 'plaquette', 'plaquettes', 'disque', 'disques',
    'amortisseur', 'suspension', 'filtre', 'batterie', 'carrosserie', 'retroviseur',
    'michelin', 'pirelli', 'bosch', 'valeo'
  ],
  'jeux-video': [
    'jeu', 'jeux', 'video', 'console', 'consoles', 'gaming', 'gamer',
    'playstation', 'ps5', 'ps4', 'ps3', 'sony', 'nintendo', 'switch', 'oled',
    'xbox', 'series', 'manette', 'manettes', 'dualsense', 'fifa', 'fc 24', 'fc 25',
    'gta', 'zelda', 'call of duty', 'vr'
  ],
  vetements: [
    'vetement', 'vetements', 'mode', 'habit', 'habits', 'chaussure', 'chaussures',
    'basket', 'baskets', 'sneaker', 'sneakers', 'montre', 'montres', 'rolex',
    'nike', 'adidas', 'puma', 'lacoste', 'zara', 'pull', 'veste', 'manteau',
    'pantalon', 'jean', 'jeans', 't shirt', 'chemise', 'costume', 'robe', 'sac',
    'maroquinerie', 'bijou', 'bijoux', 'parfum', 'tn', 'air max', 'jordan'
  ],
  maison: [
    'maison', 'fourniture', 'fournitures', 'meuble', 'meubles', 'mobilier',
    'salon', 'salons', 'canape', 'canapes', 'fauteuil', 'chambre', 'chambres',
    'lit', 'lits', 'matelas', 'armoire', 'armoires', 'dressing', 'table', 'tables',
    'chaise', 'chaises', 'cuisine', 'decoration', 'tapis', 'rideau', 'rideaux',
    'luminaire', 'lustre', 'led', 'bois', 'velours'
  ],
  immobilier: [
    'immobilier', 'immobiliere', 'terrain', 'terrains', 'appartement', 'appartements',
    'villa', 'villas', 'studio', 'studios', 'f1', 'f2', 'f3', 'f4', 'f5',
    'duplex', 'niveau de villa', 'carcasse', 'hangar', 'local', 'locaux', 'magasin',
    'bureau', 'location', 'vente', 'acte', 'livret foncier', 'standing'
  ],
  'sports-loisirs': [
    'sport', 'sports', 'loisir', 'loisirs', 'velo', 'velos', 'vtt', 'bicyclette',
    'tapis de course', 'musculation', 'fitness', 'haltere', 'halteres', 'banc',
    'ballon', 'football', 'maillot', 'chasse', 'peche', 'camping', 'tente',
    'piscine', 'trottinette', 'rockrider', 'domyos', 'decathlon'
  ],
  'materiaux-equipement': [
    'materiau', 'materiaux', 'equipement', 'equipements', 'outillage', 'outil', 'outils',
    'groupe electrogene', 'cummins', 'poste a souder', 'inverter', 'soudure',
    'compresseur', 'perceuse', 'meuleuse', 'visseuse', 'echafaudage', 'btp',
    'chantier', 'bosch pro', 'makita', 'dewalt', 'stanley', 'karcher'
  ],
  services: [
    'service', 'services', 'artisanat', 'artisan', 'artisans', 'travaux',
    'peinture', 'peintre', 'platre', 'ba13', 'stucco', 'plomberie', 'plombier',
    'electricite', 'electricien', 'demenagement', 'transport', 'transporteur',
    'nettoyage', 'reparation', 'maintenance', 'installation', 'formation', 'cours'
  ],
  'voyages-tourisme': [
    'voyage', 'voyages', 'tourisme', 'omra', 'hadj', 'hotel', 'hotels',
    'billet', 'billetterie', 'sejour', 'vol', 'visa', 'excursion', 'guide',
    'turquie', 'tunisie', 'dubai', 'malaisie', 'air algerie'
  ],
  'alimentation-agriculture': [
    'alimentation', 'alimentaire', 'agriculture', 'agricole', 'terroir', 'terroirs',
    'datte', 'dattes', 'deglet nour', 'huile', 'olive', 'miel', 'naturel',
    'pure', 'fruit', 'fruits', 'legume', 'legumes', 'biskra', 'kabylie',
    'tracteur', 'engrais', 'semence', 'plante', 'plants'
  ],
  'vetements-mode': [
    'vetement', 'vetements', 'mode', 'habit', 'habits', 'chaussure', 'chaussures',
    'basket', 'baskets', 'sneaker', 'sneakers', 'montre', 'montres', 'rolex',
    'nike', 'adidas', 'puma', 'lacoste', 'zara', 'pull', 'veste', 'manteau',
    'pantalon', 'jean', 'jeans', 't shirt', 'chemise', 'costume', 'robe', 'sac',
    'maroquinerie', 'bijou', 'bijoux', 'parfum', 'tn', 'air max', 'jordan'
  ],
  'maison-meubles': [
    'maison', 'fourniture', 'fournitures', 'meuble', 'meubles', 'mobilier',
    'salon', 'salons', 'canape', 'canapes', 'fauteuil', 'chambre', 'chambres',
    'lit', 'lits', 'matelas', 'armoire', 'armoires', 'dressing', 'table', 'tables',
    'chaise', 'chaises', 'cuisine', 'decoration', 'tapis', 'rideau', 'rideaux',
    'luminaire', 'lustre', 'led', 'bois', 'velours'
  ],
  materiaux: [
    'materiau', 'materiaux', 'equipement', 'equipements', 'outillage', 'outil', 'outils',
    'groupe electrogene', 'cummins', 'poste a souder', 'inverter', 'soudure',
    'compresseur', 'perceuse', 'meuleuse', 'visseuse', 'echafaudage', 'btp',
    'chantier', 'bosch pro', 'makita', 'dewalt', 'stanley', 'karcher'
  ],
  animaux: [
    'animal', 'animaux', 'chien', 'chiens', 'chiot', 'chiots', 'chat', 'chats', 'chaton',
    'oiseau', 'oiseaux', 'perruche', 'canari', 'cheval', 'poulain', 'croquette', 'croquettes',
    'cage', 'aquarium', 'berger allemand', 'huskie', 'persan'
  ],
  'bebes-enfants': [
    'bebe', 'bebes', 'enfant', 'enfants', 'poussette', 'poussettes', 'lit bebe', 'berceau',
    'jouet', 'jouets', 'chicco', 'biberon', 'siege auto', 'puericulture', 'transat'
  ],
  emploi: [
    'emploi', 'recrutement', 'travail', 'poste', 'offre', 'offres', 'candidature',
    'developpeur', 'ingenieur', 'commercial', 'comptable', 'secretaire',
    'chauffeur', 'vendeur', 'stage', 'cdi', 'cdd'
  ],
};

/**
/**
 * 17 Canonical Ouedkniss Category Slugs
 */
export const CANONICAL_CATEGORY_SLUGS = [
  'automobiles',
  'pieces-detachees',
  'telephones',
  'informatique',
  'electromenager',
  'immobilier',
  'maison',
  'vetements',
  'jeux-video',
  'sports-loisirs',
  'materiaux',
  'services',
  'voyages-tourisme',
  'alimentation-agriculture',
  'animaux',
  'bebes-enfants',
  'emploi',
] as const;

export type CanonicalCategorySlug = (typeof CANONICAL_CATEGORY_SLUGS)[number];

/**
 * Resolves any category label, slug, or search filter into its exact canonical slug
 */
export function resolveCategorySlug(categoryNameOrSlug: string | undefined | null): string {
  if (!categoryNameOrSlug || categoryNameOrSlug === 'all' || categoryNameOrSlug === 'all-categories') {
    return 'all';
  }
  const norm = normalizeText(categoryNameOrSlug);

  if (norm.includes('auto') || norm.includes('vehicule') || norm.includes('voiture') || norm.includes('moto') || norm.includes('camion')) {
    if (norm.includes('piece') || norm.includes('detachee')) return 'pieces-detachees';
    return 'automobiles';
  }
  if (norm.includes('piece') || norm.includes('detachee') || norm.includes('pneu') || norm.includes('jante')) {
    return 'pieces-detachees';
  }
  if (norm.includes('tel') || norm.includes('smart') || norm.includes('tablette') || norm.includes('iphone')) {
    return 'telephones';
  }
  if (norm.includes('info') || norm.includes('ordinateur') || norm.includes('laptop') || norm.includes('pc') || norm.includes('bureau')) {
    return 'informatique';
  }
  if (norm.includes('electro') || norm.includes('climatiseur') || norm.includes('refrigerat') || norm.includes('lave') || norm.includes('frigo')) {
    return 'electromenager';
  }
  if (norm.includes('immo') || norm.includes('terrain') || norm.includes('appart') || norm.includes('villa') || norm.includes('studio') || norm.includes('local')) {
    return 'immobilier';
  }
  if (norm.includes('maison') || norm.includes('meuble') || norm.includes('mobilier') || norm.includes('salon') || norm.includes('lit') || norm.includes('matelas')) {
    return 'maison';
  }
  if (norm.includes('vetement') || norm.includes('mode') || norm.includes('habit') || norm.includes('chaussure') || norm.includes('basket') || norm.includes('sneaker')) {
    return 'vetements';
  }
  if (norm.includes('jeu') || norm.includes('video') || norm.includes('console') || norm.includes('gaming') || norm.includes('playstation') || norm.includes('switch') || norm.includes('xbox')) {
    return 'jeux-video';
  }
  if (norm.includes('sport') || norm.includes('loisir') || norm.includes('fitness') || norm.includes('velo') || norm.includes('vtt') || norm.includes('muscu')) {
    return 'sports-loisirs';
  }
  if (norm.includes('materiau') || norm.includes('outillage') || norm.includes('btp') || norm.includes('chantier') || norm.includes('groupe electrogene')) {
    return 'materiaux';
  }
  if (norm.includes('service') || norm.includes('artisan') || norm.includes('travaux') || norm.includes('demenag') || norm.includes('plomb') || norm.includes('peintr')) {
    return 'services';
  }
  if (norm.includes('voyage') || norm.includes('tourisme') || norm.includes('omra') || norm.includes('sejour') || norm.includes('hotel') || norm.includes('vol') || norm.includes('visa')) {
    return 'voyages-tourisme';
  }
  if (norm.includes('aliment') || norm.includes('agricol') || norm.includes('terroir') || norm.includes('datte') || norm.includes('miel') || norm.includes('huile')) {
    return 'alimentation-agriculture';
  }
  if (norm.includes('anim') || norm.includes('chien') || norm.includes('chat') || norm.includes('oiseau') || norm.includes('cheval')) {
    return 'animaux';
  }
  if (norm.includes('bebe') || norm.includes('enfant') || norm.includes('poussette') || norm.includes('puericulture') || norm.includes('biberon')) {
    return 'bebes-enfants';
  }
  if (norm.includes('emploi') || norm.includes('recrutement') || norm.includes('travail') || norm.includes('carriere') || norm.includes('candidature') || norm.includes('stage')) {
    return 'emploi';
  }

  // Exact slug match check
  for (const slug of CANONICAL_CATEGORY_SLUGS) {
    if (norm === slug || norm.replace(/\s+/g, '-') === slug) {
      return slug;
    }
  }

  return 'telephones'; // safe default
}

/**
 * Deterministically determines the canonical category of a product
 * Primary source: product.category, then product.productUrl, then product.title.
 */
export function getCanonicalCategorySlug(product: {
  category?: string | null;
  productUrl?: string | null;
  title?: string | null;
}): CanonicalCategorySlug {
  // 1. Direct URL path inspection (100% reliable on Ouedkniss links like ouedkniss.com/automobiles/...)
  if (product.productUrl) {
    const pUrl = product.productUrl.toLowerCase();
    for (const slug of CANONICAL_CATEGORY_SLUGS) {
      if (pUrl.includes(`/${slug}`) || pUrl.includes(`-${slug}-`)) {
        return slug;
      }
    }
    if (pUrl.includes('/voitures-') || pUrl.includes('/automobiles')) return 'automobiles';
    if (pUrl.includes('/telephones-') || pUrl.includes('/smartphones')) return 'telephones';
    if (pUrl.includes('/informatique-') || pUrl.includes('/laptops')) return 'informatique';
    if (pUrl.includes('/voyages-') || pUrl.includes('/omra')) return 'voyages-tourisme';
  }

  // 2. Product's defined category field
  if (product.category && product.category !== 'Général' && product.category !== 'Annonces Ouedkniss Algérie') {
    const slug = resolveCategorySlug(product.category);
    if (slug !== 'all' && (CANONICAL_CATEGORY_SLUGS as readonly string[]).includes(slug)) {
      return slug as CanonicalCategorySlug;
    }
  }

  // 3. Title analysis if category was generic/empty
  const titleNorm = normalizeText(product.title);

  // Automobiles
  if (
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'clio') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'golf') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'peugeot') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'renault') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'volkswagen') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'dacia') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'hyundai') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'kia') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'audi') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'bmw') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'mercedes') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'seat') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'skoda') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'scooter') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'moto') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'camion') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'safia') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), '00 peinture') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'dci') ||
    tokenMatchesText(titleNorm, titleNorm.replace(/\s+/g, ''), 'tdi')
  ) {
    return 'automobiles';
  }

  // Voyages & Tourisme
  if (
    titleNorm.includes('omra') ||
    titleNorm.includes('hadj') ||
    titleNorm.includes('sejour turquie') ||
    titleNorm.includes('voyage organise') ||
    titleNorm.includes('vol alger') ||
    titleNorm.includes('billet avion') ||
    titleNorm.includes('visa touristique')
  ) {
    return 'voyages-tourisme';
  }

  // Phones & Tablets
  if (
    titleNorm.includes('iphone') ||
    titleNorm.includes('galaxy s') ||
    titleNorm.includes('redmi') ||
    titleNorm.includes('xiaomi') ||
    titleNorm.includes('oppo') ||
    titleNorm.includes('realme') ||
    titleNorm.includes('ipad') ||
    titleNorm.includes('smartphone') ||
    titleNorm.includes('airpods')
  ) {
    return 'telephones';
  }

  // Gaming
  if (
    titleNorm.includes('ps5') ||
    titleNorm.includes('playstation') ||
    titleNorm.includes('switch oled') ||
    titleNorm.includes('xbox series') ||
    titleNorm.includes('dualsense')
  ) {
    return 'jeux-video';
  }

  // Informatique
  if (
    titleNorm.includes('rtx') ||
    titleNorm.includes('macbook') ||
    titleNorm.includes('rog strix') ||
    titleNorm.includes('victus') ||
    titleNorm.includes('laptop') ||
    titleNorm.includes('pc gamer')
  ) {
    return 'informatique';
  }

  // Électroménager
  if (
    titleNorm.includes('climatiseur') ||
    titleNorm.includes('smart tv') ||
    titleNorm.includes('refrigerateur') ||
    titleNorm.includes('machine a laver')
  ) {
    return 'electromenager';
  }

  return 'telephones';
}

/**
 * Universal Unified Category Matcher:
 * Ensures 100% strict matching across screens.
 * When filtering by 'automobiles', will NEVER return smartphones or trips.
 */
export function matchCategory(
  productCategory: string | undefined | null,
  selectedCat: string | undefined | null,
  productTitle?: string,
  productBrand?: string,
  productSpecs?: Record<string, string>
): boolean {
  if (!selectedCat || selectedCat === 'all' || selectedCat === 'all-categories') {
    return true;
  }

  const selectedSlug = resolveCategorySlug(selectedCat);
  if (selectedSlug === 'all') return true;

  // Resolve product canonical category
  const productSlug = getCanonicalCategorySlug({
    category: productCategory,
    title: productTitle,
  });

  return productSlug === selectedSlug;
}

/**
 * Universal Sub-Category / Department Matcher
 * Strictly filters within the canonical department so chips NEVER cross-contaminate.
 */
export function matchSubcategory(
  product: ScrapedProduct,
  subCategory: string | undefined | null
): boolean {
  if (!subCategory || subCategory === 'all' || subCategory === 'tout' || subCategory.startsWith('Tout (')) {
    return true;
  }

  const normSub = normalizeText(subCategory);

  // 1. Universal Feature Chips (work across all categories)
  if (normSub.includes('flash') || normSub.includes('reduction') || normSub.includes('80')) {
    return (product.discountPercent || 0) >= 15 || product.itemType === 'pub';
  }

  if (normSub.includes('livraison') || normSub.includes('58w') || normSub.includes('58 wilayas')) {
    return product.deliveryAvailable !== false;
  }

  if (normSub.includes('note') || normSub.includes('avis') || normSub.includes('4 8') || normSub.includes('4 5')) {
    return (product.rating || 0) >= 4.5;
  }

  if (normSub.includes('boutique') || normSub.includes('store') || normSub.includes('pro') || normSub.includes('officiel')) {
    return Boolean(isOfficialStoreProduct(product));
  }

  if (normSub.includes('10 000') || normSub.includes('10k') || normSub.includes('5 000') || normSub.includes('5k')) {
    const max = normSub.includes('5 000') || normSub.includes('5k') ? 5000 : 10000;
    return (product.currentPrice || 0) <= max;
  }

  if (normSub.includes('meilleure') || normSub.includes('top vente')) {
    return (product.reviewsCount || 0) >= 200 || (product.discountPercent || 0) >= 8;
  }

  // 2. Specific Vehicle chips
  if (normSub.includes('golf') || normSub.includes('allemande')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'automobiles') return false;
    const t = normalizeText(product.title);
    return t.includes('golf') || t.includes('volkswagen') || t.includes('audi') || t.includes('seat') || t.includes('skoda') || t.includes('bmw') || t.includes('mercedes');
  }

  if (normSub.includes('clio') || normSub.includes('gt line')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'automobiles') return false;
    const t = normalizeText(product.title);
    return t.includes('clio') || t.includes('renault') || t.includes('dci') || t.includes('gt line');
  }

  if (normSub.includes('00 peinture') || normSub.includes('safia')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'automobiles') return false;
    const t = normalizeText(`${product.title} ${Object.values(product.specs || {}).join(' ')}`);
    return t.includes('00 peinture') || t.includes('safia') || t.includes('origine') || t.includes('neuf');
  }

  if (normSub.includes('suv') || normSub.includes('4x4')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'automobiles') return false;
    const t = normalizeText(product.title);
    return t.includes('suv') || t.includes('4x4') || t.includes('duster') || t.includes('tucson') || t.includes('sportage') || t.includes('tiguan');
  }

  if (normSub.includes('moto') || normSub.includes('scooter')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'automobiles') return false;
    const t = normalizeText(product.title);
    return t.includes('moto') || t.includes('scooter') || t.includes('tmax') || t.includes('sym') || t.includes('vespa');
  }

  if (normSub.includes('camion') || normSub.includes('btp')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'automobiles') return false;
    const t = normalizeText(product.title);
    return t.includes('camion') || t.includes('engin') || t.includes('jcb') || t.includes('tracteur') || t.includes('isuzu') || t.includes('sonacome');
  }

  // 3. Specific Phone chips
  if (normSub.includes('iphone')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'telephones') return false;
    const t = normalizeText(product.title);
    return t.includes('iphone') || t.includes('apple');
  }

  if (normSub.includes('galaxy') || normSub.includes('samsung')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'telephones') return false;
    const t = normalizeText(product.title);
    return t.includes('galaxy') || t.includes('samsung');
  }

  if (normSub.includes('5g')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'telephones') return false;
    const t = normalizeText(product.title);
    return t.includes('5g');
  }

  if (normSub.includes('tablette') || normSub.includes('ipad')) {
    const can = getCanonicalCategorySlug(product);
    if (can !== 'telephones') return false;
    const t = normalizeText(product.title);
    return t.includes('tablette') || t.includes('ipad');
  }

  // Fallback: match tokens strictly within product
  const subTokens = normSub.split(' ').filter((t) => t.length >= 3 && !['les', 'des', 'aux', 'pour', 'avec', 'sans', 'dans'].includes(t));
  if (subTokens.length === 0) return true;

  const searchable = normalizeText(
    `${product.title} ${product.brand || ''} ${Object.values(product.specs || {}).join(' ')}`
  );
  return subTokens.some((token) => searchable.includes(token));
}

/**
 * Universal Multi-Token Real-Time Search Matcher
 * Supports tokenized search: every typed word must match somewhere in the product.
 * Handles diacritics, punctuation, brand names, Wilayas, specifications and descriptions.
 */
export function matchSearchQuery(product: ScrapedProduct, query: string): boolean {
  if (!query || !query.trim()) return true;

  const normQuery = normalizeText(query);
  const tokens = normQuery.split(' ').filter((t) => t.length > 0);
  if (tokens.length === 0) return true;

  const searchable = normalizeText(
    `${product.title} ${product.brand || ''} ${product.category || ''} ${
      product.seller?.name || ''
    } ${product.seller?.wilaya || ''} ${product.specs?.Wilaya || ''} ${Object.values(
      product.specs || {}
    ).join(' ')} ${product.description || ''} ${product.sourceDomain || ''}`
  );

  return containsAllTokens(searchable, tokens);
}

/**
 * Temu Categories Configuration for the Temu E-Commerce Hub
 * High-fidelity representation matching the official Temu application layout.
 */
export interface TemuDepartment {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  badge?: string;
  color: string;
  subcategories: string[];
}

export const TEMU_OFFICIAL_DEPARTMENTS: TemuDepartment[] = [
  {
    id: 'for_you',
    name: '🌟 Pour Vous',
    slug: 'all',
    iconName: 'Sparkles',
    badge: 'Recommandé',
    color: '#fb5200',
    subcategories: [
      '🔥 Meilleures Ventes',
      '⚡ Ventes Flash -50%',
      '📦 Livraison Gratuite',
      '⭐ Notés 4.8★+',
      '🏪 Boutiques Officielles',
      '💰 Moins de 10 000 DA',
      '🇩🇿 Vendeurs Vérifiés 58W',
    ],
  },
  {
    id: 'flash_deals',
    name: '⚡ Ventes Flash',
    slug: 'ventes-flash',
    iconName: 'Zap',
    badge: 'Chrono',
    color: '#eab308',
    subcategories: [
      'Toutes les offres urgentes',
      '🔥 Jusqu\'à -80%',
      '📱 Tech & Smartphones -20%',
      '👗 Mode & Baskets -40%',
      '🏠 Maison & Déco -30%',
      '🎮 Consoles & Gaming Promo',
    ],
  },
  {
    id: 'telephones',
    name: '📱 Téléphones & Tablettes',
    slug: 'telephones',
    iconName: 'Smartphone',
    badge: 'Top Ventes',
    color: '#00f0ff',
    subcategories: [
      'iPhones scellés & occasion',
      'Samsung Galaxy S24 / S23',
      'Smartphones 5G',
      'Xiaomi & Redmi',
      'Tablettes iPad & Android',
      'Smartwatches & Bracelets',
      'Écouteurs sans fil & Airpods',
      'Chargeurs & Câbles originaux',
    ],
  },
  {
    id: 'informatique',
    name: '💻 Informatique & Gaming',
    slug: 'informatique',
    iconName: 'Laptop',
    badge: 'Tech Pro',
    color: '#a855f7',
    subcategories: [
      'Laptops Gamer RTX 4070/4080',
      'MacBook M3 & Pro',
      'PC Portables Bureautique',
      'Écrans 144Hz / 240Hz',
      'Claviers & Souris RGB',
      'Disques SSD 1TB / 2TB',
      'Imprimantes Laser & Cartouches',
    ],
  },
  {
    id: 'automobiles',
    name: '🚗 Véhicules & Voitures',
    slug: 'automobiles',
    iconName: 'Car',
    badge: 'Marché N°1 DZ',
    color: '#00ff66',
    subcategories: [
      'Golf 8 & Allemandes',
      'Clio 4 / 5 GT Line',
      'Voitures 00 Peinture / Safia',
      'SUV & 4x4',
      'Motos & Scooters',
      'Camions & Engins BTP',
    ],
  },
  {
    id: 'maison',
    name: '🏠 Maison & Cuisine',
    slug: 'maison',
    iconName: 'Home',
    badge: 'Confort',
    color: '#f97316',
    subcategories: [
      'Salons d\'angle Velours',
      'Chambres à Coucher',
      'Tables & Chaises Design',
      'Matelas Orthopédiques',
      'Batteries de Cuisine & Poêles',
      'Luminaires LED & Déco',
    ],
  },
  {
    id: 'vetements',
    name: '👗 Mode & Vêtements',
    slug: 'vetements',
    iconName: 'Shirt',
    badge: 'Tendance',
    color: '#ec4899',
    subcategories: [
      'Nike Air Max Plus TN & Sneakers',
      'Montres Rolex & Luxe',
      'Vestes & Manteaux Hiver',
      'Pulls & Sweatshirts',
      'Jeans & Pantalons Cargo',
      'Sacs à Main & Maroquinerie',
    ],
  },
  {
    id: 'electromenager',
    name: '⚡ Électroménager & TV',
    slug: 'electromenager',
    iconName: 'Tv',
    badge: 'Garantie 24M',
    color: '#3b82f6',
    subcategories: [
      'Smart TV 65" & 55" 4K',
      'Climatiseurs Tropicalisés Condor',
      'Réfrigérateurs No Frost',
      'Machines à Laver Inverter',
      'Fours & Plaques Encastrables',
      'Aspirateurs Balais Sans Fil',
    ],
  },
  {
    id: 'jeux-video',
    name: '🎮 Jeux Vidéo & Consoles',
    slug: 'jeux-video',
    iconName: 'Gamepad2',
    badge: 'PlayZone',
    color: '#8b5cf6',
    subcategories: [
      'PlayStation 5 Slim 1TB',
      'Nintendo Switch OLED',
      'Xbox Series X',
      'Manettes DualSense & Pro',
      'Jeux EA FC & GTA',
      'Casques Gaming Surround',
    ],
  },
  {
    id: 'pieces-detachees',
    name: '🔧 Pièces Auto & Mécanique',
    slug: 'pieces-detachees',
    iconName: 'Wrench',
    badge: 'Origine',
    color: '#10b981',
    subcategories: [
      'Pneus Michelin & Pirelli',
      'Injecteurs Bosch 1.5 DCI / TDI',
      'Turbos & Boîtes de vitesses',
      'Optiques LED & Phares',
      'Plaquettes de frein & Disques',
      'Batteries 12V 70Ah',
    ],
  },
  {
    id: 'sports-loisirs',
    name: '⚽ Sports & Fitness',
    slug: 'sports-loisirs',
    iconName: 'Trophy',
    badge: 'Forme',
    color: '#e11d48',
    subcategories: [
      'Vélos VTT Aluminium 29"',
      'Tapis de Course Motorisés',
      'Bancs & Haltères Musculation',
      'Maillots Officiels & Football',
      'Tentes & Équipement Camping',
    ],
  },
  {
    id: 'alimentation-agriculture',
    name: '🌾 Terroir DZ & Alimentation',
    slug: 'alimentation-agriculture',
    iconName: 'Utensils',
    badge: '100% Bio DZ',
    color: '#84cc16',
    subcategories: [
      'Dattes Deglet Nour Biskra',
      'Huile d\'Olive Pure Kabylie',
      'Miel Naturel de Montagne',
      'Fruits Secs & Amandes',
      'Matériel Apicole & Agricole',
    ],
  },
  {
    id: 'immobilier',
    name: '🏢 Immobilier & Locations',
    slug: 'immobilier',
    iconName: 'Building',
    badge: 'Notarié',
    color: '#06b6d4',
    subcategories: [
      'Appartements F3 / F4 Standing',
      'Villas Style Mauresque',
      'Studios Meublés Alger / Oran',
      'Terrains avec Acte & Livret',
      'Locaux Commerciaux & Hangars',
    ],
  },
  {
    id: 'voyages',
    name: '✈️ Voyages & Tourisme',
    slug: 'voyages-tourisme',
    iconName: 'Plane',
    badge: 'Évasion',
    color: '#0284c7',
    subcategories: [
      'Omra & Hadj Tout Compris',
      'Séjours Turquie & Istanbul',
      'Hôtels & Complexes Tunisie',
      'Billets d\'Avion Air Algérie',
      'Circuits Sud Algérien & Djanet',
    ],
  },
  {
    id: 'services',
    name: '💼 Services & Artisans',
    slug: 'services',
    iconName: 'Briefcase',
    badge: 'Vérifiés',
    color: '#6366f1',
    subcategories: [
      'Déménagement 58 Wilayas Express',
      'Peinture Stucco & BA13',
      'Plomberie & Chauffage Central',
      'Développement Web & Applications',
    ],
  },
  {
    id: 'materiaux',
    name: '🔨 Matériaux & Équipement Pro',
    slug: 'materiaux',
    iconName: 'Hammer',
    badge: 'Pro & BTP',
    color: '#f97316',
    subcategories: [
      'Groupes Électrogènes Cummins',
      'Postes à Souder Inverter',
      'Outillage Industriel & CNC',
      'Matériaux de Construction',
      'Matériel de Restauration',
    ],
  },
  {
    id: 'animaux',
    name: '🐾 Animaux & Accessoires',
    slug: 'animaux',
    iconName: 'Dog',
    badge: 'Élevage',
    color: '#d97706',
    subcategories: [
      'Chiens & Chiots LOF',
      'Chats de Race & Chatons',
      'Oiseaux & Perruches',
      'Accessoires & Cages',
      'Croquettes & Alimentation',
    ],
  },
  {
    id: 'bebes-enfants',
    name: '👶 Bébés & Enfants',
    slug: 'bebes-enfants',
    iconName: 'Baby',
    badge: 'Puériculture',
    color: '#f472b6',
    subcategories: [
      'Poussettes Chicco Trio',
      'Lits & Chambres Bébé',
      'Vêtements Bébé & Enfants',
      'Jouets d\'Éveil',
      'Sièges Auto & Biberons',
    ],
  },
  {
    id: 'emploi',
    name: '👔 Emploi & Recrutement',
    slug: 'emploi',
    iconName: 'Briefcase',
    badge: 'Carrières DZ',
    color: '#06b6d4',
    subcategories: [
      'Informatique & Tech',
      'Génie Civil & BTP',
      'Commerce & Vente',
      'Gestion & Finance',
      'Transport & Logistique',
    ],
  },
];

/**
 * Popular Trending Searches on Temu Algérie
 */
export const TEMU_HOT_TRENDING_SEARCHES = [
  { tag: 'iPhone 15 Pro Max', count: '14.2k recherches', badge: '🔥 #1' },
  { tag: 'Volkswagen Golf 8 R-Line', count: '11.8k recherches', badge: '🔥 #2' },
  { tag: 'PlayStation 5 Slim 1TB', count: '9.5k recherches', badge: '🔥 #3' },
  { tag: 'Samsung Galaxy S24 Ultra', count: '8.7k recherches', badge: '#4' },
  { tag: 'Renault Clio 4 GT Line', count: '7.9k recherches', badge: '#5' },
  { tag: 'Dattes Deglet Nour Biskra', count: '6.4k recherches', badge: '#6' },
  { tag: 'PC Gamer RTX 4070', count: '5.9k recherches', badge: '#7' },
  { tag: 'Nike Air Max Plus TN', count: '5.2k recherches', badge: '#8' },
  { tag: 'Condor Climatiseur 12000', count: '4.8k recherches', badge: '#9' },
  { tag: 'Rolex Submariner Date', count: '4.1k recherches', badge: '#10' },
  { tag: 'Nintendo Switch OLED', count: '3.8k recherches', badge: '#11' },
  { tag: 'Salon d\'angle velours', count: '3.4k recherches', badge: '#12' },
];
