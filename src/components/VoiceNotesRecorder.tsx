import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { getSelectedVoiceLanguage, SUPPORTED_VOICE_LANGUAGES, VoiceLanguageCode } from '../utils/audioNotification';

interface VoiceNotesRecorderProps {
  job: Job;
  onNotesSaved?: (updatedNotes: string) => void;
  targetField?: 'notes' | 'problemFound' | 'solutionProvided';
  compact?: boolean;
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
  const [selectedLang, setSelectedLang] = useState<VoiceLanguageCode>(() => {
    const saved = getSelectedVoiceLanguage();
    return saved || 'en-IN';
  });
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micPermissionState, setMicPermissionState] = useState<'idle' | 'granted' | 'denied'>('idle');

  const recognitionRef = useRef<any>(null);
  const isManuallyRecordingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const baseTranscriptRef = useRef('');

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

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      isManuallyRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const startRecording = async () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Request microphone access permissions explicitly
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermissionState('granted');
        // Stop stream tracks so SpeechRecognition can take over the mic cleanly
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (permErr) {
      console.warn('Microphone permission request failed or denied:', permErr);
      setMicPermissionState('denied');
      showToast('Please enable microphone access in your browser to dictate notes.', 'error');
    }

    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
      showToast('Speech Recognition API not supported in this browser. Please type or use quick chips.', 'info');
      return;
    }

    try {
      // Abort any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = selectedLang;

      baseTranscriptRef.current = transcript.trim();
      isManuallyRecordingRef.current = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setInterimText('');
        showToast('Listening... Speak clearly into your microphone.', 'info');
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalChunk += item[0].transcript + ' ';
          } else {
            interimChunk += item[0].transcript;
          }
        }

        if (finalChunk) {
          setTranscript((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${finalChunk.trim()}` : finalChunk.trim();
          });
        }

        setInterimText(interimChunk);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed') {
          setMicPermissionState('denied');
          showToast('Microphone access denied. Please allow microphone permission.', 'error');
          setIsRecording(false);
          isManuallyRecordingRef.current = false;
        } else if (event.error === 'no-speech') {
          // Normal pause in speaking, do not stop
        } else if (event.error === 'network') {
          showToast('Network issue with speech recognizer. Retrying...', 'info');
        }
      };

      recognition.onend = () => {
        setInterimText('');
        // If user has not clicked stop, auto-restart to keep continuous dictation alive
        if (isManuallyRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Already started or restarting
          }
        } else {
          setIsRecording(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsRecording(false);
      isManuallyRecordingRef.current = false;
      showToast('Could not start speech recognition. Please check your mic settings.', 'error');
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
    setIsRecording(false);
    setInterimText('');
    showToast('Voice dictation captured successfully!', 'success');
  };

  // Format recording time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Save voice notes to Job in AppContext
  const handleSaveNotes = () => {
    const fullText = (transcript + (interimText ? ' ' + interimText : '')).trim();
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
    }, 300);
  };

  // Quick preset tags / phrases to insert into notes
  const addQuickTag = (tagText: string) => {
    setTranscript((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${tagText}` : tagText;
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
                  Hands-Free Field Input
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Speak in Hindi, English, Marathi, or Gujarati to record on-site job updates.
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
              onChange={(e) => setSelectedLang(e.target.value as VoiceLanguageCode)}
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

      {/* Live Audio Speech Waveform Indicator */}
      {isRecording && (
        <div className="flex items-center justify-between p-2.5 bg-rose-100/70 dark:bg-rose-900/50 rounded-xl mb-2.5 border border-rose-300/80 dark:border-rose-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-rose-600 animate-bounce" />
            <div className="flex items-center gap-1 h-5">
              <span className="w-1 bg-rose-500 rounded-full h-2 animate-[ping_0.7s_infinite_100ms]" />
              <span className="w-1 bg-rose-600 rounded-full h-4 animate-[ping_0.7s_infinite_200ms]" />
              <span className="w-1 bg-rose-500 rounded-full h-5 animate-[ping_0.7s_infinite_300ms]" />
              <span className="w-1 bg-rose-600 rounded-full h-3 animate-[ping_0.7s_infinite_150ms]" />
              <span className="w-1 bg-rose-500 rounded-full h-4 animate-[ping_0.7s_infinite_250ms]" />
            </div>
            <span className="text-[11px] font-bold text-rose-800 dark:text-rose-200 ml-2">
              Listening live... Speak your notes now.
            </span>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="py-1 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
          >
            <Square className="w-3 h-3 fill-white" /> Done Speaking
          </button>
        </div>
      )}

      {/* Dictation Box */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            value={transcript + (interimText ? (transcript ? ' ' : '') + interimText : '')}
            onChange={(e) => {
              setTranscript(e.target.value);
              setInterimText('');
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
          {interimText && (
            <span className="absolute bottom-2.5 right-3 text-[10px] font-semibold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/80 px-2 py-0.5 rounded-full animate-pulse border border-rose-200 dark:border-rose-900">
              transcribing speech...
            </span>
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
          <div className="flex items-center gap-2">
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
                  <span className="hidden sm:inline">Listen</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTranscript('');
                    setInterimText('');
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
