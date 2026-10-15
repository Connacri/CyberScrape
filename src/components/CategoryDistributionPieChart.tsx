import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
} from 'recharts';
import { ScrapedProduct } from '../types';
import {
  PieChart as PieChartIcon,
  Layers,
  Sparkles,
  Tag,
  CircleDollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
} from 'lucide-react';

interface CategoryDistributionPieChartProps {
  products: ScrapedProduct[];
  onSelectCategory?: (categoryName: string) => void;
  selectedCategory?: string | null;
}

interface CategoryPieSlice {
  name: string;
  value: number;
  percentage: number;
  totalValuation: number;
  avgPrice: number;
  currency: string;
  color: string;
}

// Cyberpunk high-visibility neon palette
const CYBER_PALETTE = [
  '#00ff66', // Cyber Emerald
  '#00f0ff', // Cyber Cyan
  '#a855f7', // Electric Violet
  '#ffbe0b', // Quantum Amber
  '#ff007f', // Cyber Magenta
  '#3b82f6', // Neon Blue
  '#f97316', // Blaze Orange
  '#14b8a6', // Bio Teal
  '#ec4899', // Hyper Pink
  '#84cc16', // Matrix Lime
  '#06b6d4', // Deep Sky
  '#e11d48', // Crimson Red
];

export const CategoryDistributionPieChart: React.FC<CategoryDistributionPieChartProps> = ({
  products,
  onSelectCategory,
  selectedCategory,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isDonut, setIsDonut] = useState<boolean>(true);

  // Group and aggregate products by category
  const { chartData, totalItems, topCategory, totalValuation, currency } = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        chartData: [] as CategoryPieSlice[],
        totalItems: 0,
        topCategory: null,
        totalValuation: 0,
        currency: 'DA',
      };
    }

    const map = new Map<string, { count: number; totalVal: number; currency: string }>();
    let grandTotal = 0;
    let grandValuation = 0;
    const detectedCurrency = products[0]?.currency || 'DA';

    products.forEach((p) => {
      const cat = (p.category || 'Général').trim();
      const existing = map.get(cat) || { count: 0, totalVal: 0, currency: p.currency || detectedCurrency };
      existing.count += 1;
      existing.totalVal += Number(p.currentPrice) || 0;
      map.set(cat, existing);

      grandTotal += 1;
      grandValuation += Number(p.currentPrice) || 0;
    });

    // Sort by count descending
    const sorted = Array.from(map.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, data], idx) => ({
        name,
        value: data.count,
        percentage: grandTotal > 0 ? Math.round((data.count / grandTotal) * 1000) / 10 : 0,
        totalValuation: data.totalVal,
        avgPrice: data.count > 0 ? Math.round(data.totalVal / data.count) : 0,
        currency: data.currency,
        color: CYBER_PALETTE[idx % CYBER_PALETTE.length],
      }));

    return {
      chartData: sorted,
      totalItems: grandTotal,
      topCategory: sorted[0] || null,
      totalValuation: grandValuation,
      currency: detectedCurrency,
    };
  }, [products]);

  // Synchronize activeIndex with selectedCategory prop if passed
  const currentActiveIndex = useMemo(() => {
    if (activeIndex !== null) return activeIndex;
    if (selectedCategory) {
      const foundIdx = chartData.findIndex((d) => d.name.toLowerCase() === selectedCategory.toLowerCase());
      return foundIdx !== -1 ? foundIdx : null;
    }
    return 0;
  }, [activeIndex, selectedCategory, chartData]);

  const activeSlice = currentActiveIndex !== null && chartData[currentActiveIndex] ? chartData[currentActiveIndex] : null;

  // Custom active shape for Recharts
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
      <g>
        {/* Expanded active slice with neon glow border */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={isDonut ? innerRadius - 4 : 0}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="#00ff66"
          strokeWidth={2}
          filter="drop-shadow(0 0 10px rgba(0, 255, 102, 0.45))"
        />
        {/* Subtle outer orbit ring */}
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 15}
          fill={fill}
          opacity={0.8}
        />
      </g>
    );
  };

  // Custom Cyber Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: CategoryPieSlice = payload[0].payload;
      return (
        <div className="rounded-xl bg-slate-950/95 border border-emerald-500/50 p-3 shadow-[0_0_25px_rgba(0,255,102,0.25)] backdrop-blur-md font-mono text-xs text-slate-100 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-emerald-500/20">
            <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-white text-sm truncate">{data.name}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Articles :</span>
              <span className="text-emerald-400 font-bold">{data.value.toLocaleString()} ads</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Part catalogue :</span>
              <span className="text-cyan-400 font-bold">{data.percentage}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Prix moyen :</span>
              <span className="text-amber-400 font-bold">
                {data.avgPrice.toLocaleString()} {data.currency}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Valeur lot :</span>
              <span className="text-purple-400 font-bold">
                {data.totalValuation.toLocaleString()} {data.currency}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (products.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/60 border border-emerald-500/30 p-6 backdrop-blur-md text-center">
        <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-sm mb-2">
          <PieChartIcon className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span>RÉPARTITION CATÉGORIELLE // RECHARTS MATRIX</span>
        </div>
        <p className="text-slate-400 font-mono text-xs">
          Aucun produit dans le catalogue. Lancez une aspiration pour générer le diagramme circulaire.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-950/85 border border-emerald-500/30 p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_35px_rgba(0,255,102,0.08)] relative overflow-hidden font-mono">
      {/* Neon decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-emerald-500" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-emerald-500" />

      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-emerald-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(0,255,102,0.2)]">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                RÉPARTITION PAR CATÉGORIE
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                RECHARTS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Distribution volumétrique et valorisation en temps réel des {totalItems.toLocaleString()} articles
            </p>
          </div>
        </div>

        {/* Donut vs Solid Pie toggle buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setIsDonut(true)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              isDonut
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Donut Anneau
          </button>
          <button
            type="button"
            onClick={() => setIsDonut(false)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              !isDonut
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Camembert Plein
          </button>
        </div>
      </div>

      {/* Metrics Header Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 min-w-0 overflow-hidden">
          <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold truncate">Catégories</div>
            <div className="text-sm font-bold text-white truncate">{chartData.length} actives</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 min-w-0 overflow-hidden">
          <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold truncate">Dominante</div>
            <div className="text-sm font-bold text-cyan-300 truncate" title={topCategory?.name}>
              {topCategory?.name || 'N/A'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 min-w-0 overflow-hidden">
          <Percent className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold truncate">Part dominante</div>
            <div className="text-sm font-bold text-purple-300 truncate">
              {topCategory ? `${topCategory.percentage}%` : '0%'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 min-w-0 overflow-hidden">
          <CircleDollarSign className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold truncate">Valorisation</div>
            <div
              className="text-sm font-bold text-amber-300 truncate"
              title={`${totalValuation.toLocaleString('fr-FR')} ${currency}`}
            >
              {totalValuation >= 1_000_000
                ? `${(totalValuation / 1_000_000).toFixed(1)}M ${currency}`
                : `${totalValuation.toLocaleString('fr-FR')} ${currency}`}
            </div>
          </div>
        </div>
      </div>

      {/* Main Visual Layout: Pie Chart + Interactive Detailed Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Recharts Pie Chart (with center holographic telemetry in donut mode) */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[320px]">
          <div className="w-full h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={isDonut ? 75 : 0}
                  outerRadius={120}
                  paddingAngle={isDonut ? 3 : 1}
                  {...({
                    activeIndex: currentActiveIndex !== null ? currentActiveIndex : undefined,
                    activeShape: renderActiveShape,
                  } as any)}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onClick={(data, index) => {
                    setActiveIndex(index);
                    if (onSelectCategory && data?.name) {
                      onSelectCategory(data.name);
                    }
                  }}
                  cursor="pointer"
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}-${index}`}
                      fill={entry.color}
                      stroke="#030712"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Central Donut Readout */}
          {isDonut && (
            <div className="absolute pointer-events-none flex flex-col items-center justify-center text-center max-w-[130px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                {activeSlice ? 'FOCUS' : 'CATALOGUE'}
              </span>
              <span className="text-xl font-extrabold text-white font-mono leading-tight tracking-tight drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]">
                {activeSlice ? `${activeSlice.percentage}%` : totalItems.toLocaleString()}
              </span>
              <span className="text-[11px] font-bold text-emerald-400 truncate max-w-[120px] mt-0.5">
                {activeSlice ? activeSlice.name : 'Articles scellés'}
              </span>
              {activeSlice && (
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {activeSlice.value} annonce{activeSlice.value > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Interactive Category Breakdown List */}
        <div className="lg:col-span-6 space-y-2 max-h-[340px] overflow-y-auto pr-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
            <span>CATÉGORIE ({chartData.length})</span>
            <span>VOLUMÉTRIE & VALORISATION</span>
          </div>

          {chartData.map((slice, idx) => {
            const isHovered = currentActiveIndex === idx;
            return (
              <div
                key={slice.name}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  setActiveIndex(idx);
                  if (onSelectCategory) {
                    onSelectCategory(slice.name);
                  }
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isHovered
                    ? 'bg-slate-900 border-emerald-500/60 shadow-[0_0_15px_rgba(0,255,102,0.15)] scale-[1.01]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_6px]"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span
                      className={`text-xs font-semibold truncate ${
                        isHovered ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {slice.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-emerald-400">
                      {slice.value} ads
                    </span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {slice.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar visualizer */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${slice.percentage}%`,
                      backgroundColor: slice.color,
                      boxShadow: isHovered ? `0 0 8px ${slice.color}` : 'none',
                    }}
                  />
                </div>

                {/* Additional metadata row */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 gap-2 min-w-0">
                  <span className="truncate">
                    Moy : {slice.avgPrice >= 1_000_000 ? `${(slice.avgPrice / 1_000_000).toFixed(1)}M` : Math.round(slice.avgPrice).toLocaleString('fr-FR')} {slice.currency}
                  </span>
                  <span className="text-slate-500 truncate text-right">
                    Lot : {slice.totalValuation >= 1_000_000 ? `${(slice.totalValuation / 1_000_000).toFixed(1)}M` : Math.round(slice.totalValuation).toLocaleString('fr-FR')} {slice.currency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
