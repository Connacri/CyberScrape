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
} from 'lucide-react';
import { OUEDKNISS_CATEGORIES, OuedknissCategoryMeta } from '../data/ouedknissCategories';
import { ScrapedProduct } from '../types';

interface OuedknissCategoryHubProps {
  products: ScrapedProduct[];
  selectedCategorySlug: string | null;
  onSelectCategory: (category: OuedknissCategoryMeta) => void;
  onStartAllCategoriesSweep: () => void;
  onStopSweep?: () => void;
  isScrapingActive: boolean;
  activeSweepCategoryIndex?: number;
  sweepPagesPerCategory?: number;
  onChangeSweepPagesPerCategory?: (pages: number) => void;
  discoveredCategories?: string[];
  onSelectDiscoveredCategory?: (catName: string) => void;
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
  { val: 5, label: '5p', count: '240 ads' },
  { val: 15, label: '15p', count: '720 ads' },
  { val: 25, label: '25p', count: '1.2k ads' },
  { val: 50, label: '50p', count: '2.4k ads' },
  { val: 100, label: '100p', count: '4.8k ads' },
  { val: 0, label: '∞ Illimité', count: 'Jusqu\'au bout (150p+)' },
];

export const OuedknissCategoryHub: React.FC<OuedknissCategoryHubProps> = ({
  products,
  selectedCategorySlug,
  onSelectCategory,
  onStartAllCategoriesSweep,
  onStopSweep,
  isScrapingActive,
  activeSweepCategoryIndex,
  sweepPagesPerCategory = 0,
  onChangeSweepPagesPerCategory,
  discoveredCategories = [],
  onSelectDiscoveredCategory,
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

        {/* Action Controls: Depth Preset Pills & Primary Action Button */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isCollapsed ? 'Afficher toutes les 17 catégories' : 'Réduire les catégories'}
          >
            <span>{isCollapsed ? 'Déplier' : 'Réduire'}</span>
            <span className="text-[10px] text-emerald-400 font-bold">({OUEDKNISS_CATEGORIES.length})</span>
          </button>

          {onChangeSweepPagesPerCategory && !isCollapsed && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800/90 p-1 rounded-xl shadow-inner">
              <span className="text-[10px] font-mono text-slate-400 uppercase px-1.5 hidden sm:inline">
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
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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

          {/* Primary Action Button (Stateful: Idle vs Scraping Active) */}
          {isScrapingActive ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/60 text-amber-300 font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.25)] animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
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
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-mono text-xs font-black flex items-center gap-1.5 shadow-[0_0_20px_rgba(244,63,94,0.5)] transition-all cursor-pointer animate-bounce"
                  title="Arrêter immédiatement le balayage des catégories"
                >
                  <StopCircle className="w-4 h-4 fill-white/20" />
                  <span>STOPPER</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onStartAllCategoriesSweep}
              className="relative group overflow-hidden px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-mono text-xs font-black text-slate-950 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(0,255,102,0.45)] hover:shadow-[0_0_35px_rgba(0,255,102,0.7)] hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#00ff66] via-emerald-400 to-cyan-300 border border-emerald-300"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
              <Zap className="w-4 h-4 fill-black text-black group-hover:rotate-12 transition-transform" />
              <span className="tracking-wide">
                BALAYER LES 17 CATÉGORIES
              </span>
              <span className="px-1.5 py-0.5 rounded bg-black/85 text-[#00ff88] text-[10px] font-bold border border-emerald-400/50 hidden sm:inline">
                {sweepPagesPerCategory === 0 ? '∞ Illimité' : `${sweepPagesPerCategory * 48}/cat`}
              </span>
            </button>
          )}
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
            <button
              type="button"
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

              {/* Active / Select Footer */}
              <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400 text-[9px] truncate">{cat.badge}</span>
                {isSelected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                )}
              </div>
            </button>
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
