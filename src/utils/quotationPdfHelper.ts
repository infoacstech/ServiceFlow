import { Business, Customer, Quotation } from '../types';
import { formatIndiaDate } from './dateUtils';
import { getActiveAppLanguage } from './whatsappHelper';

/**
 * Generates and triggers the native browser print / Save as PDF dialogue
 * with a clean, high-resolution, professional A4 Quotation layout.
 * Supports English, Hindi, and Marathi based on the user's active language.
 */
export const printQuotationDocument = (
  quotation: Quotation,
  customer?: Customer | null,
  business?: Business,
  lang: string = getActiveAppLanguage()
) => {
  const currency = business?.currency || '₹';
  const formattedDate = formatIndiaDate(quotation.date);
  const formattedValidUntil = formatIndiaDate(quotation.validUntil);

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    // If pop-up blocked, fallback to standard window.print
    window.print();
    return;
  }

  // Localized headers and labels
  const labels = {
    en: {
      docType: 'Quotation / Estimate',
      docNum: 'Quotation No:',
      billTo: 'Quotation For:',
      details: 'Quotation Details:',
      date: 'Quotation Date (IST):',
      validUntil: 'Valid Until Date (IST):',
      status: 'Status:',
      colNum: '#',
      colDesc: 'Item Description',
      colQty: 'Qty',
      colRate: 'Rate',
      colAmount: 'Amount',
      subtotal: 'Subtotal:',
      tax: 'Estimated GST / Tax:',
      grandTotal: 'Grand Total:',
      notes: 'Terms & Conditions / Notes:',
      generatedBy: 'Generated via ServiFlow • Timezone: India Standard Time (Asia/Kolkata)',
      thanks: 'Thank you for your business!',
      authorizedSign: 'Authorized Signatory',
      phone: 'Phone',
      email: 'Email',
    },
    hi: {
      docType: 'कोटेशन / अनुमान (Quotation)',
      docNum: 'कोटेशन संख्या:',
      billTo: 'ग्राहक विवरण (Quotation For):',
      details: 'कोटेशन विवरण:',
      date: 'कोटेशन दिनांक (IST):',
      validUntil: 'वैधता तिथि (IST):',
      status: 'स्थिति:',
      colNum: '#',
      colDesc: 'विवरण (Item Description)',
      colQty: 'मात्रा',
      colRate: 'दर',
      colAmount: 'राशि',
      subtotal: 'उप-योग (Subtotal):',
      tax: 'अनुमानित GST / Tax:',
      grandTotal: 'कुल योग (Grand Total):',
      notes: 'नियम व शर्तें / नोट्स:',
      generatedBy: 'ServiFlow द्वारा निर्मित • समय क्षेत्र: भारतीय मानक समय (IST)',
      thanks: 'हमारे साथ व्यापार करने के लिए धन्यवाद!',
      authorizedSign: 'अधिकृत हस्ताक्षरकर्ता (Authorized Signatory)',
      phone: 'फोन',
      email: 'ईमेल',
    },
    mr: {
      docType: 'कोटेशन / अंदाजपत्रक (Quotation)',
      docNum: 'कोटेशन क्रमांक:',
      billTo: 'ग्राहक तपशील (Quotation For):',
      details: 'कोटेशन तपशील:',
      date: 'कोटेशन तारीख (IST):',
      validUntil: 'वैधता मुदत (IST):',
      status: 'स्थिती:',
      colNum: '#',
      colDesc: 'तपशील (Item Description)',
      colQty: 'नग (Qty)',
      colRate: 'दर (Rate)',
      colAmount: 'रक्कम',
      subtotal: 'उप-एकूण (Subtotal):',
      tax: 'अंदाजे GST / Tax:',
      grandTotal: 'एकूण रक्कम (Grand Total):',
      notes: 'अटी व शर्ती / टीप:',
      generatedBy: 'ServiFlow द्वारे तयार • भारतीय मानक वेळ (IST)',
      thanks: 'आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद!',
      authorizedSign: 'अधिकृत स्वाक्षरी (Authorized Signatory)',
      phone: 'फोन',
      email: 'ईमेल',
    },
  }[lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en'];

  const itemsRows = (quotation.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #1e293b;">
          ${escapeHtml(item.description)}
        </td>
        <td style="padding: 10px 12px; text-align: center; border-bottom: 1px solid #e2e8f0; color: #334155;">${item.quantity}</td>
        <td style="padding: 10px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #334155;">${currency}${item.rate.toLocaleString('en-IN')}</td>
        <td style="padding: 10px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${currency}${item.amount.toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const taxRow =
    quotation.taxTotal > 0
      ? `
      <tr>
        <td style="padding: 6px 12px; text-align: right; color: #64748b; font-weight: 500;">${labels.tax}</td>
        <td style="padding: 6px 12px; text-align: right; font-weight: 600; color: #1e293b; width: 140px;">${currency}${quotation.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `
      : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <title>Quotation_${quotation.quotationNumber}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 24px;
          font-size: 13px;
          line-height: 1.5;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 20px;
          border-bottom: 2px solid #4f46e5;
          margin-bottom: 24px;
        }
        .biz-title {
          font-size: 24px;
          font-weight: 800;
          color: #1e1b4b;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }
        .biz-sub {
          color: #475569;
          font-size: 12px;
          line-height: 1.4;
        }
        .doc-badge {
          text-align: right;
        }
        .doc-type {
          font-size: 18px;
          font-weight: 900;
          color: #4f46e5;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .doc-num {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 4px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .meta-col h4 {
          margin: 0 0 6px 0;
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .meta-col p {
          margin: 0 0 4px 0;
          color: #1e293b;
          font-size: 13px;
        }
        .meta-col strong {
          color: #0f172a;
        }
        table.items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }
        table.items-table th {
          background: #f1f5f9;
          color: #475569;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 800;
          padding: 10px 12px;
          letter-spacing: 0.5px;
        }
        .totals-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 30px;
        }
        .totals-table {
          width: 340px;
          border-collapse: collapse;
        }
        .grand-total-row td {
          padding: 10px 12px;
          border-top: 2px solid #cbd5e1;
          font-size: 16px;
          font-weight: 900;
          color: #4f46e5;
        }
        .notes-box {
          background: #f8fafc;
          border-left: 4px solid #4f46e5;
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
          margin-bottom: 30px;
          font-size: 12px;
          color: #475569;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .notes-box strong {
          color: #1e293b;
          display: block;
          margin-bottom: 4px;
        }
        .footer-sign {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
          font-size: 11px;
          color: #64748b;
        }
        .sig-line {
          width: 200px;
          border-top: 1px solid #94a3b8;
          text-align: center;
          padding-top: 6px;
          font-weight: 600;
          color: #334155;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header-bar">
          <div>
            <h1 class="biz-title">${escapeHtml(business?.name || 'ServiFlow Services')}</h1>
            <div class="biz-sub">
              ${escapeHtml(business?.address || '')}${business?.city ? `, ${escapeHtml(business.city)}` : ''}<br>
              ${business?.mobile ? `${labels.phone}: <strong>${escapeHtml(business.mobile)}</strong>` : ''} 
              ${business?.email ? ` | ${labels.email}: ${escapeHtml(business.email)}` : ''}<br>
              ${business?.gstNumber ? `GSTIN: <strong>${escapeHtml(business.gstNumber)}</strong>` : ''}
            </div>
          </div>
          <div class="doc-badge">
            <div class="doc-type">${labels.docType}</div>
            <div class="doc-num">${escapeHtml(quotation.quotationNumber)}</div>
          </div>
        </div>

        <!-- Meta Grid -->
        <div class="meta-grid">
          <div class="meta-col">
            <h4>${labels.billTo}</h4>
            <p><strong>${escapeHtml(customer?.name || 'Customer')}</strong></p>
            ${customer?.companyName ? `<p style="color: #475569; font-weight: 500;">${escapeHtml(customer.companyName)}</p>` : ''}
            ${customer?.mobile ? `<p>${labels.phone}: ${escapeHtml(customer.mobile)}</p>` : ''}
            ${customer?.address ? `<p>${escapeHtml(customer.address)}</p>` : ''}
            ${customer?.gstNumber ? `<p>GSTIN: <strong>${escapeHtml(customer.gstNumber)}</strong></p>` : ''}
          </div>
          <div class="meta-col" style="text-align: right;">
            <h4>${labels.details}</h4>
            <p>${labels.date} <strong>${formattedDate}</strong></p>
            <p>${labels.validUntil} <strong style="color: #4f46e5;">${formattedValidUntil}</strong></p>
            <p>${labels.status} <span style="text-transform: uppercase; font-weight: 700; color: #16a34a;">${escapeHtml(quotation.status)}</span></p>
          </div>
        </div>

        <!-- Line Items Table -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">${labels.colNum}</th>
              <th style="text-align: left;">${labels.colDesc}</th>
              <th style="width: 70px; text-align: center;">${labels.colQty}</th>
              <th style="width: 120px; text-align: right;">${labels.colRate} (${currency})</th>
              <th style="width: 130px; text-align: right;">${labels.colAmount} (${currency})</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totals Section -->
        <div class="totals-section">
          <table class="totals-table">
            <tr>
              <td style="padding: 6px 12px; text-align: right; color: #64748b; font-weight: 500;">${labels.subtotal}</td>
              <td style="padding: 6px 12px; text-align: right; font-weight: 600; color: #1e293b; width: 140px;">${currency}${quotation.subtotal.toLocaleString('en-IN')}</td>
            </tr>
            ${taxRow}
            <tr class="grand-total-row">
              <td style="text-align: right;">${labels.grandTotal}</td>
              <td style="text-align: right;">${currency}${quotation.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        <!-- Notes / Terms -->
        ${
          quotation.notes
            ? `
          <div class="notes-box">
            <strong>${labels.notes}</strong>
            ${escapeHtml(quotation.notes)}
          </div>
        `
            : ''
        }

        <!-- Footer -->
        <div class="footer-sign">
          <div>
            ${labels.generatedBy}<br>
            ${labels.thanks}
          </div>
          <div class="sig-line">
            ${labels.authorizedSign}<br>
            <span style="font-size: 10px; font-weight: 400; color: #94a3b8;">${escapeHtml(business?.name || '')}</span>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
