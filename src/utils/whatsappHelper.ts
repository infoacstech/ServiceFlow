/**
 * WhatsApp Helper Utilities for ServiFlow Field Service Management
 * Provides formatted messages and one-click WhatsApp action links for
 * Technicians, Customers, Dispatchers, and Billing.
 * Supports English, Hindi, and Marathi dynamically based on the user's active language.
 */

import { Business, Customer, Invoice, Job, Quotation, RecurringContract, User } from '../types';
import { formatIndiaDate } from './dateUtils';

export const getActiveAppLanguage = (): string => {
  try {
    return localStorage.getItem('serviflow_active_language') || 'en';
  } catch {
    return 'en';
  }
};

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
  // Uses api.whatsapp.com to trigger standard OS package chooser when both
  // regular WhatsApp and WhatsApp Business are installed on the device.
  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * 1. Dispatch Job Details to Assigned Field Technician
 */
export const sendJobDispatchToTechnician = (
  job: Job,
  customer?: Customer,
  technician?: User,
  business?: Business,
  lang: string = getActiveAppLanguage()
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

  let message = '';
  if (lang === 'hi') {
    message = `🛠️ *नया कार्य सौंपा गया - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
📌 *जॉब आईडी:* ${job.jobId}
🎯 *सेवा:* ${job.description}
⚡ *प्राथमिकता:* ${(job.priority || 'Normal').toUpperCase()}
📅 *निर्धारित दिनांक:* ${scheduledFormatted}

👤 *ग्राहक विवरण:*
• *नाम:* ${customer?.name || 'ग्राहक'}
• *मोबाइल:* ${customer?.mobile || 'N/A'}${customer?.companyName ? `\n• *कंपनी:* ${customer.companyName}` : ''}

📍 *साइट का पता:*
${job.location || customer?.address || 'साइट का पता'}

💰 *अनुमानित राशि:* ${currency}${estAmount}
━━━━━━━━━━━━━━━━━━━━
_कृपया इस कार्य को देखने और अपडेट करने के लिए ServiFlow ऐप खोलें।_`;
  } else if (lang === 'mr') {
    message = `🛠️ *नवीन काम वाटप झाले - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
📌 *जॉब आयडी:* ${job.jobId}
🎯 *सेवा:* ${job.description}
⚡ *प्राधान्य:* ${(job.priority || 'Normal').toUpperCase()}
📅 *नियोजित तारीख:* ${scheduledFormatted}

👤 *ग्राहक तपशील:*
• *नाव:* ${customer?.name || 'ग्राहक'}
• *मोबाईल:* ${customer?.mobile || 'N/A'}${customer?.companyName ? `\n• *कंपनी:* ${customer.companyName}` : ''}

📍 *पत्ता:*
${job.location || customer?.address || 'पत्ता'}

💰 *अंदाजे रक्कम:* ${currency}${estAmount}
━━━━━━━━━━━━━━━━━━━━
_हे काम पाहण्यासाठी व अपडेट करण्यासाठी कृपया ServiFlow ॲप उघडा._`;
  } else {
    message = `🛠️ *NEW JOB ASSIGNED - ${business?.name || 'ServiFlow'}*
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
  }

  openWhatsApp(techPhone, message);
};

/**
 * 2. Send "Technician On The Way" Alert to Customer
 */
export const sendTechnicianOnTheWayAlert = (
  job: Job,
  customer?: Customer,
  technician?: User,
  business?: Business,
  lang: string = getActiveAppLanguage()
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const techName = technician?.name || 'Our Service Technician';
  const techPhone = technician?.phone || business?.mobile || '';

  let message = '';
  if (lang === 'hi') {
    message = `🚗 *तकनीशियन रास्ते में है - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्ते *${customer?.name || 'आदरणीय ग्राहक'}*,

हमारे सर्विस इंजीनियर *${techName}* आपके सर्विस कार्य *${job.jobId}* (*${job.description}*) के लिए आपके पते पर निकल चुके हैं।

⏰ *समय स्लॉट:* ${job.scheduledTimeSlot || job.scheduledTime || 'शीघ्र'}
📞 *तकनीशियन संपर्क:* ${techPhone}
🏢 *हेल्पलाइन:* ${business?.mobile || ''}

_${business?.name || 'हमारी सेवा'} चुनने के लिए धन्यवाद!_`;
  } else if (lang === 'mr') {
    message = `🚗 *तंत्रज्ञ मार्गावर आहेत - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्कार *${customer?.name || 'सन्माननीय ग्राहक'}*,

आमचे सर्विस इंजिनिअर *${techName}* आपल्या कामासाठी *${job.jobId}* (*${job.description}*) आपल्या पत्त्यावर निघत आहेत.

⏰ *वेळ स्लॉट:* ${job.scheduledTimeSlot || job.scheduledTime || 'लवकरच'}
📞 *तंत्रज्ञ संपर्क:* ${techPhone}
🏢 *हेल्पलाईन:* ${business?.mobile || ''}

_${business?.name || 'आमची सेवा'} निवडल्याबद्दल धन्यवाद!_`;
  } else {
    message = `🚗 *TECHNICIAN ON THE WAY - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Valued Customer'}*,

Our field engineer *${techName}* is on the way to your location for service job *${job.jobId}* (*${job.description}*).

⏰ *Slot / Time:* ${job.scheduledTimeSlot || job.scheduledTime || 'Shortly'}
📞 *Technician Contact:* ${techPhone}
🏢 *Support Helpline:* ${business?.mobile || ''}

_Thank you for choosing ${business?.name || 'our service'}!_`;
  }

  openWhatsApp(custPhone, message);
};

/**
 * 3. Send Job Completion & Digital Signoff Report to Customer
 */
export const sendJobCompletionSummaryToCustomer = (
  job: Job,
  customer?: Customer,
  technician?: User,
  business?: Business,
  lang: string = getActiveAppLanguage()
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const techName = technician?.name || 'Field Technician';

  let message = '';
  if (lang === 'hi') {
    message = `✅ *सेवा कार्य सफलतापूर्वक पूर्ण - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्ते *${customer?.name || 'आदरणीय ग्राहक'}*,

आपका सेवा कार्य *${job.jobId}*, *${techName}* द्वारा सफलतापूर्वक पूरा कर दिया गया है।

📋 *कार्य विवरण:*
• *सेवा समस्या:* ${job.description}
• *पाई गई समस्या:* ${job.problemFound || 'मानक निरीक्षण एवं सर्विसिंग'}
• *प्रदान किया गया समाधान:* ${job.solutionProvided || 'सफलतापूर्वक मरम्मत और परीक्षण'}
${job.customerRating ? `• *रेटिंग:* ${job.customerRating} / 5 ⭐` : ''}

💰 *कुल राशि:* ${business?.currency || '₹'}${job.estimatedAmount || 0}

📞 *हेल्पलाइन / प्रश्न:* ${business?.mobile || ''}
_हमारे साथ जुड़ने के लिए धन्यवाद!_`;
  } else if (lang === 'mr') {
    message = `✅ *सेवा काम यशस्वीरित्या पूर्ण - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्कार *${customer?.name || 'सन्माननीय ग्राहक'}*,

आपले सेवा काम *${job.jobId}*, *${techName}* यांच्याद्वारे यशस्वीरित्या पूर्ण झाले आहे.

📋 *कामाचा तपशील:*
• *समस्या:* ${job.description}
• *तपासणी निष्कर्ष:* ${job.problemFound || 'मानक तपासणी व देखभाल'}
• *केलेले काम:* ${job.solutionProvided || 'दुरुस्ती व चाचणी यशस्वीरित्या पूर्ण'}
${job.customerRating ? `• *रेटिंग:* ${job.customerRating} / 5 ⭐` : ''}

💰 *एकूण रक्कम:* ${business?.currency || '₹'}${job.estimatedAmount || 0}

📞 *हेल्पलाईन / संपर्क:* ${business?.mobile || ''}
_आपल्या सहकार्याबद्दल धन्यवाद!_`;
  } else {
    message = `✅ *SERVICE JOB COMPLETED - ${business?.name || 'ServiFlow'}*
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
  }

  openWhatsApp(custPhone, message);
};

/**
 * 4. Request 5-Star Google Review from Customer
 */
export const sendGoogleReviewRequest = (
  customer?: Customer,
  business?: Business,
  googleReviewUrl?: string,
  lang: string = getActiveAppLanguage()
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const bizName = business?.name || 'Our Team';
  const reviewLink =
    googleReviewUrl ||
    `https://www.google.com/search?q=${encodeURIComponent((business?.name || 'Service') + ' ' + (business?.city || ''))}`;

  let message = '';
  if (lang === 'hi') {
    message = `⭐ *${bizName.toUpperCase()} के साथ अपना अनुभव रेट करें*
━━━━━━━━━━━━━━━━━━━━
नमस्ते *${customer?.name || 'आदरणीय ग्राहक'}*,

आशा है कि आज हमारी सेवा से आप पूर्णतः संतुष्ट होंगे!

यदि आपका अनुभव अच्छा रहा, तो कृपया Google पर हमें *5-स्टार रेटिंग* देने के लिए केवल 10 सेकंड निकालें। इससे हमारी टीम को बहुत प्रेरणा मिलती है! 🙏

🌟 *रेटिंग देने के लिए यहाँ क्लिक करें:*
${reviewLink}

_${bizName} का समर्थन करने के लिए धन्यवाद!_`;
  } else if (lang === 'mr') {
    message = `⭐ *${bizName.toUpperCase()} सोबत आपला अनुभव रेट करा*
━━━━━━━━━━━━━━━━━━━━
नमस्कार *${customer?.name || 'सन्माननीय ग्राहक'}*,

आशा आहे की आजच्या आमच्या सेवेमुळे आपण समाधानी असाल!

आपला अनुभव चांगला असल्यास कृपया Google वर आम्हाला *5-स्टार रेटिंग* देण्यासाठी फक्त 10 सेकंद द्या. यामुळे आमच्या स्थानिक टीमला खूप मदत होते! 🙏

🌟 *आपला अभिप्राय देण्यासाठी येथे टॅप करा:*
${reviewLink}

_${bizName} ला पाठिंबा दिल्याबद्दल धन्यवाद!_`;
  } else {
    message = `⭐ *RATE YOUR EXPERIENCE WITH ${bizName.toUpperCase()}*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Valued Customer'}*,

We hope you were delighted with our service today! 

If you had a great experience, please take just 10 seconds to give us a *5-Star rating on Google*. It helps our local team immensely! 🙏

🌟 *Tap to leave your review:*
${reviewLink}

_Thank you for supporting ${bizName}!_`;
  }

  openWhatsApp(custPhone, message);
};

/**
 * 5. Send Invoice Details & Instant UPI Payment Link to Customer
 */
export const sendInvoiceWhatsAppReminder = (
  invoice: Invoice,
  customer?: Customer,
  business?: Business,
  lang: string = getActiveAppLanguage()
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const curr = business?.currency || '₹';

  // UPI Link format: upi://pay?pa=...&pn=...&am=...&cu=INR
  const upiId = business?.email ? business.email.split('@')[0] + '@upi' : '';
  const balanceToPay = invoice.balanceAmount !== undefined ? invoice.balanceAmount : (invoice.grandTotal || 0);
  const upiLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(business?.name || 'Merchant')}&am=${balanceToPay}&cu=INR&tn=${encodeURIComponent('Invoice ' + invoice.invoiceNumber)}`
    : '';

  let message = '';
  if (lang === 'hi') {
    message = `🧾 *टैक्स इनवॉइस और भुगतान विवरण - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्ते *${customer?.name || 'आदरणीय ग्राहक'}*,

*${business?.name || 'हमारी कंपनी'}* के साथ आपकी हालिया सेवा का इनवॉइस विवरण नीचे दिया गया है।

📄 *इनवॉइस संख्या:* ${invoice.invoiceNumber}
📅 *दिनांक:* ${invoice.date}
⏰ *अंतिम तिथि:* ${invoice.dueDate}

💰 *बिल सारांश:*
• *कुल योग:* ${curr}${invoice.grandTotal}
• *जमा राशि:* ${curr}${invoice.paidAmount}
• *शेष देय राशि:* *${curr}${invoice.balanceAmount}*
${invoice.notes ? `\n📝 *विवरण:* ${invoice.notes}` : ''}

💳 *भुगतान विकल्प:*
• *Google Pay / PhonePe / Paytm / UPI:* ${business?.mobile || '9999999999'}
${business?.gstNumber ? `• *GSTIN:* ${business.gstNumber}` : ''}
${upiLink ? `📲 *त्वरित UPI भुगतान लिंक:* ${upiLink}\n` : ''}
_कृपया ${invoice.dueDate} से पहले भुगतान सुनिश्चित करें। धन्यवाद!_`;
  } else if (lang === 'mr') {
    message = `🧾 *टॅक्स इन्व्हॉइस आणि पेमेंट तपशील - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्कार *${customer?.name || 'सन्माननीय ग्राहक'}*,

*${business?.name || 'आमच्या कंपनी'}* कडून घेतलेल्या सेवेचे इन्व्हॉइस तपशील खालीलप्रमाणे आहे.

📄 *इन्व्हॉइस क्रमांक:* ${invoice.invoiceNumber}
📅 *तारीख:* ${invoice.date}
⏰ *अंतिम मुदत:* ${invoice.dueDate}

💰 *बिल सारांश:*
• *एकूण रक्कम:* ${curr}${invoice.grandTotal}
• *भरलेली रक्कम:* ${curr}${invoice.paidAmount}
• *उर्वरित बाकी:* *${curr}${invoice.balanceAmount}*
${invoice.notes ? `\n📝 *टीप:* ${invoice.notes}` : ''}

💳 *पेमेंट पर्याय:*
• *Google Pay / PhonePe / Paytm / UPI:* ${business?.mobile || '9999999999'}
${business?.gstNumber ? `• *GSTIN:* ${business.gstNumber}` : ''}
${upiLink ? `📲 *तातडीची UPI पेमेंट लिंक:* ${upiLink}\n` : ''}
_कृपया ${invoice.dueDate} पूर्वी पेमेंट करावे. धन्यवाद!_`;
  } else {
    message = `🧾 *TAX INVOICE & PAYMENT DETAILS - ${business?.name || 'ServiFlow'}*
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
  }

  openWhatsApp(custPhone, message);
};

/**
 * 6. Send AMC / Service Warranty Renewal Reminder to Customer
 */
export const sendContractRenewalWhatsApp = (
  contract: RecurringContract,
  customer?: Customer,
  business?: Business,
  lang: string = getActiveAppLanguage()
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const curr = business?.currency || '₹';

  let message = '';
  if (lang === 'hi') {
    message = `🛡️ *AMC अनुबंध नवीनीकरण सूचना - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्ते *${customer?.name || 'आदरणीय ग्राहक'}*,

यह एक विनम्र सूचना है कि आपका वार्षिक रखरखाव अनुबंध (AMC) जल्द ही नवीनीकरण के लिए नियत है।

📄 *अनुबंध संख्या:* ${contract.contractNumber}
🏷️ *प्लान का नाम:* ${contract.name}
📅 *समाप्ति तिथि:* ${contract.endDate}
🔄 *उपयोग की गई विजिट्स:* ${contract.visitsUsed} में से ${contract.visitsAllowed} पूर्ण

💰 *नवीनीकरण मूल्य:* *${curr}${contract.contractAmount}* / वर्ष

निरंतर वारंटी कवरेज और प्राथमिकता सहायता के लिए कृपया अपना नवीनीकरण सुनिश्चित करें।

📞 *नवीनीकरण हेतु कॉल या उत्तर दें:* ${business?.mobile || business?.whatsapp || ''}
_टीम ${business?.name || 'ServiFlow'}_`;
  } else if (lang === 'mr') {
    message = `🛡️ *AMC करार नूतनीकरण सूचना - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्कार *${customer?.name || 'सन्माननीय ग्राहक'}*,

आपला वार्षिक देखभाल करार (AMC) लवकरच नूतनीकरणासाठी येत आहे याची ही आठवण.

📄 *करार क्रमांक:* ${contract.contractNumber}
🏷️ *प्लॅनचे नाव:* ${contract.name}
📅 *समाप्ती तारीख:* ${contract.endDate}
🔄 *झालेल्या व्हिजिट्स:* ${contract.visitsUsed} पैकी ${contract.visitsAllowed} पूर्ण

💰 *नूतनीकरण शुल्क:* *${curr}${contract.contractAmount}* / वर्ष

वारंटी आणि प्राधान्य सेवा अखंड चालू ठेवण्यासाठी कृपया आपले नूतनीकरण निश्चित करा.

📞 *नूतनीकरणासाठी संपर्क साधा:* ${business?.mobile || business?.whatsapp || ''}
_टीम ${business?.name || 'ServiFlow'}_`;
  } else {
    message = `🛡️ *AMC CONTRACT RENEWAL ALERT - ${business?.name || 'ServiFlow'}*
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
  }

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
  technicianName?: string,
  lang: string = getActiveAppLanguage()
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const scheduledDate = visitDate || contract.nextVisitDate || 'Upcoming';
  const slot = timeSlot || '10:00 AM - 01:00 PM';
  const visitNum = (contract.visitsUsed || 0) + 1;
  const techText = technicianName ? `\n👷 *इंजीनियर / Engineer:* ${technicianName}` : '';
  const equipText = contract.equipmentDetails ? `\n⚙️ *उपकरण / Equipment:* ${contract.equipmentDetails}` : '';

  let message = '';
  if (lang === 'hi') {
    message = `🛠️ *निवारक रखरखाव विजिट अलर्ट - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्ते *${customer?.name || 'आदरणीय ग्राहक'}*,

आपके AMC अनुबंध के तहत निर्धारित निवारक रखरखाव सेवा नियत है:

📄 *अनुबंध संख्या:* ${contract.contractNumber} (${contract.name})
🎯 *निर्धारित विजिट:* विजिट #${visitNum} (${contract.visitsAllowed} में से)
📅 *विजिट दिनांक:* *${scheduledDate}*
⏰ *पसंदीदा स्लॉट:* ${slot}${techText}${equipText}

📍 *सेवा स्थल:*
${customer?.address || 'आपका पंजीकृत पता'}

हमारे सर्विस इंजीनियर आपके उपकरण की जांच और सर्विसिंग के लिए पहुंचेंगे।

_समय बदलना चाहते हैं? कृपया इस संदेश का उत्तर दें या कॉल करें: ${business?.mobile || business?.whatsapp || ''}_

*${business?.name || 'ServiFlow'}* चुनने के लिए धन्यवाद!`;
  } else if (lang === 'mr') {
    message = `🛠️ *नियमित देखभाल भेट सूचना - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्कार *${customer?.name || 'सन्माननीय ग्राहक'}*,

आपल्या AMC करारांतर्गत नियमित तपासणी आणि सर्व्हिसिंग नियोजित आहे:

📄 *करार क्रमांक:* ${contract.contractNumber} (${contract.name})
🎯 *नियोजित भेट:* भेट #${visitNum} (${contract.visitsAllowed} पैकी)
📅 *भेटीची तारीख:* *${scheduledDate}*
⏰ *वेळ स्लॉट:* ${slot}${techText}${equipText}

📍 *पत्ता:*
${customer?.address || 'आपला नोंदणीकृत पत्ता'}

आमचे सेवा अभियंता आपल्या उपकरणांची तपासणी व देखभाल करण्यासाठी वेळेवर उपस्थित राहतील.

_वेळ बदलायची असल्यास कृपया या मेसेजला उत्तर द्या किंवा कॉल करा: ${business?.mobile || business?.whatsapp || ''}_

*${business?.name || 'ServiFlow'}* निवडल्याबद्दल धन्यवाद!`;
  } else {
    message = `🛠️ *PREVENTIVE MAINTENANCE VISIT ALERT - ${business?.name || 'ServiFlow'}*
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
  }

  openWhatsApp(custPhone, message);
};

/**
 * 8. Send Official Quotation / Estimate to Customer via WhatsApp
 */
export const sendQuotationWhatsApp = (
  quotation: Quotation,
  customer?: Customer,
  business?: Business,
  lang: string = getActiveAppLanguage()
) => {
  const custPhone = customer?.whatsapp || customer?.mobile || '';
  const curr = business?.currency || '₹';

  const itemsList = (quotation.items || [])
    .map(
      (it, idx) =>
        `${idx + 1}. *${it.description}*\n   Qty: ${it.quantity} × ${curr}${it.rate} = *${curr}${it.amount}*`
    )
    .join('\n');

  const formattedDate = formatIndiaDate(quotation.date);
  const formattedValidUntil = formatIndiaDate(quotation.validUntil);

  const taxDetails =
    quotation.taxTotal > 0
      ? `• *Subtotal:* ${curr}${quotation.subtotal.toLocaleString('en-IN')}\n• *GST / Tax:* ${curr}${quotation.taxTotal.toLocaleString('en-IN')}\n`
      : '';

  let message = '';
  if (lang === 'hi') {
    message = `📋 *सेवा कोटेशन / अनुमान - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्ते *${customer?.name || 'आदरणीय ग्राहक'}*,

आपकी अनुरोधित सेवा के लिए आधिकारिक मूल्य कोटेशन नीचे दिया गया है:

📄 *कोटेशन संख्या:* *${quotation.quotationNumber}*
📅 *दिनांक:* ${formattedDate}
⏳ *वैधता तिथि:* *${formattedValidUntil}*

📝 *आइटम विवरण:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
${taxDetails}💰 *कुल राशि (Grand Total):* *${curr}${quotation.grandTotal.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━
${quotation.notes ? `📌 *नोट्स:* ${quotation.notes}\n` : ''}
इस कोटेशन को स्वीकृत करने या किसी स्पष्टीकरण के लिए कृपया इस संदेश का उत्तर दें या संपर्क करें: *${business?.mobile || business?.whatsapp || ''}*।

आपके सहयोग के लिए धन्यवाद!
_टीम ${business?.name || 'ServiFlow'}_`;
  } else if (lang === 'mr') {
    message = `📋 *सर्व्हिस कोटेशन / अंदाजपत्रक - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
नमस्कार *${customer?.name || 'सन्माननीय ग्राहक'}*,

आपल्या मागणीनुसार अधिकृत दरपत्रक खालीलप्रमाणे आहे:

📄 *कोटेशन क्रमांक:* *${quotation.quotationNumber}*
📅 *तारीख:* ${formattedDate}
⏳ *वैधता मुदत:* *${formattedValidUntil}*

📝 *आयटम तपशील:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
${taxDetails}💰 *एकूण रक्कम (Grand Total):* *${curr}${quotation.grandTotal.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━
${quotation.notes ? `📌 *टीप:* ${quotation.notes}\n` : ''}
हे कोटेशन मंजूर करण्यासाठी किंवा अधिक माहितीसाठी कृपया येथे उत्तर द्या किंवा संपर्क करा: *${business?.mobile || business?.whatsapp || ''}*.

आपल्या सहकार्याबद्दल धन्यवाद!
_टीम ${business?.name || 'ServiFlow'}_`;
  } else {
    message = `📋 *SERVICE ESTIMATE / QUOTATION - ${business?.name || 'ServiFlow'}*
━━━━━━━━━━━━━━━━━━━━
Dear *${customer?.name || 'Valued Customer'}*,

Here is the official price quotation for your requested service:

📄 *Quotation No:* *${quotation.quotationNumber}*
📅 *Date:* ${formattedDate}
⏳ *Valid Until:* *${formattedValidUntil}*

📝 *Line Items:*
${itemsList}

━━━━━━━━━━━━━━━━━━━━
${taxDetails}💰 *Grand Total:* *${curr}${quotation.grandTotal.toLocaleString('en-IN')}*
━━━━━━━━━━━━━━━━━━━━
${quotation.notes ? `📌 *Notes:* ${quotation.notes}\n` : ''}
To approve this estimate or for any clarifications, please reply directly to this message or contact us at *${business?.mobile || business?.whatsapp || ''}*.

Thank you for your business!
_Team ${business?.name || 'ServiFlow'}_`;
  }

  openWhatsApp(custPhone, message);
};

