import React, { useState } from 'react';
import { ScrapingQueueItem, ScrapedProduct } from '../types';
import {
  Layers,
  Play,
  Square,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ListOrdered,
} from 'lucide-react';
import { OUEDKNISS_CATEGORIES } from '../data/ouedknissCategories';

interface ScrapingQueueManagerProps {
  queue: ScrapingQueueItem[];
  isProcessing: boolean;
  activeItemId?: string;
  onAddToQueue: (url: string, title?: string, category?: string) => void;
  onRemoveFromQueue: (id: string) => void;
  onClearQueue: () => void;
  onCompleteQueued: () => void;
  onInstantCompleteQueued: () => void;
  onAddAllMissingCategoriesToQueue: () => void;
  currentCatalogCount: number;
}

export const ScrapingQueueManager: React.FC<ScrapingQueueManagerProps> = ({
  queue,
  isProcessing,
  activeItemId,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
  onCompleteQueued,
  onInstantCompleteQueued,
  onAddAllMissingCategoriesToQueue,
  currentCatalogCount,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');

  const queuedItems = queue.filter((item) => item.status === 'queued');
  const completedItems = queue.filter((item) => item.status === 'completed');
  const activeItem = queue.find((item) => item.id === activeItemId || item.status === 'active');

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customUrl.startsWith('http')) return;
    onAddToQueue(customUrl.trim(), customTitle.trim() || undefined);
    setCustomUrl('');
    setCustomTitle('');
  };

  return (
    <div className="rounded-2xl bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 border border-cyan-500/40 p-4 sm:p-5 backdrop-blur-xl shadow-[0_0_35px_rgba(0,240,255,0.12)] relative overflow-hidden transition-all">
      {/* Sci-fi corner brackets */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ListOrdered className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white tracking-wide">
                FILE D'ATTENTE D'ASPIRATION // QUEUED ENGINE
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-bold">
                {queuedItems.length} EN ATTENTE (QUEUED)
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Gestionnaire séquentiel : empilez des cibles et exécutez tout le batch sans interruption.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Complete Queued Button */}
          {queuedItems.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={onCompleteQueued}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-[#00ff88] to-emerald-400 text-slate-950 font-mono text-xs font-black flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.4)] hover:brightness-110 active:scale-98 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed animate-pulse"
                title="Lancer l'aspiration séquentielle de tous les éléments en attente (Queued)"
              >
                <Zap className="w-4 h-4 fill-black text-black" />
                <span>COMPLÉTER LE QUEUED ({queuedItems.length})</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={onInstantCompleteQueued}
                className="hidden md:flex px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 hover:text-white font-mono text-xs font-bold items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Aspiration instantanée accélérée de tous les éléments queued"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sceller Instantané</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAddAllMissingCategoriesToQueue}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Ajouter automatiquement toutes les catégories Ouedkniss manquantes à la file"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Empiler Catégories Manquantes</span>
            </button>
          )}

          {queue.length > 0 && !isProcessing && (
            <button
              type="button"
              onClick={onClearQueue}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              title="Vider la file d'attente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Réduire la file' : 'Déplier la file'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Active processing HUD if currently running */}
          {isProcessing && activeItem && (
            <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-400/50 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                <div>
                  <span className="text-[10px] font-mono text-cyan-300 uppercase block font-bold">
                    En cours de traitement dans le Queued :
                  </span>
                  <span className="text-xs font-mono font-bold text-white truncate max-w-[280px] sm:max-w-md block">
                    {activeItem.title}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-black/60 border border-cyan-400 text-cyan-300 font-mono text-xs font-bold">
                {activeItem.itemsExtracted || 0} articles aspirés
              </span>
            </div>
          )}

          {/* Queue Items List */}
          {queue.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
              <Clock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-mono text-slate-400">
                La file d'attente d'aspiration est actuellement vide.
              </p>
              <button
                type="button"
                onClick={onAddAllMissingCategoriesToQueue}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Empiler les 17 Catégories Ouedkniss dans la file</span>
              </button>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800/80 divide-y divide-slate-800/80 bg-slate-950/60 font-mono text-xs">
              {queue.map((item, idx) => {
                const isCurrent = item.id === activeItemId || item.status === 'active';
                const isItemCompleted = item.status === 'completed';
                const isQueued = item.status === 'queued';

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 sm:p-3 transition-colors ${
                      isCurrent
                        ? 'bg-cyan-950/50 border-l-2 border-cyan-400'
                        : isItemCompleted
                        ? 'bg-slate-950/40 text-slate-400'
                        : 'bg-slate-900/30 hover:bg-slate-900/70 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-[11px] font-bold text-slate-500 w-5 text-right shrink-0">
                        #{idx + 1}
                      </span>

                      {/* Status indicator */}
                      {isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                      ) : isItemCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#00ff88] shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate text-xs">
                            {item.title}
                          </span>
                          {item.category && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 hidden sm:inline">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {item.url}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isQueued && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                          QUEUED
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-bold animate-pulse">
                          EN COURS
                        </span>
                      )}
                      {isItemCompleted && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[#00ff88] text-[10px] font-bold">
                          +{item.itemsExtracted || 24} SCELLÉS
                        </span>
                      )}

                      {!isProcessing && (
                        <button
                          type="button"
                          onClick={() => onRemoveFromQueue(item.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Retirer de la file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick-add bar for any custom URL */}
          <form onSubmit={handleAddCustom} className="flex flex-col sm:flex-row items-stretch gap-2 pt-1">
            <input
              type="url"
              placeholder="Ajouter une URL personnalisée à la file (ex: https://...)"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-xs font-mono text-slate-200 outline-none"
            />
            <input
              type="text"
              placeholder="Libellé facultatif"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="sm:w-44 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 text-xs font-mono text-slate-200 outline-none"
            />
            <button
              type="submit"
              disabled={!customUrl.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Mettre en Queue</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
