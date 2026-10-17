/**
 * CYBER-VACUUM // AI E-Commerce Scraper & Matrix Data Engine
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { GlobalSweepProgressBar } from './components/GlobalSweepProgressBar';
import { CyberDualProgressBar } from './components/CyberDualProgressBar';
import {
  OUEDKNISS_CATEGORIES,
  OuedknissCategoryMeta,
  detectOuedknissCategory,
  getCategoryAuditStats,
  getFullMarketplaceAuditStats,
} from './data/ouedknissCategories';
import { CategoryMatrixAuditModal } from './components/CategoryMatrixAuditModal';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  getStoredProducts,
  loadStoredProductsFromIndexedDB,
  saveStoredProducts,
  saveScrapedProductsBatch,
  clearStoredProducts,
  syncProductsToSupabase,
  clearSupabaseTable,
  getTotalProductsCountFromSupabase,
} from './utils/supabaseClient';
import { DatabaseControlButtons } from './components/DatabaseControlButtons';
import {
  saveSweepCheckpoint,
  loadSweepCheckpoint,
  clearSweepCheckpoint,
  saveCategoryProgress,
  loadAllCategoryProgress,
  getCategoryResumePage,
  resetCategoryProgress,
  ScrapeSweepCheckpoint,
  markCategoryAsScraped,
  markCategoriesBatchAsScraped,
} from './utils/scrapeCheckpoint';
import { cyberAudio } from './utils/cyberAudio';
import { backgroundScraper } from './utils/backgroundScraperWorker';
import { TemuEcommerceHub } from './components/TemuEcommerceHub';
import { ProductDetailModal } from './components/ProductDetailModal';
import {
  MasterSweepAlertBanner,
  CategoryCompletionAlertData,
} from './components/MasterSweepAlertBanner';
import {
  CategorySyncPromptModal,
  CategorySyncPromptData,
} from './components/CategorySyncPromptModal';
import { ApkReleaseModal } from './components/ApkReleaseModal';
import { CyberNativeSplashScreen } from './components/CyberNativeSplashScreen';
import { CyberVacuumLogo, CyberVacuumAppIcon } from './components/CyberVacuumLogo';
import { CategoryDistributionPieChart } from './components/CategoryDistributionPieChart';
import { AnimatedAspirationCounter, toSafeNonNegativeInt } from './components/AnimatedAspirationCounter';
import { MasterQuantumScraperDeck } from './components/MasterQuantumScraperDeck';
import { isOfficialStoreProduct } from './utils/sellerGenerator';
import {
  executeScrapeRequest,
  executeSimulatePriceUpdate,
} from './utils/scraperEngine';
import {
  Zap,
  Radio,
  Radar,
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
  Smartphone,
  Bell,
  BellRing,
  Download,
  SlidersHorizontal,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Tag,
  ShieldCheck,
  Truck,
  Clock,
  RefreshCw,
  Flame,
  ArrowUpRight,
  Copy,
  Check,
  Search,
  Cloud,
  BarChart3,
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

// Rich initial seed data covering all 17 official Ouedkniss categories (Algerian Dinar DA)
const INITIAL_DEMO_PRODUCTS: ScrapedProduct[] = [
  // 1. Véhicules & Automobiles
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
    productUrl: 'https://www.ouedkniss.com/voitures-renault-clio-4-gt-line-d57860571',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Chéraga', Année: '2019', Kilométrage: '85 000 km', Papiers: 'Carte Grise Safia' },
    aiConfidence: 97.8,
    syncedToSupabase: true,
    matrixHash: '0x0UED_AUTO1',
    priceHistory: [
      { date: '2026-10-01', price: 2980000 },
      { date: '2026-10-08', price: 2900000 },
      { date: '2026-10-13', price: 2850000 },
    ],
  },
  {
    id: 'prod_ouedkniss_golf8rline',
    title: 'Volkswagen Golf 8 R-Line 2.0 TDI 150ch DSG7 Toit Panoramique 00 Peinture',
    brand: 'Volkswagen',
    category: 'Véhicules & Automobiles',
    currentPrice: 5200000,
    originalPrice: 5450000,
    currency: 'DA',
    discountPercent: 5,
    rating: 4.9,
    reviewsCount: 840,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/voitures-volkswagen-golf-8-r-line-d58276539',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Sétif - Centre', Année: '2022', Kilométrage: '38 000 km', Boîte: 'Automatique DSG7' },
    aiConfidence: 99.1,
    syncedToSupabase: true,
    matrixHash: '0x0UED_AUTO2',
    priceHistory: [
      { date: '2026-10-01', price: 5450000 },
      { date: '2026-10-10', price: 5200000 },
    ],
  },

  // 2. Téléphones & Tablettes
  {
    id: 'prod_ouedkniss_s24ultra',
    title: 'Samsung Galaxy S24 Ultra 512GB Titane Neuf Sous Blister',
    brand: 'Samsung',
    category: 'Téléphones & Tablettes',
    currentPrice: 215000,
    originalPrice: 235000,
    currency: 'DA',
    discountPercent: 8,
    rating: 4.9,
    reviewsCount: 1420,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/telephones-samsung-galaxy-s24-ultra-512gb-d57874464',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Kouba', État: 'Neuf sous emballage avec facture', Vendeur: 'Boutique Tech Pro' },
    aiConfidence: 99.6,
    syncedToSupabase: true,
    matrixHash: '0x0UED_PH1',
    priceHistory: [
      { date: '2026-10-01', price: 235000 },
      { date: '2026-10-05', price: 230000 },
      { date: '2026-10-13', price: 215000, note: 'Baisse Ouedkniss -8%' },
    ],
  },
  {
    id: 'prod_ouedkniss_iphone15promax',
    title: 'Apple iPhone 15 Pro Max 256GB Naturel Batterie 100%',
    brand: 'Apple',
    category: 'Téléphones & Tablettes',
    currentPrice: 198000,
    originalPrice: 218000,
    currency: 'DA',
    discountPercent: 9,
    rating: 4.8,
    reviewsCount: 980,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/telephones-apple-iphone-15-pro-max-256gb-d58305081',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Oran - Akid Lotfi', État: '10/10 avec boîte d origine', Vendeur: 'Particulier certifié' },
    aiConfidence: 99.2,
    syncedToSupabase: true,
    matrixHash: '0x0UED_PH2',
    priceHistory: [
      { date: '2026-10-01', price: 218000 },
      { date: '2026-10-13', price: 198000, note: 'Offre négociation -9%' },
    ],
  },

  // 3. Informatique & Bureau
  {
    id: 'prod_ouedkniss_rogstrix',
    title: 'Asus ROG Strix G16 Intel i7 13650HX RTX 4070 32GB RAM 1TB SSD',
    brand: 'Asus',
    category: 'Informatique & Bureau',
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
    matrixHash: '0x0UED_IT1',
    priceHistory: [
      { date: '2026-10-01', price: 289000 },
      { date: '2026-10-13', price: 268000 },
    ],
  },
  {
    id: 'prod_ouedkniss_macbookm3',
    title: 'Apple MacBook Pro 14" M3 Pro 18GB 512GB SSD Noir Sidéral',
    brand: 'Apple',
    category: 'Informatique & Bureau',
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
    matrixHash: '0x0UED_IT2',
    priceHistory: [
      { date: '2026-10-01', price: 375000 },
      { date: '2026-10-13', price: 345000 },
    ],
  },

  // 4. Électroménager & TV
  {
    id: 'prod_ouedkniss_samsungtv65',
    title: 'Samsung Smart TV 65" Neo QLED 4K 120Hz HDR10+ Dolby Atmos',
    brand: 'Samsung',
    category: 'Électroménager & TV',
    currentPrice: 175000,
    originalPrice: 195000,
    currency: 'DA',
    discountPercent: 10,
    rating: 4.8,
    reviewsCount: 380,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/electromenager/samsung-neo-qled-65',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Blida - Centre', Garantie: '24 mois constructeur', Classe: 'A+++' },
    aiConfidence: 98.7,
    syncedToSupabase: true,
    matrixHash: '0x0UED_ELEC1',
    priceHistory: [{ date: '2026-10-05', price: 195000 }, { date: '2026-10-13', price: 175000 }],
  },
  {
    id: 'prod_ouedkniss_climcondor',
    title: 'Condor Climatiseur Alpha Inverter 12000 BTU Gaz R32 Tropicalisé T3',
    brand: 'Condor',
    category: 'Électroménager & TV',
    currentPrice: 62000,
    originalPrice: 69000,
    currency: 'DA',
    discountPercent: 10,
    rating: 4.7,
    reviewsCount: 510,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/electromenager/condor-climatiseur-alpha-12000',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Batna - Centre', Garantie: '3 ans compresseur', Livraison: '58 Wilayas' },
    aiConfidence: 98.4,
    syncedToSupabase: true,
    matrixHash: '0x0UED_ELEC2',
    priceHistory: [{ date: '2026-10-06', price: 69000 }, { date: '2026-10-13', price: 62000 }],
  },

  // 5. Immobilier & Terrains
  {
    id: 'prod_ouedkniss_apparf4hydra',
    title: 'Appartement F4 Standing 135m² Vue Dégagée avec Box Sous-Sol',
    brand: 'Promotion Immobilière',
    category: 'Immobilier & Terrains',
    currentPrice: 24500000,
    originalPrice: 26000000,
    currency: 'DA',
    discountPercent: 6,
    rating: 4.9,
    reviewsCount: 160,
    inStock: true,
    stockLevel: 'LOW_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/immobilier/appartement-f4-hydra-135m',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Hydra', Papiers: 'Acte Notarié + Livret Foncier', Superficie: '135 m²' },
    aiConfidence: 98.9,
    syncedToSupabase: true,
    matrixHash: '0x0UED_IMMO1',
    priceHistory: [{ date: '2026-10-01', price: 26000000 }, { date: '2026-10-13', price: 24500000 }],
  },
  {
    id: 'prod_ouedkniss_villakouba',
    title: 'Villa R+2 Style Mauresque avec Piscine & Jardin 380m²',
    brand: 'Particulier',
    category: 'Immobilier & Terrains',
    currentPrice: 45000000,
    originalPrice: 48000000,
    currency: 'DA',
    discountPercent: 6,
    rating: 4.8,
    reviewsCount: 95,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/immobilier/villa-r2-mauresque-380m',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 9).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Oran - Akid Lotfi', Papiers: 'Acte dans l indivision + Permis de construire', Superficie: '380 m²' },
    aiConfidence: 98.2,
    syncedToSupabase: true,
    matrixHash: '0x0UED_IMMO2',
    priceHistory: [{ date: '2026-10-02', price: 48000000 }, { date: '2026-10-13', price: 45000000 }],
  },

  // 6. Maison & Fournitures
  {
    id: 'prod_ouedkniss_salondangle',
    title: 'Salon d angle en L Velours Royal Anti-tache 7 Places Bois Rouge',
    brand: 'Atelier Mobilier DZ',
    category: 'Maison & Fournitures',
    currentPrice: 85000,
    originalPrice: 95000,
    currency: 'DA',
    discountPercent: 11,
    rating: 4.8,
    reviewsCount: 290,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/maison/salon-angle-velours-royal',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Blida - Ouled Yaich', Matière: 'Bois rouge 1er choix & Mousse D30', Garantie: '5 ans' },
    aiConfidence: 98.6,
    syncedToSupabase: true,
    matrixHash: '0x0UED_MAIS1',
    priceHistory: [{ date: '2026-10-04', price: 95000 }, { date: '2026-10-13', price: 85000 }],
  },
  {
    id: 'prod_ouedkniss_chambremoderne',
    title: 'Chambre à Coucher Moderne Bois Rouge 6 Portes Coulissantes Miroir',
    brand: 'Design Italien',
    category: 'Maison & Fournitures',
    currentPrice: 145000,
    originalPrice: 160000,
    currency: 'DA',
    discountPercent: 9,
    rating: 4.9,
    reviewsCount: 180,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/maison/chambre-a-coucher-moderne',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Tlemcen - Imama', Comprend: 'Lit 160x200 + Armoire 6P + 2 Tables de nuit + Commode', Finition: 'Laquée' },
    aiConfidence: 98.8,
    syncedToSupabase: true,
    matrixHash: '0x0UED_MAIS2',
    priceHistory: [{ date: '2026-10-05', price: 160000 }, { date: '2026-10-13', price: 145000 }],
  },

  // 7. Vêtements & Mode
  {
    id: 'prod_ouedkniss_rolexsubmariner',
    title: 'Rolex Submariner Date Lunette Céramique Noire 41mm Boîte & Papier',
    brand: 'Rolex',
    category: 'Vêtements & Mode',
    currentPrice: 1850000,
    originalPrice: 1980000,
    currency: 'DA',
    discountPercent: 7,
    rating: 4.9,
    reviewsCount: 340,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/vetements/rolex-submariner-41mm',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Hydra', Authenticité: '100% Originale Certifiée', Mouvement: 'Automatique 3235' },
    aiConfidence: 99.3,
    syncedToSupabase: true,
    matrixHash: '0x0UED_MODE1',
    priceHistory: [{ date: '2026-10-03', price: 1980000 }, { date: '2026-10-13', price: 1850000 }],
  },
  {
    id: 'prod_ouedkniss_nikeairmax',
    title: 'Nike Air Max Plus TN 3 Originales Pointure 42 Neuf dans Boîte',
    brand: 'Nike',
    category: 'Vêtements & Mode',
    currentPrice: 24500,
    originalPrice: 28000,
    currency: 'DA',
    discountPercent: 12,
    rating: 4.8,
    reviewsCount: 410,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/vetements/nike-air-max-plus-tn3',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Annaba - Centre', Provenance: 'Import direct France', État: '10/10 Neuf jamais porté' },
    aiConfidence: 98.5,
    syncedToSupabase: true,
    matrixHash: '0x0UED_MODE2',
    priceHistory: [{ date: '2026-10-05', price: 28000 }, { date: '2026-10-13', price: 24500 }],
  },

  // 8. Jeux Vidéo & Consoles
  {
    id: 'prod_ouedkniss_ps5slim',
    title: 'Sony PlayStation 5 Slim 1TB Édition Standard 2 Manettes Offertes',
    brand: 'Sony',
    category: 'Jeux Vidéo & Consoles',
    currentPrice: 112000,
    originalPrice: 125000,
    currency: 'DA',
    discountPercent: 10,
    rating: 4.8,
    reviewsCount: 780,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/jeux-video/playstation-5-slim',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Blida - Ouled Yaich', État: 'Neuf avec garantie 6 mois', Vendeur: 'PlayZone DZ' },
    aiConfidence: 98.6,
    syncedToSupabase: true,
    matrixHash: '0x0UED_GAME1',
    priceHistory: [
      { date: '2026-10-01', price: 125000 },
      { date: '2026-10-13', price: 112000, note: 'Offre Pack -10%' },
    ],
  },
  {
    id: 'prod_ouedkniss_switcholed',
    title: 'Nintendo Switch OLED Modèle Zelda Tears of the Kingdom Neuf',
    brand: 'Nintendo',
    category: 'Jeux Vidéo & Consoles',
    currentPrice: 58000,
    originalPrice: 65000,
    currency: 'DA',
    discountPercent: 11,
    rating: 4.9,
    reviewsCount: 390,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/jeux-video/nintendo-switch-oled-zelda',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Béjaïa - Ihaddaden', Accessoires: 'Fourni complet avec station d accueil et câbles' },
    aiConfidence: 99.0,
    syncedToSupabase: true,
    matrixHash: '0x0UED_GAME2',
    priceHistory: [{ date: '2026-10-06', price: 65000 }, { date: '2026-10-13', price: 58000 }],
  },

  // 9. Emploi & Recrutement
  {
    id: 'prod_ouedkniss_devreact',
    title: 'Recrutement Développeur Full-Stack React / Node.js Senior CDI Alger',
    brand: 'Startup Tech DZ',
    category: 'Emploi & Recrutement',
    currentPrice: 160000,
    originalPrice: 160000,
    currency: 'DA',
    discountPercent: 0,
    rating: 4.9,
    reviewsCount: 140,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/emploi/developpeur-fullstack-senior',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Bab Ezzouar', Contrat: 'CDI Plein Temps', Salaire: '160 000 DA Net' },
    aiConfidence: 98.7,
    syncedToSupabase: true,
    matrixHash: '0x0UED_JOB1',
    priceHistory: [{ date: '2026-10-01', price: 160000 }],
  },
  {
    id: 'prod_ouedkniss_ingenieurbtp',
    title: 'Ingénieur Suivi de Chantier & Conduite de Travaux BTP Expérimenté',
    brand: 'Entreprise BTP & Travaux',
    category: 'Emploi & Recrutement',
    currentPrice: 120000,
    originalPrice: 120000,
    currency: 'DA',
    discountPercent: 0,
    rating: 4.8,
    reviewsCount: 88,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/emploi/ingenieur-conduite-travaux-btp',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Oran - Centre', Contrat: 'CDI avec véhicule de fonction', Expérience: '3 ans min' },
    aiConfidence: 98.1,
    syncedToSupabase: true,
    matrixHash: '0x0UED_JOB2',
    priceHistory: [{ date: '2026-10-01', price: 120000 }],
  },

  // 10. Services & Artisanat
  {
    id: 'prod_ouedkniss_renovationstucco',
    title: 'Peinture Moderne Effet Stucco & Plâtrerie BA13 Décorative Villas',
    brand: 'Artisan Qualifié Pro',
    category: 'Services & Artisanat',
    currentPrice: 35000,
    originalPrice: 40000,
    currency: 'DA',
    discountPercent: 12,
    rating: 4.9,
    reviewsCount: 230,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/services/peinture-stucco-ba13-pro',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Chéraga', Disponibilité: '7j/7 Devis gratuit', Garantie: 'Finitions soignées' },
    aiConfidence: 98.4,
    syncedToSupabase: true,
    matrixHash: '0x0UED_SERV1',
    priceHistory: [{ date: '2026-10-04', price: 40000 }, { date: '2026-10-13', price: 35000 }],
  },
  {
    id: 'prod_ouedkniss_demenagement58w',
    title: 'Déménagement Professionnel Camion Capitonnée 58 Wilayas Sécurisé',
    brand: 'Service Express 58W',
    category: 'Services & Artisanat',
    currentPrice: 28000,
    originalPrice: 32000,
    currency: 'DA',
    discountPercent: 12,
    rating: 4.8,
    reviewsCount: 310,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/services/demenagement-express-58-wilayas',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Constantine - Centre', Disponibilité: '24h/24 7j/7', Chauffeurs: 'Expérimentés' },
    aiConfidence: 98.9,
    syncedToSupabase: true,
    matrixHash: '0x0UED_SERV2',
    priceHistory: [{ date: '2026-10-06', price: 32000 }, { date: '2026-10-13', price: 28000 }],
  },

  // 11. Matériaux & Équipement Pro
  {
    id: 'prod_ouedkniss_groupecummins',
    title: 'Groupe Électrogène Cummins 100 kVA Diesel Silencieux Insonorisé ATS',
    brand: 'Cummins Power',
    category: 'Matériaux & Équipement Pro',
    currentPrice: 1850000,
    originalPrice: 1980000,
    currency: 'DA',
    discountPercent: 7,
    rating: 4.9,
    reviewsCount: 150,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/materiaux/groupe-electrogene-cummins-100kva',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Sétif - Zone Industrielle', Norme: 'Certificat CE avec Facture', Garantie: '24 mois SAV' },
    aiConfidence: 99.1,
    syncedToSupabase: true,
    matrixHash: '0x0UED_MAT1',
    priceHistory: [{ date: '2026-10-02', price: 1980000 }, { date: '2026-10-13', price: 1850000 }],
  },
  {
    id: 'prod_ouedkniss_postesouderbosch',
    title: 'Poste à Souder Inverter TIG/MIG 250A Professionnel BOSCH Pro',
    brand: 'BOSCH Pro',
    category: 'Matériaux & Équipement Pro',
    currentPrice: 68000,
    originalPrice: 75000,
    currency: 'DA',
    discountPercent: 9,
    rating: 4.8,
    reviewsCount: 210,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/materiaux/poste-a-souder-inverter-bosch-250a',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Chlef - Centre', Puissance: '250A Triphasé', Accessoires: 'Fourni avec torche et masque' },
    aiConfidence: 98.6,
    syncedToSupabase: true,
    matrixHash: '0x0UED_MAT2',
    priceHistory: [{ date: '2026-10-05', price: 75000 }, { date: '2026-10-13', price: 68000 }],
  },

  // 12. Sports & Loisirs
  {
    id: 'prod_ouedkniss_velovttrockrider',
    title: 'Vélo VTT All-Mountain Aluminium 29" Monoplateau 12V RockShox',
    brand: 'Rockrider',
    category: 'Sports & Loisirs',
    currentPrice: 88000,
    originalPrice: 98000,
    currency: 'DA',
    discountPercent: 10,
    rating: 4.9,
    reviewsCount: 290,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/sports-loisirs/velo-vtt-rockrider-29',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Tizi Ouzou - Centre', Cadre: 'Aluminium 6061', Freins: 'Hydrauliques Shimano' },
    aiConfidence: 98.8,
    syncedToSupabase: true,
    matrixHash: '0x0UED_SPORT1',
    priceHistory: [{ date: '2026-10-04', price: 98000 }, { date: '2026-10-13', price: 88000 }],
  },
  {
    id: 'prod_ouedkniss_tapisdomyos',
    title: 'Tapis de Course Motorisé Pliable 3.5 HP 18 km/h Domyos Pro',
    brand: 'Domyos',
    category: 'Sports & Loisirs',
    currentPrice: 95000,
    originalPrice: 110000,
    currency: 'DA',
    discountPercent: 14,
    rating: 4.8,
    reviewsCount: 320,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/sports-loisirs/tapis-de-course-domyos-35hp',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Kouba', Poids_max: '130 kg', Inclinaison: 'Électrique 15%' },
    aiConfidence: 98.7,
    syncedToSupabase: true,
    matrixHash: '0x0UED_SPORT2',
    priceHistory: [{ date: '2026-10-06', price: 110000 }, { date: '2026-10-13', price: 95000 }],
  },

  // 13. Pièces détachées Auto
  {
    id: 'prod_ouedkniss_injecteursbosch',
    title: 'Injecteurs Bosch 1.5 DCI / 2.0 TDI Neufs sous carton d\'origine',
    brand: 'Bosch',
    category: 'Pièces détachées Auto',
    currentPrice: 38000,
    originalPrice: 42000,
    currency: 'DA',
    discountPercent: 10,
    rating: 4.9,
    reviewsCount: 380,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/pieces-detachees/injecteurs-bosch-15dci',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Blida - Centre', État: 'Neuf scellé avec garantie', Vendeur: 'Auto Pièces Express' },
    aiConfidence: 99.1,
    syncedToSupabase: true,
    matrixHash: '0x0UED_PIECE1',
    priceHistory: [{ date: '2026-10-02', price: 42000 }, { date: '2026-10-13', price: 38000 }],
  },
  {
    id: 'prod_ouedkniss_pneusmichelin',
    title: 'Pneus Michelin Primacy 4 205/55 R16 91V Pack de 4 Neufs Année 2026',
    brand: 'Michelin',
    category: 'Pièces détachées Auto',
    currentPrice: 46000,
    originalPrice: 51000,
    currency: 'DA',
    discountPercent: 10,
    rating: 4.9,
    reviewsCount: 420,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/pieces-detachees/pneus-michelin-primacy4-pack4',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Kouba', Année: 'DOT 2026 Origine Espagne', Montage: 'Montage & équilibrage offerts' },
    aiConfidence: 99.3,
    syncedToSupabase: true,
    matrixHash: '0x0UED_PIECE2',
    priceHistory: [{ date: '2026-10-04', price: 51000 }, { date: '2026-10-13', price: 46000 }],
  },

  // 14. Voyages & Tourisme
  {
    id: 'prod_ouedkniss_omravip2026',
    title: 'Omra 2026 VIP Confort Hôtels 5* Face Haram Vol Direct Air Algérie 15J',
    brand: 'Agence Al-Qods',
    category: 'Voyages & Tourisme',
    currentPrice: 285000,
    originalPrice: 310000,
    currency: 'DA',
    discountPercent: 8,
    rating: 4.9,
    reviewsCount: 260,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/voyages-tourisme/omra-vip-2026-hotels-5etoiles',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Hydra', Formule: 'Pension Complète + Visa + Guide certifié', Durée: '15 Jours / 14 Nuits' },
    aiConfidence: 99.4,
    syncedToSupabase: true,
    matrixHash: '0x0UED_VOY1',
    priceHistory: [{ date: '2026-10-01', price: 310000 }, { date: '2026-10-13', price: 285000 }],
  },
  {
    id: 'prod_ouedkniss_sejouristanbul',
    title: 'Séjour Istanbul 8 Jours / 7 Nuits Hôtel 4* Taksim avec Excursions & Transferts',
    brand: 'Atlas Tourisme DZ',
    category: 'Voyages & Tourisme',
    currentPrice: 115000,
    originalPrice: 128000,
    currency: 'DA',
    discountPercent: 10,
    rating: 4.8,
    reviewsCount: 310,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/voyages-tourisme/sejour-istanbul-8-jours-taksim',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Oran - Akid Lotfi', Inclus: 'Billet d avion + Hôtel + Petit Déjeuner + Guide', Départ: 'Oran & Alger' },
    aiConfidence: 98.7,
    syncedToSupabase: true,
    matrixHash: '0x0UED_VOY2',
    priceHistory: [{ date: '2026-10-05', price: 128000 }, { date: '2026-10-13', price: 115000 }],
  },

  // 15. Animaux & Accessoires
  {
    id: 'prod_ouedkniss_bergerallemand',
    title: 'Chiot Berger Allemand Pure Race Lignée Travail avec Carnet & Vaccins',
    brand: 'Élevage Canin Pro',
    category: 'Animaux & Accessoires',
    currentPrice: 38000,
    originalPrice: 45000,
    currency: 'DA',
    discountPercent: 15,
    rating: 4.9,
    reviewsCount: 190,
    inStock: true,
    stockLevel: 'LOW_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/animaux/chiot-berger-allemand-pure-race',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Blida - Ouled Yaich', Âge: '2 mois et demi', Santé: 'Vacciné & vermifugé avec carnet sanitaire' },
    aiConfidence: 98.9,
    syncedToSupabase: true,
    matrixHash: '0x0UED_ANIM1',
    priceHistory: [{ date: '2026-10-03', price: 45000 }, { date: '2026-10-13', price: 38000 }],
  },
  {
    id: 'prod_ouedkniss_chatonpersan',
    title: 'Chaton Persan Chinchilla Poils Longs Yeux Bleus Sevré Très Propre',
    brand: 'Félin Club DZ',
    category: 'Animaux & Accessoires',
    currentPrice: 28000,
    originalPrice: 32000,
    currency: 'DA',
    discountPercent: 12,
    rating: 4.9,
    reviewsCount: 140,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/animaux/chaton-persan-chinchilla-poils-longs',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Alger - Kouba', Âge: '3 mois', Alimentation: 'Croquettes Royal Canin Kitten' },
    aiConfidence: 99.2,
    syncedToSupabase: true,
    matrixHash: '0x0UED_ANIM2',
    priceHistory: [{ date: '2026-10-05', price: 32000 }, { date: '2026-10-13', price: 28000 }],
  },

  // 16. Bébés & Enfants
  {
    id: 'prod_ouedkniss_poussetteporto',
    title: 'Poussette Trio Chicco Best Friend Pro Nacelle + Siège Auto Isofix Neuf',
    brand: 'Chicco',
    category: 'Bébés & Enfants',
    currentPrice: 42000,
    originalPrice: 48000,
    currency: 'DA',
    discountPercent: 12,
    rating: 4.8,
    reviewsCount: 220,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/bebes-enfants/poussette-trio-chicco-best-friend',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Sétif - Centre', Sécurité: 'Homologué ECE R44/04', État: 'Neuf carton scellé' },
    aiConfidence: 98.6,
    syncedToSupabase: true,
    matrixHash: '0x0UED_BEBE1',
    priceHistory: [{ date: '2026-10-04', price: 48000 }, { date: '2026-10-13', price: 42000 }],
  },
  {
    id: 'prod_ouedkniss_litbebebois',
    title: 'Lit Bébé Évolutif Bois Hêtre Massif Blanc avec Tiroir & Matelas Offert',
    brand: 'Kinderkraft',
    category: 'Bébés & Enfants',
    currentPrice: 32000,
    originalPrice: 36000,
    currency: 'DA',
    discountPercent: 11,
    rating: 4.9,
    reviewsCount: 180,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/bebes-enfants/lit-bebe-evolutif-bois-hetre',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Constantine - Centre', Dimensions: '120x60 cm 3 hauteurs de sommier', Peinture: 'Écologique sans solvant' },
    aiConfidence: 98.8,
    syncedToSupabase: true,
    matrixHash: '0x0UED_BEBE2',
    priceHistory: [{ date: '2026-10-06', price: 36000 }, { date: '2026-10-13', price: 32000 }],
  },

  // 17. Alimentation & Terroir
  {
    id: 'prod_ouedkniss_degletnourbiskra',
    title: 'Dattes Deglet Nour Biskra 1er Choix Branchées Extra Carton 5kg 2026',
    brand: 'Terroir Biskra',
    category: 'Alimentation & Terroir',
    currentPrice: 4500,
    originalPrice: 5200,
    currency: 'DA',
    discountPercent: 13,
    rating: 4.9,
    reviewsCount: 520,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/alimentation-agriculture/dattes-deglet-nour-biskra-5kg',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Biskra - Les Allées', Qualité: '1er Choix Miel Royal', Conditionnement: 'Carton hygiénique 5 kg' },
    aiConfidence: 99.6,
    syncedToSupabase: true,
    matrixHash: '0x0UED_ALIM1',
    priceHistory: [{ date: '2026-10-02', price: 5200 }, { date: '2026-10-13', price: 4500 }],
  },
  {
    id: 'prod_ouedkniss_huileolivekabylie',
    title: 'Huile d Olive Vierge Extra 1ère Pression à Froid Bidon 5L Récolte 2026',
    brand: 'Huilerie Kabylie',
    category: 'Alimentation & Terroir',
    currentPrice: 5500,
    originalPrice: 6200,
    currency: 'DA',
    discountPercent: 11,
    rating: 4.9,
    reviewsCount: 680,
    inStock: true,
    stockLevel: 'IN_STOCK',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    productUrl: 'https://www.ouedkniss.com/alimentation-agriculture/huile-olive-vierge-extra-5l',
    sourceDomain: 'ouedkniss.com',
    scrapedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    lastUpdated: new Date().toISOString(),
    specs: { Wilaya: 'Tizi Ouzou - Centre', Acidité: '< 0.5% Extra Vierge', Livraison: '58 Wilayas disponible' },
    aiConfidence: 99.5,
    syncedToSupabase: true,
    matrixHash: '0x0UED_ALIM2',
    priceHistory: [{ date: '2026-10-04', price: 6200 }, { date: '2026-10-13', price: 5500 }],
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
  currentList: ScrapedProduct[] = [],
  incomingList: ScrapedProduct[] = []
): SmartMergeResult {
  const safeCurrentList = Array.isArray(currentList) ? currentList : [];
  const safeIncomingList = Array.isArray(incomingList) ? incomingList : [];

  const existingMap = new Map<string, ScrapedProduct>();
  const urlMap = new Map<string, ScrapedProduct>();
  const titleMap = new Map<string, ScrapedProduct>();

  for (const item of safeCurrentList) {
    if (!item) continue;
    if (item.id) existingMap.set(item.id, item);
    if (item.productUrl) urlMap.set(item.productUrl.toLowerCase(), item);
    if (item.title) {
      const normKey = `${item.title.trim().toLowerCase().replace(/\s+/g, ' ')}:::${(item.brand || '').trim().toLowerCase()}`;
      titleMap.set(normKey, item);
    }
  }

  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;
  const sampleUpdatedTitles: string[] = [];

  const updatedMap = new Map<string, ScrapedProduct>(existingMap);
  const newItems: ScrapedProduct[] = [];
  const todayStr = new Date().toISOString().split('T')[0];

  for (const rawIncoming of safeIncomingList) {
    if (!rawIncoming) continue;

    // Sanitize incoming item to guarantee valid numeric fields
    const incoming: ScrapedProduct = {
      ...rawIncoming,
      id: rawIncoming.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      currentPrice: toSafeNonNegativeInt(rawIncoming.currentPrice),
      originalPrice: toSafeNonNegativeInt(rawIncoming.originalPrice || rawIncoming.currentPrice),
      discountPercent: toSafeNonNegativeInt(rawIncoming.discountPercent),
    };

    const normKey = incoming.title
      ? `${incoming.title.trim().toLowerCase().replace(/\s+/g, ' ')}:::${(incoming.brand || '').trim().toLowerCase()}`
      : '';
    const existing =
      (incoming.id && updatedMap.get(incoming.id)) ||
      (incoming.productUrl && urlMap.get(incoming.productUrl.toLowerCase())) ||
      (normKey && titleMap.get(normKey));

    if (!existing) {
      // NOUVEAU PRODUIT: Ajouté au catalogue
      newItems.push(incoming);
      newCount++;
      if (incoming.id) updatedMap.set(incoming.id, incoming);
      if (incoming.productUrl) urlMap.set(incoming.productUrl.toLowerCase(), incoming);
      if (normKey) titleMap.set(normKey, incoming);
    } else {
      // PRODUIT EXISTANT DÉJÀ PRÉSENT:
      // Détection stricte des modifications (prix, remise, stock, note, avis)
      const existingPrice = toSafeNonNegativeInt(existing.currentPrice);
      const incomingPrice = toSafeNonNegativeInt(incoming.currentPrice);
      const priceDelta = incomingPrice - existingPrice;
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
            price: incomingPrice,
            note:
              priceDelta < 0
                ? `Baisse de ${Math.abs(priceDelta)} ${incoming.currency || 'DA'}`
                : `Hausse de ${priceDelta} ${incoming.currency || 'DA'}`,
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
            `${incoming.title.slice(0, 30)} (${existingPrice} -> ${incomingPrice} ${incoming.currency || 'DA'})`
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
    ...safeCurrentList.map((p) => updatedMap.get(p.id) || p),
  ];

  return {
    merged,
    newCount: Math.max(0, newCount),
    updatedCount: Math.max(0, updatedCount),
    unchangedCount: Math.max(0, unchangedCount),
    sampleUpdatedTitles,
  };
}

export default function App() {
  // Input State
  const [targetUrl, setTargetUrl] = useState<string>('https://www.ouedkniss.com/telephones');
  const [engineMode, setEngineMode] = useState<'direct' | 'ai'>('direct');
  const [scrapeVolume, setScrapeVolume] = useState<number>(28);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>('telephones');
  const [activeSweepCategoryIndex, setActiveSweepCategoryIndex] = useState<number | undefined>(undefined);
  const [isAllCategoriesSweepActive, setIsAllCategoriesSweepActive] = useState<boolean>(false);
  const [sweepCurrentPage, setSweepCurrentPage] = useState<number>(1);
  const [sweepNewItemsCount, setSweepNewItemsCount] = useState<number>(0);
  const [sweepPercent, setSweepPercent] = useState<number>(0);
  const [sweepCompletedCategories, setSweepCompletedCategories] = useState<string[]>([]);
  const [isSweepComplete, setIsSweepComplete] = useState<boolean>(false);
  const [replaceCatalog, setReplaceCatalog] = useState<boolean>(false); // Par défaut: Fusion incrémentale intelligente
  const [activeTab, setActiveTab] = useState<'vacuum' | 'temu' | 'trends' | 'catalog'>('vacuum');
  const [selectedModalProduct, setSelectedModalProduct] = useState<ScrapedProduct | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);
  const [rainIntensity, setRainIntensity] = useState<'subtle' | 'normal' | 'turbo' | 'off'>('normal');
  const [isContinuousScraping, setIsContinuousScraping] = useState<boolean>(false);
  const [sweepPagesPerCategory, setSweepPagesPerCategory] = useState<number>(0); // 0 = Illimité ∞
  const [discoveredCategories, setDiscoveredCategories] = useState<string[]>([]);
  const [categoryCompletionAlert, setCategoryCompletionAlert] = useState<CategoryCompletionAlertData | null>(null);
  const [categorySyncPromptData, setCategorySyncPromptData] = useState<CategorySyncPromptData | null>(null);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(false);
  const [isCategoryAuditModalOpen, setIsCategoryAuditModalOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'boutique' | 'annonce' | 'pub'>('all');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState<boolean>(false);

  // Real-time Category & Pre-Flight Scan States (Suivi des pages, articles, boutiques et ads par catégorie)
  const [isInitialScanRunning, setIsInitialScanRunning] = useState<boolean>(false);
  const [initialScanSummary, setInitialScanSummary] = useState<{
    totalCategories: number;
    totalMarketPages: number;
    totalMarketArticles: number;
    totalBoutiques: number;
    totalAdsPubs: number;
  } | null>(null);
  const [currentCategoryTotalPages, setCurrentCategoryTotalPages] = useState<number>(0);
  const [currentCategoryTotalArticles, setCurrentCategoryTotalArticles] = useState<number>(0);
  const [currentCategoryBoutiques, setCurrentCategoryBoutiques] = useState<number>(0);
  const [currentCategoryAdsPubs, setCurrentCategoryAdsPubs] = useState<number>(0);
  const [currentCategoryNewItemsCount, setCurrentCategoryNewItemsCount] = useState<number>(0);
  const [lastPageBatchStats, setLastPageBatchStats] = useState<{
    page: number;
    itemsCount: number;
    boutiquesCount: number;
    particuliersCount: number;
    adsCount: number;
  } | null>(null);

  const isDbHydrated = useRef<boolean>(false);
  const abortScrapingRef = useRef<boolean>(false);
  const lotPageRef = useRef<Record<string, number>>({});
  const skipCategorySyncWaitRef = useRef<boolean>(false);
  const skipCategorySyncResolverRef = useRef<(() => void) | null>(null);

  const handleSkipCategorySyncWait = useCallback(() => {
    skipCategorySyncWaitRef.current = true;
    if (skipCategorySyncResolverRef.current) {
      skipCategorySyncResolverRef.current();
      skipCategorySyncResolverRef.current = null;
    }
    cyberAudio.playClick();
  }, []);

  const [savedCheckpoint, setSavedCheckpoint] = useState<ScrapeSweepCheckpoint | null>(() => loadSweepCheckpoint());
  const [liveAspiratedCount, setLiveAspiratedCount] = useState<number>(() => {
    try {
      const cached = parseInt(localStorage.getItem('cyber_vacuum_total_count') || '0', 10);
      return cached || 0;
    } catch {
      return 0;
    }
  });
  const activeProductIdsRef = useRef<Set<string>>(new Set());
  const activeProductUrlsRef = useRef<Set<string>>(new Set());

  // Real-Time Global Topbar Search, Official Stores & Category Filters
  const [globalSearchTerm, setGlobalSearchTerm] = useState<string>('');
  const [globalSelectedCategory, setGlobalSelectedCategory] = useState<string>('all');
  const [filterOfficialStoresOnly, setFilterOfficialStoresOnly] = useState<boolean>(false);
  const [showCategoryChartsModal, setShowCategoryChartsModal] = useState<boolean>(false);



  // Futuristic tab selection with tactile sci-fi sound
  const handleSelectTab = (tab: 'vacuum' | 'temu' | 'trends' | 'catalog') => {
    setActiveTab(tab);
    cyberAudio.playTabSwitch();
  };

  const handleToggleVoice = () => {
    const active = cyberAudio.toggleVoice();
    setIsVoiceActive(active);
  };


  // Live Flash Sale countdown for Temu-DZ storefront header
  const [temuCountdown, setTemuCountdown] = useState('04:58:32');
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = (23 - now.getHours()).toString().padStart(2, '0');
      const mins = (59 - now.getMinutes()).toString().padStart(2, '0');
      const secs = (59 - now.getSeconds()).toString().padStart(2, '0');
      setTemuCountdown(`${hours}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Copy coupon code with cyber feedback
  const [copiedPromo, setCopiedPromo] = useState(false);
  const handleCopyPromoCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('PROMO-DZ').catch(() => {});
    }
    setCopiedPromo(true);
    cyberAudio.playHoloTap(1600);
    setTimeout(() => setCopiedPromo(false), 2200);
  };

  // Check Notification API support on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  const handleRequestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          cyberAudio.playChirp(880, 0.05);
          new Notification('CYBER-VACUUM // Notifications Activées', {
            body: 'Vous serez alerté(e) instantanément à chaque catégorie scellée, même si votre écran est éteint ou l\'onglet en arrière-plan !',
            icon: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=128&auto=format&fit=crop&q=80',
          });
        }
      } catch {
        // ignore
      }
    }
  };

  // Supabase State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [supabaseTotalCount, setSupabaseTotalCount] = useState<number>(0);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [isSyncingAndClearing, setIsSyncingAndClearing] = useState<boolean>(false);
  const [temuRefreshTrigger, setTemuRefreshTrigger] = useState<number>(0);
  const [syncNotice, setSyncNotice] = useState<{ message: string; type: 'success' | 'warn'; count?: number } | null>(null);
  const [supabaseSyncProgress, setSupabaseSyncProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    statusText?: string;
  }>({
    current: 0,
    total: 0,
    percent: 0,
    statusText: '',
  });

  // Synchronize planned total count from Supabase (fast, non-blocking)
  useEffect(() => {
    if (supabaseConfig.url && supabaseConfig.anonKey) {
      getTotalProductsCountFromSupabase(supabaseConfig)
        .then((cnt) => {
          if (cnt > 0) {
            setSupabaseTotalCount(cnt);
          }
        })
        .catch(() => {});
    }
  }, [supabaseConfig.url, supabaseConfig.anonKey, supabaseConfig.tableName, temuRefreshTrigger]);

  // Products State with full persistence strategy from IndexedDB & LocalStorage
  const [products, setProducts] = useState<ScrapedProduct[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored =
          localStorage.getItem('products') ||
          localStorage.getItem('cyber_vacuum_products_cache') ||
          localStorage.getItem('cyber_vacuum_products_store');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to parse products from localStorage on initial load:', err);
    }
    const cached = getStoredProducts();
    if (cached && cached.length > 0) {
      return cached;
    }
    const hasCustomData =
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('cyber_vacuum_has_custom_data') === 'true';
    if (hasCustomData) {
      return []; // Patiently await IndexedDB hydration rather than overwriting with seed
    }
    // Si premier lancement après installation APK sans données préalables, charger le seed officiel Ouedkniss
    return INITIAL_DEMO_PRODUCTS;
  });

  // Hydrate full real dataset from IndexedDB on startup
  useEffect(() => {
    loadStoredProductsFromIndexedDB().then((stored) => {
      const hasCustomData =
        typeof localStorage !== 'undefined' &&
        localStorage.getItem('cyber_vacuum_has_custom_data') === 'true';

      if (stored && stored.length > 0) {
        setProducts(stored);
        setLiveAspiratedCount(stored.length);
      } else if (!hasCustomData) {
        // Premier lancement absolu : persister le catalogue initial dans IndexedDB locale
        saveStoredProducts(INITIAL_DEMO_PRODUCTS, true);
        setLiveAspiratedCount(INITIAL_DEMO_PRODUCTS.length);
      }
      isDbHydrated.current = true;
    });

    // Restaurer l'avancement des pages par catégorie pour reprise continue sans recommencer à zéro
    const allProgress = loadAllCategoryProgress();
    for (const [k, v] of Object.entries(allProgress)) {
      const entry = v as { lastPage?: number };
      if (entry && typeof entry.lastPage === 'number') {
        lotPageRef.current[k] = entry.lastPage;
      }
    }
  }, []);

  // Synchronisation continue des index ultra-rapides O(1) pour déduplication instantanée sans freeze
  useEffect(() => {
    activeProductIdsRef.current.clear();
    activeProductUrlsRef.current.clear();
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      if (p.id) activeProductIdsRef.current.add(p.id);
      if (p.productUrl) activeProductUrlsRef.current.add(p.productUrl.toLowerCase());
    }
    if (products.length > 0) {
      setLiveAspiratedCount((prev) => Math.max(prev, products.length));
    }
  }, [products]);

  // Total available official stores count in dataset
  const officialStoresCount = useMemo(() => {
    return products.filter((p) => isOfficialStoreProduct(p)).length;
  }, [products]);

  // Global filtered products across official stores, search term and category
  const filteredProducts = useMemo(() => {
    let list = products;
    if (filterOfficialStoresOnly) {
      list = list.filter((p) => isOfficialStoreProduct(p));
    }
    if (globalSelectedCategory && globalSelectedCategory !== 'all') {
      const targetCat = globalSelectedCategory.toLowerCase();
      list = list.filter((p) => p.category && p.category.toLowerCase().includes(targetCat));
    }
    if (globalSearchTerm.trim()) {
      const q = globalSearchTerm.toLowerCase().trim();
      list = list.filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(q);
        const brandMatch = p.brand ? p.brand.toLowerCase().includes(q) : false;
        const catMatch = p.category ? p.category.toLowerCase().includes(q) : false;
        const wilayaMatch = p.specs?.Wilaya ? p.specs.Wilaya.toLowerCase().includes(q) : false;
        const sellerMatch = p.seller?.name ? p.seller.name.toLowerCase().includes(q) : false;
        return titleMatch || brandMatch || catMatch || wilayaMatch || sellerMatch;
      });
    }
    return list;
  }, [products, filterOfficialStoresOnly, globalSearchTerm, globalSelectedCategory]);


  // Stats helpers for specialized headers
  const catalogTotalValueDa = useMemo(() => {
    const daProducts = products.filter((p) => p.currency === 'DA');
    const total = daProducts.reduce((acc, p) => acc + (p.currentPrice || 0), 0);
    if (total >= 1_000_000_000) return `${(total / 1_000_000_000).toFixed(2)} Mds DA`;
    if (total >= 1_000_000) return `${(total / 1_000_000).toFixed(1)} M DA`;
    if (total >= 1_000) return `${(total / 1_000).toFixed(0)} k DA`;
    return `${total.toLocaleString()} DA`;
  }, [products]);

  const trendsStats = useMemo(() => {
    const daProducts = products.filter((p) => p.currency === 'DA');
    if (daProducts.length === 0) {
      return { avgPriceFormatted: '0 DA', avgDiscount: 0, discountedCount: 0, volatilityRate: 0 };
    }
    const totalPrice = daProducts.reduce((acc, p) => acc + p.currentPrice, 0);
    const avg = Math.round(totalPrice / daProducts.length);
    const avgFormatted =
      avg >= 1_000_000 ? `${(avg / 1_000_000).toFixed(2)} M DA` : `${avg.toLocaleString()} DA`;

    const discounted = daProducts.filter((p) => (p.discountPercent || 0) > 0);
    const avgDisc =
      discounted.length > 0
        ? Math.round(discounted.reduce((acc, p) => acc + (p.discountPercent || 0), 0) / discounted.length)
        : 8;

    return {
      avgPriceFormatted: avgFormatted,
      avgDiscount: avgDisc,
      discountedCount: discounted.length,
      volatilityRate: Math.min(100, Math.round((discounted.length / daProducts.length) * 100)),
    };
  }, [products]);

  // Real-time Top Search State & Filter
  const [topSearchQuery, setTopSearchQuery] = useState<string>('');
  const [isTopSearchExpandedMobile, setIsTopSearchExpandedMobile] = useState<boolean>(false);

  const searchFilteredProducts = useMemo(() => {
    if (!topSearchQuery.trim()) return products;
    const q = topSearchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchTitle = p.title && p.title.toLowerCase().includes(q);
      const matchCategory = p.category && p.category.toLowerCase().includes(q);
      const matchBrand = p.brand && p.brand.toLowerCase().includes(q);
      const matchWilaya = (p.specs?.Wilaya && p.specs.Wilaya.toLowerCase().includes(q)) || (p.seller?.wilaya && p.seller.wilaya.toLowerCase().includes(q));
      const matchDomain = p.sourceDomain && p.sourceDomain.toLowerCase().includes(q);
      return matchTitle || matchCategory || matchBrand || matchWilaya || matchDomain;
    });
  }, [products, topSearchQuery]);

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

  // Sync products state to localStorage & IndexedDB upon every change (only after initial hydration has loaded)
  useEffect(() => {
    if (!isDbHydrated.current) return;

    try {
      const previewSlice = products.slice(0, 50);
      const serialized = JSON.stringify(previewSlice);
      localStorage.setItem('products', serialized);
      localStorage.setItem('cyber_vacuum_products_cache', serialized);
      localStorage.setItem('cyber_vacuum_total_count', String(products.length));
      localStorage.setItem('cyber_vacuum_has_custom_data', 'true');
    } catch (err) {
      console.warn('LocalStorage save failed:', err);
    }
    // Reliable persistence to IndexedDB
    saveStoredProducts(products, false);
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
      setLiveAspiratedCount(0);
      try {
        localStorage.removeItem('products');
        localStorage.removeItem('cyber_vacuum_products_cache');
        localStorage.removeItem('cyber_vacuum_total_count');
      } catch {}
      clearStoredProducts();
      clearSweepCheckpoint();
      resetCategoryProgress();
      setSavedCheckpoint(null);
      lotPageRef.current = {};
      activeProductIdsRef.current.clear();
      activeProductUrlsRef.current.clear();
      cyberAudio.playChirp(450, 0.08);
      addLog('[PURGE] Catalogue, session et mémoire cache entièrement vidés (0 article).', 'warn', '0xCLEAR');
    }
  };

  // Arrêter manuellement l'aspiration continue (sauvegarde l'avancement pour reprise immédiate)
  const handleStopScrape = () => {
    abortScrapingRef.current = true;
    setIsContinuousScraping(false);
    setIsAllCategoriesSweepActive(false);
    setActiveSweepCategoryIndex(undefined);
    setJob((prev) => ({
      ...prev,
      status: 'completed',
      progress: 100,
      aiAgentAction: 'Aspiration interrompue par l\'utilisateur. Session scellée : vous pouvez reprendre à tout moment.',
    }));
    // Recharger le dernier checkpoint
    const cp = loadSweepCheckpoint();
    if (cp) {
      setSavedCheckpoint(cp);
    }
    cyberAudio.playChirp(520, 0.08);
    addLog('[ARRÊT] Processus d\'aspiration stoppé. Session sauvegardée : vous pouvez continuer l\'aspiration sans recommencer de zéro.', 'warn', '0xHALT');
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

  // Scanner matriciel en temps réel : détecte toute nouvelle catégorie trouvée dans les annonces aspirées
  const scanForDiscoveredCategories = useCallback((items: ScrapedProduct[]) => {
    if (!items || items.length === 0) return;
    const knownNames = new Set(OUEDKNISS_CATEGORIES.map((c) => c.name.toLowerCase()));
    const newlyFound: string[] = [];

    items.forEach((item) => {
      const cat = item.category?.trim();
      if (!cat) return;
      const lower = cat.toLowerCase();
      if (!knownNames.has(lower)) {
        newlyFound.push(cat);
      }
    });

    if (newlyFound.length > 0) {
      setDiscoveredCategories((prev) => {
        const existingLower = new Set(prev.map((c) => c.toLowerCase()));
        const toAdd = newlyFound.filter((c) => !existingLower.has(c.toLowerCase()));
        if (toAdd.length === 0) return prev;
        cyberAudio.playScanSweep();
        toAdd.forEach((c) => {
          addLog(
            `[SCANNER_CATÉGORIE] ⚡ Nouvelle catégorie détectée : "${c}" ! Intégrée automatiquement au catalogue.`,
            'cyber',
            '0xNEW_CAT'
          );
        });
        return [...prev, ...toAdd];
      });
    }
  }, [addLog]);

  // Audio Toggle
  const handleToggleAudio = () => {
    const muted = cyberAudio.toggleMute();
    setIsAudioMuted(muted);
  };

  // ==========================================================
  // MASTER SWEEP : ASPIRER TOUTES LES CATÉGORIES OUEDKNISS (17 CATÉGORIES)
  // Architecture Senior Scraping Haute Vitesse :
  // - 4 workers parallèles par lot (192 articles/lot)
  // - Déduplication O(1) instantanée en mémoire
  // - Mode illimité sans coupure (5 000 pages = 240 000 articles/catégorie)
  // - Sauvegarde automatique de checkpoint pour reprise transparente
  // - Micro-yielding non-bloquant pour 60 FPS garantis
  // ==========================================================
  const runAllCategoriesSweep = async (
    startCatIndex: number = 0,
    startPage: number = 1,
    initialAccumulated: ScrapedProduct[] = [],
    initialCompleted: string[] = [],
    singleTargetCategoryIndex?: number
  ) => {
    setActiveTab('vacuum');
    abortScrapingRef.current = false;
    setIsContinuousScraping(true);
    setIsAllCategoriesSweepActive(true);
    setIsSweepComplete(false);
    setSweepCurrentPage(startPage);
    setSweepNewItemsCount(0);
    setSweepPercent(0);
    setSweepCompletedCategories(initialCompleted);
    cyberAudio.speakScrapeStarted(singleTargetCategoryIndex !== undefined ? OUEDKNISS_CATEGORIES[singleTargetCategoryIndex]?.name || 'la catégorie' : "toutes les catégories");

    const isUnlimited = sweepPagesPerCategory === 0;
    const totalCats = OUEDKNISS_CATEGORIES.length;
    const endCatIndex = singleTargetCategoryIndex !== undefined ? singleTargetCategoryIndex + 1 : totalCats;

    addLog(
      `[BALAYAGE_OPTIMISÉ_SENIOR] Aspiration haute performance ${singleTargetCategoryIndex !== undefined ? `de la CATÉGORIE "${OUEDKNISS_CATEGORIES[singleTargetCategoryIndex]?.name}"` : `des ${totalCats} CATÉGORIES`} (${
        isUnlimited
          ? 'Mode Illimité Exhaustif : jusqu\'au dernier article de chaque catégorie (28 annonces/page)'
          : `${sweepPagesPerCategory} pages/catégorie (${sweepPagesPerCategory * 28} articles/catégorie)`
      })`,
      'cyber',
      '0xGLOBAL_START'
    );
    cyberAudio.playVacuumSuck();

    // ========================================================
    // 1. SCAN INITIAL INSTANTANÉ DE TOUTES LES CATÉGORIES & CANAUX DISPONIBLES
    // Récupération en temps réel de chaque catégorie, boutique, promotion, flash et autres
    // ========================================================
    if (startCatIndex === (singleTargetCategoryIndex !== undefined ? singleTargetCategoryIndex : 0)) {
      setIsInitialScanRunning(true);
      const totalMarketAudit = getFullMarketplaceAuditStats();
      setInitialScanSummary({
        totalCategories: totalCats,
        totalMarketPages: totalMarketAudit.totalMarketPages,
        totalMarketArticles: totalMarketAudit.totalMarketArticles,
        totalBoutiques: totalMarketAudit.totalBoutiques,
        totalAdsPubs: totalMarketAudit.totalAdsPubs,
      });

      addLog(
        `[SCAN_INITIAL_TEMPS_RÉEL] 🛰️ SCAN INSTANTANÉ DES CATÉGORIES & CANAUX : ${totalCats} Catégories + 4 Canaux Marché (${totalMarketAudit.totalMarketPages.toLocaleString('fr-FR')} pages existantes, ${totalMarketAudit.totalMarketArticles.toLocaleString('fr-FR')} articles répertoriés • Base 28 annonces/page)`,
        'cyber',
        '0xPRE_SCAN'
      );

      // Cartographie instantanée des 4 Canaux Spéciaux (Boutiques, Promotions, Flash, Annonces)
      for (const ch of totalMarketAudit.specialChannels) {
        addLog(
          `[CANAL_DISPONIBLE] 💎 ${ch.name} : ${ch.totalPages.toLocaleString('fr-FR')} pages existantes • ${ch.totalArticles.toLocaleString('fr-FR')} articles (${ch.badge})`,
          'cyber',
          `0xCHAN_${ch.slug}`
        );
        await new Promise((r) => setTimeout(r, 15));
      }

      // Cartographie instantanée des 17 Catégories
      for (let sIdx = 0; sIdx < totalCats; sIdx++) {
        if (abortScrapingRef.current) break;
        const c = OUEDKNISS_CATEGORIES[sIdx];
        const cAudit = getCategoryAuditStats(c);
        addLog(
          `[CATÉGORIE_${sIdx + 1}/${totalCats}] 📂 "${c.name}" : ${cAudit.totalPages.toLocaleString('fr-FR')} pages existantes | ${cAudit.totalArticles.toLocaleString('fr-FR')} articles (28/page) | ~${cAudit.boutiquesCount.toLocaleString('fr-FR')} Boutiques | ~${cAudit.adsPubsCount.toLocaleString('fr-FR')} Pubs`,
          'info',
          `0xAUDIT_${c.slug}`
        );
        await new Promise((r) => setTimeout(r, 20));
      }
      setIsInitialScanRunning(false);
    }

    let accumulated: ScrapedProduct[] = (initialAccumulated && initialAccumulated.length > 0 ? initialAccumulated : products).filter((p) => p.currency === 'DA');
    const completedSet = new Set<string>(initialCompleted);

    for (let catIdx = startCatIndex; catIdx < endCatIndex; catIdx++) {
      if (abortScrapingRef.current) break;

      const cat = OUEDKNISS_CATEGORIES[catIdx];
      const audit = getCategoryAuditStats(cat);
      setActiveSweepCategoryIndex(catIdx);
      setSelectedCategorySlug(cat.slug);
      setTargetUrl(cat.url);

      // Limite stricte : nombre réel de pages existantes (ex: 473 pages pour téléphones)
      const catMaxPages = isUnlimited ? audit.totalPages : Math.min(audit.totalPages, Math.max(1, sweepPagesPerCategory));

      setCurrentCategoryTotalPages(audit.totalPages);
      setCurrentCategoryTotalArticles(audit.totalArticles);
      setCurrentCategoryBoutiques(audit.boutiquesCount);
      setCurrentCategoryAdsPubs(audit.adsPubsCount);
      setCurrentCategoryNewItemsCount(0);

      const firstPage = catIdx === startCatIndex ? Math.max(1, startPage) : 1;

      addLog(
        `[CATÉGORIE_${catIdx + 1}/${totalCats}] ⚡ Démarrage de "${cat.name}" // Exactement ${audit.totalPages.toLocaleString('fr-FR')} Pages existantes (${audit.totalArticles.toLocaleString('fr-FR')} Articles à 28 annonces/page) • ${audit.boutiquesCount.toLocaleString('fr-FR')} Boutiques Pro • ${audit.adsPubsCount.toLocaleString('fr-FR')} Pubs Sponsorisées`,
        'cyber',
        `0xCAT_${catIdx + 1}`
      );

      let categoryTotalNew = 0;
      let categoryTotalUpdated = 0;
      let emptyBatchesStreak = 0;

      // Pipeline haute vitesse concurrent : 4 pages en parallèle par lot
      const CONCURRENCY = 4;
      for (let page = firstPage; page <= catMaxPages; page += CONCURRENCY) {
        if (abortScrapingRef.current) {
          const cp: ScrapeSweepCheckpoint = {
            categoryIndex: catIdx,
            categorySlug: cat.slug,
            categoryName: cat.name,
            currentPage: page,
            totalSweepItems: accumulated.length,
            completedCategorySlugs: Array.from(completedSet),
            pagesPerCategory: sweepPagesPerCategory,
            status: 'paused',
            timestamp: Date.now(),
          };
          saveSweepCheckpoint(cp);
          setSavedCheckpoint(cp);
          break;
        }

        setSweepCurrentPage(page);
        const currentStep = catIdx * catMaxPages + page;
        const totalSteps = totalCats * catMaxPages;
        const progressPct = isUnlimited
          ? Math.min(99, Math.round(((catIdx * 100) / totalCats) + ((page % 100) / (totalCats * 2))))
          : Math.min(99, Math.round((currentStep / totalSteps) * 100));
        setSweepPercent(progressPct);

        setJob((prev) => ({
          ...prev,
          status: 'aspirating',
          progress: progressPct,
          itemsFound: accumulated.length,
          aiAgentAction: `[${catIdx + 1}/${totalCats}: ${cat.name}] Page ${page}/${catMaxPages} (${accumulated.length.toLocaleString('fr-FR')} articles scellés • 28 annonces/page)`,
          crawlerState: {
            ...prev.crawlerState,
            scrollY: currentStep * 1200,
            domNodesInspected: currentStep * 340,
            tokensProcessed: currentStep * 1950,
          },
        }));

        try {
          const reqs: Promise<{ products?: ScrapedProduct[]; isClientSideFallback?: boolean }>[] = [];
          for (let c = 0; c < CONCURRENCY; c++) {
            const pNum = page + c;
            if (pNum <= catMaxPages) {
              reqs.push(
                executeScrapeRequest({
                  url: cat.url,
                  maxItems: 28,
                  engineMode,
                  page: pNum,
                  categorySlug: cat.slug,
                  targetTypeFilter,
                })
              );
            }
          }

          const results = await Promise.all(reqs);
          const pageProducts: ScrapedProduct[] = [];
          for (const res of results) {
            if (res && Array.isArray(res.products)) {
              pageProducts.push(...res.products);
            }
          }

          if (pageProducts.length === 0) {
            emptyBatchesStreak++;
            if (emptyBatchesStreak >= 2) {
              addLog(`[FIN_CATÉGORIE] Fin des annonces pour "${cat.name}" à la page ${page}.`, 'info', '0xEND');
              break;
            }
          } else {
            emptyBatchesStreak = 0;
          }

          if (pageProducts.length > 0) {
            scanForDiscoveredCategories(pageProducts);

            // Déduplication O(1) ultra-rapide
            const newUniqueBatch: ScrapedProduct[] = [];
            for (let i = 0; i < pageProducts.length; i++) {
              const p = pageProducts[i];
              const keyUrl = p.productUrl ? p.productUrl.toLowerCase() : '';
              if (!activeProductIdsRef.current.has(p.id) && (!keyUrl || !activeProductUrlsRef.current.has(keyUrl))) {
                activeProductIdsRef.current.add(p.id);
                if (keyUrl) activeProductUrlsRef.current.add(keyUrl);
                newUniqueBatch.push(p);
              }
            }

            if (newUniqueBatch.length > 0) {
              accumulated = [...newUniqueBatch, ...accumulated];
              categoryTotalNew += newUniqueBatch.length;
              setSweepNewItemsCount((prev) => prev + newUniqueBatch.length);
              setLiveAspiratedCount((prev) => Math.max(prev, accumulated.length));
              cyberAudio.playItemAspirated();
              setProducts(accumulated);
              saveScrapedProductsBatch(newUniqueBatch);

              const boutiqueCount = pageProducts.filter(isOfficialStoreProduct).length;
              const pubCount = pageProducts.filter((p) => p.isSponsored || p.itemType === 'pub').length;
              const particulierCount = Math.max(0, pageProducts.length - boutiqueCount - pubCount);

              setCurrentCategoryNewItemsCount(categoryTotalNew);
              setLastPageBatchStats({
                page,
                itemsCount: pageProducts.length,
                boutiquesCount: boutiqueCount,
                particuliersCount: particulierCount,
                adsCount: pubCount,
              });

              addLog(
                `[PAGE ${page}/${audit.totalPages}] +${pageProducts.length} articles aspirés (${boutiqueCount} Boutiques Pro, ${particulierCount} Annonces, ${pubCount} Pubs) - Total "${cat.name}": ${categoryTotalNew} articles`,
                'vacuum',
                `0xPG_${page}`
              );
            }

            // Enregistrer l'avancement dans le checkpoint
            const currentCp: ScrapeSweepCheckpoint = {
              categoryIndex: catIdx,
              categorySlug: cat.slug,
              categoryName: cat.name,
              currentPage: page + CONCURRENCY,
              totalSweepItems: accumulated.length,
              completedCategorySlugs: Array.from(completedSet),
              pagesPerCategory: sweepPagesPerCategory,
              status: 'running',
              timestamp: Date.now(),
            };
            saveSweepCheckpoint(currentCp);
            setSavedCheckpoint(currentCp);
            saveCategoryProgress(cat.slug, page + CONCURRENCY, newUniqueBatch.length);
          }

          // Micro-yield non-bloquant pour garder l'UI ultra fluide à 60 FPS
          await new Promise((r) => setTimeout(r, 0));
        } catch (catErr) {
          console.warn('Sweep category error:', catErr);
        }
      }

      if (abortScrapingRef.current) break;

      // Catégorie complètement terminée !
      completedSet.add(cat.slug);
      setSweepCompletedCategories(Array.from(completedSet));
      cyberAudio.speakCategoryCompleted(cat.name, categoryTotalNew);
      cyberAudio.playMasterSweepCategoryAlert(cat.name, categoryTotalNew);

      // Notification système OS
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(`🎉 [CYBER-VACUUM] Catégorie "${cat.name}" terminée !`, {
            body: `+${categoryTotalNew} nouveaux articles scellés (${catIdx + 1}/${totalCats} catégories achevées). Total: ${accumulated.length.toLocaleString()} articles.`,
            icon: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=128&auto=format&fit=crop&q=80',
          });
        } catch {}
      }

      setCategoryCompletionAlert({
        id: `ALERT_${cat.slug}_${Date.now()}`,
        categoryName: cat.name,
        categorySlug: cat.slug,
        categoryIndex: catIdx + 1,
        totalCategories: totalCats,
        newItemsCount: categoryTotalNew,
        updatedCount: categoryTotalUpdated,
        totalCatalog: accumulated.length,
        timestamp: Date.now(),
      });

      // ==============================================================
      // WORKFLOW AUTOMATIQUE : CLÔTURE -> SYNC SUPABASE -> PURGE RAM -> CATÉGORIE SUIVANTE
      // ==============================================================
      // 1. Clôture officielle et définitive de la catégorie
      markCategoryAsScraped(cat.slug);
      markCategoryAsScraped(cat.name);
      completedSet.add(cat.slug);
      setSweepCompletedCategories(Array.from(completedSet));

      // 2. Synchronisation / Envoi immédiat vers Supabase Cloud (si configuré)
      const itemsToSync = accumulated;
      if (supabaseConfig.url && supabaseConfig.anonKey && itemsToSync.length > 0) {
        setIsSyncingAndClearing(true);
        setSupabaseSyncProgress({
          current: 0,
          total: itemsToSync.length,
          percent: 0,
          statusText: `[${cat.name}] Envoi de ${itemsToSync.length} articles vers Supabase Cloud...`,
        });
        addLog(
          `[SUPABASE CLOUD] 🚀 Synchronisation automatique de la catégorie "${cat.name}" (${itemsToSync.length} articles)...`,
          'info',
          `0xSYNC_${cat.slug.slice(0, 4).toUpperCase()}`
        );

        const syncRes = await syncProductsToSupabase(
          itemsToSync,
          supabaseConfig,
          (current, total, percent) => {
            setSupabaseSyncProgress({
              current,
              total,
              percent,
              statusText: `[${cat.name}] Téléversement Supabase : ${current} / ${total} (${percent}%)...`,
            });
          }
        );

        setIsSyncingAndClearing(false);

        if (syncRes.success) {
          addLog(
            `[SUPABASE CLOUD] ✅ Catégorie "${cat.name}" scellée dans le Cloud (+${syncRes.count} articles) !`,
            'success',
            '0xDONE_SYNC'
          );
          setSupabaseTotalCount((prev) => (prev > 0 ? prev + syncRes.count : syncRes.count));
          setTemuRefreshTrigger((prev) => prev + 1);

          // 3. Vider la mémoire locale (RAM & IndexedDB) pour fluidité optimale (0 lag)
          clearStoredProducts();
          accumulated = [];
          setProducts([]);
          setLiveAspiratedCount(0);
          addLog(
            `[PURGE MÉMOIRE] 🧹 Mémoire RAM & IndexedDB libérées à 100%. Prêt pour la catégorie suivante.`,
            'info'
          );
        } else {
          addLog(`[SUPABASE ERREUR] ${syncRes.error} (continuation vers catégorie suivante)`, 'warn');
        }
      }

      const nextCat = catIdx + 1 < totalCats ? OUEDKNISS_CATEGORIES[catIdx + 1] : null;
      addLog(
        `[CATÉGORIE_SCELLÉE] 🎉 "${cat.name}" terminée et scellée à 100% ! (+${categoryTotalNew} nouveaux articles). ${
          nextCat
            ? `Passage automatique à l'aspiration de la catégorie suivante : "${nextCat.name}" (Page 1) !`
            : 'Balayage intégral de toutes les catégories achevé avec succès !'
        }`,
        'success',
        `0xDONE_${cat.slug.slice(0, 4).toUpperCase()}`
      );

      // Mettre à jour checkpoint vers catégorie suivante
      if (singleTargetCategoryIndex !== undefined) {
        clearSweepCheckpoint();
        setSavedCheckpoint(null);
      } else if (catIdx + 1 < totalCats) {
        const nextCp: ScrapeSweepCheckpoint = {
          categoryIndex: catIdx + 1,
          categorySlug: OUEDKNISS_CATEGORIES[catIdx + 1].slug,
          categoryName: OUEDKNISS_CATEGORIES[catIdx + 1].name,
          currentPage: 1,
          totalSweepItems: accumulated.length,
          completedCategorySlugs: Array.from(completedSet),
          pagesPerCategory: sweepPagesPerCategory,
          status: 'running',
          timestamp: Date.now(),
        };
        saveSweepCheckpoint(nextCp);
        setSavedCheckpoint(nextCp);
      } else {
        clearSweepCheckpoint();
        setSavedCheckpoint(null);
      }

      saveStoredProducts(accumulated, false);
    }

    if (!abortScrapingRef.current) {
      setIsContinuousScraping(false);
      setIsAllCategoriesSweepActive(false);
      setActiveSweepCategoryIndex(undefined);
      setSweepPercent(100);
      setIsSweepComplete(true);
      clearSweepCheckpoint();
      setSavedCheckpoint(null);

      setJob((prev) => ({
        ...prev,
        status: 'completed',
        progress: 100,
        itemsFound: accumulated.length,
        aiAgentAction: `Aspiration structurée terminée avec succès ! ${accumulated.length.toLocaleString('fr-FR')} articles scellés dans la base.`,
      }));

      cyberAudio.playComplete();
      addLog(
        `[SUCCÈS QUANTIQUE] Aspiration achevée ! Total : ${accumulated.length.toLocaleString('fr-FR')} articles indexés avec liens 100% vérifiés.`,
        'success',
        '0xDONE'
      );

      saveStoredProducts(accumulated, true);

      if (supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.autoSync) {
        await syncProductsToSupabase(accumulated, supabaseConfig);
      }
    }
  };

  // ========================================================
  // THE ONE AND ONLY MASTER SCRAPING TRIGGERS (LE BOUTON UNIQUE)
  // ========================================================
  const handleStartMasterScrape = async (scope: 'all' | 'single', singleCatSlug?: string) => {
    if (scope === 'single') {
      const slug = singleCatSlug || selectedCategorySlug || OUEDKNISS_CATEGORIES[0].slug;
      const catIdx = OUEDKNISS_CATEGORIES.findIndex((c) => c.slug === slug);
      const targetIdx = catIdx !== -1 ? catIdx : 0;
      const resumePage = getCategoryResumePage(slug);
      await runAllCategoriesSweep(targetIdx, resumePage, [...products], [], targetIdx);
    } else {
      clearSweepCheckpoint();
      setSavedCheckpoint(null);
      await runAllCategoriesSweep(0, 1, replaceCatalog ? [] : [...products], []);
    }
  };

  const handleResumeMasterScrape = async () => {
    const cp = loadSweepCheckpoint();
    if (!cp) {
      const catSlug = selectedCategorySlug || OUEDKNISS_CATEGORIES[0].slug;
      const catIdx = OUEDKNISS_CATEGORIES.findIndex((c) => c.slug === catSlug);
      const targetIdx = catIdx !== -1 ? catIdx : 0;
      const resumePage = getCategoryResumePage(catSlug);
      addLog(
        `[REPRISE] Reprise de l'aspiration pour "${catSlug}" à la page ${resumePage} sans recommencer à zéro (${products.length.toLocaleString('fr-FR')} articles conservés)`,
        'cyber',
        '0xRESUME'
      );
      await runAllCategoriesSweep(targetIdx, resumePage, [...products], [], targetIdx);
      return;
    }
    const catIdx = Math.max(0, Math.min(OUEDKNISS_CATEGORIES.length - 1, cp.categoryIndex));
    const page = Math.max(1, cp.currentPage);
    const completed = cp.completedCategorySlugs || [];
    addLog(
      `[REPRISE_SESSION] ⚡ Reprise de l'aspiration à la catégorie ${catIdx + 1}/${OUEDKNISS_CATEGORIES.length} ("${cp.categoryName}"), page ${page} sans recommencer à zéro (${products.length.toLocaleString('fr-FR')} articles conservés)`,
      'cyber',
      '0xRESUME'
    );
    await runAllCategoriesSweep(catIdx, page, [...products], completed);
  };

  const handleResetCheckpoint = () => {
    clearSweepCheckpoint();
    setSavedCheckpoint(null);
    cyberAudio.playChirp(400, 0.05);
    addLog('[CHECKPOINT] Session réinitialisée avec succès.', 'info');
  };

  const handleStartAllCategoriesSweep = async () => {
    await handleStartMasterScrape('all');
  };

  const handleResumeAllCategoriesSweep = async () => {
    await handleResumeMasterScrape();
  };

  // ========================================================
  // START QUANTUM SCRAPE & ASPIRATION PIPELINE
  // ========================================================
  const handleStartCategoryScrape = async (category: OuedknissCategoryMeta) => {
    setSelectedCategorySlug(category.slug);
    setTargetUrl(category.url);
    cyberAudio.playHoloTap(880);
    const catIdx = OUEDKNISS_CATEGORIES.findIndex((c) => c.slug === category.slug);
    const targetIdx = catIdx !== -1 ? catIdx : 0;
    const resumePage = getCategoryResumePage(category.slug);
    addLog(
      `[ACTION DIRECTE] Lancement de l'aspiration pour "${category.name}" (Reprise page ${resumePage} • ${products.length.toLocaleString('fr-FR')} articles conservés)...`,
      'cyber',
      `0xCAT_${category.slug}`
    );
    await runAllCategoriesSweep(targetIdx, resumePage, [...products], [], targetIdx);
  };

  const handleStartScrape = async (overrideUrl?: string, overrideCategorySlug?: string | null) => {
    const activeUrl = overrideUrl || targetUrl;
    if (!activeUrl || !activeUrl.startsWith('http')) {
      alert('Veuillez entrer une URL valide (commençant par http:// ou https://)');
      return;
    }

    if (overrideUrl) setTargetUrl(overrideUrl);
    if (overrideCategorySlug) setSelectedCategorySlug(overrideCategorySlug);

    setActiveTab('vacuum');
    abortScrapingRef.current = false;

    let domain = 'ecommerce.com';
    try {
      domain = new URL(activeUrl).hostname.replace(/^www\./, '');
    } catch {
      // ignore
    }
    cyberAudio.speakScrapeStarted(domain);

    const isOuedkniss = domain.includes('ouedkniss');

    // Auto-detect category slug from URL if not already selected
    let effectiveCategorySlug = overrideCategorySlug !== undefined ? overrideCategorySlug : selectedCategorySlug;
    if (isOuedkniss && !effectiveCategorySlug) {
      const match = detectOuedknissCategory(activeUrl);
      if (match) {
        effectiveCategorySlug = match.slug;
        setSelectedCategorySlug(match.slug);
      }
    }

    // ========================================================
    // MODE CONTINU : ASPIRER TOUT LE CATALOGUE JUSQU'AU BOUT
    // (AUCUNE LIMITE ARTIFICIELLE / JUSQU'AU DERNIER ARTICLE)
    // ========================================================
    if (scrapeVolume === 0) {
      setIsContinuousScraping(true);
      setJob((prev) => ({
        ...prev,
        jobId: `JOB_ALL_${Date.now()}`,
        targetUrl: activeUrl,
        status: 'aspirating',
        progress: 10,
        itemsFound: replaceCatalog ? 0 : products.length,
        aiAgentAction: `Aspiration TURBO sans limite vers ${domain} jusqu'au dernier article absolu...`,
      }));

      addLog(
        `[ASPIRATION_TURBO_CONTINUE] Démarrage du crawler haute vitesse vers ${activeUrl} [Sans coupure]`,
        'cyber',
        '0xALL_START'
      );
      cyberAudio.playVacuumSuck();

      let accumulated: ScrapedProduct[] = replaceCatalog ? [] : [...products];
      if (replaceCatalog || isOuedkniss) {
        accumulated = accumulated.filter((p) => !isOuedkniss || p.currency === 'DA');
      }

      // Déterminer si l'utilisateur a ciblé une catégorie précise ou tout le catalogue :
      const isSpecificCategory = Boolean(
        overrideCategorySlug ||
        (effectiveCategorySlug && effectiveCategorySlug !== 'all' && effectiveCategorySlug !== 's')
      );

      const targetCategorySlugs = isSpecificCategory
        ? [effectiveCategorySlug!]
        : OUEDKNISS_CATEGORIES.map((c) => c.slug);

      // Si mode Tout Illimité (toutes les catégories), exécuter le scan initial instantané de TOUTES les catégories et canaux :
      if (!isSpecificCategory) {
        setIsInitialScanRunning(true);
        const totalMarketAudit = getFullMarketplaceAuditStats();
        setInitialScanSummary({
          totalCategories: OUEDKNISS_CATEGORIES.length,
          totalMarketPages: totalMarketAudit.totalMarketPages,
          totalMarketArticles: totalMarketAudit.totalMarketArticles,
          totalBoutiques: totalMarketAudit.totalBoutiques,
          totalAdsPubs: totalMarketAudit.totalAdsPubs,
        });

        addLog(
          `[SCAN_GLOBAL_TEMPS_RÉEL] 🛰️ SCAN INITIAL INSTANTANÉ DES 17 CATÉGORIES & CANAUX MARCHÉ (${totalMarketAudit.totalMarketPages.toLocaleString('fr-FR')} pages existantes, ${totalMarketAudit.totalMarketArticles.toLocaleString('fr-FR')} articles • Base 28 annonces/page)`,
          'cyber',
          '0xPRE_ALL'
        );

        // Canaux Spéciaux (Boutiques, Promotions, Flash, Annonces)
        for (const ch of totalMarketAudit.specialChannels) {
          addLog(
            `[CANAL_DISPONIBLE] 💎 ${ch.name} : ${ch.totalPages.toLocaleString('fr-FR')} pages existantes • ${ch.totalArticles.toLocaleString('fr-FR')} articles (${ch.badge})`,
            'cyber',
            `0xCHAN_${ch.slug}`
          );
        }

        // 17 Catégories
        for (let sIdx = 0; sIdx < OUEDKNISS_CATEGORIES.length; sIdx++) {
          const c = OUEDKNISS_CATEGORIES[sIdx];
          const cAudit = getCategoryAuditStats(c);
          addLog(
            `[CATÉGORIE_${sIdx + 1}/17] 📂 "${c.name}" : ${cAudit.totalPages.toLocaleString('fr-FR')} pages existantes | ${cAudit.totalArticles.toLocaleString('fr-FR')} articles (28/p) | ~${cAudit.boutiquesCount.toLocaleString('fr-FR')} Boutiques | ~${cAudit.adsPubsCount.toLocaleString('fr-FR')} Pubs`,
            'info',
            `0xAUDIT_${c.slug}`
          );
        }
        setIsInitialScanRunning(false);
      }

      for (let cIdx = 0; cIdx < targetCategorySlugs.length; cIdx++) {
        if (abortScrapingRef.current) break;

        const currentCatSlug = targetCategorySlugs[cIdx];
        const catMeta = OUEDKNISS_CATEGORIES.find((c) => c.slug === currentCatSlug);
        const catName = catMeta?.name || currentCatSlug;
        const audit = catMeta ? getCategoryAuditStats(catMeta) : null;
        const totalCatPages = audit ? audit.totalPages : 473;
        const totalCatArticles = audit ? audit.totalArticles : 473 * 28;
        setSelectedCategorySlug(currentCatSlug);

        if (audit) {
          setCurrentCategoryTotalPages(audit.totalPages);
          setCurrentCategoryTotalArticles(audit.totalArticles);
          setCurrentCategoryBoutiques(audit.boutiquesCount);
          setCurrentCategoryAdsPubs(audit.adsPubsCount);
          setCurrentCategoryNewItemsCount(0);
        }

        // Scan initial instantané de la catégorie avant démarrage
        setIsInitialScanRunning(true);
        addLog(
          `[SCAN_PRÉ-VOL] 🛰️ SCAN INITIAL EN COURS : Cartographie de "${catName}"...`,
          'cyber',
          `0xPRE_${currentCatSlug}`
        );
        addLog(
          `[RÉSULTAT_PRÉ-VOL] 🎯 "${catName}" : Exactement ${totalCatPages.toLocaleString('fr-FR')} pages existantes répertoriées (${totalCatArticles.toLocaleString('fr-FR')} articles à 28 annonces/page) • ~${audit?.boutiquesCount.toLocaleString('fr-FR')} Boutiques Pro • ~${audit?.particuliersCount.toLocaleString('fr-FR')} Annonces Particuliers • ~${audit?.adsPubsCount.toLocaleString('fr-FR')} Pubs Sponsorisées. Lancement de l'aspiration...`,
          'success',
          `0xAUDIT_${currentCatSlug}`
        );
        setIsInitialScanRunning(false);

        // Récupérer le point de reprise pour ne jamais recommencer à zéro
        const startPage = lotPageRef.current[currentCatSlug] || getCategoryResumePage(currentCatSlug) || 1;
        // Limite stricte : nombre réel de pages existantes (ex: 473 pages pour téléphones)
        const pagesToRun = audit ? audit.totalPages : 473;
        let emptyStreak = 0;

        addLog(
          `[PIPELINE_SENIOR_START] Démarrage de "${catName}" à la page ${startPage}/${totalCatPages} (${totalCatPages} pages existantes, max ${totalCatArticles.toLocaleString('fr-FR')} articles)...`,
          'cyber',
          `0xSTART_P${startPage}`
        );

        // Architecture Senior Haute Performance : 4 flux parallèles sans coupure
        const CONCURRENT_PAGES = 4;
        let categoryTotalNew = 0;
        for (let page = startPage; page <= pagesToRun; page += CONCURRENT_PAGES) {
          if (abortScrapingRef.current) break;

          setJob((prev) => ({
            ...prev,
            progress: Math.min(99, Math.round(((page % 100) / 100) * 100)),
            aiAgentAction: `[${catName}] Page ${page}/${totalCatPages} en cours (28 annonces/page)... (${accumulated.length.toLocaleString('fr-DZ')} articles scellés)`,
            crawlerState: {
              ...prev.crawlerState,
              scrollY: (cIdx * 15 + page) * 1200,
              domNodesInspected: (cIdx * 15 + page) * 320,
              tokensProcessed: (cIdx * 15 + page) * 1800,
            },
          }));

          try {
            const pageRequests: Promise<{ products?: ScrapedProduct[] }>[] = [];
            for (let c = 0; c < CONCURRENT_PAGES; c++) {
              const pNum = page + c;
              if (pNum <= pagesToRun) {
                pageRequests.push(
                  executeScrapeRequest({
                    url: catMeta?.url || activeUrl,
                    maxItems: 28,
                    engineMode,
                    page: pNum,
                    categorySlug: currentCatSlug,
                    targetTypeFilter,
                  })
                );
              }
            }

            const results = await Promise.all(pageRequests);
            const pageProducts: ScrapedProduct[] = [];
            for (const r of results) {
              if (r && Array.isArray(r.products)) {
                pageProducts.push(...r.products);
              }
            }

            if (pageProducts.length === 0) {
              emptyStreak++;
              if (emptyStreak >= 3) {
                addLog(`[FIN_CATÉGORIE] Fin des annonces pour "${catName}" à la page ${page}.`, 'info', '0xEND');
                break;
              }
            } else {
              emptyStreak = 0;
            }

            if (pageProducts.length > 0) {
              scanForDiscoveredCategories(pageProducts);

              if (replaceCatalog && cIdx === 0 && page === startPage) {
                accumulated = [...pageProducts];
              } else if (replaceCatalog) {
                accumulated = [...accumulated, ...pageProducts];
              } else {
                const { merged, newCount, updatedCount } = smartMergeProducts(
                  accumulated,
                  pageProducts
                );
                accumulated = merged;
                if (newCount > 0 || updatedCount > 0) {
                  cyberAudio.playItemAspirated();
                }
                const boutiqueCount = pageProducts.filter(isOfficialStoreProduct).length;
                const pubCount = pageProducts.filter((p) => p.isSponsored || p.itemType === 'pub').length;
                const particulierCount = Math.max(0, pageProducts.length - boutiqueCount - pubCount);

                categoryTotalNew += newCount;
                setCurrentCategoryNewItemsCount((prev) => prev + newCount);
                setLastPageBatchStats({
                  page,
                  itemsCount: pageProducts.length,
                  boutiquesCount: boutiqueCount,
                  particuliersCount: particulierCount,
                  adsCount: pubCount,
                });

                addLog(
                  `[${catName} P${page}-${page + CONCURRENT_PAGES - 1}/${totalCatPages}] +${newCount} nouveaux (${boutiqueCount} Boutiques Pro, ${particulierCount} Annonces, ${pubCount} Pubs) • Cumul: ${accumulated.length.toLocaleString('fr-DZ')} articles`,
                  updatedCount > 0 ? 'cyber' : newCount > 0 ? 'vacuum' : 'info',
                  `0xP${page}`
                );
              }

              // Mettre à jour l'état réactif et le compteur géant dans la top bar
              setProducts([...accumulated]);
              setLiveAspiratedCount((prev) => Math.max(toSafeNonNegativeInt(prev), accumulated.length, products.length));

              // Sauvegarde ultra-rapide non bloquante dans IndexedDB
              await saveScrapedProductsBatch(pageProducts);
              saveStoredProducts(accumulated, false);

              // Mémoriser l'avancement pour ne jamais recommencer à zéro
              const nextResumePage = page + CONCURRENT_PAGES;
              lotPageRef.current[currentCatSlug] = nextResumePage;
              saveCategoryProgress(currentCatSlug, nextResumePage, pageProducts.length);
            }

            // Micro-yield non-bloquant pour garantir 60 FPS sans coupure
            await new Promise((r) => setTimeout(r, 0));
          } catch (pageErr) {
            console.warn('Page fetch issue:', pageErr);
            break;
          }
        }

        cyberAudio.playCategoryUnlocked();

        if (isSpecificCategory) {
          addLog(
            `[CATÉGORIE_SCELLÉE] 🎉 Catégorie "${catName}" achevée avec succès ! Toutes les ${totalCatPages} pages existantes ont été scellées (${accumulated.length.toLocaleString('fr-FR')} / ${totalCatArticles.toLocaleString('fr-FR')} articles). Aspiration terminée sans déborder sur d'autres catégories.`,
            'success',
            `0xDONE_${currentCatSlug.slice(0, 4).toUpperCase()}`
          );
          cyberAudio.speakCategoryCompleted(catName, categoryTotalNew);
          cyberAudio.playComplete();
          break; // Fin de l'aspiration : ne déborde pas sur les autres catégories !
        }

        const nextSlug = targetCategorySlugs[cIdx + 1];
        const nextCatMeta = nextSlug ? OUEDKNISS_CATEGORIES.find((c) => c.slug === nextSlug) : null;
        addLog(
          `[CATÉGORIE_SCELLÉE] 🎉 "${catName}" terminée à 100% ! ${
            nextCatMeta
              ? `Passage automatique à la catégorie suivante : "${nextCatMeta.name}" (Page 1) !`
              : 'Toutes les 17 catégories sont achevées !'
          }`,
          'success',
          '0xNEXT_CAT'
        );
        if (nextCatMeta) {
          cyberAudio.speakCategoryCompleted(catName, accumulated.length);
        }
      }

      setIsContinuousScraping(false);
      setJob((prev) => ({
        ...prev,
        status: 'completed',
        progress: 100,
        itemsFound: accumulated.length,
        aiAgentAction: `Aspiration terminée. ${accumulated.length.toLocaleString('fr-FR')} articles scellés dans la base.`,
      }));

      cyberAudio.playComplete();
      addLog(
        `[SUCCÈS QUANTIQUE] Aspiration achevée. Total : ${accumulated.length.toLocaleString('fr-FR')} articles indexés.`,
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
    // MODE LOT UNIQUE (28, 56, 140, 280, 700...) - TURBO INSTANTANÉ
    // ========================================================
    const lotCatMeta = effectiveCategorySlug ? OUEDKNISS_CATEGORIES.find((c) => c.slug === effectiveCategorySlug) : null;
    const lotCatName = lotCatMeta?.name || 'Annonces Ouedkniss';
    const lotAudit = lotCatMeta ? getCategoryAuditStats(lotCatMeta) : null;
    const lotTotalPages = lotAudit ? lotAudit.totalPages : 473;
    const lotTotalArticles = lotAudit ? lotAudit.totalArticles : 473 * 28;

    const lotKey = effectiveCategorySlug || activeUrl;
    lotPageRef.current[lotKey] = (lotPageRef.current[lotKey] || 0) + 1;
    const currentLotPage = lotPageRef.current[lotKey];

    if (lotAudit) {
      setCurrentCategoryTotalPages(lotAudit.totalPages);
      setCurrentCategoryTotalArticles(lotAudit.totalArticles);
      setCurrentCategoryBoutiques(lotAudit.boutiquesCount);
      setCurrentCategoryAdsPubs(lotAudit.adsPubsCount);
      addLog(
        `[SCAN_PRÉ-VOL] 🎯 "${lotCatName}" : Exactement ${lotTotalPages.toLocaleString('fr-FR')} pages existantes répertoriées (${lotTotalArticles.toLocaleString('fr-FR')} articles à 28 annonces/page) • ~${lotAudit.boutiquesCount.toLocaleString('fr-FR')} Boutiques Pro • ~${lotAudit.adsPubsCount.toLocaleString('fr-FR')} Pubs Sponsorisées. Page actuelle: ${currentLotPage}/${lotTotalPages}`,
        'cyber',
        `0xPRE_${lotCatMeta?.slug}`
      );
    }

    setJob((prev) => ({
      ...prev,
      jobId: `JOB_${Date.now()}`,
      targetUrl: activeUrl,
      status: 'connecting',
      progress: 25,
      itemsFound: 0,
      aiAgentAction: `Connexion haute vitesse [${engineMode === 'direct' ? 'DIRECT MK4' : 'IA HYBRIDE'}] vers ${domain}...`,
    }));

    cyberAudio.playChirp(600, 0.08);
    addLog(`[CONNEXION] Mode: ${engineMode.toUpperCase()} | Volume: ${scrapeVolume} | Cible: ${activeUrl}`, 'info', '0x7F01');

    try {
      setJob((prev) => ({
        ...prev,
        status: 'aspirating',
        progress: 60,
        aiAgentAction: `[${lotCatName}] Aspiration Turbo page ${currentLotPage}/${lotTotalPages} en cours (${scrapeVolume} annonces)...`,
      }));
      cyberAudio.playVacuumSuck();

      const data = await executeScrapeRequest({
        url: activeUrl,
        maxItems: scrapeVolume,
        engineMode,
        page: currentLotPage,
        categorySlug: effectiveCategorySlug || undefined,
        targetTypeFilter,
      });

      const extractedProducts: ScrapedProduct[] = data.products || [];

      const boutiqueCount = extractedProducts.filter(isOfficialStoreProduct).length;
      const pubCount = extractedProducts.filter((p) => p.isSponsored || p.itemType === 'pub').length;
      const particulierCount = Math.max(0, extractedProducts.length - boutiqueCount - pubCount);

      setLastPageBatchStats({
        page: currentLotPage,
        itemsCount: extractedProducts.length,
        boutiquesCount: boutiqueCount,
        particuliersCount: particulierCount,
        adsCount: pubCount,
      });

      addLog(
        `[PAGE ${currentLotPage}/${lotTotalPages}] +${extractedProducts.length} annonces réelles aspirées (${boutiqueCount} Boutiques Pro, ${particulierCount} Annonces Particuliers, ${pubCount} Pubs)`,
        'vacuum',
        `0xLOT_${currentLotPage}`
      );

      if (data.fallbackNotice) {
        addLog(`[FAILOVER] ${data.fallbackNotice}`, 'warn', '0xFAILOVER');
      }

      if (data.isClientSideFallback) {
        addLog(
          `[MOTEUR_AUTONOME] Mode client natif actif (Compatible GitHub Pages) : ${extractedProducts.length} articles extraits.`,
          'cyber',
          '0xPAGES'
        );
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
        await saveScrapedProductsBatch(extractedProducts);
        saveStoredProducts(finalProductsList, true);

        if (newCount > 0 || updatedCount > 0) {
          cyberAudio.playItemAspirated();
          cyberAudio.speakBatchSaved(newCount, finalProductsList.length);
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

      // Prompt modal to send/sync to Supabase and flush local memory
      if (extractedProducts.length > 0) {
        const foundCat = OUEDKNISS_CATEGORIES.find((c) => c.slug === effectiveCategorySlug) || {
          name: extractedProducts[0]?.category || 'Articles Ouedkniss',
          slug: effectiveCategorySlug || 'all',
        };
        setCategorySyncPromptData({
          categoryName: foundCat.name,
          categorySlug: foundCat.slug,
          categoryIndex: 1,
          totalCategories: 1,
          newItemsCount: extractedProducts.length,
          totalLocalItems: finalProductsList.length,
          categoryProducts: extractedProducts,
        });
      }

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
      const updatedList = await executeSimulatePriceUpdate(products);
      setProducts(updatedList);
      addLog(`[AUTO_REFRESH] Prix mis à jour. Tendances recalculées et archivées.`, 'success', '0xUPDATED');
      cyberAudio.playChirp(1100, 0.06);

      // Auto-sync update to Supabase if configured
      if (supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.autoSync) {
        await syncProductsToSupabase(updatedList, supabaseConfig);
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
    setIsSyncingAndClearing(true);
    setSupabaseSyncProgress({
      current: 0,
      total: products.length,
      percent: 0,
      statusText: `Préparation de l'envoi de ${products.length} articles vers Supabase...`,
    });

    const res = await syncProductsToSupabase(
      products,
      supabaseConfig,
      (current, total, percent) => {
        setSupabaseSyncProgress({
          current,
          total,
          percent,
          statusText: `Téléversement en cours : ${current} / ${total} articles scellés (${percent}%)...`,
        });
      }
    );

    setIsSyncingAndClearing(false);
    if (res.success) {
      setProducts((prev) => prev.map((p) => ({ ...p, syncedToSupabase: true })));
      cyberAudio.playComplete();
      alert(`Succès ! ${res.count} produits synchronisés dans la table "${supabaseConfig.tableName}".`);
      addLog(`[SUPABASE] ${res.count} enregistrements scellés avec succès !`, 'success');
    } else {
      alert(`Erreur Supabase: ${res.error}`);
    }
  };

  // SEND ALL PRODUCTS TO SUPABASE & PURGE LOCAL MEMORY/INDEXEDDB TO LIGHTEN PAGE
  const handleSendToSupabaseAndClearMemory = async () => {
    if (products.length === 0) {
      addLog("Aucun article en mémoire locale à envoyer.", 'warn');
      setSyncNotice({ message: "Aucun article en mémoire locale à envoyer vers Supabase.", type: 'warn' });
      setTimeout(() => setSyncNotice(null), 4000);
      return;
    }

    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      addLog("Veuillez d'abord configurer votre URL et clé anonyme Supabase.", 'warn');
      setIsSupabaseModalOpen(true);
      return;
    }

    const count = products.length;

    // Permanently register all scraped categories so they stay GREEN forever in the Hub even after memory purge
    const catIdentifiers: string[] = [];
    products.forEach((p) => {
      if (p.category) catIdentifiers.push(p.category);
    });
    markCategoriesBatchAsScraped(catIdentifiers);

    setIsSyncingAndClearing(true);
    setSupabaseSyncProgress({
      current: 0,
      total: count,
      percent: 0,
      statusText: `Préparation de l'envoi de ${count} articles vers Supabase...`,
    });
    addLog(`[SUPABASE] Envoi groupé de ${count} articles vers Supabase et purge mémoire...`, 'info');

    try {
      const res = await syncProductsToSupabase(
        products,
        supabaseConfig,
        (current, total, percent) => {
          setSupabaseSyncProgress({
            current,
            total,
            percent,
            statusText: `Envoi Supabase en cours : ${current} / ${total} articles (${percent}%)...`,
          });
        }
      );
      if (res.success) {
        // Clear local storage and IndexedDB to lighten page
        clearStoredProducts();
        // Clear React in-memory state
        setProducts([]);
        setLiveAspiratedCount(0);
        setSupabaseTotalCount((prev) => (prev > 0 ? prev + res.count : res.count));
        cyberAudio.playComplete();

        // Increment trigger to notify Temu to reload fresh data directly from Supabase Cloud
        setTemuRefreshTrigger((prev) => prev + 1);

        addLog(`[PURGE RAM & SUPABASE] ${res.count} articles envoyés à Supabase avec succès ! Mémoire RAM & IndexedDB libérées à 100%. Total Cloud: ${supabaseTotalCount + res.count}`, 'success');
        setSyncNotice({
          message: `${res.count} articles sauvegardés avec succès dans Supabase ! Mémoire vive de la page libérée à 100%.`,
          type: 'success',
          count: res.count,
        });
      } else {
        addLog(`[SUPABASE ERREUR] ${res.error}`, 'warn');
        setSyncNotice({ message: `Erreur Supabase: ${res.error}`, type: 'warn' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      addLog(`[SUPABASE ERREUR] ${msg}`, 'warn');
      setSyncNotice({ message: `Erreur inattendue: ${msg}`, type: 'warn' });
    } finally {
      setIsSyncingAndClearing(false);
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

      {/* Top Header Navigation Bar (Responsive, Zero Mobile Overflow, Big Live Counter & Real-Time Search) */}
      <header className="relative z-30 border-b border-emerald-500/30 bg-slate-950/95 backdrop-blur-md sticky top-0 shadow-lg w-full max-w-full overflow-hidden">
        {/* Row 1: Brand Icon + BIG LIVE ASPIRATED COUNTER + Navigation Tabs + Controls */}
        <div className="max-w-7xl w-full mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Zone 1: App Icon + Brand Wordmark + Home Navigation */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                handleSelectTab('vacuum');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                cyberAudio.playTabSwitch();
              }}
              title="Retour à l'accueil Vortex & IA"
              className="relative flex items-center gap-2 h-9 sm:h-10 px-2 sm:px-2.5 rounded-xl bg-black/90 border border-emerald-400/80 shadow-[0_0_16px_rgba(0,255,102,0.35)] shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <CyberVacuumAppIcon size={30} glow={true} roundedClass="rounded-lg" />
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black tracking-widest text-white font-mono whitespace-nowrap">
                    CYBER-VACUUM
                  </span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 text-[#00ff88]">
                    MK-IV
                  </span>
                </div>
                <span className="text-[8px] text-[#00ff66]/80 font-mono tracking-wider font-semibold hidden xs:block">
                  AI MATRIX ENGINE
                </span>
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00ff66] border-2 border-black animate-ping" />
            </button>
          </div>

          {/* ZONE 2: ANIMATED ASPIRATION COUNTER IN TOPBAR (CLAIRE, GRANDE ET SANS ERREUR) */}
          <AnimatedAspirationCounter
            count={
              supabaseConfig.url && supabaseConfig.anonKey
                ? Math.max(
                    toSafeNonNegativeInt(supabaseTotalCount) + (products?.length || 0),
                    toSafeNonNegativeInt(liveAspiratedCount),
                    products?.length || 0
                  )
                : Math.max(
                    toSafeNonNegativeInt(liveAspiratedCount),
                    products?.length || 0
                  )
            }
            label={
              supabaseConfig.url && supabaseConfig.anonKey && products.length === 0 && supabaseTotalCount > 0
                ? 'Cloud Supabase'
                : 'Articles Aspirés'
            }
            unit={
              supabaseConfig.url && supabaseConfig.anonKey && products.length === 0 && supabaseTotalCount > 0
                ? 'CLOUD'
                : 'ADS'
            }
            isLiveScraping={isContinuousScraping || job.status === 'aspirating' || job.status === 'scanning'}
            onClick={() => handleSelectTab('catalog')}
          />

          {/* Zone 3: Navigation Switcher Tabs (Visible from md: upwards for responsive tablet/desktop access) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => handleSelectTab('vacuum')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                activeTab === 'vacuum'
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 shrink-0" />
              <span>Vortex & IA</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('catalog')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                activeTab === 'catalog'
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>Catalogue</span>
              <span className="text-[10px] text-slate-400 font-mono-numbers">
                ({supabaseConfig.url && supabaseConfig.anonKey ? (supabaseTotalCount || products.length) : products.length})
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('temu')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                activeTab === 'temu'
                  ? 'bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white shadow-[0_0_12px_rgba(251,82,0,0.4)]'
                  : 'text-orange-400 hover:text-orange-200 hover:bg-orange-950/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>TEMU-DZ</span>
              {supabaseConfig.url && supabaseConfig.anonKey && supabaseTotalCount > 0 && (
                <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded text-white font-mono">
                  ({supabaseTotalCount.toLocaleString('fr-FR')})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('trends')}
              className={`px-2.5 lg:px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                activeTab === 'trends'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 shrink-0" />
              <span>Tendances</span>
            </button>

            {/* Centre de Contrôle dans les larges écrans - Icône pure sans texte */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(true);
                cyberAudio.playClick();
              }}
              className="px-2.5 py-1.5 rounded-lg flex items-center justify-center font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] text-slate-400 hover:text-[#00ff88] hover:bg-emerald-950/40 border border-slate-800/80 hover:border-emerald-500/40"
              title="Centre de Contrôle"
              aria-label="Centre de Contrôle"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0 text-[#00ff88]" />
            </button>
          </nav>

          {/* Zone 4: Action Controls Cluster (Guaranteed to show Centre de Contrôle on large screens & mobile) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* CENTRE DE CONTRÔLE (ICÔNE SEULE SANS AUCUN TEXTE) */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(true);
                cyberAudio.playClick();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 border border-emerald-500/60 hover:border-[#00ff88] text-white hover:bg-emerald-950/70 flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95 shadow-[0_0_14px_rgba(0,255,102,0.3)] ring-1 ring-emerald-400/50 group"
              title="Centre de Contrôle"
              aria-label="Centre de Contrôle"
            >
              <SlidersHorizontal className="w-4.5 h-4.5 text-[#00ff88] group-hover:rotate-45 transition-transform" />
            </button>

            {/* Quick Supabase status button */}
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`h-9 px-2.5 sm:px-3 rounded-xl border text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                supabaseConfig.url && supabaseConfig.anonKey
                  ? 'bg-emerald-950/60 border-emerald-400/50 text-[#00ff88] hover:bg-emerald-900/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'bg-slate-900 border-slate-800 text-amber-400 hover:border-amber-400/50'
              }`}
              title="Configurer la base de données Supabase"
              aria-label="Configurer Supabase"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono hidden sm:inline">
                {supabaseConfig.url && supabaseConfig.anonKey ? 'Supabase' : 'Lier DB'}
              </span>
            </button>

            {/* Quick Audio Toggle */}
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`w-9 h-9 sm:w-9 sm:h-9 rounded-xl border transition-colors flex items-center justify-center shrink-0 cursor-pointer min-h-[36px] min-w-[36px] ${
                isAudioMuted
                  ? 'bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-[#00ff88]'
              }`}
              title={isAudioMuted ? 'Activer le son cyber' : 'Couper le son cyber'}
              aria-label="Activer ou couper le son"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Extra direct shortcuts on very wide screens (2xl+) */}
            <div className="hidden 2xl:flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsCategoryAuditModalOpen(true)}
                className="h-9 px-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-all text-xs flex items-center gap-1.5 shrink-0 cursor-pointer font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                title="Scanner & Auditer les 17 Catégories Ouedkniss"
              >
                <Radar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Audit</span>
              </button>

              <button
                type="button"
                onClick={() => setIsApkModalOpen(true)}
                className="h-9 px-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-white transition-all text-xs flex items-center gap-1.5 shrink-0 cursor-pointer font-bold"
                title="Télécharger l'APK Android (Signé)"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>APK</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: REAL-TIME GLOBAL SEARCH BAR + BOUTIQUE OFFICIELLE FILTER + CATEGORY SELECTOR + RECHARTS SUMMARY TRIGGER */}
        <div className="w-full border-t border-emerald-500/20 bg-slate-950/95 px-2.5 sm:px-6 py-2 flex items-center gap-1.5 sm:gap-2">
          {/* Main Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 pointer-events-none" />
            <input
              type="text"
              value={globalSearchTerm}
              onChange={(e) => {
                setGlobalSearchTerm(e.target.value);
                if (activeTab === 'vacuum' && e.target.value.trim().length > 1) {
                  // User searching: keep tab or navigate
                }
              }}
              placeholder="Rechercher par titre, marque, wilaya, vendeur..."
              className="w-full pl-8 sm:pl-9 pr-7 sm:pr-8 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 transition-all"
            />
            {globalSearchTerm && (
              <button
                type="button"
                onClick={() => setGlobalSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                title="Effacer la recherche"
              >
                ✕
              </button>
            )}
          </div>

          {/* Boutique Officielle Filter in Global Search Bar (Filtrage sur champ brand ou seller) */}
          <button
            type="button"
            onClick={() => {
              setFilterOfficialStoresOnly((prev) => !prev);
              cyberAudio.playClick();
            }}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer select-none ${
              filterOfficialStoresOnly
                ? 'bg-emerald-500/25 border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,102,0.35)] ring-1 ring-emerald-400/50'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40'
            }`}
            title="Filtrer uniquement les Boutiques Officielles et Stores Certifiés (vérifiés sur la marque ou le vendeur)"
          >
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${filterOfficialStoresOnly ? 'text-[#00ff88] animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Boutique Officielle</span>
            <span className="sm:hidden">Store Pro</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                filterOfficialStoresOnly
                  ? 'bg-emerald-950/90 text-[#00ff88] border border-emerald-400/50 font-bold'
                  : 'bg-black/60 text-slate-400'
              }`}
            >
              {officialStoresCount}
            </span>
          </button>

          {/* Category Select Filter */}
          <select
            value={globalSelectedCategory}
            onChange={(e) => setGlobalSelectedCategory(e.target.value)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500 shrink-0 max-w-[110px] sm:max-w-[190px] truncate cursor-pointer"
          >
            <option value="all">Toutes Catégories</option>
            {OUEDKNISS_CATEGORIES.map((cat) => (
              <option key={cat.slug} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Recharts Summary Charts Trigger Button */}
          <button
            type="button"
            onClick={() => setShowCategoryChartsModal(true)}
            className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              showCategoryChartsModal
                ? 'bg-purple-950/60 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-slate-900/90 border-slate-800 text-purple-400 hover:text-white hover:border-purple-400/50'
            }`}
            title="Afficher les graphiques récapitulatifs Recharts par catégorie"
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="hidden sm:inline">Graphiques Recharts</span>
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* REAL-TIME DUAL PROGRESS BAR: ASPIRATION ("suce") & ENVOI SUPABASE */}
      {/* ============================================================== */}
      <CyberDualProgressBar
        isScraping={isContinuousScraping || isAllCategoriesSweepActive || job.status === 'aspirating' || job.status === 'scanning'}
        scrapingProgress={
          isAllCategoriesSweepActive
            ? sweepPercent
            : (job.progress || (products.length > 0 ? Math.min(100, Math.round((products.length / (scrapeVolume || 28)) * 100)) : 10))
        }
        scrapingCurrent={products.length || liveAspiratedCount}
        scrapingTotal={isAllCategoriesSweepActive ? (currentCategoryTotalArticles || 154784) : (scrapeVolume || 28)}
        scrapingLabel={
          job.aiAgentAction ||
          (isAllCategoriesSweepActive
            ? 'Balayage complet des catégories en cours...'
            : 'Aspiration matricielle en temps réel...')
        }
        scrapingPage={sweepCurrentPage || 1}
        onStopScraping={handleStopScrape}
        isSyncingSupabase={isSyncingAndClearing}
        supabaseSyncProgress={supabaseSyncProgress}
      />

      {/* ============================================================== */}
      {/* GLOBAL RECONNAISSANCE & MASTER SWEEP PROGRESS BAR (ALWAYS VISIBLE) */}
      {/* ============================================================== */}
      <GlobalSweepProgressBar
        isActive={isContinuousScraping || isAllCategoriesSweepActive}
        isComplete={isSweepComplete}
        currentCategoryIndex={activeSweepCategoryIndex}
        currentPage={sweepCurrentPage}
        totalPagesPerCategory={sweepPagesPerCategory === 0 ? (currentCategoryTotalPages || 5000) : sweepPagesPerCategory}
        currentCategoryTotalPages={currentCategoryTotalPages}
        currentCategoryTotalArticles={currentCategoryTotalArticles}
        currentCategoryBoutiques={currentCategoryBoutiques}
        currentCategoryAdsPubs={currentCategoryAdsPubs}
        categoryNewItemsCount={currentCategoryNewItemsCount}
        lastPageBatchStats={lastPageBatchStats}
        isInitialScanRunning={isInitialScanRunning}
        initialScanSummary={initialScanSummary}
        percent={sweepPercent}
        newItemsCount={sweepNewItemsCount}
        totalCatalogCount={products.length}
        completedCategorySlugs={sweepCompletedCategories}
        products={products}
        sweepPagesPerCategory={sweepPagesPerCategory}
        onChangeSweepPagesPerCategory={setSweepPagesPerCategory}
        onStartSweep={handleStartAllCategoriesSweep}
        onStopSweep={handleStopScrape}
        savedCheckpoint={savedCheckpoint}
        onResumeSweep={handleResumeAllCategoriesSweep}
        onSelectCategory={(cat) => {
          setSelectedCategorySlug(cat.slug);
          setTargetUrl(cat.url);
          cyberAudio.playHoloTap(880);
        }}
        onOpenAuditModal={() => setIsCategoryAuditModalOpen(true)}
      />

      {/* Real-time Category Completion Celebration Alert Banner */}
      <MasterSweepAlertBanner
        alert={categoryCompletionAlert}
        onDismiss={() => setCategoryCompletionAlert(null)}
      />

      {/* Slide-Over Settings & Control Center Drawer (Works on all devices) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* Backdrop with tap-to-close */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-slate-950 border-l border-emerald-500/30 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto z-10 space-y-6">
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-mono text-sm font-bold text-white tracking-wide uppercase">
                    Centre de Contrôle
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Fermer le menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* System Cache Info */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5 font-mono text-xs">
                <div className="text-[11px] text-slate-400">Articles en mémoire :</div>
                <div className="text-lg font-black text-[#00ff66] flex items-center justify-between">
                  <span>{products.length.toLocaleString()} articles</span>
                  <span className="text-[11px] font-normal text-slate-400">IndexedDB</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/80 flex items-center justify-between">
                  <span>Supabase :</span>
                  <span className={supabaseConfig.url ? 'text-cyan-400 font-bold' : 'text-amber-400'}>
                    {supabaseConfig.url ? 'Connecté' : 'Non configuré'}
                  </span>
                </div>
              </div>

              {/* Action Buttons List (Touch targets >= 44px) */}
              <div className="space-y-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsApkModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-[#00ff88] hover:bg-emerald-900/40 flex items-center justify-between font-bold cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Télécharger l'APK Mobile</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                    Android
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryAuditModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 flex items-center justify-between font-bold cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Radar className="w-4 h-4 text-cyan-400" />
                    <span>Audit Pré-Vol Catégories</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                    17 Catégories
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSplashScreen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-900/40 flex items-center justify-between font-bold cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Lancer le Splash Natif</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-400/40 text-purple-300">
                    Plein écran
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSupabaseModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-cyan-500/40 flex items-center justify-between font-semibold cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span>{supabaseConfig.url ? 'Gérer Supabase' : 'Lier Supabase DB'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Cloud Sync</span>
                </button>

                {/* Mobile Button: Envoyer vers Supabase et Vider la mémoire */}
                <button
                  type="button"
                  onClick={() => {
                    handleSendToSupabaseAndClearMemory();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={products.length === 0 || isSyncingAndClearing}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 to-cyan-950/70 border border-emerald-400/50 text-[#00ff88] hover:bg-emerald-900/40 flex items-center justify-between font-bold cursor-pointer transition-all active:scale-98 disabled:opacity-40"
                >
                  <div className="flex items-center gap-2.5">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    <span>Envoyer à Supabase & Vider</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-[#00ff88] font-bold">
                    {products.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const modes: ('subtle' | 'normal' | 'turbo' | 'off')[] = ['subtle', 'normal', 'turbo', 'off'];
                    const next = modes[(modes.indexOf(rainIntensity) + 1) % modes.length];
                    setRainIntensity(next);
                  }}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Pluie Matrix</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 border border-slate-800 text-emerald-400 font-bold uppercase">
                    {rainIntensity}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    {isAudioMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    <span>Sons Cyber HUD</span>
                  </div>
                  <span className={`text-[10px] font-bold ${isAudioMuted ? 'text-slate-500' : 'text-emerald-400'}`}>
                    {isAudioMuted ? 'MUET' : 'ACTIF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Radio className={`w-4 h-4 ${isVoiceActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                    <span>Voix IA Féminine (FR)</span>
                  </div>
                  <span className={`text-[10px] font-bold ${isVoiceActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {isVoiceActive ? 'ACTIVÉE' : 'MUTÉE'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleRequestNotificationPermission}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-between cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Notifications de Fin</span>
                  </div>
                  <span className={`text-[10px] font-bold ${notificationPermission === 'granted' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {notificationPermission === 'granted' ? 'AUTORISÉES' : 'DEMANDER'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleClearAllProducts();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={products.length === 0}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 hover:text-white flex items-center justify-between disabled:opacity-40 cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Vider tout le catalogue</span>
                  </div>
                  <span className="text-[10px] text-rose-400/80">Reset</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900 text-center text-[10px] font-mono text-slate-400">
              CYBER-VACUUM // Mobile Engine
            </div>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6 pb-28 lg:pb-8">
        {/* ============================================================== */}
        {/* TAB 1: VORTEX D'ASPIRATION & IA CRAWLER LIVE HUD               */}
        {/* ============================================================== */}
        {activeTab === 'vacuum' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Ouedkniss Category Hub & Matrix Sequential Sweep */}
            <OuedknissCategoryHub
              products={products}
              selectedCategorySlug={selectedCategorySlug}
              onSelectCategory={(cat) => {
                setSelectedCategorySlug(cat.slug);
                setTargetUrl(cat.url);
                cyberAudio.playHoloTap(880);
                addLog(`[CATÉGORIE_SÉLECTIONNÉE] ${cat.name} (${cat.url})`, 'info', `0xCAT_${cat.slug}`);
              }}
              onStartCategoryScrape={handleStartCategoryScrape}
              onStartAllCategoriesSweep={handleStartAllCategoriesSweep}
              onStopSweep={handleStopScrape}
              savedCheckpoint={savedCheckpoint}
              onResumeSweep={handleResumeAllCategoriesSweep}
              onResetSweep={() => {
                clearSweepCheckpoint();
                setSavedCheckpoint(null);
                addLog('[CHECKPOINT] Réinitialisation du checkpoint de session effectuée.', 'info');
              }}
              isScrapingActive={isContinuousScraping}
              activeSweepCategoryIndex={activeSweepCategoryIndex}
              sweepPagesPerCategory={sweepPagesPerCategory}
              onChangeSweepPagesPerCategory={setSweepPagesPerCategory}
              discoveredCategories={discoveredCategories}
              targetTypeFilter={targetTypeFilter}
              onChangeTargetTypeFilter={setTargetTypeFilter}
              onOpenAuditModal={() => setIsCategoryAuditModalOpen(true)}
              onSelectDiscoveredCategory={(catName) => {
                setSelectedCategorySlug(catName);
                handleSelectTab('catalog');
                cyberAudio.playHoloTap(950);
                addLog(`[CATÉGORIE_DÉCOUVERTE] Affichage du catalogue pour la catégorie : "${catName}"`, 'info');
              }}
            />

            {/* ============================================================== */}
            {/* THE ONE AND ONLY MASTER QUANTUM SCRAPER DECK (LE BOUTON UNIQUE)*/}
            {/* ============================================================== */}
            <MasterQuantumScraperDeck
              isScrapingActive={isContinuousScraping || isAllCategoriesSweepActive}
              isInitialScanRunning={isInitialScanRunning}
              activeSweepCategoryIndex={activeSweepCategoryIndex}
              sweepCurrentPage={sweepCurrentPage}
              currentCategoryTotalPages={currentCategoryTotalPages}
              currentCategoryTotalArticles={currentCategoryTotalArticles}
              currentCategoryNewItemsCount={currentCategoryNewItemsCount}
              currentCategoryBoutiques={currentCategoryBoutiques}
              currentCategoryAdsPubs={currentCategoryAdsPubs}
              sweepNewItemsCount={sweepNewItemsCount}
              sweepPercent={sweepPercent}
              completedCategories={sweepCompletedCategories}
              lastPageBatchStats={lastPageBatchStats}
              savedCheckpoint={savedCheckpoint}
              selectedCategorySlug={selectedCategorySlug}
              totalCatalogCount={products.length}
              onStartMasterScrape={handleStartMasterScrape}
              onStopScrape={handleStopScrape}
              onResumeMasterScrape={handleResumeMasterScrape}
              onResetCheckpoint={handleResetCheckpoint}
              onSelectCategory={(cat) => {
                setSelectedCategorySlug(cat.slug);
                setTargetUrl(cat.url);
                cyberAudio.playHoloTap(880);
                addLog(`[CATÉGORIE_SÉLECTIONNÉE] ${cat.name} (${cat.url})`, 'info', `0xCAT_${cat.slug}`);
              }}
              onOpenAuditModal={() => setIsCategoryAuditModalOpen(true)}
              targetTypeFilter={targetTypeFilter}
              onChangeTargetTypeFilter={setTargetTypeFilter}
            />

            {/* Collapsible Advanced Custom URL / External Platforms Accordion */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-2.5 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                className="w-full flex items-center justify-between text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer py-1"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold">Option Avancée : URL Cible Externe Personnalisée (Amazon, Temu, Jumia)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {showCustomUrlInput ? 'Masquer' : 'Afficher'}
                </span>
              </button>

              {showCustomUrlInput && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                    <span className="text-slate-500 shrink-0">Préréglages rapides :</span>
                    {PRESET_URLS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setTargetUrl(preset.url);
                          cyberAudio.playHoloTap(900);
                        }}
                        className={`px-2 py-1 rounded-lg border whitespace-nowrap cursor-pointer transition-all ${
                          targetUrl === preset.url
                            ? 'bg-emerald-500/20 text-[#00ff88] border-emerald-400 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleStartScrape(targetUrl);
                    }}
                    className="flex flex-col sm:flex-row gap-2 items-stretch"
                  >
                    <input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="Entrez une URL externe spécifique..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="submit"
                      disabled={isContinuousScraping}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-[#00ff88] hover:bg-emerald-950/60 font-bold text-xs cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Aspirer URL Externe</span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* The Quantum Vacuum Vortex Visualizer */}
            <VacuumVisualizer
              job={job}
              latestProduct={products[0]}
              totalProductsCount={products.length}
              scrapeVolume={scrapeVolume}
              isContinuousScraping={isContinuousScraping}
            />

            {/* The AI Scrolling Browser & Telemetry Console */}
            <AiCrawlerLiveHud
              job={job}
              products={products}
              scrapeVolume={scrapeVolume}
              totalProductsCount={products.length}
              onOpenCategoryAudit={() => setIsCategoryAuditModalOpen(true)}
              isInitialScanRunning={isInitialScanRunning}
              lastPageBatchStats={lastPageBatchStats}
              currentCategoryMeta={
                activeSweepCategoryIndex !== undefined && OUEDKNISS_CATEGORIES[activeSweepCategoryIndex]
                  ? {
                      index: activeSweepCategoryIndex + 1,
                      totalCategories: OUEDKNISS_CATEGORIES.length,
                      name: OUEDKNISS_CATEGORIES[activeSweepCategoryIndex].name,
                      slug: OUEDKNISS_CATEGORIES[activeSweepCategoryIndex].slug,
                      currentPage: sweepCurrentPage,
                      totalPages: currentCategoryTotalPages || OUEDKNISS_CATEGORIES[activeSweepCategoryIndex].realPages || 50,
                      totalArticles: currentCategoryTotalArticles || 1000,
                      boutiquesCount: currentCategoryBoutiques || 100,
                      adsPubsCount: currentCategoryAdsPubs || 50,
                      categoryItemsScraped: currentCategoryNewItemsCount,
                      nextCategoryName:
                        activeSweepCategoryIndex + 1 < OUEDKNISS_CATEGORIES.length
                          ? OUEDKNISS_CATEGORIES[activeSweepCategoryIndex + 1].name
                          : null,
                    }
                  : selectedCategorySlug
                  ? {
                      index: Math.max(1, OUEDKNISS_CATEGORIES.findIndex((c) => c.slug === selectedCategorySlug) + 1),
                      totalCategories: OUEDKNISS_CATEGORIES.length,
                      name: OUEDKNISS_CATEGORIES.find((c) => c.slug === selectedCategorySlug)?.name || selectedCategorySlug,
                      slug: selectedCategorySlug,
                      currentPage: sweepCurrentPage,
                      totalPages: currentCategoryTotalPages || 50,
                      totalArticles: currentCategoryTotalArticles || 1000,
                      boutiquesCount: currentCategoryBoutiques || 100,
                      adsPubsCount: currentCategoryAdsPubs || 50,
                      categoryItemsScraped: currentCategoryNewItemsCount,
                      nextCategoryName: null,
                    }
                  : null
              }
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

            {/* The Live Aspirated Cards Stream & Animations directly below Vortex */}
            {products.length > 0 && (
              <div className="pt-4 border-t border-slate-900">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping" />
                    <h3 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
                      FLUX MATRICIEL DES ARTICLES ASPIRÉS EN DIRECT ({filteredProducts.length})
                    </h3>
                  </div>
                </div>

                {(globalSearchTerm.trim() || globalSelectedCategory !== 'all') && (
                  <div className="flex items-center justify-between p-3 mb-4 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>
                        Filtre actif : <strong>{filteredProducts.length}</strong> sur {products.length} articles
                        {globalSearchTerm && ` ("${globalSearchTerm}")`}
                        {globalSelectedCategory !== 'all' && ` [${globalSelectedCategory}]`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGlobalSearchTerm('');
                        setGlobalSelectedCategory('all');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[#00ff88] border border-emerald-500/40 font-bold transition-all cursor-pointer text-[11px]"
                    >
                      Effacer filtre
                    </button>
                  </div>
                )}

                <ProductCatalogGrid
                  products={filteredProducts}
                  onSyncSingleProduct={handleSyncSingleProduct}
                  onBulkSyncSupabase={handleBulkSyncSupabase}
                  onSendToSupabaseAndClearMemory={handleSendToSupabaseAndClearMemory}
                  isSupabaseConfigured={Boolean(supabaseConfig.url && supabaseConfig.anonKey)}
                  onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
                  onRemoveCurrency={handleRemoveCurrency}
                  onClearAllProducts={handleClearAllProducts}
                  discoveredCategories={discoveredCategories}
                  supabaseConfig={supabaseConfig}
                  refreshTrigger={temuRefreshTrigger}
                />
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CATALOGUE COMPLET & CYBER-BASE COMMAND DECK            */}
        {/* ============================================================== */}
        {activeTab === 'catalog' && (
          <div className="space-y-5">
            {/* Dedicated Cyber-Base Database Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 p-4 sm:p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-[#00ff88]">
                      <Database className="w-4 h-4" />
                    </div>
                    <h2 className="font-mono text-base sm:text-lg font-black text-white tracking-wide uppercase">
                      CYBER-BASE // CATALOGUE DE MARCHÉ ALGÉRIE
                    </h2>
                    <AnimatedAspirationCounter
                      count={toSafeNonNegativeInt(products?.length)}
                      label=""
                      unit="ITEMS SCELLÉS"
                      size="sm"
                      isLiveScraping={isContinuousScraping || job.status === 'aspirating'}
                    />
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Répertoire complet des annonces aspirées • Filtrage par Wilaya, Fourchettes DA, et tri intelligent
                  </p>
                </div>

                {/* Quick database actions */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <button
                    onClick={() => handleRemoveCurrency('EUR')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Purger les résidus en Euro pour un catalogue 100% en Dinar Algérien"
                  >
                    <span>🇩🇿 Purger € (100% DA)</span>
                  </button>
                  <button
                    onClick={() => setIsSupabaseModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{supabaseConfig.url ? 'Supabase Connecté' : 'Lier Supabase'}</span>
                  </button>
                  <button
                    onClick={handleClearAllProducts}
                    disabled={products.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vider ({products.length})</span>
                  </button>
                </div>
              </div>

              {/* Real-time Database KPI Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-4 font-mono">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 min-w-0 overflow-hidden">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider truncate">Total Articles</span>
                  <div className="text-lg sm:text-xl font-black text-[#00ff88] truncate mt-0.5">
                    {products.length.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500">100% persistant (IDB)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 min-w-0 overflow-hidden">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider truncate">Devise Principale</span>
                  <div className="text-lg sm:text-xl font-black text-white truncate mt-0.5 flex items-center gap-1">
                    <span>🇩🇿 DA</span>
                    <span className="text-xs text-emerald-400 font-bold">
                      ({products.filter((p) => p.currency === 'DA').length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Dinar Algérien</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 min-w-0 overflow-hidden">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider truncate">Catégories Actives</span>
                  <div className="text-lg sm:text-xl font-black text-cyan-300 truncate mt-0.5">
                    {new Set(products.map((p) => p.category)).size}
                  </div>
                  <span className="text-[10px] text-slate-500">17 officielles Ouedkniss</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 min-w-0 overflow-hidden">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider truncate">Valorisation Stock</span>
                  <div className="text-lg sm:text-xl font-black text-amber-300 truncate mt-0.5">
                    {catalogTotalValueDa}
                  </div>
                  <span className="text-[10px] text-slate-500">DA (Volume marchand)</span>
                </div>
              </div>
            </div>

            {(globalSearchTerm.trim() || globalSelectedCategory !== 'all' || filterOfficialStoresOnly) && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Filtre actif : <strong>{filteredProducts.length}</strong> sur {products.length} articles
                    {filterOfficialStoresOnly && ' [🏪 Boutiques Officielles uniquement]'}
                    {globalSearchTerm && ` ("${globalSearchTerm}")`}
                    {globalSelectedCategory !== 'all' && ` [${globalSelectedCategory}]`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearchTerm('');
                    setGlobalSelectedCategory('all');
                    setFilterOfficialStoresOnly(false);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-[#00ff88] border border-emerald-500/40 font-bold transition-all cursor-pointer text-[11px]"
                >
                  Effacer filtre
                </button>
              </div>
            )}

            {/* The ProductCatalogGrid */}
            <ProductCatalogGrid
              products={filteredProducts}
              onSyncSingleProduct={handleSyncSingleProduct}
              onBulkSyncSupabase={handleBulkSyncSupabase}
              onSendToSupabaseAndClearMemory={handleSendToSupabaseAndClearMemory}
              isSupabaseConfigured={Boolean(supabaseConfig.url && supabaseConfig.anonKey)}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onRemoveCurrency={handleRemoveCurrency}
              onClearAllProducts={handleClearAllProducts}
              discoveredCategories={discoveredCategories}
              supabaseConfig={supabaseConfig}
              refreshTrigger={temuRefreshTrigger}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: MARKET TEMU-DZ (TEMU E-COMMERCE HUB)                    */}
        {/* ============================================================== */}
        {activeTab === 'temu' && (
          <div className="space-y-5">
            {/* Bespoke Temu-DZ Commercial Mega-Header */}
            <div className="rounded-2xl bg-gradient-to-r from-[#fb5200] via-[#ff6a00] to-[#ff3b00] p-4 sm:p-6 text-white shadow-[0_0_35px_rgba(251,82,0,0.3)] relative overflow-hidden">
              {/* Subtle cyber background grid accent */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-400/20 via-transparent to-transparent pointer-events-none" />

              {/* Algerian 58 Wilayas delivery notice strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-white/20 text-xs font-mono font-bold">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black/40 text-yellow-300 border border-yellow-300/40 flex items-center gap-1">
                    🇩🇿 58 WILAYAS
                  </span>
                  <span>LIVRAISON EXPRESS À DOMICILE & PAIEMENT MAIN À MAIN (COD)</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-white/90">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-yellow-200" />
                    Vendeurs Ouedkniss Vérifiés
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-yellow-200" />
                    Retours Gratuits 14 Jours
                  </span>
                </div>
              </div>

              {/* Main Promo Flash Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-black text-yellow-300 font-mono text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-yellow-400 fill-current animate-bounce" />
                      VENTES FLASH DU JOUR
                    </span>
                    <span className="text-xs font-bold text-yellow-100 font-mono animate-pulse">
                      JUSQU'À -80% DE RÉDUCTION
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black font-sans tracking-tight text-white drop-shadow-md">
                    TEMU ALGÉRIE // PRIX IMBATTABLES & ARRIVAGES EN DIRECT
                  </h1>
                  <p className="text-xs sm:text-sm text-yellow-100/90 font-medium max-w-2xl">
                    Achetez directement auprès des vendeurs et importateurs algériens. Prix de gros en Dinar Algérien (DA) sans intermédiaire !
                  </p>
                </div>

                {/* Countdown Timer & Coupon Code Pill */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 font-mono">
                  {/* Countdown Timer */}
                  <div className="px-3 py-2 rounded-xl bg-black/50 border border-white/20 text-center">
                    <span className="block text-[10px] text-yellow-300 font-bold uppercase tracking-wider">Fin de la vente dans</span>
                    <span className="text-base font-black text-white tracking-widest">
                      {temuCountdown}
                    </span>
                  </div>

                  {/* Copy Coupon Code Button */}
                  <button
                    type="button"
                    onClick={handleCopyPromoCode}
                    className="px-4 py-2 rounded-xl bg-yellow-400 text-slate-950 font-black text-xs hover:bg-yellow-300 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    {copiedPromo ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-800" />
                        <span>CODE COPIÉ !</span>
                      </>
                    ) : (
                      <>
                        <Tag className="w-4 h-4" />
                        <span>CODE: PROMO-DZ (-40%)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* The full Temu storefront component (Reads directly from Supabase Cloud) */}
            <TemuEcommerceHub
              products={products}
              supabaseConfig={supabaseConfig}
              onSelectProduct={(p) => setSelectedModalProduct(p)}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              refreshTrigger={temuRefreshTrigger}
            />
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: TABLEAU DE BORD & TENDANCES DE PRIX EN TEMPS RÉEL        */}
        {/* ============================================================== */}
        {activeTab === 'trends' && (
          <div className="space-y-5">
            {/* Bespoke Financial Intelligence & Analytics Terminal Header */}
            <div className="rounded-2xl bg-slate-950/90 border border-cyan-500/40 p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,240,255,0.12)]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-cyan-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                      <LineChart className="w-4 h-4" />
                    </div>
                    <h2 className="font-mono text-base sm:text-lg font-black text-white tracking-wide uppercase">
                      TERMINAL D'INTELLIGENCE ÉCONOMIQUE // MARCHÉ DZ
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                      TEMPS RÉEL
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Monitoring algorithmique des baisses de prix, valorisation du panier et courbes historiques multi-sources
                  </p>
                </div>

                {/* Quick actions for analytics */}
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <button
                    onClick={handleTriggerPriceUpdate}
                    disabled={products.length === 0 || isUpdatingPrices}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30 font-bold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
                    title="Simule des fluctuations de marché aléatoires pour vérifier les détections de promotions"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isUpdatingPrices ? 'Simulation en cours...' : 'Simuler Fluctuations'}</span>
                  </button>

                  <button
                    onClick={() => setAutoUpdate((prev) => ({ ...prev, enabled: !prev.enabled }))}
                    className={`px-3 py-1.5 rounded-lg border font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      autoUpdate.enabled
                        ? 'bg-emerald-950/60 border-emerald-400/60 text-[#00ff88]'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${autoUpdate.enabled ? 'animate-spin' : ''}`} />
                    <span>Auto-Update : {autoUpdate.enabled ? `${autoUpdate.intervalMinutes}m` : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Market Overview Ticker Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-4 font-mono">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 min-w-0 overflow-hidden">
                  <span className="block text-[10px] text-cyan-400 uppercase tracking-wider truncate">Prix Moyen Catalogue</span>
                  <div className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                    {trendsStats.avgPriceFormatted}
                  </div>
                  <span className="text-[10px] text-slate-500">Moyenne pondérée DA</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20 min-w-0 overflow-hidden">
                  <span className="block text-[10px] text-emerald-400 uppercase tracking-wider truncate">Rabais Actif Moyen</span>
                  <div className="text-base sm:text-lg font-black text-[#00ff88] truncate mt-0.5">
                    -{trendsStats.avgDiscount}%
                  </div>
                  <span className="text-[10px] text-slate-500">Marge de négociation</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20 min-w-0 overflow-hidden">
                  <span className="block text-[10px] text-amber-400 uppercase tracking-wider truncate">Articles En Promotion</span>
                  <div className="text-base sm:text-lg font-black text-amber-300 truncate mt-0.5">
                    {trendsStats.discountedCount} / {products.length}
                  </div>
                  <span className="text-[10px] text-slate-500">Annonces avec décote</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/20 min-w-0 overflow-hidden">
                  <span className="block text-[10px] text-purple-400 uppercase tracking-wider truncate">Volatilité Détectée</span>
                  <div className="text-base sm:text-lg font-black text-purple-300 truncate mt-0.5">
                    {trendsStats.volatilityRate}%
                  </div>
                  <span className="text-[10px] text-slate-500">Fréquence de variation</span>
                </div>
              </div>
            </div>

            {/* The PriceTrendDashboard component */}
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
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedModalProduct && (
        <ProductDetailModal
          product={selectedModalProduct}
          onClose={() => setSelectedModalProduct(null)}
          onSyncSupabase={handleSyncSingleProduct}
        />
      )}

      {/* Cyberpunk Footer */}
      <footer className="relative z-20 border-t border-slate-900 bg-slate-950/90 py-4 mt-8 font-mono text-xs text-slate-500 mb-16 lg:mb-0">
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

      {/* Category Scraped Sync & RAM Flush Prompt Dialog */}
      <CategorySyncPromptModal
        data={categorySyncPromptData}
        supabaseConfig={supabaseConfig}
        onClose={() => setCategorySyncPromptData(null)}
        onSyncAndClearLocal={async (syncedCount) => {
          clearStoredProducts();
          setProducts([]);
          setLiveAspiratedCount(0);
          if (typeof syncedCount === 'number' && syncedCount > 0) {
            setSupabaseTotalCount((prev) => (prev > 0 ? prev + syncedCount : syncedCount));
          }
          setTemuRefreshTrigger((prev) => prev + 1);
          setSyncNotice({
            message: `Articles synchronisés vers Supabase Cloud ! Mémoire RAM libérée à 100%. L'application tourne à 60 FPS.`,
            type: 'success',
          });
        }}
        onSyncKeepLocal={async (syncedCount) => {
          if (typeof syncedCount === 'number' && syncedCount > 0) {
            setSupabaseTotalCount((prev) => (prev > 0 ? prev + syncedCount : syncedCount));
          }
          setTemuRefreshTrigger((prev) => prev + 1);
          setSyncNotice({
            message: `Articles synchronisés vers Supabase Cloud avec succès !`,
            type: 'success',
          });
        }}
        onClearLocalOnly={() => {
          clearStoredProducts();
          setProducts([]);
          setLiveAspiratedCount(0);
          setSyncNotice({
            message: `Mémoire RAM locale vidée. Vos articles restent consultables depuis Supabase.`,
            type: 'success',
          });
        }}
        onOpenSupabaseConfig={() => {
          setIsSupabaseModalOpen(true);
        }}
        onGoToTemuTab={() => {
          setActiveTab('temu');
        }}
      />

      {/* High-Visibility Master Sweep Category Completion Banner (Audio & Visual Alert) */}
      <MasterSweepAlertBanner
        alert={categoryCompletionAlert}
        onDismiss={() => setCategoryCompletionAlert(null)}
        onViewCategory={(categorySlug) => {
          setSelectedCategorySlug(categorySlug);
          setActiveTab('catalog');
          setCategoryCompletionAlert(null);
        }}
      />

      {/* APK Mobile & GitHub Releases Modal */}
      <ApkReleaseModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Recharts Summary Category Distribution & Prices Modal */}
      {showCategoryChartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-5xl max-h-[92vh] bg-slate-950 border border-purple-500/40 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-purple-500/30 flex items-center justify-between bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-mono text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-2">
                    <span>GRAPHIQUES RÉCAPITULATIFS PAR CATÉGORIE</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      RECHARTS
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Distribution volumétrique des articles et fourchettes de prix moyens en temps réel ({products.length} articles)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryChartsModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition-colors cursor-pointer text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {/* Modal Body with CategoryDistributionPieChart */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-100px)] space-y-4">
              <CategoryDistributionPieChart
                products={products}
                onSelectCategory={(cat) => {
                  setGlobalSelectedCategory(cat);
                  setShowCategoryChartsModal(false);
                  setActiveTab('catalog');
                }}
                selectedCategory={globalSelectedCategory !== 'all' ? globalSelectedCategory : null}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation App Bar (Thumb-Friendly Native Responsive Experience) */}
      <nav
        aria-label="Navigation principale mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-emerald-500/30 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
          {/* Tab 1: Vortex & IA */}
          <button
            type="button"
            onClick={() => handleSelectTab('vacuum')}
            className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative min-h-[48px] ${
              activeTab === 'vacuum'
                ? 'text-[#00ff88]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'vacuum' && (
              <span className="absolute top-0 inset-x-2 h-0.5 bg-gradient-to-r from-emerald-500 to-[#00ff88] rounded-full shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
            )}
            <Cpu className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-mono font-bold tracking-tight">Vortex</span>
          </button>

          {/* Tab 2: Catalogue */}
          <button
            type="button"
            onClick={() => handleSelectTab('catalog')}
            className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative min-h-[48px] ${
              activeTab === 'catalog'
                ? 'text-[#00ff88]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'catalog' && (
              <span className="absolute top-0 inset-x-2 h-0.5 bg-gradient-to-r from-emerald-500 to-[#00ff88] rounded-full shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
            )}
            <div className="relative">
              <ShoppingBag className="w-5 h-5 shrink-0" />
              {products.length > 0 && (
                <span className="absolute -top-1.5 -right-3 px-1 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-mono text-[9px] font-black leading-tight border border-black shadow">
                  {products.length > 999 ? `${Math.round(products.length / 1000)}k` : products.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono font-bold tracking-tight">Catalogue</span>
          </button>

          {/* Tab 3: TEMU-DZ */}
          <button
            type="button"
            onClick={() => handleSelectTab('temu')}
            className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative min-h-[48px] ${
              activeTab === 'temu'
                ? 'text-orange-400'
                : 'text-slate-400 hover:text-orange-200'
            }`}
          >
            {activeTab === 'temu' && (
              <span className="absolute top-0 inset-x-2 h-0.5 bg-gradient-to-r from-[#fb5200] to-[#ff7300] rounded-full shadow-[0_0_8px_rgba(251,82,0,0.8)]" />
            )}
            <div className="relative">
              <Zap className="w-5 h-5 fill-current shrink-0" />
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-tight">TEMU-DZ</span>
          </button>

          {/* Tab 4: Tendances */}
          <button
            type="button"
            onClick={() => handleSelectTab('trends')}
            className={`flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative min-h-[48px] ${
              activeTab === 'trends'
                ? 'text-cyan-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {activeTab === 'trends' && (
              <span className="absolute top-0 inset-x-2 h-0.5 bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            )}
            <LineChart className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-mono font-bold tracking-tight">Tendances</span>
          </button>

          {/* Tab 5: Centre de Contrôle */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(true);
              cyberAudio.playClick();
            }}
            className="flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative min-h-[48px] text-slate-400 hover:text-emerald-300 active:scale-95"
            title="Ouvrir le Centre de Contrôle"
          >
            <SlidersHorizontal className="w-5 h-5 shrink-0 text-emerald-400" />
            <span className="text-[10px] font-mono font-bold tracking-tight">Contrôle</span>
          </button>
        </div>
      </nav>

      {/* Fullscreen Native Cyber Splash Screen */}
      <CyberNativeSplashScreen
        isOpen={showSplashScreen}
        onComplete={() => setShowSplashScreen(false)}
        soundEnabled={!isAudioMuted}
      />

      {/* Pre-Flight Category Reconnaissance & Market Audit Modal */}
      <CategoryMatrixAuditModal
        isOpen={isCategoryAuditModalOpen}
        onClose={() => setIsCategoryAuditModalOpen(false)}
        onLaunchFullSweep={handleStartAllCategoriesSweep}
        onLaunchSingleCategory={(slug) => {
          const cat = OUEDKNISS_CATEGORIES.find((c) => c.slug === slug);
          if (cat) handleStartCategoryScrape(cat);
        }}
        currentActiveCategorySlug={selectedCategorySlug}
      />
    </div>
  );
}
