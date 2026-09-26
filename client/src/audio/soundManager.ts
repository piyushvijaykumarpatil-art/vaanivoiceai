/**
 * Web Audio API Sound Manager & Neural Voice Orchestrator
 * Connects Web Audio API AnalyserNode with audio stream playback and browser speech synthesis.
 */

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;
  private onStateChangeCallback: ((speaking: boolean) => void) | null = null;

  public init(): void {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 0.8;

      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public onStateChange(cb: (speaking: boolean) => void): void {
    this.onStateChangeCallback = cb;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.isPlaying) {
      return new Uint8Array(20).fill(0);
    }
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray.slice(0, 20);
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

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    this.isPlaying = false;
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback(false);
    }
  }

  public async playAudioStream(
    audioArrayBuffer: ArrayBuffer,
    spokenText?: string,
    language: string = 'en'
  ): Promise<void> {
    this.init();
    this.stopAudio();

    if (!this.audioCtx || !this.analyser) {
      throw new Error('AudioContext failed to initialize');
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

      // Trigger browser vocal speech synthesis for crystal-clear regional human pronunciation
      if (spokenText && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        const langCodes: Record<string, string> = {
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
        utterance.lang = langCodes[language] || 'en-US';

        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find(v => v.lang.startsWith(language) || v.lang.replace('_', '-').startsWith(language));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }

        utterance.onend = () => {
          // If browser speech finishes and audio ended, reset state
          if (!this.currentSource) {
            this.isPlaying = false;
            if (this.onStateChangeCallback) {
              this.onStateChangeCallback(false);
            }
          }
        };

        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Error playing audio stream:', err);
      // Fallback: still speak via speechSynthesis if buffer decode fails
      if (spokenText && 'speechSynthesis' in window) {
        this.isPlaying = true;
        if (this.onStateChangeCallback) this.onStateChangeCallback(true);
        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.onend = () => {
          this.isPlaying = false;
          if (this.onStateChangeCallback) this.onStateChangeCallback(false);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        this.isPlaying = false;
        if (this.onStateChangeCallback) this.onStateChangeCallback(false);
      }
    }
  }
}

export const soundManager = new SoundManager();
