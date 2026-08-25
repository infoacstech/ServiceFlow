import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Job } from '../types';
import {
  FileText,
  Save,
  Trash2,
  Copy,
  Check,
  Edit3,
} from 'lucide-react';

interface VoiceNotesRecorderProps {
  job: Job;
  onNotesSaved?: (updatedNotes: string) => void;
  targetField?: 'notes' | 'problemFound' | 'solutionProvided';
  compact?: boolean;
}

/**
 * Cleans accidental consecutive duplicate words and repeated phrases if needed
 */
export function cleanRepeatedWordsAndPhrases(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export const VoiceNotesRecorder: React.FC<VoiceNotesRecorderProps> = ({
  job,
  onNotesSaved,
  targetField = 'notes',
  compact = false,
}) => {
  const { updateJob, showToast } = useApp();

  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // Sync initial content from job record
  useEffect(() => {
    const initialText =
      (targetField === 'problemFound'
        ? job.problemFound
        : targetField === 'solutionProvided'
        ? job.solutionProvided
        : job.notes) || '';
    setNotes(initialText);
    setIsModified(false);
  }, [job.id, job.notes, job.problemFound, job.solutionProvided, targetField]);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      const trimmed = notes.trim();
      const updates: Partial<Job> = {};

      if (targetField === 'problemFound') {
        updates.problemFound = trimmed;
      } else if (targetField === 'solutionProvided') {
        updates.solutionProvided = trimmed;
      } else {
        updates.notes = trimmed;
      }

      await updateJob(job.id, updates);
      setIsModified(false);
      showToast('Notes saved for job ' + job.jobId, 'success');
      onNotesSaved?.(trimmed);
    } catch (err) {
      showToast('Error saving notes. Please retry.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear current notes for this job?')) {
      setNotes('');
      setIsModified(true);
    }
  };

  const handleCopy = () => {
    if (!notes.trim()) return;
    navigator.clipboard.writeText(notes.trim());
    setCopied(true);
    showToast('Notes copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id={`job-notes-${job.id}`}
      className={`rounded-2xl border transition-all ${
        compact
          ? 'p-3 bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
          : 'p-3.5 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-xs'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>Site & Job Notes</span>
              {isModified && (
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md">
                  Unsaved
                </span>
              )}
            </h4>
            {!compact && (
              <p className="text-[11px] text-slate-500">
                Write field observations, customer instructions, or job remarks
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {notes.trim() && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy notes"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Clear notes"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notes Textarea */}
      <div className="relative">
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setIsModified(true);
          }}
          placeholder="Type on-site notes, equipment serial numbers, customer remarks, or inspection details here..."
          rows={compact ? 2 : 3}
          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-all resize-y min-h-[60px]"
        />
      </div>

      {/* Footer Action Bar */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400">
          {notes.length > 0 ? `${notes.length} characters` : 'No notes added'}
        </span>

        <button
          type="button"
          onClick={handleSaveNotes}
          disabled={isSaving || !isModified}
          className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isModified
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save Notes'}</span>
        </button>
      </div>
    </div>
  );
};
