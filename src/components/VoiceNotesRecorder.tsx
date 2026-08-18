import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Job } from '../types';
import {
  Mic,
  Square,
  Save,
  Trash2,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Languages,
  Sparkles,
  RefreshCw,
  Wand2,
  Copy,
  Check,
  ShieldCheck,
  Activity,
  Sliders,
} from 'lucide-react';
import { getSelectedVoiceLanguage, SUPPORTED_VOICE_LANGUAGES, VoiceLanguageCode } from '../utils/audioNotification';
import {
  VoiceAudioMonitor,
  sanitizeVoiceTranscript,
  removeOverlappingBoundary,
  formatCompleteSentence,
  DEFAULT_NOISE_GATE_CONFIG,
} from '../utils/audioVoiceProcessor';

interface VoiceNotesRecorderProps {
  job: Job;
  onNotesSaved?: (updatedNotes: string) => void;
  targetField?: 'notes' | 'problemFound' | 'solutionProvided';
  compact?: boolean;
}

/**
 * Cleans accidental consecutive duplicate words and repeated phrases (supports Indian scripts & English)
 */
export function cleanRepeatedWordsAndPhrases(input: string): string {
  return sanitizeVoiceTranscript(input);
}

export const VoiceNotesRecorder: React.FC<VoiceNotesRecorderProps> = ({
  job,
  onNotesSaved,
  targetField = 'notes',
  compact = false,
}) => {
  const { updateJob, showToast } = useApp();

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [appendMode, setAppendMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedLang, setSelectedLang] = useState<VoiceLanguageCode>(() => {
    const saved = getSelectedVoiceLanguage();
    return saved || 'mr-IN';
  });
  const [speechSupported, setSpeechSupported] = useState(true);

  // Real-time Audio & Noise Gate States
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [audioDb, setAudioDb] = useState<number>(-60);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [noiseEnvironment, setNoiseEnvironment] = useState<'standard' | 'high_noise' | 'quiet'>('standard');
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioMonitorRef = useRef<VoiceAudioMonitor | null>(null);
  const isManuallyRecordingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stores text that was already in the box before the current recognition session started
  const priorTextRef = useRef('');
  // Stores final transcript accumulated in the current recognition session
  const currentSessionFinalRef = useRef('');
  // Buffer of last finalized chunk to prevent interim collisions
  const lastFinalizedChunkRef = useRef('');

  // Check speech recognition support on mount
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
    }
  }, []);

  // Timer counter when recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Clean up recognition & audio monitor on unmount
  useEffect(() => {
    return () => {
      isManuallyRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (audioMonitorRef.current) {
        audioMonitorRef.current.stop();
      }
    };
  }, []);

  // Update noise environment profile
  useEffect(() => {
    if (audioMonitorRef.current) {
      if (noiseEnvironment === 'high_noise') {
        audioMonitorRef.current.setNoiseFloorDb(-35); // Strict noise gate for noisy job sites
        audioMonitorRef.current.setSilenceTimeout(1.2);
      } else if (noiseEnvironment === 'quiet') {
        audioMonitorRef.current.setNoiseFloorDb(-48); // Highly sensitive for quiet offices
        audioMonitorRef.current.setSilenceTimeout(2.0);
      } else {
        audioMonitorRef.current.setNoiseFloorDb(DEFAULT_NOISE_GATE_CONFIG.noiseFloorDb); // Standard -42 dB
        audioMonitorRef.current.setSilenceTimeout(DEFAULT_NOISE_GATE_CONFIG.silenceThresholdSeconds);
      }
    }
  }, [noiseEnvironment]);

  const combineText = (base: string, addition: string) => {
    return removeOverlappingBoundary(base, addition);
  };

  const startRecording = async () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      showToast('Speech Recognition is not supported on this browser. Please type or use quick chips.', 'info');
      return;
    }

    try {
      // Abort any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      // Initialize Web Audio Noise Gate & Silence Detection Monitor
      const monitor = new VoiceAudioMonitor({
        noiseFloorDb:
          noiseEnvironment === 'high_noise' ? -35 : noiseEnvironment === 'quiet' ? -48 : -42,
        silenceThresholdSeconds:
          noiseEnvironment === 'high_noise' ? 1.2 : noiseEnvironment === 'quiet' ? 2.0 : 1.6,
      });

      monitor.onVolumeUpdate = (volPercent, db, voiceActive) => {
        setAudioLevel(volPercent);
        setAudioDb(db);
        setIsVoiceActive(voiceActive);
      };

      monitor.onSilenceDetected = () => {
        // Natural pause / silence detected: finalize and seal the current sentence buffer
        if (currentSessionFinalRef.current || interimText) {
          const raw = combineText(priorTextRef.current, currentSessionFinalRef.current);
          const sanitized = formatCompleteSentence(raw, selectedLang);
          setTranscript(sanitized);
        }
      };

      const stream = await monitor.start();
      audioMonitorRef.current = monitor;

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = selectedLang;

      // Lock in prior text so incoming speech adds cleanly on top without duplicating
      priorTextRef.current = transcript.trim();
      currentSessionFinalRef.current = '';
      lastFinalizedChunkRef.current = '';
      isManuallyRecordingRef.current = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setInterimText('');
        showToast('Active Noise-Cancellation Listening... Speak clearly.', 'info');
      };

      recognition.onresult = (event: any) => {
        let sessionFinal = '';
        let sessionInterim = '';

        // Iterate through all results in the current continuous recognition session
        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            sessionFinal += res[0].transcript + ' ';
          } else {
            sessionInterim += res[0].transcript;
          }
        }

        const trimmedFinal = sessionFinal.trim();
        currentSessionFinalRef.current = trimmedFinal;

        // Calculate combined finalized text with smart overlap & repetition elimination
        const rawFinal = combineText(priorTextRef.current, currentSessionFinalRef.current);
        const cleanedFinal = formatCompleteSentence(rawFinal, selectedLang);

        setTranscript(cleanedFinal);

        // Sanitize interim text to prevent echo chatter in preview
        const cleanedInterim = sanitizeVoiceTranscript(sessionInterim.trim());
        setInterimText(cleanedInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'not-allowed') {
          showToast('Microphone access denied. Please allow microphone permission.', 'error');
          setIsRecording(false);
          isManuallyRecordingRef.current = false;
          if (audioMonitorRef.current) audioMonitorRef.current.stop();
        } else if (event.error === 'no-speech') {
          // Normal pause in speech, keep listening without dropping session
        } else if (event.error === 'network') {
          // Temporary network glitch with recognizer
        }
      };

      recognition.onend = () => {
        setInterimText('');

        // If recognizer pauses automatically but user hasn't clicked stop:
        if (isManuallyRecordingRef.current) {
          // Commit current session final transcript into priorTextRef
          priorTextRef.current = formatCompleteSentence(
            combineText(priorTextRef.current, currentSessionFinalRef.current),
            selectedLang
          );
          currentSessionFinalRef.current = '';

          try {
            recognition.start();
          } catch (e) {
            // Already started or busy
          }
        } else {
          setIsRecording(false);
          if (audioMonitorRef.current) {
            audioMonitorRef.current.stop();
          }
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsRecording(false);
      isManuallyRecordingRef.current = false;
      if (audioMonitorRef.current) {
        audioMonitorRef.current.stop();
      }
      showToast('Could not start speech recognition. Please check your mic permissions.', 'error');
    }
  };

  const stopRecording = () => {
    isManuallyRecordingRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    if (audioMonitorRef.current) {
      audioMonitorRef.current.stop();
      audioMonitorRef.current = null;
    }
    setIsRecording(false);
    setInterimText('');
    setAudioLevel(0);
    setIsVoiceActive(false);

    // Perform final refinement & de-duplication pass
    setTranscript((prev) => formatCompleteSentence(prev, selectedLang));
    showToast('Voice dictation captured accurately!', 'success');
  };

  // Format recording time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Manual one-click text refiner & repeat cleaner
  const handleCleanAndRefine = () => {
    const cleaned = formatCompleteSentence(transcript, selectedLang);
    setTranscript(cleaned);
    showToast('Sentence refined & duplicate words removed!', 'success');
  };

  // Copy text to clipboard
  const handleCopyText = () => {
    const fullText = (transcript + (interimText ? ' ' + interimText : '')).trim();
    if (!fullText) return;
    navigator.clipboard?.writeText(fullText);
    setCopied(true);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  // Save voice notes to Job in AppContext
  const handleSaveNotes = () => {
    const fullText = formatCompleteSentence(
      (transcript + (interimText ? ' ' + interimText : '')).trim(),
      selectedLang
    );
    if (!fullText) {
      showToast('No notes to save. Please speak or enter text first.', 'info');
      return;
    }

    setIsSaving(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedEntry = `🎤 [Voice Note - ${timeStr}]: ${fullText}`;

    const existingContent = (job as any)[targetField] || '';
    let finalNotes = '';

    if (appendMode && existingContent) {
      finalNotes = `${existingContent}\n${formattedEntry}`;
    } else {
      finalNotes = formattedEntry;
    }

    updateJob(job.id, { [targetField]: finalNotes });

    setTimeout(() => {
      setIsSaving(false);
      if (onNotesSaved) onNotesSaved(finalNotes);
      showToast('Voice notes saved to job record & synced!', 'success');
      setTranscript('');
      setInterimText('');
      priorTextRef.current = '';
      currentSessionFinalRef.current = '';
    }, 250);
  };

  // Quick preset tags / phrases to insert into notes
  const addQuickTag = (tagText: string) => {
    setTranscript((prev) => {
      const trimmed = prev.trim();
      const combined = trimmed ? `${trimmed} ${tagText}` : tagText;
      return formatCompleteSentence(combined, selectedLang);
    });
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isRecording
          ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 shadow-lg ring-2 ring-rose-500/30'
          : 'bg-slate-50/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
      } ${compact ? 'p-3' : 'p-4'}`}
      id={`voice-recorder-job-${job.id}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-xl transition-all ${
              isRecording
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/40 animate-pulse'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
            }`}
          >
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 flex-wrap">
              <span>On-Site Voice Dictation & Notes</span>
              {isRecording ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/60 px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-700 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  Recording: {formatTime(recordingSeconds)}
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                  Clean Speech AI Filter Active
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Speak in Marathi, Hindi, English, or Gujarati to record clear on-site job updates.
            </p>
          </div>
        </div>

        {/* Language & Append Mode Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <Languages className="w-3 h-3 text-slate-400" />
            <select
              value={selectedLang}
              onChange={(e) => {
                const newLang = e.target.value as VoiceLanguageCode;
                setSelectedLang(newLang);
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem('serviflow_voice_language', newLang);
                }
              }}
              disabled={isRecording}
              className="text-[11px] font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_VOICE_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Append Mode Toggle */}
          <button
            type="button"
            onClick={() => setAppendMode(!appendMode)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
              appendMode
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300'
            }`}
            title="When active, new voice notes are appended to existing job notes instead of replacing them."
          >
            {appendMode ? 'Append Mode' : 'Overwrite Mode'}
          </button>
        </div>
      </div>

      {/* Live Audio Speech & Noise Gate VU Meter Bar */}
      {isRecording && (
        <div className="p-3 bg-gradient-to-r from-rose-100/90 via-amber-50/80 to-rose-100/90 dark:from-rose-950/70 dark:via-slate-900 dark:to-rose-950/70 rounded-2xl mb-2.5 border border-rose-300 dark:border-rose-800 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg transition-all ${
                  isVoiceActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40 animate-pulse'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black text-slate-900 dark:text-white">
                    {isVoiceActive ? 'Voice Detected (Speaking)' : 'Noise Gate: Ambient Filtered'}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                      isVoiceActive
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {audioDb} dB
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Echo Cancellation & Anti-Repetition Layer Active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAudioSettings(!showAudioSettings)}
                className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Noise sensitivity settings"
              >
                <Sliders className="w-3 h-3" />
                <span className="text-[10px] capitalize hidden sm:inline">{noiseEnvironment.replace('_', ' ')}</span>
              </button>

              <button
                type="button"
                onClick={stopRecording}
                className="py-1 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Square className="w-3 h-3 fill-white" /> Done
              </button>
            </div>
          </div>

          {/* Real-time VU Sound Level Bar */}
          <div className="space-y-1">
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 flex gap-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  audioLevel > 60
                    ? 'bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500'
                    : audioLevel > 25
                    ? 'bg-emerald-500'
                    : 'bg-slate-400 dark:bg-slate-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, audioLevel))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Silence (-60dB)</span>
              <span>Noise Floor Gate</span>
              <span>Active Speech (0dB)</span>
            </div>
          </div>

          {/* Expandable Noise Environment Settings */}
          {showAudioSettings && (
            <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                <span>Noise Profile:</span>
              </span>

              <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {(
                  [
                    { id: 'standard', label: 'Standard', desc: 'Balanced Site' },
                    { id: 'high_noise', label: 'High Noise', desc: 'Strict Filter' },
                    { id: 'quiet', label: 'Quiet Room', desc: 'Sensitive' },
                  ] as const
                ).map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => setNoiseEnvironment(env.id)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      noiseEnvironment === env.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {env.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dictation Box */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
            }}
            placeholder={
              isRecording
                ? 'Listening to speech in real-time... (Speak now)'
                : 'Click "Start Voice Recording" to speak, or tap quick phrases below, or type manually...'
            }
            className={`w-full p-3 rounded-xl border text-xs font-medium text-slate-900 dark:text-slate-100 transition-all min-h-[85px] focus:ring-2 focus:ring-indigo-500 ${
              isRecording
                ? 'bg-white dark:bg-slate-900 border-rose-400 dark:border-rose-700 shadow-inner'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
            }`}
          />

          {/* Real-time Interim Live Preview Strip */}
          {interimText && (
            <div className="mt-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="font-semibold shrink-0">Hearing:</span>
              <span className="italic truncate">{interimText}</span>
            </div>
          )}
        </div>

        {/* Quick Dictation Preset Phrases */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Quick Service Phrases & Tags:</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              'Diagnostic test completed successfully.',
              'Faulty connector replaced and re-crimped.',
              'Voltage and power supply calibrated.',
              'Cleaned lens & checked camera signal feed.',
              'Client verified and signed off on site.',
              '[Parts Needed]',
              '[Follow-up Required]',
              '[Priority Fix]',
            ].map((phrase) => (
              <button
                key={phrase}
                type="button"
                onClick={() => addQuickTag(phrase)}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer"
              >
                + {phrase}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="py-2 px-3.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Start Voice Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Stop Recording</span>
              </button>
            )}

            {transcript && (
              <>
                <button
                  type="button"
                  onClick={handleCleanAndRefine}
                  className="py-1.5 px-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Remove repeat words & polish sentence"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Refine Text</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyText}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-semibold text-xs"
                  title="Copy text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const SpeechSynthesisAPI = window.speechSynthesis;
                    if (SpeechSynthesisAPI) {
                      window.speechSynthesis.cancel();
                      const u = new SpeechSynthesisUtterance(transcript);
                      u.lang = selectedLang;
                      u.rate = 0.95;
                      window.speechSynthesis.speak(u);
                    }
                  }}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-xl transition-colors cursor-pointer flex items-center gap-1 font-semibold text-xs"
                  title="Listen to dictated transcript out loud"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setInterimText('');
                    priorTextRef.current = '';
                    currentSessionFinalRef.current = '';
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                  title="Clear transcript"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={(!transcript.trim() && !interimText.trim()) || isSaving}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Job Record</span>
          </button>
        </div>
      </div>

      {/* Existing Notes Display Preview */}
      {(job as any)[targetField] && (
        <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Saved Job Notes History</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Synced to Database
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
            {(job as any)[targetField]}
          </div>
        </div>
      )}
    </div>
  );
};
