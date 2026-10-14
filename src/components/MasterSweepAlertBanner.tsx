import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Volume2,
  X,
  ExternalLink,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cyberAudio } from '../utils/cyberAudio';

export interface CategoryCompletionAlertData {
  id: string;
  categoryName: string;
  categorySlug: string;
  categoryIndex: number;
  totalCategories: number;
  newItemsCount: number;
  updatedCount: number;
  totalCatalog: number;
  timestamp: number;
}

interface MasterSweepAlertBannerProps {
  alert: CategoryCompletionAlertData | null;
  onDismiss: () => void;
  onViewCategory?: (categorySlug: string) => void;
}

export const MasterSweepAlertBanner: React.FC<MasterSweepAlertBannerProps> = ({
  alert,
  onDismiss,
  onViewCategory,
}) => {
  const [progressWidth, setProgressWidth] = useState(100);

  useEffect(() => {
    if (!alert) return;
    setProgressWidth(100);

    const duration = 8500; // 8.5 seconds display
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgressWidth((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const handleReplayAudio = () => {
    cyberAudio.playMasterSweepCategoryAlert(alert.categoryName, alert.newItemsCount);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-16 sm:top-20 right-2 sm:right-6 z-50 max-w-[95vw] sm:max-w-md w-full animate-slideInRight"
    >
      <div className="relative rounded-2xl bg-slate-950/95 border-2 border-[#00ff88] shadow-[0_0_35px_rgba(0,255,136,0.35)] backdrop-blur-xl p-4 overflow-hidden text-slate-100 font-sans">
        {/* Top Glowing Laser Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-[#00ff88] transition-all duration-75"
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {/* Ambient Radar Glow */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-3">
          {/* Animated Success Badge Icon */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,102,0.4)]">
              <CheckCircle2 className="w-6 h-6 text-[#00ff88] animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
          </div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-[#00ff88] text-[10px] font-mono font-black tracking-wider uppercase">
                CATÉGORIE SCELLÉE 100%
              </span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold">
                Étape {alert.categoryIndex}/{alert.totalCategories}
              </span>
            </div>

            <h4 className="text-sm font-bold text-white mt-1 truncate">
              {alert.categoryName}
            </h4>

            <p className="text-xs font-mono text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
              <span className="text-[#00ff88] font-bold">
                +{alert.newItemsCount} nouveaux articles
              </span>
              {alert.updatedCount > 0 && (
                <span className="text-cyan-400">
                  ({alert.updatedCount} mis à jour)
                </span>
              )}
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">
                Total: {alert.totalCatalog.toLocaleString()}
              </span>
            </p>

            {/* Action Bar */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleReplayAudio}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-emerald-400 text-[11px] font-mono text-slate-200 hover:text-[#00ff88] flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Rejouer le carillon et l'annonce vocale"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rejouer Son</span>
              </button>

              {onViewCategory && (
                <button
                  type="button"
                  onClick={() => onViewCategory(alert.categorySlug)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Voir dans Catalogue</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onDismiss}
            className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Masquer la notification"
            aria-label="Masquer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
