import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  HardDrive,
  RotateCcw,
  Trash2,
  AlertTriangle,
  X,
  Check,
  Loader2,
  Sparkles,
  Cloud,
  Layers,
} from 'lucide-react';
import { cyberAudio } from '../utils/cyberAudio';

export interface DatabaseControlButtonsProps {
  // Counts
  localCount: number;
  supabaseCount: number;
  isSupabaseConfigured: boolean;

  // Actions
  onClearSupabase: () => Promise<void> | void;
  onClearLocalDB: () => void;
  onResetAll: (alsoPurgeSupabase: boolean) => Promise<void> | void;

  // Optional layout variant: 'bar' (compact horizontal) | 'stack' (vertical drawer list) | 'grid'
  variant?: 'bar' | 'stack' | 'grid';
  className?: string;
}

type ConfirmActionType = 'clear_supabase' | 'clear_local' | 'reset_all' | null;

export const DatabaseControlButtons: React.FC<DatabaseControlButtonsProps> = ({
  localCount,
  supabaseCount,
  isSupabaseConfigured,
  onClearSupabase,
  onClearLocalDB,
  onResetAll,
  variant = 'bar',
  className = '',
}) => {
  const [activeConfirm, setActiveConfirm] = useState<ConfirmActionType>(null);
  const [alsoPurgeCloudOnReset, setAlsoPurgeCloudOnReset] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleOpenConfirm = (action: ConfirmActionType) => {
    setActiveConfirm(action);
    if (action === 'reset_all') {
      setAlsoPurgeCloudOnReset(false);
    }
    cyberAudio.playClick();
  };

  const handleCloseConfirm = () => {
    if (isProcessing) return;
    setActiveConfirm(null);
  };

  const handleExecuteConfirmedAction = async () => {
    setIsProcessing(true);
    try {
      if (activeConfirm === 'clear_supabase') {
        await onClearSupabase();
      } else if (activeConfirm === 'clear_local') {
        onClearLocalDB();
      } else if (activeConfirm === 'reset_all') {
        await onResetAll(alsoPurgeCloudOnReset);
      }
    } finally {
      setIsProcessing(false);
      setActiveConfirm(null);
    }
  };

  return (
    <>
      {/* ============================================================== */}
      {/* BUTTONS CONTAINER (BAR / STACK / GRID)                          */}
      {/* ============================================================== */}
      <div
        className={`${
          variant === 'bar'
            ? 'flex flex-wrap items-center gap-2'
            : variant === 'stack'
            ? 'space-y-2.5 w-full'
            : 'grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full'
        } ${className}`}
      >
        {/* 1. BOUTON VIDER SUPABASE */}
        <button
          type="button"
          onClick={() => handleOpenConfirm('clear_supabase')}
          disabled={!isSupabaseConfigured}
          title={
            !isSupabaseConfigured
              ? 'Supabase non configuré'
              : 'Supprimer tous les articles de la base de données Supabase Cloud'
          }
          className={`group relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 ${
            variant === 'stack' ? 'w-full' : ''
          } bg-gradient-to-r from-red-950/40 to-orange-950/30 border-red-500/40 text-red-300 hover:text-white hover:border-red-400 hover:bg-red-900/40 shadow-sm`}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform shrink-0">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div className="text-left truncate">
              <div className="truncate">Vider Supabase</div>
              <div className="text-[10px] text-red-400/80 font-normal truncate">
                Table Cloud distant
              </div>
            </div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-300 font-mono shrink-0">
            {supabaseCount > 0 ? `${supabaseCount.toLocaleString('fr-FR')} art.` : '0 art.'}
          </span>
        </button>

        {/* 2. BOUTON VIDER LOCAL DB */}
        <button
          type="button"
          onClick={() => handleOpenConfirm('clear_local')}
          title="Vider la mémoire RAM locale, le cache et la base IndexedDB (garde Supabase intact)"
          className={`group relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer active:scale-98 ${
            variant === 'stack' ? 'w-full' : ''
          } bg-gradient-to-r from-rose-950/40 to-pink-950/30 border-rose-500/40 text-rose-300 hover:text-white hover:border-rose-400 hover:bg-rose-900/40 shadow-sm`}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform shrink-0">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
            <div className="text-left truncate">
              <div className="truncate">Vider Local DB</div>
              <div className="text-[10px] text-rose-400/80 font-normal truncate">
                RAM + IndexedDB
              </div>
            </div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono shrink-0">
            {localCount > 0 ? `${localCount.toLocaleString('fr-FR')} art.` : '0 art.'}
          </span>
        </button>

        {/* 3. BOUTON RÉINITIALISER TOUT */}
        <button
          type="button"
          onClick={() => handleOpenConfirm('reset_all')}
          title="Réinitialiser l'ensemble de l'application : vider base locale, checkpoints et sessions"
          className={`group relative flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer active:scale-98 ${
            variant === 'stack' ? 'w-full' : ''
          } bg-gradient-to-r from-purple-950/40 to-slate-900 border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400 hover:bg-purple-900/40 shadow-sm`}
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:rotate-180 transition-transform duration-500 shrink-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <div className="text-left truncate">
              <div className="truncate">Réinitialiser Tout</div>
              <div className="text-[10px] text-purple-400/80 font-normal truncate">
                Reset usine global
              </div>
            </div>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 font-mono shrink-0">
            Reset
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* CYBER CONFIRMATION MODAL (SECURE & NO WINDOW.CONFIRM)           */}
      {/* ============================================================== */}
      <AnimatePresence>
        {activeConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseConfirm}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="relative w-full max-w-md rounded-2xl bg-slate-950 border border-red-500/50 p-5 sm:p-6 shadow-[0_0_50px_rgba(239,68,68,0.25)] font-mono text-slate-200 z-10 space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-red-500/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                    <AlertTriangle className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm sm:text-base tracking-wide uppercase">
                      {activeConfirm === 'clear_supabase' && 'Vider la Base Supabase'}
                      {activeConfirm === 'clear_local' && 'Vider la Base de Données Locale'}
                      {activeConfirm === 'reset_all' && 'Réinitialisation Totale'}
                    </h3>
                    <p className="text-[11px] text-red-400">Confirmation d'opération irréversible</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseConfirm}
                  disabled={isProcessing}
                  className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body Content */}
              <div className="space-y-3 text-xs leading-relaxed">
                {activeConfirm === 'clear_supabase' && (
                  <>
                    <p className="text-slate-300">
                      Vous êtes sur le point de <span className="text-red-400 font-bold">supprimer définitivement</span> tous les articles enregistrés dans la table Cloud Supabase.
                    </p>
                    <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Articles Supabase ciblés :</span>
                        <span className="font-bold text-red-300">{supabaseCount.toLocaleString('fr-FR')} articles</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Base locale (IndexedDB / RAM) :</span>
                        <span className="text-emerald-400 font-bold">Conservée intacte</span>
                      </div>
                    </div>
                  </>
                )}

                {activeConfirm === 'clear_local' && (
                  <>
                    <p className="text-slate-300">
                      Cette action va vider la <span className="text-rose-400 font-bold">mémoire RAM locale</span>, le cache du navigateur et la base <span className="text-white font-bold">IndexedDB</span>.
                    </p>
                    <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                      <div className="flex justify-between text-slate-300">
                        <span>Articles locaux en mémoire :</span>
                        <span className="font-bold text-rose-300">{localCount.toLocaleString('fr-FR')} articles</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Articles Supabase Cloud :</span>
                        <span className="text-cyan-400 font-bold">100% préservés en ligne</span>
                      </div>
                    </div>
                  </>
                )}

                {activeConfirm === 'reset_all' && (
                  <>
                    <p className="text-slate-300">
                      Cette opération remet à zéro l'ensemble du système : sessions, checkpoints de balayage, base IndexedDB et mémoire RAM.
                    </p>

                    {/* Option Checkbox: Also Purge Supabase Cloud */}
                    {isSupabaseConfigured && (
                      <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-purple-500/30 cursor-pointer hover:border-purple-500/60 transition-colors">
                        <input
                          type="checkbox"
                          checked={alsoPurgeCloudOnReset}
                          onChange={(e) => setAlsoPurgeCloudOnReset(e.target.checked)}
                          className="w-4 h-4 rounded text-red-500 accent-red-500 cursor-pointer"
                        />
                        <div className="text-[11px]">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-red-400" />
                            <span>Vider également Supabase Cloud ({supabaseCount.toLocaleString('fr-FR')} articles)</span>
                          </div>
                          <div className="text-slate-400 text-[10px]">
                            Cocher pour effacer à la fois le local ET le cloud distant
                          </div>
                        </div>
                      </label>
                    )}
                  </>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-900">
                <button
                  type="button"
                  onClick={handleCloseConfirm}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors text-xs font-bold"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleExecuteConfirmedAction}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold cursor-pointer transition-all flex items-center gap-2 text-xs shadow-lg shadow-red-900/40 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Nettoyage en cours...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirmer la suppression</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
