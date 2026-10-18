import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Globe,
  Gauge,
  Clock,
  ArrowDownUp,
  Server,
  Database,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { telemetryTracker, TelemetrySnapshot } from '../utils/telemetryTracker';

export const ScrapingTelemetryPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(() => telemetryTracker.getSnapshot());
  const [isSimulatingPing, setIsSimulatingPing] = useState(false);

  useEffect(() => {
    const unsubscribe = telemetryTracker.subscribe((snap) => {
      setTelemetry(snap);
    });

    const interval = setInterval(() => {
      setTelemetry(telemetryTracker.getSnapshot());
    }, 1500);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleQuickPing = async () => {
    setIsSimulatingPing(true);
    const t0 = Date.now();
    try {
      const res = await fetch('/api/ouedkniss/categories', { method: 'GET' });
      const lat = Date.now() - t0;
      telemetryTracker.recordSample({
        timestamp: Date.now(),
        domain: window.location.hostname || 'api.ouedkniss.com',
        latencyMs: lat,
        bytesReceived: 4800,
        statusCode: res.status,
        success: res.ok,
      });
    } catch {
      telemetryTracker.recordSample({
        timestamp: Date.now(),
        domain: window.location.hostname || 'api.ouedkniss.com',
        latencyMs: Date.now() - t0,
        bytesReceived: 0,
        statusCode: 0,
        success: false,
      });
    } finally {
      setIsSimulatingPing(false);
    }
  };

  const successRate =
    telemetry.totalRequests > 0
      ? Math.round((telemetry.successfulRequests / telemetry.totalRequests) * 100)
      : 100;

  return (
    <div
      className={`rounded-2xl bg-gradient-to-b from-[#090e1a]/95 via-[#0b1329]/95 to-slate-950/95 border border-cyan-500/30 p-4 sm:p-5 shadow-[0_0_25px_rgba(0,240,255,0.08)] space-y-4 font-mono text-slate-200 ${className}`}
    >
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm sm:text-base tracking-wide flex items-center gap-2">
                TÉLÉMÉTRIE RÉSEAU EN TEMPS RÉEL
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00ff88] border border-emerald-500/40">
                  LIVE STREAM
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Métriques de débit (RPS, Ko/s) et latences de réponse par domaine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleQuickPing}
            disabled={isSimulatingPing}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900/50 text-xs flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.15)] active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingPing ? 'animate-spin' : ''}`} />
            <span>Tester Latence Ping</span>
          </button>
        </div>
      </div>

      {/* 4 Core Real-Time KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: RPS (Requests Per Second) */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Requêtes / sec
            </span>
            <span className="text-[10px] text-amber-400 font-bold">RPS</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
            {telemetry.rps.toFixed(1)}
            <span className="text-xs font-normal text-slate-400 ml-1">req/s</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Cumul :</span>
            <span className="text-slate-200 font-bold">{telemetry.totalRequests.toLocaleString()} reqs</span>
          </div>
        </div>

        {/* Metric 2: Data Throughput in KB/s */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <ArrowDownUp className="w-3.5 h-3.5 text-emerald-400" />
              Débit Réseau
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">KB/s</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 tracking-tight">
            {telemetry.throughputKbps.toFixed(1)}
            <span className="text-xs font-normal text-slate-400 ml-1">Ko/s</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Volume reçu :</span>
            <span className="text-emerald-400 font-bold">
              {telemetry.totalBytesKb > 1024
                ? `${(telemetry.totalBytesKb / 1024).toFixed(2)} Mo`
                : `${telemetry.totalBytesKb.toFixed(0)} Ko`}
            </span>
          </div>
        </div>

        {/* Metric 3: Average Latency */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Latence Moyenne
            </span>
            <span className="text-[10px] text-cyan-400 font-bold">MS</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight">
            {telemetry.avgLatencyMs}
            <span className="text-xs font-normal text-slate-400 ml-1">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>État :</span>
            <span
              className={`font-bold ${
                telemetry.avgLatencyMs < 300
                  ? 'text-emerald-400'
                  : telemetry.avgLatencyMs < 800
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {telemetry.avgLatencyMs < 300 ? 'Ultra-Rapide' : telemetry.avgLatencyMs < 800 ? 'Normal' : 'Ralenti'}
            </span>
          </div>
        </div>

        {/* Metric 4: Success Rate & Health */}
        <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Taux de Succès
            </span>
            <span className="text-[10px] text-purple-400 font-bold">% OK</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 tracking-tight">
            {successRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Erreurs :</span>
            <span className={telemetry.failedRequests > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
              {telemetry.failedRequests} échecs
            </span>
          </div>
        </div>
      </div>

      {/* Latency by Domain Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            Latence de Réponse & Volume par Domaine Cible
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {telemetry.domains.length} hôte(s) surveillé(s)
          </span>
        </div>

        <div className="divide-y divide-slate-800/80 text-xs">
          {telemetry.domains.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs">
              Aucune requête enregistrée dans la session active.
            </div>
          ) : (
            telemetry.domains.map((dom) => {
              const domSuccessPct =
                dom.requestCount > 0 ? Math.round((dom.successCount / dom.requestCount) * 100) : 100;

              return (
                <div
                  key={dom.domain}
                  className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        dom.avgLatencyMs < 400
                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(0,255,102,0.8)]'
                          : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs sm:text-sm truncate font-mono">
                        {dom.domain}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{dom.requestCount} requêtes</span>
                        <span>•</span>
                        <span className="text-emerald-400">{domSuccessPct}% succès</span>
                        <span>•</span>
                        <span>{(dom.totalBytes / 1024).toFixed(1)} Ko transférés</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto text-right">
                    <div>
                      <div className="text-[10px] text-slate-400">Dernière</div>
                      <div className="text-xs font-bold text-slate-200">{dom.lastLatencyMs} ms</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Min / Max</div>
                      <div className="text-xs font-mono text-slate-300">
                        {dom.minLatencyMs} / {dom.maxLatencyMs} ms
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Moyenne</div>
                      <div
                        className={`text-sm font-black font-mono ${
                          dom.avgLatencyMs < 300
                            ? 'text-[#00ff88]'
                            : dom.avgLatencyMs < 700
                            ? 'text-cyan-300'
                            : 'text-amber-400'
                        }`}
                      >
                        {dom.avgLatencyMs} ms
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Visual Timeline Stream (Sparkline Bars) */}
      {telemetry.timeline.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              Activité Réseau Temps Réel (Dernière minute)
            </span>
            <span className="text-[10px] text-slate-400">Échantillons de 5 secondes</span>
          </div>

          <div className="grid grid-cols-12 gap-1.5 h-16 items-end pt-2">
            {telemetry.timeline.map((point, idx) => {
              const maxThroughput = Math.max(10, ...telemetry.timeline.map((p) => p.throughputKbps));
              const heightPercent = Math.min(100, Math.max(8, Math.round((point.throughputKbps / maxThroughput) * 100)));

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-1 group/bar relative h-full justify-end"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-1 hidden group-hover/bar:flex flex-col items-center z-20 pointer-events-none">
                    <div className="px-2 py-1 rounded bg-black/90 border border-cyan-500/40 text-[9px] text-cyan-300 whitespace-nowrap shadow-xl">
                      <div>{point.timeLabel}</div>
                      <div>{point.rps} req/s • {point.throughputKbps} Ko/s</div>
                      <div>Latence : {point.latencyMs} ms</div>
                    </div>
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t transition-all ${
                      point.rps > 0
                        ? 'bg-gradient-to-t from-cyan-600 to-emerald-400 shadow-[0_0_8px_rgba(0,255,102,0.4)]'
                        : 'bg-slate-800'
                    }`}
                  />
                  <span className="text-[8px] text-slate-500 font-mono hidden sm:block truncate">
                    {point.timeLabel.split(':')[1]}s
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
