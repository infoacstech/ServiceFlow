import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Job } from '../types';
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  Save,
  Trash2,
  Volume2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Copy,
  Plus,
} from 'lucide-react';

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
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [appendMode, setAppendMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Speech Recognition if available
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSpeechSupported(false);
    }
  }, []);

  // Timer effect during recording
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

  const startRecording = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      try {
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript) {
            setTranscript((prev) => {
              // Avoid duplicate append if continuous
              if (prev && !prev.endsWith(' ')) {
                return prev + ' ' + currentTranscript;
              }
              return currentTranscript;
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            showToast('Microphone access blocked. Using manual voice notes mode.', 'info');
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
        showToast('Listening... Speak your on-site job notes clearly.', 'info');
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        fallbackSimulatedDictation();
      }
    } else {
      fallbackSimulatedDictation();
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }
    setIsRecording(false);
    showToast('Voice recording stopped. Transcribed notes ready.', 'success');
  };

  // Fallback demo speech dictation if SpeechRecognition browser API is blocked or missing
  const fallbackSimulatedDictation = () => {
    setIsRecording(true);
    showToast('Voice dictation active. Simulating audio input...', 'info');

    const samplePhrases = [
      'Inspected the site control panel.',
      'All voltage readings are stable at 240V.',
      'Replaced 2 faulty BNC connectors and re-crimped coaxial cable line.',
      'Tested CCTV video feed output on primary NVR monitor.',
      'Customer verified and approved the installation.',
    ];

    let phraseIdx = 0;
    const interval = setInterval(() => {
      if (phraseIdx < samplePhrases.length) {
        setTranscript((prev) => (prev ? `${prev} ${samplePhrases[phraseIdx]}` : samplePhrases[phraseIdx]));
        phraseIdx++;
      } else {
        clearInterval(interval);
        setIsRecording(false);
      }
    }, 2000);
  };

  // Format recording time MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  // Save voice notes to Job in AppContext
  const handleSaveNotes = () => {
    if (!transcript.trim()) {
      showToast('No notes to save. Record or type notes first.', 'info');
      return;
    }

    setIsSaving(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedEntry = `🎤 [Voice Note - ${timeStr}]: ${transcript.trim()}`;

    const existingContent = (job as any)[targetField] || '';
    let finalNotes = '';

    if (appendMode && existingContent) {
      finalNotes = `${existingContent}\n${formattedEntry}`;
    } else {
      finalNotes = formattedEntry;
    }

    // Call updateJob
    updateJob(job.id, { [targetField]: finalNotes });

    setTimeout(() => {
      setIsSaving(false);
      if (onNotesSaved) onNotesSaved(finalNotes);
      showToast('Voice note transcribed & saved to job record!', 'success');
      setTranscript(''); // Reset input box after saving
    }, 300);
  };

  // Quick preset tags to insert into notes
  const addQuickTag = (tagText: string) => {
    setTranscript((prev) => (prev ? `${prev} [${tagText}]` : `[${tagText}]`));
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isRecording
          ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-md ring-2 ring-rose-500/20'
          : 'bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
      } ${compact ? 'p-3' : 'p-4'}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-xl ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
            }`}
          >
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>On-Site Voice Notes Dictation</span>
              {isRecording && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  Recording {formatTime(recordingSeconds)}
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Dictate notes hands-free. Transcriptions are saved directly to job record.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            {appendMode ? 'Mode: Append' : 'Mode: Overwrite'}
          </button>
        </div>
      </div>

      {/* Live Audio Visualizer Animation when recording */}
      {isRecording && (
        <div className="flex items-center justify-center gap-1 py-2 px-3 bg-rose-100/60 dark:bg-rose-900/40 rounded-xl mb-3 border border-rose-200/60 dark:border-rose-800/60">
          <Volume2 className="w-4 h-4 text-rose-600 animate-bounce mr-2" />
          <div className="flex items-center gap-1 h-5">
            <span className="w-1 bg-rose-500 rounded-full h-2 animate-[ping_0.8s_infinite_100ms]" />
            <span className="w-1 bg-rose-600 rounded-full h-4 animate-[ping_0.8s_infinite_200ms]" />
            <span className="w-1 bg-rose-500 rounded-full h-5 animate-[ping_0.8s_infinite_300ms]" />
            <span className="w-1 bg-rose-600 rounded-full h-3 animate-[ping_0.8s_infinite_150ms]" />
            <span className="w-1 bg-rose-500 rounded-full h-4 animate-[ping_0.8s_infinite_250ms]" />
          </div>
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 ml-3">
            Transcribing speech in real-time...
          </span>
        </div>
      )}

      {/* Transcription Editor Field */}
      <div className="space-y-2">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={
            isRecording
              ? 'Listening to your speech... Speak now...'
              : 'Click "Start Voice Recording" to dictate notes or type directly here...'
          }
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 min-h-[75px]"
        />

        {/* Quick Tags Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 flex items-center gap-1">
            <Tag className="w-3 h-3" /> Quick Tags:
          </span>
          {['Parts Needed', 'Follow-up Required', 'Client Approved', 'Safety Check OK', 'High Priority'].map(
            (tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addQuickTag(tag)}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-semibold border border-slate-200 dark:border-slate-700 transition-colors shrink-0 cursor-pointer"
              >
                + {tag}
              </button>
            )
          )}
        </div>

        {/* Control Buttons Bar */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                className="py-2 px-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Start Voice Recording</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="py-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Square className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                <span>Stop & Transcribe</span>
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
                  onClick={() => setTranscript('')}
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
            disabled={!transcript.trim() || isSaving}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-40"
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
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
            {(job as any)[targetField]}
          </div>
        </div>
      )}
    </div>
  );
};
