import React from 'react';

interface CyberVacuumLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  width?: number | string;
  height?: number | string;
  showSubtitle?: boolean;
  glow?: boolean;
}

/**
 * Exact geometric vector recreation of the user's uploaded "uncuu nn" (VACUUM) brand logo.
 * Letters 1 & 2: Neon Emerald Green (#00ff66)
 * Letters 3 & 4: Crisp Diamond White (#ffffff)
 * Letters 5, 6 & 7: Neon Emerald Green (#00ff66)
 */
export const CyberVacuumLogo: React.FC<CyberVacuumLogoProps> = ({
  className = '',
  size = 'md',
  width,
  height,
  showSubtitle = false,
  glow = true,
}) => {
  const sizeMap = {
    sm: { h: 22, w: 110 },
    md: { h: 32, w: 160 },
    lg: { h: 46, w: 230 },
    xl: { h: 64, w: 320 },
    custom: { h: height || 32, w: width || 160 },
  };

  const selectedSize = sizeMap[size];
  const finalW = width || selectedSize.w;
  const finalH = height || selectedSize.h;

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      <svg
        viewBox="0 0 640 120"
        width={finalW}
        height={finalH}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible select-none"
      >
        <defs>
          {glow && (
            <filter id="cyber-logo-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        <g filter={glow ? 'url(#cyber-logo-glow)' : undefined}>
          {/* Glyph 1: 'u' (Green #00ff66) - x: 10 */}
          <path
            d="M 10 15 
               L 32 15 
               L 32 68 
               A 18 18 0 0 0 68 68 
               L 68 15 
               L 90 15 
               L 90 68 
               A 40 40 0 0 1 10 68 
               Z"
            fill="#00ff66"
          />

          {/* Glyph 2: 'n' (Green #00ff66) - x: 100 */}
          <path
            d="M 100 95 
               L 122 95 
               L 122 42 
               A 18 18 0 0 1 158 42 
               L 158 95 
               L 180 95 
               L 180 42 
               A 40 40 0 0 0 100 42 
               Z"
            fill="#00ff66"
          />

          {/* Glyph 3: 'c' (White #ffffff) - x: 190 */}
          <path
            d="M 270 15 
               L 270 37 
               L 232 37 
               A 18 18 0 0 0 232 73 
               L 270 73 
               L 270 95 
               L 232 95 
               A 40 40 0 0 1 232 15 
               Z"
            fill="#ffffff"
          />

          {/* Glyph 4: 'u' (White #ffffff) - x: 280 */}
          <path
            d="M 280 15 
               L 302 15 
               L 302 68 
               A 18 18 0 0 0 338 68 
               L 338 15 
               L 360 15 
               L 360 68 
               A 40 40 0 0 1 280 68 
               Z"
            fill="#ffffff"
          />

          {/* Glyph 5: 'u' (Green #00ff66) - x: 370 */}
          <path
            d="M 370 15 
               L 392 15 
               L 392 68 
               A 18 18 0 0 0 428 68 
               L 428 15 
               L 450 15 
               L 450 68 
               A 40 40 0 0 1 370 68 
               Z"
            fill="#00ff66"
          />

          {/* Glyph 6: 'n' (Green #00ff66) - x: 460 */}
          <path
            d="M 460 95 
               L 482 95 
               L 482 42 
               A 18 18 0 0 1 518 42 
               L 518 95 
               L 540 95 
               L 540 42 
               A 40 40 0 0 0 460 42 
               Z"
            fill="#00ff66"
          />

          {/* Glyph 7: 'n' (Green #00ff66) - x: 550 */}
          <path
            d="M 550 95 
               L 572 95 
               L 572 42 
               A 18 18 0 0 1 608 42 
               L 608 95 
               L 630 95 
               L 630 42 
               A 40 40 0 0 0 550 42 
               Z"
            fill="#00ff66"
          />
        </g>
      </svg>

      {showSubtitle && (
        <span className="text-[10px] tracking-[0.25em] uppercase font-mono text-[#00ff66]/80 -mt-0.5">
          AI DATA SCRAPER // MATRIX ENGINE
        </span>
      )}
    </div>
  );
};

/**
 * Square App Icon variant of the user's logo for app launcher, header badges and splash
 */
export const CyberVacuumIconTile: React.FC<{ size?: number; glow?: boolean; className?: string }> = ({
  size = 48,
  glow = true,
  className = '',
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-2xl bg-black border border-[#00ff66]/40 flex items-center justify-center p-2 overflow-hidden shadow-[0_0_20px_rgba(0,255,102,0.3)] ${className}`}
    >
      <CyberVacuumLogo size="custom" width={size * 0.85} height={size * 0.35} glow={glow} />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
    </div>
  );
};
