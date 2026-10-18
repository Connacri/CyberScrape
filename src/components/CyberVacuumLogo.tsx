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
 * Exact geometric vector recreation of the brand logo ("uncuu nn" / VACUUM).
 * Letters 1 & 2: Neon Emerald Green (#00ff66)
 * Letters 3 & 4: Crisp Diamond White (#ffffff)
 * Letters 5, 6 & 7: Neon Emerald Green (#00ff66)
 * Uses native CSS drop-shadow so the logo ALWAYS renders reliably without SVG filter ID collisions.
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
        className="overflow-visible select-none shrink-0"
        style={{
          filter: glow ? 'drop-shadow(0 0 6px rgba(0, 255, 102, 0.75)) drop-shadow(0 0 12px rgba(0, 255, 102, 0.35))' : undefined,
        }}
      >
        <g>
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
 * Exact Brand App Icon Squircle component matching the exact brand logo
 */
export const CyberVacuumAppIcon: React.FC<{
  size?: number | string;
  glow?: boolean;
  className?: string;
  roundedClass?: string;
}> = ({
  size = 36,
  glow = true,
  className = '',
  roundedClass = 'rounded-xl',
}) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at center, #08182a 0%, #030712 85%, #010307 100%)',
      }}
      className={`relative ${roundedClass} border border-emerald-400/80 flex flex-col items-center justify-center p-0.5 overflow-hidden shadow-[0_0_16px_rgba(0,255,102,0.45)] select-none shrink-0 ${className}`}
    >
      {/* Outer energy accent border */}
      <div className="absolute inset-0 rounded-[inherit] border border-[#00f0ff]/30 pointer-events-none" />
      
      {/* Exact inline vector of CyberVacuum brand logo */}
      <svg
        viewBox="0 0 512 512"
        className="w-full h-full pointer-events-none"
        style={{
          filter: glow ? 'drop-shadow(0 0 4px rgba(0,255,102,0.85))' : undefined,
        }}
      >
        {/* Subtle circuit matrix lines */}
        <g opacity="0.25" stroke="#00ff66" strokeWidth="2">
          <path d="M 64 160 L 448 160 M 64 352 L 448 352" />
          <path d="M 160 64 L 160 448 M 352 64 L 352 448" />
          <circle cx="160" cy="160" r="8" fill="#00ff66" />
          <circle cx="352" cy="160" r="8" fill="#00f0ff" />
          <circle cx="160" cy="352" r="8" fill="#00f0ff" />
          <circle cx="352" cy="352" r="8" fill="#00ff66" />
        </g>

        {/* Brand glyphs VACUUM (uncuu nn) */}
        <g transform="translate(36, 175) scale(0.709)">
          {/* Glyph 1: u (Green #00ff66) */}
          <path d="M 10 15 L 32 15 L 32 68 A 18 18 0 0 0 68 68 L 68 15 L 90 15 L 90 68 A 40 40 0 0 1 10 68 Z" fill="#00ff66" />
          {/* Glyph 2: n (Green #00ff66) */}
          <path d="M 100 95 L 122 95 L 122 42 A 18 18 0 0 1 158 42 L 158 95 L 180 95 L 180 42 A 40 40 0 0 0 100 42 Z" fill="#00ff66" />
          {/* Glyph 3: c (White #ffffff) */}
          <path d="M 270 15 L 270 37 L 232 37 A 18 18 0 0 0 232 73 L 270 73 L 270 95 L 232 95 A 40 40 0 0 1 232 15 Z" fill="#ffffff" />
          {/* Glyph 4: u (White #ffffff) */}
          <path d="M 280 15 L 302 15 L 302 68 A 18 18 0 0 0 338 68 L 338 15 L 360 15 L 360 68 A 40 40 0 0 1 280 68 Z" fill="#ffffff" />
          {/* Glyph 5: u (Green #00ff66) */}
          <path d="M 370 15 L 392 15 L 392 68 A 18 18 0 0 0 428 68 L 428 15 L 450 15 L 450 68 A 40 40 0 0 1 370 68 Z" fill="#00ff66" />
          {/* Glyph 6: n (Green #00ff66) */}
          <path d="M 460 95 L 482 95 L 482 42 A 18 18 0 0 1 518 42 L 518 95 L 540 95 L 540 42 A 40 40 0 0 0 460 42 Z" fill="#00ff66" />
          {/* Glyph 7: n (Green #00ff66) */}
          <path d="M 550 95 L 572 95 L 572 42 A 18 18 0 0 1 608 42 L 608 95 L 630 95 L 630 42 A 40 40 0 0 0 550 42 Z" fill="#00ff66" />
        </g>

        {/* Accent Divider Beam */}
        <line x1="90" y1="300" x2="422" y2="300" stroke="#00ff66" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
        <circle cx="256" cy="300" r="6" fill="#ffffff" />

        {/* Subtitle Text */}
        <g transform="translate(256, 350)" textAnchor="middle">
          <text fontFamily="sans-serif" fontWeight="900" fontSize="28" fill="#00ff66" letterSpacing="6">CYBER-VACUUM</text>
          <text y="32" fontFamily="monospace" fontWeight="700" fontSize="16" fill="#00f0ff" letterSpacing="4" opacity="0.9">AI MATRIX ENGINE</text>
        </g>
      </svg>

      {/* Holographic sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
    </div>
  );
};

export const CyberVacuumIconTile = CyberVacuumAppIcon;
