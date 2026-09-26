import { LUXURY_THEMES } from '../utils/constants';
import type { LuxuryThemeId } from '../types';
import { Sparkles } from 'lucide-react';

interface ThemeSwitcherProps {
  currentTheme: LuxuryThemeId;
  onThemeSelect: (themeId: LuxuryThemeId) => void;
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme,
  onThemeSelect,
  compact = false
}) => {
  return (
    <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2 flex-wrap justify-center'}`}>
      {!compact && (
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-slate-400 font-semibold mr-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Sovereign Themes:</span>
        </div>
      )}
      {LUXURY_THEMES.map((theme) => {
        const isSelected = currentTheme === theme.id;
        return (
          <button
            key={theme.id}
            onClick={() => onThemeSelect(theme.id)}
            title={`${theme.name} — ${theme.subtitle}`}
            className={`group relative flex items-center gap-1.5 transition-all duration-300 rounded-xl ${
              compact
                ? 'p-1.5 border'
                : 'px-3 py-1.5 border text-xs font-medium'
            } ${
              isSelected
                ? 'border-white/40 shadow-lg scale-105'
                : 'border-white/10 hover:border-white/20 bg-black/40 hover:bg-white/5 opacity-80 hover:opacity-100'
            }`}
            style={{
              backgroundColor: isSelected ? `${theme.primaryColor}22` : undefined,
              borderColor: isSelected ? theme.primaryColor : undefined,
              boxShadow: isSelected ? `0 0 14px ${theme.primaryColor}55` : undefined
            }}
          >
            <span className="text-sm">{theme.icon}</span>
            {!compact && (
              <span className="text-slate-200 group-hover:text-white transition-colors">
                {theme.name}
              </span>
            )}
            <span
              className="w-2 h-2 rounded-full ml-0.5"
              style={{ backgroundColor: theme.primaryColor }}
            />
          </button>
        );
      })}
    </div>
  );
};
