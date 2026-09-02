/**
 * WhatsApp Helper Utilities for ServiFlow Field Service Management
 * Provides formatted messages and one-click WhatsApp action links for
 * Technicians, Customers, Dispatchers, and Billing.
 */

import { Business, Customer, Invoice, Job, RecurringContract, User } from '../types';

export const sanitizePhoneNumber = (phone: string): string => {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  // If 10-digit Indian phone number without country code, prepend 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

export const openWhatsApp = (phone: string, text: string) => {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(text);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * 1. Dispatch Job Details to Assigned Field Technician
 */
export const sendJobDispatchToTechnician = (
  job: Job,
  customer?: Customer,
  technician?: User,
  business?: Business
) => {
  const techPhone = technician?.phone || '';
  const estAmount =
    typeof job.estimatedAmount === 'number'
      ? job.estimatedAmount
      : Number(job.estimatedAmount) || 0;
  const currency = business?.currency || '₹';
  const timeSlot = job.scheduledTimeSlot || job.scheduledTime || '';
  const scheduledFormatted = timeSlot
    ? `${job.scheduledDate} (${timeSlot})`
    : job.scheduledDate || 'Scheduled';

  const message = `🛠️ *NEW JOB ASSIGNED - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
📌 *Job ID:* ${job.jobId}
🎯 *Service:* ${job.description}
⚡ *Priority:* ${(job.priority || 'Normal').toUpperCase()}
📅 *Scheduled:* ${scheduledFormatted}

👤 *Customer Details:*
• *Name:* ${customer?.name || 'Customer'}
• *Mobile:* ${customer?.mobile || 'N/A'}${customer?.companyName ? `\n• *Company:* ${customer.companyName}` : ''}

📍 *Site Address:*
${job.location || customer?.address || 'Site Address'}

💰 *Est. Amount:* ${currency}${estAmount}
━━━━━━━━━━━━━━━━━━━━
_Please open the ServiFlow App to view and manage this job._`;

  openWhatsApp(techPhone, message);
};

/**
 * 2. Send "Technician On The Way" Alert to Customer
 */
export const sendTechnicianOnTheWayAlert = (
  job: Job,
  customer?: Customer,
  technician?: User,
  business?: Business
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const techName = technician?.name || 'Our Service Technician';
  const techPhone = technician?.phone || business?.mobile || '';

  const message = `🚗 *TECHNICIAN ON THE WAY - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Valued Customer'}*,

Our field engineer *${techName}* is on the way to your location for service job *${job.jobId}* (*${job.description}*).

⏰ *Slot / Time:* ${job.scheduledTimeSlot || job.scheduledTime || 'Shortly'}
📞 *Technician Contact:* ${techPhone}
🏢 *Support Helpline:* ${business?.mobile || ''}

_Thank you for choosing ${business?.name || 'our service'}!_`;

  openWhatsApp(custPhone, message);
};

/**
 * 3. Send Job Completion & Digital Signoff Report to Customer
 */
export const sendJobCompletionSummaryToCustomer = (
  job: Job,
  customer?: Customer,
  technician?: User,
  business?: Business
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const techName = technician?.name || 'Field Technician';

  const message = `✅ *SERVICE JOB COMPLETED - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Valued Customer'}*,

Your service job *${job.jobId}* has been successfully completed by *${techName}*.

📋 *Work Summary:*
• *Service Issue:* ${job.description}
• *Problem Found:* ${job.problemFound || 'Standard Inspection & Maintenance'}
• *Solution Provided:* ${job.solutionProvided || 'Repaired & Verified Successfully'}
${job.customerRating ? `• *Service Rating:* ${job.customerRating} / 5 ⭐` : ''}

💰 *Total Amount:* ${business?.currency || '₹'}${job.estimatedAmount || 0}

📞 *Helpline / Questions:* ${business?.mobile || ''}
_Thank you for your business!_`;

  openWhatsApp(custPhone, message);
};

/**
 * 4. Request 5-Star Google Review from Customer
 */
export const sendGoogleReviewRequest = (
  customer?: Customer,
  business?: Business,
  googleReviewUrl?: string
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const bizName = business?.name || 'Our Team';
  const reviewLink =
    googleReviewUrl ||
    `https://www.google.com/search?q=${encodeURIComponent((business?.name || 'Service') + ' ' + (business?.city || ''))}`;

  const message = `⭐ *RATE YOUR EXPERIENCE WITH ${bizName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Valued Customer'}*,

We hope you were delighted with our service today! 

If you had a great experience, please take just 10 seconds to give us a *5-Star rating on Google*. It helps our local team immensely! 🙏

🌟 *Tap to leave your review:*
${reviewLink}

_Thank you for supporting ${bizName}!_`;

  openWhatsApp(custPhone, message);
};

/**
 * 5. Send Invoice Details & Instant UPI Payment Link to Customer
 */
export const sendInvoiceWhatsAppReminder = (
  invoice: Invoice,
  customer?: Customer,
  business?: Business
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const curr = business?.currency || '₹';

  // UPI Link format: upi://pay?pa=...&pn=...&am=...&cu=INR
  const upiId = business?.email ? business.email.split('@')[0] + '@upi' : '';
  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(business?.name || 'Merchant')}&am=${invoice.balanceAmount}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoice.invoiceNumber)}`
    : '';

  const message = `🧾 *TAX INVOICE & PAYMENT DETAILS - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Valued Customer'}*,

Here is the invoice for your recent service with *${business?.name || 'us'}*.

📄 *Invoice No:* ${invoice.invoiceNumber}
📅 *Date:* ${invoice.date}
⏰ *Due Date:* ${invoice.dueDate}

💰 *Invoice Summary:*
• *Grand Total:* ${curr}${invoice.grandTotal}
• *Paid Amount:* ${curr}${invoice.paidAmount}
• *Balance Due:* *${curr}${invoice.balanceAmount}*
${invoice.notes ? `\n📝 *Notes:* ${invoice.notes}` : ''}

💳 *Payment Options:*
• *Google Pay / PhonePe / Paytm / UPI:* ${business?.mobile || '9999999999'}
${business?.gstNumber ? `• *GSTIN:* ${business.gstNumber}` : ''}
${upiLink ? `📲 *Instant UPI Pay Link:* ${upiLink}\n` : ''}
_Kindly arrange the payment before ${invoice.dueDate}. Thank you!_`;

  openWhatsApp(custPhone, message);
};

/**
 * 6. Send AMC / Service Warranty Renewal Reminder to Customer
 */
export const sendContractRenewalWhatsApp = (
  contract: RecurringContract,
  customer?: Customer,
  business?: Business
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const curr = business?.currency || '₹';

  const message = `🛡️ *AMC CONTRACT RENEWAL ALERT - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Valued Customer'}*,

This is a friendly reminder that your Annual Maintenance Contract (AMC) is due for renewal soon.

📄 *Contract No:* ${contract.contractNumber}
🏷️ *Plan Name:* ${contract.name}
📅 *Expiry Date:* ${contract.endDate}
🔄 *Visits Rendered:* ${contract.visitsUsed} of ${contract.visitsAllowed} completed

💰 *Renewal Price:* *${curr}${contract.contractAmount}* / year

To ensure continuous warranty coverage and priority engineer support without interruption, please confirm your renewal.

📞 *Call or Reply to Renew:* ${business?.mobile || business?.whatsapp || ''}
_Team ${business?.name || 'ServiFlow'}_`;

  openWhatsApp(custPhone, message);
};

/**
 * 7. Send Scheduled AMC Maintenance Visit Reminder to Customer (Bot message)
 */
export const sendAmcVisitReminderWhatsApp = (
  contract: RecurringContract,
  customer?: Customer,
  business?: Business,
  visitDate?: string,
  timeSlot?: string,
  technicianName?: string
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const scheduledDate = visitDate || contract.nextVisitDate || 'Upcoming';
  const slot = timeSlot || '10:00 AM - 01:00 PM';
  const visitNum = (contract.visitsUsed || 0) + 1;
  const techText = technicianName ? `\n👷 *Assigned Engineer:* ${technicianName}` : '';
  const equipText = contract.equipmentDetails ? `\n⚙️ *Equipment Covered:* ${contract.equipmentDetails}` : '';

  const message = `🛠️ *PREVENTIVE MAINTENANCE VISIT ALERT - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Valued Customer'}*,

Your routine preventive maintenance service is due under your AMC contract:

📄 *Contract No:* ${contract.contractNumber} (${contract.name})
🎯 *Scheduled Visit:* Visit #${visitNum} of ${contract.visitsAllowed}
📅 *Visit Date:* *${scheduledDate}*
⏰ *Preferred Slot:* ${slot}${techText}${equipText}

📍 *Service Address:*
${customer?.address || 'Your Registered Site'}

Our service engineer will arrive to inspect, clean, and service your equipment for flawless performance.

_Need to reschedule? Kindly reply to this message or call our helpline: ${business?.mobile || business?.whatsapp || ''}_

Thank you for choosing *${business?.name || 'ServiFlow'}*!`;

  openWhatsApp(custPhone, message);
};

