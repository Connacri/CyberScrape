import React from 'react';
import {
  Car,
  Smartphone,
  Laptop,
  Tv,
  Building2,
  Armchair,
  Shirt,
  Gamepad2,
  Briefcase,
  Wrench,
  Hammer,
  Dumbbell,
  Cog,
  Plane,
  Dog,
  Baby,
  Utensils,
  Play,
  Layers,
  Sparkles,
  ArrowRight,
  Globe,
  CheckCircle2,
  StopCircle,
  Infinity as InfinityIcon,
  Zap,
  Activity,
  ShieldCheck,
  Filter,
  Flame,
  User,
  Store,
  Radar,
} from 'lucide-react';
import { OUEDKNISS_CATEGORIES, OuedknissCategoryMeta } from '../data/ouedknissCategories';
import { ScrapedProduct } from '../types';
import {
  ScrapeSweepCheckpoint,
  getScrapedCategoriesRegistry,
  markCategoryAsScraped,
} from '../utils/scrapeCheckpoint';

interface OuedknissCategoryHubProps {
  products: ScrapedProduct[];
  selectedCategorySlug: string | null;
  onSelectCategory: (category: OuedknissCategoryMeta) => void;
  onStartCategoryScrape?: (category: OuedknissCategoryMeta) => void;
  onStartAllCategoriesSweep: () => void;
  onStopSweep?: () => void;
  savedCheckpoint?: ScrapeSweepCheckpoint | null;
  onResumeSweep?: () => void;
  onResetSweep?: () => void;
  isScrapingActive: boolean;
  activeSweepCategoryIndex?: number;
  sweepPagesPerCategory?: number;
  onChangeSweepPagesPerCategory?: (pages: number) => void;
  discoveredCategories?: string[];
  onSelectDiscoveredCategory?: (catName: string) => void;
  targetTypeFilter?: 'all' | 'boutique' | 'annonce' | 'pub';
  onChangeTargetTypeFilter?: (type: 'all' | 'boutique' | 'annonce' | 'pub') => void;
  onOpenAuditModal?: () => void;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Smartphone,
  Laptop,
  Tv,
  Building2,
  Armchair,
  Shirt,
  Gamepad2,
  Briefcase,
  Wrench,
  Hammer,
  Dumbbell,
  Cog,
  Plane,
  Dog,
  Baby,
  Utensils,
};

const DEPTH_PRESETS = [
  { val: 10, label: '10p', count: '280 annonces' },
  { val: 25, label: '25p', count: '700 annonces' },
  { val: 50, label: '50p', count: '1 400 annonces' },
  { val: 100, label: '100p', count: '2 800 annonces' },
  { val: 250, label: '250p', count: '7 000 annonces' },
  { val: 0, label: '∞ Illimité', count: 'Jusqu\'au dernier article réel (28/p)' },
];

export const OuedknissCategoryHub: React.FC<OuedknissCategoryHubProps> = ({
  products,
  selectedCategorySlug,
  onSelectCategory,
  onStartCategoryScrape,
  onStartAllCategoriesSweep,
  onStopSweep,
  savedCheckpoint,
  onResumeSweep,
  onResetSweep,
  isScrapingActive,
  activeSweepCategoryIndex,
  sweepPagesPerCategory = 0,
  onChangeSweepPagesPerCategory,
  discoveredCategories = [],
  onSelectDiscoveredCategory,
  targetTypeFilter = 'all',
  onChangeTargetTypeFilter,
  onOpenAuditModal,
}) => {

  // Count articles present in catalog per category slug or name
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const match = OUEDKNISS_CATEGORIES.find(
        (cat) =>
          cat.name === p.category ||
          p.productUrl?.includes(`/${cat.slug}`) ||
          p.category?.toLowerCase().includes(cat.slug)
      );
      if (match) {
        counts[match.id] = (counts[match.id] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Persistent registry of scraped categories from localStorage
  // Survives page reloads, app restarts, and memory purge
  const [persistentScrapedSlugs, setPersistentScrapedSlugs] = React.useState<string[]>(() => {
    return getScrapedCategoriesRegistry();
  });

  React.useEffect(() => {
    const refreshRegistry = () => {
      setPersistentScrapedSlugs(getScrapedCategoriesRegistry());
    };
    refreshRegistry();
    window.addEventListener('storage', refreshRegistry);
    window.addEventListener('focus', refreshRegistry);
    return () => {
      window.removeEventListener('storage', refreshRegistry);
      window.removeEventListener('focus', refreshRegistry);
    };
  }, [products]);

  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(false);

  // Auto-detect mobile screen on mount to default to compact view
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsCollapsed(true);
    }
  }, []);

  const activeCategory =
    activeSweepCategoryIndex !== undefined ? OUEDKNISS_CATEGORIES[activeSweepCategoryIndex] : null;

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-950/95 via-[#060b17]/95 to-slate-950/95 border border-emerald-500/40 p-3.5 sm:p-5 backdrop-blur-2xl shadow-[0_0_35px_rgba(0,255,102,0.12)] relative overflow-hidden transition-all duration-300">
      {/* Neon glowing corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00ff66]" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00ff66]" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00ff66]" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00ff66]" />

      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-[#00ff88] border border-emerald-400 shadow-[0_0_10px_rgba(0,255,102,0.25)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
              🇩🇿 OUEDKNISS MATRIX HUB
            </span>
            <span className="text-xs font-mono text-slate-300 font-semibold">
              {OUEDKNISS_CATEGORIES.length} CATÉGORIES OFFICIELLES // MARCHÉ ALGÉRIE
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
              {products.length.toLocaleString()} annonces en mémoire
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              Aspiration séquentielle haute vitesse sans blocage ni plafond artificiel. Sélectionnez votre profondeur ci-contre :
            </span>
          </p>
        </div>

        {/* Action Controls: Depth Preset Pills & Primary Action Button (Responsive Wrap) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5 max-w-full">
            {/* Collapse/Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 min-h-[40px]"
              title={isCollapsed ? 'Afficher toutes les 17 catégories' : 'Réduire les catégories'}
            >
              <span>{isCollapsed ? 'Déplier' : 'Réduire'}</span>
              <span className="text-[10px] text-emerald-400 font-bold">({OUEDKNISS_CATEGORIES.length})</span>
            </button>

            {onChangeSweepPagesPerCategory && !isCollapsed && (
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/90 p-1 rounded-xl shadow-inner shrink-0">
                <span className="text-[10px] font-mono text-slate-400 uppercase px-1.5 hidden md:inline">
                  Profondeur :
                </span>
                <div className="flex items-center gap-1">
                  {DEPTH_PRESETS.map((dp) => {
                    const isSelected = sweepPagesPerCategory === dp.val;
                    return (
                      <button
                        key={dp.val}
                        type="button"
                        disabled={isScrapingActive}
                        onClick={() => onChangeSweepPagesPerCategory(dp.val)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px] ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-500 to-[#00ff88] text-slate-950 shadow-[0_0_12px_rgba(0,255,102,0.4)]'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                        title={`${dp.label} - ${dp.count}`}
                      >
                        {dp.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Category Status & Focus Indicator (No redundant scrape buttons) */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isScrapingActive ? (
              <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse min-h-[40px]">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                <span>
                  ASPIRATION EN COURS ({activeSweepCategoryIndex !== undefined ? activeSweepCategoryIndex + 1 : 1}/{OUEDKNISS_CATEGORIES.length})
                </span>
                {activeCategory && (
                  <span className="hidden sm:inline text-amber-200">
                    : {activeCategory.name}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {(() => {
                  const focusedCat = OUEDKNISS_CATEGORIES.find((c) => c.slug === selectedCategorySlug) || OUEDKNISS_CATEGORIES[0];
                  return (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-[#00ff88] font-mono text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-slate-400">Ciblée :</span>
                      <span className="font-bold text-white">{focusedCat.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        {focusedCat.realPages || 473} pages
                      </span>
                    </div>
                  );
                })()}

                {onOpenAuditModal && (
                  <button
                    type="button"
                    onClick={onOpenAuditModal}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
                    title="Cartographie des 17 catégories"
                  >
                    <Radar className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Audit</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Distinction Bar: Catégories Exactes, Boutiques, Annonces & Pubs (Avant l'aspiration) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 mb-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            CIBLAGE AVANT ASPIRATION :
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => onChangeTargetTypeFilter && onChangeTargetTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                targetTypeFilter === 'all'
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400 shadow-sm'
                  : 'bg-black/40 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              🌟 Tout cibler
            </button>
            <button
              type="button"
              onClick={() => onChangeTargetTypeFilter && onChangeTargetTypeFilter('boutique')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                targetTypeFilter === 'boutique'
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400 shadow-sm'
                  : 'bg-black/40 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Store className="w-3 h-3 text-emerald-400" />
              🏪 Boutiques & Stores Certifiés
            </button>
            <button
              type="button"
              onClick={() => onChangeTargetTypeFilter && onChangeTargetTypeFilter('annonce')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                targetTypeFilter === 'annonce'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-sm'
                  : 'bg-black/40 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <User className="w-3 h-3 text-cyan-400" />
              👤 Annonces Particuliers
            </button>
            <button
              type="button"
              onClick={() => onChangeTargetTypeFilter && onChangeTargetTypeFilter('pub')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                targetTypeFilter === 'pub'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-sm'
                  : 'bg-black/40 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              📢 Pubs & Annonces Sponsorisées
            </button>
          </div>
        </div>
        <div className="text-[11px] text-cyan-400">
          Catégorie active : <strong className="text-white">{OUEDKNISS_CATEGORIES.find((c) => c.slug === selectedCategorySlug)?.name || 'Toutes'}</strong>
        </div>
      </div>

      {/* 17 Categories Cyber Grid (Collapsible for Clean Mobile View) */}
      {!isCollapsed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5 animate-fadeIn">
        {OUEDKNISS_CATEGORIES.map((cat, idx) => {
          const IconComp = CATEGORY_ICONS[cat.icon] || Globe;
          const isSelected = selectedCategorySlug === cat.slug;
          const isCurrentlyActiveSweep = activeSweepCategoryIndex === idx;
          const countInCatalog = categoryCounts[cat.id] || 0;
          const isPersistentScraped =
            persistentScrapedSlugs.includes(cat.id.toLowerCase()) ||
            persistentScrapedSlugs.includes(cat.slug.toLowerCase()) ||
            persistentScrapedSlugs.includes(cat.name.toLowerCase());
          const hasBeenScraped = countInCatalog > 0 || isPersistentScraped;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className={`group relative text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                isCurrentlyActiveSweep
                  ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse'
                  : isSelected
                  ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_20px_rgba(0,255,102,0.35)]'
                  : hasBeenScraped
                  ? 'bg-emerald-950/45 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-[0_0_15px_rgba(0,255,102,0.22)] hover:border-emerald-400 hover:bg-emerald-900/40'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/90'
              }`}
            >
              {/* Category Icon & Real Count Header */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                  style={{
                    backgroundColor: hasBeenScraped ? 'rgba(0, 255, 102, 0.25)' : `${cat.color}20`,
                    color: hasBeenScraped ? '#00ff88' : cat.color,
                    border: hasBeenScraped ? '1px solid rgba(0, 255, 102, 0.6)' : `1px solid ${cat.color}50`,
                  }}
                >
                  <IconComp className="w-4 h-4" />
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 ${
                    isCurrentlyActiveSweep
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400 font-mono animate-pulse'
                      : hasBeenScraped
                      ? 'bg-emerald-500/25 text-[#00ff88] border border-emerald-400/80 shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                  }`}
                  title={`${countInCatalog} annonces réelles aspirées dans cette catégorie`}
                >
                  {isCurrentlyActiveSweep ? (
                    '⚡ En cours...'
                  ) : hasBeenScraped ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-[#00ff66]" />
                      <span>{countInCatalog > 0 ? `${countInCatalog.toLocaleString()} art.` : '✓ Aspiré'}</span>
                    </>
                  ) : (
                    `${countInCatalog.toLocaleString()} art.`
                  )}
                </span>
              </div>

              {/* Title & Arabic */}
              <div>
                <h4 className={`text-xs font-mono font-bold transition-colors truncate ${
                  hasBeenScraped ? 'text-[#00ff88]' : 'text-slate-100 group-hover:text-[#00ff88]'
                }`}>
                  {cat.name}
                </h4>
                <div className="text-[10px] text-slate-400 font-sans truncate mt-0.5">
                  {cat.nameAr}
                </div>
              </div>

              {/* Action Footer: Badge + Quick Direct Aspirer Button */}
              <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <div className="flex flex-col min-w-0 pr-1 leading-tight">
                  <span className="text-slate-400 text-[9px] truncate">{cat.badge}</span>
                  <span className="text-cyan-400 text-[8.5px] truncate font-mono">
                    {Math.ceil(cat.countEstimate / 30).toLocaleString('fr-FR')} pages • ~{Math.round(cat.countEstimate * 0.22).toLocaleString('fr-FR')} stores
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markCategoryAsScraped(cat.id);
                    markCategoryAsScraped(cat.slug);
                    markCategoryAsScraped(cat.name);
                    setPersistentScrapedSlugs(getScrapedCategoriesRegistry());
                    onSelectCategory(cat);
                    if (onStartCategoryScrape) {
                      onStartCategoryScrape(cat);
                    }
                  }}
                  className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                    hasBeenScraped
                      ? 'bg-emerald-500/30 hover:bg-[#00ff66] text-[#00ff88] hover:text-black border border-emerald-400/60'
                      : 'bg-emerald-500/20 hover:bg-[#00ff66] text-[#00ff88] hover:text-black border border-emerald-500/40'
                  }`}
                  title={`Lancer l'aspiration immédiate de "${cat.name}"`}
                >
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>Aspirer</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}


      {/* Discovered Categories Row (Scanner in real-time) */}
      {discoveredCategories.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-cyan-500/30 bg-cyan-950/20 p-3.5 rounded-xl border shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                ⚡ SCANNER // NOUVELLES CATÉGORIES DÉCOUVERTES EN DIRECT ({discoveredCategories.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80">
              Détectées et intégrées dynamiquement au catalogue
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {discoveredCategories.map((catName) => {
              const countInProducts = products.filter((p) => p.category === catName).length;
              return (
                <button
                  type="button"
                  key={catName}
                  onClick={() => onSelectDiscoveredCategory && onSelectDiscoveredCategory(catName)}
                  className="px-2.5 py-1 rounded-lg bg-cyan-900/40 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-800/50 hover:border-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.2)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-bold">{catName}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 text-cyan-300">
                    {countInProducts} art.
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
