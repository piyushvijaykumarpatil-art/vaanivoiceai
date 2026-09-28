import React, { useState, useEffect } from 'react';
import { LandingHero } from './components/LandingHero';
import { ChronoOrb3D } from './components/ChronoOrb3D';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { LuxuryDockInput } from './components/LuxuryDockInput';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { LanguageSelector } from './components/LanguageSelector';
import { LiveHudClock } from './components/LiveHudClock';
import { CreatorBadge } from './components/CreatorBadge';
import { DatabaseStudioModal } from './components/DatabaseStudioModal';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { VoiceModelModal } from './components/VoiceModelModal';
import { LUXURY_THEMES, SUPPORTED_LANGUAGES } from './utils/constants';
import type { LuxuryThemeId, ChatMessage } from './types';
import { soundManager } from './audio/soundManager';
import { sendChatMessage, fetchTtsAudio } from './utils/api';
import { SovereignAiEngine } from './services/sovereignAi';
import { MessageSquare, ArrowLeft, Settings, Volume2 } from 'lucide-react';
import { CelestialNebulaBackground } from './components/CelestialNebulaBackground';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'chamber'>('landing');
  const [currentTheme, setCurrentTheme] = useState<LuxuryThemeId>('gold');
  const [currentLanguage, setCurrentLanguage] = useState<string>('mr');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => `session_${Date.now()}`);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(20).fill(0));
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isContinuousLiveMode, setIsContinuousLiveMode] = useState<boolean>(false);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');
  const [pendingAutoMic, setPendingAutoMic] = useState<boolean>(false);

  const activeThemeConfig = LUXURY_THEMES.find(t => t.id === currentTheme) || LUXURY_THEMES[0];
  const activeLangConfig = SUPPORTED_LANGUAGES.find(l => l.id === currentLanguage) || SUPPORTED_LANGUAGES[0];

  // Sync theme to root element data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Hook up soundManager state changes
  useEffect(() => {
    soundManager.onStateChange((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // Real-time animation loop to poll frequency data when audio is active
  useEffect(() => {
    let animId: number;
    const pollFrequencies = () => {
      if (soundManager.getIsPlaying()) {
        const data = soundManager.getFrequencyData();
        setFrequencyData(data);
      } else {
        setFrequencyData(new Uint8Array(20).fill(0));
      }
      animId = requestAnimationFrame(pollFrequencies);
    };

    animId = requestAnimationFrame(pollFrequencies);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSendMessage = async (text: string, image?: string) => {
    if ((!text.trim() && !image) || isLoading) return;

    // Immediately awaken Web Audio & SpeechSynthesis on direct user interaction
    soundManager.init();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }

    const promptText = text.trim() || (image ? 'Please analyze this uploaded image and provide a step-by-step solution or explanation.' : '');

    // 1. Append user message to history
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: promptText,
      image,
      timestamp: new Date().toISOString(),
      language: currentLanguage
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    if (image) {
      setIsDrawerOpen(true);
    }

    try {
      // 2. Prepare past context for Google Assistant-grade memory
      const historyContext = messages.slice(-8).map(m => ({
        role: m.role,
        content: m.content
      }));

      // 3. Request AI reasoning (Backend API -> Direct Gemini Key -> Sovereign Offline NLP Engine)
      let chatResponse: any = null;

      try {
        chatResponse = await sendChatMessage({
          sessionId,
          message: promptText,
          image,
          language: currentLanguage,
          history: historyContext
        });
      } catch (backendErr) {
        console.warn('Backend server unreachable, activating sovereign client intelligence engine:', backendErr);

        // Check if user saved direct Gemini API key in settings
        const directGeminiKey = localStorage.getItem('vaani_gemini_api_key');
        if (directGeminiKey) {
          const directGeminiReply = await SovereignAiEngine.queryGeminiDirect(
            directGeminiKey,
            promptText,
            currentLanguage,
            historyContext,
            image
          );
          if (directGeminiReply) {
            chatResponse = directGeminiReply;
          }
        }

        // Autonomous Sovereign Engine fallback
        if (!chatResponse) {
          chatResponse = SovereignAiEngine.generateAutonomousReply(
            promptText,
            currentLanguage,
            historyContext
          );
        }
      }

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: chatResponse.reply,
        timestamp: new Date().toISOString(),
        language: chatResponse.detectedLanguage || currentLanguage
      };
      setMessages(prev => [...prev, assistantMsg]);
      setLastSpokenText(chatResponse.cleanSpokenText || chatResponse.reply);

      // 4. Request studio-grade neural voice synthesis
      const cleanText = chatResponse.cleanSpokenText || chatResponse.reply;
      const targetLang = chatResponse.detectedLanguage || currentLanguage;

      let audioBuffer: ArrayBuffer | null = null;
      try {
        audioBuffer = await fetchTtsAudio({
          text: cleanText,
          language: targetLang
        });
      } catch (ttsErr) {
        // Expected when deployed statically without node backend
      }

      // 5. Play audio through Web Audio API or Speech Synthesis with selected Voice Model
      setIsLoading(false);
      if (audioBuffer && audioBuffer.byteLength > 0) {
        await soundManager.playAudioStream(audioBuffer, cleanText, targetLang);
      } else {
        await soundManager.speakText(cleanText, targetLang);
      }
    } catch (err: any) {
      console.error('Dialogue error:', err);
      setIsLoading(false);
      const fallback = SovereignAiEngine.generateAutonomousReply(promptText, currentLanguage, messages);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: fallback.reply,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
      await soundManager.speakText(fallback.cleanSpokenText, currentLanguage);
    }
  };

  const handleStopAudio = () => {
    soundManager.stopAudio();
    setIsSpeaking(false);
  };

  const handleReplayAudio = async (text: string, lang?: string) => {
    soundManager.init();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {
        // ignore
      }
    }

    try {
      setIsLoading(true);
      const targetLang = lang || currentLanguage;
      let audioBuffer: ArrayBuffer | null = null;
      try {
        audioBuffer = await fetchTtsAudio({
          text,
          language: targetLang
        });
      } catch {
        // ignore
      }
      setIsLoading(false);
      if (audioBuffer && audioBuffer.byteLength > 0) {
        await soundManager.playAudioStream(audioBuffer, text, targetLang);
      } else {
        await soundManager.speakText(text, targetLang);
      }
    } catch (err) {
      console.error('Replay failed:', err);
      setIsLoading(false);
      await soundManager.speakText(text, lang || currentLanguage);
    }
  };

  const handleClearSession = () => {
    handleStopAudio();
    setMessages([]);
    setSessionId(`session_${Date.now()}`);
  };

  // If in Landing Portal view
  if (currentView === 'landing') {
    return (
      <div className="relative min-h-screen bg-[#02040A] text-slate-100 flex flex-col justify-between">
        {/* Deep Space Void with Teal-and-Purple Nebula & High-Tech Circuit/Node Grid */}
        <CelestialNebulaBackground primaryColor={activeThemeConfig.primaryColor} />

        <LandingHero
          currentTheme={currentTheme}
          onThemeSelect={setCurrentTheme}
          currentLanguage={currentLanguage}
          onLanguageSelect={setCurrentLanguage}
          onEnterChamber={(startMic) => {
            if (startMic) {
              setPendingAutoMic(true);
            }
            setCurrentView('chamber');
          }}
          onOpenSettings={() => setIsStudioOpen(true)}
          onOpenVoiceStudio={() => setIsVoiceModalOpen(true)}
          primaryColor={activeThemeConfig.primaryColor}
        />

        {/* Live Luxury Voice & Microphone Dock directly accessible on landing screen */}
        <div className="relative z-20 w-full pb-4">
          <LuxuryDockInput
            onSendMessage={async (text, image) => {
              setCurrentView('chamber');
              if (image) setIsDrawerOpen(true);
              await handleSendMessage(text, image);
            }}
            onStopAudio={handleStopAudio}
            isSpeaking={isSpeaking}
            isLoading={isLoading}
            currentLanguage={currentLanguage}
            onLanguageChange={setCurrentLanguage}
            onOpenVoiceStudio={() => setIsVoiceModalOpen(true)}
            primaryColor={activeThemeConfig.primaryColor}
            isContinuousLiveMode={isContinuousLiveMode}
            onToggleContinuousLiveMode={() => setIsContinuousLiveMode(prev => !prev)}
            autoStartMic={pendingAutoMic}
            onMicStarted={() => setPendingAutoMic(false)}
          />
        </div>

        {/* Voice Studio Modal */}
        <VoiceModelModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          currentLanguage={currentLanguage}
          primaryColor={activeThemeConfig.primaryColor}
        />

        {/* Database Studio Modal */}
        <DatabaseStudioModal
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          primaryColor={activeThemeConfig.primaryColor}
        />
      </div>
    );
  }

  // Sovereign Chamber View
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[#02040A] text-slate-100">
      {/* Deep Space Void with Teal-and-Purple Nebula & High-Tech Circuit/Node Grid */}
      <CelestialNebulaBackground primaryColor={activeThemeConfig.primaryColor} />

      {/* Top Sovereign Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-4 md:px-8 py-3.5 border-b border-white/10 imperial-glass">
        {/* Left: Brand & Return to Portal */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleStopAudio();
              setCurrentView('landing');
            }}
            title="Return to Imperial Portal"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <div>
              <h1 className="text-sm md:text-base font-black font-cinzel text-white tracking-wider flex items-center gap-1.5">
                VAANI <span style={{ color: activeThemeConfig.primaryColor }}>• IMPERIAL EDITION</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:block font-medium">
                THE SOVERGION VOIGE AI EXPERIENCE
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live IST Clock & Creator Badge */}
        <div className="hidden lg:flex items-center gap-4">
          <LiveHudClock primaryColor={activeThemeConfig.primaryColor} compact />
          <CreatorBadge primaryColor={activeThemeConfig.primaryColor} variant="compact" />
        </div>

        {/* Right: Controls & Modals */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Voice Model Studio Toggle */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            title="Voice Models & Mic Settings"
            className="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-1.5"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline text-xs font-medium">Voice Model</span>
          </button>

          {/* Language Selector */}
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageSelect={setCurrentLanguage}
            primaryColor={activeThemeConfig.primaryColor}
            variant="dropdown"
          />

          {/* Theme Switcher directly by the side of Settings */}
          <div className="imperial-glass px-2.5 py-1 rounded-2xl border border-white/10 flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold hidden xl:inline">Theme:</span>
            <ThemeSwitcher
              currentTheme={currentTheme}
              onThemeSelect={setCurrentTheme}
              compact
            />
          </div>

          {/* Settings & Database Studio Toggle */}
          <button
            onClick={() => setIsStudioOpen(true)}
            title="Settings & Cloud Database"
            className="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-200 flex items-center gap-1.5"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Settings</span>
          </button>

          {/* Transcript Drawer Toggle */}
          <button
            onClick={() => setIsDrawerOpen(prev => !prev)}
            title="Toggle Dialogue Transcript"
            className="relative p-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-200"
          >
            <MessageSquare className="w-4 h-4" />
            {messages.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-black"
                style={{ backgroundColor: activeThemeConfig.primaryColor }}
              >
                {messages.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Center Stage: 3D Royal Chrono-Orb & Audio Visualizer */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
        {/* Creator Attribution Subtitle in Chamber */}
        <div className="mb-2">
          <CreatorBadge primaryColor={activeThemeConfig.primaryColor} variant="compact" />
        </div>

        {/* 3D Gyroscopic Royal Chrono-Orb Canvas */}
        <div className="relative flex items-center justify-center my-2">
          <ChronoOrb3D
            isSpeaking={isSpeaking}
            frequencyData={frequencyData}
            primaryColor={activeThemeConfig.primaryColor}
            themeId={currentTheme}
          />
        </div>

        {/* 20-Bar Waveform Audio Visualizer */}
        <div className="w-full max-w-md my-2">
          <WaveformVisualizer
            frequencyData={frequencyData}
            isSpeaking={isSpeaking}
            primaryColor={activeThemeConfig.primaryColor}
          />
        </div>

        {/* Last Spoken Response Caption Subtitle */}
        {lastSpokenText && (
          <div className="mt-3 max-w-xl text-center px-4 py-2 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md text-xs sm:text-sm text-slate-200 animate-fadeIn">
            <span className="text-[10px] uppercase font-mono text-amber-400 block mb-0.5">
              👑 Spoken Response ({activeLangConfig.nativeName}):
            </span>
            <p className="line-clamp-2 italic text-slate-100">"{lastSpokenText}"</p>
          </div>
        )}
      </main>

      {/* Bottom Luxury Dock: Live Voice Mic & Type-to-Voice Input */}
      <footer className="relative z-20 w-full">
        <LuxuryDockInput
          onSendMessage={handleSendMessage}
          onStopAudio={handleStopAudio}
          isSpeaking={isSpeaking}
          isLoading={isLoading}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          onOpenVoiceStudio={() => setIsVoiceModalOpen(true)}
          primaryColor={activeThemeConfig.primaryColor}
          isContinuousLiveMode={isContinuousLiveMode}
          onToggleContinuousLiveMode={() => setIsContinuousLiveMode(prev => !prev)}
          autoStartMic={pendingAutoMic}
          onMicStarted={() => setPendingAutoMic(false)}
        />
      </footer>

      {/* Voice Model & Neural Audio Studio Modal */}
      <VoiceModelModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        currentLanguage={currentLanguage}
        primaryColor={activeThemeConfig.primaryColor}
      />

      {/* Database Studio Modal */}
      <DatabaseStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        primaryColor={activeThemeConfig.primaryColor}
      />

      {/* Transcript Drawer */}
      <TranscriptDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        messages={messages}
        onReplayAudio={handleReplayAudio}
        onClearSession={handleClearSession}
        primaryColor={activeThemeConfig.primaryColor}
      />
    </div>
  );
};

export default App;
