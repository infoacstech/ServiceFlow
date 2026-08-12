import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Job, JobStatus } from '../types';
import { DigitalSignatureCanvas } from '../components/DigitalSignatureCanvas';
import { VoiceNotesRecorder } from '../components/VoiceNotesRecorder';
import {
  Briefcase,
  Navigation,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Camera,
  Package,
  Star,
  FileCheck2,
  Send,
  AlertTriangle,
  Play,
  Check,
  Sparkles,
} from 'lucide-react';

export const TechnicianView: React.FC = () => {
  const {
    jobs,
    customers,
    staff,
    inventory,
    currentUser,
    updateJobStatus,
    completeJob,
    currentBusiness,
    isOffline,
    pendingSyncQueue,
  } = useApp();

  // Filter jobs assigned to this technician or all jobs if testing
  const techJobs = (jobs || []).filter((j) => j.assignedStaffId === currentUser?.id || currentUser?.role !== 'technician');
  const activeJob = techJobs.find((j) => j.status !== 'completed' && j.status !== 'closed') || techJobs[0];

  const [selectedJob, setSelectedJob] = useState<Job | null>(activeJob || null);
  const [completionStep, setCompletionStep] = useState<1 | 2 | 3 | 4>(1);

  // Completion Form State
  const [problemFound, setProblemFound] = useState('');
  const [solutionProvided, setSolutionProvided] = useState('');
  const [rating, setRating] = useState(5);
  const [signature, setSignature] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<{ inventoryId: string; quantity: number }[]>([]);

  // Photo URLs
  const [beforePhoto, setBeforePhoto] = useState<string>(
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
  );
  const [afterPhoto, setAfterPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80'
  );

  if (!selectedJob) {
    return (
      <div className="p-8 text-center text-slate-500">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">All Jobs Completed!</h3>
        <p className="text-xs">No active field jobs currently assigned to you.</p>
      </div>
    );
  }

  const customer = (customers || []).find((c) => c.id === selectedJob.customerId);

  const handleStatusChange = (newStatus: JobStatus) => {
    updateJobStatus(selectedJob.id, newStatus);
    setSelectedJob({ ...selectedJob, status: newStatus });
  };

  const handleFinalSubmit = () => {
    completeJob(selectedJob.id, {
      problemFound: problemFound || 'Equipment component failure detected during diagnostic.',
      solutionProvided: solutionProvided || 'Replaced damaged parts, calibrated unit, and verified live operating metrics.',
      customerRating: rating,
      customerSignature: signature,
      materialsUsed: selectedMaterials.map((m) => {
        const invItem = (inventory || []).find((i) => i.id === m.inventoryId);
        return {
          inventoryItemId: m.inventoryId,
          name: invItem?.name || 'Spare Part',
          quantity: m.quantity,
          unitPrice: invItem?.sellingPrice || 0,
        };
      }),
      afterPhotos: [afterPhoto],
    });
  };

  const addMaterialItem = (inventoryId: string) => {
    setSelectedMaterials((prev) => {
      const exists = prev.find((m) => m.inventoryId === inventoryId);
      if (exists) {
        return prev.map((m) => (m.inventoryId === inventoryId ? { ...m, quantity: m.quantity + 1 } : m));
      }
      return [...prev, { inventoryId, quantity: 1 }];
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 pb-20 animate-in fade-in">
      {/* Mobile Field Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Technician Mobile App
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Offline Cache Ready
            </span>
          </div>
          <h2 className="text-lg font-black mt-1">Field Dispatch Console</h2>
          <p className="text-xs text-slate-300">Job {selectedJob.jobId} • {customer?.name}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2.5 py-1 rounded-xl uppercase">
            {selectedJob.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Quick Job Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {techJobs.map((j) => (
          <button
            key={j.id}
            onClick={() => setSelectedJob(j)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedJob.id === j.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700'
            }`}
          >
            {j.jobId}
          </button>
        ))}
      </div>

      {/* Customer Location & Contact Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{customer?.name}</h3>
            {customer?.companyName && <p className="text-xs text-indigo-600 font-semibold">{customer.companyName}</p>}
          </div>

          <a
            href={`tel:${customer?.mobile}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-700"
          >
            <Phone className="w-3.5 h-3.5" /> Call Client
          </a>
        </div>

        <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
          <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-900 dark:text-slate-100">Site Address</div>
            <div>{selectedJob.location}</div>
          </div>
        </div>

        <div className="text-xs text-slate-600 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200/60">
          <span className="font-bold text-amber-900 dark:text-amber-200 block mb-0.5">Instructions:</span>
          {selectedJob.description}
        </div>

        {/* Voice-To-Text Notes Recording Component for On-Site Technicians */}
        <VoiceNotesRecorder
          job={selectedJob}
          onNotesSaved={(updatedNotes) => {
            setSelectedJob({ ...selectedJob, notes: updatedNotes });
          }}
        />
      </div>

      {/* Multi-Step Technician Execution Workflow */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">Workflow Progress</h3>
          <span className="text-xs font-bold text-indigo-600 uppercase">{selectedJob.status.replace('_', ' ')}</span>
        </div>

        {/* Action Buttons depending on status */}
        {selectedJob.status === 'assigned' && (
          <button
            onClick={() => handleStatusChange('accepted')}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <Check className="w-4 h-4" /> Accept Assigned Job
          </button>
        )}

        {selectedJob.status === 'accepted' && (
          <button
            onClick={() => handleStatusChange('on_the_way')}
            className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <Navigation className="w-4 h-4 animate-bounce" /> Start Navigation (On The Way)
          </button>
        )}

        {selectedJob.status === 'on_the_way' && (
          <button
            onClick={() => handleStatusChange('started')}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md"
          >
            <Play className="w-4 h-4" /> Arrived at Site & Start Work
          </button>
        )}

        {(selectedJob.status === 'started' || selectedJob.status === 'in_progress') && (
          <div className="space-y-4">
            {/* Completion Form Tabs */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b pb-2">
              <span className={completionStep === 1 ? 'text-indigo-600 font-black' : ''}>1. Diagnosis</span>
              <span className={completionStep === 2 ? 'text-indigo-600 font-black' : ''}>2. Parts Used</span>
              <span className={completionStep === 3 ? 'text-indigo-600 font-black' : ''}>3. Photos</span>
              <span className={completionStep === 4 ? 'text-indigo-600 font-black' : ''}>4. Signoff</span>
            </div>

            {/* Step 1: Diagnosis & Solution */}
            {completionStep === 1 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Problem Found on Site *</label>
                  <textarea
                    value={problemFound}
                    onChange={(e) => setProblemFound(e.target.value)}
                    placeholder="e.g. BNC connector burnt out, power supply fluctuating"
                    className="w-full p-3 rounded-xl border bg-slate-50 h-20"
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Solution & Work Performed *</label>
                  <textarea
                    value={solutionProvided}
                    onChange={(e) => setSolutionProvided(e.target.value)}
                    placeholder="e.g. Replaced connectors, re-aligned camera angle, tested NVR feed"
                    className="w-full p-3 rounded-xl border bg-slate-50 h-20"
                  />
                </div>

                <button
                  onClick={() => setCompletionStep(2)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                >
                  Next: Add Spare Parts Used →
                </button>
              </div>
            )}

            {/* Step 2: Parts & Inventory Deductions */}
            {completionStep === 2 && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100">Select Inventory Parts Used</div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addMaterialItem(item.id)}
                      className="p-2.5 rounded-xl border hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-bold">{item.name}</div>
                        <div className="text-[10px] text-slate-400">Stock: {item.currentStock} {item.unit}</div>
                      </div>
                      <span className="text-xs text-indigo-600 font-bold">+ Add Item</span>
                    </div>
                  ))}
                </div>

                {selectedMaterials.length > 0 && (
                  <div className="p-3 bg-indigo-50 rounded-xl space-y-1">
                    <div className="font-bold text-indigo-900">Items to deduct from inventory:</div>
                    {selectedMaterials.map((m) => {
                      const invItem = (inventory || []).find((i) => i.id === m.inventoryId);
                      return (
                        <div key={m.inventoryId} className="flex justify-between text-indigo-700">
                          <span>{invItem?.name}</span>
                          <span className="font-bold">x {m.quantity} {invItem?.unit}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setCompletionStep(1)}
                    className="w-1/2 py-2.5 rounded-xl border font-bold text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setCompletionStep(3)}
                    className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    Next: Photos →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Photo Evidence */}
            {completionStep === 3 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold block mb-1">Before Work Photo Evidence</label>
                  <div className="flex items-center gap-2">
                    <img src={beforePhoto} alt="Before" className="w-16 h-16 rounded-xl object-cover border" />
                    <input
                      type="text"
                      value={beforePhoto}
                      onChange={(e) => setBeforePhoto(e.target.value)}
                      className="flex-1 p-2 rounded-xl border bg-slate-50 text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">After Work Photo Evidence</label>
                  <div className="flex items-center gap-2">
                    <img src={afterPhoto} alt="After" className="w-16 h-16 rounded-xl object-cover border" />
                    <input
                      type="text"
                      value={afterPhoto}
                      onChange={(e) => setAfterPhoto(e.target.value)}
                      className="flex-1 p-2 rounded-xl border bg-slate-50 text-[11px]"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCompletionStep(2)}
                    className="w-1/2 py-2.5 rounded-xl border font-bold text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setCompletionStep(4)}
                    className="w-1/2 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    Next: Signoff →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Digital Signature & Star Rating */}
            {completionStep === 4 && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold block mb-1 text-slate-900 dark:text-slate-100">Customer Star Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`p-2 rounded-xl border transition-all ${
                          rating >= s ? 'bg-amber-400 text-slate-950 border-amber-400' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold block mb-1">Customer Digital Signature</label>
                  <DigitalSignatureCanvas onSave={(sig) => setSignature(sig)} />
                </div>

                <button
                  onClick={handleFinalSubmit}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  <FileCheck2 className="w-5 h-5" /> Submit Completed Job & Report
                </button>
              </div>
            )}
          </div>
        )}

        {selectedJob.status === 'completed' && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-950 border border-emerald-200 text-xs space-y-2">
            <div className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Job Successfully Completed
            </div>
            <div><strong>Summary:</strong> {selectedJob.solutionProvided}</div>
            <div><strong>Rating:</strong> ⭐ {selectedJob.customerRating || 5}/5</div>
            {selectedJob.customerSignature && (
              <div className="mt-2 pt-2 border-t border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold block mb-1">Customer Signature Record:</span>
                <img src={selectedJob.customerSignature} alt="Signature" className="h-12 bg-white rounded border" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
