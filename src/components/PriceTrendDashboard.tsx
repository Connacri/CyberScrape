import React, { useState, useMemo } from 'react';
import { ScrapedProduct, AutoUpdateConfig } from '../types';
import {
  TrendingDown,
  TrendingUp,
  Clock,
  RefreshCw,
  Layers,
  ArrowUpRight,
  Sparkles,
  DollarSign,
  Package,
} from 'lucide-react';
import { CrawlerProductivityChart } from './CrawlerProductivityChart';
import { CategoryDistributionPieChart } from './CategoryDistributionPieChart';

interface PriceTrendDashboardProps {
  products: ScrapedProduct[];
  autoUpdate: AutoUpdateConfig;
  onToggleAutoUpdate: () => void;
  onChangeInterval: (minutes: number) => void;
  onTriggerUpdate: () => void;
  isUpdating?: boolean;
}

export const PriceTrendDashboard: React.FC<PriceTrendDashboardProps> = ({
  products,
  autoUpdate,
  onToggleAutoUpdate,
  onChangeInterval,
  onTriggerUpdate,
  isUpdating = false,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; date: string; title?: string } | null>(null);

  // Compute key metrics
  const metrics = useMemo(() => {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        avgPrice: 0,
        totalValuation: 0,
        avgDiscount: 0,
        maxDiscount: 0,
        inStockCount: 0,
        inStockRate: 0,
        priceDropsCount: 0,
      };
    }

    const totalProducts = products.length;
    const totalValuation = products.reduce((acc, p) => acc + p.currentPrice, 0);
    const avgPrice = totalValuation / totalProducts;
    const totalDiscount = products.reduce((acc, p) => acc + (p.discountPercent || 0), 0);
    const avgDiscount = totalDiscount / totalProducts;
    const maxDiscount = Math.max(...products.map((p) => p.discountPercent || 0));
    const inStockCount = products.filter((p) => p.inStock).length;
    const inStockRate = (inStockCount / totalProducts) * 100;
    const priceDropsCount = products.filter((p) => p.discountPercent > 0).length;

    return {
      totalProducts,
      avgPrice,
      totalValuation,
      avgDiscount,
      maxDiscount,
      inStockCount,
      inStockRate,
      priceDropsCount,
    };
  }, [products]);

  // Selected product or first product for the detailed chart
  const activeProduct = useMemo(() => {
    if (selectedProductId === 'all') {
      return products[0] || null;
    }
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [selectedProductId, products]);

  // Prepare chart points
  const chartData = useMemo(() => {
    if (!activeProduct || !activeProduct.priceHistory || activeProduct.priceHistory.length === 0) {
      return [];
    }
    const history = [...activeProduct.priceHistory];
    if (timeRange === '24h') return history.slice(-4);
    if (timeRange === '7d') return history.slice(-7);
    if (timeRange === '30d') return history.slice(-15);
    return history;
  }, [activeProduct, timeRange]);

  // SVG Chart Dimensions & Calculations
  const chartWidth = 720;
  const chartHeight = 220;
  const padding = 36;

  const minPrice = useMemo(() => {
    if (chartData.length === 0) return 0;
    const prices = chartData.map((d) => d.price);
    return Math.floor(Math.min(...prices) * 0.92);
  }, [chartData]);

  const maxPrice = useMemo(() => {
    if (chartData.length === 0) return 100;
    const prices = chartData.map((d) => d.price);
    return Math.ceil(Math.max(...prices) * 1.08);
  }, [chartData]);

  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    const usableWidth = chartWidth - padding * 2;
    const usableHeight = chartHeight - padding * 2;
    const priceRange = maxPrice - minPrice || 1;

    return chartData.map((item, idx) => {
      const x = padding + (idx / Math.max(chartData.length - 1, 1)) * usableWidth;
      const y = chartHeight - padding - ((item.price - minPrice) / priceRange) * usableHeight;
      return { x, y, price: item.price, date: item.date };
    });
  }, [chartData, minPrice, maxPrice, chartWidth, chartHeight]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      // Smooth curve
      const prev = points[idx - 1];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.y;
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }, '');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${pathD} L ${last.x} ${chartHeight - padding} L ${first.x} ${chartHeight - padding} Z`;
  }, [pathD, points, chartHeight, padding]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {/* Metric 1: Total Aspirated */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 backdrop-blur-md relative overflow-hidden group hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span className="uppercase tracking-wider">Catalogue Aspiré</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-[#00ff66]">
            {metrics.totalProducts}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <span className="text-emerald-400 font-semibold">{metrics.inStockCount} en stock</span>
            <span>({metrics.inStockRate.toFixed(0)}%)</span>
          </div>
        </div>

        {/* Metric 2: Price Average */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-md relative overflow-hidden group hover:border-cyan-400 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span className="uppercase tracking-wider">Prix Moyen</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-cyan-300">
            {Math.round(metrics.avgPrice).toLocaleString()} {activeProduct?.currency || '€'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Total catalogue: {Math.round(metrics.totalValuation).toLocaleString()} {activeProduct?.currency || '€'}
          </div>
        </div>

        {/* Metric 3: Best Price Drop */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 backdrop-blur-md relative overflow-hidden group hover:border-rose-400 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span className="uppercase tracking-wider">Rabais Maximum</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl lg:text-3xl font-black font-mono text-rose-400">
            -{metrics.maxDiscount}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            {metrics.priceDropsCount} produits avec baisse
          </div>
        </div>

        {/* Metric 4: Auto-Update Engine Status */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 backdrop-blur-md relative overflow-hidden group hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span className="uppercase tracking-wider">Mises à Jour Auto</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold font-mono px-2 py-0.5 rounded ${
                autoUpdate.enabled
                  ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {autoUpdate.enabled ? `ACTIVE (${autoUpdate.intervalMinutes}m)` : 'DÉSACTIVÉ'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span>Intervalle:</span>
            <div className="flex gap-1.5">
              {[1, 5, 15].map((m) => (
                <button
                  key={m}
                  onClick={() => onChangeInterval(m)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold min-h-[30px] cursor-pointer transition-colors ${
                    autoUpdate.intervalMinutes === m
                      ? 'bg-amber-400 text-black shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Trends Visualizer Card */}
      <div className="p-4 lg:p-6 rounded-2xl bg-slate-950/80 border border-emerald-500/30 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/20">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="font-mono text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Analyse & Courbes des Tendances de Prix
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Historique temporel, détection des baisses flash et prédictions algorithmiques
            </p>
          </div>

          {/* Controls: Product selector, Time range, Manual Refresh */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs w-full sm:w-auto">
            {/* Product selection */}
            {products.length > 0 && (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                aria-label="Sélectionner un produit pour analyser ses prix"
                className="w-full sm:w-auto bg-slate-900 border border-emerald-500/30 rounded-xl px-3 py-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-400 max-w-full sm:max-w-[240px] truncate min-h-[36px] cursor-pointer font-bold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">
                    {p.title}
                  </option>
                ))}
              </select>
            )}

            {/* Time range buttons */}
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5">
              {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase transition-colors cursor-pointer min-h-[34px] ${
                    timeRange === range
                      ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Auto-update toggle & trigger */}
            <button
              onClick={onToggleAutoUpdate}
              className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all ${
                autoUpdate.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {autoUpdate.enabled ? 'Auto: ON' : 'Auto: OFF'}
            </button>

            <button
              onClick={onTriggerUpdate}
              disabled={isUpdating || products.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-[#00ff88] hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              Actualiser Prix
            </button>
          </div>
        </div>

        {/* Selected Product Banner */}
        {activeProduct && (
          <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-3">
              <img
                src={activeProduct.imageUrl}
                alt={activeProduct.title}
                className="w-10 h-10 object-cover rounded bg-slate-800 border border-slate-700 flex-shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60';
                }}
              />
              <div>
                <h4 className="font-bold text-slate-200 truncate max-w-sm sm:max-w-md">
                  {activeProduct.title}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-cyan-400">{activeProduct.category}</span>
                  <span>•</span>
                  <span>Source: {activeProduct.sourceDomain}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="block text-[10px] text-slate-400">PRIX ACTUEL</span>
                <span className="text-lg font-black text-[#00ff66]">
                  {activeProduct.currentPrice.toFixed(2)} {activeProduct.currency}
                </span>
              </div>
              {activeProduct.discountPercent > 0 && (
                <div className="text-right">
                  <span className="block text-[10px] text-slate-400">PRIX INITIAL</span>
                  <span className="text-sm line-through text-slate-500">
                    {activeProduct.originalPrice.toFixed(2)} {activeProduct.currency}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SVG Interactive Chart */}
        <div className="relative mt-4 bg-slate-950 rounded-lg p-2 border border-slate-900 overflow-hidden">
          {products.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-slate-500 font-mono text-xs">
              <Layers className="w-8 h-8 mb-2 text-slate-600 animate-pulse" />
              <span>Aucune donnée temporelle disponible. Lancez une aspiration d'URL.</span>
            </div>
          ) : (
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-56 select-none"
              >
                <defs>
                  <linearGradient id="cyberAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff66" stopOpacity="0.35" />
                    <stop offset="60%" stopColor="#00f0ff" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#00ff66" stopOpacity="0.0" />
                  </linearGradient>

                  <linearGradient id="cyberLineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="70%" stopColor="#00ff66" />
                    <stop offset="100%" stopColor="#39ff14" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
                  const y = padding + pct * (chartHeight - padding * 2);
                  const priceLabel = (maxPrice - pct * (maxPrice - minPrice)).toFixed(0);
                  return (
                    <g key={idx}>
                      <line
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padding - 6}
                        y={y + 4}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {priceLabel} {activeProduct?.currency || '€'}
                      </text>
                    </g>
                  );
                })}

                {/* Area under curve */}
                {areaD && <path d={areaD} fill="url(#cyberAreaGrad)" />}

                {/* Main Curve Line */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#cyberLineGrad)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {points.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill="#030712"
                      stroke="#00ff66"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-6 transition-all"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          x: pt.x,
                          y: pt.y,
                          price: pt.price,
                          date: pt.date,
                          title: activeProduct?.title,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Date label at bottom */}
                    <text
                      x={pt.x}
                      y={chartHeight - 12}
                      fill="#64748b"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {pt.date.split('T')[0] ? pt.date.split('T')[0].slice(5) : `J-${points.length - idx}`}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Hover Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="absolute pointer-events-none z-20 px-2.5 py-1.5 rounded bg-slate-900/95 border border-emerald-400 text-xs font-mono text-white shadow-xl -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                    top: `${(hoveredPoint.y / chartHeight) * 100 - 8}%`,
                  }}
                >
                  <div className="text-[10px] text-slate-400">{hoveredPoint.date}</div>
                  <div className="text-emerald-300 font-bold text-sm">
                    {hoveredPoint.price.toLocaleString()} {activeProduct?.currency || '€'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recharts Category Volume & Valuation Distribution Pie/Donut Chart */}
      <CategoryDistributionPieChart products={products} />

      {/* D3.js Crawler 30-Day Productivity & Category Volume Monitoring */}
      <CrawlerProductivityChart products={products} />
    </div>
  );
};
