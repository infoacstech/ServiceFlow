/**
 * Audio Voice Processor & Anti-Echo / Silence-Detection Layer
 * 
 * Provides:
 * 1. Hardware & Web Audio Noise Cancellation + Echo Suppression
 * 2. Real-time RMS Noise Gate & Voice Activity Detection (VAD)
 * 3. Silence Detection with intelligent sentence boundary handling
 * 4. Multi-pass Anti-Echo & Word / Multi-word Phrase De-duplication
 * 5. Partial sentence buffering to prevent truncation and choppy capture
 */

export interface NoiseGateConfig {
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  silenceThresholdSeconds: number; // e.g. 1.5s silence to finalize
  noiseFloorDb: number; // e.g. -45 dB threshold
}

export const DEFAULT_NOISE_GATE_CONFIG: NoiseGateConfig = {
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  silenceThresholdSeconds: 1.6,
  noiseFloorDb: -42,
};

/**
 * Calculates audio Root Mean Square (RMS) volume and converts to decibels (dB)
 */
export function calculateAudioRmsAndDb(timeDomainData: Float32Array): { rms: number; db: number } {
  let sumSquares = 0;
  for (let i = 0; i < timeDomainData.length; i++) {
    sumSquares += timeDomainData[i] * timeDomainData[i];
  }
  const rms = Math.sqrt(sumSquares / timeDomainData.length);
  // Avoid Math.log10(0)
  const db = rms > 0.00001 ? 20 * Math.log10(rms) : -100;
  return { rms, db };
}

/**
 * Advanced Voice Audio Monitor using Web Audio API
 * Tracks live audio levels, runs the noise gate, and detects silence
 */
export class VoiceAudioMonitor {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  private isVoiceActive: boolean = false;
  private noiseFloorDb: number;
  private silenceTimeoutMs: number;

  public onVolumeUpdate?: (volPercent: number, db: number, isVoice: boolean) => void;
  public onVoiceStart?: () => void;
  public onSilenceDetected?: () => void;

  constructor(config: Partial<NoiseGateConfig> = {}) {
    this.noiseFloorDb = config.noiseFloorDb ?? DEFAULT_NOISE_GATE_CONFIG.noiseFloorDb;
    this.silenceTimeoutMs = (config.silenceThresholdSeconds ?? DEFAULT_NOISE_GATE_CONFIG.silenceThresholdSeconds) * 1000;
  }

  /**
   * Starts monitoring the provided MediaStream or requests an optimized microphone stream
   */
  public async start(providedStream?: MediaStream): Promise<MediaStream | null> {
    this.stop();

    try {
      if (providedStream) {
        this.stream = providedStream;
      } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: { ideal: 48000 },
          },
          video: false,
        });
      }

      if (!this.stream) return null;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return this.stream;

      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.4;

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.stream);
      this.sourceNode.connect(this.analyser);

      const bufferLength = this.analyser.fftSize;
      const dataArray = new Float32Array(bufferLength);

      const checkAudioLevel = () => {
        if (!this.analyser) return;

        this.analyser.getFloatTimeDomainData(dataArray);
        const { rms, db } = calculateAudioRmsAndDb(dataArray);

        // Normalize dB from [-60, 0] to [0, 100] percent
        const clampedDb = Math.max(-60, Math.min(0, db));
        const volPercent = Math.round(((clampedDb + 60) / 60) * 100);

        // Voice detection threshold gate
        const isAboveNoiseFloor = db > this.noiseFloorDb && rms > 0.012;

        if (isAboveNoiseFloor) {
          if (!this.isVoiceActive) {
            this.isVoiceActive = true;
            this.onVoiceStart?.();
          }

          // Reset silence timer on active voice
          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }
        } else {
          // Below noise floor: start silence timer if previously speaking
          if (this.isVoiceActive && !this.silenceTimer) {
            this.silenceTimer = setTimeout(() => {
              this.isVoiceActive = false;
              this.onSilenceDetected?.();
              this.silenceTimer = null;
            }, this.silenceTimeoutMs);
          }
        }

        this.onVolumeUpdate?.(volPercent, Math.round(db), this.isVoiceActive);
        this.animFrameId = requestAnimationFrame(checkAudioLevel);
      };

      this.animFrameId = requestAnimationFrame(checkAudioLevel);
      return this.stream;
    } catch (err) {
      console.warn('VoiceAudioMonitor initialization error:', err);
      return null;
    }
  }

  /**
   * Updates silence threshold dynamically
   */
  public setSilenceTimeout(seconds: number) {
    this.silenceTimeoutMs = Math.max(0.5, seconds) * 1000;
  }

  /**
   * Updates noise floor threshold dynamically (-60 to -20 dB)
   */
  public setNoiseFloorDb(db: number) {
    this.noiseFloorDb = Math.max(-60, Math.min(-20, db));
  }

  /**
   * Stops monitoring and releases Web Audio / MediaStream resources cleanly
   */
  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {}
      this.analyser = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (e) {}
      this.audioCtx = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    this.isVoiceActive = false;
  }
}

/**
 * Intelligent Overlap & Echo Stripper:
 * Detects if the beginning of addition overlaps with the end of base string
 * (a common symptom of mobile browser speech recognition repeating previous words)
 */
export function removeOverlappingBoundary(base: string, addition: string): string {
  const b = (base || '').trim();
  const a = (addition || '').trim();

  if (!b) return a;
  if (!a) return b;

  const baseWords = b.split(/\s+/);
  const addWords = a.split(/\s+/);

  // Check overlap of lengths from min(baseWords.length, addWords.length) down to 1
  const maxOverlap = Math.min(baseWords.length, addWords.length, 6);

  for (let len = maxOverlap; len >= 1; len--) {
    const baseTail = baseWords.slice(baseWords.length - len).map(w => w.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F\u0A80-\u0AFF]/g, '')).join(' ');
    const addHead = addWords.slice(0, len).map(w => w.toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F\u0A80-\u0AFF]/g, '')).join(' ');

    if (baseTail && addHead && baseTail === addHead) {
      // Overlap matched! Return base + remainder of addition without repeating overlap
      const remainder = addWords.slice(len).join(' ');
      return remainder ? `${b} ${remainder}` : b;
    }
  }

  return `${b} ${a}`;
}

/**
 * Comprehensive Anti-Echo, Stutter, and Word / Phrase De-duplication
 * Works natively with English, Marathi, Hindi, Gujarati, Tamil, etc.
 */
export function sanitizeVoiceTranscript(input: string): string {
  if (!input || !input.trim()) return '';

  let text = input.trim();

  // Normalize all multi-spaces into single space
  text = text.replace(/\s+/g, ' ');

  const words = text.split(' ').filter(Boolean);
  if (words.length <= 1) return text;

  // 1. Remove consecutive identical words (e.g. "हॅलो हॅलो हॅलो", "hello hello", "the the")
  const deduplicatedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const prev = deduplicatedWords[deduplicatedWords.length - 1];

    if (prev) {
      // Strip punctuation for pure word comparison
      const cleanCurrent = current.toLowerCase().replace(/[.,!?।॥]/g, '');
      const cleanPrev = prev.toLowerCase().replace(/[.,!?।॥]/g, '');

      if (cleanCurrent && cleanCurrent === cleanPrev) {
        continue; // Skip echo / duplicate word
      }
    }
    deduplicatedWords.push(current);
  }

  // 2. Remove consecutive repeating 2-word, 3-word, 4-word, and 5-word phrases
  let resultWords = deduplicatedWords;

  for (let phraseLen = 2; phraseLen <= 5; phraseLen++) {
    let changed = true;
    let guardCounter = 0;
    while (changed && resultWords.length >= phraseLen * 2 && guardCounter < 10) {
      changed = false;
      guardCounter++;

      for (let i = 0; i <= resultWords.length - phraseLen * 2; i++) {
        const p1 = resultWords
          .slice(i, i + phraseLen)
          .map(w => w.toLowerCase().replace(/[.,!?।॥]/g, ''))
          .join(' ');
        const p2 = resultWords
          .slice(i + phraseLen, i + phraseLen * 2)
          .map(w => w.toLowerCase().replace(/[.,!?।॥]/g, ''))
          .join(' ');

        if (p1 && p1 === p2) {
          resultWords.splice(i + phraseLen, phraseLen);
          changed = true;
          break;
        }
      }
    }
  }

  let cleaned = resultWords.join(' ').trim();

  // 3. Clean trailing repetitive punctuation or orphaned marks
  cleaned = cleaned.replace(/\s+([.,!?।॥])/g, '$1');
  cleaned = cleaned.replace(/([.,!?।॥]){2,}/g, '$1');

  return cleaned;
}

/**
 * Intelligent Sentence Capitalizer & Boundary Completer
 * Ensures clean final sentences without cut-off words
 */
export function formatCompleteSentence(rawText: string, langCode: string = 'en-IN'): string {
  let cleaned = sanitizeVoiceTranscript(rawText);
  if (!cleaned) return '';

  // For Latin / English, capitalize the first letter of sentences
  if (langCode.startsWith('en')) {
    cleaned = cleaned.replace(/(^\s*|\.\s+|\?\s+|!\s+)([a-z])/g, (_, prefix, char) => {
      return prefix + char.toUpperCase();
    });
  }

  return cleaned;
}
