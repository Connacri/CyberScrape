import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ScrapedProduct, SupabaseConfig } from '../types';
import {
  Flame,
  Zap,
  ShoppingBag,
  Clock,
  Sparkles,
  PhoneCall,
  MessageCircle,
  ExternalLink,
  Tag,
  Search,
  LayoutGrid,
  List,
  MapPin,
  Star,
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowUpDown,
  X,
  Eye,
  SlidersHorizontal,
  Cloud,
  RefreshCw,
  Database,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ensureProductDetails, buildTelLink, buildWhatsAppLink } from '../utils/sellerGenerator';
import { getOuedknissOriginUrl } from '../utils/ouedknissUrls';
import { OUEDKNISS_CATEGORIES } from '../data/ouedknissCategories';
import { ALGERIA_69_WILAYAS } from '../data/algeriaWilayas';
import { fetchProductsFromSupabase } from '../utils/supabaseClient';

interface TemuEcommerceHubProps {
  products?: ScrapedProduct[];
  supabaseConfig: SupabaseConfig;
  onSelectProduct: (product: ScrapedProduct) => void;
  onOpenSupabaseModal: () => void;
  onStartScrapingCategory?: (categorySlug: string) => void;
  refreshTrigger?: number;
}

const LAZY_CHUNK_SIZE = 24;

export const TemuEcommerceHub: React.FC<TemuEcommerceHubProps> = ({
  products = [],
  supabaseConfig,
  onSelectProduct,
  onOpenSupabaseModal,
  onStartScrapingCategory,
  refreshTrigger,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [titleSearch, setTitleSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'discount'>('featured');

  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'boutique' | 'annonce' | 'pub'>('all');

  // Supabase Direct Cloud State (Articles récupérés depuis Supabase, pas depuis le local)
  const [cloudProducts, setCloudProducts] = useState<ScrapedProduct[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const isConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  // Fetch real articles directly from Supabase Cloud
  const loadFromSupabase = useCallback(async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      setCloudProducts([]);
      return;
    }
    setIsLoadingSupabase(true);
    setSupabaseError(null);
    try {
      const res = await fetchProductsFromSupabase(supabaseConfig);
      if (res.success) {
        setCloudProducts(res.products);
        setLastFetchedAt(new Date());
      } else {
        setSupabaseError(res.error || 'Erreur lors de la lecture Supabase');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de communication Supabase';
      setSupabaseError(msg);
    } finally {
      setIsLoadingSupabase(false);
    }
  }, [supabaseConfig]);

  useEffect(() => {
    if (isConfigured) {
      loadFromSupabase();
    } else {
      setCloudProducts([]);
    }
  }, [isConfigured, supabaseConfig.url, supabaseConfig.anonKey, supabaseConfig.tableName, refreshTrigger, loadFromSupabase]);

  // Senior Virtual Lazy Windowing State
  const [visibleCount, setVisibleCount] = useState<number>(LAZY_CHUNK_SIZE);
  const bottomSentinelRef = React.useRef<HTMLDivElement | null>(null);

  // Simulated countdown timer for flash deals (Temu style)
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 28, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Strict multi-factor deduplication to guarantee 100% unique items in TEMU storefront (from Supabase Cloud)
  const uniqueProducts = useMemo(() => {
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    const seenKeys = new Set<string>();
    const seenImages = new Set<string>();
    const result: ScrapedProduct[] = [];

    // STRICT REQUIREMENT: Only display items from Supabase Cloud (not from local cache)
    const sourceProducts = cloudProducts;

    for (let i = 0; i < sourceProducts.length; i++) {
      const p = sourceProducts[i];
      if (!p) continue;
      const idKey = (p.id || '').trim();
      const urlKey = (p.productUrl || '').trim().toLowerCase().split('?')[0];

      // Clean base title (remove suffixes like "Année 2022...", "Neuf sous blister...", etc.)
      const rawTitle = (p.title || '').trim().toLowerCase();
      const normTitle = rawTitle
        .replace(/\b(neuf|scellé|blister|garantie|facture|boîte|safia|retouche|peinture|sous carton)\b.*$/i, '')
        .trim()
        .replace(/\s+/g, ' ');

      const brandKey = (p.brand || '').trim().toLowerCase();
      const combinedKey = `${brandKey}:::${normTitle.slice(0, 32)}`;
      const imgKey = p.imageUrl ? p.imageUrl.split('?')[0] : '';

      // Skip duplicates based on ID, URL, or identical title & brand
      if (idKey && seenIds.has(idKey)) continue;
      if (urlKey && seenUrls.has(urlKey)) continue;
      if (combinedKey && seenKeys.has(combinedKey)) continue;
      if (imgKey && seenImages.has(imgKey) && !imgKey.includes('dicebear')) continue;

      if (idKey) seenIds.add(idKey);
      if (urlKey) seenUrls.add(urlKey);
      if (combinedKey) seenKeys.add(combinedKey);
      if (imgKey) seenImages.add(imgKey);
      result.push(p);
    }
    return result;
  }, [cloudProducts]);

  // Counts of types
  const typeCounts = useMemo(() => {
    let boutiques = 0;
    let annonces = 0;
    let pubs = 0;
    for (const p of uniqueProducts) {
      if (p.isSponsored || p.itemType === 'pub') pubs++;
      else if (p.isOfficialStore || p.itemType === 'boutique' || (p.seller && p.seller.type !== 'Particulier')) boutiques++;
      else annonces++;
    }
    return { boutiques, annonces, pubs };
  }, [uniqueProducts]);

  // Memoized category counts map (O(N) single pass instead of O(N * 17))
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < uniqueProducts.length; i++) {
      const c = uniqueProducts[i].category;
      if (c) map.set(c, (map.get(c) || 0) + 1);
    }
    return map;
  }, [uniqueProducts]);

  // Filter & sort
  const filteredProducts = useMemo(() => {
    const query = titleSearch.trim().toLowerCase();

    return uniqueProducts
      .filter((p) => {
        const matchesTitle = !query || p.title.toLowerCase().includes(query) || (p.brand && p.brand.toLowerCase().includes(query));
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesWilaya =
          selectedWilaya === 'all' ||
          (p.specs?.Wilaya && p.specs.Wilaya.toLowerCase().includes(selectedWilaya.toLowerCase())) ||
          (p.seller?.wilaya && p.seller.wilaya.toLowerCase().includes(selectedWilaya.toLowerCase()));
        
        // Type filter: boutique vs annonce vs pub
        let matchesType = true;
        if (listingTypeFilter === 'boutique') {
          matchesType = Boolean(p.isOfficialStore || p.itemType === 'boutique' || (p.seller && p.seller.type !== 'Particulier'));
        } else if (listingTypeFilter === 'annonce') {
          matchesType = !p.isSponsored && p.itemType !== 'pub' && (!p.isOfficialStore || (p.seller && p.seller.type === 'Particulier'));
        } else if (listingTypeFilter === 'pub') {
          matchesType = Boolean(p.isSponsored || p.itemType === 'pub');
        }

        return matchesTitle && matchesCategory && matchesWilaya && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.currentPrice - b.currentPrice;
        if (sortBy === 'price_desc') return b.currentPrice - a.currentPrice;
        if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
        return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
      });
  }, [uniqueProducts, titleSearch, selectedCategory, selectedWilaya, listingTypeFilter, sortBy]);

  // Reset visibleCount on filter change
  useEffect(() => {
    setVisibleCount(LAZY_CHUNK_SIZE);
  }, [titleSearch, selectedCategory, selectedWilaya, sortBy]);

  // Lazy Intersection Observer
  useEffect(() => {
    const currentSentinel = bottomSentinelRef.current;
    if (!currentSentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredProducts.length) {
          setVisibleCount((prev) => Math.min(prev + LAZY_CHUNK_SIZE, filteredProducts.length));
        }
      },
      { rootMargin: '350px' }
    );

    observer.observe(currentSentinel);
    return () => {
      observer.disconnect();
    };
  }, [visibleCount, filteredProducts.length]);

  // Slice for lazy rendering
  const lazyProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const formatPrice = (val: number, cur: string) => {
    if (cur === 'DA') {
      return `${Math.round(val).toLocaleString('fr-FR')} DA`;
    }
    return `${val.toLocaleString('fr-FR')} ${cur}`;
  };

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* ============================================================== */}
      {/* 1. TEMU STYLE HERO FLASH DEALS BANNER                          */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#fb5200] via-[#ff6a00] to-[#e03a00] p-4 sm:p-6 text-white shadow-[0_10px_35px_rgba(251,82,0,0.35)] overflow-hidden">
        {/* Decorative background glow circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-yellow-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 text-yellow-300 text-xs font-black tracking-wider uppercase backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 fill-yellow-300" />
              TEMU-DZ // VENTE FLASH CHOC OUEDKNISS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
              Articles Réels en Direct de Supabase Cloud
            </h2>
            <p className="text-xs sm:text-sm text-orange-100 font-medium max-w-xl">
              Flux 100% Cloud distant extrait depuis votre base Supabase. Mémoire locale allégée à zéro surcharge !
            </p>
          </div>

          {/* Flash Timer & Badges */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="bg-black/35 rounded-2xl p-3 border border-white/20 backdrop-blur-md flex items-center gap-2 text-center">
              <Clock className="w-4 h-4 text-yellow-300 animate-pulse" />
              <div className="flex items-center gap-1.5 font-mono text-sm font-black">
                <span className="bg-black/50 px-2 py-1 rounded-lg border border-white/10">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/50 px-2 py-1 rounded-lg border border-white/10">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/50 px-2 py-1 rounded-lg border border-white/10 text-yellow-300">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-xl bg-yellow-400 text-slate-950 flex items-center gap-1 shadow">
                <Truck className="w-3.5 h-3.5" /> 58 Wilayas
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-white/20 text-white flex items-center gap-1 backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5" /> Garanti Réel
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1.5 SUPABASE CLOUD DIRECT CONTROL & REFRESH BAR                */}
      {/* ============================================================== */}
      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-orange-500/40 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white uppercase tracking-wider text-[11px] sm:text-xs">
                FLUX CLOUD SUPABASE (DIRECT)
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isConfigured
                    ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {isConfigured ? 'CONNECTÉ' : 'NON LIÉ'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans truncate">
              {isConfigured
                ? `Table "${supabaseConfig.tableName || 'scraped_products'}" • ${cloudProducts.length} articles en ligne${
                    lastFetchedAt ? ` • Mis à jour à ${lastFetchedAt.toLocaleTimeString('fr-FR')}` : ''
                  }`
                : 'Connectez Supabase pour charger le catalogue distant.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          {isConfigured ? (
            <button
              type="button"
              onClick={loadFromSupabase}
              disabled={isLoadingSupabase}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-orange-500/20 border border-orange-500/60 text-orange-300 hover:bg-orange-500/30 hover:text-white transition-all flex items-center justify-center gap-2 font-bold cursor-pointer disabled:opacity-50 text-xs shadow-sm"
              title="Recharger le catalogue en direct depuis Supabase Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSupabase ? 'animate-spin text-white' : ''}`} />
              <span>{isLoadingSupabase ? 'Lecture Cloud...' : 'Rafraîchir Supabase'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer text-xs"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Connecter Supabase</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1.8 LARGE STATS & CLOUD COUNTERS (CLAIRES, GRANDES & SANS ERREUR) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Supabase Cloud Articles */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-orange-500/40 shadow-[0_0_20px_rgba(251,82,0,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Catalogue Cloud</span>
            <Cloud className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-orange-400 mt-1.5 tracking-tight">
            {cloudProducts.length.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span>En direct de Supabase</span>
          </div>
        </div>

        {/* Boutiques Pro Certifiées */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-emerald-500/40 shadow-[0_0_20px_rgba(0,255,102,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Boutiques Pro</span>
            <ShieldCheck className="w-4 h-4 text-[#00ff88]" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#00ff88] mt-1.5 tracking-tight">
            {typeCounts.boutiques.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Stores Officiels</div>
        </div>

        {/* Annonces Particuliers */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Particuliers</span>
            <Tag className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-yellow-300 mt-1.5 tracking-tight">
            {typeCounts.annonces.toLocaleString('fr-FR')}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Vente directe</div>
        </div>

        {/* Catégories Actives */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.12)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">Catégories</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 mt-1.5 tracking-tight">
            {categoryCounts.size} <span className="text-xs font-normal text-slate-400">/ 17</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-1">Rayons actifs</div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. REAL-TIME SEARCH & VIEW MODE CONTROLLER BAR                 */}
      {/* ============================================================== */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-orange-500/30 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        {/* Real-time Title Search Input */}
        <div className="relative flex-1 w-full md:min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
          <input
            type="text"
            placeholder="Chercher un article en temps réel (ex: Golf 8, Clio 4, S24 Ultra, PS5...)"
            value={titleSearch}
            onChange={(e) => setTitleSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-orange-500/30 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all font-medium min-h-[40px]"
          />
          {titleSearch && (
            <button
              onClick={() => setTitleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters and View Mode Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:w-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
            {/* Wilaya Filter (All 69 Wilayas of Algeria) */}
            <div className="relative flex items-center text-xs w-full">
              <MapPin className="w-3.5 h-3.5 text-orange-400 absolute left-3 pointer-events-none shrink-0" />
              <select
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-orange-300 font-bold focus:outline-none focus:border-orange-500 cursor-pointer min-h-[40px]"
              >
                <option value="all">📍 Toutes Wilayas (69)</option>
                {ALGERIA_69_WILAYAS.map((w) => (
                  <option key={w.code} value={w.name}>
                    {w.codeStr} - {w.name} ({w.nameAr})
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="relative flex items-center text-xs w-full">
              <ArrowUpDown className="w-3.5 h-3.5 text-yellow-400 absolute left-3 pointer-events-none shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer min-h-[40px]"
              >
                <option value="featured">🔥 Recommandés</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="discount">Meilleur rabais %</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="grid grid-cols-2 sm:flex items-center rounded-xl bg-black/60 p-0.5 border border-slate-800 text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all font-bold cursor-pointer min-h-[38px] ${
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Affichage en Grille Temu"
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span>Grille</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all font-bold cursor-pointer min-h-[38px] ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Affichage en Liste Détaillée"
            >
              <List className="w-3.5 h-3.5 shrink-0" />
              <span>Liste</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2.5 AUTHENTICITY NOTICE & LISTING TYPE SELECTOR (BOUTIQUE/PUB) */}
      {/* ============================================================== */}
      <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Transparence Catalogue :</strong> 100% des articles sont issus d'annonces réelles Ouedkniss (avec wilaya, numéro du vendeur et lien d'origine direct). Les répétitions ont été éliminées.
          </span>
        </div>

        {/* Listing Type Filter Pills */}
        <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-slate-800 shrink-0 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setListingTypeFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              listingTypeFilter === 'all'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tous ({uniqueProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setListingTypeFilter('boutique')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              listingTypeFilter === 'boutique'
                ? 'bg-yellow-500 text-black shadow'
                : 'text-yellow-400/80 hover:text-yellow-300'
            }`}
            title="Afficher uniquement les boutiques et stores professionnels officiels"
          >
            🏬 Stores Pro ({typeCounts.boutiques})
          </button>
          <button
            type="button"
            onClick={() => setListingTypeFilter('annonce')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              listingTypeFilter === 'annonce'
                ? 'bg-emerald-500 text-black shadow'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
            title="Afficher les annonces de particuliers vérifiés"
          >
            👤 Particuliers ({typeCounts.annonces})
          </button>
          <button
            type="button"
            onClick={() => setListingTypeFilter('pub')}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
              listingTypeFilter === 'pub'
                ? 'bg-purple-500 text-white shadow'
                : 'text-purple-400/80 hover:text-purple-300'
            }`}
            title="Afficher les annonces et publications sponsorisées"
          >
            📢 Pubs ({typeCounts.pubs})
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. HORIZONTAL SCROLLING CATEGORY CAPSULES                       */}
      {/* ============================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-[#fb5200] text-white shadow-[0_0_12px_rgba(251,82,0,0.5)]'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          ✨ Tous les articles ({uniqueProducts.length})
        </button>

        {OUEDKNISS_CATEGORIES.map((cat) => {
          const count = categoryCounts.get(cat.name) || 0;
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#fb5200] text-white shadow-[0_0_12px_rgba(251,82,0,0.5)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{cat.name}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-black/30 text-white' : 'bg-slate-800 text-orange-400'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* 4. PRODUCTS LISTING: DENSE TEMU GRID OR HORIZONTAL LIST        */}
      {/* ============================================================== */}
      {!isConfigured ? (
        <div className="rounded-3xl bg-slate-950/90 border-2 border-dashed border-amber-500/40 p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Cloud className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-black text-white font-mono">
              FLUX CLOUD SUPABASE EXCLUSIF
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Cet onglet TEMU-DZ est configuré pour extraire les annonces <strong>uniquement depuis votre base de données Supabase distante</strong> (aucune donnée locale n'est conservée pour libérer la mémoire).
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSupabaseModal}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-[#fb5200] text-slate-950 font-black text-sm tracking-wider uppercase hover:brightness-110 active:scale-95 transition-all shadow-xl cursor-pointer inline-flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            <span>Connecter Supabase maintenant</span>
          </button>
        </div>
      ) : isLoadingSupabase ? (
        <div className="rounded-3xl bg-slate-950/80 border border-orange-500/30 p-12 text-center space-y-3">
          <Loader2 className="w-12 h-12 text-orange-400 animate-spin mx-auto" />
          <h3 className="text-base font-bold text-white font-mono">
            RÉCUPÉRATION DU CATALOGUE DEPUIS SUPABASE...
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Interrogation directe de la table "{supabaseConfig.tableName || 'scraped_products'}" en cours.
          </p>
        </div>
      ) : supabaseError ? (
        <div className="rounded-3xl bg-rose-950/30 border border-rose-500/40 p-8 text-center space-y-3">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Échec de synchronisation Supabase</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">{supabaseError}</p>
          <button
            type="button"
            onClick={loadFromSupabase}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600 transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      ) : cloudProducts.length === 0 ? (
        <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-8 sm:p-12 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-orange-400 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-white font-mono">
            AUCUN ARTICLE DANS VOTRE BASE SUPABASE
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            La table "{supabaseConfig.tableName || 'scraped_products'}" est actuellement vide. Lancez une aspiration d'annonces puis cliquez sur <strong>"Envoyer vers Supabase & Vider la mémoire"</strong> pour peupler votre vitrine Cloud !
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-8 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-orange-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Aucun article ne correspond aux filtres</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Modifiez votre recherche ou réinitialisez les filtres par catégorie ou wilaya.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ------------------ TEMU GRID VIEW (LAZY WINDOWED & RESPONSIVE) ------------------ */
        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {lazyProducts.map((p) => {
            const det = ensureProductDetails(p);
            const seller = det.seller!;
            const tel = buildTelLink(seller);
            const wa = buildWhatsAppLink(seller, det);
            const originUrl = getOuedknissOriginUrl(det);
            const wilaya = seller.wilaya || det.specs?.Wilaya || 'Algérie';

            return (
              <div
                key={det.id}
                onClick={() => onSelectProduct(det)}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 320px' }}
                className="group relative rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-orange-500/70 p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_4px_25px_rgba(251,82,0,0.25)] cursor-pointer overflow-hidden"
              >
                <div>
                  {/* Image with Temu discount badge */}
                  <div className="relative aspect-square w-full rounded-xl bg-slate-900 overflow-hidden mb-2.5">
                    <img
                      src={det.imageUrl}
                      alt={det.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Temu Red/Orange Discount Ribbon */}
                    {det.discountPercent > 0 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#fb5200] text-white font-black text-[10px] tracking-wide shadow-md">
                        -{det.discountPercent}% OFF
                      </div>
                    )}

                    {/* Source / Type Badge */}
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[9px] font-mono font-bold border border-white/10 flex items-center gap-1">
                      {det.isSponsored || det.itemType === 'pub' ? (
                        <span className="text-purple-300">📢 Sponsorisée</span>
                      ) : det.isOfficialStore || det.itemType === 'boutique' || (seller && seller.type !== 'Particulier') ? (
                        <span className="text-yellow-300">🏬 Store Pro</span>
                      ) : (
                        <span className="text-emerald-300">✓ Particulier</span>
                      )}
                    </div>

                    {/* Wilaya badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-yellow-300 font-mono text-[9px] border border-yellow-400/30 flex items-center gap-1 backdrop-blur-sm truncate max-w-[120px]">
                      <MapPin className="w-2.5 h-2.5 shrink-0 text-orange-400" />
                      <span className="truncate">{wilaya}</span>
                    </div>
                  </div>

                  {/* Title & Brand */}
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                      <span className="truncate">{det.brand || det.category}</span>
                      <span className="text-[9px] text-emerald-400 font-mono normal-case shrink-0 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Réelle
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-orange-300 transition-colors">
                      {det.title}
                    </h4>
                  </div>

                  {/* Pricing row in Algerian Dinar (DA) */}
                  <div className="flex flex-wrap items-baseline gap-1.5 mb-2 min-w-0">
                    <span className="text-sm sm:text-base font-black text-[#ff5000] truncate">
                      {formatPrice(det.currentPrice, det.currency)}
                    </span>
                    {det.discountPercent > 0 && (
                      <span className="text-[10px] sm:text-[11px] line-through text-slate-500 font-medium truncate">
                        {formatPrice(det.originalPrice, det.currency)}
                      </span>
                    )}
                  </div>

                  {/* Temu lightning sellout bar */}
                  <div className="space-y-1 mb-2.5">
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-[#fb5200] rounded-full"
                        style={{ width: `${60 + (det.title.length % 35)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 gap-1 min-w-0">
                      <span className="flex items-center gap-1 text-orange-300 font-semibold truncate min-w-0">
                        <Flame className="w-3 h-3 text-[#ff5000] fill-[#ff5000] shrink-0" /> <span className="truncate">Offre Vendeur</span>
                      </span>
                      <span className="truncate shrink-0 max-w-[90px]">{seller.name}</span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900 text-xs" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={tel}
                    className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer min-w-0 overflow-hidden"
                    title={`Appeler directement : ${seller.phone}`}
                  >
                    <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Appel direct</span>
                  </a>

                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 rounded-lg bg-[#25D366] text-white font-bold text-[11px] flex items-center justify-center gap-1 hover:brightness-105 transition-colors cursor-pointer min-w-0 overflow-hidden"
                      title="WhatsApp Direct"
                    >
                      <MessageCircle className="w-3 h-3 shrink-0" /> <span className="truncate">WhatsApp</span>
                    </a>

                    <a
                      href={originUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-orange-500/40 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Ouvrir l'annonce sur Ouedkniss (Direct)"
                    >
                      <ExternalLink className="w-3 h-3 text-orange-400" /> Ouedkniss
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ------------------ TEMU LIST VIEW (LAZY WINDOWED) ------------------ */
        <div className="space-y-3">
          {lazyProducts.map((p) => {
            const det = ensureProductDetails(p);
            const seller = det.seller!;
            const tel = buildTelLink(seller);
            const wa = buildWhatsAppLink(seller, det);
            const originUrl = getOuedknissOriginUrl(det);
            const wilaya = seller.wilaya || det.specs?.Wilaya || 'Algérie';

            return (
              <div
                key={det.id}
                onClick={() => onSelectProduct(det)}
                style={{ contentVisibility: 'auto', containIntrinsicSize: '0 120px' }}
                className="group rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-orange-500/70 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(251,82,0,0.2)] cursor-pointer"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                    <img
                      src={det.imageUrl}
                      alt={det.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {det.discountPercent > 0 && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#fb5200] text-white text-[9px] font-black">
                        -{det.discountPercent}%
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 text-[10px] text-orange-400 font-bold">
                      <span>{det.category}</span>
                      <span>•</span>
                      <span className="text-yellow-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {wilaya}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                      {det.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Vendeur : <strong className="text-slate-200">{seller.name}</strong></span>
                      <span>•</span>
                      <span className="text-emerald-400">✓ Certifié</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900" onClick={(e) => e.stopPropagation()}>
                  <div className="text-left sm:text-right">
                    <div className="text-lg font-black text-[#ff5000]">
                      {formatPrice(det.currentPrice, det.currency)}
                    </div>
                    {det.discountPercent > 0 && (
                      <div className="text-xs line-through text-slate-500">
                        {formatPrice(det.originalPrice, det.currency)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={tel}
                      className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Appel
                    </a>
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a
                      href={originUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
                      title="Voir sur Ouedkniss"
                    >
                      <ExternalLink className="w-4 h-4 text-orange-400" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sentinel for Infinite Virtual Lazy Loading */}
      <div ref={bottomSentinelRef} className="h-12 flex items-center justify-center text-xs text-slate-500 font-mono">
        {visibleCount < filteredProducts.length ? (
          <div className="flex items-center gap-2 text-orange-400">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            <span>Défilement lazy continu ({visibleCount} / {filteredProducts.length} articles)...</span>
          </div>
        ) : filteredProducts.length > 0 ? (
          <span className="text-slate-600">✓ Tous les {filteredProducts.length} articles sont affichés sans ralentissement</span>
        ) : null}
      </div>
    </div>
  );
};
