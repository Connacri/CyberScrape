import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ScrapedProduct, SupabaseConfig } from '../types';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  Database,
  Code,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  Tag,
  Star,
  Copy,
  Check,
  X,
  Trash2,
  Layers,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  MapPin,
  Flame,
  Phone,
  PhoneCall,
  MessageCircle,
  Eye,
  ShieldCheck,
  BarChart3,
  Heart,
  Cloud,
  TrendingUp,
  Cpu,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { OUEDKNISS_CATEGORIES } from '../data/ouedknissCategories';
import { ALGERIA_69_WILAYAS } from '../data/algeriaWilayas';
import { ProductDetailModal } from './ProductDetailModal';
import { PriceRangeFilter, CatalogSortOption } from './PriceRangeFilter';
import { AdvancedCatalogFilterPanel, ProductCondition } from './AdvancedCatalogFilterPanel';
import { CategoryDistributionPieChart } from './CategoryDistributionPieChart';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ensureProductDetails,
  buildTelLink,
  buildWhatsAppLink,
  isOfficialStoreProduct,
} from '../utils/sellerGenerator';
import { getOuedknissOriginUrl } from '../utils/ouedknissUrls';
import { cyberAudio } from '../utils/cyberAudio';
import { LazyMatrixProductImage } from './LazyMatrixProductImage';
import { fetchProductsFromSupabase } from '../utils/supabaseClient';
import { matchCategory, matchSearchQuery } from '../utils/categoryMatcher';

interface ProductCatalogGridProps {
  products: ScrapedProduct[];
  onSyncSingleProduct: (product: ScrapedProduct) => Promise<void>;
  onBulkSyncSupabase: () => Promise<void>;
  onSendToSupabaseAndClearMemory?: () => Promise<void> | void;
  isSupabaseConfigured: boolean;
  onOpenSupabaseModal: () => void;
  onRemoveCurrency?: (currency: string) => void;
  onClearAllProducts?: () => void;
  onDeleteProduct?: (id: string) => void;
  discoveredCategories?: string[];
  supabaseConfig?: SupabaseConfig;
  refreshTrigger?: number;
}

const CHUNK_SIZE = 36; // 36 items per lazy-load chunk for buttery smooth 60fps

// Framer-Motion staggered animation variants for fluid wave fade-in during initial load or filtering
const catalogContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035, // 35ms wave progression between cards
      delayChildren: 0.02,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const catalogCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
    scale: 0.94,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 340,
      damping: 26,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: -10,
    transition: { duration: 0.18 },
  },
};

const catalogListRowVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -16,
    y: 6,
  },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 340,
      damping: 26,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: { duration: 0.16 },
  },
};

const catalogTableRowVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.14 },
  },
};

export function extractWilaya(product: ScrapedProduct): string {
  const raw =
    product.specs?.Wilaya ||
    product.seller?.wilaya ||
    product.specs?.['Région'] ||
    product.specs?.['Wilaya / Ville'] ||
    '';
  if (!raw) return 'Algérie (Centre)';
  const clean = raw.split(/[-/,]/)[0].trim();
  return clean || raw;
}

export function extractCondition(product: ScrapedProduct): 'neuf' | 'occasion' | 'reconditionne' {
  const specsStr = product.specs ? Object.entries(product.specs).map(([k, v]) => `${k}:${v}`).join(' ') : '';
  const raw = `${product.specs?.['État'] || ''} ${product.specs?.['Etat'] || ''} ${product.specs?.['Condition'] || ''} ${specsStr} ${product.title || ''} ${product.description || ''}`.toLowerCase();

  if (
    raw.includes('reconditionn') ||
    raw.includes('refurbished') ||
    raw.includes('remis à neuf')
  ) {
    return 'reconditionne';
  }

  if (
    raw.includes('neuf') ||
    raw.includes('scellé') ||
    raw.includes('scelle') ||
    raw.includes('sous blister') ||
    raw.includes('sous carton') ||
    raw.includes('sous emballage') ||
    raw.includes('non activé') ||
    raw.includes('non active') ||
    raw.includes('jamais utilisé') ||
    raw.includes('jamais utilise') ||
    raw.includes('jamais ouvert') ||
    raw.includes('00 km') ||
    raw.includes('0km') ||
    raw.includes('0 km') ||
    raw.includes('neuve')
  ) {
    return 'neuf';
  }

  return 'occasion';
}

export const ProductCatalogGrid: React.FC<ProductCatalogGridProps> = ({
  products,
  onSyncSingleProduct,
  onBulkSyncSupabase,
  onSendToSupabaseAndClearMemory,
  isSupabaseConfigured,
  onOpenSupabaseModal,
  onRemoveCurrency,
  onClearAllProducts,
  discoveredCategories = [],
  supabaseConfig,
  refreshTrigger,
}) => {
  // Source Mode: Supabase Cloud vs Local Cache (Defaults to Supabase if configured or if local RAM is empty)
  const [dataSourceMode, setDataSourceMode] = useState<'supabase' | 'local'>(() => {
    return isSupabaseConfigured ? 'supabase' : 'local';
  });

  const [cloudProducts, setCloudProducts] = useState<ScrapedProduct[]>([]);
  const [totalCloudCount, setTotalCloudCount] = useState<number>(0);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  // Direct fetch from Supabase Cloud
  const loadFromSupabase = useCallback(async () => {
    if (!supabaseConfig?.url || !supabaseConfig?.anonKey) return;
    setIsLoadingCloud(true);
    setCloudError(null);
    try {
      const res = await fetchProductsFromSupabase(supabaseConfig);
      if (res.success) {
        setCloudProducts(res.products);
        if (typeof res.totalCount === 'number' && res.totalCount > 0) {
          setTotalCloudCount(res.totalCount);
        }
      } else {
        setCloudError(res.error || 'Erreur lors de la lecture Supabase');
      }
    } catch (err: unknown) {
      setCloudError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setIsLoadingCloud(false);
    }
  }, [supabaseConfig]);

  useEffect(() => {
    if (isSupabaseConfigured && (dataSourceMode === 'supabase' || products.length === 0)) {
      loadFromSupabase();
    }
  }, [isSupabaseConfigured, dataSourceMode, refreshTrigger, loadFromSupabase, products.length]);

  // Active dataset: if in Supabase mode and cloud has items, use cloudProducts, otherwise fall back to products
  const activeProducts = useMemo(() => {
    if (dataSourceMode === 'supabase' && cloudProducts.length > 0) {
      return cloudProducts;
    }
    if (products && products.length > 0) {
      return products;
    }
    return cloudProducts;
  }, [dataSourceMode, products, cloudProducts]);

  const [searchTerm, setSearchTerm] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [sortBy, setSortBy] = useState<CatalogSortOption>('recent');
  const [onlyDiscounted, setOnlyDiscounted] = useState<boolean>(false);
  const [minDiscountPercent, setMinDiscountPercent] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'grouped' | 'table'>('grid');
  const [groupCriteria, setGroupCriteria] = useState<'category' | 'wilaya'>('category');
  const [inspectingProduct, setInspectingProduct] = useState<ScrapedProduct | null>(null);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<ScrapedProduct | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const [selectedItemType, setSelectedItemType] = useState<'all' | 'boutique' | 'annonce' | 'pub'>('all');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [selectedCondition, setSelectedCondition] = useState<ProductCondition>('all');
  const [showCategoryCharts, setShowCategoryCharts] = useState<boolean>(false);

  // Track incremental product arrivals for smooth Framer Motion entrance feedback
  const prevCountRef = useRef(products.length);
  const [recentArrivalsCount, setRecentArrivalsCount] = useState<number>(0);

  useEffect(() => {
    if (products.length > prevCountRef.current) {
      const diff = products.length - prevCountRef.current;
      setRecentArrivalsCount(diff);
      const timer = setTimeout(() => {
        setRecentArrivalsCount(0);
      }, 5000);
      prevCountRef.current = products.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = products.length;
  }, [products.length]);

  // Favorites state persisted in localStorage
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('cyber_vacuum_favorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? new Set(parsed) : new Set<string>();
      }
    } catch (err) {
      console.warn('Could not load favorites from localStorage', err);
    }
    return new Set<string>();
  });
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  const toggleFavorite = useCallback((productId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
        cyberAudio.playClick();
      } else {
        next.add(productId);
        cyberAudio.playCategoryUnlocked();
      }
      try {
        localStorage.setItem('cyber_vacuum_favorites', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.error('Failed to save favorites to localStorage', err);
      }
      return next;
    });
  }, []);

  const handleResetPriceFilter = useCallback(() => {
    setMinPrice('');
    setMaxPrice('');
  }, []);

  // Condition (Neuf / Occasion / Reconditionné) real-time distribution
  const conditionCounts = useMemo(() => {
    let neuf = 0;
    let occasion = 0;
    let reconditionne = 0;
    for (let i = 0; i < activeProducts.length; i++) {
      const c = extractCondition(activeProducts[i]);
      if (c === 'neuf') neuf++;
      else if (c === 'reconditionne') reconditionne++;
      else occasion++;
    }
    return { neuf, occasion, reconditionne, total: activeProducts.length };
  }, [activeProducts]);

  // Reset all advanced filters in one click
  const handleResetAllFilters = useCallback(() => {
    setSelectedWilaya('all');
    setSelectedCondition('all');
    setMinPrice('');
    setMaxPrice('');
    setSearchTerm('');
    setTitleFilter('');
    setSelectedCategory('all');
    setSortBy('recent');
    setSelectedItemType('all');
    setOnlyDiscounted(false);
    setOnlyFavorites(false);
  }, []);

  // Breakdown of Boutiques, Annonces and Pubs in catalog
  const typeCounts = useMemo(() => {
    let boutique = 0;
    let annonce = 0;
    let pub = 0;
    for (const p of activeProducts) {
      if (p.itemType === 'pub' || p.isSponsored) {
        pub++;
      } else if (isOfficialStoreProduct(p)) {
        boutique++;
      } else {
        annonce++;
      }
    }
    return { boutique, annonce, pub, total: activeProducts.length };
  }, [activeProducts]);

  // Lazy loading state
  const [visibleCount, setVisibleCount] = useState<number>(CHUNK_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Scroll listener for jump-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset visibleCount whenever filters change
  useEffect(() => {
    setVisibleCount(CHUNK_SIZE);
  }, [searchTerm, titleFilter, selectedCategory, selectedWilaya, selectedCurrency, sortBy, minPrice, maxPrice, selectedItemType, onlyFavorites, dataSourceMode, selectedCondition]);


  // Overall dataset min/max price for the range filter slider bounds
  const datasetPriceStats = useMemo(() => {
    if (activeProducts.length === 0) return { min: 0, max: 0 };
    let min = Infinity;
    let max = 0;
    for (const p of activeProducts) {
      if (p.currentPrice < min) min = p.currentPrice;
      if (p.currentPrice > max) max = p.currentPrice;
    }
    return {
      min: min === Infinity ? 0 : min,
      max,
    };
  }, [activeProducts]);

  // Wilaya map with counts
  const wilayaStats = useMemo(() => {
    const map = new Map<string, number>();
    activeProducts.forEach((p) => {
      const w = extractWilaya(p);
      if (w) {
        map.set(w, (map.get(w) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [activeProducts]);

  // Category map with count & price analytics
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; minPrice: number; maxPrice: number; totalSum: number }>();

    activeProducts.forEach((p) => {
      const cat = p.category || 'Général';
      const existing = map.get(cat);
      if (!existing) {
        map.set(cat, {
          count: 1,
          minPrice: p.currentPrice,
          maxPrice: p.currentPrice,
          totalSum: p.currentPrice,
        });
      } else {
        existing.count += 1;
        existing.minPrice = Math.min(existing.minPrice, p.currentPrice);
        existing.maxPrice = Math.max(existing.maxPrice, p.currentPrice);
        existing.totalSum += p.currentPrice;
      }
    });

    return Array.from(map.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      minPrice: stats.minPrice,
      maxPrice: stats.maxPrice,
      avgPrice: Math.round(stats.totalSum / stats.count),
    }));
  }, [activeProducts]);

  // Filtered and sorted products with real-time title filtering
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const titleTerm = titleFilter.trim().toLowerCase();

    return activeProducts
      .filter((p) => {
        // Direct real-time title filter
        const matchesTitle = !titleTerm || p.title.toLowerCase().includes(titleTerm);

        // Broad keyword filter with multi-token diacritic-insensitive search
        const matchesSearch = !term || matchSearchQuery(p, term);

        const matchesCategory =
          selectedCategory === 'all' ||
          matchCategory(p.category, selectedCategory, p.title, p.brand, p.specs);
        const matchesWilaya = selectedWilaya === 'all' || extractWilaya(p).toLowerCase() === selectedWilaya.toLowerCase();
        const matchesCurrency = selectedCurrency === 'all' || p.currency === selectedCurrency;
        const matchesMinPrice = minPrice === '' || p.currentPrice >= Number(minPrice);
        const matchesMaxPrice = maxPrice === '' || p.currentPrice <= Number(maxPrice);
        const matchesDiscount =
          !onlyDiscounted || (p.discountPercent !== undefined && p.discountPercent > 0 && p.discountPercent >= minDiscountPercent);

        const isPub = p.itemType === 'pub' || p.isSponsored;
        const isBoutique = isOfficialStoreProduct(p);
        const isAnnonce = !isPub && !isBoutique;

        const matchesItemType =
          selectedItemType === 'all' ||
          (selectedItemType === 'pub' && isPub) ||
          (selectedItemType === 'boutique' && isBoutique) ||
          (selectedItemType === 'annonce' && isAnnonce);

        const matchesFavorites = !onlyFavorites || favorites.has(p.id);

        const productCondition = extractCondition(p);
        const matchesCondition =
          selectedCondition === 'all' || productCondition === selectedCondition;

        return (
          matchesTitle &&
          matchesSearch &&
          matchesCategory &&
          matchesWilaya &&
          matchesCurrency &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesDiscount &&
          matchesItemType &&
          matchesFavorites &&
          matchesCondition
        );
      })

      .sort((a, b) => {
        // 1. Tri par date de mise à jour
        if (sortBy === 'updated_desc') {
          const dateA = new Date(a.lastUpdated || a.scrapedAt).getTime();
          const dateB = new Date(b.lastUpdated || b.scrapedAt).getTime();
          return dateB - dateA;
        }
        if (sortBy === 'updated_asc') {
          const dateA = new Date(a.lastUpdated || a.scrapedAt).getTime();
          const dateB = new Date(b.lastUpdated || b.scrapedAt).getTime();
          return dateA - dateB;
        }

        // 2. Tri par réduction %
        if (sortBy === 'discount' || sortBy === 'discount_desc') {
          return (b.discountPercent || 0) - (a.discountPercent || 0);
        }
        if (sortBy === 'discount_asc') {
          return (a.discountPercent || 0) - (b.discountPercent || 0);
        }

        // 3. Tris par Wilaya
        if (sortBy === 'wilaya_asc') {
          return extractWilaya(a).localeCompare(extractWilaya(b), 'fr');
        }
        if (sortBy === 'wilaya_desc') {
          return extractWilaya(b).localeCompare(extractWilaya(a), 'fr');
        }

        // 4. Tris par Catégorie
        if (sortBy === 'category_asc') {
          return (a.category || '').localeCompare(b.category || '', 'fr');
        }
        if (sortBy === 'category_desc') {
          return (b.category || '').localeCompare(a.category || '', 'fr');
        }

        // 5. Tris par Prix
        if (sortBy === 'price_asc') return a.currentPrice - b.currentPrice;
        if (sortBy === 'price_desc') return b.currentPrice - a.currentPrice;

        // 6. Tris par État (Neuf d'abord ou Occasion d'abord)
        if (sortBy === 'condition_neuf_first') {
          const condOrder: Record<string, number> = { neuf: 0, reconditionne: 1, occasion: 2 };
          return (condOrder[extractCondition(a)] ?? 2) - (condOrder[extractCondition(b)] ?? 2);
        }
        if (sortBy === 'condition_occ_first') {
          const condOrder: Record<string, number> = { occasion: 0, reconditionne: 1, neuf: 2 };
          return (condOrder[extractCondition(a)] ?? 2) - (condOrder[extractCondition(b)] ?? 2);
        }

        // 7. Tri par date d'aspiration
        if (sortBy === 'oldest') {
          return new Date(a.scrapedAt).getTime() - new Date(b.scrapedAt).getTime();
        }
        return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
      });
  }, [activeProducts, searchTerm, titleFilter, selectedCategory, selectedWilaya, selectedCurrency, sortBy, minPrice, maxPrice, onlyDiscounted, minDiscountPercent, selectedItemType, onlyFavorites, favorites, selectedCondition]);

  // Grouped products for "Vue Groupée" (either by Category or by Wilaya)
  const groupedProducts = useMemo(() => {
    const groups: Record<string, ScrapedProduct[]> = {};
    filteredProducts.forEach((p) => {
      const key = groupCriteria === 'category' ? p.category || 'Non classé' : extractWilaya(p) || 'Algérie';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filteredProducts, groupCriteria]);

  // High-performance Pagination & Stream state (Prevents mobile freeze with 5000+ items)
  const [displayMode, setDisplayMode] = useState<'paged' | 'stream'>('paged');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(36);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(CHUNK_SIZE);
  }, [searchTerm, titleFilter, selectedCategory, selectedWilaya, selectedCurrency, sortBy, minPrice, maxPrice, selectedItemType, onlyDiscounted, onlyFavorites]);

  // Sliced products for virtual / paged rendering
  const displayedProducts = useMemo(() => {
    if (displayMode === 'paged') {
      const start = (currentPage - 1) * pageSize;
      return filteredProducts.slice(start, start + pageSize);
    }
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, displayMode, currentPage, pageSize, visibleCount]);

  // Key to trigger staggered fade-in wave animations on initial load & whenever filters/sort/search change
  const filterTransitionKey = useMemo(() => {
    return [
      selectedCategory,
      selectedWilaya,
      selectedCurrency,
      selectedItemType,
      sortBy,
      currentPage,
      minPrice,
      maxPrice,
      onlyDiscounted,
      minDiscountPercent,
      onlyFavorites,
      searchTerm.trim(),
      titleFilter.trim(),
      displayMode,
    ].join('|');
  }, [
    selectedCategory,
    selectedWilaya,
    selectedCurrency,
    selectedItemType,
    sortBy,
    currentPage,
    minPrice,
    maxPrice,
    onlyDiscounted,
    minDiscountPercent,
    onlyFavorites,
    searchTerm,
    titleFilter,
    displayMode,
  ]);

  // IntersectionObserver for buttery smooth infinite scrolling (active in stream mode)
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (displayMode === 'stream' && target.isIntersecting && visibleCount < filteredProducts.length) {
        setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredProducts.length));
      }
    },
    [displayMode, visibleCount, filteredProducts.length]
  );

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '350px', // Pre-fetch next chunk 350px before reaching bottom
      threshold: 0.1,
    };
    const observer = new IntersectionObserver(handleObserver, option);
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [handleObserver]);

  // Format Dinar Price cleanly with spacing (e.g. 215 000 DA)
  const formatPrice = (val: number, cur: string) => {
    if (cur === 'DA') {
      return `${Math.round(val).toLocaleString('fr-FR')} DA`;
    }
    return `${val.toFixed(2)} ${cur}`;
  };

  const handleSyncProduct = async (product: ScrapedProduct) => {
    if (!isSupabaseConfigured) {
      onOpenSupabaseModal();
      return;
    }
    setSyncingId(product.id);
    try {
      await onSyncSingleProduct(product);
    } finally {
      setSyncingId(null);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ouedkniss_scraped_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = (itemsToExport: ScrapedProduct[] = products) => {
    const headers = [
      'id',
      'title',
      'brand',
      'category',
      'current_price',
      'original_price',
      'currency',
      'discount_percent',
      'wilaya',
      'rating',
      'reviews_count',
      'in_stock',
      'product_url',
      'scraped_at',
    ];
    const rows = itemsToExport.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.brand || ''}"`,
      `"${p.category}"`,
      p.currentPrice,
      p.originalPrice,
      p.currency,
      p.discountPercent,
      `"${p.specs?.Wilaya || ''}"`,
      p.rating,
      p.reviewsCount,
      p.inStock,
      p.productUrl,
      p.scrapedAt,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `ouedkniss_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = (product: ScrapedProduct) => {
    navigator.clipboard.writeText(JSON.stringify(product, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const toggleCategoryCollapse = (catName: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catName]: !prev[catName],
    }));
  };

  const hasEuros = products.some((p) => p.currency === '€');
  const isAllLoaded = visibleCount >= filteredProducts.length;

  const renderPaginationControls = () => {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 my-3 rounded-2xl bg-slate-950/90 border border-emerald-500/30 font-mono text-xs text-slate-300 shadow-md backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[#00ff88] font-bold text-xs flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
            {displayMode === 'paged' ? `Page ${currentPage} sur ${totalPages}` : `${visibleCount} sur ${filteredProducts.length}`}
          </span>
          <span className="hidden sm:inline-block text-slate-400 text-xs">
            ({filteredProducts.length.toLocaleString('fr-DZ')} annonces filtrées)
          </span>
        </div>

        {displayMode === 'paged' && totalPages > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setCurrentPage(1);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:border-emerald-500/50 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed text-[11px]"
              title="Première page"
            >
              « Début
            </button>
            <button
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:border-emerald-500/50 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed text-[11px]"
              title="Page précédente"
            >
              ‹ Précédent
            </button>

            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-[#00ff88] font-bold text-xs min-w-[36px] text-center">
              {currentPage}
            </span>

            <button
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:border-emerald-500/50 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed text-[11px]"
              title="Page suivante"
            >
              Suivant ›
            </button>
            <button
              onClick={() => {
                setCurrentPage(totalPages);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 hover:border-emerald-500/50 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed text-[11px]"
              title="Dernière page"
            >
              Fin »
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-900 p-1 border border-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setDisplayMode('paged')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                displayMode === 'paged'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mode pages légères (Recommandé : zéro freeze sur mobile)"
            >
              📑 Pages (Fluide)
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('stream')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                displayMode === 'stream'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mode flux continu"
            >
              🌊 Flux Continu
            </button>
          </div>

          {displayMode === 'paged' && (
            <div className="flex items-center gap-1.5">
              <span className="hidden md:inline text-slate-500 text-[11px]">Par page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono focus:border-emerald-500 outline-none cursor-pointer"
              >
                <option value={24}>24</option>
                <option value={36}>36</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* 0. DATA SOURCE SELECTOR & RAM OPTIMIZATION CONTROLLER         */}
      {/* ============================================================== */}
      <div className="p-3 sm:p-4 rounded-3xl bg-slate-950/95 border-2 border-emerald-500/50 shadow-[0_0_35px_rgba(0,255,102,0.18)] backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-[#00ff88]">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  SOURCE D'AFFICHAGE DES LISTES & GRIDS :
                </span>
                <div className="text-xs font-mono font-black text-white flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${dataSourceMode === 'supabase' ? 'bg-[#00ff88] animate-ping' : 'bg-cyan-400'}`} />
                  {dataSourceMode === 'supabase' ? '🟢 SUPABASE CLOUD DATABASE (Direct DB)' : '💾 MÉMOIRE VIVE RAM LOCALE'}
                </div>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setDataSourceMode('supabase');
                  loadFromSupabase();
                  cyberAudio.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dataSourceMode === 'supabase'
                    ? 'bg-gradient-to-r from-emerald-500 via-[#00ff88] to-cyan-400 text-slate-950 font-black shadow-[0_0_15px_rgba(0,255,102,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Supabase Cloud ({(totalCloudCount || cloudProducts.length).toLocaleString('fr-FR')})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDataSourceMode('local');
                  cyberAudio.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  dataSourceMode === 'local'
                    ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Cache RAM ({products.length})</span>
              </button>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {dataSourceMode === 'supabase' && (
              <button
                type="button"
                onClick={loadFromSupabase}
                disabled={isLoadingCloud}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Recharger les derniers articles depuis Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloud ? 'animate-spin' : ''}`} />
                <span>{isLoadingCloud ? 'Chargement...' : 'Actualiser Supabase'}</span>
              </button>
            )}

            {onSendToSupabaseAndClearMemory && products.length > 0 && (
              <button
                type="button"
                onClick={onSendToSupabaseAndClearMemory}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/25 to-[#00ff88]/20 border border-emerald-400 text-[#00ff88] hover:bg-emerald-500/35 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.25)] transition-all"
                title="Transférer tous les articles vers Supabase et vider la RAM du téléphone"
              >
                <Zap className="w-3.5 h-3.5 fill-[#00ff88]" />
                <span>Sync Supabase & Vider RAM ({products.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Informational memory status hint */}
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold">💡 Allègement Webpage :</span>
            <span>
              {dataSourceMode === 'supabase'
                ? 'Les listes sont chargées directement depuis Supabase Cloud. Zéro freeze ni blocage sur smartphone.'
                : products.length >= 3500
                ? '⚠️ Attention : RAM locale chargée (>3500 art.). Cliquez sur "Sync & Vider RAM" pour maintenir 60 FPS.'
                : 'Articles stockés en mémoire locale temporaire.'}
            </span>
          </div>

          <div className="text-[10px] text-cyan-300">
            {dataSourceMode === 'supabase' ? `Table: ${supabaseConfig?.tableName || 'scraped_products'} (${(totalCloudCount || cloudProducts.length).toLocaleString('fr-FR')} articles)` : `RAM: ${products.length} articles`}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 0.5 LARGE IMPACT METRICS & COUNTERS DECK (CLAIRES ET GRANDES) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* 1. Total Annonces */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-emerald-500/40 shadow-[0_0_20px_rgba(0,255,102,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Total Annonces</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#00ff88] mt-1.5 tracking-tight drop-shadow-sm">
            {dataSourceMode === 'supabase'
              ? (totalCloudCount || cloudProducts.length).toLocaleString('fr-FR')
              : activeProducts.length.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${dataSourceMode === 'supabase' ? 'bg-[#00ff88]' : 'bg-cyan-400'}`} />
            <span>
              {dataSourceMode === 'supabase'
                ? `Supabase Cloud (${cloudProducts.length} chargés)`
                : 'Mémoire RAM'}
            </span>
          </div>
        </div>

        {/* 2. Boutiques Pro */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Boutiques Pro</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 mt-1.5 tracking-tight">
            {typeCounts.boutique.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Stores Certifiés</div>
        </div>

        {/* 3. Particuliers */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Particuliers</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-1.5 tracking-tight">
            {typeCounts.annonce.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Vendeurs directs</div>
        </div>

        {/* 4. Wilayas Couvertes */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Wilayas</span>
            <MapPin className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-purple-300 mt-1.5 tracking-tight">
            {wilayaStats.length} <span className="text-xs font-normal text-slate-400">/ 58</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Couverture DZ</div>
        </div>

        {/* 5. Prix Moyen Panier */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Prix Moyen</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-emerald-300 mt-2 truncate">
            {activeProducts.length > 0
              ? `${Math.round(activeProducts.reduce((acc, p) => acc + (p.currentPrice || 0), 0) / activeProducts.length).toLocaleString('fr-FR')} DA`
              : '0 DA'}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Moyenne marché</div>
        </div>

        {/* 6. Statut RAM Mobile */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border ${
            products.length >= 4000
              ? 'bg-rose-950/40 border-rose-500/70 text-rose-300'
              : products.length >= 2500
              ? 'bg-amber-950/40 border-amber-500/70 text-amber-300'
              : 'bg-slate-900/95 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Mémoire RAM</span>
            <Cpu className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono mt-2 truncate">
            {products.length === 0 ? '🟢 0 Mo' : `${products.length.toLocaleString('fr-FR')} art.`}
          </div>
          <div className="text-[10px] font-mono mt-1">
            {products.length === 0 ? 'Allégé (60 FPS)' : products.length >= 4000 ? '⚠️ Saturation' : 'Modéré'}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CATEGORY LISTS & TABS MATRIX BAR (Horizontal Pills) */}
      {/* ============================================================== */}
      <div className="p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/30 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase">
              LISTES PAR CATÉGORIES // {categoryStats.length} CATÉGORIES DANS LA BASE
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            TOTAL : <strong className="text-[#00ff88]">{activeProducts.length.toLocaleString()}</strong> ARTICLES SCELLÉS
          </div>
        </div>

        {/* Category Pills List */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-emerald-500/20">
          {/* "Toutes" Pill */}
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-emerald-500/30 to-green-500/20 text-[#00ff88] border border-emerald-400 shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            🌟 TOUTES LES CATÉGORIES
            <span className="ml-1 px-1.5 py-0.2 rounded-md bg-black/60 text-[10px] text-emerald-300 border border-emerald-500/30">
              {activeProducts.length.toLocaleString()}
            </span>
          </button>

          {/* Each Individual Category Pill */}
          {categoryStats.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            const isDiscovered = discoveredCategories.includes(cat.name);
            return (
              <button
                type="button"
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)] font-bold'
                    : isDiscovered
                    ? 'bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:border-purple-400'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {isDiscovered && <span className="text-amber-400 font-bold">⚡</span>}
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-400/40'
                      : isDiscovered
                      ? 'bg-purple-900/60 text-purple-200 border border-purple-400/30'
                      : 'bg-black/60 text-slate-400'
                  }`}
                >
                  {cat.count.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Category Stats snippet when a category is selected */}
        {selectedCategory !== 'all' && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
            {(() => {
              const active = categoryStats.find((c) => c.name === selectedCategory);
              if (!active) return null;
              return (
                <>
                  <div className="flex items-center gap-3">
                    <span>
                      PRIX MOYEN : <strong className="text-[#00ff88]">{active.avgPrice.toLocaleString('fr-FR')} DA</strong>
                    </span>
                    <span>
                      FOURCHETTE : {active.minPrice.toLocaleString('fr-FR')} DA — {active.maxPrice.toLocaleString('fr-FR')} DA
                    </span>
                  </div>
                  <button
                    onClick={() => handleExportCsv(filteredProducts)}
                    className="text-cyan-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Exporter {active.name} ({active.count} art.)
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {/* Type Distinction Filter Tabs: Boutiques, Annonces de Particuliers, Pubs */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 font-bold flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-400" />
              TYPE :
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedItemType('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedItemType === 'all'
                    ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                🌟 Tous ({activeProducts.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemType('boutique')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedItemType === 'boutique'
                    ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400 shadow-[0_0_10px_rgba(0,255,102,0.3)]'
                    : 'bg-slate-900/60 text-emerald-400/80 hover:text-emerald-300 border border-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                🏪 Boutiques ({typeCounts.boutique})
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemType('annonce')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedItemType === 'annonce'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                    : 'bg-slate-900/60 text-cyan-400/80 hover:text-cyan-300 border border-slate-800'
                }`}
              >
                👤 Annonces ({typeCounts.annonce})
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemType('pub')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedItemType === 'pub'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-900/60 text-amber-400/80 hover:text-amber-300 border border-slate-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                📢 Pubs ({typeCounts.pub})
              </button>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            {filteredProducts.length} article{filteredProducts.length > 1 ? 's' : ''} filtré{filteredProducts.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. SEARCH, SORT & VIEW MODE CONTROLLER BAR                     */}
      {/* ============================================================== */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/85 border border-emerald-500/30 backdrop-blur-md space-y-3">

        {/* Row 1: Search Inputs Stack (Responsive: 1-col on mobile, 2-col on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {/* Direct Title Filter */}
          <div className="relative">
            <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
            <input
              type="text"
              placeholder="⚡ Filtrer par titre (Golf 8, S24, Clio 4...)"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="w-full bg-slate-900/90 border border-emerald-500/40 rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-[#00ff88] placeholder-slate-500 focus:outline-none focus:border-emerald-300 focus:ring-1 focus:ring-emerald-400/30 transition-all font-semibold min-h-[38px]"
            />
            {titleFilter && (
              <button
                type="button"
                onClick={() => setTitleFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                title="Effacer le filtre"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Broad Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Recherche générale : wilaya, specs, vendeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-7 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors min-h-[38px]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Select Filters (Wilaya, Devise, Tri) - Clean Responsive 3-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
          {/* Wilaya Filter */}
          <div className="relative flex items-center font-mono text-xs w-full">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 absolute left-3 pointer-events-none shrink-0" />
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              aria-label="Filtrer par Wilaya"
              className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl pl-8 pr-3 py-2 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 cursor-pointer min-h-[40px]"
            >
              <option value="all">📍 69 Wilayas (Toutes)</option>
              {ALGERIA_69_WILAYAS.map((w) => {
                const matched = wilayaStats.find((s) => s.name.toLowerCase().includes(w.name.toLowerCase()));
                const count = matched?.count || 0;
                return (
                  <option key={w.codeStr} value={w.name}>
                    {w.codeStr} - {w.name} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Currency Filter */}
          <div className="relative flex items-center font-mono text-xs w-full">
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              aria-label="Filtrer par devise"
              className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 min-h-[40px] cursor-pointer"
            >
              <option value="all">💰 Devise: Toutes ({products.length})</option>
              <option value="DA">🇩🇿 En Dinars (DA)</option>
              <option value="€">🇪🇺 En Euros (€)</option>
            </select>
          </div>

          {/* Sort Select with All Advanced Sorts */}
          <div className="relative flex items-center font-mono text-xs w-full sm:col-span-2 lg:col-span-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 absolute left-3 pointer-events-none shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value as CatalogSortOption;
                setSortBy(val);
                cyberAudio.playClick();
                const optionText = e.target.options[e.target.selectedIndex].text.replace(/^[^\w\u00C0-\u017F]+/, '');
                cyberAudio.speakSortApplied(optionText);
              }}
              aria-label="Trier les produits"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-400 cursor-pointer min-h-[40px]"
            >
              <option value="recent">⚡ Aspiration: Plus récents</option>
              <option value="oldest">⚡ Aspiration: Plus anciens</option>
              <option value="updated_desc">📅 Date MàJ: Plus récentes d'abord</option>
              <option value="updated_asc">📅 Date MàJ: Plus anciennes d'abord</option>
              <option value="discount">🔥 Réduction %: Plus forte remise</option>
              <option value="discount_asc">🔥 Réduction %: Plus faible remise</option>
              <option value="price_asc">💰 Prix: Moins cher d'abord</option>
              <option value="price_desc">💰 Prix: Plus cher d'abord</option>
              <option value="wilaya_asc">📍 Wilaya: Alphabétique (A → Z)</option>
              <option value="wilaya_desc">📍 Wilaya: Inverse (Z → A)</option>
              <option value="category_asc">🏷️ Catégorie: (A → Z)</option>
              <option value="category_desc">🏷️ Catégorie: (Z → A)</option>
            </select>
          </div>
        </div>

        {/* Row 3: View Mode Segmented Controls & Action Buttons (Mobile-first Wrap) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80">
          {/* View Mode Toggle: Compact icons on mobile, labels on desktop */}
          <div className="grid grid-cols-4 sm:flex items-center rounded-xl bg-black/60 p-0.5 border border-slate-800 font-mono text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[38px] ${
                viewMode === 'grid'
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400/50 font-bold shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Grille</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[38px] ${
                viewMode === 'list'
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400/50 font-bold shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue Liste"
            >
              <List className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Liste</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('grouped');
                setGroupCriteria('category');
              }}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[38px] ${
                viewMode === 'grouped' && groupCriteria === 'category'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue Groupée par Catégorie"
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Catégories</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('grouped');
                setGroupCriteria('wilaya');
              }}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[38px] ${
                viewMode === 'grouped' && groupCriteria === 'wilaya'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue Groupée par Wilaya"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Wilayas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`hidden sm:flex p-2 sm:px-3 sm:py-1.5 rounded-lg items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[38px] ${
                viewMode === 'table'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Vue Table Haute Densité"
            >
              <List className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Table</span>
            </button>
          </div>

          {/* Action Buttons: Export & Sync (Clean wrap on mobile without squishing) */}
          <div className="flex flex-wrap items-center justify-start sm:justify-end gap-1.5 font-mono text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleExportCsv(filteredProducts)}
              disabled={products.length === 0}
              className="flex-1 sm:flex-none min-w-[72px] px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer min-h-[38px]"
              title="Exporter les résultats en CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              disabled={products.length === 0}
              className="flex-1 sm:flex-none min-w-[72px] px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer min-h-[38px]"
              title="Exporter les résultats en JSON"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span>JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCategoryCharts(!showCategoryCharts)}
              className={`flex-1 sm:flex-none min-w-[110px] px-2.5 sm:px-3 py-2 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all cursor-pointer min-h-[38px] ${
                showCategoryCharts
                  ? 'bg-purple-950/60 border-purple-400 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-900 border-slate-800 text-purple-400 hover:text-purple-300 hover:border-purple-400/50'
              }`}
              title="Afficher/masquer les graphiques récapitulatifs Recharts par catégorie"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>{showCategoryCharts ? 'Masquer' : 'Graphiques Recharts'}</span>
            </button>

            <button
              type="button"
              onClick={onBulkSyncSupabase}
              disabled={products.length === 0}
              className="flex-1 sm:flex-none min-w-[90px] px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-[#00ff88] hover:bg-emerald-500/30 flex items-center justify-center gap-1.5 font-bold transition-all disabled:opacity-40 cursor-pointer min-h-[38px]"
              title="Synchroniser le catalogue complet sur Supabase"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sync DB</span>
            </button>

            {onSendToSupabaseAndClearMemory && (
              <button
                type="button"
                onClick={onSendToSupabaseAndClearMemory}
                disabled={products.length === 0}
                className="flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-[#00ff88] text-slate-950 font-black text-xs hover:brightness-110 shadow-[0_0_20px_rgba(0,255,102,0.4)] flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer min-h-[38px]"
                title="Envoyer tous les articles aspirés vers Supabase et vider la mémoire vive de la page pour l'alléger"
              >
                <Cloud className="w-4 h-4 fill-slate-950 text-slate-950 shrink-0" />
                <span className="whitespace-nowrap">Envoyer à Supabase & Vider la mémoire</span>
              </button>
            )}

            {onClearAllProducts && (
              <button
                type="button"
                onClick={onClearAllProducts}
                disabled={products.length === 0}
                className="w-10 h-10 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0 min-h-[38px]"
                title="Vider tous les articles déjà aspirés"
                aria-label="Vider les articles"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2.4 PANNEAU DE FILTRES AVANCÉ // WILAYA • PRIX • ÉTAT         */}
      {/* ============================================================== */}
      <AdvancedCatalogFilterPanel
        selectedWilaya={selectedWilaya}
        onWilayaChange={setSelectedWilaya}
        wilayaStats={wilayaStats}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        datasetMinPrice={datasetPriceStats.min}
        datasetMaxPrice={datasetPriceStats.max}
        selectedCurrency={selectedCurrency}
        selectedCondition={selectedCondition}
        onConditionChange={setSelectedCondition}
        conditionCounts={conditionCounts}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        totalProductsCount={activeProducts.length}
        filteredCount={filteredProducts.length}
        onResetAllFilters={handleResetAllFilters}
      />

      {/* ============================================================== */}
      {/* 2.5 PRICE RANGE, DISCOUNT & BUDGET FILTER CONTROLLER           */}
      {/* ============================================================== */}
      <PriceRangeFilter
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        selectedCurrency={selectedCurrency}
        datasetMinPrice={datasetPriceStats.min}
        datasetMaxPrice={datasetPriceStats.max}
        totalProductsCount={products.length}
        filteredCount={filteredProducts.length}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onResetPriceFilter={handleResetPriceFilter}
        onlyDiscounted={onlyDiscounted}
        onToggleOnlyDiscounted={() => setOnlyDiscounted(!onlyDiscounted)}
        minDiscountPercent={minDiscountPercent}
        onChangeMinDiscountPercent={setMinDiscountPercent}
      />

      {/* ============================================================== */}
      {/* 2.6 RECHARTS SUMMARY CATEGORY CHARTS (DISTRIBUTION & PRIX)    */}
      {/* ============================================================== */}
      {showCategoryCharts && (
        <div className="animate-fadeIn">
          <CategoryDistributionPieChart
            products={products}
            selectedCategory={selectedCategory !== 'all' ? selectedCategory : null}
            onSelectCategory={(catName) => setSelectedCategory(catName)}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TELEMETRY BAR & LAZY BUFFER COUNTER */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 px-1 py-1">
        <div className="flex items-center gap-2">
          <span>
            AFFICHAGE : <strong className="text-[#00ff88]">{Math.min(visibleCount, filteredProducts.length)}</strong> / {filteredProducts.length} ARTICLES (FLUX LAZY 60 FPS)
          </span>
          {!isAllLoaded && viewMode === 'grid' && (
            <button
              onClick={() => setVisibleCount(filteredProducts.length)}
              className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 text-[10px] transition-all cursor-pointer"
            >
              ⚡ Tout charger d'un coup ({filteredProducts.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span>
            BASE: {isSupabaseConfigured ? '🟢 SUPABASE CLOUD' : '🟡 LOCAL STORAGE ILLIMITÉ'}
          </span>
        </div>
      </div>

      {/* Pagination Top Toolbar */}
      {renderPaginationControls()}

      {/* Incremental Ingestion Banner with Fluid Framer-Motion Transitions */}
      <AnimatePresence>
        {recentArrivalsCount > 0 && (
          <motion.div
            layout
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.25 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="mb-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-950/90 via-slate-900/90 to-cyan-950/90 border border-emerald-400/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shadow-[0_0_25px_rgba(0,255,102,0.2)]"
          >
            <div className="flex items-center gap-2.5 text-[#00ff88] font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>+{recentArrivalsCount} NOUVEAUX ARTICLES INTÉGRÉS EN DIRECT</span>
            </div>
            <div className="flex items-center gap-2 text-cyan-300 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>Animations fluides Framer Motion • Disposition 60 FPS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* 4. MAIN PRODUCT DISPLAY: GRID / GROUPED / TABLE */}
      {/* ============================================================== */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 font-mono text-xs text-slate-400 space-y-3">
          <p className="text-slate-300">
            Aucun article ne correspond à vos filtres actuels ou à la fourchette de prix sélectionnée.
          </p>
          {(minPrice !== '' || maxPrice !== '') && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetPriceFilter}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/80 font-mono text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              >
                <X className="w-3.5 h-3.5" />
                <span>
                  Réinitialiser le filtre budget (
                  {minPrice !== '' ? `${Number(minPrice).toLocaleString('fr-FR')} ${selectedCurrency === '€' ? '€' : 'DA'}` : '0'} —{' '}
                  {maxPrice !== '' ? `${Number(maxPrice).toLocaleString('fr-FR')} ${selectedCurrency === '€' ? '€' : 'DA'}` : 'Max'}
                  )
                </span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grouped' ? (
        /* ============================================================ */
        /* VUE GROUPÉE PAR CATÉGORIE (Dossiers Accordéons)              */
        /* ============================================================ */
        <div className="space-y-4">
          {Object.entries(groupedProducts).map(([catName, catItems]) => {
            const isCollapsed = collapsedCategories[catName];
            return (
              <div
                key={catName}
                className="rounded-2xl bg-slate-950/80 border border-slate-800/80 overflow-hidden backdrop-blur-md"
              >
                {/* Dossier Header */}
                <div
                  onClick={() => toggleCategoryCollapse(catName)}
                  className="p-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                        groupCriteria === 'wilaya'
                          ? 'bg-amber-500/15 border border-amber-400/40 text-amber-300'
                          : 'bg-emerald-500/15 border border-emerald-400/40 text-[#00ff88]'
                      }`}
                    >
                      {groupCriteria === 'wilaya' ? (
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        catName.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-mono text-sm font-bold text-slate-100 flex items-center gap-2">
                        {groupCriteria === 'wilaya' ? `Wilaya : ${catName}` : catName}
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            groupCriteria === 'wilaya'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-emerald-500/20 text-[#00ff88] border-emerald-500/30'
                          }`}
                        >
                          {catItems.length} annonces
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportCsv(catItems);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1"
                    >
                      <Download className="w-3 h-3 text-cyan-400" /> Export CSV
                    </button>
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Dossier Items Grid with Staggered Fade-In */}
                {!isCollapsed && (
                  <motion.div
                    key={`${catName}_${filterTransitionKey}`}
                    variants={catalogContainerVariants}
                    initial="hidden"
                    animate="show"
                    className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5"
                  >
                    <AnimatePresence mode="popLayout">
                      {catItems.map((product, index) => renderProductCard(product, index))}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* ============================================================ */
        /* VUE TABLE HAUTE DENSITÉ                                      */
        /* ============================================================ */
        <div className="rounded-2xl bg-slate-950/90 border border-slate-800 overflow-hidden font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Réf / Image</th>
                  <th className="p-3">Titre & Catégorie</th>
                  <th className="p-3">Prix Actuel</th>
                  <th className="p-3">Rabais</th>
                  <th className="p-3">Wilaya & Specs</th>
                  <th className="p-3">Vendeur & Contact Direct</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <motion.tbody
                key={filterTransitionKey}
                variants={catalogContainerVariants}
                initial="hidden"
                animate="show"
                className="divide-y divide-slate-900"
              >
                <AnimatePresence mode="popLayout">
                  {displayedProducts.map((p, index) => {
                    const det = ensureProductDetails(p);
                    const seller = det.seller!;
                    const tel = buildTelLink(seller);
                    const wa = buildWhatsAppLink(seller, det);

                    const isRecentlyScraped = (() => {
                      if (!p.scrapedAt) return false;
                      const diff = Date.now() - new Date(p.scrapedAt).getTime();
                      return diff >= 0 && diff < 60000;
                    })();

                    return (
                      <motion.tr
                        key={p.id}
                        layout
                        variants={catalogTableRowVariants}
                        className={`transition-colors cursor-pointer group ${
                          isRecentlyScraped
                            ? 'bg-emerald-950/25 hover:bg-emerald-950/45'
                            : 'hover:bg-slate-900/40'
                        }`}
                        onClick={() => setSelectedDetailProduct(det)}
                      >
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 shrink-0 rounded overflow-hidden border border-slate-800 group-hover:border-emerald-500/50 transition-colors">
                              <LazyMatrixProductImage
                                src={p.imageUrl}
                                alt={p.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[10px] text-cyan-400 font-mono">
                              {p.matrixHash || p.id.slice(-6)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-200 line-clamp-1 max-w-[240px] group-hover:text-emerald-300 transition-colors">
                            {p.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-500">{p.category}</span>
                            {p.brand && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-semibold" title={`Marque : ${p.brand}`}>
                                {p.brand}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap font-bold text-[#00ff88]">
                          {formatPrice(p.currentPrice, p.currency)}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {p.discountPercent > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                              -{p.discountPercent}%
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-400 text-[10px] max-w-[170px] truncate">
                          {p.specs?.Wilaya ? (
                            <span className="text-emerald-300 font-semibold">{p.specs.Wilaya}</span>
                          ) : (
                            Object.entries(p.specs || {})
                              .slice(0, 2)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' | ') || 'N/A'
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            <div className="text-[11px] font-bold text-slate-200 truncate max-w-[175px] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="truncate">{seller.name}</span>
                              {isOfficialStoreProduct(p) && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#00ff88] border border-emerald-400/50 text-[9px] font-bold inline-flex items-center gap-0.5 shrink-0" title="Store Certifié / Boutique Officielle">
                                  <ShieldCheck className="w-2.5 h-2.5 text-[#00ff88]" />
                                  Pro
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a
                                href={tel}
                                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                title={`Appeler directement : ${seller.phone}`}
                              >
                                <PhoneCall className="w-2.5 h-2.5 text-emerald-400" />
                                <span>{seller.phone}</span>
                              </a>
                              <a
                                href={wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/40 text-[10px] cursor-pointer transition-colors"
                                title="Contacter sur WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`flex items-center gap-1 ${p.inStock ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            {p.inStock ? 'Dispo' : 'Rupture'}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedDetailProduct(det)}
                              className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:text-white hover:bg-emerald-900/60 flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-colors"
                              title="Voir l'annonce complète et ses détails"
                            >
                              <Eye className="w-3 h-3 text-emerald-400" />
                              <span>Détails</span>
                            </button>
                            <button
                              onClick={() => setInspectingProduct(p)}
                              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 hover:text-white hover:border-cyan-400 cursor-pointer"
                              title="Inspecter Matrix"
                            >
                              <Code className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={getOuedknissOriginUrl(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-400 cursor-pointer"
                              title="Voir l'annonce source ou la recherche active sur Ouedkniss"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </motion.tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        /* ============================================================ */
        /* VUE LISTE COMPACTE & ERGONOMIQUE                             */
        /* ============================================================ */
        <motion.div
          key={filterTransitionKey}
          variants={catalogContainerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {displayedProducts.map((product, index) => renderProductListRow(product, index))}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* ============================================================ */
        /* VUE GRILLE LAZY INFINIE OPTIMISÉE 60 FPS                     */
        /* ============================================================ */
        <motion.div
          key={filterTransitionKey}
          variants={catalogContainerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {displayedProducts.map((product, index) => renderProductCard(product, index))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ============================================================== */}
      {/* 5. LAZY LOADING SENTINEL OBSERVER & END OF STREAM INDICATOR    */}
      {/* ============================================================== */}
      {(viewMode === 'grid' || viewMode === 'list' || viewMode === 'table') && (
        <div ref={sentinelRef} className="py-6 flex flex-col items-center justify-center">
          {!isAllLoaded ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/80 border border-emerald-500/30 font-mono text-xs text-emerald-300 backdrop-blur-md animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>
                CHARGEMENT DU FLUX MATRICIEL... ({visibleCount} / {filteredProducts.length} AFFICHÉS)
              </span>
            </div>
          ) : (
            filteredProducts.length > 0 && (
              <div className="flex items-center gap-2 text-slate-500 font-mono text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>FIN DU FLUX MATRICIEL // TOUS LES {filteredProducts.length} ARTICLES CHARGÉS</span>
              </div>
            )
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. JUMP TO TOP FLOATING BUTTON                                 */}
      {/* ============================================================== */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-emerald-500 text-black shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:bg-emerald-400 transition-all cursor-pointer"
          title="Remonter en haut de page"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* ============================================================== */}
      {/* 7. MATRIX DNA INSPECTION MODAL                                 */}
      {/* ============================================================== */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-950 border border-emerald-500/40 p-5 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Code className="w-4 h-4" />
                <span>INSPECTION ADN MATRICIEL // {inspectingProduct.id}</span>
              </div>
              <button
                onClick={() => setInspectingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="truncate max-w-[420px]">
                  Titre : <strong className="text-slate-200">{inspectingProduct.title}</strong>
                </span>
                <button
                  onClick={() => handleCopyJson(inspectingProduct)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 hover:border-emerald-400 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedJson ? 'Copié !' : 'Copier JSON'}
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-3 rounded-xl bg-black/80 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono leading-relaxed select-text">
                <pre>{JSON.stringify(inspectingProduct, null, 2)}</pre>
              </div>

              {inspectingProduct.specs && Object.keys(inspectingProduct.specs).length > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block mb-1.5 font-bold">
                    Spécifications & Attributs DOM Extraits :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(inspectingProduct.specs).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                        <strong className="text-emerald-400">{k}:</strong> {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end gap-2">
              <button
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. PRODUCT DETAIL & CONTACT MODAL (FULL ANNOUNCEMENT VIEW)     */}
      {/* ============================================================== */}
      {selectedDetailProduct && (
        <ProductDetailModal
          product={selectedDetailProduct}
          onClose={() => setSelectedDetailProduct(null)}
          onInspectJson={(p) => setInspectingProduct(p)}
          onSyncSupabase={handleSyncProduct}
          isSyncingSupabase={syncingId === selectedDetailProduct.id}
        />
      )}
    </div>
  );

  // Helper function to render a product card with fluid fade and slide transition
  function renderProductCard(product: ScrapedProduct, index: number = 0) {
    const det = ensureProductDetails(product);
    const seller = det.seller!;
    const tel = buildTelLink(seller);
    const wa = buildWhatsAppLink(seller, det);
    const originUrl = getOuedknissOriginUrl(det);

    const hasDiscount = det.discountPercent > 0;
    const isSyncing = syncingId === det.id;
    const wilaya = seller.wilaya || det.specs?.Wilaya;

    // Stagger delay based on position for a progressive wave fade-in
    const staggerDelay = Math.min((index % 12) * 0.035, 0.35);

    const isRecentlyScraped = (() => {
      if (!det.scrapedAt) return false;
      const diff = Date.now() - new Date(det.scrapedAt).getTime();
      return diff >= 0 && diff < 60000;
    })();

    return (
      <motion.div
        key={det.id}
        layout
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: -10, transition: { duration: 0.18 } }}
        transition={{
          layout: {
            type: 'spring',
            stiffness: 340,
            damping: 28,
            mass: 0.8,
          },
          opacity: { duration: 0.3, delay: staggerDelay },
          y: { type: 'spring', stiffness: 320, damping: 25, delay: staggerDelay },
          scale: { duration: 0.26, delay: staggerDelay },
        }}
        whileHover={{
          y: -4,
          transition: { duration: 0.2, ease: 'easeOut' },
        }}
        onClick={() => setSelectedDetailProduct(det)}
        className={`group relative rounded-2xl bg-slate-950/90 border p-3.5 flex flex-col justify-between overflow-hidden cursor-pointer transition-colors duration-200 ${
          isRecentlyScraped
            ? 'border-emerald-400/80 shadow-[0_0_22px_rgba(0,255,102,0.22)]'
            : 'border-slate-800/80 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(0,255,102,0.18)]'
        }`}
      >
        {/* Cyber corner accents */}
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500/30 group-hover:border-emerald-400 transition-colors" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500/30 group-hover:border-emerald-400 transition-colors" />

        <div>
          {/* Image container */}
          <div className="relative aspect-square w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden mb-3">
            <LazyMatrixProductImage
              src={det.imageUrl}
              alt={det.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600/90 text-white font-mono font-bold text-[10px] tracking-wider border border-rose-400/50 shadow-md">
                -{det.discountPercent}%
              </div>
            )}

            {/* Wilaya badge if present */}
            {wilaya && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const cleanW = extractWilaya(product);
                  setSelectedWilaya(cleanW);
                }}
                className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/85 text-[#00ff88] font-mono text-[9px] border border-emerald-500/40 flex items-center gap-1 backdrop-blur-sm truncate max-w-[150px] hover:border-emerald-300 hover:bg-emerald-950/80 cursor-pointer"
                title={`Filtrer instantanément par la Wilaya : ${wilaya}`}
              >
                <MapPin className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                <span className="truncate">{wilaya}</span>
              </div>
            )}

            {/* Ouedkniss live link button on image */}
            <a
              href={originUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/85 hover:bg-emerald-600/90 text-slate-200 hover:text-white font-mono text-[9px] border border-slate-700 hover:border-emerald-400 flex items-center gap-1 backdrop-blur-sm transition-all cursor-pointer z-10 shadow-md"
              title="Ouvrir directement sur Ouedkniss.com sans erreur 404"
            >
              <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
              <span>Ouedkniss</span>
            </a>

            {/* AI Confidence badge */}
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 text-cyan-300 font-mono text-[9px] border border-cyan-500/30 flex items-center gap-1 backdrop-blur-sm">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              {det.aiConfidence}%
            </div>
          </div>

          {/* Classification & Arrival Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5 min-w-0">
            {isRecentlyScraped && (
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/25 text-[#00ff88] border border-emerald-400/60 text-[9px] font-mono font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(0,255,102,0.3)] animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                NOUVEAU
              </span>
            )}
            {det.itemType === 'pub' || det.isSponsored ? (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/60 text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm shrink-0">
                <Flame className="w-2.5 h-2.5 text-amber-400" />
                📢 PUB SPONSORISÉE
              </span>
            ) : det.itemType === 'boutique' || det.isOfficialStore || seller.type !== 'Particulier' ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-[#00ff88] border border-emerald-400/60 text-[9px] font-mono font-bold flex items-center gap-1 shadow-sm shrink-0">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                🏪 BOUTIQUE CERTIFIÉE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 text-[9px] font-mono font-bold flex items-center gap-1 shrink-0">
                👤 ANNONCE PARTICULIER
              </span>
            )}
          </div>

          {/* Title & Category tag */}
          <div className="space-y-1 mb-2 min-w-0">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider truncate flex items-center gap-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
              <span className="truncate">{det.category || det.brand}</span>
            </div>
            <h3 className="font-mono text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-emerald-300 transition-colors leading-snug break-words">
              {det.title}
            </h3>
          </div>


          {/* Price Section */}
          <div className="flex flex-wrap items-baseline gap-1.5 mb-2 min-w-0">
            <span className="text-sm sm:text-base font-black font-mono text-[#00ff66] truncate">
              {formatPrice(det.currentPrice, det.currency)}
            </span>
            {hasDiscount && (
              <span className="text-xs line-through text-slate-500 font-mono truncate">
                {formatPrice(det.originalPrice, det.currency)}
              </span>
            )}
          </div>

          {/* Publisher Identity Badge (Who published it) */}
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-2.5 space-y-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between text-[10px] font-mono gap-1">
              <span className="text-slate-400 truncate flex items-center gap-1 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <strong className="text-slate-200 truncate">{seller.name}</strong>
              </span>
              <span className="text-emerald-400 font-bold shrink-0 text-[9px]">✓ Vérifié</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 gap-1">
              <span className="truncate">{seller.type}</span>
              <span className="text-cyan-400 shrink-0">{seller.responseTime}</span>
            </div>
          </div>

          {/* Stock & Rating info */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3 pt-1 border-t border-slate-900 min-w-0">
            <span className={`flex items-center gap-1 truncate ${det.inStock ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${det.inStock ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="truncate">{det.inStock ? 'En stock' : 'Rupture'}</span>
            </span>
            {det.rating > 0 && (
              <span className="flex items-center gap-1 text-amber-400 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 shrink-0" />
                {det.rating.toFixed(1)} ({det.reviewsCount})
              </span>
            )}
          </div>
        </div>

        {/* Card Action Buttons with 1-Click Call & 1-Click WhatsApp */}
        <div className="space-y-1.5 pt-2 border-t border-slate-900 font-mono text-xs" onClick={(e) => e.stopPropagation()}>
          {/* 1-CLICK CALL BUTTON: Direct click dials phone */}
          <a
            href={tel}
            className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00ff66] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.25)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer min-w-0 overflow-hidden"
            title={`Appeler directement : ${seller.phone}`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-slate-950 animate-pulse shrink-0" />
            <span className="truncate">Appel : {seller.phone}</span>
          </a>

          {/* Secondary Action Row: WhatsApp + Full Details + Ouedkniss Live */}
          <div className="grid grid-cols-3 gap-1.5 min-w-0">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-1 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center gap-1 text-[11px] font-bold transition-colors cursor-pointer min-w-0 truncate"
              title="Contacter sur WhatsApp"
            >
              <MessageCircle className="w-3 h-3 shrink-0" /> <span className="truncate">WhatsApp</span>
            </a>

            <button
              onClick={() => setSelectedDetailProduct(det)}
              className="py-1.5 px-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 hover:text-white flex items-center justify-center gap-1 text-[11px] font-bold transition-colors cursor-pointer min-w-0 truncate"
              title="Voir l'annonce complète et ses détails"
            >
              <Eye className="w-3 h-3 text-emerald-400 shrink-0" /> <span className="truncate">Détails</span>
            </button>

            <a
              href={originUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-slate-200 hover:text-white flex items-center justify-center gap-1 text-[11px] font-bold transition-colors cursor-pointer min-w-0 truncate"
              title="Ouvrir directement sur Ouedkniss.com sans 404"
            >
              <ExternalLink className="w-3 h-3 text-emerald-400 shrink-0" /> <span className="truncate">Ouedkniss</span>
            </a>
          </div>

          {/* Technical Options Row: Matrix & Supabase */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <button
              onClick={() => setInspectingProduct(det)}
              className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 flex items-center justify-center gap-1 text-[10px] transition-colors cursor-pointer"
              title="Inspecter ADN Matrix"
            >
              <Code className="w-2.5 h-2.5 text-cyan-400" /> Matrix
            </button>

            <button
              onClick={() => handleSyncProduct(det)}
              disabled={isSyncing}
              className={`py-1 px-2 rounded-md border flex items-center justify-center gap-1 text-[10px] transition-all cursor-pointer ${
                det.syncedToSupabase
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-[#00ff88]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30'
              }`}
            >
              <Database className="w-2.5 h-2.5" />
              {isSyncing ? '...' : det.syncedToSupabase ? 'Sync ✓' : 'Supabase'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Helper function to render a product in compact, ergonomic list row format with fluid Framer-Motion transitions
  function renderProductListRow(product: ScrapedProduct, index: number = 0) {
    const det = ensureProductDetails(product);
    const seller = det.seller!;
    const tel = buildTelLink(seller);
    const wa = buildWhatsAppLink(seller, det);
    const originUrl = getOuedknissOriginUrl(det);

    const hasDiscount = det.discountPercent > 0;
    const isSyncing = syncingId === det.id;
    const wilaya = seller.wilaya || det.specs?.Wilaya;
    const staggerDelay = Math.min((index % 12) * 0.03, 0.3);

    const isRecentlyScraped = (() => {
      if (!det.scrapedAt) return false;
      const diff = Date.now() - new Date(det.scrapedAt).getTime();
      return diff >= 0 && diff < 60000;
    })();

    return (
      <motion.div
        key={det.id}
        layout
        initial={{ opacity: 0, x: -14, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: 14, transition: { duration: 0.16 } }}
        transition={{
          layout: {
            type: 'spring',
            stiffness: 340,
            damping: 28,
            mass: 0.8,
          },
          opacity: { duration: 0.28, delay: staggerDelay },
          x: { type: 'spring', stiffness: 320, damping: 25, delay: staggerDelay },
        }}
        whileHover={{
          x: 3,
          transition: { duration: 0.18, ease: 'easeOut' },
        }}
        onClick={() => setSelectedDetailProduct(det)}
        className={`group relative rounded-2xl bg-slate-950/90 border p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 cursor-pointer transition-colors duration-200 ${
          isRecentlyScraped
            ? 'border-emerald-400/80 shadow-[0_0_20px_rgba(0,255,102,0.2)]'
            : 'border-slate-800/80 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(0,255,102,0.15)]'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          {/* Square Image Thumbnail */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <LazyMatrixProductImage
              src={det.imageUrl}
              alt={det.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {hasDiscount && (
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-rose-600/90 text-white font-mono font-bold text-[9px] border border-rose-400/40">
                -{det.discountPercent}%
              </div>
            )}
            <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-cyan-300 font-mono text-[8px] border border-cyan-500/30">
              {det.aiConfidence}% IA
            </div>
          </div>

          {/* Details & Specs */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
              {isRecentlyScraped && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/25 text-[#00ff88] border border-emerald-400/60 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(0,255,102,0.3)] animate-pulse shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  NOUVEAU
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30 font-bold truncate max-w-[160px]">
                {det.category || det.brand}
              </span>
              {wilaya && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWilaya(extractWilaya(product));
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 hover:border-emerald-300 cursor-pointer"
                  title="Filtrer par cette wilaya"
                >
                  <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="truncate max-w-[130px]">{wilaya}</span>
                </span>
              )}
              <span className={`flex items-center gap-1 font-bold ${det.inStock ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${det.inStock ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                {det.inStock ? 'En stock' : 'Rupture'}
              </span>
            </div>

            <h3 className="font-mono text-sm font-bold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
              {det.title}
            </h3>

            {/* Specs Tags */}
            {det.specs && Object.keys(det.specs).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {Object.entries(det.specs)
                  .filter(([k]) => k !== 'Wilaya')
                  .slice(0, 3)
                  .map(([k, v]) => (
                    <span key={k} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">
                      <strong className="text-emerald-400/80">{k}:</strong> {v}
                    </span>
                  ))}
              </div>
            )}

            {/* Seller Info */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 pt-0.5">
              <span className="flex items-center gap-1 text-slate-300 font-semibold truncate max-w-[150px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                {seller.name}
              </span>
              {isOfficialStoreProduct(product) && (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-[#00ff88] border border-emerald-400/50 text-[9px] font-bold flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-2.5 h-2.5 text-[#00ff88]" /> Store Officiel
                </span>
              )}
              <span>•</span>
              <span className="text-slate-500">{seller.type}</span>
              <span>•</span>
              <span className="text-cyan-400">{seller.responseTime}</span>
            </div>
          </div>
        </div>

        {/* Price & Actions Row */}
        <div
          className="flex flex-col sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-900 pt-2 sm:pt-0 sm:pl-4 min-w-[200px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Price */}
          <div className="text-left sm:text-right space-y-0.5">
            <div className="text-lg font-black font-mono text-[#00ff66]">
              {formatPrice(det.currentPrice, det.currency)}
            </div>
            {hasDiscount && (
              <div className="text-xs line-through text-slate-500 font-mono">
                {formatPrice(det.originalPrice, det.currency)}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs w-full sm:w-auto">
            <a
              href={tel}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title={`Appeler directement : ${seller.phone}`}
            >
              <PhoneCall className="w-3 h-3 text-slate-950 animate-pulse" />
              <span>{seller.phone}</span>
            </a>

            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Contacter sur WhatsApp"
            >
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>

            <a
              href={originUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              title="Ouvrir sur Ouedkniss.com directement sans 404"
            >
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>

            <button
              onClick={() => setSelectedDetailProduct(det)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
};
