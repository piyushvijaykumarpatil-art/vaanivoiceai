import React from 'react';
import { CreatorBadge } from './CreatorBadge';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LanguageSelector } from './LanguageSelector';
import { LiveHudClock } from './LiveHudClock';
import type { LuxuryThemeId } from '../types';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Volume2, Settings } from 'lucide-react';

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
    <div className="min-h-screen relative flex flex-col justify-between p-4 md:p-8 max-w-7xl mx-auto overflow-hidden">
      {/* Top Bar */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <div>
            <h1 className="text-lg md:text-xl font-black font-cinzel tracking-wider text-white">
              VAANI <span style={{ color: primaryColor }}>• IMPERIAL EDITION</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-widest uppercase">
              The Sovereign Voice AI Experience
            </p>
          </div>
        </div>

        {/* Right side: Theme Switcher right by the side of Settings & Creator Attribution Badge */}
        <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-end">
          {/* Voice Model Studio Button */}
          {onOpenVoiceStudio && (
            <button
              onClick={onOpenVoiceStudio}
              title="Voice Models & Neural Mic Studio"
              className="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-1.5"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline text-xs font-medium">Voice Model</span>
            </button>
          )}

          {/* Theme Switcher side of Settings */}
          <div className="imperial-glass px-2.5 py-1.5 rounded-2xl border border-white/10 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold hidden md:inline">Theme:</span>
            <ThemeSwitcher
              currentTheme={currentTheme}
              onThemeSelect={onThemeSelect}
              compact
            />
          </div>

          {/* Settings Button */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              title="Settings & Cloud Database Studio"
              className="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">Settings</span>
            </button>
          )}

          {/* Creator Attribution Badge */}
          <CreatorBadge primaryColor={primaryColor} variant="compact" />
        </div>
      </header>

      {/* Main Hero Body */}
      <main className="my-auto py-8 flex flex-col items-center text-center space-y-8">
        {/* Creator Hero Tagline */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-xs font-medium text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>A Sovereign Indian Voice Companion Conceived by <strong>Piyush (1st Year Student of SGU)</strong></span>
        </div>

        {/* Hero Titles */}
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-cinzel tracking-tight text-white leading-tight">
            Royal Neural Voice. <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${primaryColor}, #FFFFFF, ${primaryColor})`
              }}
            >
              Live Voice & Type Interaction.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Experience studio-grade human neural voice synthesis across 9 Indian languages and English.
            Speak naturally via live microphone or type questions while our 3D Chrono-Orb speaks answers with cultural grace.
          </p>
        </div>

        {/* Live IST Clock & Calendar HUD */}
        <div className="w-full max-w-xl">
          <LiveHudClock primaryColor={primaryColor} />
        </div>

        {/* Multilingual Selector Cards */}
        <div className="w-full max-w-4xl space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
              Select Sovereign Language (10 Available):
            </span>
            <span className="text-xs text-amber-400 font-mono">
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

        {/* Grand Enter CTA */}
        <div className="pt-4">
          <button
            onClick={onEnterChamber}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 text-black"
            style={{
              backgroundColor: primaryColor,
              boxShadow: `0 0 30px ${primaryColor}77`
            }}
          >
            <span>Enter Sovereign Chamber</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Architecture Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full text-xs text-slate-400 pt-6">
          <div className="flex items-center gap-2 justify-center p-2 rounded-xl bg-black/30 border border-white/5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>Studio Neural Voices</span>
          </div>
          <div className="flex items-center gap-2 justify-center p-2 rounded-xl bg-black/30 border border-white/5">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>3D Gyroscopic Orb</span>
          </div>
          <div className="flex items-center gap-2 justify-center p-2 rounded-xl bg-black/30 border border-white/5">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            <span>Dual ACID & Supabase DB</span>
          </div>
          <div className="flex items-center gap-2 justify-center p-2 rounded-xl bg-black/30 border border-white/5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>365-Day Indian Calendar</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-white/10 text-center text-xs text-slate-500">
        <p>
          Vaani • Imperial Edition &copy; 2026. Conceived and Crafted with pride by <strong>Piyush</strong> (1st Year Student of SGU).
        </p>
      </footer>
    </div>
  );
};
