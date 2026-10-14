import React, { useEffect, useRef } from 'react';
import { ScrapedProduct, ScrapeJob } from '../types';
import { Cpu, Zap, Radio, Database, Sparkles, ShieldCheck } from 'lucide-react';

interface VacuumVisualizerProps {
  job: ScrapeJob;
  latestProduct?: ScrapedProduct;
  totalProductsCount: number;
}

const VacuumVisualizerComponent: React.FC<VacuumVisualizerProps> = ({
  job,
  latestProduct,
  totalProductsCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Canvas particle vacuum vortex animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 280);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const isAspirating = job.status === 'aspirating' || job.status === 'scanning';

    // Particles swirling towards center
    interface Particle {
      x: number;
      y: number;
      radius: number;
      angle: number;
      dist: number;
      speed: number;
      color: string;
      char?: string;
    }

    const chars = ['$', '€', '0', '1', '{', '}', '<>', 'PRICE', 'DOM', 'SKU', 'IMG', 'TAG'];
    const colors = ['#00ff66', '#00f0ff', '#ffffff', '#39ff14', '#00d2ff'];
    const maxParticles = isAspirating ? 90 : 35;
    const particles: Particle[] = [];

    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.hypot(centerX, centerY);

    for (let i = 0; i < maxParticles; i++) {
      const dist = Math.random() * maxDist;
      const angle = Math.random() * Math.PI * 2;
      particles.push({
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        radius: Math.random() * 2 + 1,
        angle,
        dist,
        speed: (Math.random() * 2 + 1.5) * (isAspirating ? 2.2 : 0.8),
        color: colors[Math.floor(Math.random() * colors.length)],
        char: Math.random() > 0.5 ? chars[Math.floor(Math.random() * chars.length)] : undefined,
      });
    }

    let pulseAngle = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // Draw subtle orbital rings
      pulseAngle += isAspirating ? 0.04 : 0.015;
      const ringRadius = Math.min(cx, cy) * 0.72;

      // Outer targeting circle
      ctx.save();
      ctx.strokeStyle = isAspirating ? 'rgba(0, 255, 102, 0.35)' : 'rgba(0, 255, 102, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 12]);
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, pulseAngle, pulseAngle + Math.PI * 2);
      ctx.stroke();

      // Middle counter-rotating ring
      ctx.strokeStyle = isAspirating ? 'rgba(0, 240, 255, 0.45)' : 'rgba(0, 240, 255, 0.18)';
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius * 0.55, -pulseAngle * 1.5, -pulseAngle * 1.5 + Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Vacuum Core (Center black hole / singularity)
      const coreGlow = ctx.createRadialGradient(cx, cy, 5, cx, cy, 60);
      if (isAspirating) {
        coreGlow.addColorStop(0, '#ffffff');
        coreGlow.addColorStop(0.2, '#00ff66');
        coreGlow.addColorStop(0.6, 'rgba(0, 240, 255, 0.4)');
        coreGlow.addColorStop(1, 'transparent');
      } else {
        coreGlow.addColorStop(0, '#00ff66');
        coreGlow.addColorStop(0.5, 'rgba(0, 255, 102, 0.15)');
        coreGlow.addColorStop(1, 'transparent');
      }

      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, isAspirating ? 55 + Math.sin(pulseAngle * 4) * 8 : 40, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core Node
      ctx.fillStyle = '#030712';
      ctx.beginPath();
      ctx.arc(cx, cy, isAspirating ? 22 : 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isAspirating ? '#00ff66' : '#00aa55';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, isAspirating ? 22 : 18, 0, Math.PI * 2);
      ctx.stroke();

      // Draw suction funnel cone towards core if aspirating
      if (isAspirating) {
        const funnelGrad = ctx.createLinearGradient(0, cy, cx, cy);
        funnelGrad.addColorStop(0, 'rgba(0, 255, 102, 0)');
        funnelGrad.addColorStop(0.7, 'rgba(0, 255, 102, 0.12)');
        funnelGrad.addColorStop(1, 'rgba(0, 240, 255, 0.35)');

        ctx.fillStyle = funnelGrad;
        ctx.beginPath();
        ctx.moveTo(0, cy - 80);
        ctx.lineTo(cx, cy);
        ctx.lineTo(0, cy + 80);
        ctx.closePath();
        ctx.fill();

        // Laser beam to target
        ctx.strokeStyle = '#00ffaa';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ffaa';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (isAspirating) {
        ctx.font = '10px "JetBrains Mono", monospace';
      }

      // Draw and update swirling particles
      particles.forEach((p) => {
        p.dist -= p.speed;
        p.angle += (isAspirating ? 0.05 : 0.02) * (1 + 40 / (p.dist + 10));

        p.x = cx + Math.cos(p.angle) * p.dist;
        p.y = cy + Math.sin(p.angle) * p.dist;

        // If reached core, respawn at outer boundary
        if (p.dist <= 18) {
          p.dist = maxDist * (0.8 + Math.random() * 0.4);
          p.angle = Math.random() * Math.PI * 2;
        }

        if (p.char && isAspirating) {
          ctx.fillStyle = p.color;
          ctx.fillText(p.char, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [job.status]);

  const isAspirating = job.status === 'aspirating' || job.status === 'scanning';

  return (
    <div className="relative overflow-hidden bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 lg:p-6 backdrop-blur-md shadow-2xl">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00ff6608_1px,transparent_1px),linear-gradient(to_bottom,#00ff6608_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* Header HUD */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-400/40 text-emerald-400">
            <Zap className={`w-4 h-4 ${isAspirating ? 'animate-bounce text-[#00ff66]' : ''}`} />
            {isAspirating && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-bold tracking-wider text-emerald-300 uppercase">
                Vortex d'Aspiration Quantique // MK-IV
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Extraction brute de base de données e-commerce & déconstruction DOM
            </p>
          </div>
        </div>

        {/* Realtime stats badge */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-right">
            <span className="block text-[10px] text-cyan-400 font-mono tracking-wider">DÉBIT ASPIRATION</span>
            <span className="text-sm font-bold text-cyan-300 font-mono">
              {isAspirating ? `${(Math.random() * 25 + 18).toFixed(1)} MB/s` : '0.00 KB/s'}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 text-right">
            <span className="block text-[10px] text-emerald-400 font-mono tracking-wider">OBJETS ASPIRÉS</span>
            <span className="text-sm font-bold text-[#00ff66] font-mono">
              {totalProductsCount} REC
            </span>
          </div>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="relative mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left Side: Target Stream & AI Action */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3 rounded-lg bg-slate-900/90 border border-emerald-500/20 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                CANAL D'ASPIRATION
              </span>
              <span className="text-[10px] text-slate-500">PORT: 443 (TLS)</span>
            </div>
            <div className="truncate text-emerald-300 font-semibold bg-black/40 p-1.5 rounded border border-emerald-500/20 text-[11px]">
              {job.targetUrl || 'En attente de cible URL...'}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-500/20 font-mono text-xs">
            <div className="text-[10px] text-cyan-400 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>STATUT CRAWLER IA</span>
              <span className="text-cyan-300 font-bold">{job.status.toUpperCase()}</span>
            </div>
            <div className="text-slate-200 text-xs line-clamp-2">
              {job.aiAgentAction || 'Module en veille. Prêt pour aspiration immédiate.'}
            </div>

            {/* Progress bar */}
            <div className="mt-2.5">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>INDEXATION MATRICIELLE</span>
                <span className="text-emerald-400">{job.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-emerald-950">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-[#00ff66] transition-all duration-300 rounded-full"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="block text-[10px] text-slate-400">NOEUDS DOM</span>
              <span className="text-emerald-400 font-bold">
                {job.crawlerState.domNodesInspected > 0 ? job.crawlerState.domNodesInspected : '--'}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
              <span className="block text-[10px] text-slate-400">TOKENS DÉCRYPTÉS</span>
              <span className="text-cyan-400 font-bold">
                {job.crawlerState.tokensProcessed > 0 ? job.crawlerState.tokensProcessed : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Particle Vortex Canvas */}
        <div className="lg:col-span-5 relative h-64 lg:h-72 w-full flex items-center justify-center">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          
          {/* Center Hologram Overlay Text */}
          <div className="relative z-10 pointer-events-none text-center">
            <div className="text-[10px] font-mono tracking-widest text-emerald-400/80 uppercase">
              {isAspirating ? 'ASPIRATION EN COURS' : 'RÉSERVOIR PRÊT'}
            </div>
            <div className="text-xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_10px_rgba(0,255,102,0.8)]">
              {totalProductsCount}
            </div>
            <div className="text-[9px] text-cyan-400 font-mono">PRODUITS SCELLÉS</div>
          </div>
        </div>

        {/* Right Side: Newly Aspirated Product Flash Card */}
        <div className="lg:col-span-3">
          <div className="text-[10px] font-mono text-emerald-400 tracking-wider uppercase mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            DERNIER PRODUIT ASPIRÉ
          </div>

          {latestProduct ? (
            <div className="relative group overflow-hidden rounded-lg bg-slate-900/90 border border-emerald-400/40 p-3 shadow-lg transition-all duration-300 hover:border-emerald-400">
              <div className="absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-[#00ff88] font-mono border border-emerald-500/40">
                +1 ASPIRÉ
              </div>
              
              <div className="flex gap-2.5 items-start mt-2">
                <img
                  src={latestProduct.imageUrl}
                  alt={latestProduct.title}
                  className="w-12 h-12 object-cover rounded bg-slate-800 border border-slate-700 flex-shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=60';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-100 truncate font-mono">
                    {latestProduct.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {latestProduct.category}
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-bold text-[#00ff66] font-mono">
                      {latestProduct.currentPrice.toFixed(2)} {latestProduct.currency}
                    </span>
                    {latestProduct.discountPercent > 0 && (
                      <span className="text-[10px] text-rose-400 font-mono line-through">
                        {latestProduct.originalPrice.toFixed(2)} {latestProduct.currency}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3 h-3" /> IA: {latestProduct.aiConfidence}%
                </span>
                <span className="text-cyan-400 truncate max-w-[100px]">
                  {latestProduct.sourceDomain}
                </span>
              </div>
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center p-4 rounded-lg bg-slate-900/40 border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
              <Cpu className="w-6 h-6 mb-2 text-slate-600 animate-pulse" />
              <span>En attente de flux... Lancez l'aspiration d'un site.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const VacuumVisualizer = React.memo(VacuumVisualizerComponent);
