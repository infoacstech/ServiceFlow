import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { BrandLogo } from '../components/BrandLogo';
import { calculateAnnualPricing } from '../utils/planUtils';
import { SAAS_SUPPORT_EMAIL } from '../utils/subscriptionBillingUtils';
import heroFieldOpsImg from '../assets/images/hero_field_ops_1794635585931.jpg';
import workflowDispatchDeskImg from '../assets/images/workflow_dispatch_desk_1794635587033.jpg';
import industryHvacSolarImg from '../assets/images/industry_hvac_solar_1794635587073.jpg';

interface LandingViewProps {
  onOpenAuth: (tab: 'login' | 'register', planName?: string) => void;
  onOpenPrivacy: () => void;
  onOpenCustomerPortal: () => void;
}

type IndustryKey = 'cctv' | 'solar' | 'hvac' | 'electrical';

interface IndustryWorkflow {
  key: IndustryKey;
  label: string;
  summary: string;
  typicalCycle: string;
  steps: {
    step: string;
    detail: string;
  }[];
  trackedAsset: string;
  proofMetric: string;
  proofContext: string;
}

const INDUSTRY_WORKFLOWS: IndustryWorkflow[] = [
  {
    key: 'cctv',
    label: 'CCTV & Security',
    summary:
      'Track site surveys, NVR/camera serials, cable inventory deductions, and annual maintenance visits per commercial or residential site.',
    typicalCycle: 'Survey -> Quote -> Installation -> Annual AMC',
    steps: [
      { step: 'Site Enquiry & Quote', detail: 'Itemized GST quotation for cameras, NVR channels, HDD, and cabling.' },
      { step: 'Technician Dispatch', detail: 'Assign installer with site address, contact number, and parts kit.' },
      { step: 'Photo & Signature Proof', detail: 'Capture live rack wiring photos and customer sign-off before closing.' },
      { step: 'AMC Visit Reminders', detail: 'Schedule quarterly health checks and renewal alerts automatically.' },
    ],
    trackedAsset: 'Camera Channels · NVR Serials · PoE Switches',
    proofMetric: '3.2x faster',
    proofContext: 'Quotation-to-job handoff across multi-site security installations',
  },
  {
    key: 'solar',
    label: 'Solar & Inverters',
    summary:
      'Coordinate rooftop EPC installations, net-metering follow-ups, string inverter warranty logs, and scheduled panel cleaning crews.',
    typicalCycle: 'Lead -> Site Load Check -> Install -> Periodic Cleaning',
    steps: [
      { step: 'kW Capacity Estimate', detail: 'Send clear bill-of-materials estimate with GST split and payment terms.' },
      { step: 'Crew Attendance & Job', detail: 'Track field technician check-in time and assigned roof inspection job.' },
      { step: 'Serial & Warranty Log', detail: 'Store inverter and battery warranty dates against customer profile.' },
      { step: 'Scheduled Maintenance', detail: 'Automate recurring panel wash and generation check contracts.' },
    ],
    trackedAsset: 'Inverters · String Panels · Lithium Batteries',
    proofMetric: '0 missed',
    proofContext: 'Warranty & quarterly panel maintenance cycles per rooftop site',
  },
  {
    key: 'hvac',
    label: 'AC & HVAC',
    summary:
      'Handle peak summer breakdown rushes, gas-charging spare consumption, multi-unit chiller servicing, and commercial AMC contracts.',
    typicalCycle: 'Call Intake -> Breakdown Dispatch -> Parts Log -> GST Invoice',
    steps: [
      { step: 'Priority Breakdown Ticket', detail: 'Log unit model, complaint symptom, and urgent slot on team calendar.' },
      { step: 'Parts Stock Deduction', detail: 'Deduct refrigerant, capacitors, and copper piping directly from stock.' },
      { step: 'On-Site Payment Record', detail: 'Technician records UPI, cash, or partial settlement from mobile.' },
      { step: 'Seasonal Service Ledger', detail: 'Track every split, VRV, and ductable unit service history by customer.' },
    ],
    trackedAsset: 'Split Units · VRV Chillers · Refrigerant Stock',
    proofMetric: '45 sec',
    proofContext: 'Average time to convert completed field job into a GST tax invoice',
  },
  {
    key: 'electrical',
    label: 'Electrical & Appliances',
    summary:
      'Keep daily repair teams organized across RO purifiers, DG sets, lifts, UPS systems, and commercial facility maintenance contracts.',
    typicalCycle: 'Complaint -> Technician Visit -> Test Checklist -> Customer Portal',
    steps: [
      { step: 'Instant Customer Lookup', detail: 'Pull full past visit history and pending dues by mobile number.' },
      { step: 'Role-Based Staff Access', detail: 'Technicians see only their assigned jobs while owners track margins.' },
      { step: 'Voice & Photo Job Notes', detail: 'Log field diagnosis with voice notes and before/after site photos.' },
      { step: 'Self-Service Portal Link', detail: 'Share live job status, invoices, and service history with clients.' },
    ],
    trackedAsset: 'UPS & Inverters · RO Filters · Commercial Panels',
    proofMetric: '100% traceable',
    proofContext: 'Technician cash collections and daily settlement reconciliation',
  },
];

const FAQ_ITEMS = [
  {
    q: 'How does the 14-day free trial work?',
    a: 'When you create a new business workspace, you receive 14 days of full access to job management, technician scheduling, GST quotations, invoices, inventory, and AMC tracking without paying upfront. You can upgrade to an annual plan at any time from Settings.',
  },
  {
    q: 'Can field technicians use ServiFlow on their phones?',
    a: 'Yes. ServiFlow runs smoothly in mobile browsers and installs as a Progressive Web App (PWA) on Android and iOS. Technicians view only their assigned jobs, capture completion photos, collect digital customer signatures, and log expenses or payments on site.',
  },
  {
    q: 'Are GST quotations, invoices, and customer statements included?',
    a: 'Yes. You can create itemized GST quotations, convert approved quotes into job tickets or GST tax invoices in one click (with automatic CGST/SGST or IGST calculation), record partial or full payments, and download customer ledger statements.',
  },
  {
    q: 'Can I control what staff and technicians are allowed to see?',
    a: 'Yes. ServiFlow includes role-based access control for Business Owners, Managers, Receptionists, Accountants, and Technicians. Only authorized roles can view company profit reports, billing settings, or delete records.',
  },
  {
    q: 'What happens if I need more staff seats or monthly jobs later?',
    a: 'You can upgrade to a higher plan anytime or purchase Staff Expansion and Job Volume add-on packs directly from the Subscription tab inside your workspace.',
  },
];

export const LandingView: React.FC<LandingViewProps> = ({
  onOpenAuth,
  onOpenPrivacy,
  onOpenCustomerPortal,
}) => {
  const { plans, addonPacks, theme, toggleTheme, showToast } = useApp();

  const [selectedIndustry, setSelectedIndustry] = useState<IndustryKey>('cctv');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [deskImgFailed, setDeskImgFailed] = useState(false);
  const [industryImgFailed, setIndustryImgFailed] = useState(false);

  // Validated Onboarding Callback Form
  const [leadName, setLeadName] = useState('');
  const [leadBusiness, setLeadBusiness] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadTrade, setLeadTrade] = useState('CCTV & Security');
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  const activePlans = React.useMemo(() => {
    return (plans || [])
      .filter((p) => p.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
  }, [plans]);

  const activeAddons = React.useMemo(() => {
    return (addonPacks || []).filter((a) => a.isActive !== false);
  }, [addonPacks]);

  const activeIndustry =
    INDUSTRY_WORKFLOWS.find((w) => w.key === selectedIndustry) || INDUSTRY_WORKFLOWS[0];

  // Keep SEO canonical, OpenGraph URL, and Schema.org JSON-LD prices synced with live customizable plans
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;
    document.title = 'ServiFlow – Field Service & Job Management Software';

    const canonicalLink = document.getElementById('canonical-link') as HTMLLinkElement | null;
    if (canonicalLink) canonicalLink.href = canonicalUrl;

    const ogUrl = document.getElementById('og-url-meta') as HTMLMetaElement | null;
    if (ogUrl) ogUrl.content = canonicalUrl;

    const prices = activePlans
      .map((p) => calculateAnnualPricing(p.price, p.originalPrice, p.billingCycle).discountedAnnual)
      .filter((n) => n > 0);
    const lowPrice = prices.length ? Math.min(...prices) : 4999;
    const highPrice = prices.length ? Math.max(...prices) : 19999;

    const scriptId = 'serviflow-dynamic-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ServiFlow',
      url: canonicalUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, Android, iOS',
      description:
        'Manage field technicians, job tickets, AMC contracts, GST invoices, and spare parts inventory in one mobile-first platform built for service teams.',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'INR',
        lowPrice: String(lowPrice),
        highPrice: String(highPrice),
        offerCount: String(Math.max(1, activePlans.length)),
      },
    });
  }, [activePlans]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = leadName.trim();
    const cleanBusiness = leadBusiness.trim();
    const cleanPhoneDigits = leadPhone.replace(/[^0-9]/g, '');

    if (!cleanName || cleanName.length < 2) {
      setLeadError('Please enter your full name.');
      return;
    }
    if (!cleanBusiness || cleanBusiness.length < 2) {
      setLeadError('Please enter your business or agency name.');
      return;
    }
    if (cleanPhoneDigits.length < 10) {
      setLeadError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLeadError(null);
    setLeadSubmitted(true);

    const leadId = `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const leadPayload = {
      id: leadId,
      name: cleanName.slice(0, 120),
      business: cleanBusiness.slice(0, 150),
      phone: cleanPhoneDigits.slice(0, 20),
      trade: leadTrade.slice(0, 80),
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('serviflow_landing_leads') || '[]');
      existing.unshift(leadPayload);
      localStorage.setItem('serviflow_landing_leads', JSON.stringify(existing.slice(0, 20)));
    } catch {
      // ignore storage quota errors
    }

    try {
      await setDoc(doc(db, 'landingLeads', leadId), leadPayload);
    } catch {
      // fallback already saved locally if offline or rules pending deployment
    }

    showToast('Callback request saved! You can also start your 14-day trial right away.', 'success');
  };

  return (
    <div
      id="top"
      className="min-h-screen bg-[#F7F5F0] dark:bg-slate-950 text-stone-900 dark:text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white"
    >
      {/* Top Bar Contract: 3 zones, 1 row, gap-8, no extra badges or mode toggles */}
      <header className="sticky top-0 z-40 bg-[#F7F5F0]/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-stone-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Clean single-line brand wordmark */}
          <a
            href="#top"
            className="inline-flex items-center gap-2.5 text-lg font-display font-bold tracking-tight text-stone-900 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-indigo-600 rounded-md"
          >
            <BrandLogo size={28} />
            <span>ServiFlow</span>
          </a>

          {/* Zone 2: 4 concise single-line text nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600 dark:text-slate-300"
          >
            <a
              href="#capabilities"
              className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#industries"
              className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Industries
            </a>
            <a
              href="#pricing"
              className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              FAQ
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 min-h-[40px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Hero Copy */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-5">
                <p className="text-xs sm:text-sm font-medium text-stone-500 dark:text-slate-400">
                  CCTV · Solar · AC &amp; HVAC · Electrical · Plumbing · Repair Teams
                </p>

                <h1
                  className="font-display font-bold tracking-tight text-stone-900 dark:text-white leading-[1.08]"
                  style={{
                    fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                    textWrap: 'balance',
                  }}
                >
                  Run every field job, technician, and GST invoice in one place.
                </h1>

                <p className="text-base sm:text-lg text-stone-600 dark:text-slate-300 leading-relaxed max-w-xl">
                  ServiFlow replaces scattered WhatsApp chats, paper job slips, and spreadsheet ledgers with one mobile-first system built for Indian service and AMC businesses.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onOpenAuth('register')}
                    className="px-6 py-3 min-h-[44px] rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="px-4 py-3 min-h-[44px] text-sm font-semibold text-stone-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Sign in to workspace
                  </button>
                </div>

                <p className="text-xs text-stone-500 dark:text-slate-400">
                  14-day full access · No card required · Works on Desktop, Android &amp; iOS
                </p>
              </div>
            </div>

            {/* Hero Visual Asset (16:9 with stretch alignment & fallback) */}
            <div className="lg:col-span-6 flex">
              <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-800 bg-stone-200 dark:bg-slate-900 aspect-video lg:aspect-auto lg:min-h-[380px]">
                {!heroImgFailed ? (
                  <img
                    src={heroFieldOpsImg}
                    alt="Field service technician inspecting commercial security hardware and logging job status on a tablet"
                    referrerPolicy="no-referrer"
                    onError={() => setHeroImgFailed(true)}
                    className="w-full h-full object-cover lg:h-full"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 to-stone-200 dark:from-slate-900 dark:to-slate-800">
                    <BrandLogo size={48} />
                    <p className="mt-3 text-sm font-semibold text-stone-700 dark:text-slate-200">
                      ServiFlow Field Dispatch &amp; Technician Portal
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4-Column Operational Summary Strip below hero split */}
          <div className="mt-10 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 border border-stone-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 dark:divide-slate-800">
            <div className="p-5 sm:p-6">
              <p className="font-mono-tabular text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                14 Days
              </p>
              <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-slate-400">
                Full trial access before choosing an annual tier
              </p>
            </div>
            <div className="p-5 sm:p-6 border-l border-stone-200 dark:border-slate-800 lg:border-l-0">
              <p className="font-mono-tabular text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                6 Roles
              </p>
              <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-slate-400">
                Granular access from Owner down to Field Tech
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <p className="font-mono-tabular text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                CGST / IGST
              </p>
              <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-slate-400">
                Automated GST quotations, receipts &amp; statements
              </p>
            </div>
            <div className="p-5 sm:p-6 border-l border-stone-200 dark:border-slate-800 lg:border-l-0">
              <p className="font-mono-tabular text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                3 Languages
              </p>
              <p className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-slate-400">
                Available in English, Hindi, and Hinglish
              </p>
            </div>
          </div>
        </section>

        {/* Capabilities Section — Asymmetric Bento Grid */}
        <section
          id="capabilities"
          className="border-t border-stone-200 dark:border-slate-800 py-14 sm:py-20"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide">
                Core Platform Modules
              </p>
              <h2
                className="font-display font-bold tracking-tight text-stone-900 dark:text-white"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', textWrap: 'balance' }}
              >
                Built around the exact workflow of an on-site service business.
              </h2>
              <p className="text-sm sm:text-base text-stone-600 dark:text-slate-300 leading-relaxed">
                Every enquiry flows straight into a scheduled ticket, spare part consumption, GST invoice, and recurring AMC schedule without manual re-entry.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* 01. Marquee Capability (7 cols) */}
              <article className="lg:col-span-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
                <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <p className="text-xs text-stone-500 dark:text-slate-400">
                      Enquiries · Scheduling · Dispatch
                    </p>
                    <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white">
                      01. Enquiry to Job Dispatch
                    </h3>
                    <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                      Capture inbound customer calls, assign priority slots on the technician timeline calendar, and track open, in-progress, and pending jobs at a glance.
                    </p>
                  </div>
                  <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-slate-300">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>One-click conversion from customer enquiry to job ticket</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span>Conflict-free staff calendar timeline across all technicians</span>
                    </li>
                  </ul>
                </div>

                <div className="md:col-span-5 bg-stone-100 dark:bg-slate-800 min-h-[220px]">
                  {!deskImgFailed ? (
                    <img
                      src={workflowDispatchDeskImg}
                      alt="Service coordinator reviewing technician schedule calendar and GST service job sheets"
                      referrerPolicy="no-referrer"
                      onError={() => setDeskImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-xs text-stone-500 dark:text-slate-400">
                      Job Dispatch &amp; Schedule Workspace
                    </div>
                  )}
                </div>
              </article>

              {/* 02. Field Technician Mobile Log (5 cols) */}
              <article className="lg:col-span-5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Mobile PWA · Photos · Digital Sign-off
                  </p>
                  <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white">
                    02. Field Technician Mobile Log
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                    Technicians mark attendance, upload before/after site photos, record voice notes, and collect digital customer signatures right before closing a ticket.
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs text-stone-600 dark:text-slate-400">
                  <span>Daily Settlement Reconciliation</span>
                  <span className="font-mono-tabular font-semibold text-stone-900 dark:text-white">
                    Cash · UPI · Bank
                  </span>
                </div>
              </article>

              {/* 03. GST Quotations & Invoicing (5 cols) */}
              <article className="lg:col-span-5 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Quotations · Tax Invoices · Customer Ledger
                  </p>
                  <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white">
                    03. GST Billing &amp; Payment Tracking
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                    Send branded estimates with automatic CGST/SGST or IGST tax splits, convert accepted quotes to invoices, and send overdue reminders over WhatsApp.
                  </p>
                </div>
                <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs text-stone-600 dark:text-slate-400">
                  <span>Customer Self-Service Portal</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    Live Ticket &amp; Invoice View
                  </span>
                </div>
              </article>

              {/* 04. AMC Contracts & Spare Parts (7 cols) */}
              <article className="lg:col-span-7 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    Recurring AMC · Spare Parts · Profit Analytics
                  </p>
                  <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white">
                    04. AMC Contracts, Stock Ledger &amp; Expense Control
                  </h3>
                  <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                    Never miss a recurring maintenance visit or AMC renewal date. Track spare parts stock in and out per job alongside technician travel expenses to see true net profit per month.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-200 dark:border-slate-800 text-xs">
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white">AMC Renewals</p>
                    <p className="text-stone-500 dark:text-slate-400 mt-0.5">Scheduled visit &amp; expiry alerts</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white">Low-Stock Alerts</p>
                    <p className="text-stone-500 dark:text-slate-400 mt-0.5">Real-time spare parts ledger</p>
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 dark:text-white">Expense Approvals</p>
                    <p className="text-stone-500 dark:text-slate-400 mt-0.5">Fuel, parts &amp; travel claims</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Interactive Trade Workflow & Proof Section (Claim-to-Proof Adjacency) */}
        <section
          id="industries"
          className="border-t border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-14 sm:py-20"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-xl space-y-2">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide">
                  Trade-Specific Workflows
                </p>
                <h2
                  className="font-display font-bold tracking-tight text-stone-900 dark:text-white"
                  style={{ fontSize: 'clamp(1.75rem, 3vw, 2.35rem)', textWrap: 'balance' }}
                >
                  Select your service trade to inspect the daily workflow.
                </h2>
              </div>

              {/* Interactive Segmented Trade Tabs */}
              <div
                role="tablist"
                aria-label="Service trade workflows"
                className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700"
              >
                {INDUSTRY_WORKFLOWS.map((item) => {
                  const isActive = item.key === selectedIndustry;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setSelectedIndustry(item.key)}
                      className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-xs'
                          : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Interactive Trade Details */}
              <div className="lg:col-span-7 bg-[#F7F5F0] dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-slate-400">
                    <span>{activeIndustry.typicalCycle}</span>
                    <span>{activeIndustry.trackedAsset}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-white">
                    {activeIndustry.label}
                  </h3>
                  <p className="text-sm sm:text-base text-stone-600 dark:text-slate-300 leading-relaxed">
                    {activeIndustry.summary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200 dark:border-slate-800">
                  {activeIndustry.steps.map((s, idx) => (
                    <div key={s.step} className="space-y-1">
                      <p className="text-xs font-semibold text-stone-900 dark:text-white">
                        0{idx + 1}. {s.step}
                      </p>
                      <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
                        {s.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adjacent Field Photography + Quantitative Proof */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <div className="relative flex-1 min-h-[240px] rounded-2xl overflow-hidden border border-stone-200 dark:border-slate-800 bg-stone-200 dark:bg-slate-800">
                  {!industryImgFailed ? (
                    <img
                      src={industryHvacSolarImg}
                      alt="Field service engineer inspecting rooftop commercial HVAC and solar inverter systems with a tablet"
                      referrerPolicy="no-referrer"
                      onError={() => setIndustryImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-xs text-stone-500 dark:text-slate-400">
                      On-Site Inspection &amp; Preventive Maintenance
                    </div>
                  )}
                </div>

                <div className="border border-stone-200 dark:border-slate-800 rounded-2xl p-6 bg-[#F7F5F0] dark:bg-slate-900 space-y-1.5">
                  <p className="font-mono-tabular text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {activeIndustry.proofMetric}
                  </p>
                  <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
                    {activeIndustry.proofContext}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Customizable Pricing Section (Synced with Super Admin Console) */}
        <section
          id="pricing"
          className="border-t border-stone-200 dark:border-slate-800 py-14 sm:py-20"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="max-w-2xl space-y-2">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide">
                  Transparent Annual Pricing
                </p>
                <h2
                  className="font-display font-bold tracking-tight text-stone-900 dark:text-white"
                  style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', textWrap: 'balance' }}
                >
                  Start free for 14 days, then pick a plan built for your team size.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-400">
                Promo &amp; referral discounts apply directly during checkout · Inclusive of GST billing
              </p>
            </div>

            {activePlans.length === 0 ? (
              <div className="p-8 rounded-2xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-sm text-stone-600 dark:text-slate-400">
                Loading live subscription plans...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {activePlans.map((plan) => {
                  const pricing = calculateAnnualPricing(
                    plan.price,
                    plan.originalPrice,
                    plan.billingCycle
                  );
                  const isPopular = Boolean(plan.popular);
                  return (
                    <article
                      key={plan.id}
                      className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 bg-white dark:bg-slate-900 border ${
                        isPopular
                          ? 'border-indigo-600 dark:border-indigo-500 ring-1 ring-indigo-600/20'
                          : 'border-stone-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white">
                            {plan.name}
                          </h3>
                          {isPopular && (
                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                              Most Popular
                            </span>
                          )}
                        </div>

                        {plan.targetAudience && (
                          <p className="text-xs text-stone-500 dark:text-slate-400">
                            {plan.targetAudience}
                          </p>
                        )}

                        <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
                          <div className="flex items-baseline gap-2.5">
                            <span className="font-mono-tabular text-3xl font-bold text-stone-900 dark:text-white">
                              ₹{pricing.discountedAnnual.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-slate-400">
                              / year
                            </span>
                            {pricing.originalAnnual > pricing.discountedAnnual && (
                              <span className="font-mono-tabular text-xs text-stone-400 line-through">
                                ₹{pricing.originalAnnual.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-mono-tabular text-xs text-stone-500 dark:text-slate-400">
                            Effective ₹{pricing.monthlyEquivalent.toLocaleString('en-IN')}/mo
                            {pricing.discountPercent > 0 ? ` · Save ${pricing.discountPercent}%` : ''}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-stone-100 dark:border-slate-800 text-xs">
                          <div>
                            <p className="font-mono-tabular font-bold text-stone-900 dark:text-white">
                              {plan.maxStaff >= 999 ? 'Unlimited' : plan.maxStaff}
                            </p>
                            <p className="text-stone-500 dark:text-slate-400">Staff</p>
                          </div>
                          <div>
                            <p className="font-mono-tabular font-bold text-stone-900 dark:text-white">
                              {plan.maxJobs >= 9999 ? 'Unlimited' : `${plan.maxJobs}/mo`}
                            </p>
                            <p className="text-stone-500 dark:text-slate-400">Jobs</p>
                          </div>
                          <div>
                            <p className="font-mono-tabular font-bold text-stone-900 dark:text-white">
                              {plan.maxCustomers >= 99999 ? 'Unlimited' : plan.maxCustomers.toLocaleString('en-IN')}
                            </p>
                            <p className="text-stone-500 dark:text-slate-400">Clients</p>
                          </div>
                        </div>

                        <ul className="space-y-2 text-xs sm:text-sm text-stone-700 dark:text-slate-300">
                          {plan.features.slice(0, 6).map((feat) => (
                            <li key={feat} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenAuth('register', plan.name)}
                        className={`w-full py-2.5 px-4 min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isPopular
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-900 dark:text-white'
                        }`}
                      >
                        Start 14-Day Free Trial
                      </button>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Add-on Packs Strip */}
            {activeAddons.length > 0 && (
              <div className="border border-stone-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-stone-900 dark:text-white">
                    Need extra staff seats or job capacity later?
                  </p>
                  <p className="text-xs text-stone-600 dark:text-slate-400">
                    Expand any active plan without upgrading tiers:
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-xs">
                  {activeAddons.map((addon) => (
                    <div key={addon.id} className="space-y-0.5">
                      <p className="font-semibold text-stone-900 dark:text-white">{addon.name}</p>
                      <p className="font-mono-tabular text-stone-600 dark:text-slate-400">
                        ₹{(addon.yearlyPrice ?? addon.price).toLocaleString('en-IN')}/yr
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Interactive Onboarding Callback + FAQ Section */}
        <section
          id="faq"
          className="border-t border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-14 sm:py-20"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Validated Assisted Onboarding Form */}
            <div className="lg:col-span-5 bg-[#F7F5F0] dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Assisted Setup &amp; Walkthrough
                </p>
                <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-white">
                  Request a 15-minute live walkthrough
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                  Share your business details if you want help importing customers, GST templates, or setting up technician roles.
                </p>
              </div>

              {!leadSubmitted ? (
                <form onSubmit={handleLeadSubmit} noValidate className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <label htmlFor="lead-name" className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Your Name
                    </label>
                    <input
                      id="lead-name"
                      type="text"
                      value={leadName}
                      onChange={(e) => {
                        setLeadName(e.target.value);
                        if (leadError) setLeadError(null);
                      }}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full h-11 px-3.5 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="lead-business" className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                      Company / Agency Name
                    </label>
                    <input
                      id="lead-business"
                      type="text"
                      value={leadBusiness}
                      onChange={(e) => {
                        setLeadBusiness(e.target.value);
                        if (leadError) setLeadError(null);
                      }}
                      placeholder="e.g. Apex Security & CCTV Systems"
                      className="w-full h-11 px-3.5 rounded-xl text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="lead-phone" className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Mobile Number
                      </label>
                      <input
                        id="lead-phone"
                        type="tel"
                        value={leadPhone}
                        onChange={(e) => {
                          setLeadPhone(e.target.value);
                          if (leadError) setLeadError(null);
                        }}
                        placeholder="10-digit mobile"
                        className="w-full h-11 px-3.5 rounded-xl text-sm font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label htmlFor="lead-trade" className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                        Service Trade
                      </label>
                      <select
                        id="lead-trade"
                        value={leadTrade}
                        onChange={(e) => setLeadTrade(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl text-sm"
                      >
                        <option value="CCTV & Security">CCTV &amp; Security</option>
                        <option value="Solar & Inverters">Solar &amp; Inverters</option>
                        <option value="AC & HVAC">AC &amp; HVAC</option>
                        <option value="Electrical & Plumbing">Electrical &amp; Plumbing</option>
                        <option value="RO & Appliances">RO &amp; Appliances</option>
                        <option value="IT & Hardware Service">IT &amp; Hardware Service</option>
                      </select>
                    </div>
                  </div>

                  {leadError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{leadError}</span>
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-5 min-h-[44px] rounded-xl bg-stone-900 dark:bg-indigo-600 hover:bg-stone-800 dark:hover:bg-indigo-700 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Request Onboarding Callback</span>
                  </button>
                </form>
              ) : (
                <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Callback request received for {leadBusiness}</span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                    You do not have to wait to explore — you can launch your 14-day free workspace immediately or ping us on WhatsApp.
                  </p>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onOpenAuth('register')}
                      className="px-4 py-2 min-h-[40px] rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      Create Workspace Now
                    </button>
                    <a
                      href={`mailto:${SAAS_SUPPORT_EMAIL}?subject=${encodeURIComponent(`Walkthrough Request: ${leadBusiness} (${leadTrade})`)}&body=${encodeURIComponent(`Name: ${leadName}\nBusiness: ${leadBusiness}\nMobile: ${leadPhone}\nTrade: ${leadTrade}`)}`}
                      className="px-4 py-2 min-h-[40px] rounded-lg border border-stone-300 dark:border-slate-600 text-xs font-semibold text-stone-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email {SAAS_SUPPORT_EMAIL}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Right: FAQ Accordion */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Common Questions
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                  Answers before you start your trial.
                </h2>
              </div>

              <div className="divide-y divide-stone-200 dark:divide-slate-800 border-y border-stone-200 dark:border-slate-800">
                {FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={item.q} className="py-4">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between gap-4 text-left py-1 min-h-[44px] cursor-pointer"
                      >
                        <span className="text-sm sm:text-base font-semibold text-stone-900 dark:text-white">
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <p className="pt-2 pb-1 text-sm text-stone-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-stone-200 dark:border-slate-800 bg-[#F7F5F0] dark:bg-slate-950 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-base font-display font-bold text-stone-900 dark:text-white">
              <BrandLogo size={24} />
              <span>ServiFlow</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              Field Service, Technician Dispatch, GST Billing &amp; AMC Software · © {new Date().getFullYear()} ServiFlow
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-stone-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              Start Trial
            </button>
            <button
              type="button"
              onClick={onOpenCustomerPortal}
              className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              Customer Portal
            </button>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="hover:text-stone-900 dark:hover:text-white cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 rounded-lg border border-stone-200 dark:border-slate-800 hover:bg-stone-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
