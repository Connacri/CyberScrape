export interface OuedknissCategoryMeta {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  url: string;
  icon: string;
  color: string;
  gradient: string;
  badge: string;
  countEstimate: number;
  realPages?: number; // Exact official page count on Ouedkniss
  description: string;
  subcategories: string[];
}

/** Standard announcements per page on Ouedkniss desktop/tablet layout (7 rows of 4 = 28 ads/page) */
export const OUEDKNISS_STANDARD_ITEMS_PER_PAGE = 28;

export const OUEDKNISS_CATEGORIES: OuedknissCategoryMeta[] = [
  // 1. Véhicules & Automobiles
  {
    id: 'automobiles',
    name: 'Véhicules & Automobiles',
    nameAr: 'سيارات و مركبات',
    slug: 'automobiles',
    url: 'https://www.ouedkniss.com/automobiles',
    icon: 'Car',
    color: '#00ff66',
    gradient: 'from-emerald-500/20 to-green-500/5',
    badge: 'Marché N°1 DZ',
    countEstimate: 185400,
    description: 'Voitures occasion & 0km, 4x4, Motos, Camions, Pièces de rechange 58 Wilayas',
    subcategories: [
      'Voitures',
      'Motos & Scooters',
      'Camions & Engins BTP',
      'Remorques & Caravanes',
      'Bateaux & Barques',
    ],
  },
  // 2. Pièces détachées & Accessoires Auto
  {
    id: 'pieces-detachees',
    name: 'Pièces détachées Auto',
    nameAr: 'قطع غيار و إكسسوارات',
    slug: 'pieces-detachees',
    url: 'https://www.ouedkniss.com/pieces-detachees',
    icon: 'Cog',
    color: '#10b981',
    gradient: 'from-emerald-600/20 to-teal-500/5',
    badge: 'Stock 58W',
    countEstimate: 94200,
    description: 'Moteurs DCI/TDI, Pneus Michelin/Pirelli, Optiques LED, Turbos, Boîtes de vitesses',
    subcategories: [
      'Moteurs & Boîtes de vitesses',
      'Pneus, Jantes & Roues',
      'Optiques, Phares & Feux',
      'Carrosserie & Rétroviseurs',
      'Accessoires Intérieur & Multimédia',
    ],
  },
  // 3. Téléphones & Tablettes (Calibrage Réel Ouedkniss : 473 pages × 28 annonces = 13 244 articles)
  {
    id: 'telephones',
    name: 'Téléphones & Tablettes',
    nameAr: 'هواتف و لوحات إلكترونية',
    slug: 'telephones',
    url: 'https://www.ouedkniss.com/telephones',
    icon: 'Smartphone',
    color: '#00f0ff',
    gradient: 'from-cyan-500/20 to-blue-500/5',
    badge: 'Haute Rotation',
    realPages: 473,
    countEstimate: 13244,
    description: 'Smartphones récents, iPhones, Samsung Galaxy, Tablettes, Montres connectées (473 pages / 13 244 annonces)',
    subcategories: [
      'Smartphones 5G',
      'iPhones scellés & occasion',
      'Tablettes iPad & Android',
      'Smartwatches & Bracelets',
      'Accessoires & Chargeurs originaux',
    ],
  },
  // 4. Informatique & Bureau
  {
    id: 'informatique',
    name: 'Informatique & Bureau',
    nameAr: 'إعلام آلي و مكتبية',
    slug: 'informatique',
    url: 'https://www.ouedkniss.com/informatique',
    icon: 'Laptop',
    color: '#a855f7',
    gradient: 'from-purple-500/20 to-indigo-500/5',
    badge: 'Tech & Gaming',
    countEstimate: 87500,
    description: 'PC Gamer RTX 4090/4070, MacBooks M3, Écrans 240Hz, Imprimantes laser',
    subcategories: [
      'PC Portables Gamer & Pro',
      'PC Bureau & Unités Centrales',
      'Cartes Graphiques RTX & Composants',
      'Écrans & Périphériques',
      'Réseaux & Onduleurs Pro',
    ],
  },
  // 5. Électroménager & TV
  {
    id: 'electromenager',
    name: 'Électroménager & TV',
    nameAr: 'أجهزة كهرومنزلية',
    slug: 'electromenager',
    url: 'https://www.ouedkniss.com/electromenager',
    icon: 'Tv',
    color: '#ec4899',
    gradient: 'from-pink-500/20 to-rose-500/5',
    badge: 'Confort Maison',
    countEstimate: 64300,
    description: 'Climatiseurs Inverter Condor/LG, TV OLED 4K, Réfrigérateurs No-Frost, Machines à laver',
    subcategories: [
      'Téléviseurs Smart TV 4K/8K',
      'Climatiseurs & Chauffage Inverter',
      'Réfrigérateurs & Congélateurs',
      'Lave-linge & Lave-vaisselle',
      'Micro-ondes & Cuisinières',
    ],
  },
  // 6. Immobilier
  {
    id: 'immobilier',
    name: 'Immobilier',
    nameAr: 'عقارات',
    slug: 'immobilier',
    url: 'https://www.ouedkniss.com/immobilier',
    icon: 'Building2',
    color: '#ffbe0b',
    gradient: 'from-amber-500/20 to-yellow-500/5',
    badge: 'Actes Notariés',
    countEstimate: 98700,
    description: 'Villas haut standing, Appartements F3/F4 vue mer, Terrains avec Livret Foncier',
    subcategories: [
      'Appartements Vente & Location',
      'Villas & Maisons',
      'Terrains & Terrains Agricoles',
      'Locaux Commerciaux & Hangars',
      'Locations Vacances & Meublés',
    ],
  },
  // 7. Maison & Décoration / Meubles
  {
    id: 'maison-meubles',
    name: 'Maison & Décoration',
    nameAr: 'أثاث و ديكور',
    slug: 'maison-meubles',
    url: 'https://www.ouedkniss.com/maison-meubles',
    icon: 'Armchair',
    color: '#f43f5e',
    gradient: 'from-rose-500/20 to-orange-500/5',
    badge: 'Design & Confort',
    countEstimate: 54100,
    description: 'Salons marocains & modernes, Chambres à coucher bois noble, Dressings, Cuisines',
    subcategories: [
      'Salons & Fauteuils',
      'Chambres à coucher & Lits',
      'Cuisines équipées & Tables',
      'Tapis & Rideaux modernes',
      'Luminaires LED & Décoration',
    ],
  },
  // 8. Vêtements & Mode
  {
    id: 'vetements-mode',
    name: 'Vêtements & Mode',
    nameAr: 'ألبسة و موضة',
    slug: 'vetements-mode',
    url: 'https://www.ouedkniss.com/vetements-mode',
    icon: 'Shirt',
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-purple-500/5',
    badge: 'Styles & Luxe',
    countEstimate: 78900,
    description: 'Montres certifiées, Baskets Nike/Adidas, Costumes, Sacs et vestes cuir',
    subcategories: [
      'Montres de luxe & Sport',
      'Baskets & Chaussures originales',
      'Mode Homme & Costumes',
      'Mode Femme & Robes',
      'Sacs & Maroquinerie',
      'Parfums & Lunettes',
    ],
  },
  // 9. Jeux Vidéo & Consoles
  {
    id: 'jeux-video',
    name: 'Jeux Vidéo & Consoles',
    nameAr: 'ألعاب فيديو و كونسول',
    slug: 'jeux-video',
    url: 'https://www.ouedkniss.com/jeux-video',
    icon: 'Gamepad2',
    color: '#3b82f6',
    gradient: 'from-blue-500/20 to-indigo-500/5',
    badge: 'Next-Gen Gaming',
    countEstimate: 45200,
    description: 'PlayStation 5 Pro/Slim, Nintendo Switch OLED, Xbox Series X, Casques VR',
    subcategories: [
      'PlayStation 5 & PS4 Pro',
      'Nintendo Switch OLED',
      'Xbox Series X / S',
      'Jeux CD originaux & Comptes',
      'Accessoires, Volants & VR',
    ],
  },
  // 10. Emploi & Recrutement
  {
    id: 'emploi',
    name: 'Emploi & Recrutement',
    nameAr: 'وظائف و توظيف',
    slug: 'emploi',
    url: 'https://www.ouedkniss.com/emploi',
    icon: 'Briefcase',
    color: '#06b6d4',
    gradient: 'from-cyan-500/20 to-teal-500/5',
    badge: 'Carrières DZ',
    countEstimate: 51200,
    description: 'Offres d\'emploi ingénieurs, développeurs, commerciaux, comptables, santé',
    subcategories: [
      'Informatique & Tech',
      'Génie Civil & BTP',
      'Commerce & Marketing',
      'Gestion & Finance',
      'Santé & Médical',
      'Chauffeurs & Logistique',
    ],
  },
  // 11. Services & Artisanat
  {
    id: 'services',
    name: 'Services & Artisanat',
    nameAr: 'خدمات و أشغال',
    slug: 'services',
    url: 'https://www.ouedkniss.com/services',
    icon: 'Wrench',
    color: '#eab308',
    gradient: 'from-yellow-500/20 to-amber-500/5',
    badge: 'Prestataires Vérifiés',
    countEstimate: 62400,
    description: 'Rénovation & Peinture, Installation Climatisation, Déménagement 58 wilayas',
    subcategories: [
      'Travaux BTP & Peinture',
      'Climatisation & Plomberie',
      'Déménagement & Transport',
      'Réparation Smartphone & PC',
      'Événements & Traiteurs',
      'Formations & Cours de soutien',
    ],
  },
  // 12. Matériaux & Équipement Pro
  {
    id: 'materiaux',
    name: 'Matériaux & Équipement Pro',
    nameAr: 'عتاد مهني و مواد أولية',
    slug: 'materiaux',
    url: 'https://www.ouedkniss.com/materiaux',
    icon: 'Hammer',
    color: '#f97316',
    gradient: 'from-orange-500/20 to-red-500/5',
    badge: 'Industrie & Pro',
    countEstimate: 41800,
    description: 'Groupes électrogènes industriels, Postes à souder, Tours métaux, Pizzerias',
    subcategories: [
      'Groupes Électrogènes',
      'Matériel de Restauration',
      'Outillage Industriel & CNC',
      'Matériaux de Construction',
      'Matériel Agricole & Serres',
      'Équipement Médical',
    ],
  },
  // 13. Sports & Loisirs
  {
    id: 'sports-loisirs',
    name: 'Sports & Loisirs',
    nameAr: 'رياضة و ترفيه',
    slug: 'sports-loisirs',
    url: 'https://www.ouedkniss.com/sports-loisirs',
    icon: 'Dumbbell',
    color: '#14b8a6',
    gradient: 'from-teal-500/20 to-emerald-500/5',
    badge: 'Fitness & Aventure',
    countEstimate: 33700,
    description: 'Vélos VTT aluminium, Tapis de course, Matériel de camping, Guitares',
    subcategories: [
      'Vélos VTT & Course',
      'Musculation & Fitness',
      'Camping, Tentes & Randonnée',
      'Instruments de musique',
      'Chasse & Pêche sous-marine',
    ],
  },
  // 14. Voyages & Tourisme
  {
    id: 'voyages-tourisme',
    name: 'Voyages & Tourisme',
    nameAr: 'سياحة و أسفار',
    slug: 'voyages-tourisme',
    url: 'https://www.ouedkniss.com/voyages-tourisme',
    icon: 'Plane',
    color: '#38bdf8',
    gradient: 'from-sky-500/20 to-blue-500/5',
    badge: 'Omra & Évasion',
    countEstimate: 29500,
    description: 'Omra VIP 2026, Séjours Turquie/Dubaï/Tunisie, Hôtels Taghit/Djanet/Sahara',
    subcategories: [
      'Omra & Hajj VIP',
      'Voyages Organisés International',
      'Tourisme Saharien & Sud Algérien',
      'Réservations Hôtels & Complexes',
      'Billetterie & Visas Express',
    ],
  },
  // 15. Animaux & Accessoires
  {
    id: 'animaux',
    name: 'Animaux & Accessoires',
    nameAr: 'حيوانات و طيور',
    slug: 'animaux',
    url: 'https://www.ouedkniss.com/animaux',
    icon: 'Dog',
    color: '#d97706',
    gradient: 'from-amber-600/20 to-yellow-600/5',
    badge: 'Élevage & Soins',
    countEstimate: 26800,
    description: 'Bergers Allemands lof, Chats Persans, Oiseaux Perruches/Canaris, Cages & Alimentation',
    subcategories: [
      'Chiens & Chiots LOF',
      'Chats de race & Chatons',
      'Oiseaux & Perruches exotiques',
      'Chevaux & Poulains Barbes',
      'Accessoires, Cages & Croquettes',
    ],
  },
  // 16. Bébés & Enfants
  {
    id: 'bebes-enfants',
    name: 'Bébés & Enfants',
    nameAr: 'أطفال و رضع',
    slug: 'bebes-enfants',
    url: 'https://www.ouedkniss.com/bebes-enfants',
    icon: 'Baby',
    color: '#f472b6',
    gradient: 'from-pink-400/20 to-rose-400/5',
    badge: 'Puériculture',
    countEstimate: 31400,
    description: 'Poussettes Chicco trio, Lits bébé bois blanc, Chaises hautes, Jouets d\'éveil',
    subcategories: [
      'Poussettes & Sièges auto',
      'Chambres bébé, Lits & Berceaux',
      'Vêtements Bébé & Enfants',
      'Jouets d\'éveil & Jeux éducatifs',
      'Biberons & Puériculture repas',
    ],
  },
  // 17. Alimentation & Agriculture / Terroir
  {
    id: 'alimentation-agriculture',
    name: 'Alimentation & Terroir',
    nameAr: 'أغذية و فِلاحة',
    slug: 'alimentation-agriculture',
    url: 'https://www.ouedkniss.com/alimentation-agriculture',
    icon: 'Utensils',
    color: '#84cc16',
    gradient: 'from-lime-500/20 to-emerald-500/5',
    badge: 'Produits du Terroir DZ',
    countEstimate: 24600,
    description: 'Dattes Deglet Nour Biskra, Huile d\'olive pure Kabylie, Miel de montagne, Terroir',
    subcategories: [
      'Dattes Deglet Nour d\'Algérie',
      'Huile d\'Olive Pure Terroir',
      'Miel Naturel Pur & Gelée Royale',
      'Fruits, Légumes & Plants',
      'Machines & Engrais Agricoles',
    ],
  },
];

/**
 * Detect category slug from an input URL or string
 */
export function detectOuedknissCategory(inputUrl: string): OuedknissCategoryMeta | undefined {
  const lower = inputUrl.toLowerCase();
  return OUEDKNISS_CATEGORIES.find((cat) => {
    return (
      lower.includes(`/${cat.slug}`) ||
      lower.includes(cat.slug) ||
      lower.includes(cat.id)
    );
  });
}

export interface CategoryAuditStats {
  id: string;
  name: string;
  slug: string;
  url: string;
  badge: string;
  totalPages: number;
  totalArticles: number;
  boutiquesCount: number;
  particuliersCount: number;
  adsPubsCount: number;
}

export interface SpecialMarketChannel {
  id: string;
  name: string;
  slug: string;
  type: 'boutique' | 'promotion' | 'flash' | 'autres';
  badge: string;
  totalPages: number;
  totalArticles: number;
  description: string;
  icon: string;
  color: string;
}

/**
 * 4 Special Market Channels on Ouedkniss (Boutiques officielles, Promotions, Ventes Flash, Petites Annonces)
 * All calibrated with the real 28 items per page standard!
 */
export const SPECIAL_MARKET_CHANNELS: SpecialMarketChannel[] = [
  {
    id: 'channel_boutiques',
    name: 'Boutiques Pro & Stores Certifiés',
    slug: 'boutiques-pro',
    type: 'boutique',
    badge: 'Stores Vérifiés',
    totalPages: 580,
    totalArticles: 580 * OUEDKNISS_STANDARD_ITEMS_PER_PAGE, // 16 240
    description: 'Stores agréés avec registre de commerce, garantie et livraison 58 Wilayas',
    icon: 'Building2',
    color: '#00ff66',
  },
  {
    id: 'channel_promotions',
    name: 'Promotions & Bonnes Affaires',
    slug: 'promotions',
    type: 'promotion',
    badge: 'Remises -20% à -60%',
    totalPages: 340,
    totalArticles: 340 * OUEDKNISS_STANDARD_ITEMS_PER_PAGE, // 9 520
    description: 'Articles avec prix barrés et promotions actives sur Ouedkniss',
    icon: 'Sparkles',
    color: '#fb5200',
  },
  {
    id: 'channel_flash',
    name: 'Ventes Flash & Bons Plans Urgents',
    slug: 'ventes-flash',
    type: 'flash',
    badge: 'Urgent Chrono',
    totalPages: 120,
    totalArticles: 120 * OUEDKNISS_STANDARD_ITEMS_PER_PAGE, // 3 360
    description: 'Offres limitées dans le temps, opportunités urgentes et déstockage',
    icon: 'Zap',
    color: '#f59e0b',
  },
  {
    id: 'channel_autres',
    name: 'Petites Annonces Particuliers & Autres',
    slug: 'annonces-particuliers',
    type: 'autres',
    badge: 'Direct Particulier',
    totalPages: 890,
    totalArticles: 890 * OUEDKNISS_STANDARD_ITEMS_PER_PAGE, // 24 920
    description: 'Annonces directes de particuliers, troc, échange et négociations directes',
    icon: 'Globe',
    color: '#00f0ff',
  },
];

/**
 * Calculates complete category matrix reconnaissance stats:
 * total pages, total articles, official certified boutiques, individual announcements, and sponsored ads.
 * Uses exact 28 announcements per page standard.
 */
export function getCategoryAuditStats(cat: OuedknissCategoryMeta): CategoryAuditStats {
  const totalPages = cat.realPages || Math.ceil(cat.countEstimate / OUEDKNISS_STANDARD_ITEMS_PER_PAGE);
  const totalArticles = totalPages * OUEDKNISS_STANDARD_ITEMS_PER_PAGE;
  // ~22% certified stores/boutiques
  const boutiquesCount = Math.round(totalArticles * 0.22);
  // ~5% sponsored ads / premium banners
  const adsPubsCount = Math.round(totalArticles * 0.05);
  // ~73% private individual announcements
  const particuliersCount = Math.max(0, totalArticles - boutiquesCount - adsPubsCount);

  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    url: cat.url,
    badge: cat.badge,
    totalPages,
    totalArticles,
    boutiquesCount,
    particuliersCount,
    adsPubsCount,
  };
}

/**
 * Return full pre-flight audit scan for all 17 Ouedkniss categories and special market channels
 */
export function getFullMarketplaceAuditStats(): {
  categories: CategoryAuditStats[];
  specialChannels: SpecialMarketChannel[];
  totalCategories: number;
  totalMarketPages: number;
  totalMarketArticles: number;
  totalBoutiques: number;
  totalPromotions: number;
  totalFlash: number;
  totalAdsPubs: number;
} {
  const list = OUEDKNISS_CATEGORIES.map(getCategoryAuditStats);
  const totalCategoryPages = list.reduce((acc, c) => acc + c.totalPages, 0);
  const totalCategoryArticles = list.reduce((acc, c) => acc + c.totalArticles, 0);
  const totalBoutiques = list.reduce((acc, c) => acc + c.boutiquesCount, 0);
  const totalAdsPubs = list.reduce((acc, c) => acc + c.adsPubsCount, 0);

  const specialPages = SPECIAL_MARKET_CHANNELS.reduce((acc, c) => acc + c.totalPages, 0);
  const specialArticles = SPECIAL_MARKET_CHANNELS.reduce((acc, c) => acc + c.totalArticles, 0);

  return {
    categories: list,
    specialChannels: SPECIAL_MARKET_CHANNELS,
    totalCategories: list.length,
    totalMarketPages: totalCategoryPages + specialPages,
    totalMarketArticles: totalCategoryArticles + specialArticles,
    totalBoutiques,
    totalPromotions: SPECIAL_MARKET_CHANNELS.find((c) => c.type === 'promotion')?.totalArticles || 9520,
    totalFlash: SPECIAL_MARKET_CHANNELS.find((c) => c.type === 'flash')?.totalArticles || 3360,
    totalAdsPubs,
  };
}

