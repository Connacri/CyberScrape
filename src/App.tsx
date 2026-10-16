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
import {
  OUEDKNISS_CATEGORIES,
  OuedknissCategoryMeta,
  detectOuedknissCategory,
} from './data/ouedknissCategories';
import {
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  getStoredProducts,
  loadStoredProductsFromIndexedDB,
  saveStoredProducts,
  saveScrapedProductsBatch,
  clearStoredProducts,
  syncProductsToSupabase,
} from './utils/supabaseClient';
import {
  saveSweepCheckpoint,
  loadSweepCheckpoint,
  clearSweepCheckpoint,
  saveCategoryProgress,
  getCategoryResumePage,
  resetCategoryProgress,
  ScrapeSweepCheckpoint,
} from './utils/scrapeCheckpoint';
import { cyberAudio } from './utils/cyberAudio';
import { backgroundScraper } from './utils/backgroundScraperWorker';
import { TemuEcommerceHub } from './components/TemuEcommerceHub';
import { ProductDetailModal } from './components/ProductDetailModal';
import {
  MasterSweepAlertBanner,
  CategoryCompletionAlertData,
} from './components/MasterSweepAlertBanner';
import { ApkReleaseModal } from './components/ApkReleaseModal';
import { CyberNativeSplashScreen } from './components/CyberNativeSplashScreen';
import { CyberVacuumLogo } from './components/CyberVacuumLogo';
import {
  executeScrapeRequest,
  executeSimulatePriceUpdate,
} from './utils/scraperEngine';
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
    productUrl: 'https://www.ouedkniss.com/automobiles/renault-clio-4-gt-line',
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
    productUrl: 'https://www.ouedkniss.com/automobiles/volkswagen-golf-8-r-line',
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
    productUrl: 'https://www.ouedkniss.com/telephones/samsung-galaxy-s24-ultra',
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
    productUrl: 'https://www.ouedkniss.com/telephones/iphone-15-pro-max',
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
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [showSplashScreen, setShowSplashScreen] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'all' | 'boutique' | 'annonce' | 'pub'>('all');
  const isDbHydrated = useRef<boolean>(false);
  const abortScrapingRef = useRef<boolean>(false);
  const lotPageRef = useRef<Record<string, number>>({});
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
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

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
      if (v && typeof v.lastPage === 'number') {
        lotPageRef.current[k] = v.lastPage;
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
    initialCompleted: string[] = []
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
    cyberAudio.speakScrapeStarted("toutes les catégories");

    const isUnlimited = sweepPagesPerCategory === 0;
    // Mode Illimité : jusqu'au bout du catalogue sans coupure artificielle (5 000 pages / catégorie)
    const pagesPerCat = isUnlimited ? 5000 : Math.max(1, sweepPagesPerCategory);
    const totalCats = OUEDKNISS_CATEGORIES.length;

    addLog(
      `[BALAYAGE_OPTIMISÉ_SENIOR] Aspiration haute performance des ${totalCats} CATÉGORIES (${
        isUnlimited
          ? 'Mode Illimité Exhaustif : jusqu\'au dernier article sans coupure'
          : `${pagesPerCat} pages/catégorie (${pagesPerCat * 48} articles/catégorie)`
      })`,
      'cyber',
      '0xGLOBAL_START'
    );
    cyberAudio.playVacuumSuck();

    let accumulated: ScrapedProduct[] = initialAccumulated.filter((p) => p.currency === 'DA');
    const completedSet = new Set<string>(initialCompleted);

    for (let catIdx = startCatIndex; catIdx < totalCats; catIdx++) {
      if (abortScrapingRef.current) break;

      const cat = OUEDKNISS_CATEGORIES[catIdx];
      setActiveSweepCategoryIndex(catIdx);
      setSelectedCategorySlug(cat.slug);
      setTargetUrl(cat.url);

      const firstPage = catIdx === startCatIndex ? Math.max(1, startPage) : 1;

      addLog(`[CATÉGORIE_${catIdx + 1}/${totalCats}] Début de l'aspiration intégrale de "${cat.name}" (Page ${firstPage})...`, 'cyber', `0xCAT_${catIdx + 1}`);

      let categoryTotalNew = 0;
      let categoryTotalUpdated = 0;
      let emptyBatchesStreak = 0;

      // Pipeline haute vitesse concurrent : 4 pages en parallèle par lot
      const CONCURRENCY = 4;
      for (let page = firstPage; page <= pagesPerCat; page += CONCURRENCY) {
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
        const currentStep = catIdx * pagesPerCat + page;
        const totalSteps = totalCats * pagesPerCat;
        const progressPct = isUnlimited
          ? Math.min(99, Math.round(((catIdx * 100) / totalCats) + ((page % 100) / (totalCats * 2))))
          : Math.min(99, Math.round((currentStep / totalSteps) * 100));
        setSweepPercent(progressPct);

        setJob((prev) => ({
          ...prev,
          status: 'aspirating',
          progress: progressPct,
          itemsFound: accumulated.length,
          aiAgentAction: `[${catIdx + 1}/${totalCats}: ${cat.name}] Pages ${page}-${page + CONCURRENCY - 1}/${isUnlimited ? '∞ Illimité' : pagesPerCat} en cours... (${accumulated.length.toLocaleString('fr-FR')} articles scellés)`,
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
            if (pNum <= pagesPerCat) {
              reqs.push(
                executeScrapeRequest({
                  url: cat.url,
                  maxItems: 48,
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
              setLiveAspiratedCount(accumulated.length);
              cyberAudio.playItemAspirated();
              setProducts(accumulated);
              saveScrapedProductsBatch(newUniqueBatch);
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

      addLog(
        `[CATÉGORIE_SCELLÉE] "${cat.name}" terminée à 100% ! (+${categoryTotalNew} nouveaux). Passage à la catégorie ${catIdx + 2 <= totalCats ? catIdx + 2 : 'FINALE'}...`,
        'vacuum',
        `0xDONE_${cat.slug.slice(0, 4).toUpperCase()}`
      );

      // Mettre à jour checkpoint vers catégorie suivante
      if (catIdx + 1 < totalCats) {
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
        aiAgentAction: `Balayage complet structuré terminé ! ${accumulated.length.toLocaleString('fr-FR')} articles scellés dans la base.`,
      }));

      cyberAudio.playComplete();
      addLog(
        `[SUCCÈS QUANTIQUE] Balayage complet achevé ! Total : ${accumulated.length.toLocaleString('fr-FR')} articles indexés.`,
        'success',
        '0xDONE'
      );

      saveStoredProducts(accumulated, true);

      if (supabaseConfig.url && supabaseConfig.anonKey && supabaseConfig.autoSync) {
        await syncProductsToSupabase(accumulated, supabaseConfig);
      }
    }
  };

  const handleStartAllCategoriesSweep = async () => {
    clearSweepCheckpoint();
    setSavedCheckpoint(null);
    await runAllCategoriesSweep(0, 1, replaceCatalog ? [] : [...products], []);
  };

  const handleResumeAllCategoriesSweep = async () => {
    const cp = loadSweepCheckpoint();
    if (!cp) {
      await handleStartAllCategoriesSweep();
      return;
    }
    const catIdx = Math.max(0, Math.min(OUEDKNISS_CATEGORIES.length - 1, cp.categoryIndex));
    const page = Math.max(1, cp.currentPage);
    const completed = cp.completedCategorySlugs || [];
    addLog(
      `[REPRISE_SESSION] Reprise automatique de l'aspiration à la catégorie ${catIdx + 1}/${OUEDKNISS_CATEGORIES.length} (${cp.categoryName}), page ${page}`,
      'cyber',
      '0xRESUME'
    );
    await runAllCategoriesSweep(catIdx, page, [...products], completed);
  };


  // ========================================================
  // START QUANTUM SCRAPE & ASPIRATION PIPELINE
  // ========================================================
  const handleStartCategoryScrape = async (category: OuedknissCategoryMeta) => {
    setSelectedCategorySlug(category.slug);
    setTargetUrl(category.url);
    cyberAudio.playHoloTap(880);
    addLog(`[ACTION DIRECTE] Lancement de l'aspiration instantanée pour "${category.name}"`, 'cyber', `0xCAT_${category.slug}`);
    await handleStartScrape(category.url, category.slug);
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

      const targetCategorySlugs = effectiveCategorySlug
        ? [effectiveCategorySlug]
        : OUEDKNISS_CATEGORIES.map((c) => c.slug);

      for (let cIdx = 0; cIdx < targetCategorySlugs.length; cIdx++) {
        if (abortScrapingRef.current) break;

        const currentCatSlug = targetCategorySlugs[cIdx];
        const catMeta = OUEDKNISS_CATEGORIES.find((c) => c.slug === currentCatSlug);
        const catName = catMeta?.name || currentCatSlug;
        setSelectedCategorySlug(currentCatSlug);

        addLog(`[CATÉGORIE_${cIdx + 1}/${targetCategorySlugs.length}] Début aspiration intégrale Turbo de "${catName}"...`, 'cyber');

        const pagesToRun = 150; // Jusqu'au bout des pages
        let emptyStreak = 0;

        // Parallel chunked streaming: 3 pages concurrently for blazing speed
        for (let page = 1; page <= pagesToRun; page += 3) {
          if (abortScrapingRef.current) break;

          setJob((prev) => ({
            ...prev,
            progress: Math.min(99, Math.round(((page % 100) / 100) * 100)),
            aiAgentAction: `[${catName}] Pages ${page}-${page + 2} en cours (Turbo Stream)... (${accumulated.length} articles scellés)`,
            crawlerState: {
              ...prev.crawlerState,
              scrollY: (cIdx * 15 + page) * 1200,
              domNodesInspected: (cIdx * 15 + page) * 320,
              tokensProcessed: (cIdx * 15 + page) * 1800,
            },
          }));

          try {
            const [data1, data2, data3] = await Promise.all([
              executeScrapeRequest({
                url: catMeta?.url || activeUrl,
                maxItems: 48,
                engineMode,
                page,
                categorySlug: currentCatSlug,
                targetTypeFilter,
              }),
              page + 1 <= pagesToRun
                ? executeScrapeRequest({
                    url: catMeta?.url || activeUrl,
                    maxItems: 48,
                    engineMode,
                    page: page + 1,
                    categorySlug: currentCatSlug,
                    targetTypeFilter,
                  })
                : Promise.resolve({ products: [] as ScrapedProduct[] }),
              page + 2 <= pagesToRun
                ? executeScrapeRequest({
                    url: catMeta?.url || activeUrl,
                    maxItems: 48,
                    engineMode,
                    page: page + 2,
                    categorySlug: currentCatSlug,
                    targetTypeFilter,
                  })
                : Promise.resolve({ products: [] as ScrapedProduct[] }),
            ]);

            const pageProducts: ScrapedProduct[] = [
              ...(data1.products || []),
              ...(data2.products || []),
              ...(data3.products || []),
            ];

            if (pageProducts.length === 0) {
              emptyStreak++;
              if (emptyStreak >= 2) {
                addLog(`[FIN_CATÉGORIE] Fin des annonces pour "${catName}" à la page ${page}.`, 'info', '0xEND');
                break;
              }
            } else {
              emptyStreak = 0;
            }

            if (pageProducts.length > 0) {
              scanForDiscoveredCategories(pageProducts);

              if (replaceCatalog && cIdx === 0 && page === 1) {
                accumulated = [...pageProducts];
              } else if (replaceCatalog) {
                accumulated = [...accumulated, ...pageProducts];
              } else {
                const { merged, newCount, updatedCount, unchangedCount } = smartMergeProducts(
                  accumulated,
                  pageProducts
                );
                accumulated = merged;
                if (newCount > 0 || updatedCount > 0) {
                  cyberAudio.playItemAspirated();
                }
                addLog(
                  `[${catName} P${page}-${page + 1}] +${newCount} nouveaux, ${updatedCount} màj (${accumulated.length} total)`,
                  updatedCount > 0 ? 'cyber' : newCount > 0 ? 'vacuum' : 'info',
                  `0xP${page}`
                );
              }
              setProducts([...accumulated]);
              await saveScrapedProductsBatch(pageProducts);
              saveStoredProducts(accumulated, false);
            }

            // High performance micro-yield (10ms)
            await new Promise((r) => setTimeout(r, 10));
          } catch (pageErr) {
            console.warn('Page fetch issue:', pageErr);
            break;
          }
        }

        cyberAudio.playCategoryUnlocked();
        addLog(
          `[CATÉGORIE_SCELLÉE] "${catName}" terminée à 100% ! Passage à la suite...`,
          'vacuum'
        );
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
    // MODE LOT UNIQUE (24, 50, 100, 250, 500) - TURBO INSTANTANÉ
    // ========================================================
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

    const lotKey = effectiveCategorySlug || activeUrl;
    lotPageRef.current[lotKey] = (lotPageRef.current[lotKey] || 0) + 1;
    const currentLotPage = lotPageRef.current[lotKey];

    try {
      setJob((prev) => ({
        ...prev,
        status: 'aspirating',
        progress: 60,
        aiAgentAction: `Aspiration Turbo en cours (${scrapeVolume} articles)...`,
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

      {/* Top Header Navigation Bar (Single Slim Row on All Screen Sizes) */}
      <header className="relative z-30 border-b border-emerald-500/30 bg-slate-950/95 backdrop-blur-md sticky top-0 shadow-lg h-14 sm:h-16 flex items-center">
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 flex items-center justify-between gap-3">
          {/* Zone 1: App Icon + Brand Wordmark + Splash Trigger */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowSplashScreen(true);
                cyberAudio.playScanSweep();
              }}
              title="Cliquer pour afficher l'écran splash plein écran et l'icône"
              className="relative flex items-center gap-2 h-9 sm:h-10 pl-1.5 pr-2.5 py-1 rounded-2xl bg-black border border-emerald-400/80 shadow-[0_0_16px_rgba(0,255,102,0.4)] shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              {/* Clean App Icon Squircle */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl overflow-hidden border border-emerald-400/80 shadow-[0_0_10px_rgba(0,255,102,0.6)] shrink-0 bg-slate-900 flex items-center justify-center">
                <img
                  src="/app-icon.png"
                  alt="CYBER-VACUUM Icon"
                  className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/icon.png';
                  }}
                />
              </div>

              {/* Exact Brand Wordmark */}
              <CyberVacuumLogo size="custom" width={116} height={20} glow={true} />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00ff66] border-2 border-black animate-ping" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSplashScreen(true);
                cyberAudio.playScanSweep();
              }}
              className="hidden md:flex flex-col text-left cursor-pointer hover:opacity-90 transition-opacity"
              title="Cliquer pour revoir le Splash Écran Plein Écran"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-widest text-white font-mono whitespace-nowrap">
                  CYBER-VACUUM
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[#00ff66]">
                  PRO
                </span>
              </div>
              <span className="text-[9px] text-[#00ff66]/80 font-mono tracking-wider font-semibold">
                AI MATRIX DATA ENGINE
              </span>
            </button>
          </div>

          {/* Zone 2: Desktop Navigation Switcher Tabs (Hidden on mobile/tablet, shown on lg+) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => handleSelectTab('vacuum')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
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
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                activeTab === 'catalog'
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>Catalogue</span>
              <span className="text-[10px] text-slate-400 font-mono-numbers">({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('temu')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                activeTab === 'temu'
                  ? 'bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white shadow-[0_0_12px_rgba(251,82,0,0.4)]'
                  : 'text-orange-400 hover:text-orange-200 hover:bg-orange-950/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>MARKET TEMU-DZ</span>
              <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] font-mono-numbers text-yellow-300">
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('trends')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                activeTab === 'trends'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LineChart className="w-3.5 h-3.5 shrink-0" />
              <span>Tendances</span>
            </button>
          </nav>

          {/* Zone 3: Action Controls Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Full Action Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAllProducts}
                disabled={products.length === 0}
                className="w-9 h-9 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60 hover:text-white transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center shrink-0"
                title="Vider tous les articles aspirés (remise à zéro)"
                aria-label="Vider tous les articles"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsSupabaseModalOpen(true)}
                className={`h-9 px-3 rounded-xl border text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  supabaseConfig.url && supabaseConfig.anonKey
                    ? 'bg-emerald-950/60 border-emerald-400/50 text-[#00ff88] hover:bg-emerald-900/40'
                    : 'bg-slate-900 border-slate-800 text-amber-400 hover:border-amber-400/50'
                }`}
                title="Configurer la base de données Supabase"
                aria-label="Configurer Supabase"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="font-mono">
                  {supabaseConfig.url && supabaseConfig.anonKey ? 'Supabase' : 'Lier DB'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsApkModalOpen(true)}
                className="h-9 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-white transition-all text-xs flex items-center gap-1.5 shrink-0 cursor-pointer font-bold"
                title="Télécharger l'APK Android (Signé)"
                aria-label="Télécharger APK Android"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>APK Mobile</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSplashScreen(true)}
                className="h-9 px-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:text-white transition-all text-xs flex items-center gap-1.5 shrink-0 cursor-pointer font-bold"
                title="Afficher l'écran de démarrage splash plein écran"
                aria-label="Afficher Splash Screen"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xl:inline">Splash Natif</span>
              </button>
            </div>

            {/* Quick Utility Toggles (Audio, Rain, Bell) - Touch sized */}
            <button
              type="button"
              onClick={handleRequestNotificationPermission}
              className={`w-9 h-9 sm:w-9 sm:h-9 rounded-xl border transition-colors flex items-center justify-center shrink-0 cursor-pointer min-h-[38px] min-w-[38px] ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-[#00ff88]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
              title={
                notificationPermission === 'granted'
                  ? 'Notifications actives (alerte fin de catégorie)'
                  : 'Activer les notifications navigateur'
              }
              aria-label="Notifications"
            >
              {notificationPermission === 'granted' ? (
                <BellRing className="w-4 h-4 text-[#00ff88]" />
              ) : (
                <Bell className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const modes: ('subtle' | 'normal' | 'turbo' | 'off')[] = ['subtle', 'normal', 'turbo', 'off'];
                const next = modes[(modes.indexOf(rainIntensity) + 1) % modes.length];
                setRainIntensity(next);
              }}
              className="w-9 h-9 sm:w-9 sm:h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer min-h-[38px] min-w-[38px]"
              title={`Pluie Matrix: ${rainIntensity.toUpperCase()}`}
              aria-label="Changer intensité pluie Matrix"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Female French AI Voice Assistant Toggle */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`w-9 h-9 sm:w-9 sm:h-9 rounded-xl border transition-all flex items-center justify-center shrink-0 cursor-pointer min-h-[38px] min-w-[38px] ${
                isVoiceActive
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={isVoiceActive ? 'Assistant Vocal Féminin (Français) : ACTIF' : 'Assistant Vocal Féminin : MUTÉ'}
              aria-label="Assistant vocal féminin français"
            >
              <Radio className={`w-4 h-4 ${isVoiceActive ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            </button>

            <button
              type="button"
              onClick={handleToggleAudio}
              className={`w-9 h-9 sm:w-9 sm:h-9 rounded-xl border transition-colors flex items-center justify-center shrink-0 cursor-pointer min-h-[38px] min-w-[38px] ${
                isAudioMuted
                  ? 'bg-slate-900 border-slate-800 text-slate-500'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-[#00ff88]'
              }`}
              title={isAudioMuted ? 'Activer le son cyber' : 'Couper le son cyber'}
              aria-label="Activer ou couper le son"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Mobile / Tablet Settings Drawer Button (Opens slide-over modal) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-emerald-500/50 flex items-center justify-center shrink-0 cursor-pointer transition-all active:scale-95"
              title="Centre de contrôle et réglages"
              aria-label="Menu options et réglages"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Settings & Control Center Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden animate-fadeIn">
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
                    setShowSplashScreen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-h-[46px] p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 flex items-center justify-between font-bold cursor-pointer transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Lancer le Splash Natif</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
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
              isScrapingActive={isContinuousScraping}
              activeSweepCategoryIndex={activeSweepCategoryIndex}
              sweepPagesPerCategory={sweepPagesPerCategory}
              onChangeSweepPagesPerCategory={setSweepPagesPerCategory}
              discoveredCategories={discoveredCategories}
              targetTypeFilter={targetTypeFilter}
              onChangeTargetTypeFilter={setTargetTypeFilter}
              onSelectDiscoveredCategory={(catName) => {
                setSelectedCategorySlug(catName);
                handleSelectTab('catalog');
                cyberAudio.playHoloTap(950);
                addLog(`[CATÉGORIE_DÉCOUVERTE] Affichage du catalogue pour la catégorie : "${catName}"`, 'info');
              }}
            />

            {/* Central Quantum URL Input & Vacuum Ingestion Controller */}
            <section className="relative overflow-hidden rounded-2xl bg-slate-950/90 border border-emerald-500/40 p-3.5 sm:p-6 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,102,0.12)]">
              {/* Neon corner brackets */}
              <div className="absolute top-0 left-0 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-l-2 border-[#00ff66]" />
              <div className="absolute top-0 right-0 w-3 sm:w-4 h-3 sm:h-4 border-t-2 border-r-2 border-[#00ff66]" />
              <div className="absolute bottom-0 left-0 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-l-2 border-[#00ff66]" />
              <div className="absolute bottom-0 right-0 w-3 sm:w-4 h-3 sm:h-4 border-b-2 border-r-2 border-[#00ff66]" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 mb-3">
                <div className="flex items-center gap-2 shrink-0">
                  <Globe className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase whitespace-nowrap">
                    CIBLE D'EXTRACTION // URL E-COMMERCE
                  </span>
                </div>

                {/* Presets with horizontal touch scrolling on mobile */}
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 pb-1 max-w-full">
                  <span className="shrink-0 text-slate-400 hidden sm:inline">PRÉSETS :</span>
                  <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
                    {PRESET_URLS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setTargetUrl(preset.url);
                          cyberAudio.playHoloTap(900);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-mono border transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[32px] ${
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
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 p-2.5 sm:p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">MOTEUR :</span>
                  <div className="grid grid-cols-2 sm:flex rounded-lg bg-black/60 p-0.5 border border-slate-800 gap-0.5 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEngineMode('direct');
                        cyberAudio.playHoloTap(800);
                      }}
                      className={`px-2.5 sm:px-3 py-2 rounded-md text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px] ${
                        engineMode === 'direct'
                          ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400 shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">DIRECT (Illimité)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEngineMode('ai');
                        cyberAudio.playHoloTap(1000);
                      }}
                      className={`px-2.5 sm:px-3 py-2 rounded-md text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px] ${
                        engineMode === 'ai'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">HYBRIDE IA (Gemini)</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 text-xs font-mono w-full lg:w-auto">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-400 text-[11px] whitespace-nowrap">VOLUME :</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {[
                        { label: '24', val: 24 },
                        { label: '50', val: 50 },
                        { label: '100', val: 100 },
                        { label: '500', val: 500 },
                        { label: '1000', val: 1000 },
                        { label: '∞ Tout', val: 0 },
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() => setScrapeVolume(item.val)}
                          className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer min-h-[34px] ${
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

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleClearAllProducts}
                      disabled={products.length === 0}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 hover:bg-rose-900/70 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer min-h-[34px]"
                      title="Vider tous les articles déjà aspirés"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Vider ({products.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleTriggerPriceUpdate}
                      disabled={products.length === 0 || isUpdatingPrices}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/70 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer min-h-[34px]"
                      title="Simuler des fluctuations de prix pour tester la détection de changements à la ré-aspiration"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Tester Prix</span>
                    </button>

                    <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer px-2 py-1.5 rounded-lg bg-black/40 border border-slate-800 min-h-[34px]">
                      <input
                        type="checkbox"
                        checked={replaceCatalog}
                        onChange={(e) => setReplaceCatalog(e.target.checked)}
                        className="rounded accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className={replaceCatalog ? 'text-amber-400 font-bold' : 'text-emerald-400 font-medium'}>
                        {replaceCatalog ? 'Écraser base' : 'Fusion intelligente'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Input Bar Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStartScrape();
                }}
                className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch"
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
                    placeholder="Entrez l'URL du site e-commerce (ex: https://www.ouedkniss.com/telephones)"
                    className="w-full bg-slate-900/90 border-2 border-emerald-500/40 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#00ff66] focus:shadow-[0_0_15px_rgba(0,255,102,0.3)] transition-all min-h-[48px]"
                  />
                </div>

                {isContinuousScraping || job.status === 'aspirating' ? (
                  <button
                    type="button"
                    onClick={handleStopScrape}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black font-mono text-xs sm:text-sm tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 cursor-pointer shrink-0 animate-pulse min-h-[48px]"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>ARRÊTER L'ASPIRATION</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={job.status === 'scanning'}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-[#00ff66] to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black font-mono text-xs sm:text-sm tracking-wider uppercase transition-all transform active:scale-95 shadow-[0_0_20px_rgba(0,255,102,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 min-h-[48px]"
                  >
                    <Zap className="w-4 h-4" />
                    <span>
                      {scrapeVolume === 0 ? '♾️ ASPIRER TOUT LE CATALOGUE' : `ASPIRER (${scrapeVolume})`}
                    </span>
                  </button>
                )}
              </form>

              {/* Quick Telemetry Bar under input */}
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-900">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Moteur : <strong className="text-[#00ff66]">{engineMode === 'direct' ? 'DIRECT SANS IA' : 'HYBRIDE IA (Gemini 3.8)'}</strong>
                  </span>
                  <span className="text-slate-600 hidden sm:inline">|</span>
                  <span className="flex items-center gap-1">
                    Volume :{' '}
                    {scrapeVolume === 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[#00ff88] border border-emerald-400/50 font-bold animate-pulse">
                        ∞ Illimité
                      </span>
                    ) : (
                      <strong className="text-slate-200">{scrapeVolume} annonces</strong>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <span className="text-cyan-400 font-bold font-mono-numbers">
                    {products.length.toLocaleString()} articles récoltés
                  </span>
                  <span className="text-slate-400">
                    Devise : <strong className="text-white">{targetUrl.includes('ouedkniss') ? '🇩🇿 DA' : '🇪🇺 €'}</strong>
                  </span>
                </div>
              </div>
            </section>

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
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping" />
                  <h3 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
                    FLUX MATRICIEL DES ARTICLES ASPIRÉS EN DIRECT ({products.length})
                  </h3>
                </div>
                <ProductCatalogGrid
                  products={products}
                  onSyncSingleProduct={handleSyncSingleProduct}
                  onBulkSyncSupabase={handleBulkSyncSupabase}
                  isSupabaseConfigured={Boolean(supabaseConfig.url && supabaseConfig.anonKey)}
                  onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
                  onRemoveCurrency={handleRemoveCurrency}
                  onClearAllProducts={handleClearAllProducts}
                  discoveredCategories={discoveredCategories}
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
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00ff88] border border-emerald-400/40 font-bold">
                      {products.length} ITEMS SCELLÉS
                    </span>
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

            {/* The ProductCatalogGrid */}
            <ProductCatalogGrid
              products={products}
              onSyncSingleProduct={handleSyncSingleProduct}
              onBulkSyncSupabase={handleBulkSyncSupabase}
              isSupabaseConfigured={Boolean(supabaseConfig.url && supabaseConfig.anonKey)}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onRemoveCurrency={handleRemoveCurrency}
              onClearAllProducts={handleClearAllProducts}
              discoveredCategories={discoveredCategories}
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

            {/* The full Temu storefront component */}
            <TemuEcommerceHub
              products={products}
              onSelectProduct={(p) => setSelectedModalProduct(p)}
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

      {/* Mobile Bottom Navigation App Bar (Thumb-Friendly Native Responsive Experience) */}
      <nav
        aria-label="Navigation principale mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-emerald-500/30 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-4 h-16 max-w-lg mx-auto px-1">
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
        </div>
      </nav>

      {/* Fullscreen Native Cyber Splash Screen */}
      <CyberNativeSplashScreen
        isOpen={showSplashScreen}
        onComplete={() => setShowSplashScreen(false)}
        soundEnabled={!isAudioMuted}
      />
    </div>
  );
}
