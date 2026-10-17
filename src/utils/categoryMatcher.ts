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
    .replace(/[^a-z0-9\s]/g, ' ') // replace punctuation with spaces
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
 * Universal Category Matcher
 * Accurately determines if a product belongs to the selected category.
 * Matches across category name, slug, keywords, title, specs, and brand.
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

  const normCat = normalizeText(selectedCat);
  const normPCat = normalizeText(productCategory);
  const normTitle = normalizeText(productTitle);
  const normBrand = normalizeText(productBrand);

  // 1. Direct normalized equality or substring
  if (normPCat === normCat) return true;
  if (normPCat && normCat && (normPCat.includes(normCat) || normCat.includes(normPCat))) {
    return true;
  }

  // 2. Map standard category key
  let catKey = '';
  for (const key of Object.keys(CATEGORY_KEYWORDS)) {
    if (normCat.includes(key) || key.includes(normCat)) {
      catKey = key;
      break;
    }
  }

  // If selectedCat didn't match a direct key, check keywords in selectedCat
  if (!catKey) {
    for (const [key, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => normCat.includes(kw) || kw.includes(normCat))) {
        catKey = key;
        break;
      }
    }
  }

  if (catKey && CATEGORY_KEYWORDS[catKey]) {
    const keywords = CATEGORY_KEYWORDS[catKey];

    // Check if product's category contains any keyword
    if (normPCat && keywords.some((kw) => normPCat.includes(kw))) {
      return true;
    }

    // Check if product's title contains any keyword (critical for generic category "Annonces Ouedkniss" or "E-Commerce")
    if (normTitle && keywords.some((kw) => normTitle.includes(kw))) {
      return true;
    }

    // Check brand
    if (normBrand && keywords.some((kw) => normBrand.includes(kw))) {
      return true;
    }

    // Check specs
    if (productSpecs) {
      const specsStr = normalizeText(Object.values(productSpecs).join(' '));
      if (keywords.some((kw) => specsStr.includes(kw))) {
        return true;
      }
    }
  }

  // 3. Fallback token overlap
  const catTokens = normCat.split(' ').filter((w) => w.length >= 3);
  const prodTokens = `${normPCat} ${normTitle}`.split(' ').filter((w) => w.length >= 3);

  const overlap = catTokens.some((ct) => prodTokens.some((pt) => pt.includes(ct) || ct.includes(pt)));
  return overlap;
}

/**
 * Universal Sub-Category / Department Matcher
 * Handles intelligent matching of chips (e.g. "Smartphones 5G", "Ventes Flash", "Voitures Moins de 100k km").
 */
export function matchSubcategory(
  product: ScrapedProduct,
  subCategory: string | undefined | null
): boolean {
  if (!subCategory || subCategory === 'all' || subCategory === 'tout') {
    return true;
  }

  const normSub = normalizeText(subCategory);

  // 1. Special Feature Chips
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
    return (product.reviewsCount || 0) >= 200 || (product.discountPercent || 0) >= 10;
  }

  // 2. Keyword based matching against title, category, brand, specs
  const subTokens = normSub.split(' ').filter((t) => t.length >= 3 && !['les', 'des', 'aux', 'pour', 'avec', 'sans', 'dans'].includes(t));
  if (subTokens.length === 0) return true;

  const searchable = normalizeText(
    `${product.title} ${product.category} ${product.brand || ''} ${Object.values(product.specs || {}).join(' ')}`
  );
  const compressed = searchable.replace(/\s+/g, '');

  return subTokens.some((token) => tokenMatchesText(searchable, compressed, token));
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
