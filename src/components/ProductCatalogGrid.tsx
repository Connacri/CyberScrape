import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ScrapedProduct } from '../types';
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
} from 'lucide-react';
import { OUEDKNISS_CATEGORIES } from '../data/ouedknissCategories';
import { ProductDetailModal } from './ProductDetailModal';
import {
  ensureProductDetails,
  buildTelLink,
  buildWhatsAppLink,
} from '../utils/sellerGenerator';

interface ProductCatalogGridProps {
  products: ScrapedProduct[];
  onSyncSingleProduct: (product: ScrapedProduct) => Promise<void>;
  onBulkSyncSupabase: () => Promise<void>;
  isSupabaseConfigured: boolean;
  onOpenSupabaseModal: () => void;
  onRemoveCurrency?: (currency: string) => void;
  onClearAllProducts?: () => void;
}

const CHUNK_SIZE = 36; // 36 items per lazy-load chunk for buttery smooth 60fps

export const ProductCatalogGrid: React.FC<ProductCatalogGridProps> = ({
  products,
  onSyncSingleProduct,
  onBulkSyncSupabase,
  isSupabaseConfigured,
  onOpenSupabaseModal,
  onRemoveCurrency,
  onClearAllProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'discount' | 'recent'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'grouped' | 'table'>('grid');
  const [inspectingProduct, setInspectingProduct] = useState<ScrapedProduct | null>(null);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<ScrapedProduct | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

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
  }, [searchTerm, selectedCategory, selectedCurrency, sortBy]);

  // Category map with count & price analytics
  const categoryStats = useMemo(() => {
    const map = new Map<string, { count: number; minPrice: number; maxPrice: number; totalSum: number }>();

    products.forEach((p) => {
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
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products
      .filter((p) => {
        const matchesSearch =
          !term ||
          p.title.toLowerCase().includes(term) ||
          (p.brand && p.brand.toLowerCase().includes(term)) ||
          p.sourceDomain.toLowerCase().includes(term) ||
          (p.specs && Object.values(p.specs).some((val) => String(val).toLowerCase().includes(term)));

        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesCurrency = selectedCurrency === 'all' || p.currency === selectedCurrency;

        return matchesSearch && matchesCategory && matchesCurrency;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.currentPrice - b.currentPrice;
        if (sortBy === 'price_desc') return b.currentPrice - a.currentPrice;
        if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
        return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
      });
  }, [products, searchTerm, selectedCategory, selectedCurrency, sortBy]);

  // Grouped products for "Vue Groupée par Catégories"
  const groupedProducts = useMemo(() => {
    const groups: Record<string, ScrapedProduct[]> = {};
    filteredProducts.forEach((p) => {
      const cat = p.category || 'Non classé';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [filteredProducts]);

  // Sliced products for virtual / lazy rendering
  const lazyProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // IntersectionObserver for buttery smooth infinite scrolling
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && visibleCount < filteredProducts.length) {
        setVisibleCount((prev) => Math.min(prev + CHUNK_SIZE, filteredProducts.length));
      }
    },
    [visibleCount, filteredProducts.length]
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

  return (
    <div className="space-y-4">
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
            TOTAL : <strong className="text-[#00ff88]">{products.length}</strong> ARTICLES SCELLÉS
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
              {products.length}
            </span>
          </button>

          {/* Each Individual Category Pill */}
          {categoryStats.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                type="button"
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.3)] font-bold'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                    isSelected
                      ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-400/40'
                      : 'bg-black/60 text-slate-400'
                  }`}
                >
                  {cat.count}
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
      </div>

      {/* ============================================================== */}
      {/* 2. SEARCH, SORT & VIEW MODE CONTROLLER BAR */}
      {/* ============================================================== */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Search input with wilaya & specs detection */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Recherche instantanée : Alger, Oran, iPhone, Clio, PS5, F4, Kouba..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>

        {/* Currency filter selector */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            aria-label="Filtrer par devise"
            className="bg-slate-900 border border-emerald-500/30 rounded-lg px-2.5 py-2 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
          >
            <option value="all">Toutes Devises ({products.length})</option>
            <option value="DA">🇩🇿 En Dinars (DA) uniquement</option>
            <option value="€">🇪🇺 En Euros (€) uniquement</option>
          </select>
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Trier les produits"
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-400"
          >
            <option value="recent">Plus Récents (Page par Page)</option>
            <option value="price_asc">Prix Croissant</option>
            <option value="price_desc">Prix Décroissant</option>
            <option value="discount">Meilleur Rabais %</option>
          </select>
        </div>

        {/* View Mode Toggle: Grid vs Grouped vs Table */}
        <div className="flex items-center rounded-lg bg-black/60 p-0.5 border border-slate-800 font-mono text-xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-2.5 py-1.5 rounded flex items-center gap-1 transition-all ${
              viewMode === 'grid'
                ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400/50 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Vue Grille Infinie Lazy"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grille
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grouped')}
            className={`px-2.5 py-1.5 rounded flex items-center gap-1 transition-all ${
              viewMode === 'grouped'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Vue Groupée par Dossiers de Catégories"
          >
            <Layers className="w-3.5 h-3.5" /> Par Catégorie
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1.5 rounded flex items-center gap-1 transition-all ${
              viewMode === 'table'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Table Haute Densité"
          >
            <List className="w-3.5 h-3.5" /> Table
          </button>
        </div>

        {/* Action Buttons: Purge, Vider, Export, Sync */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {hasEuros && onRemoveCurrency && (
            <button
              onClick={() => onRemoveCurrency('€')}
              className="px-2 py-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 font-mono text-xs flex items-center gap-1 transition-all"
              title="Supprimer les anciens articles de démo en Euros"
            >
              Purger €
            </button>
          )}

          {onClearAllProducts && (
            <button
              onClick={onClearAllProducts}
              disabled={products.length === 0}
              className="px-2.5 py-2 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-400 hover:bg-rose-900/60 hover:text-rose-200 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
              title="Vider tous les articles déjà aspirés"
            >
              <Trash2 className="w-3.5 h-3.5" /> Vider tout
            </button>
          )}

          <button
            onClick={() => handleExportCsv(filteredProducts)}
            disabled={products.length === 0}
            className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>

          <button
            onClick={handleExportJson}
            disabled={products.length === 0}
            className="px-2 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" /> JSON
          </button>

          <button
            onClick={onBulkSyncSupabase}
            disabled={products.length === 0}
            className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[#00ff88] hover:bg-emerald-500/30 flex items-center gap-1.5 font-bold transition-all disabled:opacity-40 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" /> Sync Supabase
          </button>
        </div>
      </div>

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

      {/* ============================================================== */}
      {/* 4. MAIN PRODUCT DISPLAY: GRID / GROUPED / TABLE */}
      {/* ============================================================== */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 font-mono text-xs text-slate-500">
          Aucun produit ne correspond à vos filtres actuels. Modifiez la recherche ou lancez une nouvelle aspiration.
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
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-[#00ff88] text-xs font-mono font-bold">
                      {catName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-mono text-sm font-bold text-slate-100 flex items-center gap-2">
                        {catName}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-[#00ff88] border border-emerald-500/30">
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

                {/* Dossier Items Grid */}
                {!isCollapsed && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {catItems.map((product) => renderProductCard(product))}
                  </div>
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
              <tbody className="divide-y divide-slate-900">
                {lazyProducts.map((p) => {
                  const det = ensureProductDetails(p);
                  const seller = det.seller!;
                  const tel = buildTelLink(seller);
                  const wa = buildWhatsAppLink(seller, det);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-900/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedDetailProduct(det)}
                    >
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={p.imageUrl}
                            alt={p.title}
                            className="w-10 h-10 object-cover rounded bg-slate-900 border border-slate-800 group-hover:border-emerald-500/50 transition-colors"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60';
                            }}
                          />
                          <span className="text-[10px] text-cyan-400 font-mono">
                            {p.matrixHash || p.id.slice(-6)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-200 line-clamp-1 max-w-[240px] group-hover:text-emerald-300 transition-colors">
                          {p.title}
                        </div>
                        <div className="text-[10px] text-slate-500">{p.category}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap font-bold text-[#00ff66]">
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
                          <div className="text-[11px] font-bold text-slate-200 truncate max-w-[150px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate">{seller.name}</span>
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
                            href={p.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-400 cursor-pointer"
                            title="Voir l'annonce source sur Ouedkniss"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* VUE GRILLE LAZY INFINIE OPTIMISÉE 60 FPS                     */
        /* ============================================================ */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {lazyProducts.map((product) => renderProductCard(product))}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. LAZY LOADING SENTINEL OBSERVER & END OF STREAM INDICATOR    */}
      {/* ============================================================== */}
      {viewMode === 'grid' && (
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

  // Helper function to render a product card
  function renderProductCard(product: ScrapedProduct) {
    const det = ensureProductDetails(product);
    const seller = det.seller!;
    const tel = buildTelLink(seller);
    const wa = buildWhatsAppLink(seller, det);

    const hasDiscount = det.discountPercent > 0;
    const isSyncing = syncingId === det.id;
    const wilaya = seller.wilaya || det.specs?.Wilaya;

    return (
      <div
        key={det.id}
        onClick={() => setSelectedDetailProduct(det)}
        className="group relative rounded-2xl bg-slate-950/90 border border-slate-800/80 hover:border-emerald-500/50 p-3.5 transition-all duration-300 flex flex-col justify-between hover:shadow-[0_0_25px_rgba(0,255,102,0.18)] overflow-hidden cursor-pointer"
      >
        {/* Cyber corner accents */}
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500/30 group-hover:border-emerald-400 transition-colors" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500/30 group-hover:border-emerald-400 transition-colors" />

        <div>
          {/* Image container */}
          <div className="relative aspect-square w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden mb-3">
            <img
              src={det.imageUrl}
              alt={det.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
              }}
            />

            {/* Discount badge */}
            {hasDiscount && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600/90 text-white font-mono font-bold text-[10px] tracking-wider border border-rose-400/50 shadow-md">
                -{det.discountPercent}%
              </div>
            )}

            {/* Wilaya badge if present */}
            {wilaya && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/85 text-[#00ff88] font-mono text-[9px] border border-emerald-500/40 flex items-center gap-1 backdrop-blur-sm truncate max-w-[150px]">
                <MapPin className="w-2.5 h-2.5 shrink-0 text-emerald-400" />
                <span className="truncate">{wilaya}</span>
              </div>
            )}

            {/* AI Confidence badge */}
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 text-cyan-300 font-mono text-[9px] border border-cyan-500/30 flex items-center gap-1 backdrop-blur-sm">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              {det.aiConfidence}%
            </div>
          </div>

          {/* Title & Category tag */}
          <div className="space-y-1 mb-2">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              {det.category || det.brand}
            </div>
            <h3 className="font-mono text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-emerald-300 transition-colors leading-snug">
              {det.title}
            </h3>
          </div>

          {/* Price Section */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-base font-black font-mono text-[#00ff66]">
              {formatPrice(det.currentPrice, det.currency)}
            </span>
            {hasDiscount && (
              <span className="text-xs line-through text-slate-500 font-mono">
                {formatPrice(det.originalPrice, det.currency)}
              </span>
            )}
          </div>

          {/* Publisher Identity Badge (Who published it) */}
          <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-2.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-slate-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                <strong className="text-slate-200 truncate">{seller.name}</strong>
              </span>
              <span className="text-emerald-400 font-bold shrink-0">✓ Vérifié</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
              <span className="truncate">{seller.type}</span>
              <span className="text-cyan-400 shrink-0">{seller.responseTime}</span>
            </div>
          </div>

          {/* Stock & Rating info */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3 pt-1 border-t border-slate-900">
            <span className={`flex items-center gap-1 ${det.inStock ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${det.inStock ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {det.inStock ? 'En stock' : 'Rupture'}
            </span>
            {det.rating > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
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
            className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00ff66] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,255,102,0.25)] hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
            title={`Appeler directement : ${seller.phone}`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
            <span>Appel direct : {seller.phone}</span>
          </a>

          {/* Secondary Action Row: WhatsApp + Full Announcement Details */}
          <div className="grid grid-cols-2 gap-1.5">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
              title="Contacter sur WhatsApp"
            >
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>

            <button
              onClick={() => setSelectedDetailProduct(det)}
              className="py-1.5 px-2 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 hover:text-white flex items-center justify-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
              title="Voir l'annonce complète et ses détails"
            >
              <Eye className="w-3 h-3 text-emerald-400" /> Détails
            </button>
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
      </div>
    );
  }
};
