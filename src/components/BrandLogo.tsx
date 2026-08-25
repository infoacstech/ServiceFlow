import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = false,
  showTagline = false,
  className = '',
}) => {
  const pixelSize = typeof size === 'number' 
    ? size 
    : size === 'sm' 
    ? 28 
    : size === 'md' 
    ? 36 
    : size === 'lg' 
    ? 48 
    : size === 'xl' 
    ? 64 
    : 80;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Shield Vector Icon */}
      <svg 
        width={pixelSize} 
        height={pixelSize} 
        viewBox="0 0 512 512" 
        className="shrink-0 transition-transform duration-200"
      >
        <defs>
          <linearGradient id="blBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0B132B" />
            <stop offset="50%" stop-color="#070C1E" />
            <stop offset="100%" stop-color="#030611" />
          </linearGradient>

          <radialGradient id="blAura" cx="50%" cy="48%" r="45%">
            <stop offset="0%" stop-color="#00D2FF" stop-opacity="0.4" />
            <stop offset="50%" stop-color="#0066FF" stop-opacity="0.15" />
            <stop offset="100%" stop-color="#000000" stop-opacity="0" />
          </radialGradient>

          <linearGradient id="blShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38BDF8" />
            <stop offset="35%" stop-color="#00E5FF" />
            <stop offset="70%" stop-color="#2563EB" />
            <stop offset="100%" stop-color="#1D4ED8" />
          </linearGradient>

          <linearGradient id="blInnerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0E2356" />
            <stop offset="60%" stop-color="#0A183D" />
            <stop offset="100%" stop-color="#060F26" />
          </linearGradient>

          <linearGradient id="blArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="70%" stop-color="#F0F9FF" />
            <stop offset="100%" stop-color="#BAE6FD" />
          </linearGradient>

          <radialGradient id="blOrbGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#A5F3FC" />
            <stop offset="35%" stop-color="#00D2FF" />
            <stop offset="75%" stop-color="#0284C7" />
            <stop offset="100%" stop-color="#0369A1" />
          </radialGradient>
        </defs>

        <rect width="512" height="512" rx="115" fill="url(#blBgGrad)" />
        <rect width="512" height="512" rx="115" fill="none" stroke="#1E293B" stroke-width="3" />
        <circle cx="256" cy="256" r="230" fill="url(#blAura)" />

        {/* Shield */}
        <path 
          d="M 256 68 L 394 134 C 402 138 406 146 406 155 L 406 280 C 406 345 342 405 260 450 C 257.5 451.4 254.5 451.4 252 450 C 170 405 106 345 106 280 L 106 155 C 106 146 110 138 118 134 Z" 
          fill="url(#blInnerGrad)" 
          stroke="url(#blShieldGrad)" 
          stroke-width="20" 
          stroke-linejoin="round"
        />

        {/* Chevron Arrow */}
        <path 
          d="M 212 168 C 222 158 238 158 248 168 L 316 236 C 327 247 327 265 316 276 L 248 344 C 238 354 222 354 212 344 C 202 334 202 318 212 308 L 264 256 L 212 204 C 202 194 202 178 212 168 Z" 
          fill="url(#blArrowGrad)" 
        />

        {/* Center Orb */}
        <circle cx="256" cy="256" r="32" fill="url(#blOrbGrad)" />
        <ellipse cx="247" cy="245" rx="9" ry="6" fill="#FFFFFF" fill-opacity="0.85" transform="rotate(-30 247 245)" />
        <circle cx="256" cy="256" r="33" fill="none" stroke="#E0F2FE" stroke-width="2" stroke-opacity="0.7" />
      </svg>

      {/* Optional Typography Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center text-lg font-black tracking-tight text-white">
            <span>Servi</span>
            <span className="text-sky-400">Flow</span>
          </div>
          {showTagline && (
            <div className="text-[10px] font-semibold text-slate-400 tracking-wider flex items-center gap-1">
              <span>MANAGE</span>
              <span className="text-sky-400">•</span>
              <span>TRACK</span>
              <span className="text-sky-400">•</span>
              <span>GROW</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
