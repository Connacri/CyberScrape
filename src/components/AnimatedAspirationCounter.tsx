import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Flame, ShieldCheck } from 'lucide-react';

interface AnimatedAspirationCounterProps {
  count: number;
  label?: string;
  unit?: string;
  isLiveScraping?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * High-performance animated counter hook with cubic ease-out numeric roll
 */
export function useAnimatedNumber(targetValue: number, duration: number = 420) {
  const [displayValue, setDisplayValue] = useState(Math.max(0, targetValue));
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [recentDelta, setRecentDelta] = useState<number>(0);
  const lastTargetRef = useRef(Math.max(0, targetValue));
  const currentDisplayRef = useRef(displayValue);
  const highestSeenRef = useRef(Math.max(0, targetValue));

  currentDisplayRef.current = displayValue;

  useEffect(() => {
    // If user explicitly reset/cleared catalogue to 0
    if (targetValue === 0) {
      highestSeenRef.current = 0;
      lastTargetRef.current = 0;
      setDisplayValue(0);
      setIsIncrementing(false);
      setRecentDelta(0);
      return;
    }

    // Monotonic aspiration: during active scraping, the total counter must NEVER decrease or show negative numbers
    const cleanTarget = Math.max(0, targetValue);
    highestSeenRef.current = Math.max(highestSeenRef.current, cleanTarget);
    const effectiveTarget = highestSeenRef.current;

    const prevTarget = lastTargetRef.current;
    lastTargetRef.current = effectiveTarget;

    if (effectiveTarget === currentDisplayRef.current) return;

    const diff = Math.max(0, effectiveTarget - currentDisplayRef.current);
    if (diff > 0) {
      setIsIncrementing(true);
      const delta = effectiveTarget - prevTarget > 0 ? effectiveTarget - prevTarget : diff;
      setRecentDelta(Math.max(0, delta));
    }

    const startVal = currentDisplayRef.current;
    const startTime = performance.now();
    let animId: number;

    const step = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for responsive sci-fi deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextVal = Math.round(startVal + diff * ease);

      setDisplayValue(Math.max(0, nextVal));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(effectiveTarget);
        const timer = setTimeout(() => {
          setIsIncrementing(false);
          setRecentDelta(0);
        }, 450);
        return () => clearTimeout(timer);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetValue, duration]);

  return { displayValue, isIncrementing, recentDelta };
}

export const AnimatedAspirationCounter: React.FC<AnimatedAspirationCounterProps> = ({
  count,
  label = 'Articles Aspirés',
  unit = 'ADS',
  isLiveScraping = false,
  onClick,
  className = '',
  size = 'md',
}) => {
  const { displayValue, isIncrementing, recentDelta } = useAnimatedNumber(count, 460);
  const [deltaKey, setDeltaKey] = useState(0);

  // Trigger floating delta badge whenever delta changes
  useEffect(() => {
    if (recentDelta > 0) {
      setDeltaKey((k) => k + 1);
    }
  }, [recentDelta]);

  const isCompact = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative flex items-center gap-1.5 sm:gap-2.5 rounded-xl transition-all duration-300 select-none ${
        onClick ? 'cursor-pointer group hover:border-emerald-400' : ''
      } ${
        isIncrementing || isLiveScraping
          ? 'bg-emerald-950/90 border-[#00ff88] shadow-[0_0_22px_rgba(0,255,102,0.45)] ring-1 ring-[#00ff88]/60 scale-[1.02]'
          : 'bg-slate-900/90 border-emerald-500/40 shadow-[0_0_12px_rgba(0,255,102,0.12)]'
      } border ${
        isCompact
          ? 'px-2 py-1'
          : isLarge
          ? 'px-3.5 sm:px-4 py-2 sm:py-2.5'
          : 'px-2.5 sm:px-3 py-1.5 sm:py-2'
      } ${className}`}
      title={`${label} : ${count.toLocaleString('fr-DZ')} ${unit} extraits en temps réel`}
    >
      {/* Floating Animated Suction Delta Badge (+N) */}
      <AnimatePresence>
        {isIncrementing && recentDelta > 0 && (
          <motion.div
            key={deltaKey}
            initial={{ opacity: 0, y: 4, scale: 0.6 }}
            animate={{ opacity: 1, y: -22, scale: 1 }}
            exit={{ opacity: 0, y: -34, scale: 0.7 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute -top-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-2 py-0.5 rounded-full bg-gradient-to-r from-[#00ff66] to-cyan-400 text-slate-950 font-mono font-black text-[10px] sm:text-xs shadow-[0_0_15px_#00ff66] flex items-center gap-1 whitespace-nowrap"
          >
            <Zap className="w-2.5 h-2.5 fill-current animate-bounce" />
            <span>+{recentDelta}</span>
            <span className="text-[8px] opacity-80">{unit}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing Sonar Suction Indicator */}
      <div className="relative flex items-center justify-center shrink-0">
        <span
          className={`w-2.5 h-2.5 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66] ${
            isIncrementing || isLiveScraping ? 'animate-ping' : 'animate-pulse'
          }`}
        />
        {(isIncrementing || isLiveScraping) && (
          <span className="absolute w-4 h-4 rounded-full border border-[#00ff88]/80 animate-ping opacity-75" />
        )}
      </div>

      {/* Counter Digits and Label */}
      <div className="flex flex-col leading-none">
        {label && (
          <div className="flex items-center gap-1">
            <span className="text-[8px] sm:text-[9px] font-mono font-bold text-emerald-400/90 uppercase tracking-widest hidden xs:block">
              {label}
            </span>
            {(isIncrementing || isLiveScraping) && (
              <Flame className="w-2.5 h-2.5 text-[#00ff88] animate-pulse hidden xs:inline" />
            )}
          </div>
        )}

        <div className="flex items-baseline gap-1">
          <motion.span
            animate={{
              scale: isIncrementing ? [1, 1.12, 1] : 1,
              color: isIncrementing ? '#ffffff' : '#00ff66',
            }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className={`font-black font-mono tracking-tight ${
              isCompact
                ? 'text-sm'
                : isLarge
                ? 'text-lg sm:text-2xl text-glow-green'
                : 'text-base sm:text-xl text-glow-green'
            }`}
          >
            {displayValue.toLocaleString('fr-DZ')}
          </motion.span>
          {unit && (
            <span className="text-[9px] sm:text-[10px] font-mono font-bold text-slate-400 uppercase">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Cyber Shimmer Light Sweep Effect when incrementing */}
      {isIncrementing && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none rounded-xl"
        />
      )}
    </div>
  );
};
