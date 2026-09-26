import React, { useState, useEffect } from 'react';
import { Volume2, Play, Check, X, Sliders, Mic, Sparkles, Key, RotateCcw } from 'lucide-react';
import { VOICE_MODELS } from '../utils/constants';
import type { VoiceSettings, VoiceModelConfig } from '../types';
import { soundManager } from '../audio/soundManager';

interface VoiceModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  primaryColor?: string;
  onSettingsUpdated?: (settings: VoiceSettings) => void;
}

export const VoiceModelModal: React.FC<VoiceModelModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  primaryColor = '#F59E0B',
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<VoiceSettings>(() => soundManager.getVoiceSettings());
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedKeyNotice, setSavedKeyNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(soundManager.getVoiceSettings());
      setAvailableVoices(soundManager.getAvailableVoices());
      const storedKey = localStorage.getItem('vaani_gemini_api_key') || '';
      setGeminiApiKey(storedKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectModel = (model: VoiceModelConfig) => {
    const updated: VoiceSettings = {
      ...settings,
      modelId: model.id,
      pitch: model.pitch,
      rate: model.rate,
      systemVoiceName: undefined
    };
    setSettings(updated);
    soundManager.updateVoiceSettings(updated);
    onSettingsUpdated?.(updated);
  };

  const handlePitchChange = (pitch: number) => {
    const updated = { ...settings, pitch };
    setSettings(updated);
    soundManager.updateVoiceSettings(updated);
    onSettingsUpdated?.(updated);
  };

  const handleRateChange = (rate: number) => {
    const updated = { ...settings, rate };
    setSettings(updated);
    soundManager.updateVoiceSettings(updated);
    onSettingsUpdated?.(updated);
  };

  const handleToggleAutoSend = () => {
    const updated = { ...settings, handsFreeAutoSend: !settings.handsFreeAutoSend };
    setSettings(updated);
    soundManager.updateVoiceSettings(updated);
    onSettingsUpdated?.(updated);
  };

  const handleSystemVoiceSelect = (voiceName: string) => {
    const updated = {
      ...settings,
      systemVoiceName: voiceName === 'auto' ? undefined : voiceName
    };
    setSettings(updated);
    soundManager.updateVoiceSettings(updated);
    onSettingsUpdated?.(updated);
  };

  const handleTestVoice = async () => {
    setIsPlayingTest(true);
    const activeModel = VOICE_MODELS.find(m => m.id === settings.modelId) || VOICE_MODELS[0];
    const previewText = activeModel.sampleText;
    await soundManager.speakText(previewText, currentLanguage, settings);
    setIsPlayingTest(false);
  };

  const handleSaveApiKey = () => {
    if (geminiApiKey.trim()) {
      localStorage.setItem('vaani_gemini_api_key', geminiApiKey.trim());
    } else {
      localStorage.removeItem('vaani_gemini_api_key');
    }
    setSavedKeyNotice(true);
    setTimeout(() => setSavedKeyNotice(false), 2500);
  };

  const handleResetDefaults = () => {
    const defaultModel = VOICE_MODELS[0];
    const reset: VoiceSettings = {
      modelId: defaultModel.id,
      pitch: defaultModel.pitch,
      rate: defaultModel.rate,
      volume: 1.0,
      handsFreeAutoSend: true,
      systemVoiceName: undefined
    };
    setSettings(reset);
    soundManager.updateVoiceSettings(reset);
    onSettingsUpdated?.(reset);
  };

  const activeModel = VOICE_MODELS.find(m => m.id === settings.modelId) || VOICE_MODELS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col imperial-glass rounded-3xl border shadow-2xl overflow-hidden"
        style={{ borderColor: `${primaryColor}66` }}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${primaryColor}25`, border: `1px solid ${primaryColor}` }}
            >
              <Volume2 className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Neural Voice Studio & Mic</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  {activeModel.tag}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure neural speech models, pitch cadence, live mic auto-send & cloud intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* 1. Voice Models Grid */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              <span>Select Sovereign Voice Model</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VOICE_MODELS.map((model) => {
                const isSelected = settings.modelId === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelectModel(model)}
                    className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white/15 shadow-xl scale-[1.01]'
                        : 'bg-black/30 hover:bg-white/5 border-white/10'
                    }`}
                    style={{
                      borderColor: isSelected ? primaryColor : 'rgba(255,255,255,0.1)',
                      boxShadow: isSelected ? `0 0 20px ${primaryColor}33` : undefined
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{model.avatar}</span>
                        <div>
                          <div className="font-semibold text-sm text-white">{model.name}</div>
                          <div className="text-[11px] text-amber-300 font-mono">{model.tag}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-black"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-300 leading-relaxed font-normal">
                      {model.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Voice Tuning Sliders (Pitch & Rate) */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <Sliders className="w-4 h-4" style={{ color: primaryColor }} />
                <span>Voice Cadence & Modulation</span>
              </div>
              <button
                onClick={handleResetDefaults}
                title="Reset to model defaults"
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Pitch */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Pitch (Tone Depth):</span>
                <span className="font-mono text-amber-300">{settings.pitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.70"
                max="1.35"
                step="0.05"
                value={settings.pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Dignified & Deep (0.7x)</span>
                <span>Normal (1.0x)</span>
                <span>Melodic & Bright (1.35x)</span>
              </div>
            </div>

            {/* Speed / Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Speech Rate (Pacing):</span>
                <span className="font-mono text-amber-300">{settings.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.35"
                step="0.05"
                value={settings.rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Slow & Thoughtful (0.75x)</span>
                <span>Natural (1.0x)</span>
                <span>Fast & Dynamic (1.35x)</span>
              </div>
            </div>
          </div>

          {/* 3. Live Microphone & Hands-Free Interaction */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Hands-Free Auto-Send on Speech Pause</div>
                  <div className="text-xs text-slate-400">
                    Automatically sends your spoken voice query 1.2 seconds after you finish talking
                  </div>
                </div>
              </div>
              <button
                onClick={handleToggleAutoSend}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                  settings.handsFreeAutoSend ? 'bg-amber-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.handsFreeAutoSend ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 4. Hardware / System Voice Override (Optional) */}
          {availableVoices.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Operating System Voice Engine (Hardware Native)
              </label>
              <select
                value={settings.systemVoiceName || 'auto'}
                onChange={(e) => handleSystemVoiceSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-amber-400"
              >
                <option value="auto">Auto-select optimal neural voice for model & language</option>
                {availableVoices.map((v, i) => (
                  <option key={i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 5. Direct Google Gemini 2.5 API Key (Optional for infinite knowledge on Vercel) */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <Key className="w-3.5 h-3.5" />
              <span>Optional: Direct Google Gemini API Key</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              If deploying on static Vercel without a Node backend, add a free Google Gemini API key to unlock infinite generative conversational intelligence directly in your browser.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy... (Saved in browser localStorage)"
                className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-black/60 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-black transition-transform hover:scale-105"
                style={{ backgroundColor: primaryColor }}
              >
                {savedKeyNotice ? 'Saved!' : 'Save Key'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer: Test Voice & Close */}
        <div className="p-5 border-t border-white/10 bg-black/40 flex items-center justify-between">
          <button
            onClick={handleTestVoice}
            disabled={isPlayingTest}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all hover:scale-105 active:scale-95 border border-white/15 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isPlayingTest ? 'Synthesizing...' : 'Preview Voice Model'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold text-black transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
