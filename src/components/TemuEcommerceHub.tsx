import React, { useState, useMemo, useEffect } from 'react';
import { ScrapedProduct } from '../types';
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
} from 'lucide-react';
import { ensureProductDetails, buildTelLink, buildWhatsAppLink } from '../utils/sellerGenerator';
import { getOuedknissOriginUrl } from '../utils/ouedknissUrls';
import { OUEDKNISS_CATEGORIES } from '../data/ouedknissCategories';

import { ALGERIA_69_WILAYAS } from '../data/algeriaWilayas';

interface TemuEcommerceHubProps {
  products: ScrapedProduct[];
  onSelectProduct: (product: ScrapedProduct) => void;
  onStartScrapingCategory?: (categorySlug: string) => void;
}

const LAZY_CHUNK_SIZE = 24;

export const TemuEcommerceHub: React.FC<TemuEcommerceHubProps> = ({
  products,
  onSelectProduct,
  onStartScrapingCategory,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [titleSearch, setTitleSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'discount'>('featured');

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

  // Filter & sort
  const filteredProducts = useMemo(() => {
    const query = titleSearch.trim().toLowerCase();

    return products
      .filter((p) => {
        const matchesTitle = !query || p.title.toLowerCase().includes(query) || (p.brand && p.brand.toLowerCase().includes(query));
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesWilaya =
          selectedWilaya === 'all' ||
          (p.specs?.Wilaya && p.specs.Wilaya.toLowerCase().includes(selectedWilaya.toLowerCase())) ||
          (p.seller?.wilaya && p.seller.wilaya.toLowerCase().includes(selectedWilaya.toLowerCase()));
        return matchesTitle && matchesCategory && matchesWilaya;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.currentPrice - b.currentPrice;
        if (sortBy === 'price_desc') return b.currentPrice - a.currentPrice;
        if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
        return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
      });
  }, [products, titleSearch, selectedCategory, selectedWilaya, sortBy]);

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
              Articles Réels Scrappés en Direct
            </h2>
            <p className="text-xs sm:text-sm text-orange-100 font-medium max-w-xl">
              Catalogue haute vitesse sauvegardé dans la base de données locale. 1-Clic pour appeler ou contacter sur WhatsApp !
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
      {/* 2. REAL-TIME SEARCH & VIEW MODE CONTROLLER BAR                 */}
      {/* ============================================================== */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-orange-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Real-time Title Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
          <input
            type="text"
            placeholder="Chercher un article en temps réel (ex: Golf 8, Clio 4, S24 Ultra, PS5...)"
            value={titleSearch}
            onChange={(e) => setTitleSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-orange-500/30 rounded-xl pl-9 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all font-medium"
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

        {/* Wilaya Filter (All 69 Wilayas of Algeria) */}
        <div className="flex items-center gap-1.5 text-xs">
          <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
          <select
            value={selectedWilaya}
            onChange={(e) => setSelectedWilaya(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-orange-300 font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
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
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            <option value="featured">🔥 Recommandés</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="discount">Meilleur rabais %</option>
          </select>
        </div>

        {/* View Mode Toggle: Grid vs List */}
        <div className="flex items-center rounded-xl bg-black/60 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-bold cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Affichage en Grille Temu"
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grille Temu
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all font-bold cursor-pointer ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Affichage en Liste Détaillée"
          >
            <List className="w-3.5 h-3.5" /> Liste Temu
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
          ✨ Tous les articles ({products.length})
        </button>

        {OUEDKNISS_CATEGORIES.map((cat) => {
          const count = products.filter((p) => p.category === cat.name).length;
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
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-8 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 text-orange-400 mx-auto animate-bounce" />
          <h3 className="text-lg font-bold text-white">Aucun article trouvé dans cette sélection</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {products.length === 0
              ? "Le catalogue est actuellement vide. Lancez l'aspiration matricielle pour récolter les articles réels d'Ouedkniss."
              : "Modifiez votre recherche ou sélectionnez une autre catégorie pour afficher les résultats."}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* ------------------ TEMU GRID VIEW (LAZY WINDOWED) ------------------ */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
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

                    {/* Wilaya badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-yellow-300 font-mono text-[9px] border border-yellow-400/30 flex items-center gap-1 backdrop-blur-sm truncate max-w-[120px]">
                      <MapPin className="w-2.5 h-2.5 shrink-0 text-orange-400" />
                      <span className="truncate">{wilaya}</span>
                    </div>
                  </div>

                  {/* Title & Brand */}
                  <div className="space-y-1 mb-2">
                    <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider truncate">
                      {det.brand || det.category}
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-orange-300 transition-colors">
                      {det.title}
                    </h4>
                  </div>

                  {/* Pricing row in Algerian Dinar (DA) */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-base sm:text-lg font-black text-[#ff5000]">
                      {formatPrice(det.currentPrice, det.currency)}
                    </span>
                    {det.discountPercent > 0 && (
                      <span className="text-[11px] line-through text-slate-500 font-medium">
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
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 text-orange-300 font-semibold">
                        <Flame className="w-3 h-3 text-[#ff5000] fill-[#ff5000]" /> Offre Vendeur
                      </span>
                      <span>{seller.name.slice(0, 14)}</span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900 text-xs" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={tel}
                    className="w-full py-2 px-2 rounded-xl bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                    title={`Appeler directement : ${seller.phone}`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span className="truncate">Appel direct</span>
                  </a>

                  <div className="grid grid-cols-2 gap-1.5">
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 rounded-lg bg-[#25D366] text-white font-bold text-[11px] flex items-center justify-center gap-1 hover:brightness-105 transition-colors cursor-pointer"
                      title="WhatsApp Direct"
                    >
                      <MessageCircle className="w-3 h-3" /> WhatsApp
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
