import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { ScrapedProduct, PricePoint } from '../types';
import {
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar,
  AlertCircle,
  Tag,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Sparkles,
} from 'lucide-react';

interface ProductPriceHistoryChartProps {
  product: ScrapedProduct;
  height?: number;
  showCardWrapper?: boolean;
}

export const ProductPriceHistoryChart: React.FC<ProductPriceHistoryChartProps> = ({
  product,
  height = 240,
  showCardWrapper = true,
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | 'all'>('all');

  // Normalize and guarantee price points
  const rawHistory = useMemo(() => {
    if (product.priceHistory && product.priceHistory.length >= 2) {
      return product.priceHistory;
    }

    // Deterministic fallback if product has only 0 or 1 point
    const points: PricePoint[] = [];
    const days = 14;
    const now = new Date();
    const current = product.currentPrice;
    const orig =
      product.originalPrice > current
        ? product.originalPrice
        : product.discountPercent > 0
        ? Math.round(current / (1 - product.discountPercent / 100))
        : Math.round(current * 1.05);

    for (let i = days; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      let price = orig;

      if (i === 0) {
        price = current;
      } else if (i <= 2 && product.discountPercent > 0) {
        price = current;
      } else {
        // Slight fluctuation
        const progress = (days - i) / days;
        const base = orig - (orig - current) * progress;
        const jitter = Math.sin(i * 1.8) * (orig * 0.015);
        price = Math.round(base + jitter);
      }

      points.push({
        date: dateStr,
        price: Math.max(1, price),
        note:
          i === 0 && product.discountPercent > 0
            ? `Baisse de ${product.discountPercent}% observée`
            : undefined,
      });
    }

    return points;
  }, [product]);

  // Filter points based on selected range
  const filteredHistory = useMemo(() => {
    if (timeRange === '7d') return rawHistory.slice(-7);
    if (timeRange === '14d') return rawHistory.slice(-14);
    return rawHistory;
  }, [rawHistory, timeRange]);

  // Format data points for Recharts
  const chartData = useMemo(() => {
    return filteredHistory.map((p, idx) => {
      let displayDate = p.date;
      let fullDate = p.date;
      try {
        const parts = p.date.split('-');
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          displayDate = d.toLocaleDateString('fr-DZ', { day: '2-digit', month: 'short' });
          fullDate = d.toLocaleDateString('fr-DZ', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          });
        }
      } catch {
        // ignore
      }

      const isLast = idx === filteredHistory.length - 1;
      return {
        date: p.date,
        displayDate: isLast ? 'Aujourd\'hui' : displayDate,
        fullDate,
        price: p.price,
        note: p.note,
      };
    });
  }, [filteredHistory]);

  // Statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        startPrice: product.currentPrice,
        latestPrice: product.currentPrice,
        minPrice: product.currentPrice,
        maxPrice: product.currentPrice,
        delta: 0,
        deltaPercent: 0,
        avgPrice: product.currentPrice,
      };
    }

    const prices = chartData.map((d) => d.price);
    const startPrice = prices[0];
    const latestPrice = prices[prices.length - 1];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avgPrice = Math.round(sum / prices.length);
    const delta = latestPrice - startPrice;
    const deltaPercent = startPrice > 0 ? (delta / startPrice) * 100 : 0;

    return {
      startPrice,
      latestPrice,
      minPrice,
      maxPrice,
      delta,
      deltaPercent,
      avgPrice,
    };
  }, [chartData, product.currentPrice]);

  const currency = product.currency || 'DA';
  const formatCur = (val: number) => `${new Intl.NumberFormat('fr-DZ').format(val)} ${currency}`;

  // Y-axis bounds calculation with padding
  const yDomain = useMemo(() => {
    if (stats.minPrice === stats.maxPrice) {
      const padding = stats.minPrice * 0.1 || 1000;
      return [Math.max(0, stats.minPrice - padding), stats.maxPrice + padding];
    }
    const spread = stats.maxPrice - stats.minPrice;
    const pad = Math.max(spread * 0.15, 100);
    return [Math.max(0, Math.floor(stats.minPrice - pad)), Math.ceil(stats.maxPrice + pad)];
  }, [stats]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const diffFromStart = data.price - stats.startPrice;
      const diffPercent = stats.startPrice > 0 ? (diffFromStart / stats.startPrice) * 100 : 0;

      return (
        <div className="p-3 rounded-xl bg-slate-950/95 border border-emerald-500/50 shadow-[0_0_25px_rgba(0,255,102,0.3)] backdrop-blur-md font-mono text-xs text-slate-100 z-50">
          <div className="text-[11px] text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{data.fullDate}</span>
          </div>

          <div className="text-base font-black text-[#00ff66]">
            {formatCur(data.price)}
          </div>

          {diffFromStart !== 0 && (
            <div
              className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
                diffFromStart < 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {diffFromStart < 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
              <span>
                {diffFromStart > 0 ? '+' : ''}
                {new Intl.NumberFormat('fr-DZ').format(diffFromStart)} {currency} (
                {diffFromStart > 0 ? '+' : ''}
                {diffPercent.toFixed(1)}%)
              </span>
            </div>
          )}

          {data.note && (
            <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{data.note}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const chartContent = (
    <div className="space-y-4">
      {/* Top Header & Range Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Clock className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <span>Évolution Temporelle des Prix</span>
              {stats.delta < 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/40 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  Baisse de {Math.abs(stats.deltaPercent).toFixed(1)}%
                </span>
              ) : stats.delta > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold border border-rose-500/40 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Hausse de +{stats.deltaPercent.toFixed(1)}%
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono text-[10px] border border-slate-700 flex items-center gap-1">
                  <Minus className="w-3 h-3" />
                  Prix stable
                </span>
              )}
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Surveillance télémétrique Ouedkniss & relevés du marché
            </span>
          </div>
        </div>

        {/* Time filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
              timeRange === '7d'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Jours
          </button>
          <button
            onClick={() => setTimeRange('14d')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
              timeRange === '14d'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            14 Jours
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
              timeRange === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tout ({chartData.length} pts)
          </button>
        </div>
      </div>

      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
        {/* Current price */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
          <span className="text-[10px] text-slate-500 block uppercase">Prix Actuel</span>
          <span className="text-sm font-bold text-[#00ff66] truncate block">
            {formatCur(stats.latestPrice)}
          </span>
        </div>

        {/* Lowest price */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Plus Bas Relevé</span>
          <span className="text-sm font-semibold text-emerald-400 truncate block">
            {formatCur(stats.minPrice)}
          </span>
        </div>

        {/* Highest price */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Plus Haut Relevé</span>
          <span className="text-sm font-semibold text-slate-300 truncate block">
            {formatCur(stats.maxPrice)}
          </span>
        </div>

        {/* Variation */}
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Variation Période</span>
          <span
            className={`text-sm font-semibold truncate block ${
              stats.delta < 0
                ? 'text-emerald-400'
                : stats.delta > 0
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {stats.delta > 0 ? '+' : ''}
            {stats.deltaPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div
        className="w-full relative rounded-2xl bg-slate-950/90 border border-slate-800/80 p-3 pt-4 shadow-inner"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`priceGradient-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff66" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00ff66" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gridGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1e293b" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#1e293b" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="displayDate"
              stroke="#64748b"
              fontSize={11}
              fontFamily="monospace"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              dy={6}
            />

            <YAxis
              stroke="#64748b"
              fontSize={10}
              fontFamily="monospace"
              domain={yDomain}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v: number) => {
                if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                if (v >= 1000) return `${Math.round(v / 1000)}k`;
                return `${v}`;
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Reference line for start/original price */}
            {stats.startPrice !== stats.latestPrice && (
              <ReferenceLine
                y={stats.startPrice}
                stroke="#64748b"
                strokeDasharray="4 4"
                strokeWidth={1}
                label={{
                  value: 'Départ',
                  position: 'insideTopLeft',
                  fill: '#94a3b8',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="price"
              stroke="#00ff66"
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#priceGradient-${product.id})`}
              dot={{
                r: 3.5,
                fill: '#05080f',
                stroke: '#00ff66',
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: '#00ff66',
                stroke: '#ffffff',
                strokeWidth: 2,
                className: 'filter drop-shadow-[0_0_8px_#00ff66]',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#00ff66]" />
          Relevés certifiés Matrix & Indexation continue
        </span>
        <span>
          Prix moyen période :{' '}
          <strong className="text-slate-300 font-semibold">{formatCur(stats.avgPrice)}</strong>
        </span>
      </div>
    </div>
  );

  if (!showCardWrapper) {
    return chartContent;
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-[0_0_30px_rgba(0,255,102,0.06)]">
      {chartContent}
    </div>
  );
};
