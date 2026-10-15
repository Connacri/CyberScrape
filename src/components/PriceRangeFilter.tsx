import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Sparkles,
  Calendar,
  Flame,
  Clock,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export type CatalogSortOption =
  | 'recent'
  | 'oldest'
  | 'updated_desc'
  | 'updated_asc'
  | 'wilaya_asc'
  | 'wilaya_desc'
  | 'category_asc'
  | 'category_desc'
  | 'price_asc'
  | 'price_desc'
  | 'discount'
  | 'discount_desc'
  | 'discount_asc';

interface PriceRangeFilterProps {
  minPrice: number | '';
  maxPrice: number | '';
  onMinPriceChange: (val: number | '') => void;
  onMaxPriceChange: (val: number | '') => void;
  selectedCurrency: string;
  datasetMinPrice: number;
  datasetMaxPrice: number;
  totalProductsCount: number;
  filteredCount: number;
  sortBy: CatalogSortOption;
  onSortByChange: (val: CatalogSortOption) => void;
  onResetPriceFilter: () => void;
  onlyDiscounted?: boolean;
  onToggleOnlyDiscounted?: () => void;
  minDiscountPercent?: number;
  onChangeMinDiscountPercent?: (percent: number) => void;
}

export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  selectedCurrency,
  datasetMinPrice,
  datasetMaxPrice,
  totalProductsCount,
  filteredCount,
  sortBy,
  onSortByChange,
  onResetPriceFilter,
  onlyDiscounted = false,
  onToggleOnlyDiscounted,
  minDiscountPercent = 0,
  onChangeMinDiscountPercent,
}) => {
  const [isCollapsedOnMobile, setIsCollapsedOnMobile] = useState(false);
  const isFilterActive = minPrice !== '' || maxPrice !== '' || onlyDiscounted;
  const isDinar = selectedCurrency === 'DA' || selectedCurrency === 'all';

  // Budget Presets tailored to market
  const presets: { label: string; min: number | ''; max: number | ''; desc?: string }[] = isDinar
    ? [
        { label: 'Tous', min: '', max: '' },
        { label: '< 30k DA', min: '', max: 30000, desc: 'Petits budgets' },
        { label: '30k - 100k DA', min: 30000, max: 100000, desc: 'Moyenne gamme' },
        { label: '100k - 250k DA', min: 100000, max: 250000, desc: 'Flagships & PC' },
        { label: '250k - 500k DA', min: 250000, max: 500000, desc: 'Haut de gamme' },
        { label: '> 500k DA', min: 500000, max: '', desc: 'Autos & Immo' },
      ]
    : [
        { label: 'Tous', min: '', max: '' },
        { label: '< 50 €', min: '', max: 50, desc: 'Entrée de gamme' },
        { label: '50 - 150 €', min: 50, max: 150, desc: 'Accessoires' },
        { label: '150 - 500 €', min: 150, max: 500, desc: 'Tech & Multimédia' },
        { label: '> 500 €', min: 500, max: '', desc: 'Flagships' },
      ];

  const handlePresetClick = (presetMin: number | '', presetMax: number | '') => {
    onMinPriceChange(presetMin);
    onMaxPriceChange(presetMax);
  };

  return (
    <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 backdrop-blur-md shadow-lg font-mono text-xs space-y-3">
      {/* Header bar: Responsive flex column on mobile, row on tablet/desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-cyan-500/20">
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-cyan-300 uppercase">
                  FILTRES AVANCÉS // PRIX & TRIS
                </span>
                {isFilterActive && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[10px] text-[#00ff88] font-bold">
                    {filteredCount}/{totalProductsCount}
                  </span>
                )}
              </div>
              {datasetMaxPrice > 0 && (
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  Fourchette : {datasetMinPrice.toLocaleString('fr-FR')} — {datasetMaxPrice.toLocaleString('fr-FR')} {isDinar ? 'DA' : '€'}
                </span>
              )}
            </div>
          </div>

          {/* Mobile Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsedOnMobile(!isCollapsedOnMobile)}
            className="sm:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Afficher/Masquer filtres de prix"
          >
            {isCollapsedOnMobile ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Sorting Cluster (Responsive wrap) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Quick Sort: Date de mise à jour */}
          <button
            type="button"
            onClick={() => onSortByChange(sortBy === 'updated_desc' ? 'updated_asc' : 'updated_desc')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              sortBy === 'updated_desc' || sortBy === 'updated_asc'
                ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-400 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Trier par date de mise à jour la plus récente"
          >
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>MàJ {sortBy === 'updated_asc' ? '↑ Ancien' : '↓ Récent'}</span>
          </button>

          {/* Quick Sort: Réduction % */}
          <button
            type="button"
            onClick={() => onSortByChange(sortBy === 'discount_desc' || sortBy === 'discount' ? 'discount_asc' : 'discount_desc')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              sortBy === 'discount' || sortBy === 'discount_desc' || sortBy === 'discount_asc'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Trier par pourcentage de réduction"
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>Remise {sortBy === 'discount_asc' ? '↗ Min' : '↘ Max'}</span>
          </button>

          {/* Quick Sort: Prix Croissant / Décroissant */}
          <button
            type="button"
            onClick={() => onSortByChange(sortBy === 'price_asc' ? 'price_desc' : 'price_asc')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              sortBy === 'price_asc' || sortBy === 'price_desc'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Trier par prix croissant ou décroissant"
          >
            {sortBy === 'price_desc' ? (
              <ArrowDownWideNarrow className="w-3 h-3 text-cyan-400" />
            ) : (
              <ArrowUpNarrowWide className="w-3 h-3 text-cyan-400" />
            )}
            <span>Prix {sortBy === 'price_desc' ? '↘ Cher' : '↗ Eco'}</span>
          </button>

          {/* Promotions Only Toggle */}
          {onToggleOnlyDiscounted && (
            <button
              type="button"
              onClick={onToggleOnlyDiscounted}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                onlyDiscounted
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Afficher uniquement les articles ayant une réduction de prix"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Promos %</span>
              {onlyDiscounted && <Check className="w-3 h-3 text-amber-400" />}
            </button>
          )}

          {/* Reset button */}
          {isFilterActive && (
            <button
              type="button"
              onClick={onResetPriceFilter}
              className="px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 hover:text-white flex items-center gap-1 transition-all cursor-pointer text-xs"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Effacer</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Body (Collapsible on mobile) */}
      {!isCollapsedOnMobile && (
        <div className="space-y-3">
          {/* Main Grid: Presets Pills & Custom Min/Max Inputs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Preset Budget Pills (Horizontally scrollable on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Paliers :
              </span>
              {presets.map((p) => {
                const isSelected =
                  (p.min === '' && minPrice === '' && p.max === '' && maxPrice === '') ||
                  (p.min === minPrice && p.max === maxPrice);

                return (
                  <button
                    type="button"
                    key={p.label}
                    onClick={() => handlePresetClick(p.min, p.max)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                    title={p.desc}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Min & Max Inputs (Touch-friendly responsive) */}
            <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-xl border border-slate-800 shrink-0">
              <div className="flex-1 sm:w-28 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">
                  MIN:
                </span>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                    onMinPriceChange(val);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-2 py-1.5 text-xs text-emerald-400 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-400 min-h-[34px]"
                />
              </div>

              <span className="text-slate-500 font-bold">—</span>

              <div className="flex-1 sm:w-28 relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">
                  MAX:
                </span>
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, Number(e.target.value));
                    onMaxPriceChange(val);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-2 py-1.5 text-xs text-emerald-400 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-400 min-h-[34px]"
                />
              </div>

              <span className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-xs font-bold text-slate-300 border border-slate-800 shrink-0">
                {isDinar ? 'DA' : '€'}
              </span>

              {isFilterActive && (
                <button
                  type="button"
                  onClick={onResetPriceFilter}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Effacer prix"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
