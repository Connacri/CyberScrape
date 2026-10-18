import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  ChevronRight,
  ArrowRight,
  History,
  TrendingUp,
  ShoppingCart,
  Check,
  Plus,
  Minus,
  Trash2,
  Share2,
  RotateCcw,
  BadgePercent,
  CheckCheck,
} from 'lucide-react';
import {
  ensureProductDetails,
  buildTelLink,
  buildWhatsAppLink,
  isOfficialStoreProduct,
} from '../utils/sellerGenerator';
import { getOuedknissOriginUrl } from '../utils/ouedknissUrls';
import { ALGERIA_69_WILAYAS } from '../data/algeriaWilayas';
import { fetchProductsFromSupabase } from '../utils/supabaseClient';
import { cyberAudio } from '../utils/cyberAudio';
import {
  matchCategory,
  matchSubcategory,
  matchSearchQuery,
  normalizeText,
  TEMU_OFFICIAL_DEPARTMENTS,
  TEMU_HOT_TRENDING_SEARCHES,
} from '../utils/categoryMatcher';

interface TemuEcommerceHubProps {
  products?: ScrapedProduct[];
  supabaseConfig: SupabaseConfig;
  onSelectProduct: (product: ScrapedProduct) => void;
  onOpenSupabaseModal: () => void;
  onStartScrapingCategory?: (categorySlug: string) => void;
  refreshTrigger?: number;
}

export interface CartItem {
  product: ScrapedProduct;
  quantity: number;
}

const LAZY_CHUNK_SIZE = 24;

// Algerian Dinar Price Brackets
const PRICE_BRACKETS = [
  { id: 'all', label: 'Tous les prix', min: 0, max: Infinity },
  { id: 'under_10k', label: '< 10 000 DA', min: 0, max: 10000 },
  { id: '10k_50k', label: '10k - 50k DA', min: 10000, max: 50000 },
  { id: '50k_150k', label: '50k - 150k DA', min: 50000, max: 150000 },
  { id: 'over_150k', label: '> 150 000 DA', min: 150000, max: Infinity },
];

export { matchCategory };

export const TemuEcommerceHub: React.FC<TemuEcommerceHubProps> = ({
  products = [],
  supabaseConfig,
  onSelectProduct,
  onOpenSupabaseModal,
  refreshTrigger,
}) => {
  // Display & layout mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search state & Autocomplete
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('temu_dz_search_history');
      return stored ? JSON.parse(stored) : ['iPhone 15', 'Golf 8', 'PS5 Slim', 'RTX 4070'];
    } catch {
      return ['iPhone 15', 'Golf 8', 'PS5 Slim', 'RTX 4070'];
    }
  });

  // Category & Sub-Category Rayons (Default to 'all' = Pour Vous)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');

  // Quick Filter Badges
  const [selectedPriceBracket, setSelectedPriceBracket] = useState<string>('all');
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'boutique' | 'annonce' | 'pub'>('all');
  const [onlyFlashDeals, setOnlyFlashDeals] = useState<boolean>(false);
  const [onlyFreeDelivery, setOnlyFreeDelivery] = useState<boolean>(false);
  const [onlyTopRated, setOnlyTopRated] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'sales' | 'price_asc' | 'price_desc' | 'discount' | 'rating' | 'newest'>('featured');

  // Interactive Shopping Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('temu_dz_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartToast, setCartToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    fullName: '',
    phone: '',
    wilaya: 'Alger',
    address: '',
    notes: '',
  });

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('temu_dz_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Supabase Direct Cloud State
  const [cloudProducts, setCloudProducts] = useState<ScrapedProduct[]>([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState<boolean>(false);
  const isConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);

  // Fetch articles from Supabase Cloud if available
  const loadFromSupabase = useCallback(async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) return;
    setIsLoadingSupabase(true);
    try {
      const res = await fetchProductsFromSupabase(supabaseConfig, { limit: 300, offset: 0 });
      if (res.success && res.products.length > 0) {
        setCloudProducts(res.products);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingSupabase(false);
    }
  }, [supabaseConfig]);

  useEffect(() => {
    if (isConfigured) {
      loadFromSupabase();
    }
  }, [isConfigured, supabaseConfig.url, supabaseConfig.anonKey, refreshTrigger, loadFromSupabase]);

  // Lazy windowing
  const [visibleCount, setVisibleCount] = useState<number>(LAZY_CHUNK_SIZE);
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Flash deals countdown timer
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

  // RESILIENT SOURCE PRODUCTS: Unified Local + Cloud + Fallback Seed (never empty)
  const allAvailableProducts = useMemo(() => {
    const seenIds = new Set<string>();
    const list: ScrapedProduct[] = [];

    // Prioritize Cloud products, then local products
    const combined = [...cloudProducts, ...products];

    for (const p of combined) {
      if (!p || !p.id) continue;
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      list.push(p);
    }

    return list;
  }, [cloudProducts, products]);

  // Active department metadata
  const currentDepartment = useMemo(() => {
    return (
      TEMU_OFFICIAL_DEPARTMENTS.find((d) => d.slug === selectedCategory) ||
      TEMU_OFFICIAL_DEPARTMENTS[0]
    );
  }, [selectedCategory]);

  // Live Autocomplete Suggestions based on typed text
  const liveSearchSuggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return [];
    const suggestions = new Set<string>();
    const normQ = normalizeText(q);

    for (const p of allAvailableProducts) {
      const normTitle = normalizeText(p.title);
      const normBrand = normalizeText(p.brand);
      const normCat = normalizeText(p.category);

      if (normTitle.includes(normQ)) {
        // Suggest concise title
        const words = p.title.split(' ');
        const phrase = words.slice(0, 6).join(' ');
        suggestions.add(phrase);
      }
      if (normBrand && normBrand.includes(normQ)) {
        suggestions.add(p.brand!);
      }
      if (normCat && normCat.includes(normQ)) {
        suggestions.add(p.category);
      }
      if (suggestions.size >= 8) break;
    }
    return Array.from(suggestions);
  }, [searchQuery, allAvailableProducts]);

  // Accurate Category Counts (computed via matchCategory so they reflect real items)
  const departmentCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const dept of TEMU_OFFICIAL_DEPARTMENTS) {
      if (dept.slug === 'all') {
        map.set('all', allAvailableProducts.length);
      } else if (dept.slug === 'ventes-flash') {
        const flashCount = allAvailableProducts.filter(
          (p) => (p.discountPercent || 0) >= 15 || p.itemType === 'pub'
        ).length;
        map.set(dept.slug, flashCount);
      } else {
        const count = allAvailableProducts.filter((p) =>
          matchCategory(p.category, dept.slug, p.title, p.brand, p.specs)
        ).length;
        map.set(dept.slug, count);
      }
    }
    return map;
  }, [allAvailableProducts]);

  // Type counts
  const typeCounts = useMemo(() => {
    let boutiques = 0;
    let annonces = 0;
    let pubs = 0;
    for (const p of allAvailableProducts) {
      if (p.isSponsored || p.itemType === 'pub') pubs++;
      else if (isOfficialStoreProduct(p)) boutiques++;
      else annonces++;
    }
    return { boutiques, annonces, pubs };
  }, [allAvailableProducts]);

  // Robust Filter & Sort Pipeline
  const filteredProducts = useMemo(() => {
    // Price bounds
    let minP = 0;
    let maxP = Infinity;
    if (selectedPriceBracket !== 'all') {
      const bracket = PRICE_BRACKETS.find((b) => b.id === selectedPriceBracket);
      if (bracket) {
        minP = bracket.min;
        maxP = bracket.max;
      }
    }
    if (customMinPrice.trim()) {
      const p = parseFloat(customMinPrice);
      if (!isNaN(p)) minP = Math.max(minP, p);
    }
    if (customMaxPrice.trim()) {
      const p = parseFloat(customMaxPrice);
      if (!isNaN(p)) maxP = Math.min(maxP, p);
    }

    return allAvailableProducts
      .filter((p) => {
        // 1. Search Query Match (Multi-token, diacritics & punctuation insensitive)
        if (searchQuery.trim() && !matchSearchQuery(p, searchQuery)) {
          return false;
        }

        // 2. Category Match
        if (selectedCategory !== 'all') {
          if (selectedCategory === 'ventes-flash') {
            if ((p.discountPercent || 0) < 15 && p.itemType !== 'pub') return false;
          } else if (!matchCategory(p.category, selectedCategory, p.title, p.brand, p.specs)) {
            return false;
          }
        }

        // 3. Sub-Category / Department Chip Match
        if (selectedSubCategory !== 'all' && !matchSubcategory(p, selectedSubCategory)) {
          return false;
        }

        // 4. Price Filter
        const price = Number(p.currentPrice) || 0;
        if (price < minP || price > maxP) return false;

        // 5. Wilaya Filter
        if (selectedWilaya !== 'all') {
          const normW = normalizeText(selectedWilaya);
          const pWilaya = normalizeText(
            `${p.specs?.Wilaya || ''} ${p.seller?.wilaya || ''}`
          );
          if (!pWilaya.includes(normW)) return false;
        }

        // 6. Listing Type Filter
        if (listingTypeFilter === 'boutique') {
          if (!isOfficialStoreProduct(p)) return false;
        } else if (listingTypeFilter === 'annonce') {
          if (isOfficialStoreProduct(p) || p.isSponsored || p.itemType === 'pub') return false;
        } else if (listingTypeFilter === 'pub') {
          if (!p.isSponsored && p.itemType !== 'pub') return false;
        }

        // 7. Flash Deals Toggle (-15%+)
        if (onlyFlashDeals && (p.discountPercent || 0) < 15) return false;

        // 8. Free Delivery Toggle
        if (onlyFreeDelivery && p.deliveryAvailable === false) return false;

        // 9. Top Rated (4.5★+)
        if (onlyTopRated && (p.rating || 0) < 4.5) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return (a.currentPrice || 0) - (b.currentPrice || 0);
        if (sortBy === 'price_desc') return (b.currentPrice || 0) - (a.currentPrice || 0);
        if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'sales') return (b.reviewsCount || 0) - (a.reviewsCount || 0);
        if (sortBy === 'newest') return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
        // Featured (Temu default featured score: blend of discount % + ratings + reviews)
        const scoreA =
          (a.discountPercent || 0) * 2 +
          (a.rating || 4.5) * 10 +
          Math.min(10, (a.reviewsCount || 0) / 100);
        const scoreB =
          (b.discountPercent || 0) * 2 +
          (b.rating || 4.5) * 10 +
          Math.min(10, (b.reviewsCount || 0) / 100);
        return scoreB - scoreA;
      });
  }, [
    allAvailableProducts,
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedPriceBracket,
    customMinPrice,
    customMaxPrice,
    selectedWilaya,
    listingTypeFilter,
    onlyFlashDeals,
    onlyFreeDelivery,
    onlyTopRated,
    sortBy,
  ]);

  // Reset lazy window on filter change
  useEffect(() => {
    setVisibleCount(LAZY_CHUNK_SIZE);
  }, [
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedPriceBracket,
    customMinPrice,
    customMaxPrice,
    selectedWilaya,
    listingTypeFilter,
    onlyFlashDeals,
    onlyFreeDelivery,
    onlyTopRated,
    sortBy,
  ]);

  // Intersection Observer for smooth scrolling
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredProducts.length) {
          setVisibleCount((prev) => Math.min(prev + LAZY_CHUNK_SIZE, filteredProducts.length));
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  const lazyProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Price formatter in DA
  const formatPrice = (val: number, cur: string = 'DA') => {
    if (cur === 'DA' || !cur) {
      return `${Math.round(val).toLocaleString('fr-FR')} DA`;
    }
    return `${val.toLocaleString('fr-FR')} ${cur}`;
  };

  // Handle Search Submission & Save to History
  const handlePerformSearch = (text: string, categoryScope?: string) => {
    setSearchQuery(text);
    if (categoryScope) {
      setSelectedCategory(categoryScope);
      setSelectedSubCategory('all');
    }
    setIsSearchFocused(false);
    cyberAudio.playClick();

    if (text.trim()) {
      setSearchHistory((prev) => {
        const clean = text.trim();
        const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
        try {
          localStorage.setItem('temu_dz_search_history', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  };

  // Remove single search item
  const handleRemoveHistoryItem = (itemToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      try {
        localStorage.setItem('temu_dz_search_history', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Clear search history
  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory([]);
    try {
      localStorage.removeItem('temu_dz_search_history');
    } catch {
      // ignore
    }
    cyberAudio.playClick();
  };

  // Add to Cart handler
  const handleAddToCart = (product: ScrapedProduct, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    cyberAudio.playItemAspirated();

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [{ product, quantity: 1 }, ...prev];
    });

    setCartToast({ message: `"${product.title.slice(0, 24)}..." ajouté au panier !`, show: true });
    setTimeout(() => {
      setCartToast((prev) => ({ ...prev, show: false }));
    }, 2400);
  };

  // Update Cart quantity
  const handleUpdateCartQty = (productId: string, delta: number) => {
    cyberAudio.playClick();
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  // Remove from cart
  const handleRemoveFromCart = (productId: string) => {
    cyberAudio.playClick();
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Cart total calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.currentPrice || 0) * item.quantity, 0);
  }, [cart]);

  const cartDiscount = useMemo(() => {
    return Math.round(cartSubtotal * 0.4); // 40% promo discount
  }, [cartSubtotal]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - cartDiscount);
  }, [cartSubtotal, cartDiscount]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Complete COD Checkout
  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutForm.fullName || !checkoutForm.phone) {
      return;
    }
    cyberAudio.playComplete();
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCart([]);
      setCheckoutSuccess(false);
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      setCheckoutForm({ fullName: '', phone: '', wilaya: 'Alger', address: '', notes: '' });
    }, 2800);
  };

  // Reset all filters in 1 click
  const handleResetAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setSelectedPriceBracket('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSelectedWilaya('all');
    setListingTypeFilter('all');
    setOnlyFlashDeals(false);
    setOnlyFreeDelivery(false);
    setOnlyTopRated(false);
    setSortBy('featured');
    cyberAudio.playClick();
  };

  // Active filter count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedSubCategory !== 'all') count++;
    if (selectedPriceBracket !== 'all' || customMinPrice || customMaxPrice) count++;
    if (selectedWilaya !== 'all') count++;
    if (listingTypeFilter !== 'all') count++;
    if (onlyFlashDeals) count++;
    if (onlyFreeDelivery) count++;
    if (onlyTopRated) count++;
    if (sortBy !== 'featured') count++;
    return count;
  }, [
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedPriceBracket,
    customMinPrice,
    customMaxPrice,
    selectedWilaya,
    listingTypeFilter,
    onlyFlashDeals,
    onlyFreeDelivery,
    onlyTopRated,
    sortBy,
  ]);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Toast Notification for Add to Cart */}
      {cartToast.show && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#fb5200] text-white font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce border border-yellow-300/40">
          <ShoppingCart className="w-4 h-4 fill-white" />
          <span>{cartToast.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. OFFICIAL TEMU BANNER WITH TIMERS & CART BADGE               */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#fb5200] via-[#ff6a00] to-[#e03a00] p-4 sm:p-6 text-white shadow-[0_10px_35px_rgba(251,82,0,0.35)] overflow-hidden">
        {/* Glow circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-yellow-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 text-yellow-300 text-xs font-black tracking-wider uppercase backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 fill-yellow-300" />
              TEMU ALGÉRIE // VENTES FLASH & PRIX DIRECTS EN DINAR (DA)
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md">
              Achetez Comme un Milliardaire en Dinar Algérien
            </h2>
            <p className="text-xs sm:text-sm text-orange-100 font-medium max-w-xl">
              Catalogue e-commerce d'annonces vérifiées Ouedkniss • Livraison 58 Wilayas & Paiement Cash à la Réception (COD)
            </p>
          </div>

          {/* Flash Timer & Floating Cart Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            {/* Flash Timer */}
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

            {/* Shopping Cart Button with Live Badge */}
            <button
              type="button"
              onClick={() => {
                setIsCartOpen(true);
                cyberAudio.playClick();
              }}
              className="px-4 py-2.5 rounded-2xl bg-slate-950 text-white font-bold text-xs flex items-center gap-2 hover:bg-slate-900 border border-yellow-400/40 shadow-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-yellow-400" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full bg-[#fb5200] text-white font-black text-[9px] border border-black shadow">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span>Panier Temu ({totalCartCount})</span>
              <span className="text-yellow-400 font-mono font-black">{formatPrice(cartTotal)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. OFFICIAL TEMU SEARCH BAR WITH AUTOCOMPLETE & SCOPE DROPDOWN */}
      {/* ============================================================== */}
      <div ref={searchContainerRef} className="relative z-30">
        <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/95 border-2 border-[#fb5200]/60 backdrop-blur-md shadow-[0_4px_25px_rgba(251,82,0,0.2)] flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 absolute left-3.5 text-[#fb5200] shrink-0 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePerformSearch(searchQuery);
                }
              }}
              placeholder="Rechercher sur Temu (ex: iPhone 15, Golf 8, PS5 Slim, Clio 4 GT, PC Gamer, Dattes, Nike...)"
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-slate-400 font-medium focus:outline-none focus:border-[#fb5200] focus:ring-2 focus:ring-[#fb5200]/30 transition-all min-h-[46px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  cyberAudio.playClick();
                }}
                className="absolute right-3 text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handlePerformSearch(searchQuery)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer min-h-[46px] shrink-0"
          >
            <span>Rechercher</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Autocomplete, Scoped Search & Trending Searches Dropdown */}
        {isSearchFocused && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 rounded-2xl bg-slate-950/98 border border-[#fb5200]/50 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto">
            {/* Live Autocomplete Matches as user types */}
            {searchQuery.trim().length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Suggestions de recherche Temu</span>
                </div>

                {/* Scoped category jump buttons */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => handlePerformSearch(searchQuery, 'telephones')}
                    className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-bold hover:bg-orange-500/30 cursor-pointer flex items-center gap-1"
                  >
                    <span>📱 Chercher "{searchQuery}" dans Téléphones</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePerformSearch(searchQuery, 'automobiles')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold hover:bg-emerald-500/30 cursor-pointer flex items-center gap-1"
                  >
                    <span>🚗 Dans Automobiles</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePerformSearch(searchQuery, 'informatique')}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold hover:bg-purple-500/30 cursor-pointer flex items-center gap-1"
                  >
                    <span>💻 Dans Informatique</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Direct matches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {liveSearchSuggestions.map((sugg) => (
                    <button
                      key={sugg}
                      type="button"
                      onClick={() => handlePerformSearch(sugg)}
                      className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-orange-500/20 hover:text-orange-300 text-left text-xs text-slate-200 flex items-center justify-between transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400 shrink-0" />
                        <span className="truncate">{sugg}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches (Temu Official Style) */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />
                <span>Recherches Populaires en Algérie (Tendances Temu)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                {TEMU_HOT_TRENDING_SEARCHES.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handlePerformSearch(item.tag)}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#fb5200] hover:bg-orange-500/10 text-xs text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[10px] font-black mb-0.5">
                      <span className="text-orange-400">{item.badge}</span>
                      <span className="text-slate-500 font-mono text-[9px]">{item.count}</span>
                    </div>
                    <div className="text-slate-200 group-hover:text-white font-bold truncate">
                      {item.tag}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-900">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Historique Récent</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    Tout effacer
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {searchHistory.map((item) => (
                    <div
                      key={item}
                      className="group inline-flex items-center rounded-xl bg-black/60 border border-slate-800 hover:border-cyan-400/50 text-xs text-slate-300 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => handlePerformSearch(item)}
                        className="px-3 py-1.5 hover:text-cyan-300 transition-all cursor-pointer"
                      >
                        {item}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveHistoryItem(item, e)}
                        className="pr-2 pl-0.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                        title="Supprimer cet historique"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. OFFICIAL TEMU VISUAL CATEGORY RAIL & SUB-CATEGORY CHIPS     */}
      {/* ============================================================== */}
      <div className="space-y-2.5">
        {/* Horizontal Category Rail */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TEMU_OFFICIAL_DEPARTMENTS.map((dept) => {
            const count = departmentCounts.get(dept.slug) || 0;
            const isSelected = selectedCategory === dept.slug;

            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(dept.slug);
                  setSelectedSubCategory('all');
                  cyberAudio.playClick();
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white shadow-[0_0_18px_rgba(251,82,0,0.5)] scale-102 font-black'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{dept.name}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-black/35 text-white' : 'bg-slate-800 text-orange-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Sub-Category Department Chips (Temu official suggestions feature) */}
        <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-orange-500/25 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[10px] font-bold uppercase text-orange-400 shrink-0 pl-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Suggestions :
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedSubCategory('all');
              cyberAudio.playClick();
            }}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-bold text-[11px] ${
              selectedSubCategory === 'all'
                ? 'bg-orange-500/30 text-orange-300 border border-orange-500/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tout ({currentDepartment.name.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').trim() || 'Rayon'})
          </button>

          {currentDepartment.subcategories.map((sub) => {
            const isSubSelected = selectedSubCategory === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setSelectedSubCategory(sub);
                  cyberAudio.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer text-[11px] font-bold border ${
                  isSubSelected
                    ? 'bg-[#fb5200] text-white border-[#fb5200] shadow-md scale-102'
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. TEMU QUICK FILTER CHIPS, PRICE BRACKETS & SORT SELECTOR     */}
      {/* ============================================================== */}
      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-3 shadow-md">
        {/* Top Controls Row: Quick Badges + View Mode */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Temu Quick Toggle Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Ventes Flash Toggle */}
            <button
              type="button"
              onClick={() => {
                setOnlyFlashDeals(!onlyFlashDeals);
                cyberAudio.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyFlashDeals
                  ? 'bg-yellow-400 text-slate-950 border-yellow-400 shadow-md scale-102'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${onlyFlashDeals ? 'text-slate-950 fill-current' : 'text-yellow-400'}`} />
              <span>Ventes Flash (-15%+)</span>
            </button>

            {/* Free Delivery Toggle */}
            <button
              type="button"
              onClick={() => {
                setOnlyFreeDelivery(!onlyFreeDelivery);
                cyberAudio.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyFreeDelivery
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md scale-102'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Truck className={`w-3.5 h-3.5 ${onlyFreeDelivery ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>Livraison 58 Wilayas</span>
            </button>

            {/* Top Rated (4.5★+) */}
            <button
              type="button"
              onClick={() => {
                setOnlyTopRated(!onlyTopRated);
                cyberAudio.playClick();
              }}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyTopRated
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md scale-102'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyTopRated ? 'text-white fill-white' : 'text-yellow-400'}`} />
              <span>Top Avis (4.5★+)</span>
            </button>

            {/* Store Type Filter */}
            <select
              value={listingTypeFilter}
              onChange={(e) => setListingTypeFilter(e.target.value as typeof listingTypeFilter)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-orange-300 font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="all">🏬 Tous Types ({allAvailableProducts.length})</option>
              <option value="boutique">Stores Pro Certifiés ({typeCounts.boutiques})</option>
              <option value="annonce">Particuliers ({typeCounts.annonces})</option>
              <option value="pub">Sponsorisées ({typeCounts.pubs})</option>
            </select>

            {/* Wilaya Filter */}
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-yellow-300 font-bold focus:outline-none focus:border-yellow-500 cursor-pointer"
            >
              <option value="all">📍 58 Wilayas (Toutes)</option>
              {ALGERIA_69_WILAYAS.map((w) => (
                <option key={w.code} value={w.name}>
                  {w.codeStr} - {w.name} ({w.nameAr})
                </option>
              ))}
            </select>
          </div>

          {/* Sort By & View Mode */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                <option value="featured">🔥 Recommandés (Temu Best)</option>
                <option value="sales">⚡ Meilleures Ventes</option>
                <option value="discount">🏷️ Plus forte réduction %</option>
                <option value="price_asc">💰 Prix croissant (Moins cher)</option>
                <option value="price_desc">💎 Prix décroissant (Plus cher)</option>
                <option value="rating">⭐ Meilleures notes</option>
                <option value="newest">🕒 Nouveautés</option>
              </select>
            </div>

            {/* Grid vs List view toggle */}
            <div className="flex items-center rounded-xl bg-black p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-[#fb5200] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Vue Grille Temu"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-[#fb5200] text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Vue Liste Détaillée"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Price Brackets & Custom Min/Max Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-900 text-xs">
          {/* Quick Price Brackets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Prix :</span>
            {PRICE_BRACKETS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setSelectedPriceBracket(b.id);
                  setCustomMinPrice('');
                  setCustomMaxPrice('');
                  cyberAudio.playClick();
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                  selectedPriceBracket === b.id
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/60 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Custom Min / Max Inputs */}
          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="number"
              placeholder="Min DA"
              value={customMinPrice}
              onChange={(e) => {
                setCustomMinPrice(e.target.value);
                setSelectedPriceBracket('all');
              }}
              className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            <span className="text-slate-500">-</span>
            <input
              type="number"
              placeholder="Max DA"
              value={customMaxPrice}
              onChange={(e) => {
                setCustomMaxPrice(e.target.value);
                setSelectedPriceBracket('all');
              }}
              className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {/* Active Filters Chips Bar with Reset */}
        {activeFiltersCount > 0 && (
          <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Filtres actifs ({activeFiltersCount}) :</span>

              {searchQuery && (
                <span className="px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] flex items-center gap-1">
                  <span>"{searchQuery}"</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSearchQuery('')} />
                </span>
              )}

              {selectedCategory !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] flex items-center gap-1">
                  <span>Rayon: {currentDepartment.name}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedCategory('all')} />
                </span>
              )}

              {selectedSubCategory !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[11px] flex items-center gap-1">
                  <span>{selectedSubCategory}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedSubCategory('all')} />
                </span>
              )}

              {selectedPriceBracket !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[11px] flex items-center gap-1">
                  <span>{PRICE_BRACKETS.find((b) => b.id === selectedPriceBracket)?.label}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedPriceBracket('all')} />
                </span>
              )}

              {(customMinPrice || customMaxPrice) && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[11px] flex items-center gap-1">
                  <span>{customMinPrice || 0} - {customMaxPrice || '∞'} DA</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => { setCustomMinPrice(''); setCustomMaxPrice(''); }} />
                </span>
              )}

              {selectedWilaya !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[11px] flex items-center gap-1">
                  <span>📍 {selectedWilaya}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setSelectedWilaya('all')} />
                </span>
              )}

              {onlyFlashDeals && (
                <span className="px-2 py-0.5 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[11px] flex items-center gap-1">
                  <span>⚡ Ventes Flash</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setOnlyFlashDeals(false)} />
                </span>
              )}

              {onlyFreeDelivery && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] flex items-center gap-1">
                  <span>🚚 Livraison 58W</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setOnlyFreeDelivery(false)} />
                </span>
              )}

              {onlyTopRated && (
                <span className="px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] flex items-center gap-1">
                  <span>⭐ Top Notés</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setOnlyTopRated(false)} />
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetAllFilters}
              className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
            >
              Réinitialiser tout
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 5. PRODUCT LISTING (TEMU HIGH-DENSITY CARDS & ACTIONS)         */}
      {/* ============================================================== */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl bg-slate-950/80 border border-slate-800 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white">Aucun article ne correspond exactement à vos filtres</h3>
            <p className="text-xs text-slate-400">
              Essayez un autre mot-clé ou réinitialisez les filtres pour retrouver les {allAvailableProducts.length} articles disponibles en boutique.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white font-bold text-xs hover:brightness-110 transition-all cursor-pointer shadow-md"
            >
              Réinitialiser tous les filtres ({allAvailableProducts.length} articles)
            </button>
            <button
              type="button"
              onClick={() => handlePerformSearch('iPhone 15')}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
            >
              Voir les iPhones
            </button>
            <button
              type="button"
              onClick={() => handlePerformSearch('Golf 8')}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
            >
              Voir les Voitures
            </button>
          </div>

          {/* Recommended items carousel preview */}
          <div className="pt-6 border-t border-slate-900 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              🔥 Articles les plus populaires aujourd'hui :
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {allAvailableProducts.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onSelectProduct(rec)}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-orange-500/60 cursor-pointer transition-all"
                >
                  <img
                    src={rec.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80'}
                    alt={rec.title}
                    className="w-full aspect-square rounded-lg object-cover mb-2"
                  />
                  <div className="text-[11px] font-bold text-white truncate">{rec.title}</div>
                  <div className="text-xs font-black text-orange-400 mt-1">
                    {formatPrice(rec.currentPrice, rec.currency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* TEMU HIGH DENSITY GRID VIEW - Ergonomic Mobile 1-Col, Tablet 2/3-Col */
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {lazyProducts.map((p) => {
            const det = ensureProductDetails(p);
            const seller = det.seller!;
            const tel = buildTelLink(seller);
            const wa = buildWhatsAppLink(seller, det);
            const originUrl = getOuedknissOriginUrl(det);
            const wilaya = seller.wilaya || det.specs?.Wilaya || 'Algérie';
            const inCartItem = cart.find((item) => item.product.id === det.id);

            return (
              <div
                key={det.id}
                onClick={() => onSelectProduct(det)}
                className="group relative rounded-2xl bg-slate-950/95 border border-slate-800 hover:border-[#fb5200] p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_4px_25px_rgba(251,82,0,0.25)] cursor-pointer overflow-hidden"
              >
                <div>
                  {/* Thumbnail image with discount ribbon */}
                  <div className="relative aspect-square w-full rounded-xl bg-slate-900 overflow-hidden mb-2.5">
                    <img
                      src={det.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80'}
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

                    {/* Source / Store Type Badge */}
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[9px] font-mono font-bold border border-white/10 flex items-center gap-1">
                      {det.isSponsored || det.itemType === 'pub' ? (
                        <span className="text-purple-300">📢 Sponsorisé</span>
                      ) : isOfficialStoreProduct(det) ? (
                        <span className="text-yellow-300">🏬 Store Pro</span>
                      ) : (
                        <span className="text-emerald-300">✓ Particulier</span>
                      )}
                    </div>

                    {/* Wilaya badge */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-yellow-300 font-mono text-[9px] border border-yellow-400/30 flex items-center gap-1 backdrop-blur-sm truncate max-w-[130px]">
                      <MapPin className="w-2.5 h-2.5 shrink-0 text-orange-400" />
                      <span className="truncate">{wilaya}</span>
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                      <span className="truncate">{det.brand || det.category}</span>
                      <span className="text-[9px] text-emerald-400 font-mono normal-case shrink-0 flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Vérifié
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-orange-300 transition-colors">
                      {det.title}
                    </h4>
                  </div>

                  {/* Rating Stars & Reviews */}
                  <div className="flex items-center gap-1.5 mb-2 text-[10px]">
                    <div className="flex items-center text-yellow-400">
                      <Star className="w-3 h-3 fill-yellow-400" />
                      <span className="font-bold text-white ml-0.5">{det.rating || 4.8}</span>
                    </div>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 font-mono">({det.reviewsCount || 120} avis)</span>
                  </div>

                  {/* Pricing row in Algerian Dinar (DA) */}
                  <div className="flex flex-wrap items-baseline gap-1.5 mb-2 min-w-0">
                    <span className="text-base sm:text-lg font-black text-[#ff5000] truncate">
                      {formatPrice(det.currentPrice, det.currency)}
                    </span>
                    {det.discountPercent > 0 && (
                      <span className="text-[10px] sm:text-[11px] line-through text-slate-500 font-medium truncate">
                        {formatPrice(det.originalPrice, det.currency)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="pt-2 border-t border-slate-900 space-y-2">
                  {/* Delivery & Stock badges */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-medium truncate">
                      <Truck className="w-3 h-3 shrink-0" />
                      <span>Livraison COD</span>
                    </span>
                    <span className="text-yellow-400 font-bold truncate">En stock</span>
                  </div>

                  {/* Action Buttons: Add to Cart & Seller Contact */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* Add to Cart button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(det, e)}
                      className={`col-span-2 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm ${
                        inCartItem
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#fb5200] hover:bg-[#ff6a00] text-white active:scale-95'
                      }`}
                      title="Ajouter au Panier Temu"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{inCartItem ? `(${inCartItem.quantity})` : 'Panier'}</span>
                    </button>

                    {/* Direct Call */}
                    <a
                      href={tel}
                      onClick={(e) => e.stopPropagation()}
                      className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-all cursor-pointer"
                      title={`Appeler ${seller.name} (${seller.phone})`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 flex items-center justify-center transition-all cursor-pointer"
                      title="Écrire sur WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TEMU LIST VIEW */
        <div className="space-y-2.5">
          {lazyProducts.map((p) => {
            const det = ensureProductDetails(p);
            const seller = det.seller!;
            const tel = buildTelLink(seller);
            const wa = buildWhatsAppLink(seller, det);
            const originUrl = getOuedknissOriginUrl(det);
            const wilaya = seller.wilaya || det.specs?.Wilaya || 'Algérie';
            const inCartItem = cart.find((item) => item.product.id === det.id);

            return (
              <div
                key={det.id}
                onClick={() => onSelectProduct(det)}
                className="group rounded-2xl bg-slate-950/95 border border-slate-800 hover:border-[#fb5200] p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-300 hover:shadow-lg cursor-pointer"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-900 overflow-hidden shrink-0">
                    <img
                      src={det.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80'}
                      alt={det.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {det.discountPercent > 0 && (
                      <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-[#fb5200] text-white font-black text-[9px]">
                        -{det.discountPercent}%
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-orange-400 uppercase">
                      <span>{det.brand || det.category}</span>
                      <span>•</span>
                      <span className="text-slate-400 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {wilaya}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-orange-300 transition-colors">
                      {det.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center text-yellow-400">
                        <Star className="w-3.5 h-3.5 fill-yellow-400" />
                        <span className="font-bold text-white ml-0.5">{det.rating || 4.8}</span>
                      </div>
                      <span className="text-slate-500">•</span>
                      <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Livraison COD 58W
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-900">
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-black text-[#ff5000]">
                      {formatPrice(det.currentPrice, det.currency)}
                    </div>
                    {det.discountPercent > 0 && (
                      <div className="text-[11px] line-through text-slate-500 font-medium">
                        {formatPrice(det.originalPrice, det.currency)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(det, e)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                        inCartItem
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#fb5200] hover:bg-[#ff6a00] text-white active:scale-95'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{inCartItem ? `Dans le Panier (${inCartItem.quantity})` : 'Ajouter'}</span>
                    </button>
                    <a
                      href={tel}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30"
                      title="Appeler"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Bottom Sentinel */}
      <div ref={bottomSentinelRef} className="h-10 flex items-center justify-center text-xs text-slate-500 font-mono">
        {visibleCount < filteredProducts.length ? (
          <span>Chargement d'articles supplémentaires...</span>
        ) : (
          filteredProducts.length > 0 && (
            <span>Tous les {filteredProducts.length} articles sont affichés</span>
          )
        )}
      </div>

      {/* ============================================================== */}
      {/* 6. TEMU SHOPPING CART DRAWER / MODAL                           */}
      {/* ============================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md h-full bg-slate-950 border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
            {/* Cart Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#fb5200] text-white flex items-center justify-center shadow-lg">
                    <ShoppingCart className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Mon Panier Temu</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      {totalCartCount} article{totalCartCount > 1 ? 's' : ''} sélectionné{totalCartCount > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Delivery Banner */}
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Livraison Gratuite 58 Wilayas</strong> & Paiement Cash à la Livraison (COD)
                </span>
              </div>

              {/* Cart Items List */}
              <div className="mt-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingCart className="w-12 h-12 text-slate-700 mx-auto" />
                    <p className="text-sm text-slate-400">Votre panier Temu est vide</p>
                    <button
                      type="button"
                      onClick={() => setIsCartOpen(false)}
                      className="px-4 py-2 rounded-xl bg-[#fb5200] text-white font-bold text-xs cursor-pointer shadow-md"
                    >
                      Explorer les offres
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <img
                        src={item.product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                        alt={item.product.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <h4 className="text-xs font-bold text-white truncate">{item.product.title}</h4>
                        <div className="text-xs font-black text-[#ff5000]">
                          {formatPrice(item.product.currentPrice, item.product.currency)}
                        </div>
                      </div>

                      {/* Quantity buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.product.id, -1)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono font-bold text-xs text-white px-1.5">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.product.id, 1)}
                          className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Sous-total :</span>
                    <span className="font-mono">{formatPrice(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Code promo PROMO-DZ (-40%) :</span>
                    <span className="font-mono">-{formatPrice(cartDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-slate-800">
                    <span>Total à payer (COD) :</span>
                    <span className="text-[#ff5000] text-base font-mono">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Commander ({formatPrice(cartTotal)})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. QUICK COD CHECKOUT MODAL                                    */}
      {/* ============================================================== */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl">
            {checkoutSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Commande Confirmée !</h3>
                <p className="text-xs text-slate-300">
                  Votre commande Temu a été transmise aux vendeurs. Vous serez contacté par téléphone au{' '}
                  <strong className="text-yellow-400">{checkoutForm.phone}</strong> pour confirmer l'expédition à domicile.
                </p>
                <div className="text-xs text-emerald-400 font-bold font-mono">
                  Paiement main à main : {formatPrice(cartTotal)}
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmCheckout} className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Truck className="w-5 h-5 text-orange-400" />
                    <span>Livraison Cash à la Réception (COD)</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Nom et Prénom :</label>
                    <input
                      type="text"
                      required
                      value={checkoutForm.fullName}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, fullName: e.target.value })}
                      placeholder="Ex: Mohamed Benali"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Numéro de Téléphone (Algérie) :</label>
                    <input
                      type="tel"
                      required
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                      placeholder="0550 12 34 56 / 0661..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Wilaya de Livraison (58 Wilayas) :</label>
                    <select
                      value={checkoutForm.wilaya}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, wilaya: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {ALGERIA_69_WILAYAS.map((w) => (
                        <option key={w.code} value={w.name}>
                          {w.codeStr} - {w.name} ({w.nameAr})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-medium mb-1">Adresse ou Commune :</label>
                    <input
                      type="text"
                      value={checkoutForm.address}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      placeholder="Commune, quartier ou point de repère"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-400">Total : </span>
                    <strong className="text-base text-[#ff5000] font-mono">{formatPrice(cartTotal)}</strong>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#fb5200] to-[#ff7300] text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg"
                  >
                    Valider ma commande
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
