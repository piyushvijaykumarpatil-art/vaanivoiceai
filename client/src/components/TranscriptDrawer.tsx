import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { Volume2, Copy, Check, MessageSquare, X, Trash2, Send, Plus, Loader2, Mic } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onReplayAudio: (text: string, language?: string) => void;
  onClearSession: () => void;
  onSendMessage?: (text: string, image?: string) => void;
  isLoading?: boolean;
  currentLanguage?: string;
  primaryColor?: string;
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
  gu: 'gu-IN',
  ml: 'ml-IN'
};

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onReplayAudio,
  onClearSession,
  onSendMessage,
  isLoading = false,
  currentLanguage = 'en',
  primaryColor = '#F59E0B'
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeTranscriptRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to latest message when new messages arrive or drawer opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Cleanup speech recognition on unmount or close
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Auto-stopping Microphone Logic (Web Speech API with continuous = false)
  const handleVoiceInput = () => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANG_MAP[currentLanguage] || 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false; // Automatically stops when you pause talking

    activeTranscriptRef.current = '';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      activeTranscriptRef.current = transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const spokenText = activeTranscriptRef.current.trim();
      // Instantly pass final transcript into chat without requiring manual click
      if (spokenText && onSendMessage && !isLoading) {
        onSendMessage(spokenText, selectedImage || undefined);
        setInput('');
        setSelectedImage(null);
        activeTranscriptRef.current = '';
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition in chat menu:', err);
      setIsListening(false);
    }
  };

  // 2. Handle Image/File Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 3. Handle Send Message
  const handleSend = () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    if (onSendMessage) {
      onSendMessage(input.trim(), selectedImage || undefined);
    }

    setInput('');
    setSelectedImage(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:max-w-md md:max-w-lg imperial-glass border-l border-white/10 shadow-2xl flex flex-col animate-slideLeft bg-[#0b0e14]/95 backdrop-blur-2xl">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <span className="text-base">👑</span>
          <div>
            <h3 className="font-bold text-sm text-white font-cinzel tracking-wide flex items-center gap-1.5">
              VAANI <span style={{ color: primaryColor }}>• Chat Menu</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Live Dialogue & Neural Log ({currentLanguage.toUpperCase()})
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 ml-1">
            {messages.length} turns
          </span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={onClearSession}
              title="Clear Current Session"
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Close Chat Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium text-slate-300">No messages in this dialogue yet.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Use the chat input or microphone option below to ask questions, solve math, analyze code, or converse with Vaani.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl border transition-all text-sm ${
                  isUser
                    ? 'ml-6 sm:ml-8 bg-white/5 border-white/10 text-slate-200'
                    : 'mr-2 sm:mr-4 bg-black/70 text-white shadow-xl'
                }`}
                style={{
                  borderColor: !isUser ? `${primaryColor}55` : undefined
                }}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                  <span className="font-semibold flex items-center gap-1">
                    {isUser ? '👤 You' : '👑 Vaani (Neural Voice)'}
                  </span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {msg.image && (
                  <div className="mb-2">
                    <img
                      src={msg.image}
                      alt="Uploaded attachment"
                      className="max-h-48 max-w-full rounded-xl border border-white/20 object-contain shadow"
                    />
                  </div>
                )}

                {isUser ? (
                  <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.content}</p>
                ) : (
                  <MarkdownContent content={msg.content} primaryColor={primaryColor} />
                )}

                {!isUser && (
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onReplayAudio(msg.content, msg.language)}
                      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors text-amber-300 font-medium"
                      title="Replay Voice"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Chat Menu Input Dock: Chat Option & Mic Option */}
      {onSendMessage && (
        <div className="p-3 border-t border-white/10 bg-[#0d1017]/95 backdrop-blur-xl">
          {/* Image Preview Container if Attached */}
          {selectedImage && (
            <div className="mb-2 relative inline-flex items-center gap-2 p-1.5 rounded-xl bg-black/80 border border-amber-400/40 shadow-lg">
              <img
                src={selectedImage}
                alt="Upload preview"
                className="h-12 w-12 object-cover rounded-lg border border-white/15"
              />
              <div className="text-left pr-2">
                <span className="text-[11px] font-mono text-amber-300 block font-semibold">Image Attached</span>
                <span className="text-[10px] text-slate-400">Multimodal question analysis</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="w-5 h-5 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shadow"
                title="Remove image"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Input Dock */}
          <div className="flex items-center gap-2 bg-[#1b202c] px-3 py-2 rounded-xl border border-white/10 focus-within:border-amber-400/60 shadow-lg transition-colors">
            {/* Hidden File Input for Image Upload */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Upload Image Button (+) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition shrink-0"
              title="Upload image of question (handwritten math, code, diagram)"
            >
              <Plus className="w-4 h-4 text-amber-400" />
            </button>

            {/* Chat Option: Text Input Box */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isListening ? "Listening... Speak now..." : "Message Vaani or ask a question..."}
              disabled={isLoading}
              className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none text-xs sm:text-sm min-w-0"
            />

            {/* Mic Option: Microphone Button (Auto-stops on speech pause) */}
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={`p-1.5 rounded-full transition-all shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title="Voice input (Auto-stops when you pause speaking)"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="p-1.5 rounded-lg transition-all font-semibold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed text-black shadow hover:scale-105 active:scale-95"
              style={{
                backgroundColor: (input.trim() || selectedImage) && !isLoading ? primaryColor : '#475569'
              }}
              title="Send Message"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
