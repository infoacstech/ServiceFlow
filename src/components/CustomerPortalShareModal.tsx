import React, { useState, useRef } from 'react';
import { Customer, Business } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Printer,
  ExternalLink,
  MessageSquare,
  Sparkles,
  QrCode,
  ShieldCheck,
  Phone,
  Building,
  MapPin,
  Wrench,
} from 'lucide-react';

interface CustomerPortalShareModalProps {
  customer: Customer;
  currentBusiness?: Business;
  businessName?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenPortalPreview?: (customerId: string) => void;
}

export const CustomerPortalShareModal: React.FC<CustomerPortalShareModalProps> = ({
  customer,
  currentBusiness,
  businessName,
  isOpen,
  onClose,
  onOpenPortalPreview,
}) => {
  const [copied, setCopied] = useState(false);
  const [stickerType, setStickerType] = useState<'standard' | 'compact' | 'equipment'>('standard');
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const displayBusinessName = currentBusiness?.name || businessName || 'ServiFlow';
  const displayPhone = currentBusiness?.mobile || currentBusiness?.whatsapp || '';

  // Build the public direct URL for this customer
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const portalUrl = `${baseUrl}/?portal=customer&cid=${encodeURIComponent(customer.id)}`;

  const cleanPhone = (customer.mobile || '').replace(/[^0-9]/g, '');
  const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12
    ? cleanPhone
    : cleanPhone.length === 10
    ? `91${cleanPhone}`
    : cleanPhone;

  const shareMessage = `Hello ${customer.name},

You can now access your *${displayBusinessName} Customer Self-Service Portal* to:
🛠️ Request new service & repair visits in 1-click
📊 Track live technician status & work progress
📄 View and download your service invoices & AMC records

👉 *Open your Portal Link:*
${portalUrl}

For urgent queries, call us at ${displayPhone || 'our support line'}.
Thank you!`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(portalUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = portalUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy portal URL', err);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(shareMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrintSticker = () => {
    const printContent = printableRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Service QR Sticker - ${customer.name}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background-color: #f8fafc;
            }
            .sticker-card {
              border: 3px solid #0f172a;
              border-radius: 20px;
              padding: 24px;
              width: 320px;
              text-align: center;
              background: #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            }
            .biz-header {
              font-size: 16px;
              font-weight: 900;
              color: #4338ca;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .sub-header {
              font-size: 11px;
              font-weight: 700;
              color: #64748b;
              margin-bottom: 16px;
            }
            .qr-wrapper {
              display: inline-block;
              padding: 12px;
              background: #f1f5f9;
              border-radius: 16px;
              border: 1px solid #cbd5e1;
              margin-bottom: 14px;
            }
            .scan-text {
              font-size: 13px;
              font-weight: 800;
              color: #0f172a;
              margin-bottom: 4px;
            }
            .help-text {
              font-size: 10px;
              color: #64748b;
              line-height: 1.4;
              margin-bottom: 12px;
            }
            .cust-badge {
              background: #e0e7ff;
              color: #3730a3;
              font-size: 11px;
              font-weight: 800;
              padding: 6px 12px;
              border-radius: 8px;
              display: inline-block;
            }
            .footer-contact {
              margin-top: 14px;
              font-size: 10px;
              font-weight: 700;
              color: #334155;
              border-top: 1px dashed #cbd5e1;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="sticker-card">
            <div class="biz-header">${displayBusinessName}</div>
            <div class="sub-header">24x7 Customer Support & Service</div>
            <div class="qr-wrapper">
              ${printContent.querySelector('svg')?.outerHTML || ''}
            </div>
            <div class="scan-text">SCAN FOR SERVICE & REPAIRS</div>
            <div class="help-text">Scan with any phone camera or Google Lens to book repair visit or track technician.</div>
            <div class="cust-badge">Customer: ${customer.name}</div>
            <div class="footer-contact">Support: ${displayPhone || 'Customer Care'}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-900 to-indigo-800 text-white relative flex items-start justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-700/80 border border-indigo-500/50 text-[10px] font-black uppercase tracking-wider text-indigo-200">
              <QrCode className="w-3 h-3" /> Customer Self-Service Link & QR
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              {customer.name}
            </h2>
            <div className="flex items-center gap-3 text-xs text-indigo-200">
              {customer.mobile && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {customer.mobile}
                </span>
              )}
              {customer.companyName && (
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3" /> {customer.companyName}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* QR Code & Sticker Preview Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div
              ref={printableRef}
              className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0 flex items-center justify-center"
            >
              <QRCodeSVG
                value={portalUrl}
                size={140}
                level="H"
                includeMargin={false}
                fgColor="#0f172a"
              />
            </div>

            <div className="space-y-2 flex-1 min-w-0">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-extrabold uppercase">
                <ShieldCheck className="w-3 h-3" /> Instant Customer Access
              </div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                Direct Portal Link & QR Sticker
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Customer can scan this QR code or click the direct link from mobile to raise service requests, track technicians, and view invoice history without any login hassle.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePrintSticker}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Printer className="w-3.5 h-3.5" /> Print QR Sticker
                </button>
                {onOpenPortalPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPortalPreview(customer.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Test Portal View
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Portal URL Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Customer Portal Web Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 truncate select-all">
                {portalUrl}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 1-Click WhatsApp Direct Share */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Send Portal Link via WhatsApp
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                {customer.mobile
                  ? `Send directly to ${customer.mobile}`
                  : 'Open WhatsApp to share invitation'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-all"
            >
              <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp
            </button>
          </div>

          {/* What customer can do info */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Customer Self-Service Features:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pl-1">
              <li>Raise new service calls and problem tickets anytime.</li>
              <li>Track assigned technician name and live visit status.</li>
              <li>Check active AMC service visits remaining and contracts.</li>
              <li>View invoices, payments, and service history.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
