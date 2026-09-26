import React from 'react';

interface BrainNodeWatermarkProps {
  className?: string;
  glowColor?: string;
}

export const BrainNodeWatermark: React.FC<BrainNodeWatermarkProps> = ({
  className = "w-28 h-28 opacity-20",
  glowColor = "#06B6D4"
}) => {
  return (
    <svg
      viewBox="0 0 160 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none transition-all duration-500 ${className}`}
    >
      <defs>
        <filter id="brain-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="brain-wire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.8" />
          <stop offset="50%" stopColor="#A855F7" stopOpacity="0.5" />
          <stop offset="100%" stopColor={glowColor} stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* 3D Isometric Wireframe Brain Silhouette & Hemispheres */}
      <g stroke="url(#brain-wire-grad)" strokeWidth="0.85" opacity="0.85">
        {/* Left Hemisphere Outer Contour */}
        <path
          d="M 80,20 C 65,18 45,26 35,42 C 24,58 24,78 32,94 C 40,110 58,118 72,118 C 76,118 78,116 80,114"
          strokeDasharray="2 1.5"
        />
        {/* Right Hemisphere Outer Contour */}
        <path
          d="M 80,20 C 95,18 115,26 125,42 C 136,58 136,78 128,94 C 120,110 102,118 88,118 C 84,118 82,116 80,114"
          strokeDasharray="2 1.5"
        />
        {/* Central Fissure */}
        <path d="M 80,20 Q 82,65 80,114" strokeWidth="1.2" />

        {/* 3D Wireframe Latitudinal Arcs */}
        <path d="M 40,48 Q 60,42 80,48 Q 100,42 120,48" strokeWidth="0.65" opacity="0.6" />
        <path d="M 30,68 Q 55,60 80,68 Q 105,60 130,68" strokeWidth="0.75" opacity="0.7" />
        <path d="M 33,88 Q 57,80 80,88 Q 103,80 127,88" strokeWidth="0.65" opacity="0.6" />
        <path d="M 48,105 Q 64,98 80,105 Q 96,98 112,105" strokeWidth="0.6" opacity="0.5" />

        {/* 3D Isometric Longitudinal Ribs */}
        <path d="M 50,28 Q 42,65 52,108" strokeWidth="0.6" opacity="0.6" />
        <path d="M 66,22 Q 62,65 68,114" strokeWidth="0.65" opacity="0.65" />
        <path d="M 94,22 Q 98,65 92,114" strokeWidth="0.65" opacity="0.65" />
        <path d="M 110,28 Q 118,65 108,108" strokeWidth="0.6" opacity="0.6" />
      </g>

      {/* Interconnected Neural Synaptic Circuit Lines */}
      <g stroke={glowColor} strokeWidth="0.9" opacity="0.75">
        <line x1="45" y1="36" x2="62" y2="44" />
        <line x1="62" y1="44" x2="80" y2="35" />
        <line x1="80" y1="35" x2="98" y2="44" />
        <line x1="98" y1="44" x2="115" y2="36" />

        <line x1="38" y1="58" x2="55" y2="65" />
        <line x1="55" y1="65" x2="80" y2="62" />
        <line x1="80" y1="62" x2="105" y2="65" />
        <line x1="105" y1="65" x2="122" y2="58" />

        <line x1="45" y1="36" x2="55" y2="65" />
        <line x1="62" y1="44" x2="80" y2="62" />
        <line x1="98" y1="44" x2="80" y2="62" />
        <line x1="115" y1="36" x2="105" y2="65" />

        <line x1="42" y1="82" x2="60" y2="88" />
        <line x1="60" y1="88" x2="80" y2="85" />
        <line x1="80" y1="85" x2="100" y2="88" />
        <line x1="100" y1="88" x2="118" y2="82" />

        <line x1="55" y1="65" x2="60" y2="88" />
        <line x1="80" y1="62" x2="80" y2="85" />
        <line x1="105" y1="65" x2="100" y2="88" />

        <line x1="60" y1="88" x2="72" y2="108" />
        <line x1="80" y1="85" x2="80" y2="110" />
        <line x1="100" y1="88" x2="88" y2="108" />
        <line x1="72" y1="108" x2="88" y2="108" />
      </g>

      {/* Glowing 3D Wireframe Neural Nodes */}
      <g filter="url(#brain-glow)">
        <circle cx="80" cy="22" r="2.5" fill="#FFFFFF" />
        <circle cx="45" cy="36" r="2.2" fill={glowColor} />
        <circle cx="62" cy="44" r="2.2" fill={glowColor} />
        <circle cx="80" cy="35" r="3" fill="#F59E0B" />
        <circle cx="98" cy="44" r="2.2" fill={glowColor} />
        <circle cx="115" cy="36" r="2.2" fill={glowColor} />

        <circle cx="38" cy="58" r="2.2" fill={glowColor} />
        <circle cx="55" cy="65" r="2.6" fill="#C084FC" />
        <circle cx="80" cy="62" r="3.5" fill="#FFFFFF" />
        <circle cx="105" cy="65" r="2.6" fill="#C084FC" />
        <circle cx="122" cy="58" r="2.2" fill={glowColor} />

        <circle cx="42" cy="82" r="2" fill={glowColor} />
        <circle cx="60" cy="88" r="2.4" fill={glowColor} />
        <circle cx="80" cy="85" r="3" fill="#F59E0B" />
        <circle cx="100" cy="88" r="2.4" fill={glowColor} />
        <circle cx="118" cy="82" r="2" fill={glowColor} />

        <circle cx="72" cy="108" r="2" fill={glowColor} />
        <circle cx="80" cy="112" r="2.5" fill="#FFFFFF" />
        <circle cx="88" cy="108" r="2" fill={glowColor} />
      </g>
    </svg>
  );
};
