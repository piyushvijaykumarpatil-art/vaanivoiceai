import React from 'react';
import { CreatorBadge } from './CreatorBadge';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSelector } from './LanguageSelector';
import { LiveHudClock } from './LiveHudClock';
import type { LuxuryThemeId } from '../types';
import { Sparkles, Settings, Volume2, Database, Calendar } from 'lucide-react';

interface LandingHeroProps {
  currentTheme: LuxuryThemeId;
  onThemeSelect: (themeId: LuxuryThemeId) => void;
  currentLanguage: string;
  onLanguageSelect: (langId: string) => void;
  onEnterChamber: () => void;
  onOpenSettings?: () => void;
  onOpenVoiceStudio?: () => void;
  primaryColor?: string;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  currentTheme,
  onThemeSelect,
  currentLanguage,
  onLanguageSelect,
  onEnterChamber,
  onOpenSettings,
  onOpenVoiceStudio,
  primaryColor = '#F59E0B'
}) => {
  return (
    <div className="min-h-screen relative flex flex-col justify-between p-4 md:p-8 max-w-7xl mx-auto z-10">
      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-b border-white/10">
        {/* Left: Crown Icon & Brand Title */}
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow">👑</span>
          <div>
            <h1 className="text-lg md:text-xl font-black font-cinzel tracking-wider text-white flex items-center gap-1.5">
              VAANI <span style={{ color: primaryColor }}>• IMPERIAL EDITION</span>
            </h1>
            <p className="text-[10px] md:text-[11px] text-slate-400 font-bold tracking-widest uppercase">
              THE SOVERGION VOIGE AI EXPERIENCE
            </p>
          </div>
        </div>

        {/* Right side: Theme selector pills (with crown theme active), Settings gear & Creator badge */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
          {/* Theme Selector Pills */}
          <div className="imperial-glass px-2.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold hidden md:inline">Theme:</span>
            <ThemeSwitcher
              currentTheme={currentTheme}
              onThemeSelect={onThemeSelect}
              compact
            />
          </div>

          {/* Settings Gear Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Settings & Cloud Database Studio"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-black/50 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-1.5 backdrop-blur-md"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Settings</span>
            </button>
          )}

          {/* Top-right Pill Badge: Made by Piyush • 1st Year Student of SGU */}
          <CreatorBadge primaryColor={primaryColor} variant="compact" />
        </div>
      </header>

      {/* Main Hero Body */}
      <main className="my-auto py-6 sm:py-8 flex flex-col items-center text-center space-y-6 sm:space-y-8">
        {/* Centered Security / Attribution Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-amber-400/30 bg-black/60 backdrop-blur-xl text-xs sm:text-sm font-medium text-slate-200 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>✨ A Sovereign Indian Voice Companion Conceived by <strong>Piyush (1st Year Student of SGU)</strong></span>
        </div>

        {/* Hero Typography */}
        <div className="space-y-3.5 max-w-4xl">
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-cinzel tracking-tight leading-tight">
            <span className="block font-bold text-white tracking-wider drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              ROYAL NEURAL VOICE.
            </span>
            <span
              className="block font-extrabold bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(245,158,11,0.4)]"
              style={{
                backgroundImage: 'linear-gradient(to right, #FDE68A 0%, #F59E0B 50%, #D97706 100%)'
              }}
            >
              LIVE VOICE & TYPE INTERACTION.
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Experience studio-grade human neural voice synthesis (1st 1st Student of SGU)
          </p>
        </div>

        {/* Multilingual Selector Cards (10 Available) */}
        <div className="w-full max-w-5xl space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Select Sovereign Language (10 Available):
            </span>
            <span className="text-xs text-amber-400 font-mono font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Studio Neural Engine Ready
            </span>
          </div>
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageSelect={onLanguageSelect}
            primaryColor={primaryColor}
            variant="grid"
          />
        </div>

        {/* Widgets & CTA Area */}
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
          {/* Bottom-Left: Live IST Clock & Calendar Widget */}
          <div className="w-full max-w-sm mx-auto md:mx-0">
            <LiveHudClock primaryColor={primaryColor} />
          </div>

          {/* Center: Large Glowing Golden CTA Button */}
          <div className="flex justify-center order-first md:order-none">
            <button
              onClick={onEnterChamber}
              className="group relative inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-4 sm:py-4.5 rounded-2xl font-black text-base sm:text-lg transition-all duration-300 text-black bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 hover:from-amber-200 hover:via-yellow-300 hover:to-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:shadow-[0_0_55px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95 border border-yellow-200/50"
            >
              <span className="tracking-wide">Enter Sovereign Chamber ➔</span>
            </button>
          </div>

          {/* Right Column: High-Tech Neural Engine Status */}
          <div className="hidden md:flex justify-end">
            <div className="px-4 py-3 rounded-2xl bg-[#060b16]/75 border border-white/10 backdrop-blur-xl text-left text-xs space-y-1 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>NEURAL ENGINE ACTIVE</span>
              </div>
              <p className="text-[11px] text-slate-400">
                10 Indian languages and English primed for real-time vocal synthesis.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Toolbar: Three Lower Glass Pill Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl w-full pt-4">
          <button
            onClick={onOpenVoiceStudio}
            className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-emerald-400/50 backdrop-blur-xl text-xs font-bold text-slate-300 hover:text-white transition-all duration-300 shadow-lg group hover:scale-105"
          >
            <Volume2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="tracking-wide uppercase">STUDIO NEURAL VOICES</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-400/50 backdrop-blur-xl text-xs font-bold text-slate-300 hover:text-white transition-all duration-300 shadow-lg group hover:scale-105"
          >
            <Database className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span className="tracking-wide uppercase">COSMIC ACID & SUPABASE ENGNE</span>
          </button>

          <div
            className="flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/50 backdrop-blur-xl text-xs font-bold text-slate-300 hover:text-white transition-all duration-300 shadow-lg group hover:scale-105 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="tracking-wide uppercase">365-DAY INDIAN CALENDAR</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-white/10 text-center text-xs text-slate-400">
        <p>
          VAANI • IMPERIAL EDITION &copy; 2026. Made with pride by <strong>Piyush (1st Year Student of SGU)</strong>.
        </p>
      </footer>
    </div>
  );
};
