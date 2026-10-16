import React, { useState } from 'react';
import {
  Zap,
  Square,
  CheckCircle2,
  Radio,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  RefreshCw,
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
  Globe,
  Radar,
} from 'lucide-react';
import { OUEDKNISS_CATEGORIES, OuedknissCategoryMeta } from '../data/ouedknissCategories';
import { ScrapedProduct } from '../types';

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

import { ScrapeSweepCheckpoint } from '../utils/scrapeCheckpoint';

interface GlobalSweepProgressBarProps {
  isActive: boolean;
  isComplete: boolean;
  currentCategoryIndex?: number;
  currentPage?: number;
  totalPagesPerCategory?: number;
  currentCategoryTotalPages?: number;
  currentCategoryTotalArticles?: number;
  currentCategoryBoutiques?: number;
  currentCategoryAdsPubs?: number;
  categoryNewItemsCount?: number;
  lastPageBatchStats?: {
    page: number;
    itemsCount: number;
    boutiquesCount: number;
    particuliersCount: number;
    adsCount: number;
  } | null;
  isInitialScanRunning?: boolean;
  initialScanSummary?: {
    totalCategories: number;
    totalMarketPages: number;
    totalMarketArticles: number;
    totalBoutiques: number;
    totalAdsPubs: number;
  } | null;
  percent: number;
  newItemsCount: number;
  totalCatalogCount: number;
  completedCategorySlugs: string[];
  products: ScrapedProduct[];
  sweepPagesPerCategory: number;
  onChangeSweepPagesPerCategory: (pages: number) => void;
  onStartSweep: () => void;
  onStopSweep: () => void;
  savedCheckpoint?: ScrapeSweepCheckpoint | null;
  onResumeSweep?: () => void;
  onSelectCategory?: (category: OuedknissCategoryMeta) => void;
  onOpenAuditModal?: () => void;
}

export const GlobalSweepProgressBar: React.FC<GlobalSweepProgressBarProps> = ({
  isActive,
  isComplete,
  currentCategoryIndex,
  currentPage = 1,
  totalPagesPerCategory = 10,
  currentCategoryTotalPages,
  currentCategoryTotalArticles,
  currentCategoryBoutiques,
  currentCategoryAdsPubs,
  categoryNewItemsCount = 0,
  lastPageBatchStats,
  isInitialScanRunning = false,
  initialScanSummary,
  percent,
  newItemsCount,
  totalCatalogCount,
  completedCategorySlugs,
  products,
  sweepPagesPerCategory,
  onChangeSweepPagesPerCategory,
  onStartSweep,
  onStopSweep,
  savedCheckpoint,
  onResumeSweep,
  onSelectCategory,
  onOpenAuditModal,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const totalCategories = OUEDKNISS_CATEGORIES.length; // 17
  const currentCategory =
    currentCategoryIndex !== undefined && currentCategoryIndex >= 0 && currentCategoryIndex < totalCategories
      ? OUEDKNISS_CATEGORIES[currentCategoryIndex]
      : null;

  const nextCategory =
    currentCategoryIndex !== undefined && currentCategoryIndex + 1 < totalCategories
      ? OUEDKNISS_CATEGORIES[currentCategoryIndex + 1]
      : null;

  // Calculate existing catalog coverage: how many of the 17 categories currently have at least 1 product
  const categoryCounts = OUEDKNISS_CATEGORIES.map((cat) => {
    const count = products.filter(
      (p) =>
        p.category?.toLowerCase() === cat.name.toLowerCase() ||
        p.category?.toLowerCase().includes(cat.slug.toLowerCase()) ||
        (p.productUrl && p.productUrl.toLowerCase().includes(cat.slug.toLowerCase()))
    ).length;
    return { ...cat, productCount: count };
  });

  const categoriesWithProducts = categoryCounts.filter((c) => c.productCount > 0).length;
  const coveragePercent = Math.round((categoriesWithProducts / totalCategories) * 100);

  // Clamp percentage between 0 and 100
  const displayPercent = Math.min(100, Math.max(0, isActive ? percent : isComplete ? 100 : coveragePercent));

  return (
    <div className="w-full bg-slate-950/95 border-b border-emerald-500/30 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all">
      {/* Top Laser Accent Line */}
      <div className="relative h-1 w-full bg-slate-900 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.8)]'
              : isComplete
              ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
              : 'bg-emerald-500/40'
          }`}
          style={{ width: `${displayPercent}%` }}
        />
        {isActive && (
          <div
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-[shimmer_1.5s_infinite]"
            style={{
              animation: 'marquee 2s linear infinite',
            }}
          />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        {/* Main HUD Bar Line */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Block: Status & Category Context */}
          <div className="flex items-center gap-3">
            {/* Status Radar Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase border transition-all ${
                isActive
                  ? 'bg-emerald-950/80 border-emerald-400 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,102,0.3)] animate-pulse'
                  : isComplete
                  ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              {isActive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
                  <span>BALAYAGE ACTIF // 17 CATÉGORIES</span>
                </>
              ) : isComplete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>BALAYAGE COMPLET // 100% SCELLÉ</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  <span>RADAR 17 CATÉGORIES OUEDKNISS</span>
                </>
              )}
            </div>

            {/* Current Active Category / Global Context */}
            {isInitialScanRunning ? (
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-bold">SCAN PRÉ-VOL // 17 CATÉGORIES EN COURS...</span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  (Audit des pages, articles, boutiques et pubs)
                </span>
              </div>
            ) : isActive && currentCategory ? (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 hidden md:inline">Progression :</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1.5">
                  <span className="text-[#00ff88] font-bold">
                    Catégorie {(currentCategoryIndex ?? 0) + 1}/{totalCategories}
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="truncate max-w-[180px] sm:max-w-[260px]">{currentCategory.name}</span>
                </span>
                <span className="text-cyan-300 font-bold text-[11px] bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded">
                  Page {currentPage} / {(currentCategoryTotalPages || totalPagesPerCategory).toLocaleString('fr-FR')} existantes
                </span>
                {nextCategory && (
                  <span className="text-slate-400 text-[10px] hidden lg:inline">
                    (Suivante: {nextCategory.name.split(' ')[0]})
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="hidden sm:inline">Couverture catalogue :</span>
                <span className="text-emerald-400 font-bold">
                  {categoriesWithProducts}/{totalCategories} Catégories indexées
                </span>
                <span className="text-slate-500 hidden lg:inline">
                  ({totalCatalogCount.toLocaleString()} articles en mémoire)
                </span>
              </div>
            )}
          </div>

          {/* Center / Right: Progress Metric + Actions */}
          <div className="flex items-center gap-3">
            {/* Real-time Percentage Indicator */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-base sm:text-lg font-black font-mono leading-none tracking-tight flex items-baseline gap-1">
                  <span
                    className={`transition-colors ${
                      isActive ? 'text-[#00ff88]' : isComplete ? 'text-cyan-300' : 'text-slate-200'
                    }`}
                  >
                    {displayPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-sans">
                    {isActive ? 'Progression' : 'Couverture'}
                  </span>
                </div>
                {isActive && newItemsCount > 0 && (
                  <div className="text-[10px] font-mono text-cyan-400">
                    +{newItemsCount} articles aspirés
                  </div>
                )}
              </div>
            </div>

            {/* Actions: Start / Stop Controls */}
            {isActive ? (
              <button
                onClick={onStopSweep}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer animate-pulse"
                title="Stopper le balayage global immédiatement"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stopper</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {/* Quick depth selector */}
                <div className="hidden md:flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-[11px] font-mono">
                  {[
                    { label: '5p', val: 5 },
                    { label: '25p', val: 25 },
                    { label: '50p', val: 50 },
                    { label: '100p', val: 100 },
                    { label: '∞ Illimité', val: 0 },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => onChangeSweepPagesPerCategory(opt.val)}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        sweepPagesPerCategory === opt.val
                          ? 'bg-emerald-500/25 text-[#00ff88] border border-emerald-400/50 font-bold shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Resume button if checkpoint exists */}
                {savedCheckpoint && onResumeSweep && (
                  <button
                    onClick={onResumeSweep}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 text-xs font-mono font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] animate-pulse"
                    title={`Reprendre l'aspiration à la catégorie ${savedCheckpoint.categoryIndex + 1}/${totalCategories} (${savedCheckpoint.categoryName}), page ${savedCheckpoint.currentPage || 1}`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>Reprendre (Cat. {savedCheckpoint.categoryIndex + 1} p.{savedCheckpoint.currentPage || 1})</span>
                  </button>
                )}

                {onOpenAuditModal && (
                  <button
                    type="button"
                    onClick={onOpenAuditModal}
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900/60 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
                    title="Audit pré-vol : scanner le nombre de pages, articles, boutiques et pubs de chaque catégorie"
                  >
                    <Radar className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Audit Pré-Vol</span>
                  </button>
                )}

                <button
                  onClick={onStartSweep}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-[#00ff88] text-slate-950 hover:from-emerald-400 hover:to-cyan-300 text-xs font-mono font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.35)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  title={savedCheckpoint ? "Recommencer depuis la 1ère catégorie" : "Démarrer l'aspiration séquentielle des 17 catégories Ouedkniss"}
                >
                  <Globe className="w-3.5 h-3.5 text-slate-950" />
                  <span>{savedCheckpoint ? 'Recommencer (17 Cat.)' : 'Balayer les 17 Catégories'}</span>
                </button>
              </div>
            )}

            {/* Toggle 17 Categories Micro-Matrix */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={isExpanded ? 'Réduire la matrice des 17 catégories' : 'Afficher les 17 catégories en temps réel'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Global Continuous Progress Gauge */}
        <div className="relative mt-2 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 relative ${
              isActive
                ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.6)]'
                : isComplete
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                : 'bg-emerald-500/40'
            }`}
            style={{ width: `${Math.max(1, displayPercent)}%` }}
          >
            {isActive && (
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            )}
          </div>
        </div>

        {/* Real-time Category Page-by-Page Tracking Banner */}
        {isActive && currentCategory && (
          <div className="mt-2.5 p-2 rounded-xl bg-slate-900/90 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Radar className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>SUIVI CATÉGORIE EN DIRECT :</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40">
                Page {currentPage} sur {(currentCategoryTotalPages || totalPagesPerCategory).toLocaleString('fr-FR')} existantes
              </span>
              {currentCategoryTotalArticles && (
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  (~{currentCategoryTotalArticles.toLocaleString('fr-FR')} articles • ~{currentCategoryBoutiques?.toLocaleString('fr-FR')} Stores • ~{currentCategoryAdsPubs?.toLocaleString('fr-FR')} Pubs)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              {lastPageBatchStats && (
                <span className="text-[#00ff88] font-bold">
                  +{lastPageBatchStats.itemsCount} articles sur page {lastPageBatchStats.page} ({lastPageBatchStats.boutiquesCount} Stores, {lastPageBatchStats.particuliersCount} Part., {lastPageBatchStats.adsCount} Pubs)
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold">
                Total catégorie : {categoryNewItemsCount} articles
              </span>
              {nextCategory && (
                <span className="text-cyan-400 text-[10px] hidden md:inline">
                  → Passage auto dès fin : {nextCategory.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Initial Pre-Flight Scan Alert Banner */}
        {isInitialScanRunning && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-950/80 border border-[#00ff88]/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono animate-pulse shadow-[0_0_15px_rgba(0,255,102,0.3)]">
            <div className="flex items-center gap-2 text-[#00ff88] font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping" />
              <span>SCAN INITIAL DES 17 CATÉGORIES EN COURS : Cartographie des pages, articles, boutiques et pubs...</span>
            </div>
            {initialScanSummary && (
              <span className="text-cyan-300 text-[11px] font-bold">
                {initialScanSummary.totalCategories} Catégories • {initialScanSummary.totalMarketPages.toLocaleString('fr-FR')} Pages • ~{initialScanSummary.totalBoutiques.toLocaleString('fr-FR')} Boutiques • ~{initialScanSummary.totalAdsPubs.toLocaleString('fr-FR')} Pubs
              </span>
            )}
          </div>
        )}

        {/* Collapsible 17-Categories Real-Time Micro-Segments */}
        {isExpanded && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>ÉTAT DES 17 CATÉGORIES OUEDKNISS :</span>
              </span>
              <span className="text-slate-500">
                {isActive
                  ? `Étape ${((currentCategoryIndex ?? 0) * totalPagesPerCategory) + currentPage} / ${totalCategories * totalPagesPerCategory} pages`
                  : `${categoriesWithProducts} couvertes sur ${totalCategories}`}
              </span>
            </div>

            <div className="grid grid-cols-4 min-[420px]:grid-cols-6 sm:grid-cols-9 md:grid-cols-17 gap-1.5 sm:gap-1">
              {OUEDKNISS_CATEGORIES.map((cat, idx) => {
                const IconComponent = CATEGORY_ICONS[cat.icon] || Globe;
                const isCurrent = isActive && currentCategoryIndex === idx;
                const isCompleted =
                  completedCategorySlugs.includes(cat.slug) ||
                  (isActive && currentCategoryIndex !== undefined && idx < currentCategoryIndex);
                const hasExistingProducts = (categoryCounts[idx]?.productCount ?? 0) > 0;

                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory && onSelectCategory(cat)}
                    className={`relative p-1.5 sm:p-1 rounded-lg border text-left flex flex-col justify-between transition-all group cursor-pointer min-h-[42px] sm:min-h-0 ${
                      isCurrent
                        ? 'bg-cyan-950/90 border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.4)] scale-105 z-10'
                        : isCompleted
                        ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                        : hasExistingProducts
                        ? 'bg-slate-900/80 border-slate-700/80 text-slate-300 hover:border-slate-500'
                        : 'bg-slate-950/50 border-slate-800/50 text-slate-600 hover:border-slate-700'
                    }`}
                    title={`${idx + 1}. ${cat.name} (${cat.countEstimate.toLocaleString()} annonces estimées) - ${
                      isCurrent
                        ? 'En cours d aspiration...'
                        : isCompleted
                        ? 'Balayage scellé'
                        : hasExistingProducts
                        ? `${categoryCounts[idx]?.productCount} articles en mémoire`
                        : 'En attente'
                    }`}
                  >
                    {/* Top Row: Index and Icon */}
                    <div className="flex items-center justify-between gap-0.5">
                      <span
                        className={`text-[9px] font-mono font-bold ${
                          isCurrent
                            ? 'text-cyan-300'
                            : isCompleted
                            ? 'text-[#00ff88]'
                            : hasExistingProducts
                            ? 'text-slate-400'
                            : 'text-slate-600'
                        }`}
                      >
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {isCurrent ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#00ff88]" />
                      ) : (
                        <IconComponent className="w-2.5 h-2.5 opacity-60" />
                      )}
                    </div>

                    {/* Bottom: Short Category Label */}
                    <div
                      className={`text-[8px] font-mono truncate mt-0.5 ${
                        isCurrent
                          ? 'text-white font-bold'
                          : isCompleted
                          ? 'text-emerald-200'
                          : hasExistingProducts
                          ? 'text-slate-400'
                          : 'text-slate-600'
                      }`}
                    >
                      {cat.name.split(' ')[0]}
                    </div>

                    {/* Active Radar Wave */}
                    {isCurrent && (
                      <div className="absolute inset-0 border border-cyan-400 rounded animate-pulse pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
