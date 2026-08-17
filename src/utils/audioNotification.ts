// Utility for crystal-clear audio chimes and multi-language voice notifications
// Supports Hindi, Marathi, Gujarati, English, etc. with natural speech synthesis

export type VoiceLanguageCode = 'hi-IN' | 'en-IN' | 'en-US' | 'mr-IN' | 'gu-IN' | 'bn-IN' | 'ta-IN' | 'te-IN' | 'kn-IN';

export interface VoiceLanguageOption {
  code: VoiceLanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguageOption[] = [
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (IN)', flag: '🇮🇳' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu-IN', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn-IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

// Global Audio Context singleton
let audioCtx: AudioContext | null = null;

/**
 * Gets currently set voice volume (0.0 to 1.0)
 */
export function getVoiceVolume(): number {
  if (typeof localStorage === 'undefined') return 0.85;
  const saved = localStorage.getItem('serviflow_voice_volume');
  if (saved === null) return 0.85;
  const parsed = parseFloat(saved);
  return isNaN(parsed) ? 0.85 : Math.max(0, Math.min(1, parsed));
}

/**
 * Sets voice volume (0.0 to 1.0)
 */
export function setVoiceVolume(volume: number): void {
  if (typeof localStorage !== 'undefined') {
    const clamped = Math.max(0, Math.min(1, volume));
    localStorage.setItem('serviflow_voice_volume', clamped.toString());
  }
}

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
 * Plays a pleasant high-fidelity chime sound using Web Audio API
 */
export function playNotificationChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const volume = getVoiceVolume();
    if (volume <= 0.01) return; // Muted

    const now = ctx.currentTime;

    // Harmonic Tone 1 (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.28 * volume, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Harmonic Tone 2 (A5 - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.32 * volume, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (err) {
    console.warn('Audio chime play error:', err);
  }
}

/**
 * Checks if voice notifications are enabled
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
 * Gets currently selected voice language
 */
export function getSelectedVoiceLanguage(): VoiceLanguageCode {
  if (typeof localStorage === 'undefined') return 'hi-IN';
  const saved = localStorage.getItem('serviflow_voice_language') as VoiceLanguageCode;
  return saved || 'hi-IN';
}

/**
 * Sets user preferred voice language
 */
export function setSelectedVoiceLanguage(lang: VoiceLanguageCode): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('serviflow_voice_language', lang);
  }
}

/**
 * Requests browser push notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Triggers background OS / System notification (works even when tab is backgrounded / minimized or in PWA mode)
 */
export function sendBackgroundSystemNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    data?: any;
  }
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      // 1. Try via Service Worker registration for persistent background OS alerts
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body: options?.body || 'ServiFlow Alert',
            icon: options?.icon || '/favicon.svg',
            badge: '/favicon.svg',
            tag: options?.tag || `serviflow-${Date.now()}`,
            vibrate: [200, 100, 200],
            data: options?.data || { url: '/' },
          } as any);
        }).catch(() => {
          // Fallback to standard Notification constructor
          new Notification(title, {
            body: options?.body || 'ServiFlow Alert',
            icon: options?.icon || '/favicon.svg',
            tag: options?.tag,
            data: options?.data,
          });
        });
      } else {
        new Notification(title, {
          body: options?.body || 'ServiFlow Alert',
          icon: options?.icon || '/favicon.svg',
          tag: options?.tag,
          data: options?.data,
        });
      }

      // Haptic vibration feedback if device supports it
      if ('navigator' in window && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    } catch (err) {
      console.warn('Could not display system notification:', err);
    }
  } else if (Notification.permission === 'default') {
    // Request permission silently
    Notification.requestPermission().catch(() => {});
  }
}

/**
 * High-quality Speech Synthesis using native browser Speech API with language fallback
 */
export function speakText(text: string, options?: { rate?: number; pitch?: number; lang?: VoiceLanguageCode }): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const volume = getVoiceVolume();
    if (volume <= 0.01) return; // Muted

    const targetLang = options?.lang || getSelectedVoiceLanguage();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 0.95;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = volume;
    utterance.lang = targetLang;

    // Pick best matching natural voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = targetLang.split('-')[0];

    const matchedVoice =
      voices.find((v) => v.lang === targetLang && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium'))) ||
      voices.find((v) => v.lang === targetLang) ||
      voices.find((v) => v.lang.startsWith(langPrefix)) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
  }
}

/**
 * Triggers instant chime + multi-language voice announcement for Job Assignment
 */
export function playJobVoiceNotification(
  jobId: string,
  title: string,
  location?: string,
  technicianName?: string
): void {
  if (!isVoiceNotificationEnabled()) return;

  playNotificationChime();

  const lang = getSelectedVoiceLanguage();
  const cleanTitle = (title || 'Service Task').replace(/[^\w\s]/gi, ' ');
  let speechMessage = '';

  if (lang.startsWith('hi')) {
    // Hindi
    speechMessage = `नया काम असाइन हुआ! जॉब नंबर ${jobId}. ${cleanTitle}.${
      technicianName ? ` तकनीशियन ${technicianName} को असाइन किया गया है.` : ''
    }${location ? ` लोकेशन: ${location}.` : ''}`;
  } else if (lang.startsWith('mr')) {
    // Marathi
    speechMessage = `नवीन काम सोपवले! जॉब नंबर ${jobId}. ${cleanTitle}.${
      technicianName ? ` तंत्रज्ञ ${technicianName} यांना सोपवले आहे.` : ''
    }`;
  } else if (lang.startsWith('gu')) {
    // Gujarati
    speechMessage = `નવું કામ સોંપાયું! જોબ નંબર ${jobId}. ${cleanTitle}.${
      technicianName ? ` ટેકનિશિયન ${technicianName} ને સોંપેલ છે.` : ''
    }`;
  } else {
    // English
    speechMessage = `New Job Assigned! Job number ${jobId}. ${cleanTitle}.${
      technicianName ? ` Assigned to ${technicianName}.` : ''
    }${location ? ` Location: ${location}.` : ''}`;
  }

  setTimeout(() => {
    speakText(speechMessage, { rate: 0.95, pitch: 1.05, lang });
  }, 350);
}

/**
 * Triggers instant chime + multi-language voice alert for Job Completion (Notifies Business Owner)
 */
export function playJobCompletedVoiceNotification(
  jobId: string,
  technicianName?: string,
  serviceDescription?: string,
  rating?: number
): void {
  if (!isVoiceNotificationEnabled()) return;

  playNotificationChime();

  const lang = getSelectedVoiceLanguage();
  const tech = technicianName || 'स्टाफ सदस्य';
  const desc = (serviceDescription || 'सेवा कार्य').replace(/[^\w\s]/gi, ' ');
  let speechMessage = '';

  if (lang.startsWith('hi')) {
    // Hindi
    speechMessage = `काम पूरा हुआ! फील्ड तकनीशियन ${tech} ने जॉब ${jobId} का काम सफलता पूर्वक पूरा कर दिया है.${
      rating ? ` कस्टमर ने ${rating} स्टार रेटिंग दी है.` : ''
    }`;
  } else if (lang.startsWith('mr')) {
    // Marathi
    speechMessage = `काम पूर्ण झाले! तंत्रज्ञ ${tech} यांनी जॉब नंबर ${jobId} चे काम यशस्वीरित्या पूर्ण केले आहे.${
      rating ? ` ग्राहकाने ${rating} स्टार रेटिंग दिली आहे.` : ''
    }`;
  } else if (lang.startsWith('gu')) {
    // Gujarati
    speechMessage = `કામ પૂર્ણ થયું! ટેકનિશિયન ${tech} એ જોબ ${jobId} નું કામ સફળતાપૂર્વક પૂરું કર્યું છે.${
      rating ? ` ગ્રાહકે ${rating} સ્ટાર રેટિંગ આપ્યું છે.` : ''
    }`;
  } else if (lang.startsWith('bn')) {
    // Bengali
    speechMessage = `কাজ সম্পন্ন হয়েছে! টেকনিশিয়ান ${tech} জব ${jobId} সফলভাবে সম্পন্ন করেছেন.`;
  } else if (lang.startsWith('ta')) {
    // Tamil
    speechMessage = `வேலை முடிந்தது! தொழில்நுட்ப வல்லுநர் ${tech} வேலை ${jobId} ஐ வெற்றிகரமாக முடித்துள்ளார்.`;
  } else if (lang.startsWith('te')) {
    // Telugu
    speechMessage = `పని పూర్తయింది! టెక్నీషియన్ ${tech} జాబ్ ${jobId} పనిని విజయవంతంగా పూర్తి చేశారు.`;
  } else if (lang.startsWith('kn')) {
    // Kannada
    speechMessage = `ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ! ತಂತ್ರಜ್ಞ ${tech} ಜಾಬ್ ${jobId} ಕೆಲಸವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಮುಗಿಸಿದ್ದಾರೆ.`;
  } else {
    // English
    speechMessage = `Job Completed! Field technician ${technicianName || 'staff'} has successfully completed job ${jobId}.${
      rating ? ` Customer gave ${rating} star rating.` : ''
    }`;
  }

  setTimeout(() => {
    speakText(speechMessage, { rate: 0.95, pitch: 1.0, lang });
  }, 350);
}

/**
 * Triggers instant chime + multi-language voice alert for Job Status Updates (e.g. Technician Accepted, On the way, Started work)
 */
export function playJobStatusVoiceNotification(
  status: 'accepted' | 'on_the_way' | 'started' | 'completed' | string,
  jobId: string,
  technicianName?: string,
  serviceDescription?: string
): void {
  if (!isVoiceNotificationEnabled()) return;

  playNotificationChime();

  const lang = getSelectedVoiceLanguage();
  const tech = technicianName || 'स्टाफ सदस्य';
  const desc = (serviceDescription || 'काम').replace(/[^\w\s]/gi, ' ');
  let speechMessage = '';

  if (status === 'accepted') {
    if (lang.startsWith('hi')) {
      speechMessage = `काम स्वीकार हुआ! तकनीशियन ${tech} ने जॉब ${jobId} का काम स्वीकार (Accept) कर लिया है.`;
    } else if (lang.startsWith('mr')) {
      speechMessage = `काम स्वीकारले! तंत्रज्ञ ${tech} यांनी जॉब ${jobId} चे काम स्वीकारले आहे.`;
    } else if (lang.startsWith('gu')) {
      speechMessage = `કામ સ્વીકારાયું! ટેકનિશિયન ${tech} એ જોબ ${jobId} સ્વીકારી લીધું છે.`;
    } else {
      speechMessage = `Job Accepted! Technician ${tech} accepted job ${jobId}.`;
    }
  } else if (status === 'on_the_way') {
    if (lang.startsWith('hi')) {
      speechMessage = `तकनीशियन रास्ते में है! ${tech} जॉब ${jobId} के लिए रवाना हो चुके हैं.`;
    } else if (lang.startsWith('mr')) {
      speechMessage = `तंत्रज्ञ वाटेवर आहेत! ${tech} जॉब ${jobId} साठी निघाले आहेत.`;
    } else if (lang.startsWith('gu')) {
      speechMessage = `ટેકનિશિયન રસ્તામાં છે! ${tech} જોબ ${jobId} માટે નીકળી ગયા છે.`;
    } else {
      speechMessage = `Technician on the way! ${tech} is on the way to site for job ${jobId}.`;
    }
  } else if (status === 'started') {
    if (lang.startsWith('hi')) {
      speechMessage = `काम शुरू हुआ! तकनीशियन ${tech} ने जॉब ${jobId} पर काम शुरू कर दिया है.`;
    } else if (lang.startsWith('mr')) {
      speechMessage = `काम सुरू झाले! तंत्रज्ञ ${tech} यांनी जॉब ${jobId} चे काम सुरू केले आहे.`;
    } else if (lang.startsWith('gu')) {
      speechMessage = `કામ શરૂ થયું! ટેકનિશિયન ${tech} એ જોબ ${jobId} નું કામ શરૂ કરી દીધું છે.`;
    } else {
      speechMessage = `Work Started! Technician ${tech} started work on job ${jobId}.`;
    }
  } else {
    speechMessage = `Job ${jobId} status updated to ${status.replace('_', ' ')} by ${tech}.`;
  }

  setTimeout(() => {
    speakText(speechMessage, { rate: 0.95, pitch: 1.0, lang });
  }, 350);
}

/**
 * Triggers instant chime + multi-language voice alert for Payments & Transactions
 */
export function playTransactionVoiceNotification(
  type: 'payment' | 'invoice' | 'quotation',
  amount: number | string,
  partyName?: string,
  referenceId?: string
): void {
  if (!isVoiceNotificationEnabled()) return;

  playNotificationChime();

  const lang = getSelectedVoiceLanguage();
  let speechMessage = '';

  if (type === 'payment') {
    if (lang.startsWith('hi')) {
      speechMessage = `पेमेंट प्राप्त हुआ! ₹${amount} की राशि ${partyName ? partyName + ' से' : ''} सफलतापूर्वक रिकॉर्ड हुई.`;
    } else if (lang.startsWith('mr')) {
      speechMessage = `पेमेंट मिळाले! ₹${amount} रक्कम ${partyName ? partyName + ' कडून' : ''} प्राप्त झाली.`;
    } else if (lang.startsWith('gu')) {
      speechMessage = `પેમેન્ટ મળ્યું! ₹${amount} રકમ ${partyName ? partyName + ' તરફથી' : ''} સફળતાપૂર્વક નોંધાઈ.`;
    } else {
      speechMessage = `Payment Received! Amount of ₹${amount} received ${partyName ? 'from ' + partyName : ''}.`;
    }
  } else if (type === 'invoice') {
    if (lang.startsWith('hi')) {
      speechMessage = `नया इनवॉइस ${referenceId ? '#' + referenceId : ''} जनरेट हुआ ₹${amount} का.`;
    } else {
      speechMessage = `New Invoice ${referenceId ? '#' + referenceId : ''} generated for ₹${amount}.`;
    }
  } else {
    if (lang.startsWith('hi')) {
      speechMessage = `नया कोटेशन ${referenceId ? '#' + referenceId : ''} जारी किया गया.`;
    } else {
      speechMessage = `New Quotation ${referenceId ? '#' + referenceId : ''} prepared for ${partyName || 'Customer'}.`;
    }
  }

  setTimeout(() => {
    speakText(speechMessage, { rate: 0.95, pitch: 1.0, lang });
  }, 350);
}

/**
 * Triggers custom voice notification
 */
export function playCustomVoiceNotification(heading: string, detail: string): void {
  if (!isVoiceNotificationEnabled()) return;

  playNotificationChime();

  const speechMessage = `${heading}. ${detail}`;
  setTimeout(() => {
    speakText(speechMessage, { rate: 0.98, pitch: 1.0 });
  }, 300);
}
