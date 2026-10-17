import React, { useState } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  HardDrive,
  Cpu,
  Layers,
  X,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { ScrapedProduct, SupabaseConfig } from '../types';
import { syncProductsToSupabase } from '../utils/supabaseClient';
import { cyberAudio } from '../utils/cyberAudio';

export interface CategorySyncPromptData {
  categoryName: string;
  categorySlug: string;
  categoryIndex: number;
  totalCategories: number;
  newItemsCount: number;
  totalLocalItems: number;
  categoryProducts: ScrapedProduct[];
}

interface CategorySyncPromptModalProps {
  data: CategorySyncPromptData | null;
  supabaseConfig: SupabaseConfig;
  onClose: () => void;
  onSyncAndClearLocal: (syncedCount: number) => void;
  onSyncKeepLocal: (syncedCount: number) => void;
  onClearLocalOnly: () => void;
  onOpenSupabaseConfig: () => void;
  onGoToTemuTab: () => void;
}

export const CategorySyncPromptModal: React.FC<CategorySyncPromptModalProps> = ({
  data,
  supabaseConfig,
  onClose,
  onSyncAndClearLocal,
  onSyncKeepLocal,
  onClearLocalOnly,
  onOpenSupabaseConfig,
  onGoToTemuTab,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [lastSyncedCount, setLastSyncedCount] = useState<number>(0);

  if (!data) return null;

  const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.anonKey);
  const isHighMemory = data.totalLocalItems >= 3500;
  const isCriticalMemory = data.totalLocalItems >= 4500;

  const handleSync = async (clearLocalAfter: boolean) => {
    if (!isSupabaseConfigured) {
      onOpenSupabaseConfig();
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    try {
      const targetItems = data.categoryProducts.length > 0 ? data.categoryProducts : [];
      // Sync products to Supabase
      const result = await syncProductsToSupabase(targetItems, supabaseConfig);

      if (result.success) {
        setSyncSuccess(true);
        setLastSyncedCount(result.count || targetItems.length);
        cyberAudio.playComplete();

        setTimeout(() => {
          if (clearLocalAfter) {
            onSyncAndClearLocal(result.count || targetItems.length);
          } else {
            onSyncKeepLocal(result.count || targetItems.length);
          }
          onClose();
        }, 1200);
      } else {
        setSyncError(result.error || 'Erreur lors de la synchronisation Supabase');
        cyberAudio.playMatrixGlitch();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réseau';
      setSyncError(msg);
      cyberAudio.playMatrixGlitch();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSyncing) onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-950/95 border-2 border-emerald-500/80 shadow-[0_0_50px_rgba(0,255,102,0.35)] overflow-hidden text-slate-100 font-sans">
        {/* Top energy beam */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-[#00ff88]" />

        {/* Ambient neon radial glows */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-400 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.4)] shrink-0">
              <CheckCircle2 className="w-7 h-7 text-[#00ff88] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#00ff88] border border-emerald-500/30 text-[10px] font-mono font-black uppercase tracking-wider">
                  Catégorie Aspirée
                </span>
                <span className="text-xs font-mono text-cyan-300">
                  {data.categoryIndex}/{data.totalCategories}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">
                « {data.categoryName} »
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSyncing}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Key Counter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Articles Aspirés</div>
              <div className="text-2xl sm:text-3xl font-black text-[#00ff88] font-mono">
                +{data.newItemsCount.toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40 text-center">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Total en Mémoire</div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
                {data.totalLocalItems.toLocaleString()}
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border text-center col-span-2 sm:col-span-1 ${
                isCriticalMemory
                  ? 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                  : isHighMemory
                  ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                  : 'bg-slate-900/90 border-slate-800 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-mono uppercase">Statut RAM Mobile</div>
              <div className="text-sm font-black font-mono mt-1 flex items-center justify-center gap-1">
                {isCriticalMemory ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                    <span>Critique (&gt;4500)</span>
                  </>
                ) : isHighMemory ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Élevé (&gt;3500)</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span>Fluide 60 FPS</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Educational notice on RAM vs Cloud */}
          <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-bold text-white">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Optimisation Mémoire & Fluidité Webpage</span>
            </div>
            <p className="leading-relaxed text-slate-300">
              Lorsque l'application dépasse <strong className="text-white">4 000 à 5 000 articles</strong> en mémoire vive, le navigateur mobile peut saturer et se bloquer.
            </p>
            <p className="leading-relaxed text-emerald-300 font-medium">
              💡 <strong>Solution recommandée :</strong> Synchronisez ces articles avec votre base <strong>Supabase Cloud</strong> pour alléger la page et vider la RAM locale. Les listes et l'onglet <strong>TEMU-DZ</strong> s'afficheront ensuite directement depuis Supabase de manière instantanée et fluide !
            </p>
          </div>

          {/* Sync Success State */}
          {syncSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-400 text-emerald-200 text-xs font-mono flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#00ff88] shrink-0" />
              <div>
                <strong>{lastSyncedCount} articles synchronisés avec succès vers Supabase !</strong>
                <div>Libération de la mémoire RAM en cours...</div>
              </div>
            </div>
          )}

          {/* Sync Error State */}
          {syncError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs font-mono flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Erreur de synchronisation :</strong>
                <div>{syncError}</div>
                <button
                  type="button"
                  onClick={onOpenSupabaseConfig}
                  className="mt-1.5 underline text-cyan-300 hover:text-white"
                >
                  Vérifier les paramètres Supabase
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {/* Primary Action: Sync to Supabase & Clear RAM */}
            <button
              type="button"
              disabled={isSyncing}
              onClick={() => handleSync(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-[#00ff88] to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(0,255,102,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synchronisation vers Supabase en cours...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-slate-950" />
                  <span>1. Synchroniser vers Supabase & Vider la RAM (Recommandé)</span>
                </>
              )}
            </button>

            {/* Secondary Action: Sync to Supabase & Keep in Local RAM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={() => handleSync(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Cloud className="w-4 h-4 text-cyan-400" />
                <span>Sync Supabase (Garder Local)</span>
              </button>

              <button
                type="button"
                disabled={isSyncing}
                onClick={onClearLocalOnly}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-400 text-slate-300 hover:text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Vider la RAM sans Sync</span>
              </button>
            </div>

            {/* Tertiary Action: Open TEMU Tab or Dismiss */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToTemuTab();
                }}
                className="text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ouvrir l'onglet TEMU-DZ (Supabase Cloud)</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white underline cursor-pointer"
              >
                Conserver et fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
