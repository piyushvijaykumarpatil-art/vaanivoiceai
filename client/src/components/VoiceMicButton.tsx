import React, { useState, useEffect, useRef } from 'react';
import { Mic, AlertCircle } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

export interface VoiceMicButtonProps {
  currentLanguage: string;
  onTranscriptUpdate: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onSpeechEnd?: (finalTranscript: string) => void;
  onAudioRecorded?: (audioBlob: Blob) => void;
  primaryColor?: string;
  disabled?: boolean;
  className?: string;
  autoSendDelayMs?: number;
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
  onAudioRecorded,
  primaryColor = '#F59E0B',
  disabled = false,
  className = '',
  autoSendDelayMs = 1400
}) => {
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveVolume, setLiveVolume] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const activeTranscriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);
  const volumePollRef = useRef<any>(null);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const stopVolumePoll = () => {
    if (volumePollRef.current) {
      clearInterval(volumePollRef.current);
      volumePollRef.current = null;
    }
    setLiveVolume(0);
  };

  // Stop media stream tracks cleanly
  const stopHardwareMic = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    soundManager.disconnectMicStream();
    stopVolumePoll();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearSilenceTimer();
      stopVolumePoll();
      stopHardwareMic();
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
    stopVolumePoll();

    // Stop MediaRecorder and produce audio blob if available
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    stopHardwareMic();

    setIsListening(false);
    onListeningChange?.(false);
    soundManager.playMicStopChime();

    const final = activeTranscriptRef.current.trim();
    if (final) {
      onSpeechEnd?.(final);
    }
  };

  const toggleListening = async () => {
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
      const msg = 'Speech Recognition is not supported in this browser. Please open in Google Chrome or Microsoft Edge for live microphone speech input.';
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 6000);
      return;
    }

    try {
      soundManager.stopAudio(); // stop any active TTS response

      // 1. Request access to the default microphone hardware stream
      let stream: MediaStream | null = null;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          mediaStreamRef.current = stream;

          // Connect stream to soundManager so 3D Chrono-Orb & Equalizer react to live speaking
          soundManager.connectMicStream(stream);

          // Poll live volume level (0 - 100) for real-time visualization
          volumePollRef.current = setInterval(() => {
            const vol = soundManager.getMicVolumeLevel();
            setLiveVolume(vol);
          }, 60);

          // Setup MediaRecorder to record audio while user speaks
          recordedChunksRef.current = [];
          if (typeof MediaRecorder !== 'undefined') {
            try {
              const recorder = new MediaRecorder(stream);
              recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                  recordedChunksRef.current.push(e.data);
                }
              };
              recorder.onstop = () => {
                if (recordedChunksRef.current.length > 0 && onAudioRecorded) {
                  const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
                  onAudioRecorded(blob);
                }
              };
              recorder.start(250);
              mediaRecorderRef.current = recorder;
            } catch (recErr) {
              console.warn('MediaRecorder not available or failed to start:', recErr);
            }
          }
        } catch (mediaErr: any) {
          console.warn('Microphone stream access notice:', mediaErr);
          if (mediaErr.name === 'NotAllowedError' || mediaErr.name === 'PermissionDeniedError') {
            setErrorMessage('Default microphone permission denied. Please allow microphone permissions in your browser URL bar.');
            setTimeout(() => setErrorMessage(null), 6000);
            return;
          }
        }
      }

      soundManager.playMicStartChime();

      // 2. Initialize real-time continuous SpeechRecognition
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = SPEECH_LANG_MAP[currentLanguage] || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
        onListeningChange?.(true);
        activeTranscriptRef.current = '';
      };

      // 3. Real-Time Transcription Accumulator: preserves all previous finalized phrases
      recognition.onresult = (event: any) => {
        let finalAccumulated = '';
        let interimAccumulated = '';

        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result && result[0]) {
            if (result.isFinal) {
              finalAccumulated += result[0].transcript + ' ';
            } else {
              interimAccumulated += result[0].transcript;
            }
          }
        }

        const liveTranscript = (finalAccumulated + interimAccumulated).trim();
        if (liveTranscript) {
          activeTranscriptRef.current = liveTranscript;
          // Instantly send real-time transcription to input dock
          onTranscriptUpdate(liveTranscript);

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
        console.warn('SpeechRecognition event notice:', event.error);
        clearSilenceTimer();
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please click the lock/settings icon in your browser URL bar and allow microphone permissions.');
          stopRecognition();
        } else if (event.error !== 'no-speech') {
          setErrorMessage(`Microphone notice: ${event.error}`);
        }
        setTimeout(() => setErrorMessage(null), 6000);
      };

      recognition.onend = () => {
        clearSilenceTimer();
        stopHardwareMic();
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
      stopHardwareMic();
      setIsListening(false);
      onListeningChange?.(false);
      setErrorMessage('Could not activate default microphone. Please check your browser audio permissions.');
      setTimeout(() => setErrorMessage(null), 6000);
    }
  };

  const langCode = (SPEECH_LANG_MAP[currentLanguage] || 'en-US').toUpperCase();
  const tooltipText = isListening
    ? `🎙️ Recording from Default Mic (${langCode}) - Real-time transcription active. Click to send or pause to auto-send`
    : `Click to speak using default microphone (${langCode})`;

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
            {/* Live dynamic sound wave bars that scale with liveVolume */}
            <div className="flex items-end gap-0.5 h-4">
              <span
                className="w-1 bg-black rounded-full transition-all duration-75"
                style={{ height: `${Math.max(4, Math.min(16, (liveVolume / 100) * 16 + 4))}px` }}
              />
              <span
                className="w-1 bg-black rounded-full transition-all duration-75"
                style={{ height: `${Math.max(6, Math.min(16, (liveVolume / 100) * 20 + 6))}px` }}
              />
              <span
                className="w-1 bg-black rounded-full transition-all duration-75"
                style={{ height: `${Math.max(4, Math.min(16, (liveVolume / 100) * 14 + 4))}px` }}
              />
            </div>
          </div>
        ) : (
          <Mic className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
        )}
      </button>

      {/* Inline Error Toast */}
      {errorMessage && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-80 p-2.5 rounded-xl bg-red-950/95 border border-red-500/50 text-red-200 text-xs flex items-center gap-2 shadow-2xl z-50 animate-fadeIn backdrop-blur-md">
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
