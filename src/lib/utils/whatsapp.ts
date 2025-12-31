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
 * Encode text for URL (handles emojis and special characters)
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
 * Generate maintenance reminder message
 */
export function generateMaintenanceReminderMessage(params: {
  customerName: string;
  itemName: string;
  scheduledDate: string;
  timeSlot?: string;
  businessName: string;
}): string {
  const { customerName, itemName, scheduledDate, timeSlot, businessName } = params;

  let message = `Hi *${customerName}*,\n\n`;
  message += `We're scheduling a maintenance visit for your *${itemName}*.\n\n`;
  message += `📅 *Date:* ${scheduledDate}\n`;
  if (timeSlot) {
    message += `🕐 *Time:* ${timeSlot}\n`;
  }
  message += `\nPlease confirm if this time slot works for you.\n\n`;
  message += `_Thank you for choosing ${businessName}_`;

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
  message += `Your *${itemName}* maintenance is overdue.\n\n`;
  message += `Please contact us to schedule a visit at your earliest convenience.\n\n`;
  message += `_— ${businessName}_`;

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
  message += `💰 *Pending Amount:* ₹${amount.toLocaleString('en-IN')}\n\n`;
  message += `Please clear your dues at your earliest convenience.\n\n`;
  message += `_We appreciate your continued support!_`;

  return message;
}

/**
 * Generate bill notification message
 */
export function generateBillMessage(params: {
  customerName: string;
  businessName: string;
  items: string; // Pre-formatted items string like "Rice 5kg ₹250 • Oil 1L ₹180"
  total: number;
  date: string;
}): string {
  const { customerName, businessName, items, total, date } = params;

  let message = `Hi *${customerName}*,\n\n`;
  message += `Thank you for shopping at *${businessName}*! 🛍️\n\n`;
  message += `📋 *BILL SUMMARY*\n`;
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  message += `🛒 *Items:*\n${items}\n\n`;
  message += `💵 *Total:* ₹${total.toLocaleString('en-IN')}\n`;
  message += `📅 *Date:* ${date}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `_Thank you for your business!_ 🙏`;

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
      const qty = item.unit ? `${item.quantity}${item.unit}` : `×${item.quantity}`;
      return `${item.name} ${qty} ₹${item.price.toLocaleString('en-IN')}`;
    })
    .join(' • ');
}
