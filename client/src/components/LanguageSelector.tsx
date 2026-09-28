import React from 'react';
import { SUPPORTED_LANGUAGES } from '../utils/constants';
import { Globe, Volume2, Sparkles } from 'lucide-react';
import { BrainNodeWatermark } from './BrainNodeWatermark';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageSelect: (langId: string) => void;
  primaryColor?: string;
  variant?: 'dropdown' | 'grid';
}

const CornerFlourish: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br' }> = ({ position }) => {
  const rotationClass = {
    tl: '',
    tr: 'rotate-90',
    bl: '-rotate-90',
    br: 'rotate-180'
  }[position];

  const posClass = {
    tl: 'top-1.5 left-1.5',
    tr: 'top-1.5 right-1.5',
    bl: 'bottom-1.5 left-1.5',
    br: 'bottom-1.5 right-1.5'
  }[position];

  return (
    <svg
      className={`absolute ${posClass} w-4 h-4 pointer-events-none text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] transition-transform duration-300 ${rotationClass} z-20`}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M 2 12 L 2 4 C 2 2.9 2.9 2 4 2 L 12 2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="5" cy="5" r="1.5" fill="currentColor" />
      <path
        d="M 6 9 C 6 7.3 7.3 6 9 6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageSelect,
  primaryColor = '#F59E0B',
  variant = 'dropdown'
}) => {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = currentLanguage === lang.id;
          const cleanVoice = lang.voiceName.split('-')[2] || lang.voiceName;
          const tag = lang.id.toUpperCase();

          return (
            <button
              key={lang.id}
              onClick={() => onLanguageSelect(lang.id)}
              className={`group relative p-3.5 sm:p-4 rounded-2xl text-left transition-all duration-300 overflow-hidden backdrop-blur-xl ${
                isSelected
                  ? 'border-2 border-[#F59E0B] scale-[1.02] z-10'
                  : 'border border-white/10 hover:border-white/30 bg-[#060b16]/75 hover:bg-[#0a1224]/85 opacity-85 hover:opacity-100 hover:scale-[1.01]'
              }`}
              style={{
                backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.12)' : undefined,
                borderColor: isSelected ? '#F59E0B' : undefined,
                boxShadow: isSelected
                  ? '0 0 30px rgba(245, 158, 11, 0.7), inset 0 0 16px rgba(245, 158, 11, 0.25)'
                  : '0 8px 24px -6px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Ornate Glowing Warm Gold Corner Flourishes on Active Card */}
              {isSelected && (
                <>
                  <CornerFlourish position="tl" />
                  <CornerFlourish position="tr" />
                  <CornerFlourish position="bl" />
                  <CornerFlourish position="br" />
                </>
              )}

              {/* Embedded Translucent Glowing 3D Wireframe Brain Graphic */}
              <div className="absolute -right-3 -bottom-3 w-28 h-28 pointer-events-none transition-transform duration-500 group-hover:scale-110">
                <BrainNodeWatermark
                  idPrefix={`card-${lang.id}`}
                  className={isSelected ? "w-full h-full opacity-45" : "w-full h-full opacity-18 group-hover:opacity-35"}
                  glowColor={isSelected ? "#F59E0B" : "#06B6D4"}
                />
              </div>

              {/* Top Row: Flag & Tag Badge */}
              <div className="relative z-10 flex items-center justify-between mb-2">
                <span className="text-xl sm:text-2xl filter drop-shadow">{lang.flag}</span>
                <span
                  className={`text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-md font-bold uppercase transition-colors ${
                    isSelected
                      ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      : 'bg-white/10 text-slate-300 group-hover:bg-white/15'
                  }`}
                >
                  tag {tag}
                </span>
              </div>

              {/* Native Language Name & English/Regional Name */}
              <div className="relative z-10 mb-1">
                <div
                  className={`font-black text-base sm:text-lg transition-colors tracking-tight ${
                    isSelected
                      ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'text-white group-hover:text-amber-200'
                  }`}
                >
                  {lang.nativeName}
                </div>
                <div className="text-xs text-slate-400 font-medium tracking-wide">
                  {lang.name}
                </div>
              </div>

              {/* Neural Voice Specification */}
              <div className="relative z-10 flex items-center gap-1.5 mt-2.5 pt-2 border-t border-white/10 text-[10px] sm:text-[11px] font-mono text-cyan-300/80 truncate">
                <Volume2 className={`w-3 h-3 shrink-0 ${isSelected ? 'text-amber-400' : 'text-cyan-400'}`} />
                <span className="truncate">{cleanVoice}</span>
              </div>

              {/* Selected Golden Star Accent */}
              {isSelected && (
                <div className="absolute top-2 right-14 text-amber-400 animate-pulse">
                  <Sparkles className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant (used in chamber view)
  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs text-slate-200 backdrop-blur-xl">
        <Globe className="w-3.5 h-3.5" style={{ color: primaryColor }} />
        <select
          value={currentLanguage}
          onChange={(e) => onLanguageSelect(e.target.value)}
          aria-label="Select Language"
          className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id} className="bg-slate-900 text-white">
              {lang.flag} {lang.nativeName} ({lang.name}) • {lang.voiceName.split('-')[2] || lang.voiceName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
