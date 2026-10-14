import React from 'react';
import { SlidersHorizontal, DollarSign, X, ArrowUpNarrowWide, ArrowDownWideNarrow, Sparkles } from 'lucide-react';

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
  sortBy: 'price_asc' | 'price_desc' | 'discount' | 'recent';
  onSortByChange: (val: 'price_asc' | 'price_desc' | 'discount' | 'recent') => void;
  onResetPriceFilter: () => void;
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
}) => {
  const isFilterActive = minPrice !== '' || maxPrice !== '';
  const isDinar = selectedCurrency === 'DA' || selectedCurrency === 'all';

  // Budget Presets tailored to market
  const presets: { label: string; min: number | ''; max: number | ''; desc?: string }[] = isDinar
    ? [
        { label: 'Tous', min: '', max: '' },
        { label: '< 30 000 DA', min: '', max: 30000, desc: 'Petits budgets' },
        { label: '30k - 100k DA', min: 30000, max: 100000, desc: 'Moyenne gamme' },
        { label: '100k - 250k DA', min: 100000, max: 250000, desc: 'Flagships & PC' },
        { label: '250k - 500k DA', min: 250000, max: 500000, desc: 'Haut de gamme' },
        { label: '> 500 000 DA', min: 500000, max: '', desc: 'Autos & Immo' },
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
    <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-md shadow-lg font-mono text-xs">
      {/* Top Header: Budget Filter Info & Active Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-cyan-300 uppercase">
                FILTRE PAR GAMME DE PRIX // BUDGET
              </span>
              {isFilterActive && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-[10px] text-[#00ff88] font-bold animate-pulse">
                  ACTIF : {filteredCount}/{totalProductsCount} ARTICLES
                </span>
              )}
            </div>
            {datasetMaxPrice > 0 && (
              <span className="text-[10px] text-slate-400">
                Fourchette globale détectée : {datasetMinPrice.toLocaleString('fr-FR')} {isDinar ? 'DA' : '€'} — {datasetMaxPrice.toLocaleString('fr-FR')} {isDinar ? 'DA' : '€'}
              </span>
            )}
          </div>
        </div>

        {/* Action controls: Sort by price toggle & Reset */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-black/60 p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => onSortByChange('price_asc')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer ${
                sortBy === 'price_asc'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Trier par budget croissant (du moins cher au plus cher)"
            >
              <ArrowUpNarrowWide className="w-3 h-3 text-cyan-400" />
              <span>Prix ↗</span>
            </button>
            <button
              type="button"
              onClick={() => onSortByChange('price_desc')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition-all cursor-pointer ${
                sortBy === 'price_desc'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Trier par budget décroissant (du plus cher au moins cher)"
            >
              <ArrowDownWideNarrow className="w-3 h-3 text-cyan-400" />
              <span>Prix ↘</span>
            </button>
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={onResetPriceFilter}
              className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
              title="Réinitialiser le filtre de budget"
            >
              <X className="w-3 h-3" />
              <span>Effacer</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Filter Grid: Presets Pills & Custom Min/Max Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Preset Budget Pills (Left) */}
        <div className="md:col-span-7 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase mr-1 flex items-center gap-1">
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
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
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

        {/* Custom Min & Max Inputs (Right) */}
        <div className="md:col-span-5 flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-slate-800">
          <div className="flex-1 relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">
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
              className="w-full bg-slate-900 border border-slate-800 rounded pl-10 pr-2 py-1 text-xs text-emerald-400 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <span className="text-slate-500 font-bold">—</span>

          <div className="flex-1 relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold">
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
              className="w-full bg-slate-900 border border-slate-800 rounded pl-10 pr-2 py-1 text-xs text-emerald-400 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <span className="px-2 py-1 rounded bg-slate-900 text-[10px] font-bold text-slate-300 border border-slate-800">
            {isDinar ? 'DA' : '€'}
          </span>
        </div>
      </div>
    </div>
  );
};
