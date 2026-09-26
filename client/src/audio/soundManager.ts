/**
 * Web Audio API Sound Manager & Neural Voice Orchestrator
 * Connects Web Audio API AnalyserNode with audio stream playback and browser speech synthesis.
 */

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
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private onStateChangeCallback: ((speaking: boolean) => void) | null = null;
  private simulatedInterval: any = null;
  private simulatedFrequencies: Uint8Array = new Uint8Array(20).fill(0);
  private cachedVoices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.cachedVoices = window.speechSynthesis.getVoices();
      };
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

  public onStateChange(cb: (speaking: boolean) => void): void {
    this.onStateChangeCallback = cb;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getFrequencyData(): Uint8Array {
    if (this.currentSource && this.analyser && this.isPlaying) {
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyser.getByteFrequencyData(dataArray);
      return dataArray.slice(0, 20);
    }

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
      const now = Date.now() / 120;
      for (let i = 0; i < 20; i++) {
        const base = Math.sin(now + i * 0.4) * 0.5 + 0.5;
        const noise = (Math.random() - 0.5) * 40;
        data[i] = Math.min(255, Math.max(20, Math.floor(base * 180 + 40 + noise)));
      }
      this.simulatedFrequencies = data;
    }, 40);
  }

  private stopSimulatedFrequencies(): void {
    if (this.simulatedInterval) {
      clearInterval(this.simulatedInterval);
      this.simulatedInterval = null;
    }
    this.simulatedFrequencies = new Uint8Array(20).fill(0);
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

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }

    this.stopSimulatedFrequencies();
    this.isPlaying = false;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }
  }

  /**
   * Primary Vocalizer: Speaks text aloud using crystal-clear browser neural speech synthesis,
   * driving the 3D Chrono-Orb and Waveform Visualizer.
   */
  public async speakText(text: string, language: string = 'en'): Promise<void> {
    if (!text || !text.trim()) return;

    this.init();
    this.stopAudio();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser environment');
      return;
    }

    try {
      // Unstick speech synthesis on Chromium
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const targetLang = LANG_CODE_MAP[language] || language || 'en-US';
      utterance.lang = targetLang;

      // Select best regional human voice
      const voices = this.cachedVoices.length > 0 ? this.cachedVoices : window.speechSynthesis.getVoices();
      const cleanLang = language.toLowerCase();

      const matchedVoice = voices.find(v => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        return vLang === targetLang.toLowerCase() || vLang.startsWith(cleanLang);
      }) || voices.find(v => v.lang.startsWith('en'));

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      this.isPlaying = true;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(true);
      }
      this.startSimulatedFrequencies();

      utterance.onend = () => {
        this.isPlaying = false;
        this.stopSimulatedFrequencies();
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(false);
        }
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        this.isPlaying = false;
        this.stopSimulatedFrequencies();
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(false);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Failed to vocalize speech:', err);
      this.isPlaying = false;
      this.stopSimulatedFrequencies();
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(false);
      }
    }
  }

  /**
   * Dual-Pipeline: Plays decoded audio buffer while ensuring speech synthesis vocalization
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
      const decodedBuffer = await this.audioCtx.decodeAudioData(audioArrayBuffer.slice(0));
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

      // Also speak speech text if provided
      if (spokenText && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.rate = 1.0;
        utterance.lang = LANG_CODE_MAP[language] || 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn('AudioBuffer decode error, falling back to direct speech:', err);
      if (spokenText) {
        await this.speakText(spokenText, language);
      }
    }
  }
}

export const soundManager = new SoundManager();
