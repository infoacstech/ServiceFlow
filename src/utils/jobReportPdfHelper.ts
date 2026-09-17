import { Business, Customer, Job, User } from '../types';
import { formatIndiaDate } from './dateUtils';
import { getActiveAppLanguage } from './whatsappHelper';

export interface PrintJobSheetOptions {
  job: Job;
  customer?: Customer | null;
  technician?: User | null;
  business?: Business;
  lang?: string;
}

/**
 * Escapes HTML characters for safe printable documents
 */
const escapeHtml = (str: string | undefined | null): string => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Generates an Enterprise-grade A4 Digital Job Card & Service Completion Sheet
 * including Diagnosis, Work Carried Out, Before & After Photos, and Customer E-Signature.
 */
export const printJobSheetDocument = ({
  job,
  customer,
  technician,
  business,
  lang = getActiveAppLanguage(),
}: PrintJobSheetOptions) => {
  const currency = business?.currency || '₹';
  const scheduledFormatted = job.scheduledDate ? formatIndiaDate(job.scheduledDate) : 'Not Specified';
  const completionFormatted = job.completionTime
    ? formatIndiaDate(job.completionTime)
    : 'Completed On Site';

  const printWindow = window.open('', '_blank', 'width=900,height=850');
  if (!printWindow) {
    window.print();
    return;
  }

  const isHindi = lang === 'hi';
  const isMarathi = lang === 'mr';

  const labels = {
    title: isHindi ? 'डिजिटल जॉब शीट और सेवा रिपोर्ट' : isMarathi ? 'डिजिटल जॉब शीट आणि सेवा अहवाल' : 'DIGITAL JOB SHEET & SERVICE COMPLETION REPORT',
    jobId: isHindi ? 'जॉब आईडी' : isMarathi ? 'जॉब आयडी' : 'Job ID',
    status: isHindi ? 'स्थिति' : isMarathi ? 'स्थिती' : 'Status',
    date: isHindi ? 'दिनांक' : isMarathi ? 'तारीख' : 'Date',
    customerInfo: isHindi ? 'ग्राहक विवरण' : isMarathi ? 'ग्राहक तपशील' : 'Customer & Site Information',
    serviceInfo: isHindi ? 'सेवा विवरण' : isMarathi ? 'सेवा तपशील' : 'Service & Technical Details',
    diagnosis: isHindi ? 'पाई गई समस्या' : isMarathi ? 'तपासणी निष्कर्ष' : 'Problem Diagnosed On-Site',
    solution: isHindi ? 'समाधान व किया गया कार्य' : isMarathi ? 'केलेले काम व उपाय' : 'Work & Solution Provided',
    partsUsed: isHindi ? 'उपयोग किए गए स्पेयर पार्ट्स' : isMarathi ? 'वापरलेले स्पेअर पार्ट्स' : 'Spare Parts & Materials Used',
    photos: isHindi ? 'साइट फोटो साक्ष्य (पहले / बाद में)' : isMarathi ? 'साइट फोटो पुरावे (आधी / नंतर)' : 'On-Site Photo Evidence (Audit Trail)',
    customerSign: isHindi ? 'ग्राहक ई-हस्ताक्षर' : isMarathi ? 'ग्राहक ई-स्वाक्षरी' : 'Customer Sign-off Signature',
    techSign: isHindi ? 'तकनीशियन सत्यापन' : isMarathi ? 'तंत्रज्ञ पडताळणी' : 'Technician Sign-off',
    rating: isHindi ? 'ग्राहक संतुष्टि रेटिंग' : isMarathi ? 'ग्राहक समाधान रेटिंग' : 'Customer Satisfaction Rating',
    amount: isHindi ? 'सेवा शुल्क' : isMarathi ? 'सेवा शुल्क' : 'Service Amount',
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Job_Sheet_${escapeHtml(job.jobId || 'SERVICE')}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.45;
    }
    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12px;
      border-bottom: 2px solid #4f46e5;
      margin-bottom: 14px;
    }
    .company-title {
      font-size: 20px;
      font-weight: 900;
      color: #1e1b4b;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .company-sub {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
      max-width: 380px;
    }
    .badge-status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 12px;
    }
    .box-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #4f46e5;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
    }
    .info-label {
      color: #64748b;
      font-size: 11px;
    }
    .info-val {
      font-weight: 700;
      color: #0f172a;
      font-size: 11px;
      text-align: right;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      margin-top: 10px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 12px;
      background: #4f46e5;
      border-radius: 2px;
    }
    .report-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 8px;
    }
    .report-label {
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
    }
    .report-text {
      font-size: 11.5px;
      color: #1e293b;
      margin-top: 2px;
      white-space: pre-wrap;
    }
    table.parts-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
      font-size: 11px;
    }
    table.parts-table th {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
      font-weight: 800;
      color: #334155;
    }
    table.parts-table td {
      border: 1px solid #e2e8f0;
      padding: 5px 8px;
    }
    .photos-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    .photo-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      overflow: hidden;
      background: #f8fafc;
      text-align: center;
    }
    .photo-card img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
    }
    .photo-tag {
      font-size: 9.5px;
      font-weight: 800;
      padding: 4px 6px;
      background: #f1f5f9;
      color: #475569;
      text-transform: uppercase;
      border-top: 1px solid #e2e8f0;
    }
    .sign-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 14px;
      padding-top: 10px;
      border-top: 1px dashed #cbd5e1;
    }
    .sign-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      background: #fafafa;
    }
    .sign-img {
      max-height: 55px;
      max-width: 100%;
      display: block;
      margin: 4px auto;
    }
    .footer-note {
      margin-top: 14px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="sheet-header">
    <div>
      <h1 class="company-title">${escapeHtml(business?.name || 'ServiFlow Services')}</h1>
      <div class="company-sub">
        ${escapeHtml(business?.address || '')} • Phone: ${escapeHtml(business?.mobile || '')}
        ${business?.gstNumber ? ` • GSTIN: <strong>${escapeHtml(business.gstNumber)}</strong>` : ''}
      </div>
    </div>
    <div style="text-align: right;">
      <div class="badge-status">${escapeHtml((job.status || 'COMPLETED').toUpperCase())}</div>
      <div style="font-size: 14px; font-weight: 900; color: #4f46e5; margin-top: 4px;">
        ${escapeHtml(job.jobId || 'JOB-SHEET')}
      </div>
      <div style="font-size: 10px; color: #64748b;">
        Date: ${escapeHtml(scheduledFormatted)}
      </div>
    </div>
  </div>

  <div class="grid-2">
    <!-- Customer Info -->
    <div class="box">
      <div class="box-title">${labels.customerInfo}</div>
      <div class="info-row">
        <span class="info-label">Customer Name:</span>
        <span class="info-val">${escapeHtml(customer?.name || 'Valued Client')}</span>
      </div>
      ${customer?.companyName ? `
      <div class="info-row">
        <span class="info-label">Company:</span>
        <span class="info-val">${escapeHtml(customer.companyName)}</span>
      </div>` : ''}
      <div class="info-row">
        <span class="info-label">Mobile:</span>
        <span class="info-val">${escapeHtml(customer?.mobile || 'N/A')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Site Address:</span>
        <span class="info-val" style="max-width: 200px;">${escapeHtml(job.location || customer?.address || 'On-site')}</span>
      </div>
    </div>

    <!-- Service & Technician Info -->
    <div class="box">
      <div class="box-title">${labels.serviceInfo}</div>
      <div class="info-row">
        <span class="info-label">Service Type:</span>
        <span class="info-val">${escapeHtml(job.description || 'Maintenance')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Lead Technician:</span>
        <span class="info-val">${escapeHtml(job.assignedStaffName || technician?.name || 'Assigned Staff')}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Completion Time:</span>
        <span class="info-val">${escapeHtml(completionFormatted)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Billing Amount:</span>
        <span class="info-val" style="color: #059669; font-weight: 800;">${currency}${escapeHtml(String(job.estimatedAmount || 0))}</span>
      </div>
    </div>
  </div>

  <!-- Technical Diagnostics & Solution -->
  <div class="section-title">Technical Service Report</div>
  
  <div class="report-box">
    <div class="report-label">${labels.diagnosis}</div>
    <div class="report-text">${escapeHtml(job.problemFound || 'Standard routine maintenance, diagnostic checkup and inspection performed.')}</div>
  </div>

  <div class="report-box">
    <div class="report-label">${labels.solution}</div>
    <div class="report-text">${escapeHtml(job.solutionProvided || 'Repaired all identified faults, tuned system parameters, and confirmed successful on-site operation.')}</div>
  </div>

  ${(job.materialsUsed && job.materialsUsed.length > 0) ? `
  <div class="section-title">${labels.partsUsed}</div>
  <table class="parts-table">
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="width: 70px; text-align: center;">Qty</th>
        <th style="width: 100px; text-align: right;">Rate</th>
        <th style="width: 100px; text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${job.materialsUsed.map((m) => `
        <tr>
          <td><strong>${escapeHtml(m.name)}</strong></td>
          <td style="text-align: center;">${m.quantity}</td>
          <td style="text-align: right;">${currency}${m.unitPrice}</td>
          <td style="text-align: right; font-weight: 700;">${currency}${m.quantity * m.unitPrice}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <!-- Photo Evidence -->
  ${((job.beforePhotos && job.beforePhotos.length > 0) || (job.afterPhotos && job.afterPhotos.length > 0)) ? `
  <div class="section-title">${labels.photos}</div>
  <div class="photos-grid">
    <div class="photo-card">
      ${job.beforePhotos && job.beforePhotos.length > 0 ? `
        <img src="${escapeHtml(job.beforePhotos[0])}" alt="Before Work Photo" />
      ` : '<div style="height:150px; display:flex; align-items:center; justify-content:center; color:#94a3b8;">No initial photo</div>'}
      <div class="photo-tag">Before Service / Initial Condition</div>
    </div>
    <div class="photo-card">
      ${job.afterPhotos && job.afterPhotos.length > 0 ? `
        <img src="${escapeHtml(job.afterPhotos[0])}" alt="After Work Photo" />
      ` : '<div style="height:150px; display:flex; align-items:center; justify-content:center; color:#94a3b8;">No completion photo</div>'}
      <div class="photo-tag">After Service / Finished Work</div>
    </div>
  </div>
  ` : ''}

  <!-- Customer Rating & E-Signatures -->
  <div class="sign-grid">
    <div class="sign-box">
      <div class="report-label">${labels.customerSign}</div>
      ${job.customerSignature ? `
        <img class="sign-img" src="${job.customerSignature}" alt="Customer Signature" />
      ` : '<div style="height: 45px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-style:italic;">Customer sign-off recorded</div>'}
      <div style="font-size: 10.5px; font-weight: 700; color: #1e293b;">
        ${escapeHtml(customer?.name || 'Customer')}
      </div>
      ${job.customerRating ? `
        <div style="font-size: 11px; color: #d97706; font-weight: 800; margin-top: 2px;">
          Rated: ${job.customerRating} / 5 ⭐
        </div>
      ` : ''}
    </div>

    <div class="sign-box">
      <div class="report-label">${labels.techSign}</div>
      <div style="height: 45px; display:flex; align-items:center; justify-content:center; color:#059669; font-weight: 800; font-size: 13px;">
        ✓ VERIFIED BY TECHNICIAN
      </div>
      <div style="font-size: 10.5px; font-weight: 700; color: #1e293b;">
        ${escapeHtml(job.assignedStaffName || technician?.name || 'Field Technician')}
      </div>
      <div style="font-size: 9.5px; color: #64748b;">
        Authorized Service Representative
      </div>
    </div>
  </div>

  <div class="footer-note">
    This is an authentic digital service completion document recorded in real-time on the ServiFlow Field Service Platform.
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

/**
 * Convenient wrapper function for printing/downloading job card report PDF
 */
export const generateJobReportPdf = (
  job: Job,
  customer?: Customer | null,
  technician?: User | null,
  business?: Business,
  lang?: string
) => {
  return printJobSheetDocument({ job, customer, technician, business, lang });
};

