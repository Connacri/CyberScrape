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
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  getStoredProducts,
  saveStoredProducts,
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
    id: 'prod_apple_iphone16pro',
    title: 'Apple iPhone 16 Pro Max 256 Go Titane Noir',
    brand: 'Apple',
    category: 'Smartphones & High-Tech',
    currentPrice: 1399.0,
    originalPrice: 1479.0,
    currency: '€',
    discountPercent: 5,
    rating: 4.9,
    reviewsCount: 384,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.apple.com/fr/shop/buy-iphone/iphone-16-pro',
    sourceDomain: 'apple.com',
    scrapedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Puce: 'A18 Pro', Finition: 'Titane de qualité aérospatiale', Écran: '6,9" Super Retina XDR' },
    aiConfidence: 99.4,
    syncedToSupabase: true,
    matrixHash: '0x8FA12E',
    priceHistory: [
      { date: '2026-10-01', price: 1479.0 },
      { date: '2026-10-04', price: 1479.0 },
      { date: '2026-10-07', price: 1459.0 },
      { date: '2026-10-10', price: 1429.0 },
      { date: '2026-10-13', price: 1399.0, note: 'Baisse flash -5%' },
    ],
  },
  {
    id: 'prod_sony_wh1000xm5',
    title: 'Sony WH-1000XM5 Casque Bluetooth Sans Fil à Réduction de Bruit',
    brand: 'Sony',
    category: 'Audio & Casques',
    currentPrice: 329.99,
    originalPrice: 419.0,
    currency: '€',
    discountPercent: 21,
    rating: 4.8,
    reviewsCount: 890,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.amazon.fr/dp/B09Y2MWN2',
    sourceDomain: 'amazon.fr',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Autonomie: '30 heures', 'Réduction de bruit': 'Processeurs V1 & QN1', Audio: 'Hi-Res LDAC' },
    aiConfidence: 98.7,
    syncedToSupabase: true,
    matrixHash: '0x43BC71',
    priceHistory: [
      { date: '2026-10-01', price: 419.0 },
      { date: '2026-10-05', price: 399.0 },
      { date: '2026-10-08', price: 379.0 },
      { date: '2026-10-11', price: 349.0 },
      { date: '2026-10-13', price: 329.99, note: 'Rabais -21%' },
    ],
  },
  {
    id: 'prod_nike_air_max_pulse',
    title: 'Nike Air Max Pulse Chaussures Homme Phantom/Reflective',
    brand: 'Nike',
    category: 'Sneakers & Streetwear',
    currentPrice: 119.99,
    originalPrice: 159.99,
    currency: '€',
    discountPercent: 25,
    rating: 4.7,
    reviewsCount: 215,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.nike.com/fr/t/chaussure-air-max-pulse',
    sourceDomain: 'nike.com',
    scrapedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Amorti: 'Unité Air Max à charge ponctuelle', Matière: 'Mesh respirant', Semelle: 'Gomme gaufrée' },
    aiConfidence: 97.9,
    syncedToSupabase: false,
    matrixHash: '0x11A0FF',
    priceHistory: [
      { date: '2026-10-01', price: 159.99 },
      { date: '2026-10-06', price: 149.99 },
      { date: '2026-10-09', price: 139.99 },
      { date: '2026-10-13', price: 119.99, note: 'Super promo -25%' },
    ],
  },
  {
    id: 'prod_macbook_pro_m3',
    title: 'Apple MacBook Pro 16" M3 Max 36 Go 1 To SSD Gris Sidéral',
    brand: 'Apple',
    category: 'Informatique & Ordinateurs',
    currentPrice: 3599.0,
    originalPrice: 3849.0,
    currency: '€',
    discountPercent: 6,
    rating: 4.9,
    reviewsCount: 160,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.apple.com/fr/macbook-pro',
    sourceDomain: 'apple.com',
    scrapedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { CPU: '14 cœurs', GPU: '30 cœurs', Écran: 'Liquid Retina XDR 120Hz' },
    aiConfidence: 99.1,
    syncedToSupabase: true,
    matrixHash: '0xCCD091',
    priceHistory: [
      { date: '2026-10-01', price: 3849.0 },
      { date: '2026-10-06', price: 3799.0 },
      { date: '2026-10-10', price: 3699.0 },
      { date: '2026-10-13', price: 3599.0 },
    ],
  },
  {
    id: 'prod_playstation_5_pro',
    title: 'Sony Console PlayStation 5 Pro 2 To Édition Blanche',
    brand: 'Sony',
    category: 'Gaming & Consoles',
    currentPrice: 799.99,
    originalPrice: 799.99,
    currency: '€',
    discountPercent: 0,
    rating: 4.8,
    reviewsCount: 520,
    inStock: true,
    stockLevel: 'LOW_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.fnac.com/SearchResult/ResultList.aspx?Search=ps5+pro',
    sourceDomain: 'fnac.com',
    scrapedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Résolution: '4K 120 FPS / Ray Tracing avancé', Stockage: '2 To SSD NVMe Ultra-rapide' },
    aiConfidence: 98.4,
    syncedToSupabase: false,
    matrixHash: '0x99F440',
    priceHistory: [
      { date: '2026-10-01', price: 799.99 },
      { date: '2026-10-07', price: 799.99 },
      { date: '2026-10-13', price: 799.99 },
    ],
  },
  {
    id: 'prod_samsung_galaxy_s24_ultra',
    title: 'Samsung Galaxy S24 Ultra 512 Go Titane Gris avec S-Pen',
    brand: 'Samsung',
    category: 'Smartphones & High-Tech',
    currentPrice: 1189.0,
    originalPrice: 1469.0,
    currency: '€',
    discountPercent: 19,
    rating: 4.8,
    reviewsCount: 412,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.samsung.com/fr/smartphones/galaxy-s24-ultra',
    sourceDomain: 'samsung.com',
    scrapedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Capteur: '200 MP avec Galaxy AI', Écran: '6.8" Dynamic AMOLED 2X', Batterie: '5000 mAh' },
    aiConfidence: 98.2,
    syncedToSupabase: true,
    matrixHash: '0x33A188',
    priceHistory: [
      { date: '2026-10-01', price: 1469.0 },
      { date: '2026-10-05', price: 1399.0 },
      { date: '2026-10-09', price: 1249.0 },
      { date: '2026-10-13', price: 1189.0, note: 'Offre IA -19%' },
    ],
  },
];

export default function App() {
  // Input State
  const [targetUrl, setTargetUrl] = useState<string>('https://www.ouedkniss.com/telephones');
  const [activeTab, setActiveTab] = useState<'vacuum' | 'trends' | 'catalog'>('vacuum');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [rainIntensity, setRainIntensity] = useState<'subtle' | 'normal' | 'turbo' | 'off'>('normal');

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

  // START QUANTUM SCRAPE & ASPIRATION PIPELINE
  const handleStartScrape = async () => {
    if (!targetUrl || !targetUrl.startsWith('http')) {
      alert('Veuillez entrer une URL valide (commençant par http:// ou https://)');
      return;
    }

    // Switch to visualizer tab for maximum immersion
    setActiveTab('vacuum');

    let domain = 'ecommerce.com';
    try {
      domain = new URL(targetUrl).hostname.replace(/^www\./, '');
    } catch {
      // ignore
    }

    setJob((prev) => ({
      ...prev,
      jobId: `JOB_${Date.now()}`,
      targetUrl,
      status: 'connecting',
      progress: 5,
      itemsFound: 0,
      aiAgentAction: `Connexion TLS & Bypass pare-feu sur ${domain}...`,
    }));

    cyberAudio.playChirp(600, 0.08);
    addLog(`[CONNEXION] Négociation du tunnel TLS chiffré vers ${targetUrl}`, 'info', '0x7F01');

    // Simulated multi-step AI Crawler telemetry steps before server responds
    const step1Timer = setTimeout(() => {
      setJob((prev) => ({
        ...prev,
        status: 'scanning',
        progress: 25,
        aiAgentAction: `L'IA scroll la page, contourne les challenges et inspecte l'arborescence DOM...`,
        crawlerState: {
          ...prev.crawlerState,
          scrollY: 1250,
          domNodesInspected: 340,
          tokensProcessed: 1840,
        },
      }));
      cyberAudio.playChirp(840, 0.05);
      addLog(`[AI_SCROLL] Défilement vertical à 1250px. Détection de la grille de produits e-commerce.`, 'cyber', '0xDOM_SCAN');
    }, 900);

    const step2Timer = setTimeout(() => {
      setJob((prev) => ({
        ...prev,
        status: 'aspirating',
        progress: 55,
        aiAgentAction: `Activation du vortex d'aspiration quantique. Déconstruction des microdonnées JSON-LD...`,
        crawlerState: {
          ...prev.crawlerState,
          scrollY: 2890,
          domNodesInspected: 720,
          tokensProcessed: 4200,
        },
      }));
      cyberAudio.playVacuumSuck();
      addLog(`[VORTEX_ENGAGED] Aspiration du catalogue en cours. Ingestion des flux de prix et stocks.`, 'vacuum', '0xSUCK');
    }, 2100);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl, maxItems: 12 }),
      });

      clearTimeout(step1Timer);
      clearTimeout(step2Timer);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de l aspiration');
      }

      const data = await response.json();
      const extractedProducts: ScrapedProduct[] = data.products || [];

      // Animate progress to 90%
      setJob((prev) => ({
        ...prev,
        status: 'aspirating',
        progress: 90,
        aiAgentAction: `Cristallisation de ${extractedProducts.length} produits aspirés...`,
        itemsFound: extractedProducts.length,
      }));

      // Aspirate items sequentially with SFX
      extractedProducts.forEach((p, idx) => {
        setTimeout(() => {
          cyberAudio.playItemAspirated();
          addLog(
            `[ASPIRÉ] ${p.title.slice(0, 36)}... | ${p.currentPrice} ${p.currency} (Rabais: -${p.discountPercent}%)`,
            'success',
            p.matrixHash || '0xDATA'
          );
        }, idx * 120);
      });

      // Final complete state after brief stagger
      setTimeout(async () => {
        // Merge new products at top, avoiding duplicates by id
        setProducts((prev) => {
          const existingIds = new Set(extractedProducts.map((p) => p.id));
          const filteredOld = prev.filter((p) => !existingIds.has(p.id));
          return [...extractedProducts, ...filteredOld];
        });

        setJob((prev) => ({
          ...prev,
          status: 'completed',
          progress: 100,
          itemsFound: extractedProducts.length,
          aiAgentAction: `Catalogue intégralement aspiré. ${extractedProducts.length} références scellées dans la base.`,
          crawlerState: {
            ...prev.crawlerState,
            scrollY: 4800,
            domNodesInspected: data.telemetry?.domNodesInspected || 850,
            tokensProcessed: data.telemetry?.tokensProcessed || 4800,
          },
        }));

        cyberAudio.playComplete();
        addLog(
          `[SUCCÈS QUANTIQUE] Aspiration achevée : ${extractedProducts.length} produits indexés avec historique des prix.`,
          'success',
          '0xDONE'
        );

        // Auto-sync to Supabase if configured and enabled
        if (supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.autoSync) {
          addLog(`[SUPABASE] Synchronisation automatique du nouveau catalogue vers ${supabaseConfig.tableName}...`, 'info');
          const syncRes = await syncProductsToSupabase(extractedProducts, supabaseConfig);
          if (syncRes.success) {
            addLog(`[SUPABASE] ${syncRes.count} produits sauvegardés avec succès dans Supabase !`, 'success');
            setSyncStatusMessage(`Synchronisé vers Supabase (${syncRes.count} produits)`);
          } else {
            addLog(`[SUPABASE_ERR] Erreur de sync: ${syncRes.error}`, 'warn');
          }
        }
      }, extractedProducts.length * 120 + 300);
    } catch (err: unknown) {
      clearTimeout(step1Timer);
      clearTimeout(step2Timer);
      let rawMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      if (rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('high demand')) {
        rawMsg = "Forte affluence temporaire sur l'IA (503). Moteur de secours quantique activé, réessayez dans quelques secondes.";
      }
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

          {/* Right Action Tools: Supabase Config, Sound FX & Matrix Rain */}
          <div className="flex items-center gap-2">
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
                placeholder="Entrez l'URL du site e-commerce (ex: https://www.amazon.fr/s?k=macbook ou https://www.apple.com/...)"
                className="w-full bg-slate-900/90 border-2 border-emerald-500/40 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66] focus:shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={job.status === 'aspirating' || job.status === 'scanning'}
              className="relative px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-[#00ff66] to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black font-mono text-sm tracking-wider uppercase transition-all transform active:scale-95 shadow-[0_0_20px_rgba(0,255,102,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
            >
              <Zap className={`w-4 h-4 ${job.status === 'aspirating' ? 'animate-spin' : ''}`} />
              <span>
                {job.status === 'aspirating' || job.status === 'scanning'
                  ? 'ASPIRATION EN COURS...'
                  : 'ASPIRER LE CATALOGUE [VACUUM]'}
              </span>
            </button>
          </form>

          {/* Quick Telemetry Bar under input */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-900">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Moteur : <strong className="text-slate-200">Gemini 3.8 Flash + Deep DOM Vacuum</strong>
            </span>
            <span className="text-cyan-400">
              Détection auto : Prix, Stocks, Rabais, Spécifications, Images HD
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
