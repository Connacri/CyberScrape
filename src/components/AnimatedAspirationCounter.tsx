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
 * Ensures any input value is strictly a non-negative finite integer.
 * Guarantees zero if NaN, null, undefined, negative, or non-numeric.
 */
export function toSafeNonNegativeInt(val: unknown): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return 0;
  }
  return Math.max(0, Math.floor(val));
}

/**
 * High-performance animated counter hook with cubic ease-out numeric roll.
 * Guaranteed to never output negative numbers, NaN, or sudden negative fluctuations.
 */
export function useAnimatedNumber(targetValue: number, duration: number = 420) {
  const safeTarget = toSafeNonNegativeInt(targetValue);
  const [displayValue, setDisplayValue] = useState<number>(safeTarget);
  const [isIncrementing, setIsIncrementing] = useState<boolean>(false);
  const [recentDelta, setRecentDelta] = useState<number>(0);
  const lastTargetRef = useRef<number>(safeTarget);
  const currentDisplayRef = useRef<number>(safeTarget);
  const highestSeenRef = useRef<number>(safeTarget);

  currentDisplayRef.current = toSafeNonNegativeInt(displayValue);

  useEffect(() => {
    const cleanTarget = toSafeNonNegativeInt(targetValue);

    // If user explicitly reset/cleared catalogue to 0
    if (cleanTarget === 0) {
      highestSeenRef.current = 0;
      lastTargetRef.current = 0;
      setDisplayValue(0);
      setIsIncrementing(false);
      setRecentDelta(0);
      return;
    }

    // Monotonic aspiration: during active scraping, the total counter must NEVER decrease or show negative numbers/NaN
    highestSeenRef.current = Math.max(toSafeNonNegativeInt(highestSeenRef.current), cleanTarget);
    const effectiveTarget = highestSeenRef.current;

    const prevTarget = toSafeNonNegativeInt(lastTargetRef.current);
    lastTargetRef.current = effectiveTarget;

    const currentVal = toSafeNonNegativeInt(currentDisplayRef.current);
    if (effectiveTarget === currentVal) return;

    const diff = Math.max(0, effectiveTarget - currentVal);
    if (diff > 0) {
      setIsIncrementing(true);
      const delta = effectiveTarget > prevTarget ? effectiveTarget - prevTarget : diff;
      setRecentDelta(Math.max(0, toSafeNonNegativeInt(delta)));
    }

    const startVal = currentVal;
    const startTime = performance.now();
    let animId: number;

    const step = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(Math.max(0, elapsed / duration), 1);
      // Ease-out cubic for responsive sci-fi deceleration
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextVal = toSafeNonNegativeInt(Math.round(startVal + diff * ease));

      setDisplayValue(nextVal);

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

  return {
    displayValue: toSafeNonNegativeInt(displayValue),
    isIncrementing,
    recentDelta: toSafeNonNegativeInt(recentDelta),
  };
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
  const safeCount = toSafeNonNegativeInt(count);
  const { displayValue, isIncrementing, recentDelta } = useAnimatedNumber(safeCount, 460);
  const [deltaKey, setDeltaKey] = useState(0);

  // Trigger floating delta badge whenever delta changes
  useEffect(() => {
    if (recentDelta > 0) {
      setDeltaKey((k) => k + 1);
    }
  }, [recentDelta]);

  const isCompact = size === 'sm';
  const isLarge = size === 'lg';

  // Strictly guaranteed non-negative integer for rendering
  const safeDisplayValue = toSafeNonNegativeInt(displayValue);

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
      title={`${label || 'Articles'} : ${safeCount.toLocaleString('fr-DZ')} ${unit} extraits en temps réel`}
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
            <span>+{recentDelta.toLocaleString('fr-DZ')}</span>
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
            {safeDisplayValue.toLocaleString('fr-DZ')}
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
