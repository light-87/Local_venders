/**
 * WhatsApp Deep Link Utility
 * Creates wa.me links that open WhatsApp with pre-filled messages
 */

/**
 * Format phone number for WhatsApp
 * Removes all non-digits and ensures proper country code
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // If 10 digits, assume Indian number and add 91
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // If starts with 0, remove it and add 91
  if (digits.startsWith('0') && digits.length === 11) {
    return `91${digits.slice(1)}`;
  }

  // Return as-is if already has country code
  return digits;
}

/**
 * Encode text for URL (handles special characters)
 */
export function encodeWhatsAppMessage(text: string): string {
  return encodeURIComponent(text);
}

/**
 * Create a WhatsApp deep link
 */
export function createWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeWhatsAppMessage(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Generate maintenance reminder message (Health-focused for water purifiers)
 * Supports custom templates with placeholders: [Customer Name], [Item Name], [Date], [Time Slot], [Business Name]
 */
export function generateMaintenanceReminderMessage(params: {
  customerName: string;
  itemName: string;
  scheduledDate: string;
  timeSlot?: string;
  businessName: string;
  customTemplate?: string | null;
}): string {
  const { customerName, itemName, scheduledDate, timeSlot, businessName, customTemplate } = params;

  // If custom template provided, use it with placeholder replacement
  if (customTemplate) {
    let message = customTemplate;
    message = message.replace(/\[Customer Name\]/g, `*${customerName}*`);
    message = message.replace(/\[Item Name\]/g, `*${itemName}*`);
    message = message.replace(/\[Date\]/g, scheduledDate);
    message = message.replace(/\[Business Name\]/g, `_${businessName}_`);

    // Handle time slot - if no time slot, remove the placeholder line entirely
    if (timeSlot) {
      message = message.replace(/\[Time Slot\]/g, `Time: ${timeSlot}`);
    } else {
      // Remove lines containing only [Time Slot] and optional whitespace
      message = message.replace(/^.*\[Time Slot\].*$\n?/gm, '');
    }

    return message.trim();
  }

  // Default template (fallback)
  let message = `Hi *${customerName}*,\n\n`;
  message += `*MAINTENANCE ALERT*\n\n`;
  message += `*Date:* ${scheduledDate}\n`;
  if (timeSlot) {
    message += `*Time:* ${timeSlot}\n`;
  }
  message += `\n`;
  message += `Your *${itemName}* needs servicing to keep your drinking water safe.\n\n`;
  message += `Skipping maintenance can lead to:\n`;
  message += `- Impure water\n`;
  message += `- Bacterial growth\n`;
  message += `- Filter damage\n\n`;
  message += `Let's keep your family healthy!\n\n`;
  message += `*Reply 1 to Confirm*\n`;
  message += `*Reply 2 to Reschedule*\n\n`;
  message += `_${businessName}_`;

  return message;
}

/**
 * Generate follow-up reminder message (for overdue appointments)
 */
export function generateFollowUpReminderMessage(params: {
  customerName: string;
  itemName: string;
  businessName: string;
}): string {
  const { customerName, itemName, businessName } = params;

  let message = `Hi *${customerName}*,\n\n`;
  message += `*URGENT: Maintenance Overdue*\n\n`;
  message += `Your *${itemName}* maintenance is overdue.\n\n`;
  message += `Don't risk your family's health - impure water can cause serious problems.\n\n`;
  message += `Please contact us immediately to schedule a visit.\n\n`;
  message += `*Reply 1 to Schedule Now*\n\n`;
  message += `_${businessName}_`;

  return message;
}

/**
 * Generate payment reminder message
 */
export function generatePaymentReminderMessage(params: {
  customerName: string;
  amount: number;
  businessName: string;
}): string {
  const { customerName, amount, businessName } = params;

  let message = `Hi *${customerName}*,\n\n`;
  message += `This is a friendly reminder from *${businessName}*.\n\n`;
  message += `*Pending Amount:* Rs.${amount.toLocaleString('en-IN')}\n\n`;
  message += `Please clear your dues at your earliest convenience.\n\n`;
  message += `_We appreciate your continued support!_`;

  return message;
}

/**
 * Generate bill notification message with optional payment link
 */
export function generateBillMessage(params: {
  customerName: string;
  businessName: string;
  items: string; // Pre-formatted items string like "Rice 5kg Rs.250 | Oil 1L Rs.180"
  total: number;
  date: string;
  paymentLink?: string; // Optional payment link (only included if vendor has UPI ID)
}): string {
  const { customerName, businessName, items, total, date, paymentLink } = params;

  let message = `Hi *${customerName}*,\n\n`;
  message += `Thank you for shopping at *${businessName}*!\n\n`;
  message += `*BILL SUMMARY*\n`;
  message += `------------------------\n\n`;
  message += `*Items:*\n${items}\n\n`;
  message += `*Total:* Rs.${total.toLocaleString('en-IN')}\n`;
  message += `*Date:* ${date}\n\n`;
  message += `------------------------\n`;

  // Add payment link if available
  if (paymentLink) {
    message += `\n*Pay Online:* ${paymentLink}\n\n`;
    message += `------------------------\n`;
  }

  message += `_Thank you for your business!_`;

  return message;
}

/**
 * Generate custom message
 */
export function generateCustomMessage(params: {
  customerName: string;
  message: string;
  businessName: string;
}): string {
  const { customerName, message, businessName } = params;

  let msg = `Hi *${customerName}*,\n\n`;
  msg += `We have an update for you from *${businessName}*:\n\n`;
  msg += `${message}\n\n`;
  msg += `If you have any questions, feel free to reach out to us.\n\n`;
  msg += `_Thank you!_`;

  return msg;
}

/**
 * Format items for bill message
 */
export function formatItemsForBill(
  items: Array<{ name: string; quantity: number; unit?: string; price: number }>
): string {
  return items
    .map((item) => {
      const qty = item.unit ? `${item.quantity}${item.unit}` : `x${item.quantity}`;
      return `${item.name} ${qty} Rs.${item.price.toLocaleString('en-IN')}`;
    })
    .join(' | ');
}
