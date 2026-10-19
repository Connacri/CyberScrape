import React, { useState } from 'react';
import { Trash2, AlertTriangle, Database, Cloud, CheckCircle, RefreshCw, X } from 'lucide-react';
import type { SupabaseConfig } from '../types';
import { clearStoredProducts, clearSupabaseTable } from '../utils/supabaseClient';
import { cyberAudio } from '../utils/cyberAudio';

interface ClearDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleared: () => void;
  supabaseConfig: SupabaseConfig;
  productsCount: number;
}

export const ClearDatabaseModal: React.FC<ClearDatabaseModalProps> = ({
  isOpen,
  onClose,
  onCleared,
  supabaseConfig,
  productsCount,
}) => {
  const [clearLocal, setClearLocal] = useState(true);
  const [clearSupabase, setClearSupabase] = useState(Boolean(supabaseConfig.url && supabaseConfig.anonKey));
  const [isClearing, setIsClearing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsClearing(true);
    setStatusMessage('Purge en cours...');
    cyberAudio.playClick();

    try {
      if (clearLocal) {
        await clearStoredProducts();
      }

      if (clearSupabase && supabaseConfig.url && supabaseConfig.anonKey) {
        const res = await clearSupabaseTable(supabaseConfig);
        if (!res.success && res.error) {
          console.warn('[Supabase Clear]', res.error);
        }
      }

      cyberAudio.playCatalogPurged();
      setStatusMessage('Base de données réinitialisée avec succès (0 article).');
      setTimeout(() => {
        setIsClearing(false);
        onCleared();
        onClose();
      }, 700);
    } catch (err) {
      console.error('[Clear DB Error]', err);
      setIsClearing(false);
      setStatusMessage(err instanceof Error ? err.message : 'Erreur lors de la purge');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-rose-500/40 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.25)] overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-500/20 bg-rose-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-base font-bold text-white tracking-wide uppercase">
                Vider la Base de Données
              </h3>
              <p className="font-mono text-xs text-rose-300/80">Purge du catalogue & des tables Supabase</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200 space-y-1">
              <p className="font-bold">Attention : Cette action est irréversible.</p>
              <p className="text-rose-300/80 leading-relaxed">
                Elle réinitialise les <span className="font-bold text-white">{productsCount.toLocaleString('fr-DZ')}</span> articles
                et tous les contacts extraits. L'application démarrera avec une base de données strictement vide.
              </p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={clearLocal}
                onChange={(e) => setClearLocal(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Vider le catalogue local (Navigateur / IndexedDB)
                </div>
                <p className="text-slate-400 text-[11px]">
                  Supprime les articles, contacts, progression des catégories et compteurs locaux.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={clearSupabase}
                onChange={(e) => setClearSupabase(e.target.checked)}
                disabled={!supabaseConfig.url || !supabaseConfig.anonKey}
                className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 disabled:opacity-40"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                  Vider les tables Supabase Cloud ({supabaseConfig.tableName || 'scraped_products'})
                </div>
                <p className="text-slate-400 text-[11px]">
                  {supabaseConfig.url && supabaseConfig.anonKey
                    ? 'Supprime toutes les lignes synchronisées sur votre instance Supabase.'
                    : 'Supabase non configuré (seule la base locale sera vidée).'}
                </p>
              </div>
            </label>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950 font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isClearing || (!clearLocal && !clearSupabase)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] flex items-center gap-2 disabled:opacity-50"
          >
            {isClearing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Purge en cours...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Confirmer et Vider</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
