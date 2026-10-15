import React, { useState, useEffect } from 'react';
import { Sparkles, Terminal, Cpu, Zap, Volume2, VolumeX, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { cyberAudio } from '../utils/cyberAudio';
import { CyberVacuumLogo } from './CyberVacuumLogo';

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
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setProgress(0);
    setCurrentStepIndex(0);
    setIsExiting(false);
    setIsReady(false);

    // Play subtle high-tech cyber audio if enabled
    if (soundEnabled) {
      try {
        cyberAudio.playScanSweep();
        cyberAudio.speakFrenchFemale("Système Cyber-Vacuum activé. Base matricielle connectée.", true);
      } catch {
        // audio might be blocked by autoplay policies until gesture
      }
    }

    const duration = 2800; // 2.8 seconds boot duration
    const intervalTime = 35;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setIsReady(true);
          // Play success chime on boot complete
          if (soundEnabled) {
            try {
              cyberAudio.playComplete();
            } catch {
              // ignore
            }
          }
          // Auto exit after brief pause or user can click
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
              onComplete();
            }, 500);
          }, 1000);
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
      {/* Immersive background matrix image - Full Screen Cyberpunk Vortex with User Logo */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/splash-screen.jpg"
          alt="Cyber Splash Screen Background"
          className="w-full h-full object-cover object-center opacity-75 scale-105 animate-pulse-slow filter brightness-95 contrast-125"
          onError={(e) => {
            // Fallback to cyber splash if needed
            (e.target as HTMLImageElement).src = '/cyber-splash.jpg';
          }}
        />
        {/* Dark radial vignette & gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/50 to-[#030712]/80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#030712_90%)]" />
        {/* Cyber scanline texture */}
        <div className="absolute inset-0 cyber-scanlines opacity-40 pointer-events-none" />
      </div>

      {/* Top action bar: Skip button */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-20 flex items-center gap-3">
        <button
          onClick={handleSkip}
          className="group flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#00ff66]/40 bg-black/70 backdrop-blur-md text-xs font-mono text-slate-200 hover:text-[#00ff66] hover:border-[#00ff66] hover:bg-[#00ff66]/15 transition-all cursor-pointer shadow-xl"
          title="Passer et entrer immédiatement"
        >
          <span className="text-[11px] uppercase tracking-wider font-bold">Passer</span>
          <span className="text-[10px] text-slate-500 group-hover:text-slate-300 border border-slate-700 rounded px-1 hidden sm:inline">Échap</span>
          <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#00ff66] transition-transform group-hover:scale-110" />
        </button>
      </div>

      {/* Centerpiece: App Icon Emblem with Glowing Sci-Fi Rings and Exact Brand Logo */}
      <div className="relative z-10 flex flex-col items-center px-4 max-w-lg w-full text-center">
        {/* Concentric rotating neon energy rings */}
        <div className="relative mb-5 flex items-center justify-center">
          {/* Outer Cyan Ring */}
          <div className="absolute -inset-6 rounded-3xl border border-[#00f0ff]/30 animate-spin" style={{ animationDuration: '20s' }} />
          {/* Inner Emerald Pulse Ring */}
          <div className="absolute -inset-3 rounded-2xl border-2 border-dashed border-[#00ff66]/60 animate-spin" style={{ animationDuration: '14s', animationDirection: 'reverse' }} />
          {/* Glow backdrop */}
          <div className="absolute inset-0 bg-[#00ff66]/30 blur-3xl rounded-full" />
          
          {/* Clean App Icon Emblem Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,102,0.7),0_0_100px_rgba(0,240,255,0.4)] border-2 border-[#00ff66] bg-black p-1.5 flex items-center justify-center">
            <img
              src="/app-icon.png"
              alt="Cyber-Vacuum App Icon"
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/icon.png';
              }}
            />
            {/* Holographic light sheen sweep */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none rounded-2xl" />
          </div>
        </div>

        {/* Brand Logo Wordmark */}
        <div className="mb-4">
          <div className="px-4 py-2 rounded-2xl bg-black/80 border border-[#00ff66]/40 backdrop-blur-md inline-flex items-center justify-center shadow-lg">
            <CyberVacuumLogo size="custom" width={190} height={38} glow={true} />
          </div>
        </div>

        {/* Brand Name & Subtitle */}
        <div className="space-y-1 mb-5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#00ff66]/40 bg-[#00ff66]/10 text-[10px] font-mono text-[#00ff66] tracking-widest uppercase mb-1">
            <Zap className="w-3 h-3 text-[#00ff66] animate-pulse" />
            <span>NATIVE CORE SYSTEM ACTIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00ff66] to-[#00f0ff] filter drop-shadow-[0_0_15px_rgba(0,255,102,0.4)]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            CYBER-VACUUM
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-mono tracking-wider">
            AI E-COMMERCE SCRAPER & MATRIX DATA ENGINE
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="w-full max-w-xs space-y-2 mb-4">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-[#00ff88] flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-ping" />
              CHARGEMENT DU NOYAU
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
        <div className="w-full max-w-sm h-8 flex items-center justify-center px-3 py-1 rounded-xl border border-[#00ff66]/20 bg-black/70 backdrop-blur-sm text-[11px] font-mono text-slate-300 mb-4">
          <Terminal className="w-3 h-3 text-[#00ff66] mr-2 shrink-0 animate-pulse" />
          <span className="truncate text-slate-200">
            {BOOT_STEPS[currentStepIndex]}
          </span>
        </div>

        {/* Enter Button or Direct Launch */}
        {isReady && (
          <button
            type="button"
            onClick={handleSkip}
            className="animate-bounce px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#00ff88] text-slate-950 font-mono font-black text-xs tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(0,255,102,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <span>LANCER L'APPLICATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Hardware & Version Specs */}
        <div className="mt-6 flex items-center gap-4 text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#00ff66]/70" />
            V4.2.0 STABLE
          </span>
          <span className="text-slate-700">•</span>
          <span>69 WILAYAS DZ</span>
          <span className="text-slate-700">•</span>
          <span className="text-[#00f0ff]/70">PWA READY</span>
        </div>
      </div>
    </div>
  );
};
