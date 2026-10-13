import React, { useEffect, useRef, useState } from 'react';
import { ScrapeJob } from '../types';
import { Terminal, Eye, MousePointer, Shield, Radio, Activity } from 'lucide-react';

interface AiCrawlerLiveHudProps {
  job: ScrapeJob;
  onClearLogs?: () => void;
}

export const AiCrawlerLiveHud: React.FC<AiCrawlerLiveHudProps> = ({ job, onClearLogs }) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);

  // Auto-scroll terminal on new logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [job.logs.length]);

  // Cycle bounding box highlights
  useEffect(() => {
    if (job.status !== 'aspirating' && job.status !== 'scanning') return;
    const interval = setInterval(() => {
      setActiveBoxIndex((prev) => (prev + 1) % 6);
    }, 450);
    return () => clearInterval(interval);
  }, [job.status]);

  const isCrawling = job.status === 'aspirating' || job.status === 'scanning';

  return (
    <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl overflow-hidden backdrop-blur-md shadow-2xl">
      {/* Top Cyber Window Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-cyan-500/20 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-cyan-300 font-bold tracking-wider uppercase ml-2 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            AI SCROLL CRAWLER // VIEWPORT SCANNER
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400">
            <Shield className="w-3 h-3" /> STEALTH_MODE: ACTIVE
          </span>
          <span className="text-cyan-400 flex items-center gap-1">
            <Activity className="w-3 h-3 animate-spin" /> PING: 38ms
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-cyan-500/20">
        {/* Left: Simulated Scrolling Browser Viewport */}
        <div className="lg:col-span-7 p-4 bg-black/40 relative">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-cyan-300">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              RENDERING EN TEMPS RÉEL (1920x1080)
            </span>
            <span className="text-emerald-400 font-bold">
              SCROLL Y: {job.crawlerState.scrollY || (isCrawling ? Math.floor(job.progress * 48) : 0)}px
            </span>
          </div>

          {/* Browser Frame Simulation */}
          <div className="relative h-64 sm:h-72 w-full rounded-lg bg-slate-950 border border-cyan-500/30 overflow-hidden">
            {/* Scanlines Effect */}
            <div className="absolute inset-0 cyber-scanlines z-20 pointer-events-none opacity-40" />

            {/* Simulated Address Bar */}
            <div className="h-7 bg-slate-900 border-b border-slate-800 flex items-center px-3 gap-2 text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400">HTTPS://</span>
              <span className="truncate text-slate-200">
                {job.targetUrl ? job.targetUrl.replace(/^https?:\/\//, '') : 'ecommerce-target.com/catalog'}
              </span>
            </div>

            {/* Virtual Scrolling Content Container */}
            <div
              className="p-3 transition-transform duration-300 ease-out"
              style={{
                transform: `translateY(-${(job.crawlerState.scrollY % 180) || (isCrawling ? (job.progress * 2) % 180 : 0)}px)`,
              }}
            >
              {/* Site Header Mock */}
              <div className="h-6 w-3/4 bg-slate-800/80 rounded mb-3 animate-pulse" />

              {/* Grid of detected elements */}
              <div className="grid grid-cols-3 gap-2.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => {
                  const isActive = isCrawling && activeBoxIndex === idx % 6;
                  return (
                    <div
                      key={idx}
                      className={`relative rounded p-2 transition-all duration-200 border ${
                        isActive
                          ? 'bg-emerald-950/60 border-emerald-400 shadow-[0_0_12px_rgba(0,255,102,0.4)] scale-102 z-10'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      {/* Bounding box marker */}
                      {isActive && (
                        <div className="absolute -top-2 -left-1 text-[8px] font-mono bg-[#00ff66] text-black font-bold px-1 rounded">
                          &lt;DOM_PRODUCT_NODE&gt;
                        </div>
                      )}

                      <div className="h-12 bg-slate-800/80 rounded mb-1.5 flex items-center justify-center text-[9px] text-slate-500">
                        IMG_SLOT
                      </div>
                      <div className="h-2 w-full bg-slate-700/80 rounded mb-1" />
                      <div className="h-2 w-2/3 bg-slate-700/60 rounded mb-1.5" />
                      <div className="flex justify-between items-center text-[9px]">
                        <span className={isActive ? 'text-[#00ff66] font-bold font-mono' : 'text-cyan-400 font-mono'}>
                          {job.targetUrl.includes('ouedkniss')
                            ? `${(45000 + idx * 25000).toLocaleString()} DA`
                            : `€${(49 + idx * 24.5).toFixed(2)}`}
                        </span>
                        <span className="text-[8px] text-slate-500">
                          {job.targetUrl.includes('ouedkniss') ? 'DISPO' : 'STOCK_OK'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Cursor Tracking Pointer */}
            {isCrawling && (
              <div
                className="absolute z-30 transition-all duration-300 pointer-events-none text-emerald-400 drop-shadow-[0_0_8px_#00ff66]"
                style={{
                  top: `${30 + (activeBoxIndex * 35) % 170}px`,
                  left: `${20 + (activeBoxIndex * 85) % 240}px`,
                }}
              >
                <div className="flex items-center gap-1 font-mono text-[9px] bg-black/80 px-1.5 py-0.5 rounded border border-emerald-400 text-emerald-300">
                  <MousePointer className="w-3 h-3 fill-emerald-400" />
                  AI_VACUUM_FOCUS
                </div>
              </div>
            )}

            {/* Virtual Scrollbar Track */}
            <div className="absolute right-1 top-8 bottom-1 w-1 bg-slate-800 rounded-full">
              <div
                className="w-full bg-[#00ff66] rounded-full transition-all duration-200"
                style={{
                  height: '35%',
                  transform: `translateY(${((job.progress || 10) * 1.5) % 150}px)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Right: Live Matrix Terminal & Telemetry Logs */}
        <div className="lg:col-span-5 p-4 flex flex-col h-72 sm:h-80 bg-slate-950 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
              CONSOLE TÉLÉMÉTRIQUE IA
            </span>
            {onClearLogs && (
              <button
                onClick={onClearLogs}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Log Stream Container */}
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto space-y-1.5 mt-2 pr-1 font-mono text-[11px] select-text"
          >
            {job.logs.length === 0 ? (
              <div className="text-slate-600 italic py-4 text-center">
                Système prêt. Insérez une URL e-commerce pour démarrer l'aspiration matricielle.
              </div>
            ) : (
              job.logs.map((log) => {
                const isSuccess = log.level === 'success';
                const isVacuum = log.level === 'vacuum';
                const isWarn = log.level === 'warn';

                return (
                  <div key={log.id} className="leading-tight flex items-start gap-1.5">
                    <span className="text-slate-600 text-[10px] flex-shrink-0">
                      {log.timestamp}
                    </span>
                    <span
                      className={`break-words ${
                        isSuccess
                          ? 'text-emerald-300 font-semibold'
                          : isVacuum
                          ? 'text-cyan-300'
                          : isWarn
                          ? 'text-amber-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {log.hex && (
                        <span className="text-slate-500 mr-1">[{log.hex}]</span>
                      )}
                      {log.message}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Terminal Status Footer */}
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span>FLUX: UTF-8 / JSON STREAM</span>
            <span className="text-emerald-400">
              {job.status === 'aspirating' ? '● RECEPTION LIVE' : '○ EN VEILLE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
