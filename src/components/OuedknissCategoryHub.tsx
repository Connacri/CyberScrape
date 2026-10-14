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
  Play,
  Layers,
  Sparkles,
  ArrowRight,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { OUEDKNISS_CATEGORIES, OuedknissCategoryMeta } from '../data/ouedknissCategories';
import { ScrapedProduct } from '../types';

interface OuedknissCategoryHubProps {
  products: ScrapedProduct[];
  selectedCategorySlug: string | null;
  onSelectCategory: (category: OuedknissCategoryMeta) => void;
  onStartAllCategoriesSweep: () => void;
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
};

export const OuedknissCategoryHub: React.FC<OuedknissCategoryHubProps> = ({
  products,
  selectedCategorySlug,
  onSelectCategory,
  onStartAllCategoriesSweep,
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

  return (
    <div className="rounded-2xl bg-slate-950/90 border border-emerald-500/30 p-4 sm:p-5 backdrop-blur-xl shadow-[0_0_25px_rgba(0,255,102,0.08)] relative overflow-hidden">
      {/* Neon glowing borders */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00ff66]" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00ff66]" />

      {/* Header bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-[#00ff88] border border-emerald-400">
              🇩🇿 OUEDKNISS MATRIX HUB
            </span>
            <span className="text-xs font-mono text-slate-400">
              12 CATÉGORIES OFFICIELLES // MARCHÉ ALGÉRIE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-1">
            Sélectionnez une catégorie pour aspiration ciblée, ou lancez le balayage structuré catégorie par catégorie.
          </p>
        </div>

        {/* Action: Depth Selector & Sweep All Categories */}
        <div className="flex flex-wrap items-center gap-2">
          {onChangeSweepPagesPerCategory && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded-xl">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Profondeur/cat :</span>
              <select
                value={sweepPagesPerCategory}
                onChange={(e) => onChangeSweepPagesPerCategory(Number(e.target.value))}
                disabled={isScrapingActive}
                className="bg-slate-950 border border-slate-700 text-[#00ff88] text-[11px] font-mono rounded px-1.5 py-0.5 focus:outline-none focus:border-emerald-400 cursor-pointer disabled:opacity-50"
              >
                <option value={0}>∞ Illimité (Jusqu'au bout)</option>
                <option value={50}>50 pages (2 400 ads/cat)</option>
                <option value={20}>20 pages (960 ads/cat)</option>
                <option value={15}>15 pages (720 ads/cat)</option>
                <option value={6}>6 pages (288 ads/cat)</option>
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={onStartAllCategoriesSweep}
            disabled={isScrapingActive}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isScrapingActive && activeSweepCategoryIndex !== undefined
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400 animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-[0_0_15px_rgba(0,255,102,0.4)] disabled:opacity-50'
            }`}
          >
            {isScrapingActive && activeSweepCategoryIndex !== undefined ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                ASPIRATION STRUCTURÉE CATÉGORIE ({activeSweepCategoryIndex + 1}/12)...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 text-black" />
                🌟 ASPIRER CATÉGORIE PAR CATÉGORIE ({sweepPagesPerCategory === 0 ? 'Complet' : `${sweepPagesPerCategory * 48} / cat`})
              </>
            )}
          </button>
        </div>
      </div>

      {/* 12 Categories Cyber Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
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
              className={`group relative text-left p-2.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${
                isCurrentlyActiveSweep
                  ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                  : isSelected
                  ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400/60 shadow-[0_0_12px_rgba(0,255,102,0.25)]'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Category Icon & Count Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: `${cat.color}15`,
                    color: cat.color,
                    border: `1px solid ${cat.color}40`,
                  }}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </div>

                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    countInCatalog > 0
                      ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                  title={`${countInCatalog} articles aspirés dans la base`}
                >
                  {countInCatalog > 0 ? `${countInCatalog} art.` : '0'}
                </span>
              </div>

              {/* Title & Arabic */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                  {cat.name}
                </h4>
                <div className="text-[10px] text-slate-500 font-sans truncate">
                  {cat.nameAr}
                </div>
              </div>

              {/* Active / Select Footer */}
              <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono">
                <span className="text-slate-500 truncate">{cat.badge}</span>
                {isSelected ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                ) : (
                  <ArrowRight className="w-2.5 h-2.5 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Discovered Categories Row (Scanner in real-time) */}
      {discoveredCategories.length > 0 && (
        <div className="mt-4 pt-3 border-t border-cyan-500/30 bg-cyan-950/20 p-3 rounded-xl border">
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
