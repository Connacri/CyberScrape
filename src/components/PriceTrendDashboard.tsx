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

  const activeCurrency = activeProduct?.currency || 'DA';
  const isLargeCurrency = activeCurrency.toUpperCase() === 'DA' || maxPrice > 9999;
  const paddingLeft = isLargeCurrency ? 72 : 44;
  const paddingRight = 24;
  const paddingTop = 22;
  const paddingBottom = 32;

  const points = useMemo(() => {
    if (chartData.length === 0) return [];
    const usableWidth = chartWidth - paddingLeft - paddingRight;
    const usableHeight = chartHeight - paddingTop - paddingBottom;
    const priceRange = maxPrice - minPrice || 1;

    return chartData.map((item, idx) => {
      const x = paddingLeft + (idx / Math.max(chartData.length - 1, 1)) * usableWidth;
      const y = chartHeight - paddingBottom - ((item.price - minPrice) / priceRange) * usableHeight;
      return { x, y, price: item.price, date: item.date };
    });
  }, [chartData, minPrice, maxPrice, chartWidth, chartHeight, paddingLeft, paddingRight, paddingTop, paddingBottom]);

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
    return `${pathD} L ${last.x} ${chartHeight - paddingBottom} L ${first.x} ${chartHeight - paddingBottom} Z`;
  }, [pathD, points, chartHeight, paddingBottom]);

  // Currency formatting helpers to prevent card blowouts
  const formatExactCurrency = (val: number, cur: string) => {
    if (cur === 'DA') {
      return `${Math.round(val).toLocaleString('fr-FR')} DA`;
    }
    return `${val.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${cur}`;
  };

  const formatCompactCurrency = (val: number, cur: string) => {
    if (val >= 1_000_000_000) {
      return `${(val / 1_000_000_000).toFixed(1)}B ${cur}`;
    }
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M ${cur}`;
    }
    if (val >= 100_000) {
      return `${Math.round(val / 1_000)}k ${cur}`;
    }
    return formatExactCurrency(val, cur);
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 min-w-0">
        {/* Metric 1: Total Aspirated */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-emerald-500/30 backdrop-blur-md relative overflow-hidden group hover:border-emerald-400 transition-all min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-mono mb-1 gap-1">
              <span className="uppercase tracking-wider font-semibold truncate">Catalogue</span>
              <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <div className="text-lg sm:text-2xl font-black font-mono text-[#00ff66] truncate mt-0.5">
              {metrics.totalProducts.toLocaleString('fr-FR')}
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 flex items-center gap-1 font-mono truncate">
            <span className="text-emerald-400 font-semibold truncate">{metrics.inStockCount} en stock</span>
            <span className="shrink-0 text-slate-500">({metrics.inStockRate.toFixed(0)}%)</span>
          </div>
        </div>

        {/* Metric 2: Price Average */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-cyan-500/30 backdrop-blur-md relative overflow-hidden group hover:border-cyan-400 transition-all min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-mono mb-1 gap-1">
              <span className="uppercase tracking-wider font-semibold truncate">Prix Moyen</span>
              <DollarSign className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            </div>
            <div
              className="text-base sm:text-xl lg:text-2xl font-black font-mono text-cyan-300 truncate mt-0.5"
              title={formatExactCurrency(metrics.avgPrice, activeCurrency)}
            >
              {formatCompactCurrency(metrics.avgPrice, activeCurrency)}
            </div>
          </div>
          <div
            className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 font-mono truncate"
            title={`Total: ${formatExactCurrency(metrics.totalValuation, activeCurrency)}`}
          >
            Total: <span className="text-slate-300 font-bold">{formatCompactCurrency(metrics.totalValuation, activeCurrency)}</span>
          </div>
        </div>

        {/* Metric 3: Best Price Drop */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-rose-500/30 backdrop-blur-md relative overflow-hidden group hover:border-rose-400 transition-all min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-mono mb-1 gap-1">
              <span className="uppercase tracking-wider font-semibold truncate">Rabais Max</span>
              <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            </div>
            <div className="text-lg sm:text-2xl lg:text-3xl font-black font-mono text-rose-400 truncate mt-0.5">
              -{metrics.maxDiscount}%
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 font-mono truncate">
            {metrics.priceDropsCount} avec baisse
          </div>
        </div>

        {/* Metric 4: Auto-Update Engine Status */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-950/85 border border-amber-500/30 backdrop-blur-md relative overflow-hidden group hover:border-amber-400 transition-all min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-mono mb-1 gap-1">
              <span className="uppercase tracking-wider font-semibold truncate">MàJ Auto</span>
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              <span
                className={`text-[10px] sm:text-xs font-bold font-mono px-2 py-0.5 rounded truncate ${
                  autoUpdate.enabled
                    ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {autoUpdate.enabled ? `ACTIVE (${autoUpdate.intervalMinutes}m)` : 'DÉSACTIVÉ'}
              </span>
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 font-mono flex items-center justify-between gap-1 min-w-0">
            <span className="shrink-0">Freq:</span>
            <div className="flex gap-1 shrink-0">
              {[1, 5, 15].map((m) => (
                <button
                  key={m}
                  onClick={() => onChangeInterval(m)}
                  className={`px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] rounded font-bold cursor-pointer transition-colors ${
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

      {/* Main Trends Visualizer Card */}
      <div className="p-3.5 sm:p-5 lg:p-6 rounded-2xl bg-slate-950/85 border border-emerald-500/30 backdrop-blur-md shadow-2xl min-w-0 overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 sm:pb-4 border-b border-emerald-500/20 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingUp className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="font-mono text-xs sm:text-sm md:text-base font-bold text-white tracking-wide uppercase break-words">
                Analyse & Courbes des Tendances de Prix
              </h3>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-mono mt-0.5 break-words">
              Historique temporel, détection des baisses flash et prédictions algorithmiques
            </p>
          </div>

          {/* Controls: Product selector, Time range, Manual Refresh */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs w-full lg:w-auto shrink-0 min-w-0">
            {/* Product selection */}
            {products.length > 0 && (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                aria-label="Sélectionner un produit pour analyser ses prix"
                className="w-full sm:w-auto bg-slate-900 border border-emerald-500/30 rounded-xl px-2.5 sm:px-3 py-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-400 max-w-full sm:max-w-[210px] truncate min-h-[36px] cursor-pointer font-bold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-950 text-slate-200">
                    {p.title}
                  </option>
                ))}
              </select>
            )}

            {/* Time range buttons */}
            <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 shrink-0">
              {(['24h', '7d', '30d', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase transition-colors cursor-pointer min-h-[34px] ${
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
              className={`px-2.5 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                autoUpdate.enabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{autoUpdate.enabled ? 'Auto: ON' : 'Auto: OFF'}</span>
            </button>

            <button
              onClick={onTriggerUpdate}
              disabled={isUpdating || products.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-[#00ff88] hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-40 whitespace-nowrap cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Selected Product Banner */}
        {activeProduct && (
          <div className="mt-4 p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs min-w-0 overflow-hidden">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <img
                src={activeProduct.imageUrl}
                alt={activeProduct.title}
                className="w-11 h-11 object-cover rounded-lg bg-slate-800 border border-slate-700 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60';
                }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-100 truncate block text-xs sm:text-sm" title={activeProduct.title}>
                  {activeProduct.title}
                </h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
                  <span className="text-cyan-400 font-semibold truncate max-w-[140px] sm:max-w-[200px]">{activeProduct.category}</span>
                  <span className="shrink-0">•</span>
                  <span className="truncate">Source: {activeProduct.sourceDomain}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 min-w-0">
              <div className="text-left sm:text-right min-w-0">
                <span className="block text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">PRIX ACTUEL</span>
                <span className="text-sm sm:text-base lg:text-lg font-black text-[#00ff66] truncate block">
                  {formatExactCurrency(activeProduct.currentPrice, activeProduct.currency)}
                </span>
              </div>
              {activeProduct.discountPercent > 0 && (
                <div className="text-right min-w-0">
                  <span className="block text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">PRIX INITIAL</span>
                  <span className="text-xs sm:text-sm line-through text-slate-500 truncate block">
                    {formatExactCurrency(activeProduct.originalPrice, activeProduct.currency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
                  <span className="text-xs sm:text-sm line-through text-slate-500 truncate block">
                    {formatExactCurrency(activeProduct.originalPrice, activeProduct.currency)}
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
                  const y = paddingTop + pct * (chartHeight - paddingTop - paddingBottom);
                  const rawVal = maxPrice - pct * (maxPrice - minPrice);
                  const priceLabel =
                    rawVal >= 1_000_000
                      ? `${(rawVal / 1_000_000).toFixed(1)}M`
                      : rawVal >= 10_000
                      ? `${Math.round(rawVal / 1_000)}k`
                      : Math.round(rawVal).toString();
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={chartWidth - paddingRight}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 3.5}
                        fill="#64748b"
                        fontSize="9"
                        textAnchor="end"
                        fontFamily="monospace"
                      >
                        {priceLabel} {activeCurrency}
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
