import React from 'react';

interface VyomaLogoProps {
  className?: string;
  size?: number;
  variant?: 'icon' | 'emblem' | 'horizontal' | 'badge';
  subtitle?: string;
  showSubtitle?: boolean;
}

export function VyomaEmblem({ size = 28, className = '' }: { size?: number; className?: string }) {
  const gradId = React.useId();
  const glowId = React.useId();

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`goldGrad-${gradId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9E8C8" />
          <stop offset="28%" stopColor="#C5A059" />
          <stop offset="70%" stopColor="#9A7B38" />
          <stop offset="100%" stopColor="#DFBA6B" />
        </linearGradient>
        <filter id={`glow-${glowId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#C5A059" floodOpacity="0.4" />
        </filter>
      </defs>

      <g filter={`url(#glow-${glowId})`}>
        {/* Outer Faceted V & Shield Framing */}
        <path 
          d="M20 28 L32 28 L40 44 L50 64 L60 44 L68 28 L80 28 L50 88 Z" 
          fill="none" 
          stroke={`url(#goldGrad-${gradId})`} 
          strokeWidth="3.2" 
          strokeLinejoin="round" 
          strokeLinecap="round"
        />

        {/* Inner Sharp Precision Monogram V */}
        <path 
          d="M34 38 L50 72 L66 38" 
          fill="none" 
          stroke={`url(#goldGrad-${gradId})`} 
          strokeWidth="2.8" 
          strokeLinejoin="round" 
          strokeLinecap="round"
        />

        {/* Michelin Cloche Cover Dome */}
        <path 
          d="M36 38 C36 27 42 21 50 21 C58 21 64 27 64 38 Z" 
          fill="none" 
          stroke={`url(#goldGrad-${gradId})`} 
          strokeWidth="2.8" 
          strokeLinejoin="round" 
          strokeLinecap="round"
        />

        {/* Cloche Finial Top Orb */}
        <circle cx="50" cy="18.5" r="2.8" fill={`url(#goldGrad-${gradId})`} />

        {/* Left Wing Flares */}
        <path 
          d="M34 38 C25 33 15 31 11 27 C13 36 21 41 32 44" 
          fill="none" 
          stroke={`url(#goldGrad-${gradId})`} 
          strokeWidth="2.4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M30 43 C22 41 16 43 13 39 C16 45 23 48 32 49" 
          fill="none" 
          stroke={`url(#goldGrad-${gradId})`} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />

        {/* Right Wing Flares */}
        <path 
          d="M66 38 C75 33 85 31 89 27 C87 36 79 41 68 44" 
          fill="none" 
          stroke={`url(#goldGrad-${gradId})`} 
          strokeWidth="2.4" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        <path 
          d="M70 43 C78 41 84 43 87 39 C84 45 77 48 68 49" 
          fill="none" 
          stroke={`url(#goldGrad-${gradId})`} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />

        {/* Cloche Base Tray Horizon */}
        <line 
          x1="30" 
          y1="40" 
          x2="70" 
          y2="40" 
          stroke={`url(#goldGrad-${gradId})`} 
          strokeWidth="2.2" 
          strokeLinecap="round" 
        />
      </g>
    </svg>
  );
}

export function VyomaLogo({
  className = '',
  size = 28,
  variant = 'horizontal',
  subtitle = 'POS & KDS',
  showSubtitle = true,
}: VyomaLogoProps) {
  if (variant === 'icon') {
    return <VyomaEmblem size={size} className={className} />;
  }

  if (variant === 'emblem') {
    return (
      <div 
        className={`flex items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-black to-[#0A0A0E] shadow-[0_0_25px_rgba(197,160,89,0.2)] shrink-0 overflow-hidden p-1.5 ${className}`}
        style={{ width: size + 16, height: size + 16 }}
      >
        <VyomaEmblem size={size} />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-[#0A0A0E]/90 backdrop-blur-md shadow-[0_0_15px_rgba(197,160,89,0.15)] ${className}`}>
        <VyomaEmblem size={size || 18} />
        <span className="font-serif text-sm font-bold tracking-tight text-white">
          Vy<span className="italic text-primary">oma</span>
        </span>
        {showSubtitle && subtitle && (
          <span className="text-[9px] font-mono tracking-widest uppercase text-white/50 border-l border-white/10 pl-2">
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  // Default 'horizontal'
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-black to-[#0A0A0E] shadow-[0_0_25px_rgba(197,160,89,0.2)] shrink-0 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(197,160,89,0.3)] transition-all">
        <VyomaEmblem size={size || 24} />
      </div>
      <div className="flex flex-col text-left">
        <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
          Vy<span className="italic text-primary">oma</span>
        </span>
        {showSubtitle && (
          <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.25em] text-white/50 uppercase font-semibold mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
