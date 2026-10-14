import React, { useState, useMemo } from 'react';
import { ScrapedProduct } from '../types';
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  Database,
  Code,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowUpDown,
  Tag,
  Star,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface ProductCatalogGridProps {
  products: ScrapedProduct[];
  onSyncSingleProduct: (product: ScrapedProduct) => Promise<void>;
  onBulkSyncSupabase: () => Promise<void>;
  isSupabaseConfigured: boolean;
  onOpenSupabaseModal: () => void;
  onRemoveCurrency?: (currency: string) => void;
}

export const ProductCatalogGrid: React.FC<ProductCatalogGridProps> = ({
  products,
  onSyncSingleProduct,
  onBulkSyncSupabase,
  isSupabaseConfigured,
  onOpenSupabaseModal,
  onRemoveCurrency,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'discount' | 'recent'>('discount');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [inspectingProduct, setInspectingProduct] = useState<ScrapedProduct | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch =
          p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
          p.sourceDomain.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const matchesCurrency = selectedCurrency === 'all' || p.currency === selectedCurrency;
        return matchesSearch && matchesCategory && matchesCurrency;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.currentPrice - b.currentPrice;
        if (sortBy === 'price_desc') return b.currentPrice - a.currentPrice;
        if (sortBy === 'discount') return (b.discountPercent || 0) - (a.discountPercent || 0);
        return new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime();
      });
  }, [products, searchTerm, selectedCategory, selectedCurrency, sortBy]);

  const handleSyncProduct = async (product: ScrapedProduct) => {
    if (!isSupabaseConfigured) {
      onOpenSupabaseModal();
      return;
    }
    setSyncingId(product.id);
    try {
      await onSyncSingleProduct(product);
    } finally {
      setSyncingId(null);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `scraped_products_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = ['id', 'title', 'brand', 'category', 'current_price', 'currency', 'discount_percent', 'rating', 'in_stock', 'source_domain', 'product_url'];
    const rows = products.map((p) => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.brand || ''}"`,
      `"${p.category}"`,
      p.currentPrice,
      p.currency,
      p.discountPercent,
      p.rating,
      p.inStock,
      p.sourceDomain,
      p.productUrl,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `scraped_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = (product: ScrapedProduct) => {
    navigator.clipboard.writeText(JSON.stringify(product, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const hasEuros = products.some((p) => p.currency === '€');

  return (
    <div className="space-y-4">
      {/* Search, Filter & Action Bar */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, marque, wilaya (ex: iPhone, Alger, Oran)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        {/* Currency filter selector */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            aria-label="Filtrer par devise"
            className="bg-slate-900 border border-emerald-500/30 rounded-lg px-2.5 py-2 text-xs text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
          >
            <option value="all">Toutes Devises ({products.length})</option>
            <option value="DA">🇩🇿 En Dinars (DA) uniquement</option>
            <option value="€">🇪🇺 En Euros (€) uniquement</option>
          </select>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filtrer par catégorie"
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-400"
          >
            <option value="all">Toutes Catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort by */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            aria-label="Trier les produits"
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-400"
          >
            <option value="discount">Meilleur Rabais %</option>
            <option value="price_asc">Prix Croissant</option>
            <option value="price_desc">Prix Décroissant</option>
            <option value="recent">Plus Récent</option>
          </select>
        </div>

        {/* Purge Euros action if mixed */}
        {hasEuros && onRemoveCurrency && (
          <button
            onClick={() => onRemoveCurrency('€')}
            className="px-2.5 py-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 font-mono text-xs flex items-center gap-1 transition-all"
            title="Supprimer les anciens articles de démo en Euros pour n'avoir que Ouedkniss en DA"
          >
            Purger les €
          </button>
        )}

        {/* Export & Supabase Sync Actions */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleExportCsv}
            disabled={products.length === 0}
            className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            onClick={handleExportJson}
            disabled={products.length === 0}
            className="px-2.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <Code className="w-3.5 h-3.5" /> JSON
          </button>
          <button
            onClick={onBulkSyncSupabase}
            disabled={products.length === 0}
            className="px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[#00ff88] hover:bg-emerald-500/30 flex items-center gap-1.5 font-bold transition-all disabled:opacity-40"
          >
            <Database className="w-3.5 h-3.5" /> Sync Supabase
          </button>
        </div>
      </div>

      {/* Product List Result Count */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
        <span>
          AFFICHE: <strong className="text-emerald-400">{filteredProducts.length}</strong> / {products.length} PRODUITS ASPIRÉS
        </span>
        <span>
          BASE DE DONNÉES: {isSupabaseConfigured ? '🟢 SUPABASE CONNECTÉ' : '🟡 LOCAL RESILIENT'}
        </span>
      </div>

      {/* Grid of Product Cards */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 font-mono text-xs text-slate-500">
          Aucun produit ne correspond à vos critères de filtrage.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const hasDiscount = product.discountPercent > 0;
            const isSyncing = syncingId === product.id;

            return (
              <div
                key={product.id}
                className="group relative rounded-xl bg-slate-950/90 border border-slate-800/80 hover:border-emerald-500/50 p-3.5 transition-all duration-300 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(0,255,102,0.15)] overflow-hidden"
              >
                {/* Cyber corner accents */}
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-emerald-500/30 group-hover:border-emerald-400 transition-colors" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-emerald-500/30 group-hover:border-emerald-400 transition-colors" />

                <div>
                  {/* Image container with cyber overlay */}
                  <div className="relative aspect-square w-full rounded-lg bg-slate-900 border border-slate-800 overflow-hidden mb-3">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
                      }}
                    />

                    {/* Discount badge */}
                    {hasDiscount && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-rose-600/90 text-white font-mono font-bold text-[10px] tracking-wider border border-rose-400/50 shadow-md">
                        -{product.discountPercent}%
                      </div>
                    )}

                    {/* AI Confidence badge */}
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 text-cyan-300 font-mono text-[9px] border border-cyan-500/30 flex items-center gap-1 backdrop-blur-sm">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                      {product.aiConfidence}%
                    </div>

                    {/* Source Domain Tag */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-slate-300 font-mono text-[9px] border border-slate-700 truncate max-w-[130px]">
                      {product.sourceDomain}
                    </div>
                  </div>

                  {/* Title & Brand */}
                  <div className="space-y-1 mb-2">
                    <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider truncate">
                      {product.brand || product.category}
                    </div>
                    <h3 className="font-mono text-xs font-semibold text-slate-100 line-clamp-2 group-hover:text-emerald-300 transition-colors">
                      {product.title}
                    </h3>
                  </div>

                  {/* Price Section */}
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-lg font-black font-mono text-[#00ff66]">
                      {product.currentPrice.toFixed(2)} {product.currency}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs line-through text-slate-500 font-mono">
                        {product.originalPrice.toFixed(2)} {product.currency}
                      </span>
                    )}
                  </div>

                  {/* Stock & Rating info */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-3 pt-2 border-t border-slate-900">
                    <span
                      className={`flex items-center gap-1 ${
                        product.inStock ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      {product.inStock ? 'En stock' : 'Rupture'}
                    </span>
                    {product.rating > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {product.rating.toFixed(1)} ({product.reviewsCount})
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900 font-mono text-xs">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setInspectingProduct(product)}
                      className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/40 flex items-center justify-center gap-1 text-[11px] transition-colors"
                      title="Inspecter ADN Matrix"
                    >
                      <Code className="w-3 h-3 text-cyan-400" /> Matrix
                    </button>

                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 flex items-center justify-center gap-1 text-[11px] transition-colors"
                      title="Voir produit sur le site source"
                    >
                      <ExternalLink className="w-3 h-3 text-emerald-400" /> Voir
                    </a>
                  </div>

                  {/* Supabase Sync Button */}
                  <button
                    onClick={() => handleSyncProduct(product)}
                    disabled={isSyncing}
                    className={`w-full py-1.5 px-2 rounded border flex items-center justify-center gap-1.5 text-[11px] transition-all ${
                      product.syncedToSupabase
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-[#00ff88]'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30'
                    }`}
                  >
                    <Database className="w-3 h-3" />
                    {isSyncing
                      ? 'Sync en cours...'
                      : product.syncedToSupabase
                      ? 'Synchronisé Supabase'
                      : 'Envoyer à Supabase'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Matrix DNA Inspection Modal */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl rounded-xl bg-slate-950 border border-emerald-500/40 p-5 shadow-2xl font-mono text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Code className="w-4 h-4" />
                <span>INSPECTION ADN MATRICIEL // {inspectingProduct.id}</span>
              </div>
              <button
                onClick={() => setInspectingProduct(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Titre: <strong className="text-slate-200">{inspectingProduct.title}</strong></span>
                <button
                  onClick={() => handleCopyJson(inspectingProduct)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400 hover:border-emerald-400 flex items-center gap-1 transition-colors"
                >
                  {copiedJson ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedJson ? 'Copié !' : 'Copier JSON'}
                </button>
              </div>

              {/* Raw JSON viewer */}
              <div className="max-h-80 overflow-y-auto p-3 rounded-lg bg-black/80 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono leading-relaxed select-text">
                <pre>{JSON.stringify(inspectingProduct, null, 2)}</pre>
              </div>

              {/* Quick specs pill */}
              {inspectingProduct.specs && Object.keys(inspectingProduct.specs).length > 0 && (
                <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase block mb-1.5">Attributs DOM Détectés :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(inspectingProduct.specs).map(([k, v]) => (
                      <span key={k} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                        <strong>{k}:</strong> {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-slate-900 flex justify-end gap-2">
              <button
                onClick={() => setInspectingProduct(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
