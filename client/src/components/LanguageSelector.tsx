import { SUPPORTED_LANGUAGES } from '../utils/constants';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageSelect: (langId: string) => void;
  primaryColor?: string;
  variant?: 'dropdown' | 'grid';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageSelect,
  primaryColor = '#F59E0B',
  variant = 'dropdown'
}) => {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isSelected = currentLanguage === lang.id;
          return (
            <button
              key={lang.id}
              onClick={() => onLanguageSelect(lang.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
                isSelected
                  ? 'border-white/40 shadow-xl scale-[1.02]'
                  : 'border-white/10 hover:border-white/25 bg-black/40 hover:bg-white/5 opacity-80 hover:opacity-100'
              }`}
              style={{
                backgroundColor: isSelected ? `${primaryColor}22` : undefined,
                borderColor: isSelected ? primaryColor : undefined,
                boxShadow: isSelected ? `0 0 16px ${primaryColor}44` : undefined
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{lang.flag}</span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                  {lang.id}
                </span>
              </div>
              <div className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                {lang.nativeName}
              </div>
              <div className="text-xs text-slate-400">
                {lang.name}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-2 truncate">
                {lang.voiceName.split('-')[2] || lang.voiceName}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-slate-200">
        <Globe className="w-3.5 h-3.5" style={{ color: primaryColor }} />
        <select
          value={currentLanguage}
          onChange={(e) => onLanguageSelect(e.target.value)}
          aria-label="Select Language"
          className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-1"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id} className="bg-slate-900 text-white">
              {lang.flag} {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
