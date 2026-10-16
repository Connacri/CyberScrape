import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Sector,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ScrapedProduct } from '../types';
import {
  Award,
  Crown,
  Search,
  Sparkles,
  TrendingUp,
  Percent,
  CircleDollarSign,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  ShieldCheck,
  CheckCircle2,
  Filter,
} from 'lucide-react';

interface BrandMarketShareDonutChartProps {
  products: ScrapedProduct[];
  onSelectBrand?: (brandName: string) => void;
  selectedBrand?: string | null;
}

interface BrandShareSlice {
  name: string;
  value: number; // ad count
  percentage: number; // market share percentage
  totalValuation: number;
  avgPrice: number;
  currency: string;
  color: string;
  sampleItemTitle?: string;
}

// High-visibility Cyberpunk neon palette
const CYBER_BRAND_PALETTE = [
  '#00ff66', // Cyber Emerald (Leader)
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
  '#6366f1', // Indigo Neon
  '#94a3b8', // Slate (Autres)
];

// Well-known market brands to detect if product.brand is missing or generic
const KNOWN_BRANDS_DICTIONARY = [
  // Smartphones & Electronics
  'Apple',
  'Samsung',
  'Xiaomi',
  'Redmi',
  'Poco',
  'Huawei',
  'Honor',
  'Google',
  'OnePlus',
  'Oppo',
  'Realme',
  'Vivo',
  'Sony',
  'Infinix',
  'Tecno',
  'Nothing',
  // Computers & Gaming
  'Asus',
  'Lenovo',
  'Dell',
  'HP',
  'Acer',
  'MSI',
  'Toshiba',
  'Razer',
  'Alienware',
  'PlayStation',
  'Nintendo',
  'Xbox',
  'Logitech',
  'Corsair',
  // Automobiles
  'Renault',
  'Dacia',
  'Peugeot',
  'Volkswagen',
  'Seat',
  'Skoda',
  'Audi',
  'BMW',
  'Mercedes-Benz',
  'Mercedes',
  'Hyundai',
  'Kia',
  'Toyota',
  'Nissan',
  'Ford',
  'Fiat',
  'Chery',
  'Geely',
  'BYD',
  'Chevrolet',
  'Suzuki',
  'Citroen',
  'Land Rover',
  'Porsche',
  'Jeep',
  'MG',
  // Appliances & Electronics DZ
  'Condor',
  'Iris',
  'Beko',
  'Brandt',
  'Eniem',
  'Whirlpool',
  'Bosch',
  'LG',
  'Philips',
  'Moulinex',
  'Tefal',
  'Sonashi',
  'Cristor',
  'Raylan',
  'Geant',
  'TCL',
  'Hisense',
  'Midea',
  // Fashion & Sports
  'Nike',
  'Adidas',
  'Puma',
  'Zara',
  'Lacoste',
  'Tommy Hilfiger',
  'Under Armour',
  'New Balance',
  'Jordan',
  'Gucci',
  'Hugo Boss',
];

/**
 * Smart normalizer to extract accurate brand from item metadata or title
 */
function extractCanonicalBrand(product: ScrapedProduct): string {
  const rawBrand = (product.brand || '').trim();

  // If brand is defined and not generic placeholder
  const isGeneric =
    !rawBrand ||
    rawBrand.toLowerCase().includes('ouedkniss') ||
    rawBrand.toLowerCase().includes('général') ||
    rawBrand.toLowerCase().includes('boutique') ||
    rawBrand.toLowerCase().includes('inconnu') ||
    rawBrand.toLowerCase().includes('particulier');

  if (!isGeneric && rawBrand.length >= 2) {
    // Normalize casing for known brands
    const matched = KNOWN_BRANDS_DICTIONARY.find(
      (b) => b.toLowerCase() === rawBrand.toLowerCase()
    );
    return matched || rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
  }

  // Fallback: match from title
  const title = product.title || '';
  const titleLower = title.toLowerCase();

  for (const known of KNOWN_BRANDS_DICTIONARY) {
    const escaped = known.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s|[.,/\\-_])${escaped}(\\s|[.,/\\-_]|$)`, 'i');
    if (regex.test(titleLower)) {
      return known === 'Mercedes' ? 'Mercedes-Benz' : known;
    }
  }

  // If category is known, extract first word if it looks like a brand
  const firstWord = title.split(/\s+/)[0]?.trim();
  if (firstWord && firstWord.length > 2 && /^[A-Za-z0-9]+$/.test(firstWord)) {
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  }

  return 'Autres Marques';
}

export const BrandMarketShareDonutChart: React.FC<BrandMarketShareDonutChartProps> = ({
  products,
  onSelectBrand,
  selectedBrand,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [chartView, setChartView] = useState<'donut' | 'pie' | 'barShares' | 'barValuations'>('donut');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [maxSlices, setMaxSlices] = useState<number>(10);

  const isDonut = chartView === 'donut';

  // Compute brand aggregations & market share
  const {
    chartData,
    allBrandsList,
    totalProductsCount,
    leaderBrand,
    premiumBrand,
    uniqueBrandsCount,
    currency,
  } = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        chartData: [] as BrandShareSlice[],
        allBrandsList: [] as BrandShareSlice[],
        totalProductsCount: 0,
        leaderBrand: null as BrandShareSlice | null,
        premiumBrand: null as BrandShareSlice | null,
        uniqueBrandsCount: 0,
        currency: 'DA',
      };
    }

    const brandMap = new Map<
      string,
      {
        count: number;
        totalValuation: number;
        currency: string;
        sampleTitle?: string;
      }
    >();

    let totalValuation = 0;
    const detectedCurrency = products[0]?.currency || 'DA';

    products.forEach((p) => {
      const canonical = extractCanonicalBrand(p);
      const existing = brandMap.get(canonical) || {
        count: 0,
        totalValuation: 0,
        currency: p.currency || detectedCurrency,
        sampleTitle: p.title,
      };

      existing.count += 1;
      existing.totalValuation += Number(p.currentPrice) || 0;
      brandMap.set(canonical, existing);

      totalValuation += Number(p.currentPrice) || 0;
    });

    const totalCount = products.length;

    // Convert to sorted array
    const sortedAll = Array.from(brandMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.count,
        percentage: totalCount > 0 ? Math.round((data.count / totalCount) * 1000) / 10 : 0,
        totalValuation: data.totalValuation,
        avgPrice: data.count > 0 ? Math.round(data.totalValuation / data.count) : 0,
        currency: data.currency,
        color: '#64748b',
        sampleItemTitle: data.sampleTitle,
      }))
      .sort((a, b) => b.value - a.value);

    // Identify leader and premium brand
    const leader = sortedAll[0] || null;
    const significantBrands = sortedAll.filter((b) => b.value >= Math.max(2, totalCount * 0.02));
    const premium =
      significantBrands.length > 0
        ? [...significantBrands].sort((a, b) => b.avgPrice - a.avgPrice)[0]
        : sortedAll[0] || null;

    // Group for chart: top (maxSlices - 1) + "Autres Marques"
    let chartSlices: BrandShareSlice[] = [];
    if (sortedAll.length <= maxSlices) {
      chartSlices = sortedAll.map((item, idx) => ({
        ...item,
        color: CYBER_BRAND_PALETTE[idx % (CYBER_BRAND_PALETTE.length - 1)],
      }));
    } else {
      const topItems = sortedAll.slice(0, maxSlices - 1);
      const others = sortedAll.slice(maxSlices - 1);

      const othersCount = others.reduce((acc, curr) => acc + curr.value, 0);
      const othersValuation = others.reduce((acc, curr) => acc + curr.totalValuation, 0);

      chartSlices = topItems.map((item, idx) => ({
        ...item,
        color: CYBER_BRAND_PALETTE[idx % (CYBER_BRAND_PALETTE.length - 1)],
      }));

      chartSlices.push({
        name: `Autres (${others.length} marques)`,
        value: othersCount,
        percentage: totalCount > 0 ? Math.round((othersCount / totalCount) * 1000) / 10 : 0,
        totalValuation: othersValuation,
        avgPrice: othersCount > 0 ? Math.round(othersValuation / othersCount) : 0,
        currency: detectedCurrency,
        color: '#64748b',
      });
    }

    // Color all brands list consistently
    const fullColoredList = sortedAll.map((item, idx) => {
      const chartMatch = chartSlices.find((cs) => cs.name === item.name);
      return {
        ...item,
        color: chartMatch ? chartMatch.color : CYBER_BRAND_PALETTE[idx % CYBER_BRAND_PALETTE.length],
      };
    });

    return {
      chartData: chartSlices,
      allBrandsList: fullColoredList,
      totalProductsCount: totalCount,
      leaderBrand: leader,
      premiumBrand: premium,
      uniqueBrandsCount: sortedAll.length,
      currency: detectedCurrency,
    };
  }, [products, maxSlices]);

  // Synchronize activeIndex with selectedBrand prop if passed
  const currentActiveIndex = useMemo(() => {
    if (activeIndex !== null) return activeIndex;
    if (selectedBrand) {
      const foundIdx = chartData.findIndex((d) => d.name.toLowerCase().includes(selectedBrand.toLowerCase()));
      return foundIdx !== -1 ? foundIdx : null;
    }
    return 0;
  }, [activeIndex, selectedBrand, chartData]);

  const activeSlice = currentActiveIndex !== null && chartData[currentActiveIndex] ? chartData[currentActiveIndex] : null;

  // Filtered brands list for interactive right-hand sidebar
  const filteredBrandsList = useMemo(() => {
    if (!searchFilter.trim()) return allBrandsList;
    const q = searchFilter.toLowerCase();
    return allBrandsList.filter((b) => b.name.toLowerCase().includes(q));
  }, [allBrandsList, searchFilter]);

  // Custom active shape for Recharts Donut
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        {/* Glow halo */}
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
          filter="drop-shadow(0 0 12px rgba(0, 255, 102, 0.5))"
        />
        {/* Cyber Outer Ring Marker */}
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 12}
          outerRadius={outerRadius + 15}
          fill={fill}
          opacity={0.85}
        />
      </g>
    );
  };

  // Custom Cyber Tooltip for Donut/Pie
  const CustomCyberTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: BrandShareSlice = payload[0].payload;
      return (
        <div className="rounded-xl bg-slate-950/95 border border-cyan-400/50 p-3 shadow-[0_0_25px_rgba(0,240,255,0.3)] backdrop-blur-md font-mono text-xs text-slate-100 min-w-[210px] z-50">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-cyan-400/20">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-white text-sm truncate">{data.name}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Part de marché :</span>
              <span className="text-cyan-400 font-bold text-sm">{data.percentage}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Volume d'annonces :</span>
              <span className="text-[#00ff66] font-bold">{data.value.toLocaleString()} ads</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Prix moyen :</span>
              <span className="text-amber-400 font-bold">
                {data.avgPrice.toLocaleString('fr-FR')} {data.currency}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Valeur stock :</span>
              <span className="text-purple-400 font-bold">
                {data.totalValuation >= 1_000_000
                  ? `${(data.totalValuation / 1_000_000).toFixed(1)}M ${data.currency}`
                  : `${data.totalValuation.toLocaleString('fr-FR')} ${data.currency}`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Bar Share Tooltip
  const CustomBarShareTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: BrandShareSlice = payload[0].payload;
      return (
        <div className="rounded-xl bg-slate-950/95 border border-emerald-500/50 p-3 shadow-[0_0_25px_rgba(0,255,102,0.25)] backdrop-blur-md font-mono text-xs text-slate-100 min-w-[210px] z-50">
          <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-emerald-500/20">
            <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-white text-sm truncate">{data.name}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Part de marché :</span>
              <span className="text-[#00ff88] font-bold">{data.percentage}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Annonces réelles :</span>
              <span className="text-cyan-400 font-bold">{data.value.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Prix moyen :</span>
              <span className="text-amber-400 font-bold">
                {data.avgPrice.toLocaleString('fr-FR')} {data.currency}
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
      <div className="rounded-2xl bg-slate-900/60 border border-cyan-500/30 p-6 backdrop-blur-md text-center font-mono">
        <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm mb-2">
          <Award className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span>PART DE MARCHÉ PAR MARQUE // DONUT MATRIX</span>
        </div>
        <p className="text-slate-400 text-xs">
          Aucun produit dans le catalogue. Lancez une aspiration pour analyser les parts de marché des marques.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-950/85 border border-cyan-500/30 p-4 sm:p-6 backdrop-blur-xl shadow-[0_0_35px_rgba(0,240,255,0.08)] relative overflow-hidden font-mono">
      {/* High-tech decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            {chartView === 'donut' || chartView === 'pie' ? (
              <PieChartIcon className="w-5 h-5" />
            ) : (
              <BarChart3 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                PART DE MARCHÉ PAR MARQUE
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                DONUT CHART
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Analyse concurrentielle & distribution des parts de marché sur {totalProductsCount.toLocaleString()} articles
            </p>
          </div>
        </div>

        {/* View mode toggle buttons (Donut / Plein / Barres Parts % / Barres Valeur) */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setChartView('donut')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              chartView === 'donut'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Anneau (Donut)
          </button>
          <button
            type="button"
            onClick={() => setChartView('pie')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              chartView === 'pie'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Plein
          </button>
          <button
            type="button"
            onClick={() => setChartView('barShares')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              chartView === 'barShares'
                ? 'bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,102,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Parts %</span>
          </button>
          <button
            type="button"
            onClick={() => setChartView('barValuations')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              chartView === 'barValuations'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Valorisation</span>
          </button>
        </div>
      </div>

      {/* Metrics Row: Leader, Market Share, Premium Brand, Total Brands */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
        {/* Metric 1: Leader du Marché */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 min-w-0 overflow-hidden">
          <Crown className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold truncate">Leader Volume</div>
            <div className="text-sm font-bold text-[#00ff88] truncate" title={leaderBrand?.name}>
              {leaderBrand?.name || 'N/A'}
            </div>
          </div>
        </div>

        {/* Metric 2: Part de marché Leader */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 min-w-0 overflow-hidden">
          <Percent className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold truncate">Part Leader</div>
            <div className="text-sm font-bold text-cyan-300 truncate">
              {leaderBrand ? `${leaderBrand.percentage}%` : '0%'}
            </div>
          </div>
        </div>

        {/* Metric 3: Marque la plus Premium */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 min-w-0 overflow-hidden">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold truncate">Marque Premium</div>
            <div className="text-sm font-bold text-amber-300 truncate" title={`${premiumBrand?.name} (Moy: ${premiumBrand?.avgPrice.toLocaleString()} DA)`}>
              {premiumBrand?.name || 'N/A'}
            </div>
          </div>
        </div>

        {/* Metric 4: Total marques actives */}
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5 min-w-0 overflow-hidden">
          <Layers className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-400 uppercase font-semibold truncate">Marques Actives</div>
            <div className="text-sm font-bold text-purple-300 truncate">
              {uniqueBrandsCount} identifiées
            </div>
          </div>
        </div>
      </div>

      {/* Main Visual Layout: Donut Chart on Left + Interactive Brand Ranking on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Recharts Visual Area (Donut, Pie, or Bar Charts) */}
        <div className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[320px]">
          {chartView === 'barShares' ? (
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: 0, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={50}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip content={<CustomBarShareTooltip />} />
                  <Bar
                    dataKey="percentage"
                    radius={[6, 6, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any) => {
                      if (data && onSelectBrand) {
                        onSelectBrand(data.name);
                      }
                    }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`bar-share-${index}`}
                        fill={entry.color}
                        opacity={currentActiveIndex === null || currentActiveIndex === index ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : chartView === 'barValuations' ? (
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 15, right: 10, left: 0, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={50}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) =>
                      val >= 1_000_000
                        ? `${(val / 1_000_000).toFixed(1)}M`
                        : val >= 1_000
                        ? `${Math.round(val / 1_000)}k`
                        : `${val}`
                    }
                  />
                  <Tooltip content={<CustomCyberTooltip />} />
                  <Bar
                    dataKey="totalValuation"
                    radius={[6, 6, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any) => {
                      if (data && onSelectBrand) {
                        onSelectBrand(data.name);
                      }
                    }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`bar-val-${index}`}
                        fill={entry.color}
                        opacity={currentActiveIndex === null || currentActiveIndex === index ? 1 : 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <>
              {/* Donut & Pie Chart View */}
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomCyberTooltip />} />
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
                        if (onSelectBrand && data?.name) {
                          onSelectBrand(data.name);
                        }
                      }}
                      cursor="pointer"
                      animationDuration={800}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-brand-${entry.name}-${index}`}
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
                    {activeSlice ? 'PART MARQUE' : 'CATALOGUE'}
                  </span>
                  <span className="text-xl font-extrabold text-white font-mono leading-tight tracking-tight drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                    {activeSlice ? `${activeSlice.percentage}%` : `${uniqueBrandsCount} marques`}
                  </span>
                  <span className="text-[11px] font-bold text-cyan-300 truncate max-w-[120px] mt-0.5">
                    {activeSlice ? activeSlice.name : 'Volume Global'}
                  </span>
                  {activeSlice && (
                    <span className="text-[9px] text-emerald-400 mt-0.5">
                      {activeSlice.value} annonce{activeSlice.value > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Interactive Brand Breakdown & Ranking List */}
        <div className="lg:col-span-6 space-y-2">
          {/* Search filter input */}
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrer une marque..."
                className="w-full pl-8 pr-2 py-1 text-xs bg-slate-900/80 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="text-[10px] text-slate-400 shrink-0 font-mono">
              {filteredBrandsList.length} / {allBrandsList.length} marques
            </div>
          </div>

          {/* List of brands with market share % and volume */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {filteredBrandsList.map((brand, idx) => {
              const isHovered = activeSlice?.name.toLowerCase() === brand.name.toLowerCase();
              return (
                <div
                  key={`${brand.name}-${idx}`}
                  onMouseEnter={() => {
                    const matchIdx = chartData.findIndex((c) => c.name.toLowerCase() === brand.name.toLowerCase());
                    if (matchIdx !== -1) setActiveIndex(matchIdx);
                  }}
                  onClick={() => {
                    const matchIdx = chartData.findIndex((c) => c.name.toLowerCase() === brand.name.toLowerCase());
                    if (matchIdx !== -1) setActiveIndex(matchIdx);
                    if (onSelectBrand) {
                      onSelectBrand(brand.name);
                    }
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isHovered
                      ? 'bg-slate-900 border-cyan-400/60 shadow-[0_0_15px_rgba(0,240,255,0.15)] scale-[1.01]'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-slate-500 w-4 shrink-0">
                        #{idx + 1}
                      </span>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_6px]"
                        style={{ backgroundColor: brand.color }}
                      />
                      <span
                        className={`text-xs font-semibold truncate ${
                          isHovered ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {brand.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-[#00ff88]">
                        {brand.value} ads
                      </span>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                        {brand.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar visualizer */}
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(3, brand.percentage))}%`,
                        backgroundColor: brand.color,
                        boxShadow: isHovered ? `0 0 8px ${brand.color}` : 'none',
                      }}
                    />
                  </div>

                  {/* Financial stats row */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 gap-2 min-w-0">
                    <span className="truncate">
                      Moy : {brand.avgPrice >= 1_000_000 ? `${(brand.avgPrice / 1_000_000).toFixed(1)}M` : Math.round(brand.avgPrice).toLocaleString('fr-FR')} {brand.currency}
                    </span>
                    <span className="text-slate-500 truncate text-right">
                      Lot : {brand.totalValuation >= 1_000_000 ? `${(brand.totalValuation / 1_000_000).toFixed(1)}M` : Math.round(brand.totalValuation).toLocaleString('fr-FR')} {brand.currency}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
