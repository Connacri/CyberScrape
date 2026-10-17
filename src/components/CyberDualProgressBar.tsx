import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Database,
  StopCircle,
  Sparkles,
  ArrowUpRight,
  Radio,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { cyberAudio } from '../utils/cyberAudio';

export interface CyberDualProgressBarProps {
  // Aspiration (Scraping) State
  isScraping: boolean;
  scrapingProgress?: number; // 0 - 100
  scrapingCurrent?: number;
  scrapingTotal?: number;
  scrapingLabel?: string;
  scrapingPage?: number;
  onStopScraping?: () => void;

  // Supabase Upload/Sync State
  isSyncingSupabase: boolean;
  supabaseSyncProgress: {
    current: number;
    total: number;
    percent: number;
    statusText?: string;
  };
}

export const CyberDualProgressBar: React.FC<CyberDualProgressBarProps> = ({
  isScraping,
  scrapingProgress = 0,
  scrapingCurrent = 0,
  scrapingTotal = 0,
  scrapingLabel = 'Aspiration matricielle en cours...',
  scrapingPage,
  onStopScraping,
  isSyncingSupabase,
  supabaseSyncProgress,
}) => {
  // Only render if either scraping or Supabase syncing is in progress
  const isVisible = isScraping || isSyncingSupabase;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -16, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -16, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="sticky top-14 sm:top-16 z-25 w-full bg-slate-950/98 border-b shadow-2xl backdrop-blur-md overflow-hidden"
          style={{
            borderColor: isSyncingSupabase
              ? 'rgba(6, 182, 212, 0.4)'
              : 'rgba(0, 255, 102, 0.4)',
          }}
        >
          {/* Subtle animated scanline glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: isSyncingSupabase
                ? 'linear-gradient(90deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.15) 50%, rgba(6,182,212,0.1) 100%)'
                : 'linear-gradient(90deg, rgba(0,255,102,0.1) 0%, rgba(16,185,129,0.15) 50%, rgba(0,255,102,0.1) 100%)',
            }}
          />

          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 space-y-2">
            {/* ========================================================= */}
            {/* MODE 1: ENVOI VERS SUPABASE EN COURS ("j'envo vers supabase") */}
            {/* ========================================================= */}
            {isSyncingSupabase ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center justify-center">
                      <Database className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <div className="absolute -inset-1 rounded-full bg-cyan-400/20 animate-ping" />
                    </div>
                    <span className="font-bold text-cyan-300 tracking-wide uppercase flex items-center gap-1.5">
                      <span>Synchronisation Cloud Supabase</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-200">
                        {supabaseSyncProgress.percent}%
                      </span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-cyan-400 font-bold">
                      {supabaseSyncProgress.current.toLocaleString('fr-FR')} /{' '}
                      {supabaseSyncProgress.total.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">articles scellés</span>
                  </div>
                </div>

                {/* Cyber Progress Track */}
                <div className="relative w-full h-2.5 sm:h-3 rounded-full bg-slate-900 border border-cyan-500/40 p-0.5 overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-[#00f0ff] relative shadow-[0_0_12px_rgba(0,240,255,0.7)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(3, supabaseSyncProgress.percent))}%` }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0.25)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[spin_3s_linear_infinite]" />
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="truncate max-w-[80%] text-cyan-200/90 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
                    {supabaseSyncProgress.statusText || 'Batch upserting records directly into Supabase...'}
                  </span>
                  <span className="text-slate-500 shrink-0">B-Tree Primary Index</span>
                </div>
              </div>
            ) : null}

            {/* ========================================================= */}
            {/* MODE 2: ASPIRATION EN COURS ("lorsque je suce") */}
            {/* ========================================================= */}
            {isScraping && !isSyncingSupabase ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-[#00ff88] fill-current animate-bounce" />
                      <div className="absolute -inset-1 rounded-full bg-emerald-400/20 animate-ping" />
                    </div>
                    <span className="font-bold text-[#00ff88] tracking-wide uppercase truncate flex items-center gap-1.5">
                      <span>Aspiration en cours</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/50 text-[#00ff88]">
                        {Math.round(scrapingProgress)}%
                      </span>
                    </span>
                    {scrapingPage ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/60 border border-slate-700 text-slate-300 font-mono hidden xs:inline">
                        Page {scrapingPage}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <span className="text-[#00ff88] font-black font-mono">
                        {scrapingCurrent.toLocaleString('fr-FR')}
                      </span>
                      {scrapingTotal > 0 && (
                        <span className="text-slate-400 text-[11px]">
                          / {scrapingTotal.toLocaleString('fr-FR')}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 hidden sm:inline">articles</span>
                    </div>

                    {onStopScraping && (
                      <button
                        type="button"
                        onClick={() => {
                          onStopScraping();
                          cyberAudio.playClick();
                        }}
                        className="h-6 px-2 rounded-lg bg-red-950/60 border border-red-500/50 hover:bg-red-900/60 text-red-300 hover:text-white flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all active:scale-95 shrink-0"
                        title="Stopper l'aspiration"
                      >
                        <StopCircle className="w-3 h-3 text-red-400" />
                        <span>Stop</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cyber Progress Track */}
                <div className="relative w-full h-2.5 sm:h-3 rounded-full bg-slate-900 border border-emerald-500/40 p-0.5 overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#00ff88] to-cyan-400 relative shadow-[0_0_12px_rgba(0,255,102,0.7)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(3, scrapingProgress))}%` }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0.25)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[spin_3s_linear_infinite]" />
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="truncate max-w-[80%] text-emerald-200/90 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-[#00ff88] animate-pulse shrink-0" />
                    {scrapingLabel}
                  </span>
                  <span className="text-[#00ff88] font-bold text-[10px] shrink-0">~28 art/sec</span>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
