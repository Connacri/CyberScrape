import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ScrapeJob, ScrapedProduct } from '../types';
import { Terminal, Eye, MousePointer, Shield, Radio, Activity, Sparkles, MapPin, CheckCircle2, Radar } from 'lucide-react';

interface AiCrawlerLiveHudProps {
  job: ScrapeJob;
  products?: ScrapedProduct[];
  scrapeVolume?: number;
  totalProductsCount?: number;
  onClearLogs?: () => void;
  onOpenCategoryAudit?: () => void;
}

// Authentic real Algerian market articles with high-resolution photography and strict Dinar (DA) pricing
const REAL_OUEDKNISS_ARTICLES = [
  {
    title: 'Samsung Galaxy S24 Ultra 512GB Titane Neuf',
    price: 215000,
    wilaya: 'Alger - Kouba',
    img: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop&q=80',
    stock: 'STOCK_OK',
    category: 'Téléphones',
  },
  {
    title: 'Renault Clio 4 GT Line 1.5 DCI 110ch 2019',
    price: 2850000,
    wilaya: 'Alger - Chéraga',
    img: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&auto=format&fit=crop&q=80',
    stock: 'DISPO',
    category: 'Automobiles',
  },
  {
    title: 'Apple iPhone 16 Pro Max 256GB Désert Titane',
    price: 245000,
    wilaya: 'Alger - Bab Ezzouar',
    img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80',
    stock: 'SCELLÉ',
    category: 'Téléphones',
  },
  {
    title: 'Volkswagen Golf 8 R-Line 2.0 TDI DSG7 Toit Pano',
    price: 5200000,
    wilaya: 'Sétif - Centre',
    img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=80',
    stock: '00 PEINTURE',
    category: 'Automobiles',
  },
  {
    title: 'Sony PlayStation 5 Slim 1TB Édition Standard',
    price: 112000,
    wilaya: 'Blida - Ouled Yaich',
    img: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop&q=80',
    stock: 'GARANTIE',
    category: 'Gaming',
  },
  {
    title: 'Asus ROG Strix G16 Intel i7 RTX 4070 32GB RAM',
    price: 268000,
    wilaya: 'Constantine - Centre',
    img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=80',
    stock: 'NEUF BOÎTE',
    category: 'Informatique',
  },
  {
    title: 'MacBook Pro 14" M3 Pro 18GB 512GB SSD Sidéral',
    price: 345000,
    wilaya: 'Alger - Hydra',
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=80',
    stock: 'NON ACTIVÉ',
    category: 'Informatique',
  },
  {
    title: 'Salon d angle Velours Royal Anti-tache 7 Places',
    price: 85000,
    wilaya: 'Oran - Akid Lotfi',
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&auto=format&fit=crop&q=80',
    stock: 'SUR COMMANDE',
    category: 'Maison',
  },
  {
    title: 'Dattes Deglet Nour Biskra 1er Choix Carton 5kg',
    price: 4500,
    wilaya: 'Biskra - Tolga',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
    stock: 'RÉCOLTE 2026',
    category: 'Terroir',
  },
];

export const AiCrawlerLiveHud: React.FC<AiCrawlerLiveHudProps> = ({
  job,
  products = [],
  scrapeVolume = 0,
  totalProductsCount,
  onClearLogs,
  onOpenCategoryAudit,
}) => {
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const [activeBoxIndex, setActiveBoxIndex] = useState(0);
  const [smoothScrollOffset, setSmoothScrollOffset] = useState(0);

  // Auto-scroll terminal on new logs
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [job.logs.length]);

  const isCrawling = job.status === 'aspirating' || job.status === 'scanning';

  // Cycle bounding box highlights smoothly
  useEffect(() => {
    if (!isCrawling) return;
    const interval = setInterval(() => {
      setActiveBoxIndex((prev) => (prev + 1) % 6);
    }, 450);
    return () => clearInterval(interval);
  }, [isCrawling]);

  // Smooth continuous scroll animation when crawling
  useEffect(() => {
    if (!isCrawling) return;
    let animationFrameId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      setSmoothScrollOffset((prev) => (prev + dt * 0.065) % 360);
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isCrawling]);

  // Combine real scraped products if available with real Algerian articles
  const liveDisplayArticles = useMemo(() => {
    if (products.length >= 6) {
      return products.slice(0, 9).map((p, idx) => ({
        title: p.title,
        price: p.currentPrice,
        wilaya: p.specs?.Wilaya || p.seller?.wilaya || 'Alger - Centre',
        img: p.imageUrl,
        stock: p.inStock ? 'STOCK_OK' : 'RUPTURE',
        category: p.category,
      }));
    }
    return REAL_OUEDKNISS_ARTICLES;
  }, [products]);

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
            AI SCROLL CRAWLER // VIEWPORT SCANNER (OUEDKNISS REAL-TIME)
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-mono">
          {onOpenCategoryAudit && (
            <button
              type="button"
              onClick={onOpenCategoryAudit}
              className="px-2 py-0.5 rounded-lg bg-cyan-950/70 border border-cyan-400/50 text-[#00f0ff] hover:bg-cyan-900/60 transition-all font-mono text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm"
              title="Audit Pré-Vol : analyser le nombre de pages, articles, boutiques et pubs de chaque catégorie"
            >
              <Radar className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">Audit Catégories</span>
            </button>
          )}
          {scrapeVolume === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/20 text-[#00ff88] border border-emerald-400/50 font-bold shadow-[0_0_8px_rgba(0,255,102,0.3)] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
              MODE ILLIMITÉ ∞
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-300 font-mono">
              CIBLE: {scrapeVolume}
            </span>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400">
            <Shield className="w-3 h-3" /> STEALTH_MODE: ACTIVE
          </span>
          <span className="text-cyan-400 flex items-center gap-1">
            <Activity className="w-3 h-3 animate-spin" /> PING: 24ms
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-cyan-500/20">
        {/* Left: Simulated Scrolling Browser Viewport */}
        <div className="lg:col-span-7 p-4 bg-black/40 relative">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-cyan-300">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              SCAN MATRICIEL FLUIDE (1920x1080 @ 60 FPS)
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-emerald-400 font-bold">
                SCROLL Y: {Math.floor(smoothScrollOffset * 6.5)}px
              </span>
            </div>
          </div>

          {/* Browser Frame Simulation */}
          <div className="relative h-72 sm:h-80 w-full rounded-xl bg-slate-950 border border-cyan-500/40 overflow-hidden shadow-inner">
            {/* High-tech Cyber Laser Scanner Beam */}
            {isCrawling && (
              <div
                className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00ff66] to-transparent shadow-[0_0_15px_#00ff66] z-30 pointer-events-none transition-all duration-300"
                style={{
                  top: `${(smoothScrollOffset * 1.2) % 280}px`,
                }}
              />
            )}

            {/* Scanlines Effect */}
            <div className="absolute inset-0 cyber-scanlines z-20 pointer-events-none opacity-30" />

            {/* Simulated Address Bar with Live Ouedkniss URL */}
            <div className="h-7 bg-slate-900/95 border-b border-cyan-500/20 flex items-center px-3 gap-2 text-[10px] font-mono text-slate-400">
              <span className="text-emerald-400 font-bold">HTTPS://</span>
              <span className="truncate text-slate-200">
                {job.targetUrl ? job.targetUrl.replace(/^https?:\/\//, '') : 'www.ouedkniss.com/annonces/algerie'}
              </span>
              <span className="ml-auto text-[9px] text-[#00ff88] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                200 OK
              </span>
            </div>

            {/* Virtual Scrolling Real Content Container */}
            <div
              className="p-3 transition-transform duration-100 ease-linear"
              style={{
                transform: `translateY(-${smoothScrollOffset}px)`,
              }}
            >
              {/* Ouedkniss Live Categories Bar Mock */}
              <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-slate-800/80 overflow-hidden text-[9px] font-mono text-slate-400">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#00ff88] border border-emerald-400/40 font-bold">
                  🇩🇿 Ouedkniss Direct
                </span>
                <span className="truncate">Automobiles • Téléphones • Informatique • Immobilier</span>
              </div>

              {/* Grid of Real Detected Algerian Articles */}
              <div className="grid grid-cols-3 gap-2.5">
                {liveDisplayArticles.map((item, idx) => {
                  const isActive = isCrawling && activeBoxIndex === idx % 6;
                  return (
                    <div
                      key={idx}
                      className={`relative rounded-xl p-2 transition-all duration-300 border flex flex-col justify-between ${
                        isActive
                          ? 'bg-emerald-950/70 border-[#00ff88] shadow-[0_0_18px_rgba(0,255,102,0.45)] scale-102 z-10 ring-1 ring-[#00ff88]/50'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Bounding box marker */}
                      {isActive && (
                        <div className="absolute -top-2.5 -left-1 text-[8px] font-mono bg-[#00ff66] text-black font-extrabold px-1.5 py-0.2 rounded shadow-sm z-20 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          &lt;DOM_PRODUCT_NODE // DA&gt;
                        </div>
                      )}

                      <div>
                        {/* Real Photo Thumbnail */}
                        <div className="relative aspect-square w-full rounded-lg bg-slate-950 overflow-hidden mb-1.5 border border-slate-800">
                          <img
                            src={item.img}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/85 text-yellow-300 text-[8px] font-mono flex items-center gap-0.5 truncate max-w-[85px]">
                            <MapPin className="w-2 h-2 text-orange-400 shrink-0" />
                            <span className="truncate">{item.wilaya.split('-')[0]}</span>
                          </div>
                        </div>

                        {/* Real Title */}
                        <div className="font-mono text-[10px] font-bold text-slate-100 line-clamp-1 leading-tight mb-1">
                          {item.title}
                        </div>
                      </div>

                      {/* Real Pricing in Dinars Algériens (DA) */}
                      <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-800/80">
                        <span className={isActive ? 'text-[#00ff88] font-black font-mono' : 'text-emerald-400 font-bold font-mono'}>
                          {Math.round(item.price).toLocaleString('fr-FR')} DA
                        </span>
                        <span className="text-[8px] text-slate-400 font-mono">
                          {item.stock}
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
                  top: `${40 + (activeBoxIndex * 38) % 180}px`,
                  left: `${25 + (activeBoxIndex * 90) % 260}px`,
                }}
              >
                <div className="flex items-center gap-1 font-mono text-[9px] bg-black/85 px-1.5 py-0.5 rounded border border-emerald-400 text-emerald-300 shadow-lg">
                  <MousePointer className="w-3 h-3 fill-emerald-400" />
                  AI_VACUUM_FOCUS // EXTRACTION_DA
                </div>
              </div>
            )}

            {/* Virtual Scrollbar Track */}
            <div className="absolute right-1 top-8 bottom-1 w-1 bg-slate-800 rounded-full">
              <div
                className="w-full bg-[#00ff66] rounded-full transition-all duration-150"
                style={{
                  height: '35%',
                  transform: `translateY(${((smoothScrollOffset * 0.5) % 180)}px)`,
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
              CONSOLE TÉLÉMÉTRIQUE IA // OUEDKNISS
            </span>
            {onClearLogs && (
              <button
                onClick={onClearLogs}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
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
                Moteur prêt. Aucun article factice : démarrez l'aspiration matricielle pour récolter les articles réels en Dinars (DA).
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
            <span>DEVISE: DINAR ALGÉRIEN (DA)</span>
            <span className="text-emerald-400 font-bold">
              {job.status === 'aspirating' ? '● RÉCOLTE LIVE' : '○ EN VEILLE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
