import React from 'react';
import { Shield, ArrowLeft, Lock, MapPin, Camera, Mic, Database, Mail, ExternalLink, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

interface PrivacyPolicyViewProps {
  onBack?: () => void;
}

export const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-6 sm:py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                ServiFlow Privacy Policy
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Effective Date: September 2026 • Version 1.0 (Google Play Compliant)
              </p>
            </div>
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 font-bold text-xs cursor-pointer transition-all shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </button>
          )}
        </div>

        {/* Content Container */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-8 text-sm leading-relaxed">

          {/* Section 1: Introduction */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
              <Shield className="w-5 h-5 shrink-0" />
              <h2>1. Introduction & Overview</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              ServiFlow (operated and developed by <strong>Unique Solutions</strong>) is an enterprise field service operations and job workflow management platform designed for service companies, contractors, technicians, and business managers across CCTV, Solar, HVAC, Electrical, Plumbing, and Equipment Repair sectors.
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              We respect your privacy and are committed to safeguarding personal and operational business data. This Privacy Policy details how our mobile application and web portal collect, use, store, and protect your information in compliance with the Google Play Developer Program Policies and international data privacy regulations.
            </p>
          </section>

          {/* Section 2: Information Collected */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
              <Database className="w-5 h-5 shrink-0" />
              <h2>2. Information We Collect & Device Permissions</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              To provide core field workforce management and billing capabilities, ServiFlow requests specific device permissions and collects necessary operational data:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Geographic Location (GPS)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Used solely when field staff actively punch attendance, calculate travel distance to job locations, or geotag completed work orders. We do NOT track location when the app is closed.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Camera & Photo Library</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Used by technicians to photograph installation proof, capture equipment barcodes, and record customer sign-off signatures on digital job sheets.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                  <Mic className="w-4 h-4 text-amber-600" />
                  <span>Microphone / Audio</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Optional hands-free voice note transcription for technicians logging diagnostic notes while handling equipment on-site.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-xs">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>User & Customer Contact Data</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customer names, service addresses, and phone numbers entered by business owners are utilized strictly to issue estimates, dispatch work orders, and generate invoices.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Data Security & Multi-Tenant Isolation */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
              <Lock className="w-5 h-5 shrink-0" />
              <h2>3. Data Security & Storage</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              All application communications are encrypted in transit using industry-standard Transport Layer Security (TLS 1.3 / HTTPS). Data is stored in enterprise Google Cloud Firestore infrastructure with strict multi-tenant access control policies (<code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">businessId</code> isolation). No other company or tenant has access to your customer databases or financial invoices.
            </p>
          </section>

          {/* Section 4: Data Sharing & Third-Party Services */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h2>4. Third-Party Service Providers</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              We do <strong>NOT</strong> sell, monetize, or rent user personal data, customer contacts, or financial books to data brokers, advertisers, or third parties. We utilize reputable cloud service infrastructure partners solely to deliver app functions:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400 text-xs">
              <li><strong>Google Firebase:</strong> Secure user authentication, encrypted database, and cloud asset storage.</li>
              <li><strong>WhatsApp Cloud API / Deep Links:</strong> Allowing business owners to send invoice PDFs and service updates directly to their customers via WhatsApp.</li>
            </ul>
          </section>

          {/* Section 5: Data Retention & Account Deletion */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
              <Shield className="w-5 h-5 shrink-0" />
              <h2>5. Data Retention & Account Deletion (Google Play Compliance)</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              In full compliance with Google Play Store User Data policies, users have the absolute right to request permanent deletion of their account and all associated customer and business records:
            </p>
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 space-y-2">
              <div className="font-bold text-xs text-indigo-900 dark:text-indigo-200">
                How to Request Account & Data Deletion:
              </div>
              <p className="text-xs text-indigo-800 dark:text-indigo-300">
                1. Navigate to <strong>Settings &gt; System Maintenance &gt; Reset/Delete Data</strong> inside the application, OR<br />
                2. Email our support team directly at{' '}
                <a href="mailto:uniquesolutions108@gmail.com" className="font-bold underline">
                  uniquesolutions108@gmail.com
                </a>{' '}
                with your registered business name and mobile number. Your account and all stored records will be permanently removed within 48 hours.
              </p>
            </div>
          </section>

          {/* Section 6: Contact Information */}
          <section className="space-y-2.5 border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-base">
              <Mail className="w-5 h-5 shrink-0" />
              <h2>6. Developer & Support Contact</h2>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-xs">
              If you have any questions, feedback, or privacy-related requests concerning this policy or the ServiFlow mobile app, please contact:
            </p>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-1">
              <div><strong>Developer:</strong> Unique Solutions</div>
              <div><strong>Email:</strong> <a href="mailto:uniquesolutions108@gmail.com" className="text-indigo-600 dark:text-indigo-400 underline">uniquesolutions108@gmail.com</a></div>
              <div><strong>Product:</strong> ServiFlow — Field Operations & Workforce Management</div>
              <div><strong>Hosting:</strong> Google Cloud & Firebase (serviceflow-969f5.web.app)</div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pb-8">
          © {new Date().getFullYear()} Unique Solutions • ServiFlow. All rights reserved.
        </div>

      </div>
    </div>
  );
};
