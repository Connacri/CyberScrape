import React, { useState } from 'react';
import {
  SlidersHorizontal,
  MapPin,
  Tag,
  DollarSign,
  Sparkles,
  RotateCcw,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Check,
  Flame,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ALGERIA_69_WILAYAS } from '../data/algeriaWilayas';
import { CatalogSortOption } from './PriceRangeFilter';
import { cyberAudio } from '../utils/cyberAudio';

export type ProductCondition = 'all' | 'neuf' | 'occasion' | 'reconditionne';

interface AdvancedCatalogFilterPanelProps {
  // Wilaya
  selectedWilaya: string;
  onWilayaChange: (wilaya: string) => void;
  wilayaStats: { name: string; count: number }[];

  // Fourchette de prix
  minPrice: number | '';
  maxPrice: number | '';
  onMinPriceChange: (val: number | '') => void;
  onMaxPriceChange: (val: number | '') => void;
  datasetMinPrice: number;
  datasetMaxPrice: number;
  selectedCurrency: string;

  // État (Neuf / Occasion / Reconditionné)
  selectedCondition: ProductCondition;
  onConditionChange: (condition: ProductCondition) => void;
  conditionCounts: {
    neuf: number;
    occasion: number;
    reconditionne: number;
    total: number;
  };

  // Tris
  sortBy: CatalogSortOption;
  onSortByChange: (sort: CatalogSortOption) => void;

  // Global counts & reset
  totalProductsCount: number;
  filteredCount: number;
  onResetAllFilters: () => void;
}

const TOP_WILAYAS = [
  'Alger',
  'Oran',
  'Constantine',
  'Sétif',
  'Blida',
  'Annaba',
  'Tizi Ouzou',
  'Batna',
  'Béjaïa',
  'Tlemcen',
];

const PRICE_PRESETS: { label: string; min: number | ''; max: number | ''; desc: string }[] = [
  { label: 'Tous les prix', min: '', max: '', desc: 'Aucune limite' },
  { label: '< 20 000 DA', min: '', max: 20000, desc: 'Petits budgets' },
  { label: '20k - 50k DA', min: 20000, max: 50000, desc: 'Entrée / Milieu' },
  { label: '50k - 100k DA', min: 50000, max: 100000, desc: 'Smartphones & Tech' },
  { label: '100k - 250k DA', min: 100000, max: 250000, desc: 'Laptops & Flagships' },
  { label: '> 250 000 DA', min: 250000, max: '', desc: 'Autos & Immo' },
];

export const AdvancedCatalogFilterPanel: React.FC<AdvancedCatalogFilterPanelProps> = ({
  selectedWilaya,
  onWilayaChange,
  wilayaStats,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  datasetMinPrice,
  datasetMaxPrice,
  selectedCurrency,
  selectedCondition,
  onConditionChange,
  conditionCounts,
  sortBy,
  onSortByChange,
  totalProductsCount,
  filteredCount,
  onResetAllFilters,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [wilayaSearch, setWilayaSearch] = useState('');

  const isDinar = selectedCurrency === 'DA' || selectedCurrency === 'all';
  const currencySymbol = isDinar ? 'DA' : '€';

  // Count active filters
  const activeFiltersCount =
    (selectedWilaya !== 'all' ? 1 : 0) +
    (minPrice !== '' || maxPrice !== '' ? 1 : 0) +
    (selectedCondition !== 'all' ? 1 : 0);

  const handleSortChange = (newSort: CatalogSortOption, vocalLabel?: string) => {
    cyberAudio.playClick();
    onSortByChange(newSort);
    if (vocalLabel) {
      cyberAudio.speakSortApplied(vocalLabel);
    }
  };

  // Filter Wilayas by search
  const filteredWilayasList = ALGERIA_69_WILAYAS.filter((w) => {
    if (!wilayaSearch.trim()) return true;
    const q = wilayaSearch.toLowerCase().trim();
    return (
      w.name.toLowerCase().includes(q) ||
      w.codeStr.includes(q) ||
      w.nameAr.includes(q)
    );
  });

  return (
    <div className="rounded-2xl bg-slate-950/95 border border-cyan-500/40 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.6)] font-mono text-xs overflow-hidden transition-all">
      {/* ============================================================== */}
      {/* 1. HEADER BAR: TOGGLE & ACTIVE FILTERS TELEMETRY                */}
      {/* ============================================================== */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-cyan-950/40 border-b border-cyan-500/25 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.3)] shrink-0">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wide text-white font-mono flex items-center gap-2">
                FILTRES AVANCÉS & TRIS // TEMPS RÉEL
              </span>
              {activeFiltersCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-[10px] text-cyan-300 font-bold animate-pulse">
                  {activeFiltersCount} actif{activeFiltersCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400">
                  Prêt
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Filtrage instantané par Wilaya (58/69), Fourchette de prix DA et État (Neuf / Occasion)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Results Counter */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] flex items-center gap-1.5">
            <span className="text-slate-400">Résultats :</span>
            <span className="text-[#00ff88] font-black text-sm">
              {filteredCount.toLocaleString('fr-FR')}
            </span>
            <span className="text-slate-500">/ {totalProductsCount.toLocaleString('fr-FR')}</span>
          </div>

          {/* Reset All Button */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => {
                cyberAudio.playClick();
                onResetAllFilters();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 hover:bg-rose-900 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(244,63,94,0.2)]"
              title="Réinitialiser tous les filtres"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Réinitialiser</span>
            </button>
          )}

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            title={isOpen ? 'Réduire le panneau de filtres' : 'Déplier le panneau de filtres'}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BODY CONTENT (COLLAPSIBLE)                                  */}
      {/* ============================================================== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="p-3 sm:p-5 space-y-4"
          >
            {/* Active filter chips row */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                  Actifs :
                </span>
                {selectedWilaya !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-[11px] font-bold">
                    <MapPin className="w-3 h-3" />
                    <span>Wilaya: {selectedWilaya}</span>
                    <button
                      type="button"
                      onClick={() => onWilayaChange('all')}
                      className="hover:text-white ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {(minPrice !== '' || maxPrice !== '') && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-[11px] font-bold">
                    <DollarSign className="w-3 h-3" />
                    <span>
                      Prix: {minPrice !== '' ? `${Number(minPrice).toLocaleString('fr-FR')} ${currencySymbol}` : '0'} —{' '}
                      {maxPrice !== '' ? `${Number(maxPrice).toLocaleString('fr-FR')} ${currencySymbol}` : '∞'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onMinPriceChange('');
                        onMaxPriceChange('');
                      }}
                      className="hover:text-white ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCondition !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-500/20 border border-purple-400 text-purple-300 text-[11px] font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span>
                      État:{' '}
                      {selectedCondition === 'neuf'
                        ? 'Neuf'
                        : selectedCondition === 'occasion'
                        ? 'Occasion'
                        : 'Reconditionné'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onConditionChange('all')}
                      className="hover:text-white ml-0.5 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* 3-COLUMN RESPONSIVE GRID FOR 3 CORE FILTERS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* ============================================================== */}
              {/* COL 1: FILTRE & TRI PAR WILAYA                                */}
              {/* ============================================================== */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-[#00ff88]">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-white text-xs uppercase tracking-wide">
                        1. Wilaya (58/69)
                      </span>
                    </div>

                    {/* Sorting Buttons for Wilaya */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSortChange('wilaya_asc', 'Wilaya A à Z')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          sortBy === 'wilaya_asc'
                            ? 'bg-emerald-500/30 border-emerald-400 text-[#00ff88]'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Trier par Wilaya A → Z"
                      >
                        A→Z
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange('wilaya_desc', 'Wilaya Z à A')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          sortBy === 'wilaya_desc'
                            ? 'bg-emerald-500/30 border-emerald-400 text-[#00ff88]'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Trier par Wilaya Z → A"
                      >
                        Z→A
                      </button>
                    </div>
                  </div>

                  {/* Main Wilaya Select Dropdown */}
                  <div className="relative">
                    <select
                      value={selectedWilaya}
                      onChange={(e) => {
                        cyberAudio.playClick();
                        onWilayaChange(e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400 cursor-pointer min-h-[38px]"
                    >
                      <option value="all">📍 Toutes les Wilayas ({totalProductsCount})</option>
                      {ALGERIA_69_WILAYAS.map((w) => {
                        const matched = wilayaStats.find((s) =>
                          s.name.toLowerCase().includes(w.name.toLowerCase())
                        );
                        const count = matched?.count || 0;
                        return (
                          <option key={w.codeStr} value={w.name}>
                            {w.codeStr} - {w.name} {count > 0 ? `(${count})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Quick Select Top Wilayas Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Wilayas principales :
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {TOP_WILAYAS.map((wName) => {
                        const isSel = selectedWilaya.toLowerCase() === wName.toLowerCase();
                        const matched = wilayaStats.find((s) =>
                          s.name.toLowerCase().includes(wName.toLowerCase())
                        );
                        const count = matched?.count || 0;
                        return (
                          <button
                            key={wName}
                            type="button"
                            onClick={() => {
                              cyberAudio.playClick();
                              onWilayaChange(isSel ? 'all' : wName);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                              isSel
                                ? 'bg-emerald-500/30 border-emerald-400 text-[#00ff88] shadow-[0_0_8px_rgba(0,255,102,0.3)]'
                                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <span>{wName}</span>
                            {count > 0 && <span className="opacity-60 text-[9px] ml-1">({count})</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Wilayas détectées : {wilayaStats.length}</span>
                  {selectedWilaya !== 'all' && (
                    <button
                      type="button"
                      onClick={() => onWilayaChange('all')}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      Effacer Wilaya
                    </button>
                  )}
                </div>
              </div>

              {/* ============================================================== */}
              {/* COL 2: FOURCHETTE DE PRIX & TRIS PRIX                          */}
              {/* ============================================================== */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 text-cyan-300">
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-white text-xs uppercase tracking-wide">
                        2. Fourchette de Prix
                      </span>
                    </div>

                    {/* Sorting Buttons for Price */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSortChange('price_asc', 'prix croissant')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-0.5 ${
                          sortBy === 'price_asc'
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Trier par Prix Croissant (Moins cher d'abord)"
                      >
                        <ArrowUp className="w-2.5 h-2.5" />
                        <span>Croissant</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange('price_desc', 'prix décroissant')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-0.5 ${
                          sortBy === 'price_desc'
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Trier par Prix Décroissant (Plus cher d'abord)"
                      >
                        <ArrowDown className="w-2.5 h-2.5" />
                        <span>Décroissant</span>
                      </button>
                    </div>
                  </div>

                  {/* Min / Max Inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Min DA"
                        value={minPrice}
                        onChange={(e) => onMinPriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 font-bold pointer-events-none">
                        {currencySymbol}
                      </span>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Max DA"
                        value={maxPrice}
                        onChange={(e) => onMaxPriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-cyan-400 font-bold pointer-events-none">
                        {currencySymbol}
                      </span>
                    </div>
                  </div>

                  {/* Quick Price Preset Chips */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Paliers rapides :
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {PRICE_PRESETS.map((p) => {
                        const isActive = minPrice === p.min && maxPrice === p.max;
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => {
                              cyberAudio.playClick();
                              onMinPriceChange(p.min);
                              onMaxPriceChange(p.max);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                              isActive
                                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                                : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                            }`}
                            title={p.desc}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    Étendue : {datasetMinPrice.toLocaleString('fr-FR')} — {datasetMaxPrice.toLocaleString('fr-FR')} {currencySymbol}
                  </span>
                  {(minPrice !== '' || maxPrice !== '') && (
                    <button
                      type="button"
                      onClick={() => {
                        onMinPriceChange('');
                        onMaxPriceChange('');
                      }}
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      Effacer Prix
                    </button>
                  )}
                </div>
              </div>

              {/* ============================================================== */}
              {/* COL 3: ÉTAT DU PRODUIT (NEUF / OCCASION / RECONDITIONNÉ)        */}
              {/* ============================================================== */}
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-purple-500/30 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-300">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-white text-xs uppercase tracking-wide">
                        3. État du Produit
                      </span>
                    </div>

                    {/* Sorting Buttons for Condition */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSortChange('condition_neuf_first', 'Neuf d abord')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          sortBy === 'condition_neuf_first'
                            ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Trier avec Neuf d'abord"
                      >
                        Neuf 1er
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSortChange('condition_occ_first', 'Occasion d abord')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          sortBy === 'condition_occ_first'
                            ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title="Trier avec Occasion d'abord"
                      >
                        Occasion 1er
                      </button>
                    </div>
                  </div>

                  {/* Condition Filter Segmented Tabs */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {/* TOUS */}
                    <button
                      type="button"
                      onClick={() => {
                        cyberAudio.playClick();
                        onConditionChange('all');
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        selectedCondition === 'all'
                          ? 'bg-slate-800 border-slate-600 text-white font-bold shadow-md'
                          : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs">Tous les états</span>
                      <span className="text-[10px] opacity-70">
                        {conditionCounts.total.toLocaleString('fr-FR')} annonces
                      </span>
                    </button>

                    {/* NEUF */}
                    <button
                      type="button"
                      onClick={() => {
                        cyberAudio.playClick();
                        onConditionChange('neuf');
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        selectedCondition === 'neuf'
                          ? 'bg-emerald-950/80 border-emerald-400 text-[#00ff88] font-bold shadow-[0_0_12px_rgba(0,255,102,0.3)]'
                          : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>✨ Neuf</span>
                      </div>
                      <span className="text-[10px] opacity-70">
                        {conditionCounts.neuf.toLocaleString('fr-FR')} articles
                      </span>
                    </button>

                    {/* OCCASION */}
                    <button
                      type="button"
                      onClick={() => {
                        cyberAudio.playClick();
                        onConditionChange('occasion');
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        selectedCondition === 'occasion'
                          ? 'bg-amber-950/80 border-amber-400 text-amber-300 font-bold shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                          : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        <span>🔄 Occasion</span>
                      </div>
                      <span className="text-[10px] opacity-70">
                        {conditionCounts.occasion.toLocaleString('fr-FR')} articles
                      </span>
                    </button>

                    {/* RECONDITIONNÉ */}
                    <button
                      type="button"
                      onClick={() => {
                        cyberAudio.playClick();
                        onConditionChange('reconditionne');
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        selectedCondition === 'reconditionne'
                          ? 'bg-purple-950/80 border-purple-400 text-purple-300 font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                          : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs">
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                        <span>🛠️ Reconditionné</span>
                      </div>
                      <span className="text-[10px] opacity-70">
                        {conditionCounts.reconditionne.toLocaleString('fr-FR')} articles
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    {selectedCondition === 'neuf'
                      ? 'Articles scellés & 0km'
                      : selectedCondition === 'occasion'
                      ? 'Articles 10/10 & vérifiés'
                      : selectedCondition === 'reconditionne'
                      ? 'Reconditionnés certifiés'
                      : 'Tous les états affichés'}
                  </span>
                  {selectedCondition !== 'all' && (
                    <button
                      type="button"
                      onClick={() => onConditionChange('all')}
                      className="text-purple-400 hover:underline cursor-pointer"
                    >
                      Effacer État
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
