import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, Cpu, Zap, Volume2, VolumeX, X } from 'lucide-react';
import { cyberAudio } from '../utils/cyberAudio';

interface CyberNativeSplashScreenProps {
  isOpen: boolean;
  onComplete: () => void;
  soundEnabled?: boolean;
}

const BOOT_STEPS = [
  'INITIALISATION DU NOYAU CYBER-VACUUM v4.2...',
  'SYNCHRONISATION DES FLUX MATRICIELS & PROXIES DZ...',
  'CALIBRAGE DU MOTEUR D ASPIRATION 69 WILAYAS...',
  'CHARGEMENT DU DUAL STORAGE INDEXEDDB & CACHE...',
  'SYSTÈME OPÉRATIONNEL // ACCÈS AUTORISÉ',
];

export const CyberNativeSplashScreen: React.FC<CyberNativeSplashScreenProps> = ({
  isOpen,
  onComplete,
  soundEnabled = true,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setProgress(0);
    setCurrentStepIndex(0);
    setIsExiting(false);

    // Play subtle high-tech cyber audio if enabled
    if (soundEnabled) {
      try {
        cyberAudio.playScanSweep();
      } catch {
        // audio might be blocked by autoplay policies until gesture
      }
    }

    const duration = 2400; // 2.4 seconds total
    const intervalTime = 30;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          // Play success chime on boot complete
          if (soundEnabled) {
            try {
              cyberAudio.playComplete();
            } catch {
              // ignore
            }
          }
          // Smooth exit animation
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
              onComplete();
            }, 500);
          }, 300);
          return 100;
        }

        // Update step index based on progress
        const step = Math.min(
          BOOT_STEPS.length - 1,
          Math.floor((next / 100) * BOOT_STEPS.length)
        );
        setCurrentStepIndex(step);

        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, onComplete, soundEnabled]);

  // Handle escape key to skip
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 250);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none overflow-hidden transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none filter blur-sm' : 'opacity-100 scale-100'
      }`}
      style={{ backgroundColor: '#030712' }}
    >
      {/* Immersive background matrix image - Full Screen Cyberpunk Vortex */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/src/assets/images/cyber_splash_screen_1792103934786.jpg"
          alt="Cyber Splash Screen Background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-60 scale-105 animate-pulse-slow filter brightness-95 contrast-125"
        />
        {/* Dark radial vignette & gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/60 to-[#030712]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#030712_90%)]" />
        {/* Cyber scanline texture */}
        <div className="absolute inset-0 cyber-scanlines opacity-40 pointer-events-none" />
      </div>

      {/* Top action bar: Skip button */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={handleSkip}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#00ff66]/30 bg-black/60 backdrop-blur-md text-xs font-mono text-slate-300 hover:text-[#00ff66] hover:border-[#00ff66] hover:bg-[#00ff66]/10 transition-all cursor-pointer shadow-lg"
          title="Passer l'animation de démarrage"
        >
          <span className="text-[11px] uppercase tracking-wider">Passer</span>
          <span className="text-[10px] text-slate-500 group-hover:text-slate-400 border border-slate-700 rounded px-1">Échap</span>
          <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00ff66] transition-transform group-hover:scale-110" />
        </button>
      </div>

      {/* Centerpiece: App Icon Emblem with Glowing Sci-Fi Rings */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-md w-full text-center">
        {/* Concentric rotating neon energy rings */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Outer Cyan Ring */}
          <div className="absolute -inset-4 rounded-3xl border border-[#00f0ff]/30 animate-spin" style={{ animationDuration: '18s' }} />
          {/* Inner Emerald Pulse Ring */}
          <div className="absolute -inset-2 rounded-2xl border-2 border-dashed border-[#00ff66]/50 animate-spin" style={{ animationDuration: '12s', animationDirection: 'reverse' }} />
          {/* Glow backdrop */}
          <div className="absolute inset-0 bg-[#00ff66]/20 blur-2xl rounded-full" />
          
          {/* Generated Clean Minimalist App Icon */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden shadow-[0_0_45px_rgba(0,255,102,0.6),0_0_90px_rgba(0,240,255,0.35)] border-2 border-[#00ff66] bg-black">
            <img
              src="/src/assets/images/app_icon_clean_1792103934835.jpg"
              alt="CYBER-VACUUM Clean Icon"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            />
            {/* Holographic light sheen sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Brand Name & Subtitle */}
        <div className="space-y-1 mb-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#00ff66]/40 bg-[#00ff66]/10 text-[10px] font-mono text-[#00ff66] tracking-widest uppercase mb-1">
            <Zap className="w-3 h-3 text-[#00ff66] animate-pulse" />
            <span>NATIVE CORE SYSTEM ACTIVE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00ff66] to-[#00f0ff] filter drop-shadow-[0_0_15px_rgba(0,255,102,0.4)]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            CYBER-VACUUM
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-wider">
            AI E-COMMERCE SCRAPER & MATRIX DATA ENGINE
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full max-w-xs space-y-2 mb-4">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-[#00ff66] flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-ping" />
              CHARGEMENT MATRICIEL
            </span>
            <span className="text-[#00f0ff] font-bold font-mono-numbers">
              {Math.min(100, Math.round(progress))}%
            </span>
          </div>

          {/* High-tech segmented progress container */}
          <div className="relative w-full h-2.5 bg-black/80 rounded-full border border-[#00ff66]/40 overflow-hidden p-0.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00ff66] via-[#00f0ff] to-[#00ff66] transition-all duration-75 shadow-[0_0_12px_#00ff66]"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        {/* Terminal Telemetry Step Output */}
        <div className="w-full max-w-sm h-8 flex items-center justify-center px-3 py-1 rounded border border-[#00ff66]/20 bg-black/60 backdrop-blur-sm text-[11px] font-mono text-slate-300">
          <Terminal className="w-3 h-3 text-[#00ff66] mr-2 shrink-0 animate-pulse" />
          <span className="truncate text-slate-300">
            {BOOT_STEPS[currentStepIndex]}
          </span>
        </div>

        {/* Hardware & Version Specs */}
        <div className="mt-8 flex items-center gap-4 text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#00ff66]/70" />
            V4.2.0 STABLE
          </span>
          <span className="text-slate-700">•</span>
          <span>NODE 22 ARCH</span>
          <span className="text-slate-700">•</span>
          <span className="text-[#00f0ff]/70">PWA READY</span>
        </div>
      </div>
    </div>
  );
};
