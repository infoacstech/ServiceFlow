import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Camera,
  Star,
  FileCheck2,
  Package,
  Wrench,
  DollarSign,
  Printer,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Job, InventoryItem, Customer, User, Business, PaymentMethod } from '../types';
import { DigitalSignatureCanvas } from './DigitalSignatureCanvas';
import { PhotoEvidenceUploader } from './PhotoEvidenceUploader';
import { printJobSheetDocument } from '../utils/jobReportPdfHelper';
import { sendJobCompletionSummaryToCustomer } from '../utils/whatsappHelper';

interface JobCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  customer?: Customer | null;
  technician?: User | null;
  inventory: InventoryItem[];
  business: Business;
  onComplete: (data: {
    problemFound: string;
    solutionProvided: string;
    customerRating: number;
    customerSignature: string;
    materialsUsed: {
      inventoryItemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
    }[];
    beforePhotos: string[];
    afterPhotos: string[];
    paymentCollected?: {
      amount: number;
      method: PaymentMethod;
      referenceNumber?: string;
    };
  }) => void;
}

export const JobCompletionModal: React.FC<JobCompletionModalProps> = ({
  isOpen,
  onClose,
  job,
  customer,
  technician,
  inventory,
  business,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [problemFound, setProblemFound] = useState(
    job.problemFound || job.notes || 'Routine check & maintenance'
  );
  const [solutionProvided, setSolutionProvided] = useState(
    job.solutionProvided || 'Repaired faulty parts, tested circuits and verified normal functionality with client.'
  );
  const [selectedMaterials, setSelectedMaterials] = useState<
    { inventoryId: string; quantity: number }[]
  >([]);
  const [beforePhoto, setBeforePhoto] = useState<string>(
    job.beforePhotos?.[0] ||
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80'
  );
  const [afterPhoto, setAfterPhoto] = useState<string>(
    job.afterPhotos?.[0] ||
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=80'
  );
  const [rating, setRating] = useState<number>(job.customerRating || 5);
  const [signature, setSignature] = useState<string>(job.customerSignature || '');

  // Optional on-site payment collection
  const [collectPaymentNow, setCollectPaymentNow] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>(
    job.estimatedAmount || 0
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentRef, setPaymentRef] = useState('');

  if (!isOpen) return null;

  const addMaterial = (invId: string) => {
    setSelectedMaterials((prev) => {
      const exists = prev.find((m) => m.inventoryId === invId);
      if (exists) {
        return prev.map((m) =>
          m.inventoryId === invId ? { ...m, quantity: m.quantity + 1 } : m
        );
      }
      return [...prev, { inventoryId: invId, quantity: 1 }];
    });
  };

  const removeMaterial = (invId: string) => {
    setSelectedMaterials((prev) => prev.filter((m) => m.inventoryId !== invId));
  };

  const handleSubmit = () => {
    const materialsPayload = selectedMaterials.map((m) => {
      const invItem = inventory.find((i) => i.id === m.inventoryId);
      return {
        inventoryItemId: m.inventoryId,
        name: invItem?.name || 'Spare Part',
        quantity: m.quantity,
        unitPrice: invItem?.sellingPrice || 0,
      };
    });

    const paymentPayload =
      collectPaymentNow && Number(paymentAmount) > 0
        ? {
            amount: Number(paymentAmount),
            method: paymentMethod,
            referenceNumber: paymentRef || undefined,
          }
        : undefined;

    onComplete({
      problemFound: problemFound || 'Diagnostic performed on site equipment.',
      solutionProvided:
        solutionProvided || 'Repaired fault, calibrated parts, and verified operation.',
      customerRating: rating,
      customerSignature: signature,
      materialsUsed: materialsPayload,
      beforePhotos: beforePhoto ? [beforePhoto] : [],
      afterPhotos: afterPhoto ? [afterPhoto] : [],
      paymentCollected: paymentPayload,
    });

    onClose();
  };

  const handlePrintPreview = () => {
    printJobSheetDocument({
      job: {
        ...job,
        problemFound,
        solutionProvided,
        customerRating: rating,
        customerSignature: signature,
        beforePhotos: beforePhoto ? [beforePhoto] : [],
        afterPhotos: afterPhoto ? [afterPhoto] : [],
        materialsUsed: selectedMaterials.map((m) => {
          const invItem = inventory.find((i) => i.id === m.inventoryId);
          return {
            inventoryItemId: m.inventoryId,
            name: invItem?.name || 'Spare Part',
            quantity: m.quantity,
            unitPrice: invItem?.sellingPrice || 0,
          };
        }),
      },
      customer,
      technician,
      business,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Digital Work Order Sign-Off
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
              Complete Job: {job.jobId}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-center bg-slate-100/50 dark:bg-slate-800/30">
          {[
            { stepNum: 1, label: '1. Diagnosis' },
            { stepNum: 2, label: '2. Spares' },
            { stepNum: 3, label: '3. Photos' },
            { stepNum: 4, label: '4. Sign & Pay' },
          ].map((s) => (
            <button
              key={s.stepNum}
              type="button"
              onClick={() => setStep(s.stepNum as any)}
              className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                step === s.stepNum
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/40 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* STEP 1: Diagnosis & Work Performed */}
          {step === 1 && (
            <div className="space-y-3.5">
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-slate-700 dark:text-slate-300">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 text-xs mb-1">
                  Customer & Job Scope
                </div>
                <div>Client: <strong>{customer?.name || 'Customer'}</strong> ({customer?.mobile || 'No phone'})</div>
                <div>Location: {job.location || customer?.address || 'On-site'}</div>
                <div>Original Request: {job.description}</div>
              </div>

              <div>
                <label className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  Problem Found / Diagnostics *
                </label>
                <textarea
                  value={problemFound}
                  onChange={(e) => setProblemFound(e.target.value)}
                  placeholder="Describe the issue observed upon on-site inspection..."
                  rows={3}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                  Solution Provided & Work Completed *
                </label>
                <textarea
                  value={solutionProvided}
                  onChange={(e) => setSolutionProvided(e.target.value)}
                  placeholder="Describe parts replaced, calibrations performed, and testing done..."
                  rows={3}
                  className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <span>Next: Spare Parts Used</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Spare Parts & Inventory */}
          {step === 2 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">
                    Parts & Materials Consumed
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Items selected will be recorded on the job sheet and billed.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {inventory.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                    No spare parts listed in business inventory.
                  </div>
                ) : (
                  inventory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => addMaterial(item.id)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          In Stock: {item.currentStock} {item.unit} • Price: {business.currency}{item.sellingPrice}
                        </div>
                      </div>
                      <span className="text-xs text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 rounded-lg">
                        + Add Part
                      </span>
                    </div>
                  ))
                )}
              </div>

              {selectedMaterials.length > 0 && (
                <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/50 rounded-2xl border border-indigo-200 dark:border-indigo-800/60 space-y-2">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200 text-xs">
                    Selected Spares for this Job:
                  </div>
                  {selectedMaterials.map((m) => {
                    const invItem = inventory.find((i) => i.id === m.inventoryId);
                    return (
                      <div
                        key={m.inventoryId}
                        className="flex items-center justify-between text-indigo-800 dark:text-indigo-200 text-xs"
                      >
                        <span>{invItem?.name || 'Part'}</span>
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold">
                            x{m.quantity} {invItem?.unit} ({business.currency}{m.quantity * (invItem?.sellingPrice || 0)})
                          </span>
                          <button
                            type="button"
                            onClick={() => removeMaterial(m.inventoryId)}
                            className="p-1 text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Next: Photo Evidence</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Photo Evidence */}
          {step === 3 && (
            <div className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
                <div className="font-bold text-xs">On-Site Photographic Proof</div>
                <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  Capture before & after photos using your mobile camera to protect against false warranty claims.
                </div>
              </div>

              <PhotoEvidenceUploader
                id="modal-before-photo"
                label="Before Work Photo"
                badge="Initial Fault"
                subLabel="Site/equipment condition before servicing"
                value={beforePhoto}
                onChange={setBeforePhoto}
              />

              <PhotoEvidenceUploader
                id="modal-after-photo"
                label="After Work Photo"
                badge="Finished Job"
                subLabel="Operational equipment after repair/installation"
                value={afterPhoto}
                onChange={setAfterPhoto}
              />

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer inline-flex items-center gap-1 text-slate-600 dark:text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Next: Customer Sign-off</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Rating, E-Signature, and Optional Payment Collection */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Customer Rating */}
              <div>
                <label className="font-bold block mb-1 text-slate-900 dark:text-slate-100">
                  Customer Satisfaction Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        rating >= s
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-black scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Digital Signature Canvas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-900 dark:text-slate-100">
                    Customer Sign-off Signature *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Sign with finger on screen
                  </span>
                </div>
                <DigitalSignatureCanvas
                  onSave={setSignature}
                  initialSignature={signature}
                />
              </div>

              {/* Optional On-Site Payment Handover */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      Collect Payment On Site Now?
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={collectPaymentNow}
                    onChange={(e) => setCollectPaymentNow(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </div>

                {collectPaymentNow && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Amount ({business.currency})
                        </label>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) =>
                            setPaymentAmount(
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
                          Payment Mode
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as any)}
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs uppercase"
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI (PhonePe / GPay)</option>
                          <option value="bank_transfer">Bank Transfer / IMPS</option>
                          <option value="cheque">Cheque</option>
                        </select>
                      </div>
                    </div>
                    {paymentMethod === 'upi' && (
                      <input
                        type="text"
                        placeholder="UPI UTR / Reference No. (e.g. 412356789012)"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <FileCheck2 className="w-5 h-5" />
                  <span>Submit Work Order & Sign-Off</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrintPreview}
                    className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Preview Job Sheet</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
