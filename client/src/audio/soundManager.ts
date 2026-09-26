/**
 * Web Audio API Sound Manager & Neural Voice Orchestrator
 * Connects Web Audio API AnalyserNode with speech synthesis, default microphone live stream, and voice models.
 */

import type { VoiceSettings } from '../types';
import { DEFAULT_VOICE_SETTINGS, VOICE_MODELS } from '../utils/constants';
import { API_BASE } from '../utils/api';

const LANG_CODE_MAP: Record<string, string> = {
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

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private isMicActive: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentAudioElem: HTMLAudioElement | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private onStateChangeCallback: ((speaking: boolean) => void) | null = null;
  private simulatedInterval: any = null;
  private keepAliveInterval: any = null;
  private simulatedFrequencies: Uint8Array = new Uint8Array(20).fill(0);
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voiceSettings: VoiceSettings;

  constructor() {
    let saved: VoiceSettings = DEFAULT_VOICE_SETTINGS;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('vaani_voice_settings');
        if (stored) {
          saved = { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(stored) };
        }
      } catch {
        // use default
      }
    }
    this.voiceSettings = saved;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.refreshVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.refreshVoices();
      };
    }
  }

  public refreshVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
    }
    return this.cachedVoices;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.cachedVoices.length === 0) {
      this.refreshVoices();
    }
    return this.cachedVoices;
  }

  public getVoiceSettings(): VoiceSettings {
    return { ...this.voiceSettings };
  }

  public updateVoiceSettings(newSettings: Partial<VoiceSettings>): void {
    this.voiceSettings = { ...this.voiceSettings, ...newSettings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vaani_voice_settings', JSON.stringify(this.voiceSettings));
      } catch {
        // ignore
      }
    }
  }

  public init(): void {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.8;

        this.micAnalyser = this.audioCtx.createAnalyser();
        this.micAnalyser.fftSize = 64;
        this.micAnalyser.smoothingTimeConstant = 0.7;

        this.gainNode = this.audioCtx.createGain();
        this.gainNode.gain.value = 0.9;

        this.analyser.connect(this.gainNode);
        this.gainNode.connect(this.audioCtx.destination);
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  /**
   * Connects the hardware default microphone stream to Web Audio Analyser
   * (Without connecting to speakers, avoiding feedback echo)
   */
  public connectMicStream(stream: MediaStream): void {
    try {
      this.init();
      if (!this.audioCtx || !this.micAnalyser) return;

      this.disconnectMicStream();

      this.micSourceNode = this.audioCtx.createMediaStreamSource(stream);
      this.micSourceNode.connect(this.micAnalyser);
      this.isMicActive = true;
    } catch (err) {
      console.warn('Failed to connect mic stream to Web Audio API:', err);
    }
  }

  public disconnectMicStream(): void {
    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch {
        // ignore
      }
      this.micSourceNode = null;
    }
    this.isMicActive = false;
  }

  public isMicrophoneActive(): boolean {
    return this.isMicActive;
  }

  /**
   * Calculates live microphone input volume level (0 - 100)
   */
  public getMicVolumeLevel(): number {
    if (!this.isMicActive || !this.micAnalyser) return 0;
    const data = new Uint8Array(this.micAnalyser.frequencyBinCount);
    this.micAnalyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / data.length;
    return Math.min(100, Math.round((avg / 255) * 100));
  }

  /**
   * Sound effect: Pleasant ascending chime when mic activates
   */
  public playMicStartChime(): void {
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.15);
    } catch {
      // AudioContext might be blocked until gesture
    }
  }

  /**
   * Sound effect: Soft descending chime when mic stops
   */
  public playMicStopChime(): void {
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(330, this.audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }

  public onStateChange(cb: (speaking: boolean) => void): void {
    this.onStateChangeCallback = cb;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Real-time audio frequency data for 3D Chrono-Orb & Waveform Visualizer:
   * Actively responds to BOTH live speaking microphone input and AI voice speech output!
   */
  public getFrequencyData(): Uint8Array {
    // 1. If mic is active and user is speaking, analyze microphone input
    if (this.isMicActive && this.micAnalyser) {
      const bufferLength = this.micAnalyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.micAnalyser.getByteFrequencyData(dataArray);
      return dataArray.slice(0, 20);
    }

    // 2. If AI audio source buffer is playing
    if (this.currentSource && this.analyser && this.isPlaying) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);
      return dataArray.slice(0, 20);
    }

    // 3. If SpeechSynthesis vocal is active
    if (this.isPlaying) {
      return this.simulatedFrequencies;
    }

    return new Uint8Array(20).fill(0);
  }

  private startSimulatedFrequencies(): void {
    this.stopSimulatedFrequencies();
    this.simulatedInterval = setInterval(() => {
      if (!this.isPlaying) {
        this.stopSimulatedFrequencies();
        return;
      }
      const data = new Uint8Array(20);
      const now = Date.now() / 110;
      for (let i = 0; i < 20; i++) {
        const base = Math.sin(now + i * 0.42) * 0.5 + 0.5;
        const noise = (Math.random() - 0.5) * 45;
        data[i] = Math.min(255, Math.max(25, Math.floor(base * 190 + 40 + noise)));
      }
      this.simulatedFrequencies = data;
    }, 35);
  }

  private stopSimulatedFrequencies(): void {
    if (this.simulatedInterval) {
      clearInterval(this.simulatedInterval);
      this.simulatedInterval = null;
    }
    this.simulatedFrequencies = new Uint8Array(20).fill(0);
  }

  private clearKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  public stopAudio(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }

    if (this.currentAudioElem) {
      try {
        this.currentAudioElem.pause();
        this.currentAudioElem.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudioElem = null;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    this.clearKeepAlive();
    this.stopSimulatedFrequencies();
    this.isPlaying = false;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }
  }

  /**
   * Primary Vocalizer: Speaks text aloud using configured Voice Model and SpeechSynthesis.
   * Directly drives the 3D Chrono-Orb and Waveform visualizers.
   */
  public async speakText(
    text: string,
    language: string = 'en',
    customSettings?: Partial<VoiceSettings>
  ): Promise<void> {
    if (!text || !text.trim()) return;

    this.init();
    this.stopAudio();

    const isIndic = /[\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF\u0C80-\u0CFF\u0A80-\u0AFF\u0980-\u09FF\u0A00-\u0A7F]/.test(text) ||
      ['mr', 'hi', 'te', 'ta', 'kn', 'gu', 'bn', 'pa'].includes(language.toLowerCase());

    const settings: VoiceSettings = {
      ...this.voiceSettings,
      ...customSettings
    };

    const activeModel = VOICE_MODELS.find(m => m.id === settings.modelId) || VOICE_MODELS[0];

    // If SpeechSynthesis is available in browser
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
          await new Promise(r => setTimeout(r, 60));
        }
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.rate = Math.max(0.7, Math.min(1.5, settings.rate || activeModel.rate));
        utterance.pitch = Math.max(0.6, Math.min(1.4, settings.pitch || activeModel.pitch));
        utterance.volume = Math.max(0.2, Math.min(1.0, settings.volume ?? 1.0));

        const targetLang = LANG_CODE_MAP[language] || language || 'en-US';
        utterance.lang = targetLang;

        // Smart Voice Matching
        const voices = this.getAvailableVoices();
        let selectedVoice: SpeechSynthesisVoice | undefined;

        if (settings.systemVoiceName) {
          selectedVoice = voices.find(v => v.name === settings.systemVoiceName);
        }

        if (!selectedVoice) {
          const cleanLang = language.toLowerCase();
          const targetLower = targetLang.toLowerCase();

          // Search directly for voice matching target language
          let matchingLangVoices = voices.filter(v => {
            const vLang = v.lang.toLowerCase().replace('_', '-');
            return vLang === targetLower || vLang.startsWith(cleanLang);
          });

          // Marathi & Hindi share Devanagari script; a Hindi voice can speak Marathi if Marathi voice isn't installed
          if (matchingLangVoices.length === 0 && (cleanLang === 'mr' || cleanLang === 'hi' || isIndic)) {
            matchingLangVoices = voices.filter(v => {
              const vLang = v.lang.toLowerCase().replace('_', '-');
              const name = v.name.toLowerCase();
              return vLang.startsWith('hi') || vLang.startsWith('mr') || name.includes('hindi') || name.includes('marathi') || name.includes('kalpana') || name.includes('hemant') || name.includes('india');
            });
          }

          if (matchingLangVoices.length > 0) {
            if (activeModel.persona === 'sovereign') {
              selectedVoice = matchingLangVoices.find(v => {
                const name = v.name.toLowerCase();
                return name.includes('male') || name.includes('david') || name.includes('mark') || name.includes('guy') || name.includes('ravi') || name.includes('hemant') || name.includes('madhur');
              }) || matchingLangVoices[0];
            } else if (activeModel.persona === 'imperial' || activeModel.persona === 'studio') {
              selectedVoice = matchingLangVoices.find(v => {
                const name = v.name.toLowerCase();
                return name.includes('female') || name.includes('zira') || name.includes('samantha') || name.includes('swara') || name.includes('aarohi') || name.includes('kalpana') || name.includes('neerja');
              }) || matchingLangVoices[0];
            } else {
              selectedVoice = matchingLangVoices[0];
            }
          } else if (!isIndic) {
            // ONLY fallback to English voices if the text is English / Latin!
            if (activeModel.persona === 'sovereign') {
              selectedVoice = voices.find(v => {
                const name = v.name.toLowerCase();
                return (name.includes('male') || name.includes('david') || name.includes('guy')) && v.lang.startsWith('en');
              });
            } else if (activeModel.persona === 'imperial' || activeModel.persona === 'studio') {
              selectedVoice = voices.find(v => {
                const name = v.name.toLowerCase();
                return (name.includes('female') || name.includes('zira') || name.includes('samantha')) && v.lang.startsWith('en');
              });
            }
            if (!selectedVoice) {
              selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
            }
          }
        }

        // CRITICAL: Only assign utterance.voice if a voice was safely chosen
        // For Devanagari text when no Indic voice is installed on Windows, leaving utterance.voice undefined
        // allows the browser to utilize its online neural speech engine for the language tag!
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        this.isPlaying = true;
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(true);
        }
        this.startSimulatedFrequencies();

        this.keepAliveInterval = setInterval(() => {
          if (this.isPlaying && typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 5000);

        utterance.onend = () => {
          this.clearKeepAlive();
          this.isPlaying = false;
          this.stopSimulatedFrequencies();
          if (this.onStateChangeCallback) {
            this.onStateChangeCallback(false);
          }
        };

        utterance.onerror = (e) => {
          console.warn('SpeechSynthesis event notice:', e);
          this.clearKeepAlive();
          this.isPlaying = false;
          this.stopSimulatedFrequencies();
          if (this.onStateChangeCallback) {
            this.onStateChangeCallback(false);
          }
          // Attempt direct streaming fallback
          this.playFromStream(text, language).catch(() => {});
        };

        window.speechSynthesis.speak(utterance);
        return;
      } catch (err) {
        console.error('Failed to vocalize speech with SpeechSynthesis, attempting stream fallback:', err);
      }
    }

    // Direct streaming fallback
    await this.playFromStream(text, language);
  }

  /**
   * Dual-Pipeline: Plays decoded audio buffer while driving visualizer
   */
  public async playAudioStream(
    audioArrayBuffer: ArrayBuffer,
    spokenText?: string,
    language: string = 'en'
  ): Promise<void> {
    if (!audioArrayBuffer || audioArrayBuffer.byteLength === 0) {
      if (spokenText) {
        await this.speakText(spokenText, language);
      }
      return;
    }

    this.init();
    this.stopAudio();

    if (!this.audioCtx || !this.analyser) {
      if (spokenText) {
        await this.speakText(spokenText, language);
      }
      return;
    }

    try {
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume().catch(() => {});
      }

      // decodeAudioData detaches the buffer, pass a copy
      const copy = audioArrayBuffer.slice(0);
      const decodedBuffer = await this.audioCtx.decodeAudioData(copy);
      const source = this.audioCtx.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(this.analyser);

      this.currentSource = source;
      this.isPlaying = true;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(true);
      }

      source.onended = () => {
        if (this.currentSource === source) {
          this.isPlaying = false;
          this.currentSource = null;
          if (this.onStateChangeCallback) {
            this.onStateChangeCallback(false);
          }
        }
      };

      source.start(0);
    } catch (err) {
      console.warn('AudioBuffer decode error, falling back to direct speech synthesis:', err);
      if (spokenText) {
        await this.speakText(spokenText, language);
      }
    }
  }

  /**
   * Streaming Fallback: Streams synthesized neural audio from the backend
   */
  public async playFromStream(text: string, language: string = 'en'): Promise<void> {
    try {
      this.init();
      this.stopAudio();

      const streamUrl = `${API_BASE}/tts/stream?text=${encodeURIComponent(text.trim())}&language=${encodeURIComponent(language)}`;
      const audio = new Audio(streamUrl);
      this.currentAudioElem = audio;

      this.isPlaying = true;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(true);
      }
      this.startSimulatedFrequencies();

      audio.onended = () => {
        this.isPlaying = false;
        this.currentAudioElem = null;
        this.stopSimulatedFrequencies();
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(false);
        }
      };

      audio.onerror = () => {
        this.isPlaying = false;
        this.currentAudioElem = null;
        this.stopSimulatedFrequencies();
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(false);
        }
      };

      await audio.play();
    } catch (err) {
      this.isPlaying = false;
      this.stopSimulatedFrequencies();
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(false);
      }
      console.warn('[SoundManager] Stream audio playback notice:', err);
    }
  }
}

export const soundManager = new SoundManager();
