import React, { useState, type KeyboardEvent } from 'react';
import { Send, Square, Sparkles, Volume2, Loader2, Sliders } from 'lucide-react';
import { DEFAULT_SUGGESTIONS, VOICE_MODELS } from '../utils/constants';
import { VoiceMicButton } from './VoiceMicButton';
import { soundManager } from '../audio/soundManager';

interface LuxuryDockInputProps {
  onSendMessage: (text: string) => void;
  onStopAudio: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  currentLanguage: string;
  onLanguageChange?: (langId: string) => void;
  onOpenVoiceStudio?: () => void;
  primaryColor?: string;
}

export const LuxuryDockInput: React.FC<LuxuryDockInputProps> = ({
  onSendMessage,
  onStopAudio,
  isSpeaking,
  isLoading,
  currentLanguage,
  onLanguageChange,
  onOpenVoiceStudio,
  primaryColor = '#F59E0B'
}) => {
  const [inputText, setInputText] = useState('');
  const [isMicListening, setIsMicListening] = useState(false);

  const voiceSettings = soundManager.getVoiceSettings();
  const activeVoiceModel = VOICE_MODELS.find(m => m.id === voiceSettings.modelId) || VOICE_MODELS[0];

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Called continuously as user speaks into VoiceMicButton
  const handleTranscriptUpdate = (transcript: string) => {
    if (transcript) {
      setInputText(transcript);
    }
  };

  // Called when speech recognition finishes (user paused or clicked stop)
  const handleSpeechEnd = (finalTranscript: string) => {
    if (finalTranscript.trim() && voiceSettings.handsFreeAutoSend && !isLoading) {
      onSendMessage(finalTranscript.trim());
      setInputText('');
    }
  };

  const handleListeningChange = (listening: boolean) => {
    setIsMicListening(listening);
    if (listening && isSpeaking) {
      onStopAudio();
    }
  };

  const suggestions = DEFAULT_SUGGESTIONS[currentLanguage] || DEFAULT_SUGGESTIONS['en'];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Multilingual Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold shrink-0 pl-1">
          <Sparkles className="w-3 h-3" style={{ color: primaryColor }} />
          <span>Inquire:</span>
        </div>
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(suggestion)}
            disabled={isLoading}
            className="shrink-0 text-xs px-3.5 py-1.5 rounded-full bg-black/50 border border-white/10 hover:border-white/25 text-slate-300 hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Main Luxury Glass Dock */}
      <div
        className={`imperial-glass rounded-2xl p-2.5 flex items-center gap-2.5 transition-all duration-300 shadow-2xl relative ${
          isMicListening ? 'ring-2 ring-amber-400/60 shadow-amber-400/20' : ''
        }`}
        style={{ borderColor: isMicListening ? primaryColor : `${primaryColor}44` }}
      >
        {/* Voice Model Selector Badge (Direct access to Voice Studio) */}
        {onOpenVoiceStudio && (
          <button
            type="button"
            onClick={onOpenVoiceStudio}
            title={`Active Voice Model: ${activeVoiceModel.name}. Click to customize voice timbre, pitch, rate & mic.`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 transition-all hover:scale-105 active:scale-95 text-xs text-slate-200 group"
          >
            <span>{activeVoiceModel.avatar}</span>
            <span className="font-semibold text-[11px] hidden lg:inline text-amber-300">
              {activeVoiceModel.name}
            </span>
            <Sliders className="w-3 h-3 text-slate-400 group-hover:text-amber-300 transition-colors ml-0.5" />
          </button>
        )}

        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 pl-1">
          {isLoading ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden md:inline font-mono">Synthesizing...</span>
            </div>
          ) : isMicListening ? (
            <div className="flex items-center gap-2 text-xs font-semibold font-mono" style={{ color: primaryColor }}>
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: primaryColor }}
                />
                <span
                  className="relative inline-flex rounded-full h-2.5 w-2.5"
                  style={{ backgroundColor: primaryColor }}
                />
              </span>
              <span className="hidden md:inline">Listening ({currentLanguage.toUpperCase()})...</span>
            </div>
          ) : isSpeaking ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span className="hidden md:inline font-mono">Speaking</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500/80" />
              <span className="hidden md:inline font-mono">Voice AI</span>
            </div>
          )}
        </div>

        {/* Input Field: Displays live speech transcript and allows keyboard editing */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading
              ? "Synthesizing sovereign neural response..."
              : isMicListening
              ? "🎙️ Listening to your voice... Speak now (auto-sends on pause)!"
              : isSpeaking
              ? "Speaking royal response... Speak or type next question"
              : `Speak via Mic (${currentLanguage.toUpperCase()}) or type question here...`
          }
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-sm md:text-base text-white placeholder-slate-400 focus:outline-none min-w-0"
        />

        {/* Quick Language Toggle (MR / HI / EN) */}
        {onLanguageChange && (
          <div className="hidden sm:flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5 text-[11px] font-mono">
            {['mr', 'hi', 'en'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                className={`px-2 py-1 rounded-lg transition-all font-semibold ${
                  currentLanguage === lang
                    ? 'text-black shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{
                  backgroundColor: currentLanguage === lang ? primaryColor : 'transparent'
                }}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Action Controls: Stop Audio, VoiceMicButton, and Send Button */}
        <div className="flex items-center gap-2 pr-1 shrink-0">
          {isSpeaking && (
            <button
              type="button"
              onClick={onStopAudio}
              title="Interrupt and Stop Audio Playback"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold transition-all duration-200 animate-pulse hover:scale-105"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Stop Audio</span>
            </button>
          )}

          {/* 🎙️ Live Voice Microphone (Speech-to-Text) Button */}
          <VoiceMicButton
            currentLanguage={currentLanguage}
            onTranscriptUpdate={handleTranscriptUpdate}
            onListeningChange={handleListeningChange}
            onSpeechEnd={handleSpeechEnd}
            primaryColor={primaryColor}
            disabled={isLoading}
            autoSendDelayMs={voiceSettings.handsFreeAutoSend ? 1300 : 0}
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            title="Send query"
            className={`flex items-center justify-center p-2.5 rounded-xl transition-all duration-300 font-semibold shadow-lg ${
              !inputText.trim() || isLoading
                ? 'opacity-40 cursor-not-allowed bg-white/10 text-slate-400'
                : 'hover:scale-105 active:scale-95 text-black'
            }`}
            style={{
              backgroundColor: inputText.trim() && !isLoading ? primaryColor : undefined,
              boxShadow: inputText.trim() && !isLoading ? `0 0 15px ${primaryColor}66` : undefined
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
