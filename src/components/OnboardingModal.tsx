import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, ArrowRight, ArrowLeft, Building2, CheckCircle2, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { createBusiness } = useApp();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    type: 'CCTV & Security',
    customType: '',
    logo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=150&auto=format&fit=crop&q=80',
    mobile: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pin: '',
    gstNumber: '',
    currency: '₹',
    firstCategory: 'Camera & NVR Services',
  });

  if (!isOpen) return null;

  const businessTypes = [
    'CCTV & Security',
    'Solar',
    'AC Service',
    'Electrical',
    'Plumbing',
    'Computer Repair',
    'Printer Repair',
    'Mobile Repair',
    'Appliance Repair',
    'Networking',
    'Cleaning',
    'Other Custom',
  ];

  const handleNext = () => {
    if (step < 10) {
      setStep((prev) => prev + 1);
    } else {
      // Final step submit
      const finalType = formData.type === 'Other Custom' ? formData.customType || 'Custom Service' : formData.type;
      createBusiness(
        {
          name: formData.name || 'My Service Business',
          type: finalType,
          logo: formData.logo,
          mobile: formData.mobile || '+91 98765 00000',
          whatsapp: formData.whatsapp || formData.mobile || '+91 98765 00000',
          email: formData.email || 'contact@servicebiz.com',
          address: formData.address || 'Main Service Plaza',
          city: formData.city || 'New Delhi',
          state: formData.state || 'Delhi',
          pin: formData.pin || '110001',
          gstNumber: formData.gstNumber,
          currency: formData.currency,
        },
        formData.firstCategory
      );
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Step Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span className="text-indigo-600 dark:text-indigo-400">Step {step} of 10</span>
            <span>Onboarding Wizard</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 10) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dynamic Wizard Steps */}
        <div className="min-h-[260px] flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 1: Business Name</h2>
              <p className="text-xs text-slate-500">What is the official brand or company name of your business?</p>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Solar & Electrical Solutions"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-600 text-sm"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 2: Business Category / Industry</h2>
              <p className="text-xs text-slate-500">ServiFlow supports all field service industries.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {businessTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      formData.type === t
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {formData.type === 'Other Custom' && (
                <input
                  type="text"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                  placeholder="Specify Custom Industry (e.g. Fire Safety)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 3: Business Logo URL</h2>
              <p className="text-xs text-slate-500">Provide an image URL for your business logo (or use default placeholder).</p>
              <input
                type="text"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 text-xs"
              />
              {formData.logo && (
                <div className="flex items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <img src={formData.logo} alt="Logo preview" className="w-12 h-12 object-cover rounded-lg border" />
                  <span className="text-xs text-slate-500">Logo Preview</span>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 4: Primary Mobile Number</h2>
              <p className="text-xs text-slate-500">Used for customer dispatch & SMS notifications.</p>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 5: WhatsApp Business Number</h2>
              <p className="text-xs text-slate-500">Used to send automated quotes, invoices & job alerts to customers.</p>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
              />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 6: Business Email</h2>
              <p className="text-xs text-slate-500">Official email for invoices and system reports.</p>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@mycompany.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
              />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 7: Office Address & Location</h2>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street Address / Building"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <input
                  type="text"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="PIN Code"
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 8: GST / Tax Registration (Optional)</h2>
              <p className="text-xs text-slate-500">If registered, enter your GSTIN or Tax ID for official invoices.</p>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="e.g. 07AAAAA0000A1Z5"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm uppercase"
              />
            </div>
          )}

          {step === 9 && (
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 9: Billing Currency</h2>
              <p className="text-xs text-slate-500">Select the currency symbol for quotes, invoices, and payment reports.</p>
              <div className="grid grid-cols-4 gap-3">
                {['₹', '$', '€', '£', 'AED', 'SAR', 'S$', 'RM'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: curr })}
                    className={`py-3 rounded-xl border font-bold text-base transition-all ${
                      formData.currency === curr
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Step 10: First Service Category</h2>
              <p className="text-xs text-slate-500">What is the primary service category your team offers?</p>
              <input
                type="text"
                value={formData.firstCategory}
                onChange={(e) => setFormData({ ...formData, firstCategory: e.target.value })}
                placeholder="e.g. AC Deep Cleaning, CCTV Wiring, Panel Maintenance"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-sm"
              />
            </div>
          )}
        </div>

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border ${
              step === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md"
          >
            {step === 10 ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Complete Onboarding
              </>
            ) : (
              <>
                Next Step <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
