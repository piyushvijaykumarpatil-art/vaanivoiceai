import React from 'react';
import type { ChatMessage } from '../types';
import { Volume2, Copy, Check, MessageSquare, X, Trash2 } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onReplayAudio: (text: string, language?: string) => void;
  onClearSession: () => void;
  primaryColor?: string;
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  messages,
  onReplayAudio,
  onClearSession,
  primaryColor = '#F59E0B'
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md imperial-glass border-l border-white/10 shadow-2xl flex flex-col animate-slideLeft">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4" style={{ color: primaryColor }} />
          <h3 className="font-bold text-sm text-white font-cinzel tracking-wide">
            Sovereign Dialogue Log
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
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
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No messages in this sovereign dialogue yet.</p>
            <p className="text-xs text-slate-500 mt-1">Type in the bottom dock or pick a suggestion chip to speak with Vaani.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`p-3.5 rounded-2xl border transition-all text-sm ${
                  isUser
                    ? 'ml-8 bg-white/5 border-white/10 text-slate-200'
                    : 'mr-4 bg-black/60 text-white shadow-lg'
                }`}
                style={{
                  borderColor: !isUser ? `${primaryColor}44` : undefined
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
      </div>
    </div>
  );
};
