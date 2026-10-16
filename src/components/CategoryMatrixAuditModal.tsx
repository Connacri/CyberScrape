import React, { useState, useEffect, useMemo } from 'react';
import {
  Radar,
  X,
  Play,
  CheckCircle2,
  Layers,
  FileText,
  ShoppingBag,
  Sparkles,
  Zap,
  ShieldCheck,
  Megaphone,
  Building,
  RefreshCw,
  Search,
  ArrowRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  OUEDKNISS_CATEGORIES,
  getFullMarketplaceAuditStats,
  CategoryAuditStats,
} from '../data/ouedknissCategories';
import { cyberAudio } from '../utils/cyberAudio';

interface CategoryMatrixAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchFullSweep: () => void;
  onLaunchSingleCategory: (categorySlug: string) => void;
  currentActiveCategorySlug?: string | null;
}

export const CategoryMatrixAuditModal: React.FC<CategoryMatrixAuditModalProps> = ({
  isOpen,
  onClose,
  onLaunchFullSweep,
  onLaunchSingleCategory,
  currentActiveCategorySlug,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [revealedIndex, setRevealedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const auditData = useMemo(() => getFullMarketplaceAuditStats(), []);

  // Run cyber reconnaissance scan when modal opens
  useEffect(() => {
    if (!isOpen) {
      setIsScanning(false);
      setScanProgress(0);
      setRevealedIndex(0);
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setRevealedIndex(0);

    try {
      cyberAudio.playScanSweep();
    } catch {
      // ignore
    }

    const totalCats = auditData.categories.length;
    let currentIdx = 0;

    const interval = setInterval(() => {
      currentIdx++;
      setRevealedIndex(currentIdx);
      const pct = Math.min(100, Math.round((currentIdx / totalCats) * 100));
      setScanProgress(pct);

      if (currentIdx % 3 === 0) {
        try {
          cyberAudio.playHoloTap(1200 + currentIdx * 40);
        } catch {}
      }

      if (currentIdx >= totalCats) {
        clearInterval(interval);
        setIsScanning(false);
        try {
          cyberAudio.playComplete();
        } catch {}
      }
    }, 70);

    return () => clearInterval(interval);
  }, [isOpen, auditData]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return auditData.categories;
    const q = searchQuery.toLowerCase().trim();
    return auditData.categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.badge.toLowerCase().includes(q)
    );
  }, [auditData, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Background Matrix Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.1)_0%,transparent_75%)] pointer-events-none" />

      {/* Main Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#050b14] border-2 border-[#00ff66]/50 rounded-2xl shadow-[0_0_60px_rgba(0,255,102,0.35)] overflow-hidden font-mono text-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-black/70 border-b border-[#00ff66]/30">
          <div className="flex items-center gap-3">
            <div className="relative p-2 rounded-xl bg-[#00ff66]/15 border border-[#00ff66]/40 text-[#00ff66]">
              <Radar className={`w-5 h-5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#00ff88] bg-[#00ff66]/10 px-2 py-0.5 rounded border border-[#00ff66]/30">
                  RECONNAISSANCE MATRICIELLE OUEDKNISS
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  v4.2 PRO-CRAWLER
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                AUDIT PRÉ-VOL // SCAN DES CATÉGORIES, PAGES & BOUTIQUES
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white hover:border-[#00ff66] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Telemetry Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-950/80 border-b border-slate-800">
          {/* Card 1: Total Categories */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Catégories Détectées
              </span>
              <span className="text-lg font-black text-white font-mono-numbers">
                {auditData.totalCategories} MARCHÉS
              </span>
            </div>
          </div>

          {/* Card 2: Total Pages Existantes */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Pages Existantes
              </span>
              <span className="text-lg font-black text-[#00f0ff] font-mono-numbers">
                {auditData.totalMarketPages.toLocaleString('fr-FR')} PAGES
              </span>
            </div>
          </div>

          {/* Card 3: Boutiques Certifiées */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Stores & Boutiques Pro
              </span>
              <span className="text-lg font-black text-yellow-400 font-mono-numbers">
                ~{auditData.totalBoutiques.toLocaleString('fr-FR')} STORES
              </span>
            </div>
          </div>

          {/* Card 4: Ads & Pubs */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                Pubs & Ads Sponsorisées
              </span>
              <span className="text-lg font-black text-purple-400 font-mono-numbers">
                ~{auditData.totalAdsPubs.toLocaleString('fr-FR')} PUBS
              </span>
            </div>
          </div>
        </div>

        {/* Scan Status Bar & Search Filter */}
        <div className="px-4 sm:px-6 py-2.5 bg-black/60 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isScanning ? (
              <div className="flex items-center gap-2 text-xs text-yellow-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
                <span>SONDAGE MATRICIEL EN COURS ({scanProgress}%)...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-[#00ff88] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#00ff66]" />
                <span>AUDIT COMPLET TERMINÉ // 100% DES CATÉGORIES CARTOGRAPHIÉES</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer une catégorie..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900/90 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00ff66]"
              />
            </div>
          </div>
        </div>

        {/* Category Matrix Table / List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 cyber-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCategories.map((cat, idx) => {
              const isRevealed = idx < revealedIndex;
              const isCurrent = currentActiveCategorySlug === cat.slug;

              return (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded-xl border transition-all duration-300 ${
                    isCurrent
                      ? 'bg-emerald-950/40 border-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.3)]'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                  } ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-1'}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white hover:text-[#00ff88] transition-colors">
                          {cat.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-black">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {cat.badge} • ouedkniss.com/{cat.slug}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onLaunchSingleCategory(cat.slug);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#00ff66]/10 hover:bg-[#00ff66] text-[#00ff66] hover:text-black border border-[#00ff66]/30 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                      title="Aspirer uniquement cette catégorie"
                    >
                      <span>Aspirer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Matrix Telemetry Badges */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80 text-[10px]">
                    {/* Pages */}
                    <div className="px-2 py-1 rounded bg-black/60 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Pages</span>
                      <span className="text-cyan-400 font-bold font-mono-numbers">
                        {cat.totalPages.toLocaleString('fr-FR')}
                      </span>
                    </div>

                    {/* Articles */}
                    <div className="px-2 py-1 rounded bg-black/60 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Articles</span>
                      <span className="text-emerald-400 font-bold font-mono-numbers">
                        {cat.totalArticles.toLocaleString('fr-FR')}
                      </span>
                    </div>

                    {/* Boutiques */}
                    <div className="px-2 py-1 rounded bg-black/60 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Stores</span>
                      <span className="text-yellow-400 font-bold font-mono-numbers">
                        {cat.boutiquesCount.toLocaleString('fr-FR')}
                      </span>
                    </div>

                    {/* Ads Pubs */}
                    <div className="px-2 py-1 rounded bg-black/60 border border-slate-800">
                      <span className="text-slate-500 block text-[9px] uppercase">Pubs</span>
                      <span className="text-purple-400 font-bold font-mono-numbers">
                        {cat.adsPubsCount.toLocaleString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-black/80 border-t border-[#00ff66]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00ff66] animate-pulse shrink-0" />
            <span>
              Suivi en direct des pages, basculement automatique dès qu'une catégorie est scellée.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex-1 sm:flex-initial"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={() => {
                onLaunchFullSweep();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-[#00ff88] to-cyan-400 text-slate-950 text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-all flex-1 sm:flex-initial"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>LANCER L'ASPIRATION GLOBALE</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
