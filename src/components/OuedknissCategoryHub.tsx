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
import { ScrapeSweepCheckpoint } from '../utils/scrapeCheckpoint';

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
  { val: 10, label: '10p', count: '480 ads' },
  { val: 25, label: '25p', count: '1.2k ads' },
  { val: 50, label: '50p', count: '2.4k ads' },
  { val: 100, label: '100p', count: '4.8k ads' },
  { val: 250, label: '250p', count: '12k ads' },
  { val: 0, label: '∞ Illimité', count: 'Sans limite (+50k ads)' },
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

          {/* Primary Action Button (Stateful: Idle vs Scraping Active) */}
          {isScrapingActive ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse min-h-[44px]">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                <span>
                  ASPIRATION ({activeSweepCategoryIndex !== undefined ? activeSweepCategoryIndex + 1 : 1}/{OUEDKNISS_CATEGORIES.length})
                </span>
                {activeCategory && (
                  <span className="hidden xl:inline text-amber-200 font-mono max-w-[150px] truncate">
                    : {activeCategory.name}
                  </span>
                )}
              </div>

              {onStopSweep && (
                <button
                  type="button"
                  onClick={onStopSweep}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all cursor-pointer min-h-[44px]"
                  title="Arrêter immédiatement le balayage des catégories"
                >
                  <StopCircle className="w-4 h-4 fill-white/20 shrink-0" />
                  <span>STOP</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {/* Button 0: Resume In-Progress Sweep if checkpoint exists */}
              {savedCheckpoint && onResumeSweep && (
                <button
                  type="button"
                  onClick={onResumeSweep}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 hover:from-cyan-400 hover:to-emerald-300 font-mono text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.4)] min-h-[44px] animate-pulse"
                  title={`Reprendre l'aspiration à la catégorie ${savedCheckpoint.categoryIndex + 1}/${OUEDKNISS_CATEGORIES.length} (${savedCheckpoint.categoryName}), page ${savedCheckpoint.currentPage || 1}`}
                >
                  <Play className="w-4 h-4 fill-slate-950 text-slate-950 shrink-0" />
                  <span className="tracking-wide whitespace-nowrap">
                    REPRENDRE : CAT. {savedCheckpoint.categoryIndex + 1} (P.{savedCheckpoint.currentPage || 1})
                  </span>
                </button>
              )}

              {/* Button 1: Direct Category Scrape (functions identically to the bottom input scrape button) */}
              <button
                type="button"
                onClick={() => {
                  const selectedCat = OUEDKNISS_CATEGORIES.find((c) => c.slug === selectedCategorySlug) || OUEDKNISS_CATEGORIES[0];
                  if (onStartCategoryScrape) {
                    onStartCategoryScrape(selectedCat);
                  } else {
                    onSelectCategory(selectedCat);
                  }
                }}
                className="w-full sm:w-auto relative group overflow-hidden px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs font-black text-slate-950 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(0,255,102,0.45)] hover:shadow-[0_0_35px_rgba(0,255,102,0.7)] hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#00ff66] via-emerald-400 to-cyan-300 border border-emerald-300 min-h-[44px]"
                title={`Aspirer immédiatement la catégorie "${OUEDKNISS_CATEGORIES.find((c) => c.slug === selectedCategorySlug)?.name || 'sélectionnée'}"`}
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <Zap className="w-4 h-4 fill-black text-black group-hover:rotate-12 transition-transform shrink-0" />
                <span className="tracking-wide whitespace-nowrap">
                  ASPIRER : {(OUEDKNISS_CATEGORIES.find((c) => c.slug === selectedCategorySlug)?.name || 'CETTE CATÉGORIE').toUpperCase()}
                </span>
              </button>

              {/* Button: Reconnaissance Audit Pre-Flight */}
              {onOpenAuditModal && (
                <button
                  type="button"
                  onClick={onOpenAuditModal}
                  className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] shadow-[0_0_12px_rgba(0,240,255,0.25)]"
                  title="Scanner et auditer les 17 catégories : pages, articles, boutiques et pubs"
                >
                  <Radar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="tracking-wide whitespace-nowrap">AUDITER LES 17 CATÉGORIES</span>
                </button>
              )}

              {/* Button 2: Sequential 17 Categories Sweep */}
              <button
                type="button"
                onClick={onStartAllCategoriesSweep}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-[#00ff88] hover:bg-emerald-950/50 hover:border-emerald-400 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                title={savedCheckpoint ? "Recommencer le balayage des 17 catégories depuis le début" : "Aspirer toutes les 17 catégories l'une après l'autre"}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="tracking-wide whitespace-nowrap">
                  {savedCheckpoint ? 'RECOMMENCER LES 17 CATÉGORIES' : 'BALAYER LES 17 CATÉGORIES'}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-black/85 text-[#00ff88] text-[10px] font-bold border border-emerald-400/50 hidden sm:inline">
                  {sweepPagesPerCategory === 0 ? '∞ Illimité' : `${sweepPagesPerCategory * 48}/cat`}
                </span>
              </button>
            </div>
          )}
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

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className={`group relative text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                isCurrentlyActiveSweep
                  ? 'bg-amber-950/50 border-amber-400 ring-2 ring-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse'
                  : isSelected
                  ? 'bg-emerald-950/50 border-emerald-400 ring-1 ring-emerald-400/60 shadow-[0_0_15px_rgba(0,255,102,0.25)]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/90'
              }`}
            >
              {/* Category Icon & Real Count Header */}
              <div className="flex items-center justify-between mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
                  style={{
                    backgroundColor: `${cat.color}20`,
                    color: cat.color,
                    border: `1px solid ${cat.color}50`,
                  }}
                >
                  <IconComp className="w-4 h-4" />
                </div>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold transition-all ${
                    isCurrentlyActiveSweep
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-400 font-mono animate-pulse'
                      : countInCatalog > 0
                      ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400/50 shadow-[0_0_8px_rgba(0,255,102,0.2)]'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/50'
                  }`}
                  title={`${countInCatalog} annonces réelles aspirées dans cette catégorie`}
                >
                  {isCurrentlyActiveSweep ? '⚡ En cours...' : `${countInCatalog.toLocaleString()} art.`}
                </span>
              </div>

              {/* Title & Arabic */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-100 group-hover:text-[#00ff88] transition-colors truncate">
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
                    onSelectCategory(cat);
                    if (onStartCategoryScrape) {
                      onStartCategoryScrape(cat);
                    }
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-[#00ff66] text-[#00ff88] hover:text-black border border-emerald-500/40 font-mono font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
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
