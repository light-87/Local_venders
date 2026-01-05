import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

// Indian Standard Time timezone
const IST_TIMEZONE = 'Asia/Kolkata';

/**
 * Get current date in IST
 */
export function getISTDate(): Date {
  return toZonedTime(new Date(), IST_TIMEZONE);
}

/**
 * Get current date string in IST (YYYY-MM-DD format)
 */
export function getISTDateString(): string {
  return formatInTimeZone(new Date(), IST_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Get current datetime string in IST (ISO format)
 */
export function getISTDateTimeString(): string {
  return formatInTimeZone(new Date(), IST_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Format a date in IST timezone
 */
export function formatDateIST(date: Date | string, formatStr: string = 'd MMM yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, IST_TIMEZONE, formatStr);
}

/**
 * Format currency in INR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with Indian numbering system
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format date in a user-friendly way (IST timezone)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const istDate = toZonedTime(d, IST_TIMEZONE);

  if (isToday(istDate)) {
    return `Today, ${formatInTimeZone(d, IST_TIMEZONE, 'h:mm a')}`;
  }

  if (isYesterday(istDate)) {
    return `Yesterday, ${formatInTimeZone(d, IST_TIMEZONE, 'h:mm a')}`;
  }

  return formatInTimeZone(d, IST_TIMEZONE, 'd MMM yyyy');
}

/**
 * Format date for display (short) - IST timezone
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatInTimeZone(d, IST_TIMEZONE, 'd MMM yyyy');
}

/**
 * Format time ago
 */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format phone number for display
 */
export function formatPhone(phone: string): string {
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Format Indian phone number
  if (digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Format quantity with unit
 */
export function formatQuantity(quantity: number, unit: string): string {
  const formatted = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
  return `${formatted} ${unit}`;
}
