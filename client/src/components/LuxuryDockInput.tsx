import React, { useState, type KeyboardEvent } from 'react';
import { Send, Square, Sparkles, Volume2, Loader2 } from 'lucide-react';
import { DEFAULT_SUGGESTIONS } from '../utils/constants';

interface LuxuryDockInputProps {
  onSendMessage: (text: string) => void;
  onStopAudio: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
  currentLanguage: string;
  primaryColor?: string;
}

export const LuxuryDockInput: React.FC<LuxuryDockInputProps> = ({
  onSendMessage,
  onStopAudio,
  isSpeaking,
  isLoading,
  currentLanguage,
  primaryColor = '#F59E0B'
}) => {
  const [inputText, setInputText] = useState('');

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

  const suggestions = DEFAULT_SUGGESTIONS[currentLanguage] || DEFAULT_SUGGESTIONS['en'];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Multilingual Suggestion Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold shrink-0 pl-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
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
        className="imperial-glass rounded-2xl p-2.5 flex items-center gap-3 transition-all duration-300 shadow-2xl relative"
        style={{ borderColor: `${primaryColor}44` }}
      >
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2">
          {isLoading ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-300">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden md:inline font-mono">Synthesizing...</span>
            </div>
          ) : isSpeaking ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Volume2 className="w-4 h-4 animate-bounce" />
              <span className="hidden md:inline font-mono">Speaking</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="hidden md:inline font-mono">Type-to-Voice</span>
            </div>
          )}
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading
              ? "Synthesizing neural voice output..."
              : isSpeaking
              ? "Speaking royal response... You can type next query or stop audio"
              : "Type your query here (AI will speak out loud)..."
          }
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-sm md:text-base text-white placeholder-slate-400 focus:outline-none"
        />

        {/* Action Buttons: Stop Audio & Send */}
        <div className="flex items-center gap-2 pr-1">
          {isSpeaking && (
            <button
              onClick={onStopAudio}
              title="Interrupt and Stop Audio Playback"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold transition-all duration-200 animate-pulse hover:scale-105"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Stop Audio</span>
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
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
