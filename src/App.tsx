/**
 * CYBER-VACUUM // AI E-Commerce Scraper & Matrix Data Engine
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrapedProduct,
  ScrapeJob,
  SupabaseConfig,
  AutoUpdateConfig,
  ScrapeLog,
} from './types';
import { MatrixRainCanvas } from './components/MatrixRainCanvas';
import { VacuumVisualizer } from './components/VacuumVisualizer';
import { AiCrawlerLiveHud } from './components/AiCrawlerLiveHud';
import { PriceTrendDashboard } from './components/PriceTrendDashboard';
import { ProductCatalogGrid } from './components/ProductCatalogGrid';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { OuedknissCategoryHub } from './components/OuedknissCategoryHub';
import {
  OUEDKNISS_CATEGORIES,
  OuedknissCategoryMeta,
  detectOuedknissCategory,
} from './data/ouedknissCategories';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  getStoredProducts,
  saveStoredProducts,
  clearStoredProducts,
  syncProductsToSupabase,
} from './utils/supabaseClient';
import { cyberAudio } from './utils/cyberAudio';
import {
  Zap,
  Radio,
  Database,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  LineChart,
  ShoppingBag,
  Cpu,
  Globe,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Square,
  StopCircle,
} from 'lucide-react';

// Preset E-Commerce Target URLs
const PRESET_URLS = [
  {
    name: '🇩🇿 Ouedkniss Téléphones',
    url: 'https://www.ouedkniss.com/telephones',
    badge: 'Algérie Marketplace',
  },
  {
    name: '🇩🇿 Ouedkniss Informatique',
    url: 'https://www.ouedkniss.com/informatique',
    badge: 'Laptops & Gaming',
  },
  {
    name: 'Apple Store',
    url: 'https://www.apple.com/fr/shop/buy-iphone',
    badge: 'Flagship Tech',
  },
  {
    name: 'Amazon High-Tech',
    url: 'https://www.amazon.fr/s?k=ordinateur+portable+gaming',
    badge: 'Marketplace',
  },
  {
    name: 'Nike Boutique',
    url: 'https://www.nike.com/fr/w/hommes-chaussures-nik1',
    badge: 'Sneakers & Sport',
  },
  {
    name: 'Fnac Informatique',
    url: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=ps5+pro',
    badge: 'Gaming & Multimédia',
  },
];

// Rich initial seed data for immediate exploration
const INITIAL_DEMO_PRODUCTS: ScrapedProduct[] = [
  {
    id: 'prod_ouedkniss_s24ultra',
    title: 'Samsung Galaxy S24 Ultra 512GB Titane Neuf Sous Blister',
    brand: 'Samsung',
    category: 'Téléphones & Smartphones',
    currentPrice: 215000,
    originalPrice: 235000,
    currency: 'DA',
    discountPercent: 8,
    rating: 4.9,
    reviewsCount: 1420,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/telephones/samsung-galaxy-s24-ultra',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Kouba', État: 'Neuf sous emballage avec facture', Vendeur: 'Boutique Tech Pro' },
    aiConfidence: 99.6,
    syncedToSupabase: true,
    matrixHash: '0x0UED_01',
    priceHistory: [
      { date: '2026-10-01', price: 235000 },
      { date: '2026-10-05', price: 230000 },
      { date: '2026-10-09', price: 222000 },
      { date: '2026-10-13', price: 215000, note: 'Baisse Ouedkniss -8%' },
    ],
  },
  {
    id: 'prod_ouedkniss_iphone15promax',
    title: 'Apple iPhone 15 Pro Max 256GB Naturel Batterie 100%',
    brand: 'Apple',
    category: 'Téléphones & Smartphones',
    currentPrice: 198000,
    originalPrice: 218000,
    currency: 'DA',
    discountPercent: 9,
    rating: 4.8,
    reviewsCount: 980,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/telephones/iphone-15-pro-max',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Oran - Akid Lotfi', État: '10/10 avec boîte d origine', Vendeur: 'Particulier certifié' },
    aiConfidence: 99.2,
    syncedToSupabase: true,
    matrixHash: '0x0UED_02',
    priceHistory: [
      { date: '2026-10-01', price: 218000 },
      { date: '2026-10-06', price: 210000 },
      { date: '2026-10-10', price: 202000 },
      { date: '2026-10-13', price: 198000, note: 'Offre négociation -9%' },
    ],
  },
  {
    id: 'prod_ouedkniss_xiaomi13pro',
    title: 'Xiaomi Redmi Note 13 Pro+ 5G 512GB 12GB RAM Neuf Sous Blister',
    brand: 'Xiaomi',
    category: 'Téléphones & Smartphones',
    currentPrice: 58500,
    originalPrice: 65000,
    currency: 'DA',
    discountPercent: 10,
    rating: 4.7,
    reviewsCount: 430,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/telephones/xiaomi-redmi-note-13-pro-plus',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Sétif - Centre', État: 'Neuf sous blister avec garantie', Vendeur: 'Boutique Mobile Store' },
    aiConfidence: 98.5,
    syncedToSupabase: true,
    matrixHash: '0x0UED_03',
    priceHistory: [
      { date: '2026-10-01', price: 65000 },
      { date: '2026-10-07', price: 61000 },
      { date: '2026-10-13', price: 58500, note: 'Baisse -10%' },
    ],
  },
  {
    id: 'prod_ouedkniss_rogstrix',
    title: 'Asus ROG Strix G16 Intel i7 13650HX RTX 4070 32GB RAM 1TB SSD',
    brand: 'Asus',
    category: 'Informatique & Laptops Gamer',
    currentPrice: 268000,
    originalPrice: 289000,
    currency: 'DA',
    discountPercent: 7,
    rating: 4.9,
    reviewsCount: 310,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/informatique/asus-rog-strix-g16',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Constantine - Nouvelle Ville', État: 'Neuf carton scellé', Vendeur: 'Gaming Store DZ' },
    aiConfidence: 99.1,
    syncedToSupabase: true,
    matrixHash: '0x0UED_04',
    priceHistory: [
      { date: '2026-10-01', price: 289000 },
      { date: '2026-10-06', price: 278000 },
      { date: '2026-10-13', price: 268000 },
    ],
  },
  {
    id: 'prod_ouedkniss_macbookm3',
    title: 'Apple MacBook Pro 14" M3 Pro 18GB 512GB SSD Noir Sidéral',
    brand: 'Apple',
    category: 'Informatique & Ordinateurs',
    currentPrice: 345000,
    originalPrice: 375000,
    currency: 'DA',
    discountPercent: 8,
    rating: 4.9,
    reviewsCount: 220,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/informatique/macbook-pro-14-m3',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Hydra', État: 'Neuf non activé', Vendeur: 'Importateur Direct' },
    aiConfidence: 99.4,
    syncedToSupabase: true,
    matrixHash: '0x0UED_05',
    priceHistory: [
      { date: '2026-10-01', price: 375000 },
      { date: '2026-10-08', price: 359000 },
      { date: '2026-10-13', price: 345000 },
    ],
  },
  {
    id: 'prod_ouedkniss_ps5slim',
    title: 'Sony PlayStation 5 Slim 1TB Édition Standard 2 Manettes Offertes',
    brand: 'Sony',
    category: 'Gaming & Consoles',
    currentPrice: 112000,
    originalPrice: 125000,
    currency: 'DA',
    discountPercent: 10,
    rating: 4.8,
    reviewsCount: 780,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/gaming/playstation-5-slim',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Blida - Ouled Yaich', État: 'Neuf avec garantie 6 mois', Vendeur: 'PlayZone DZ' },
    aiConfidence: 98.6,
    syncedToSupabase: true,
    matrixHash: '0x0UED_06',
    priceHistory: [
      { date: '2026-10-01', price: 125000 },
      { date: '2026-10-07', price: 118000 },
      { date: '2026-10-13', price: 112000, note: 'Offre Pack -10%' },
    ],
  },
  {
    id: 'prod_ouedkniss_clio4gt',
    title: 'Renault Clio 4 GT Line 1.5 DCI 110ch Année 2019 Peinture d origine',
    brand: 'Renault',
    category: 'Véhicules & Automobiles',
    currentPrice: 2850000,
    originalPrice: 2980000,
    currency: 'DA',
    discountPercent: 4,
    rating: 4.7,
    reviewsCount: 1950,
    inStock: true,
    stockLevel: 'LOW_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/automobiles/renault-clio-4-gt-line',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Chéraga', État: '85 000 km réels carnet entretien', Vendeur: 'Particulier' },
    aiConfidence: 97.8,
    syncedToSupabase: false,
    matrixHash: '0x0UED_07',
    priceHistory: [
      { date: '2026-10-01', price: 2980000 },
      { date: '2026-10-08', price: 2900000 },
      { date: '2026-10-13', price: 2850000 },
    ],
  },
];

interface SmartMergeResult {
  merged: ScrapedProduct[];
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  sampleUpdatedTitles: string[];
}

/**
 * Fusion incrémentale intelligente:
 * - N'aspire JAMAIS les doublons qui existent déjà s'ils n'ont pas changé.
 * - Si un article a changé (prix, réduction, stock, avis), met à jour les champs et ajoute le point à l'historique de prix.
 * - Insère les nouveaux articles en tête de liste.
 */
function smartMergeProducts(
  currentList: ScrapedProduct[],
  incomingList: ScrapedProduct[]
): SmartMergeResult {
  const existingMap = new Map<string, ScrapedProduct>();
  const urlMap = new Map<string, ScrapedProduct>();

  for (const item of currentList) {
    if (item.id) existingMap.set(item.id, item);
    if (item.productUrl) urlMap.set(item.productUrl.toLowerCase(), item);
  }

  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  const sampleUpdatedTitles: string[] = [];

  const updatedMap = new Map<string, ScrapedProduct>(existingMap);
  const newItems: ScrapedProduct[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (const incoming of incomingList) {
    const existing =
      (incoming.id && updatedMap.get(incoming.id)) ||
      (incoming.productUrl && urlMap.get(incoming.productUrl.toLowerCase()));

    if (!existing) {
      // NOUVEAU PRODUIT: Ajouté au catalogue
      newItems.push(incoming);
      newCount++;
      if (incoming.id) updatedMap.set(incoming.id, incoming);
      if (incoming.productUrl) urlMap.set(incoming.productUrl.toLowerCase(), incoming);
    } else {
      // PRODUIT EXISTANT DÉJÀ PRÉSENT:
      // Détection stricte des modifications (prix, remise, stock, note, avis)
      const priceDelta = incoming.currentPrice - existing.currentPrice;
      const isPriceChanged = Math.abs(priceDelta) >= 1;
      const isDiscountChanged = incoming.discountPercent !== existing.discountPercent;
      const isStockChanged =
        incoming.inStock !== existing.inStock || incoming.stockLevel !== existing.stockLevel;
      const isRatingChanged =
        Math.abs((incoming.rating || 0) - (existing.rating || 0)) >= 0.1 ||
        incoming.reviewsCount !== existing.reviewsCount;

      const hasChanged = isPriceChanged || isDiscountChanged || isStockChanged || isRatingChanged;

      if (hasChanged) {
        // MODIFICATION DÉTECTÉE: Mise à jour sans doublon
        const priceHistory = [...(existing.priceHistory || [])];
        if (isPriceChanged) {
          priceHistory.push({
            date: todayStr,
            price: incoming.currentPrice,
            note:
              priceDelta < 0
                ? `Baisse de ${Math.abs(priceDelta)} ${incoming.currency}`
                : `Hausse de ${priceDelta} ${incoming.currency}`,
          });
        }

        const updated: ScrapedProduct = {
          ...existing,
          ...incoming,
          id: existing.id, // conserve l'identifiant stable
          priceHistory: priceHistory.slice(-20),
          lastUpdated: new Date().toISOString(),
          syncedToSupabase: false, // marqué pour resynchronisation
        };

        updatedMap.set(existing.id, updated);
        if (existing.productUrl) urlMap.set(existing.productUrl.toLowerCase(), updated);
        updatedCount++;

        if (sampleUpdatedTitles.length < 3) {
          sampleUpdatedTitles.push(
            `${incoming.title.slice(0, 30)} (${existing.currentPrice} -> ${incoming.currentPrice} ${incoming.currency})`
          );
        }
      } else {
        // TOTALEMENT INCHANGÉ: Ne pas ré-aspirer ni dupliquer !
        unchangedCount++;
      }
    }
  }

  // Préservation du catalogue avec nouveaux éléments en tête
  const merged = [
    ...newItems,
    ...currentList.map((p) => updatedMap.get(p.id) || p),
  ];

  return {
    merged,
    newCount,
    updatedCount,
    unchangedCount,
    sampleUpdatedTitles,
  };
}

export default function App() {
  // Input State
  const [targetUrl, setTargetUrl] = useState<string>('https://www.ouedkniss.com/telephones');
  const [engineMode, setEngineMode] = useState<'direct' | 'ai'>('direct');
  const [scrapeVolume, setScrapeVolume] = useState<number>(24);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>('telephones');
  const [activeSweepCategoryIndex, setActiveSweepCategoryIndex] = useState<number | undefined>(undefined);
  const [isAllCategoriesSweepActive, setIsAllCategoriesSweepActive] = useState<boolean>(false);
  const [replaceCatalog, setReplaceCatalog] = useState<boolean>(false); // Par défaut: Fusion incrémentale intelligente
  const [activeTab, setActiveTab] = useState<'vacuum' | 'trends' | 'catalog'>('vacuum');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [rainIntensity, setRainIntensity] = useState<'subtle' | 'normal' | 'turbo' | 'off'>('normal');
  const [isContinuousScraping, setIsContinuousScraping] = useState<boolean>(false);
  const [sweepPagesPerCategory, setSweepPagesPerCategory] = useState<number>(0); // 0 = Illimité ∞
  const abortScrapingRef = useRef<boolean>(false);

  // Supabase State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  // Products State
  const [products, setProducts] = useState<ScrapedProduct[]>(() => {
    const cached = getStoredProducts();
    return cached.length > 0 ? cached : INITIAL_DEMO_PRODUCTS;
  });

  // Scraping Job State
  const [job, setJob] = useState<ScrapeJob>({
    jobId: 'JOB_INIT',
    targetUrl: '',
    status: 'idle',
    progress: 0,
    itemsFound: 0,
    pagesVisited: 0,
    dataTransferKb: 0,
    currentDomNode: '',
    aiAgentAction: 'Système en veille quantique. Entrez une URL pour aspirer son catalogue.',
    logs: [
      {
        id: 'log-0',
        timestamp: new Date().toLocaleTimeString(),
        level: 'cyber',
        message: 'CYBER-VACUUM MK-IV initialisé avec succès. Moteur prêt.',
        hex: '0xINIT',
      },
    ],
    crawlerState: {
      scrollY: 0,
      maxScroll: 4800,
      activeSelector: 'body > main',
      currentElementFound: 'idle',
      domNodesInspected: 0,
      tokensProcessed: 0,
      speedKbps: 0,
    },
  });

  // Auto-Update Engine State
  const [autoUpdate, setAutoUpdate] = useState<AutoUpdateConfig>({
    enabled: true,
    intervalMinutes: 5,
    lastRun: new Date().toLocaleTimeString(),
  });
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // Save products cache
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  // Purge specific currency (e.g. clean out old € items)
  const handleRemoveCurrency = (currency: string) => {
    setProducts((prev) => prev.filter((p) => p.currency !== currency));
    addLog(`[PURGE] Suppression de tous les articles en ${currency}. Catalogue 100% purifié.`, 'info');
  };

  // Vider complètement le catalogue (réinitialisation à zéro)
  const handleClearAllProducts = () => {
    if (window.confirm('Voulez-vous vider tous les produits déjà aspirés ?')) {
      setProducts([]);
      clearStoredProducts();
      cyberAudio.playChirp(450, 0.08);
      addLog('[PURGE] Catalogue et mémoire cache entièrement vidés (0 article).', 'warn', '0xCLEAR');
    }
  };

  // Arrêter manuellement l'aspiration continue
  const handleStopScrape = () => {
    abortScrapingRef.current = true;
    setIsContinuousScraping(false);
    setIsAllCategoriesSweepActive(false);
    setActiveSweepCategoryIndex(undefined);
    setJob((prev) => ({
      ...prev,
      status: 'completed',
      progress: 100,
      aiAgentAction: 'Aspiration interrompue par l\'utilisateur. Tous les articles collectés sont scellés.',
    }));
    cyberAudio.playChirp(520, 0.08);
    addLog('[ARRÊT] Processus d\'aspiration stoppé à la demande de l\'utilisateur.', 'warn', '0xHALT');
  };

  // Save Supabase config
  const handleSaveSupabaseConfig = (cfg: SupabaseConfig) => {
    setSupabaseConfig(cfg);
    saveStoredSupabaseConfig(cfg);
  };

  // Add Log Helper
  const addLog = useCallback((message: string, level: ScrapeLog['level'] = 'info', hex?: string) => {
    const newLog: ScrapeLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      hex: hex || (level === 'vacuum' ? '0xVACUUM' : undefined),
    };
    setJob((prev) => ({
      ...prev,
      logs: [...prev.logs.slice(-50), newLog],
    }));
  }, []);

  // Audio Toggle
  const handleToggleAudio = () => {
    const muted = cyberAudio.toggleMute();
    setIsAudioMuted(muted);
  };

  // ==========================================================
  // MASTER SWEEP : ASPIRER TOUTES LES 12 CATÉGORIES OUEDKNISS
  // ==========================================================
  const handleStartAllCategoriesSweep = async () => {
    setActiveTab('vacuum');
    abortScrapingRef.current = false;
    setIsContinuousScraping(true);
    setIsAllCategoriesSweepActive(true);

    const isUnlimited = sweepPagesPerCategory === 0;
    const maxPagesTarget = isUnlimited ? 999 : sweepPagesPerCategory;

    addLog(
      `[BALAYAGE_GLOBAL] Démarrage du scan des 12 CATÉGORIES OUEDKNISS (${
        isUnlimited ? 'Illimité ∞ jusqu’au dernier article' : `${maxPagesTarget} pages (${maxPagesTarget * 48} articles) par catégorie`
      })`,
      'cyber',
      '0xGLOBAL_START'
    );
    cyberAudio.playVacuumSuck();

    let accumulated: ScrapedProduct[] = replaceCatalog ? [] : [...products];
    accumulated = accumulated.filter((p) => p.currency === 'DA');

    const totalCats = OUEDKNISS_CATEGORIES.length;

    for (let catIdx = 0; catIdx < totalCats; catIdx++) {
      if (abortScrapingRef.current) break;

      const cat = OUEDKNISS_CATEGORIES[catIdx];
      setActiveSweepCategoryIndex(catIdx);
      setSelectedCategorySlug(cat.slug);
      setTargetUrl(cat.url);

      addLog(
        `[CATÉGORIE_${catIdx + 1}/${totalCats}] Ingestion du flux: ${cat.name} (${cat.url})`,
        'info',
        `0xCAT_${cat.slug.slice(0, 4).toUpperCase()}`
      );

      for (let page = 1; page <= maxPagesTarget; page++) {
        if (abortScrapingRef.current) break;

        const globalStep = catIdx * maxPagesTarget + page;
        const totalSteps = totalCats * maxPagesTarget;
        const progressPct = isUnlimited
          ? Math.min(99, Math.round(((catIdx + Math.min(page, 20) / 20) / totalCats) * 100))
          : Math.min(99, Math.round((globalStep / totalSteps) * 100));

        setJob((prev) => ({
          ...prev,
          status: 'aspirating',
          progress: progressPct,
          itemsFound: accumulated.length,
          aiAgentAction: `[${catIdx + 1}/${totalCats} ${cat.name}] Page ${page}${
            isUnlimited ? ' (∞ Illimité)' : `/${maxPagesTarget}`
          } (${accumulated.length} articles indexés)...`,
          crawlerState: {
            ...prev.crawlerState,
            scrollY: globalStep * 1200,
            domNodesInspected: globalStep * 340,
            tokensProcessed: globalStep * 1950,
          },
        }));

        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: cat.url,
              maxItems: 48,
              engineMode,
              page,
              categorySlug: cat.slug,
            }),
          });

          if (!res.ok) break;
          const data = await res.json();
          const pageProducts: ScrapedProduct[] = data.products || [];

          if (pageProducts.length === 0) {
            addLog(`[${cat.name}] Fin du flux d'annonces atteinte à la page ${page}.`, 'info');
            break;
          }

          if (replaceCatalog) {
            accumulated = [...accumulated, ...pageProducts];
            setProducts([...accumulated]);
            cyberAudio.playItemAspirated();
            addLog(
              `[${cat.name} P${page}] +${pageProducts.length} articles aspirés (Total global: ${accumulated.length})`,
              'vacuum',
              `0xP${page}`
            );
          } else {
            const { merged, newCount, updatedCount, unchangedCount } = smartMergeProducts(
              accumulated,
              pageProducts
            );
            accumulated = merged;
            setProducts([...accumulated]);
            if (newCount > 0 || updatedCount > 0) {
              cyberAudio.playItemAspirated();
            }
            addLog(
              `[${cat.name} P${page}] +${newCount} nouveaux, ${updatedCount} màj, ${unchangedCount} inchangés (Total: ${accumulated.length})`,
              updatedCount > 0 ? 'cyber' : newCount > 0 ? 'vacuum' : 'info',
              `0xP${page}`
            );
          }

          await new Promise((r) => setTimeout(r, 450));
        } catch (catErr) {
          console.warn('Sweep page error:', catErr);
          break;
        }
      }
    }

    setIsContinuousScraping(false);
    setIsAllCategoriesSweepActive(false);
    setActiveSweepCategoryIndex(undefined);

    setJob((prev) => ({
      ...prev,
      status: 'completed',
      progress: 100,
      itemsFound: accumulated.length,
      aiAgentAction: `Balayage complet des 12 catégories terminé ! ${accumulated.length} articles scellés dans la base.`,
    }));

    cyberAudio.playComplete();
    addLog(
      `[SUCCÈS QUANTIQUE] Balayage complet des 12 catégories achevé ! Total : ${accumulated.length} articles indexés.`,
      'success',
      '0xDONE'
    );

    if (supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.autoSync) {
      await syncProductsToSupabase(accumulated, supabaseConfig);
    }
  };

  // ========================================================
  // START QUANTUM SCRAPE & ASPIRATION PIPELINE
  // ========================================================
  const handleStartScrape = async () => {
    if (!targetUrl || !targetUrl.startsWith('http')) {
      alert('Veuillez entrer une URL valide (commençant par http:// ou https://)');
      return;
    }

    setActiveTab('vacuum');
    abortScrapingRef.current = false;

    let domain = 'ecommerce.com';
    try {
      domain = new URL(targetUrl).hostname.replace(/^www\./, '');
    } catch {
      // ignore
    }

    const isOuedkniss = domain.includes('ouedkniss');

    // Auto-detect category slug from URL if not already selected
    let effectiveCategorySlug = selectedCategorySlug;
    if (isOuedkniss) {
      const match = detectOuedknissCategory(targetUrl);
      if (match) {
        effectiveCategorySlug = match.slug;
        setSelectedCategorySlug(match.slug);
      }
    }

    // ========================================================
    // MODE CONTINU : ASPIRER TOUT LE CATALOGUE JUSQU'AU BOUT
    // (AUCUNE LIMITE ARTIFICIELLE À 720 ARTICLES / JUSQU'AU DERNIER ARTICLE)
    // ========================================================
    if (scrapeVolume === 0) {
      setIsContinuousScraping(true);
      setJob((prev) => ({
        ...prev,
        jobId: `JOB_ALL_${Date.now()}`,
        targetUrl,
        status: 'aspirating',
        progress: 10,
        itemsFound: replaceCatalog ? 0 : products.length,
        aiAgentAction: `Aspiration continue sans limite vers ${domain} jusqu'au dernier article absolu...`,
      }));

      addLog(
        `[ASPIRATION_CONTINUE] Démarrage du crawler infini vers ${targetUrl} [Aucune coupure à 720]`,
        'cyber',
        '0xALL_START'
      );
      cyberAudio.playVacuumSuck();

      let accumulated: ScrapedProduct[] = replaceCatalog ? [] : [...products];
      if (replaceCatalog || isOuedkniss) {
        // Clear any old euro demo products
        accumulated = accumulated.filter((p) => !isOuedkniss || p.currency === 'DA');
      }

      // No 20-page cap! Up to 9999 pages or until the user halts or source ends
      const maxPages = 9999;
      let emptyStreak = 0;

      for (let page = 1; page <= maxPages; page++) {
        if (abortScrapingRef.current) break;

        setJob((prev) => ({
          ...prev,
          progress: Math.min(99, Math.round(((page % 100) / 100) * 100)),
          aiAgentAction: `Page ${page} (Sans coupure artificielle) en cours d'ingestion... (${accumulated.length} articles aspirés)`,
          crawlerState: {
            ...prev.crawlerState,
            scrollY: page * 1200,
            domNodesInspected: page * 320,
            tokensProcessed: page * 1800,
          },
        }));

        try {
          const res = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: targetUrl,
              maxItems: 48,
              engineMode,
              page,
              categorySlug: effectiveCategorySlug || undefined,
            }),
          });

          if (!res.ok) break;
          const data = await res.json();
          const pageProducts: ScrapedProduct[] = data.products || [];

          if (pageProducts.length === 0) {
            emptyStreak++;
            if (emptyStreak >= 2) {
              addLog(`[FIN_CATALOGUE] Dernier article absolu atteint à la page ${page}. Fin de la liste.`, 'success', '0xEND');
              break;
            }
          } else {
            emptyStreak = 0;
          }

          if (replaceCatalog) {
            accumulated = [...accumulated, ...pageProducts];
            setProducts([...accumulated]);
            cyberAudio.playItemAspirated();
            addLog(
              `[PAGE_${page}] +${pageProducts.length} articles aspirés depuis la page ${page} (Total: ${accumulated.length})`,
              'vacuum',
              `0xP${page}`
            );
          } else {
            const { merged, newCount, updatedCount, unchangedCount } = smartMergeProducts(
              accumulated,
              pageProducts
            );
            accumulated = merged;
            setProducts([...accumulated]);
            if (newCount > 0 || updatedCount > 0) {
              cyberAudio.playItemAspirated();
            }
            addLog(
              `[PAGE_${page}] +${newCount} nouveaux, ${updatedCount} màj, ${unchangedCount} inchangés (Total: ${accumulated.length})`,
              updatedCount > 0 ? 'cyber' : newCount > 0 ? 'vacuum' : 'info',
              `0xP${page}`
            );
          }

          // Small stagger for visual delight
          await new Promise((r) => setTimeout(r, 450));
        } catch (pageErr) {
          console.warn('Page fetch issue:', pageErr);
          break;
        }
      }

      setIsContinuousScraping(false);
      setJob((prev) => ({
        ...prev,
        status: 'completed',
        progress: 100,
        itemsFound: accumulated.length,
        aiAgentAction: `Aspiration intégrale terminée. ${accumulated.length} articles scellés dans la base.`,
      }));

      cyberAudio.playComplete();
      addLog(
        `[SUCCÈS QUANTIQUE] Aspiration exhaustive achevée. Total : ${accumulated.length} articles indexés sans coupure.`,
        'success',
        '0xDONE'
      );

      // Auto-sync to Supabase if configured
      if (supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.autoSync) {
        await syncProductsToSupabase(accumulated, supabaseConfig);
      }
      return;
    }

    // ========================================================
    // MODE LOT UNIQUE (24, 50, 100, 250)
    // ========================================================
    setJob((prev) => ({
      ...prev,
      jobId: `JOB_${Date.now()}`,
      targetUrl,
      status: 'connecting',
      progress: 15,
      itemsFound: 0,
      aiAgentAction: `Connexion [Moteur: ${engineMode === 'direct' ? 'DIRECT SANS IA' : 'HYBRIDE IA'}] vers ${domain}...`,
    }));

    cyberAudio.playChirp(600, 0.08);
    addLog(`[CONNEXION] Mode: ${engineMode.toUpperCase()} | Volume: ${scrapeVolume} | Cible: ${targetUrl}`, 'info', '0x7F01');

    try {
      setJob((prev) => ({
        ...prev,
        status: 'aspirating',
        progress: 50,
        aiAgentAction: `Aspiration quantique en cours (${scrapeVolume} articles)...`,
      }));
      cyberAudio.playVacuumSuck();

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, maxItems: scrapeVolume, engineMode, page: 1 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de l aspiration');
      }

      const data = await response.json();
      const extractedProducts: ScrapedProduct[] = data.products || [];

      if (data.fallbackNotice) {
        addLog(`[FAILOVER] ${data.fallbackNotice}`, 'warn', '0xFAILOVER');
      }

      let finalProductsList: ScrapedProduct[] = [];
      if (replaceCatalog) {
        finalProductsList = extractedProducts;
        setProducts(finalProductsList);
        cyberAudio.playItemAspirated();
        addLog(
          `[PURGE_ET_REMPLACEMENT] ${extractedProducts.length} articles enregistrés (catalogue remplacé).`,
          'success',
          '0xPURGE'
        );
      } else {
        const { merged, newCount, updatedCount, unchangedCount, sampleUpdatedTitles } = smartMergeProducts(
          products,
          extractedProducts
        );
        finalProductsList = merged;
        setProducts(finalProductsList);

        if (newCount > 0 || updatedCount > 0) {
          cyberAudio.playItemAspirated();
        }

        const logMsg = `+${newCount} nouveaux, ${updatedCount} mis à jour (modifiés), ${unchangedCount} existants inchangés ignorés. Total: ${merged.length}`;
        addLog(`[RÉ-ASPIRATION INTELLIGENTE] ${logMsg}`, updatedCount > 0 ? 'cyber' : 'success', '0xMERGE');

        if (sampleUpdatedTitles.length > 0) {
          sampleUpdatedTitles.forEach((t) => {
            addLog(`[MODIFICATION_DÉTECTÉE] ${t}`, 'info', '0xPRICE_CHG');
          });
        }
      }

      setJob((prev) => ({
        ...prev,
        status: 'completed',
        progress: 100,
        itemsFound: finalProductsList.length,
        aiAgentAction: `Aspiration terminée avec succès. Catalogue total : ${finalProductsList.length} articles.`,
      }));

      cyberAudio.playComplete();
      addLog(`[SUCCÈS QUANTIQUE] ${finalProductsList.length} articles scellés dans la base.`, 'success', '0xDONE');

      if (supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.autoSync) {
        await syncProductsToSupabase(finalProductsList, supabaseConfig);
      }
    } catch (err: unknown) {
      const rawMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      setJob((prev) => ({
        ...prev,
        status: 'error',
        progress: 0,
        error: rawMsg,
        aiAgentAction: rawMsg,
      }));
      addLog(`[ERREUR] ${rawMsg}`, 'warn', '0xERR');
    }
  };

  // MANUAL OR AUTOMATED PRICE UPDATE TRIGGER
  const handleTriggerPriceUpdate = async () => {
    if (products.length === 0 || isUpdatingPrices) return;
    setIsUpdatingPrices(true);
    addLog(`[AUTO_REFRESH] Vérification algorithmique des fluctuations de prix en temps réel...`, 'info', '0xPRICE_CHECK');
    cyberAudio.playChirp(720, 0.04);

    try {
      const response = await fetch('/api/simulate-price-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products }),
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || products);
        addLog(`[AUTO_REFRESH] Prix mis à jour. Tendances recalculées et archivées.`, 'success', '0xUPDATED');
        cyberAudio.playChirp(1100, 0.06);

        // Auto-sync update to Supabase if configured
        if (supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.autoSync) {
          await syncProductsToSupabase(data.products || products, supabaseConfig);
        }
      }
    } catch (err) {
      console.error('Update error:', err);
    } finally {
      setIsUpdatingPrices(false);
      setAutoUpdate((prev) => ({ ...prev, lastRun: new Date().toLocaleTimeString() }));
    }
  };

  // Automated Periodic Update Loop
  useEffect(() => {
    if (!autoUpdate.enabled) return;
    const intervalMs = autoUpdate.intervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
      handleTriggerPriceUpdate();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoUpdate.enabled, autoUpdate.intervalMinutes, products.length]);

  // SYNC SINGLE PRODUCT TO SUPABASE
  const handleSyncSingleProduct = async (product: ScrapedProduct) => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      setIsSupabaseModalOpen(true);
      return;
    }
    const res = await syncProductsToSupabase([product], supabaseConfig);
    if (res.success) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, syncedToSupabase: true } : p))
      );
      cyberAudio.playChirp(1200, 0.05);
      addLog(`[SUPABASE] Produit "${product.title.slice(0, 30)}" synchronisé !`, 'success');
    } else {
      alert(`Erreur Supabase: ${res.error}`);
    }
  };

  // BULK SYNC ALL TO SUPABASE
  const handleBulkSyncSupabase = async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      setIsSupabaseModalOpen(true);
      return;
    }
    addLog(`[SUPABASE] Synchronisation groupée de ${products.length} produits vers Supabase...`, 'info');
    const res = await syncProductsToSupabase(products, supabaseConfig);
    if (res.success) {
      setProducts((prev) => prev.map((p) => ({ ...p, syncedToSupabase: true })));
      cyberAudio.playComplete();
      alert(`Succès ! ${res.count} produits synchronisés dans la table "${supabaseConfig.tableName}".`);
      addLog(`[SUPABASE] ${res.count} enregistrements scellés avec succès !`, 'success');
    } else {
      alert(`Erreur Supabase: ${res.error}`);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 font-mono flex flex-col selection:bg-[#00ff66]/30 selection:text-[#00ff88]">
      {/* Matrix Falling Rain Canvas Background */}
      {rainIntensity !== 'off' && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-40">
          <MatrixRainCanvas
            isActive={true}
            intensity={rainIntensity === 'turbo' ? 'turbo' : rainIntensity === 'subtle' ? 'subtle' : 'normal'}
            className="w-full h-full"
          />
        </div>
      )}

      {/* Cyber Screen Scanline Overlay */}
      <div className="fixed inset-0 cyber-scanlines pointer-events-none z-10 opacity-30" />

      {/* Top Header HUD Navigation Bar */}
      <header className="relative z-20 border-b border-emerald-500/30 bg-slate-950/85 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-black border-2 border-emerald-400 text-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.4)]">
              <Zap className="w-5 h-5 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-black animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wider text-white font-mono flex items-center gap-2">
                  CYBER-VACUUM <span className="text-[#00ff66]">// MK-IV</span>
                </h1>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                  IA E-COMMERCE ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Aspiration matricielle de bases de données & analyse prédictive des prix
              </p>
            </div>
          </div>

          {/* Quick HUD Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setActiveTab('vacuum')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-all ${
                activeTab === 'vacuum'
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Vortex &</span> IA Crawler
            </button>

            <button
              onClick={() => setActiveTab('trends')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-all ${
                activeTab === 'trends'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              Tendances Prix
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Catalogue ({products.length})
            </button>
          </div>

          {/* Right Action Tools: Quick Clear, Supabase Config, Sound FX & Matrix Rain */}
          <div className="flex items-center gap-2">
            {/* Quick Clear All Button */}
            <button
              onClick={handleClearAllProducts}
              disabled={products.length === 0}
              className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
              title="Vider tous les articles aspirés (remise à zéro)"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Supabase Status Button */}
            <button
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                supabaseConfig.url && supabaseConfig.anonKey
                  ? 'bg-emerald-950/60 border-emerald-400/50 text-[#00ff88] hover:bg-emerald-900/40'
                  : 'bg-slate-900 border-slate-800 text-amber-400 hover:border-amber-400/50'
              }`}
              title="Configurer la base de données Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">
                {supabaseConfig.url && supabaseConfig.anonKey ? 'Supabase Connecté' : 'Lier Supabase'}
              </span>
            </button>

            {/* Matrix Rain Intensity Toggle */}
            <button
              onClick={() => {
                const modes: ('subtle' | 'normal' | 'turbo' | 'off')[] = ['subtle', 'normal', 'turbo', 'off'];
                const next = modes[(modes.indexOf(rainIntensity) + 1) % modes.length];
                setRainIntensity(next);
              }}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              title={`Pluie Matrix: ${rainIntensity.toUpperCase()}`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Audio SFX Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-1.5 rounded-lg border transition-colors ${
                isAudioMuted
                  ? 'bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-[#00ff88]'
              }`}
              title={isAudioMuted ? 'Activer le son cyber' : 'Couper le son cyber'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ============================================================== */}
        {/* 0. OUEDKNISS CATEGORY HUB & MATRIX BALAYAGE GLOBAL             */}
        {/* ============================================================== */}
        <OuedknissCategoryHub
          products={products}
          selectedCategorySlug={selectedCategorySlug}
          onSelectCategory={(cat) => {
            setSelectedCategorySlug(cat.slug);
            setTargetUrl(cat.url);
            cyberAudio.playChirp(880, 0.04);
            addLog(`[CATÉGORIE_SÉLECTIONNÉE] ${cat.name} (${cat.url})`, 'info', `0xCAT_${cat.slug}`);
          }}
          onStartAllCategoriesSweep={handleStartAllCategoriesSweep}
          isScrapingActive={isContinuousScraping}
          activeSweepCategoryIndex={activeSweepCategoryIndex}
          sweepPagesPerCategory={sweepPagesPerCategory}
          onChangeSweepPagesPerCategory={setSweepPagesPerCategory}
        />

        {/* ============================================================== */}
        {/* CENTRAL QUANTUM URL INPUT & VACUUM INGESTION CONTROLLER */}
        {/* ============================================================== */}
        <section className="relative overflow-hidden rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,102,0.12)]">
          {/* Neon corner brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00ff66]" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00ff66]" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00ff66]" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00ff66]" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase">
                CIBLE D'EXTRACTION // URL E-COMMERCE
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>PRÉSETS POPULAIRES :</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_URLS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setTargetUrl(preset.url);
                      cyberAudio.playChirp(900, 0.03);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                      targetUrl === preset.url
                        ? 'bg-emerald-500/20 text-[#00ff88] border-emerald-400 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Engine Mode & Scraping Volume Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">MOTEUR D'ASPIRATION :</span>
              <div className="flex rounded-lg bg-black/60 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEngineMode('direct');
                    cyberAudio.playChirp(800, 0.04);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    engineMode === 'direct'
                      ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400 shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  ⚡ DIRECT SANS IA (Instantané & Illimité)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEngineMode('ai');
                    cyberAudio.playChirp(1000, 0.04);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                    engineMode === 'ai'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  🧠 HYBRIDE IA (Gemini 3.8)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400">VOLUME :</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: '24', val: 24 },
                    { label: '50', val: 50 },
                    { label: '100', val: 100 },
                    { label: '500', val: 500 },
                    { label: '1000', val: 1000 },
                    { label: '♾️ TOUT ASPIRER', val: 0 },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.label}
                      onClick={() => setScrapeVolume(item.val)}
                      className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        scrapeVolume === item.val
                          ? 'bg-[#00ff66] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vider les produits déjà aspirés */}
              <button
                type="button"
                onClick={handleClearAllProducts}
                disabled={products.length === 0}
                className="px-2.5 py-1 rounded bg-rose-950/50 border border-rose-500/40 text-rose-300 hover:bg-rose-900/70 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                title="Vider tous les articles déjà aspirés"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vider ({products.length})</span>
              </button>

              <button
                type="button"
                onClick={handleTriggerPriceUpdate}
                disabled={products.length === 0 || isUpdatingPrices}
                className="px-2.5 py-1 rounded bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/70 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
                title="Simuler des fluctuations de prix pour tester la détection de changements à la ré-aspiration"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tester Changement Prix</span>
              </button>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer p-1 rounded bg-black/40 border border-slate-800">
                <input
                  type="checkbox"
                  checked={replaceCatalog}
                  onChange={(e) => setReplaceCatalog(e.target.checked)}
                  className="rounded accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className={replaceCatalog ? 'text-amber-400 font-bold' : 'text-emerald-400 font-medium'}>
                  {replaceCatalog ? '⚠️ Tout écraser (Purger existant)' : '⚡ Déduplication & MAJ intelligente active'}
                </span>
              </label>
            </div>
          </div>

          {/* Input Bar Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStartScrape();
            }}
            className="flex flex-col sm:flex-row gap-3 items-stretch"
          >
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-emerald-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <input
                type="url"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Entrez l'URL du site e-commerce (ex: https://www.ouedkniss.com/telephones ou https://www.amazon.fr/...)"
                className="w-full bg-slate-900/90 border-2 border-emerald-500/40 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66] focus:shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all"
              />
            </div>

            {isContinuousScraping || job.status === 'aspirating' ? (
              <button
                type="button"
                onClick={handleStopScrape}
                className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black font-mono text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 cursor-pointer flex-shrink-0 animate-pulse"
              >
                <StopCircle className="w-4 h-4" />
                <span>ARRÊTER L'ASPIRATION</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={job.status === 'scanning'}
                className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-[#00ff66] to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black font-mono text-sm tracking-wider uppercase transition-all transform active:scale-95 shadow-[0_0_20px_rgba(0,255,102,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {scrapeVolume === 0 ? '♾️ ASPIRER TOUT LE CATALOGUE (JUSQU\'AU DERNIER)' : `ASPIRER LE CATALOGUE (${scrapeVolume})`}
                </span>
              </button>
            )}
          </form>

          {/* Quick Telemetry Bar under input */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-900">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Moteur actif : <strong className="text-[#00ff66]">{engineMode === 'direct' ? '⚡ DIRECT SANS IA (0 Quota, 0 Latence)' : '🧠 HYBRIDE IA (Gemini 3.8 Flash)'}</strong>
            </span>
            <span className="text-cyan-400">
              Devise cible : <strong className="text-white">{targetUrl.includes('ouedkniss') ? '🇩🇿 DINAR ALGÉRIEN (DA)' : '🇪🇺 EURO (€)'}</strong>
            </span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* TAB 1: VORTEX D'ASPIRATION & IA CRAWLER LIVE HUD */}
        {/* ============================================================== */}
        {activeTab === 'vacuum' && (
          <div className="space-y-6">
            {/* The Quantum Vacuum Vortex Visualizer */}
            <VacuumVisualizer
              job={job}
              latestProduct={products[0]}
              totalProductsCount={products.length}
            />

            {/* The AI Scrolling Browser & Telemetry Console */}
            <AiCrawlerLiveHud
              job={job}
              onClearLogs={() =>
                setJob((prev) => ({
                  ...prev,
                  logs: [
                    {
                      id: `log-cleared-${Date.now()}`,
                      timestamp: new Date().toLocaleTimeString(),
                      level: 'info',
                      message: 'Console réinitialisée.',
                    },
                  ],
                }))
              }
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TABLEAU DE BORD & TENDANCES DE PRIX EN TEMPS RÉEL */}
        {/* ============================================================== */}
        {activeTab === 'trends' && (
          <PriceTrendDashboard
            products={products}
            autoUpdate={autoUpdate}
            onToggleAutoUpdate={() =>
              setAutoUpdate((prev) => ({ ...prev, enabled: !prev.enabled }))
            }
            onChangeInterval={(minutes) =>
              setAutoUpdate((prev) => ({ ...prev, intervalMinutes: minutes }))
            }
            onTriggerUpdate={handleTriggerPriceUpdate}
            isUpdating={isUpdatingPrices}
          />
        )}

        {/* ============================================================== */}
        {/* TAB 3: CATALOGUE COMPLET & SYNCHRONISATION SUPABASE */}
        {/* ============================================================== */}
        {activeTab === 'catalog' && (
          <ProductCatalogGrid
            products={products}
            onSyncSingleProduct={handleSyncSingleProduct}
            onBulkSyncSupabase={handleBulkSyncSupabase}
            isSupabaseConfigured={Boolean(supabaseConfig.url && supabaseConfig.anonKey)}
            onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
            onRemoveCurrency={handleRemoveCurrency}
            onClearAllProducts={handleClearAllProducts}
          />
        )}
      </main>

      {/* Cyberpunk Footer */}
      <footer className="relative z-20 border-t border-slate-900 bg-slate-950/90 py-4 mt-8 font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff66]">CYBER-VACUUM MK-IV</span>
            <span>•</span>
            <span>Aspirateur e-commerce temps réel & intelligence artificielle</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Statut : <strong className="text-emerald-400">Opérationnel</strong></span>
            <span>Supabase : {supabaseConfig.url ? <strong className="text-cyan-400">Lié</strong> : 'Local'}</span>
            <span>Mises à jour : <strong className="text-amber-400">{autoUpdate.enabled ? `${autoUpdate.intervalMinutes}m` : 'Manuel'}</strong></span>
          </div>
        </div>
      </footer>

      {/* Supabase Configuration & Schema Generator Modal */}
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        config={supabaseConfig}
        onSaveConfig={handleSaveSupabaseConfig}
      />
    </div>
  );
}
