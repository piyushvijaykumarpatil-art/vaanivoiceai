import React, { useMemo } from 'react';

interface CelestialNebulaBackgroundProps {
  primaryColor?: string;
}

export const CelestialNebulaBackground: React.FC<CelestialNebulaBackgroundProps> = ({
  primaryColor = '#F59E0B'
}) => {
  // Generate deterministic stars for celestial space void
  const stars = useMemo(() => {
    const starList = [];
    const seed = 42;
    for (let i = 0; i < 90; i++) {
      const x = ((i * 37 + seed * 13) % 1000) / 10;
      const y = ((i * 73 + seed * 29) % 1000) / 10;
      const size = (i % 5 === 0) ? 2.5 : (i % 3 === 0 ? 1.8 : 1.2);
      const opacity = 0.25 + ((i * 17) % 65) / 100;
      const delay = (i % 7) * 0.7;
      const duration = 2.5 + (i % 5) * 1.1;
      starList.push({ id: i, x, y, size, opacity, delay, duration });
    }
    return starList;
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#02040A]">
      {/* 1. Deep Space Void Base with subtle stardust texture */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 35%, #050914 0%, #03060E 50%, #010206 100%)'
        }}
      />

      {/* 2. Twinkling Stars in Deep Celestial Space */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {stars.map((star) => (
          <circle
            key={star.id}
            cx={`${star.x}%`}
            cy={`${star.y}%`}
            r={star.size}
            fill="#FFFFFF"
            opacity={star.opacity}
            style={{
              animation: `twinkleStar ${star.duration}s ease-in-out ${star.delay}s infinite alternate`
            }}
          />
        ))}
      </svg>

      {/* 3. Soft Glowing Teal-and-Purple Cosmic Nebula Clouds */}
      <div className="absolute inset-0 filter blur-[80px] sm:blur-[95px] opacity-75 sm:opacity-85 mix-blend-screen animate-nebulaBreathe">
        {/* Soft Glowing Teal Nebula Cloud (Left-Center) */}
        <div
          className="absolute -top-[5%] left-[8%] w-[60vw] max-w-[750px] h-[55vh] rounded-full"
          style={{
            background: 'radial-gradient(circle at 45% 45%, rgba(13, 148, 136, 0.42) 0%, rgba(6, 182, 212, 0.28) 40%, rgba(20, 184, 166, 0.12) 65%, transparent 80%)'
          }}
        />

        {/* Soft Glowing Celestial Purple Nebula Cloud (Right-Center) */}
        <div
          className="absolute top-[8%] right-[5%] w-[65vw] max-w-[800px] h-[60vh] rounded-full"
          style={{
            background: 'radial-gradient(circle at 55% 45%, rgba(147, 51, 234, 0.40) 0%, rgba(168, 85, 247, 0.26) 38%, rgba(124, 58, 237, 0.14) 65%, transparent 82%)'
          }}
        />

        {/* Deep Indigo / Celestial Core Nebula */}
        <div
          className="absolute top-[20%] left-[25%] w-[50vw] max-w-[650px] h-[45vh] rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.24) 0%, rgba(139, 92, 246, 0.15) 45%, transparent 75%)'
          }}
        />

        {/* Dynamic theme accent reflection glow */}
        <div
          className="absolute top-[35%] left-[35%] w-[35vw] max-w-[500px] h-[35vh] rounded-full opacity-40 transition-colors duration-700"
          style={{
            background: `radial-gradient(circle at center, ${primaryColor}44 0%, transparent 70%)`
          }}
        />
      </div>

      {/* 4. Subtle, High-Tech Glowing Geometric Node/Circuit Grid across Lower Half */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[52vh] sm:h-[58vh]"
        style={{
          maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.3) 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.3) 75%, transparent 100%)'
        }}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow filters for high-tech circuit nodes */}
            <filter id="glow-teal" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-purple" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="grid-grad-teal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.05" />
              <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="grid-grad-purple" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" stopOpacity="0.05" />
              <stop offset="70%" stopColor="#A855F7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="circuit-pulse-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Perspective grid lines converging to center horizon (720, 0) */}
          <g stroke="url(#grid-grad-teal)" strokeWidth="1" opacity="0.45">
            <line x1="720" y1="0" x2="-200" y2="600" />
            <line x1="720" y1="0" x2="0" y2="600" />
            <line x1="720" y1="0" x2="180" y2="600" />
            <line x1="720" y1="0" x2="360" y2="600" />
            <line x1="720" y1="0" x2="540" y2="600" />
            <line x1="720" y1="0" x2="660" y2="600" />
            <line x1="720" y1="0" x2="720" y2="600" strokeWidth="1.5" stroke="url(#grid-grad-teal)" />
            <line x1="720" y1="0" x2="780" y2="600" />
            <line x1="720" y1="0" x2="900" y2="600" />
            <line x1="720" y1="0" x2="1080" y2="600" />
            <line x1="720" y1="0" x2="1260" y2="600" />
            <line x1="720" y1="0" x2="1440" y2="600" />
            <line x1="720" y1="0" x2="1640" y2="600" />
          </g>

          {/* Transverse horizontal depth grid lines with perspective spacing */}
          <g stroke="url(#grid-grad-purple)" strokeWidth="1" opacity="0.4">
            <line x1="0" y1="35" x2="1440" y2="35" opacity="0.15" />
            <line x1="0" y1="80" x2="1440" y2="80" opacity="0.25" />
            <line x1="0" y1="140" x2="1440" y2="140" opacity="0.35" />
            <line x1="0" y1="215" x2="1440" y2="215" opacity="0.45" />
            <line x1="0" y1="305" x2="1440" y2="305" opacity="0.6" />
            <line x1="0" y1="410" x2="1440" y2="410" opacity="0.75" />
            <line x1="0" y1="530" x2="1440" y2="530" opacity="0.9" strokeWidth="1.5" />
          </g>

          {/* Cybernetic Circuit Traces with orthogonal angles */}
          <g fill="none" strokeWidth="1.5" opacity="0.65">
            {/* Left Wing Circuit Bus */}
            <path
              d="M 180,600 L 180,450 L 320,450 L 320,330 L 450,330 L 450,220 L 560,220"
              stroke="#06B6D4"
              strokeDasharray="4 3"
              filter="url(#glow-teal)"
            />
            {/* Right Wing Circuit Bus */}
            <path
              d="M 1260,600 L 1260,450 L 1120,450 L 1120,330 L 990,330 L 990,220 L 880,220"
              stroke="#A855F7"
              strokeDasharray="4 3"
              filter="url(#glow-purple)"
            />
            {/* Central High-Speed Data Track */}
            <path
              d="M 720,600 L 720,400 L 670,350 L 670,250 L 720,200 L 720,100"
              stroke="#F59E0B"
              strokeWidth="2"
              opacity="0.8"
              filter="url(#glow-gold)"
            />
            <path
              d="M 720,400 L 770,350 L 770,250 L 720,200"
              stroke="#F59E0B"
              strokeWidth="1.5"
              opacity="0.6"
              filter="url(#glow-gold)"
            />
          </g>

          {/* Geometric Intersecting Circuit Nodes */}
          <g>
            {/* Cyan / Teal Intersecting Nodes */}
            <circle cx="320" cy="450" r="3.5" fill="#22D3EE" filter="url(#glow-teal)" />
            <circle cx="450" cy="330" r="3.5" fill="#06B6D4" filter="url(#glow-teal)" />
            <circle cx="560" cy="220" r="3" fill="#06B6D4" filter="url(#glow-teal)" />
            <circle cx="270" cy="530" r="2.5" fill="#06B6D4" />
            <circle cx="480" cy="410" r="2.5" fill="#06B6D4" />
            <circle cx="620" cy="305" r="2.5" fill="#06B6D4" />

            {/* Purple / Violet Intersecting Nodes */}
            <circle cx="1120" cy="450" r="3.5" fill="#C084FC" filter="url(#glow-purple)" />
            <circle cx="990" cy="330" r="3.5" fill="#A855F7" filter="url(#glow-purple)" />
            <circle cx="880" cy="220" r="3" fill="#A855F7" filter="url(#glow-purple)" />
            <circle cx="1170" cy="530" r="2.5" fill="#A855F7" />
            <circle cx="960" cy="410" r="2.5" fill="#A855F7" />
            <circle cx="820" cy="305" r="2.5" fill="#A855F7" />

            {/* Warm Gold Central Hub Nodes */}
            <circle cx="720" cy="400" r="4.5" fill="#F59E0B" filter="url(#glow-gold)" />
            <circle cx="670" cy="350" r="3" fill="#FBBF24" filter="url(#glow-gold)" />
            <circle cx="770" cy="350" r="3" fill="#FBBF24" filter="url(#glow-gold)" />
            <circle cx="720" cy="200" r="4" fill="#F59E0B" filter="url(#glow-gold)" />
            <circle cx="720" cy="530" r="4.5" fill="#F59E0B" filter="url(#glow-gold)" />

            {/* Small diamond accents at circuit boundaries */}
            <rect x="317" y="447" width="6" height="6" fill="none" stroke="#22D3EE" transform="rotate(45 320 450)" />
            <rect x="1117" y="447" width="6" height="6" fill="none" stroke="#C084FC" transform="rotate(45 1120 450)" />
            <rect x="716" y="396" width="8" height="8" fill="none" stroke="#FDE68A" transform="rotate(45 720 400)" />
          </g>

          {/* Animated Circuit Energy Pulses */}
          <circle r="3" fill="#67E8F9" filter="url(#glow-teal)">
            <animateMotion
              path="M 180,600 L 180,450 L 320,450 L 320,330 L 450,330 L 450,220 L 560,220"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="#E9D5FF" filter="url(#glow-purple)">
            <animateMotion
              path="M 1260,600 L 1260,450 L 1120,450 L 1120,330 L 990,330 L 990,220 L 880,220"
              dur="6.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3.5" fill="#FDE68A" filter="url(#glow-gold)">
            <animateMotion
              path="M 720,600 L 720,400 L 670,350 L 670,250 L 720,200 L 720,100"
              dur="4.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>

      {/* Subtle vignette border around edges */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 120px rgba(0, 0, 0, 0.85)'
        }}
      />
    </div>
  );
};
