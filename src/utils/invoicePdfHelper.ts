import { Business, Customer, Invoice } from '../types';
import { formatIndiaDate } from './dateUtils';
import { getActiveAppLanguage } from './whatsappHelper';

export type InvoiceTheme = 'modern' | 'classic' | 'minimal';

/**
 * Generates and triggers the native browser print / Save as PDF dialogue
 * with a high-resolution, enterprise-grade A4 Tax Invoice layout.
 * Supports theme variants, dynamic UPI QR Codes, and multilingual labels.
 */
export const printInvoiceDocument = (
  invoice: Invoice,
  customer?: Customer | null,
  business?: Business,
  theme: InvoiceTheme = 'modern',
  lang: string = getActiveAppLanguage()
) => {
  const currency = business?.currency || '₹';
  const formattedDate = formatIndiaDate(invoice.date);
  const formattedDueDate = formatIndiaDate(invoice.dueDate);
  const isPaid = invoice.status === 'paid' || (invoice.balanceAmount || 0) <= 0;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (!printWindow) {
    window.print();
    return;
  }

  // Localized headers and labels
  const labels = {
    en: {
      docType: 'TAX INVOICE',
      docNum: 'Invoice No:',
      billTo: 'Billed To (Customer Details):',
      details: 'Invoice Details:',
      date: 'Invoice Date (IST):',
      dueDate: 'Payment Due Date:',
      status: 'Payment Status:',
      colNum: '#',
      colDesc: 'Item & Service Description',
      colQty: 'Qty',
      colRate: 'Rate',
      colGst: 'GST %',
      colAmount: 'Amount',
      subtotal: 'Taxable Amount (Subtotal):',
      tax: 'Total GST:',
      grandTotal: 'Grand Total (INR):',
      paidAmount: 'Amount Paid:',
      balanceDue: 'Balance Due:',
      bankDetails: 'Bank & UPI Payment Details:',
      scanToPay: 'Scan QR Code to Pay instantly via UPI',
      terms: 'Terms & Conditions / Declarations:',
      generatedBy: 'Generated via ServiFlow Enterprise • Timezone: India Standard Time (Asia/Kolkata)',
      thanks: 'Thank you for your valued business!',
      authorizedSign: 'Authorized Signatory',
      phone: 'Phone',
      email: 'Email',
      gstin: 'GSTIN',
    },
    hi: {
      docType: 'कर बीजक (TAX INVOICE)',
      docNum: 'चालान संख्या:',
      billTo: 'ग्राहक विवरण (Billed To):',
      details: 'चालान विवरण:',
      date: 'चालान दिनांक (IST):',
      dueDate: 'भुगतान की अंतिम तिथि:',
      status: 'भुगतान स्थिति:',
      colNum: '#',
      colDesc: 'विवरण (Description)',
      colQty: 'मात्रा',
      colRate: 'दर',
      colGst: 'GST %',
      colAmount: 'राशि',
      subtotal: 'कर योग्य राशि (Subtotal):',
      tax: 'कुल GST:',
      grandTotal: 'कुल योग (Grand Total):',
      paidAmount: 'प्राप्त राशि:',
      balanceDue: 'बकाया राशि:',
      bankDetails: 'बैंक एवं UPI भुगतान विवरण:',
      scanToPay: 'UPI द्वारा भुगतान हेतु QR कोड स्कैन करें',
      terms: 'नियम एवं शर्तें:',
      generatedBy: 'ServiFlow द्वारा निर्मित • समय क्षेत्र: भारतीय मानक समय (IST)',
      thanks: 'हमारे साथ व्यापार करने के लिए धन्यवाद!',
      authorizedSign: 'अधिकृत हस्ताक्षरकर्ता',
      phone: 'फोन',
      email: 'ईमेल',
      gstin: 'जीएसटी संख्या',
    },
    mr: {
      docType: 'कर पावती (TAX INVOICE)',
      docNum: 'पावती क्रमांक:',
      billTo: 'ग्राहक तपशील (Billed To):',
      details: 'तपशील:',
      date: 'पावती दिनांक (IST):',
      dueDate: 'देय तारीख:',
      status: 'पेमेंट स्थिती:',
      colNum: '#',
      colDesc: 'तपशील (Description)',
      colQty: 'नग',
      colRate: 'दर',
      colGst: 'GST %',
      colAmount: 'रक्कम',
      subtotal: 'करपात्र रक्कम (Subtotal):',
      tax: 'एकूण GST:',
      grandTotal: 'एकूण देय रक्कम (Grand Total):',
      paidAmount: 'जमा रक्कम:',
      balanceDue: 'उर्वरित देय:',
      bankDetails: 'बँक आणि UPI पेमेंट तपशील:',
      scanToPay: 'UPI द्वारे पेमेंट करण्यासाठी QR कोड स्कॅन करा',
      terms: 'अटी आणि शर्ती:',
      generatedBy: 'ServiFlow द्वारे तयार • भारतीय मानक वेळ (IST)',
      thanks: 'आपल्या सहकार्याबद्दल मनःपूर्वक धन्यवाद!',
      authorizedSign: 'अधिकृत स्वाक्षरी',
      phone: 'फोन',
      email: 'ईमेल',
      gstin: 'GST क्रमांक',
    },
  }[lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en'];

  // Theme primary colors
  const themeColors = {
    modern: {
      primary: '#4f46e5',
      primaryLight: '#eef2ff',
      border: '#c7d2fe',
      accent: '#6366f1',
    },
    classic: {
      primary: '#0f172a',
      primaryLight: '#f8fafc',
      border: '#e2e8f0',
      accent: '#334155',
    },
    minimal: {
      primary: '#059669',
      primaryLight: '#ecfdf5',
      border: '#a7f3d0',
      accent: '#10b981',
    },
  }[theme];

  // UPI payment link & QR
  const upiId = business?.email ? `${business.email.split('@')[0]}@upi` : 'merchant@upi';
  const balanceToPay = (invoice.balanceAmount || 0) > 0 ? invoice.balanceAmount : invoice.grandTotal;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(business?.name || 'ServiFlow Merchant')}&am=${balanceToPay}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoice.invoiceNumber)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(upiUrl)}`;

  const itemsRows = (invoice.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="padding: 9px 10px; text-align: center; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #64748b; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #1e293b; font-size: 11px;">
          ${escapeHtml(item.description)}
        </td>
        <td style="padding: 9px 10px; text-align: center; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 11px;">${item.quantity}</td>
        <td style="padding: 9px 10px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 11px;">${currency}${(item.rate || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 9px 10px; text-align: center; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 11px;">${item.taxPercent || 18}%</td>
        <td style="padding: 9px 10px; text-align: right; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: #0f172a; font-size: 11px;">${currency}${(item.amount || 0).toLocaleString('en-IN')}</td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <title>Invoice - ${escapeHtml(invoice.invoiceNumber)}</title>
      <style>
        @page {
          size: A4;
          margin: 14mm 16mm 14mm 16mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          background-color: #ffffff;
          font-size: 11px;
          line-height: 1.5;
        }
        .invoice-card {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          position: relative;
        }
        .badge-paid {
          display: inline-block;
          padding: 4px 12px;
          background-color: #dcfce7;
          color: #15803d;
          font-weight: 800;
          font-size: 11px;
          border-radius: 6px;
          border: 1px solid #86efac;
          letter-spacing: 0.5px;
        }
        .badge-due {
          display: inline-block;
          padding: 4px 12px;
          background-color: #fee2e2;
          color: #b91c1c;
          font-weight: 800;
          font-size: 11px;
          border-radius: 6px;
          border: 1px solid #fca5a5;
          letter-spacing: 0.5px;
        }
        @media print {
          body { background: transparent; }
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <!-- Top Branding Bar -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid ${themeColors.primary};">
          <div>
            <div style="font-size: 20px; font-weight: 900; color: ${themeColors.primary}; letter-spacing: -0.5px;">
              ${escapeHtml(business?.name || 'ServiFlow Services')}
            </div>
            <div style="color: #475569; font-size: 11px; margin-top: 2px;">
              ${escapeHtml(business?.address || '')}${business?.city ? ', ' + escapeHtml(business.city) : ''}
              ${business?.state ? ', ' + escapeHtml(business.state) : ''} ${escapeHtml(business?.pin || '')}
            </div>
            <div style="color: #475569; font-size: 11px; margin-top: 1px;">
              ${business?.mobile ? labels.phone + ': ' + escapeHtml(business.mobile) + ' • ' : ''}
              ${business?.email ? labels.email + ': ' + escapeHtml(business.email) : ''}
            </div>
            ${business?.gstNumber ? `
              <div style="font-weight: 700; color: #334155; font-size: 11px; margin-top: 2px;">
                ${labels.gstin}: <span style="font-family: monospace; font-size: 11.5px; color: ${themeColors.primary};">${escapeHtml(business.gstNumber)}</span>
              </div>
            ` : ''}
          </div>

          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 900; color: ${themeColors.primary}; text-transform: uppercase; letter-spacing: 0.5px;">
              ${labels.docType}
            </div>
            <div style="font-size: 12px; font-weight: 800; font-family: monospace; color: #0f172a; margin-top: 3px;">
              ${escapeHtml(invoice.invoiceNumber)}
            </div>
            <div style="margin-top: 6px;">
              ${isPaid ? `<span class="badge-paid">✓ PAID</span>` : `<span class="badge-due">PAYMENT DUE</span>`}
            </div>
          </div>
        </div>

        <!-- Meta Grid -->
        <div style="display: flex; justify-content: space-between; margin-top: 14px; padding: 12px; background-color: ${themeColors.primaryLight}; border-radius: 8px; border: 1px solid ${themeColors.border};">
          <div style="flex: 1.2;">
            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
              ${labels.billTo}
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">
              ${escapeHtml(customer?.name || 'Valued Customer')}
            </div>
            ${customer?.mobile ? `
              <div style="color: #475569; font-size: 11px; margin-top: 1px;">
                ${labels.phone}: ${escapeHtml(customer.mobile)}
              </div>
            ` : ''}
            ${customer?.address ? `
              <div style="color: #475569; font-size: 11px;">
                ${escapeHtml(customer.address)}${customer.city ? ', ' + escapeHtml(customer.city) : ''}
              </div>
            ` : ''}
            ${customer?.gstNumber ? `
              <div style="font-weight: 700; color: #334155; font-size: 11px; margin-top: 2px;">
                ${labels.gstin}: <span style="font-family: monospace;">${escapeHtml(customer.gstNumber)}</span>
              </div>
            ` : ''}
          </div>

          <div style="flex: 0.8; text-align: right;">
            <table style="margin-left: auto; font-size: 11px; border-collapse: collapse;">
              <tr>
                <td style="padding: 2px 8px; font-weight: 600; color: #64748b;">${labels.date}</td>
                <td style="padding: 2px 0; font-weight: 700; color: #0f172a; font-family: monospace;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 2px 8px; font-weight: 600; color: #64748b;">${labels.dueDate}</td>
                <td style="padding: 2px 0; font-weight: 700; color: #0f172a; font-family: monospace;">${formattedDueDate}</td>
              </tr>
              <tr>
                <td style="padding: 2px 8px; font-weight: 600; color: #64748b;">${labels.status}</td>
                <td style="padding: 2px 0; font-weight: 800; color: ${isPaid ? '#16a34a' : '#dc2626'};">${isPaid ? 'PAID' : 'PENDING'}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 8px 10px; width: 35px; text-align: center; color: #475569; font-weight: 700; font-size: 10.5px;">${labels.colNum}</th>
              <th style="padding: 8px 10px; text-align: left; color: #475569; font-weight: 700; font-size: 10.5px;">${labels.colDesc}</th>
              <th style="padding: 8px 10px; width: 50px; text-align: center; color: #475569; font-weight: 700; font-size: 10.5px;">${labels.colQty}</th>
              <th style="padding: 8px 10px; width: 90px; text-align: right; color: #475569; font-weight: 700; font-size: 10.5px;">${labels.colRate}</th>
              <th style="padding: 8px 10px; width: 60px; text-align: center; color: #475569; font-weight: 700; font-size: 10.5px;">${labels.colGst}</th>
              <th style="padding: 8px 10px; width: 100px; text-align: right; color: #475569; font-weight: 700; font-size: 10.5px;">${labels.colAmount}</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Totals & Payments Section -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 14px; gap: 16px;">
          <!-- Left: Payment Options & UPI QR Code -->
          <div style="flex: 1.2; padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #334155; margin-bottom: 8px;">
              ${labels.bankDetails}
            </div>

            <div style="display: flex; gap: 14px; align-items: center;">
              ${!isPaid ? `
                <div style="text-align: center; background: #ffffff; padding: 6px; border-radius: 6px; border: 1px solid #cbd5e1; shrink: 0;">
                  <img src="${qrCodeUrl}" alt="UPI QR" width="105" height="105" style="display: block; margin: 0 auto;" />
                  <div style="font-size: 8.5px; font-weight: 700; color: #475569; margin-top: 3px;">
                    GPay • PhonePe • Paytm
                  </div>
                </div>
              ` : ''}

              <div style="font-size: 10.5px; line-height: 1.6; color: #334155;">
                <div><strong>UPI ID:</strong> <span style="font-family: monospace; color: ${themeColors.primary}; font-weight: 700;">${escapeHtml(upiId)}</span></div>
                <div><strong>Account Name:</strong> ${escapeHtml(business?.name || 'ServiFlow Merchant')}</div>
                <div><strong>Bank Name:</strong> HDFC Bank / State Bank of India</div>
                <div><strong>A/C No:</strong> 50200012345678</div>
                <div><strong>IFSC Code:</strong> HDFC0001234</div>
              </div>
            </div>
          </div>

          <!-- Right: Mathematical Summary -->
          <div style="flex: 0.9;">
            <table style="width: 100%; font-size: 11.5px; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 6px; color: #64748b; font-weight: 500;">${labels.subtotal}</td>
                <td style="padding: 4px 6px; text-align: right; font-weight: 600; color: #1e293b;">${currency}${(invoice.subtotal || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 4px 6px; color: #64748b; font-weight: 500;">${labels.tax}</td>
                <td style="padding: 4px 6px; text-align: right; font-weight: 600; color: #1e293b;">${currency}${(invoice.taxTotal || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; background-color: ${themeColors.primaryLight};">
                <td style="padding: 8px 6px; font-weight: 800; color: ${themeColors.primary}; font-size: 13px;">${labels.grandTotal}</td>
                <td style="padding: 8px 6px; text-align: right; font-weight: 900; color: ${themeColors.primary}; font-size: 13px; font-family: monospace;">${currency}${(invoice.grandTotal || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 4px 6px; color: #16a34a; font-weight: 700;">${labels.paidAmount}</td>
                <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #16a34a; font-family: monospace;">${currency}${(invoice.paidAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr style="border-top: 1px solid #e2e8f0;">
                <td style="padding: 6px 6px; color: ${isPaid ? '#64748b' : '#dc2626'}; font-weight: 800;">${labels.balanceDue}</td>
                <td style="padding: 6px 6px; text-align: right; font-weight: 900; color: ${isPaid ? '#64748b' : '#dc2626'}; font-family: monospace; font-size: 12px;">${currency}${(invoice.balanceAmount || 0).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Terms & Signature Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 14px; border-top: 1px solid #e2e8f0;">
          <div style="max-width: 60%; font-size: 9.5px; color: #64748b; line-height: 1.5;">
            <strong>${labels.terms}</strong><br>
            1. All payments must be remitted within the specified due date.<br>
            2. Goods once serviced or parts replaced carry warranty as per manufacturer policy.<br>
            3. This is a computer-generated tax invoice verified under Indian GST standards.<br>
            <span style="font-style: italic; color: #94a3b8;">${labels.generatedBy}</span>
          </div>

          <div style="text-align: center; width: 180px;">
            <div style="height: 40px;"></div>
            <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: 800; font-size: 10.5px; color: #0f172a;">
              ${labels.authorizedSign}
            </div>
            <div style="font-size: 9.5px; color: #64748b;">
              ${escapeHtml(business?.name || '')}
            </div>
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
