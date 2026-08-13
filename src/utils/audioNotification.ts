// Utility for instant audio chimes and voice notifications for new jobs & updates

// Global Audio Context singleton
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a pleasant dual-tone chime sound (Ding-Dong) using Web Audio API oscillator
 */
export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Tone 1 (High pitch - 587.33 Hz / D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Tone 2 (Higher pitch - 880 Hz / A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('Audio chime play error:', err);
  }
}

/**
 * Checks if voice notifications are enabled in user settings
 */
export function isVoiceNotificationEnabled(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const val = localStorage.getItem('serviflow_voice_notifications');
  return val === null ? true : val === 'true';
}

/**
 * Toggles voice notifications setting
 */
export function setVoiceNotificationEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('serviflow_voice_notifications', String(enabled));
  }
}

/**
 * Speaks text using Web Speech API window.speechSynthesis
 */
export function speakText(text: string, options?: { rate?: number; pitch?: number; lang?: string }): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  try {
    // Cancel any ongoing speech to avoid overlapping queue overload
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.lang = options?.lang || 'en-US';

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => (v.lang.startsWith('en') || v.lang.startsWith('hi')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Triggers instant chime + voice announcement for new jobs or job updates
 */
export function playJobVoiceNotification(
  jobId: string,
  title: string,
  location?: string,
  technicianName?: string
): void {
  if (!isVoiceNotificationEnabled()) return;

  // Play audio chime first
  playNotificationChime();

  // Clean title for speech
  const cleanTitle = title.replace(/[^\w\s]/gi, ' ');
  const speechMessage = `New Job Alert! Job number ${jobId}. ${cleanTitle}.${
    location ? ` Location: ${location}.` : ''
  }${technicianName ? ` Assigned to ${technicianName}.` : ''}`;

  // Slight delay after chime before speaking
  setTimeout(() => {
    speakText(speechMessage, { rate: 0.95, pitch: 1.05 });
  }, 350);
}

/**
 * Triggers instant chime + custom voice announcement
 */
export function playCustomVoiceNotification(heading: string, detail: string): void {
  if (!isVoiceNotificationEnabled()) return;

  playNotificationChime();

  const speechMessage = `${heading}. ${detail}`;
  setTimeout(() => {
    speakText(speechMessage, { rate: 0.98, pitch: 1.0 });
  }, 300);
}
