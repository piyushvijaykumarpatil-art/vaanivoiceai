import React, { useState, useEffect, useRef } from 'react';
import { Mic, AlertCircle } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

export interface VoiceMicButtonProps {
  currentLanguage: string;
  onTranscriptUpdate: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onSpeechEnd?: (finalTranscript: string) => void;
  primaryColor?: string;
  disabled?: boolean;
  className?: string;
  autoSendDelayMs?: number; // e.g. 1300ms for hands-free auto-send
}

const SPEECH_LANG_MAP: Record<string, string> = {
  mr: 'mr-IN',
  hi: 'hi-IN',
  en: 'en-US',
  te: 'te-IN',
  kn: 'kn-IN',
  pa: 'pa-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  gu: 'gu-IN'
};

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  currentLanguage,
  onTranscriptUpdate,
  onListeningChange,
  onSpeechEnd,
  primaryColor = '#F59E0B',
  disabled = false,
  className = '',
  autoSendDelayMs = 1300
}) => {
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const activeTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);

  // Clear silence timer
  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const stopRecognition = () => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    onListeningChange?.(false);
    soundManager.playMicStopChime();
    const final = activeTranscriptRef.current.trim();
    if (final) {
      onSpeechEnd?.(final);
    }
  };

  const toggleListening = () => {
    if (disabled) return;

    if (isListening) {
      stopRecognition();
      return;
    }

    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      const msg = 'Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge for live microphone speech input.';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 6000);
      return;
    }

    try {
      soundManager.stopAudio(); // stop any playing TTS
      soundManager.playMicStartChime();

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = SPEECH_LANG_MAP[currentLanguage] || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        onListeningChange?.(true);
        activeTranscriptRef.current = '';
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentSpoken = (final || interim).trim();
        if (currentSpoken) {
          activeTranscriptRef.current = currentSpoken;
          onTranscriptUpdate(currentSpoken);

          // Reset silence timer for hands-free auto-send
          if (autoSendDelayMs > 0) {
            clearSilenceTimer();
            silenceTimerRef.current = setTimeout(() => {
              if (activeTranscriptRef.current.trim()) {
                stopRecognition();
              }
            }, autoSendDelayMs);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        clearSilenceTimer();
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please click the lock icon in your browser URL bar and allow microphone permissions.');
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Microphone notice: ${event.error}`);
        }
        setIsListening(false);
        onListeningChange?.(false);
        setTimeout(() => setErrorMessage(null), 6000);
      };

      recognition.onend = () => {
        clearSilenceTimer();
        setIsListening(false);
        onListeningChange?.(false);
        const final = activeTranscriptRef.current.trim();
        if (final) {
          onSpeechEnd?.(final);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      clearSilenceTimer();
      setIsListening(false);
      onListeningChange?.(false);
      setErrorMessage('Could not activate microphone. Please check your browser audio settings.');
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  const langCode = (SPEECH_LANG_MAP[currentLanguage] || 'en-US').toUpperCase();
  const tooltipText = isListening
    ? `Listening (${langCode})... Click to finish or pause to auto-send`
    : `Click to speak (${langCode})`;

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Active Glowing Pulse Animation Ring */}
      {isListening && (
        <span
          className="absolute -inset-1.5 rounded-2xl animate-ping opacity-60 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />
      )}

      {/* Main Microphone Button */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        title={tooltipText}
        aria-label={tooltipText}
        className={`relative flex items-center justify-center p-2.5 rounded-xl border transition-all duration-300 font-semibold shadow-lg group ${
          isListening
            ? 'scale-105 border-transparent text-black animate-pulse'
            : 'bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border-white/15 hover:scale-105 active:scale-95'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        style={{
          backgroundColor: isListening ? primaryColor : undefined,
          boxShadow: isListening ? `0 0 25px ${primaryColor}bb` : undefined
        }}
      >
        {isListening ? (
          <div className="flex items-center gap-1.5">
            <Mic className="w-5 h-5 relative z-10 animate-bounce" />
            <div className="flex items-center gap-0.5 h-4">
              <span className="w-0.5 h-3 bg-black rounded-full animate-[bounce_0.6s_ease-in-out_infinite]" />
              <span className="w-0.5 h-4 bg-black rounded-full animate-[bounce_0.5s_ease-in-out_infinite_0.1s]" />
              <span className="w-0.5 h-2.5 bg-black rounded-full animate-[bounce_0.7s_ease-in-out_infinite_0.2s]" />
            </div>
          </div>
        ) : (
          <Mic className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        )}
      </button>

      {/* Inline Error Toast */}
      {errorMessage && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 p-2.5 rounded-xl bg-red-950/95 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 shadow-2xl z-50 animate-fadeIn backdrop-blur-md">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span className="flex-1 leading-tight">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
