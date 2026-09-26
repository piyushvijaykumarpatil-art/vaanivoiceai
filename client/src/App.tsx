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
import { LUXURY_THEMES, SUPPORTED_LANGUAGES } from './utils/constants';
import type { LuxuryThemeId, ChatMessage } from './types';
import { soundManager } from './audio/soundManager';
import { sendChatMessage, fetchTtsAudio } from './utils/api';
import { Database, MessageSquare, ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'chamber'>('landing');
  const [currentTheme, setCurrentTheme] = useState<LuxuryThemeId>('gold');
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>(() => `session_${Date.now()}`);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(20).fill(0));
  const [isStudioOpen, setIsStudioOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');

  const activeThemeConfig = LUXURY_THEMES.find(t => t.id === currentTheme) || LUXURY_THEMES[0];
  const activeLangConfig = SUPPORTED_LANGUAGES.find(l => l.id === currentLanguage) || SUPPORTED_LANGUAGES[2];

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

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // 1. Append user message to history
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      language: currentLanguage
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // 2. Prepare past context for Google Assistant-grade memory
      const historyContext = messages.slice(-8).map(m => ({
        role: m.role,
        content: m.content
      }));

      // 3. Request AI reasoning (with sovereign local fallback if backend offline)
      let chatResponse: any;
      try {
        chatResponse = await sendChatMessage({
          sessionId,
          message: text,
          language: currentLanguage,
          history: historyContext
        });
      } catch (chatErr: any) {
        console.warn('Backend API unreachable, using sovereign offline reasoning:', chatErr);
        const q = text.toLowerCase();
        let reply = 'Greetings sovereign user. I am Vaani, engineered by Piyush at NIAT Pune. Your query has been received in high royal fidelity.';
        if (q.includes('piyush') || q.includes('who made') || q.includes('creator') || q.includes('maker') || q.includes('who are you')) {
          if (currentLanguage === 'hi') {
            reply = 'नमस्ते! मुझे पीयूष ने बनाया है, जो NIAT पुणे में प्रथम वर्ष के प्रतिभाशाली छात्र हैं। मैं आपकी वाणी आवाज़ साथी हूँ।';
          } else if (currentLanguage === 'mr') {
            reply = 'नमस्कार! मला पियूष यांनी बनवले आहे, जे NIAT पुणे येथील प्रथम वर्षाचे विद्यार्थी आहेत. मी तुमची वाणी आहे.';
          } else {
            reply = 'I was proudly created by Piyush, a brilliant 1st year engineering student at NIAT Pune. I am Vaani, your sovereign voice AI companion.';
          }
        } else if (currentLanguage === 'hi') {
          reply = 'वाणी आपकी सेवा में प्रस्तुत है। पीयूष द्वारा निर्मित यह सार्वभौम आवाज अनुभव आपके प्रश्नों का स्वागत करता है।';
        } else if (currentLanguage === 'mr') {
          reply = 'वाणी आपल्या सेवेसाठी तत्पर आहे. पियूष यांनी तयार केलेली ही शाही व्हॉईस प्रणाली आपले स्वागत करते.';
        }
        chatResponse = { reply, cleanSpokenText: reply, detectedLanguage: currentLanguage };
      }

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: chatResponse.reply,
        timestamp: new Date().toISOString(),
        language: chatResponse.detectedLanguage || currentLanguage
      };
      setMessages(prev => [...prev, assistantMsg]);
      setLastSpokenText(chatResponse.reply);

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
        console.warn('Backend TTS endpoint unreachable, vocalizing directly via SpeechSynthesis:', ttsErr);
      }

      // 5. Play audio through Web Audio API and Speech Synthesis
      setIsLoading(false);
      if (audioBuffer && audioBuffer.byteLength > 0) {
        await soundManager.playAudioStream(audioBuffer, cleanText, targetLang);
      } else {
        await soundManager.speakText(cleanText, targetLang);
      }
    } catch (err: any) {
      console.error('Dialogue error:', err);
      setIsLoading(false);
      const fallbackText = "I am Vaani, your sovereign voice assistant created by Piyush at NIAT Pune. How may I serve you today?";
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
      await soundManager.speakText(fallbackText, currentLanguage);
    }
  };

  const handleStopAudio = () => {
    soundManager.stopAudio();
    setIsSpeaking(false);
  };

  const handleReplayAudio = async (text: string, lang?: string) => {
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
      <div className="relative min-h-screen">
        <LandingHero
          currentTheme={currentTheme}
          onThemeSelect={setCurrentTheme}
          currentLanguage={currentLanguage}
          onLanguageSelect={setCurrentLanguage}
          onEnterChamber={() => setCurrentView('chamber')}
          primaryColor={activeThemeConfig.primaryColor}
        />
      </div>
    );
  }

  // Sovereign Chamber View
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Dynamic Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700 opacity-25"
        style={{
          background: `radial-gradient(circle at 50% 40%, ${activeThemeConfig.primaryColor} 0%, transparent 65%)`
        }}
      />

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
                VAANI <span style={{ color: activeThemeConfig.primaryColor }}>• IMPERIAL</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest hidden sm:block">
                The Sovereign Voice AI Experience
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
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageSelect={setCurrentLanguage}
            primaryColor={activeThemeConfig.primaryColor}
            variant="dropdown"
          />

          {/* Theme Switcher Compact */}
          <ThemeSwitcher
            currentTheme={currentTheme}
            onThemeSelect={setCurrentTheme}
            compact
          />

          {/* Database Studio Toggle */}
          <button
            onClick={() => setIsStudioOpen(true)}
            title="Open Database Studio"
            className="p-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all duration-200"
          >
            <Database className="w-4 h-4" />
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

      {/* Bottom Luxury Dock: Pure Type-to-Voice Input */}
      <footer className="relative z-20 w-full">
        <LuxuryDockInput
          onSendMessage={handleSendMessage}
          onStopAudio={handleStopAudio}
          isSpeaking={isSpeaking}
          isLoading={isLoading}
          currentLanguage={currentLanguage}
          primaryColor={activeThemeConfig.primaryColor}
        />
      </footer>

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
