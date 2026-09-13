import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  showBadge?: boolean;
  stacked?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showWordmark = true,
  showBadge = true,
  stacked = false,
  className = ''
}) => {
  const iconDimensions = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }[size];

  const wordmarkStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl'
  }[size];

  const subtitleStyles = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  }[size];

  return (
    <div className={`flex ${stacked ? 'flex-col items-center text-center' : 'items-center gap-3'} ${className}`}>
      {/* Precision Geometric Industrial Telemetry SVG Mark */}
      <div className={`${iconDimensions} shrink-0 relative flex items-center justify-center`}>
        <svg 
          viewBox="0 0 64 64" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Subtle Surface Glow Base */}
          <rect width="64" height="64" rx="14" fill="#EFF6FF" />
          <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="13.25" stroke="#BFDBFE" strokeWidth="1.5" />

          {/* Precision Industrial Factory Silhouette / Gear Structure */}
          <path 
            d="M14 44V26L24 33V23L34 30V18L46 27V44H14Z" 
            fill="#1E2939" 
            fillOpacity="0.08"
          />
          <path 
            d="M14 44V26L24 33V23L34 30V18L46 27V44H14Z" 
            stroke="#1E2939" 
            strokeWidth="2" 
            strokeLinejoin="round"
          />

          {/* Geometric Telemetry Waveform Line (Live Pulse) */}
          <path 
            d="M10 38H21L25 24L31 43L37 28L41 38H54" 
            stroke="#2563EB" 
            strokeWidth="2.75" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Circuit Nodes / Telemetry Beacons */}
          <circle cx="25" cy="24" r="2.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.25" />
          <circle cx="31" cy="43" r="2.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.25" />
          <circle cx="37" cy="28" r="2.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="1.25" />
          <circle cx="54" cy="38" r="2" fill="#2563EB" />
        </svg>
      </div>

      {/* Brand Wordmark & Telemetry Badge */}
      {showWordmark && (
        <div className={stacked ? 'mt-3 flex flex-col items-center' : ''}>
          <div className="flex items-center gap-2">
            <span className={`font-display font-medium text-slate-900 leading-none ${wordmarkStyles}`}>
              Mini MES
            </span>
            {showBadge && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-[30px] bg-blue-50 text-blue-700 border border-blue-200">
                HMI v2.0
              </span>
            )}
          </div>
          <p className={`text-slate-500 font-sans font-normal mt-0.5 ${subtitleStyles}`}>
            Shop-Floor Execution System
          </p>
        </div>
      )}
    </div>
  );
};
