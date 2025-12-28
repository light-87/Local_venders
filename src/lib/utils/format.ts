import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

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
 * Format date in a user-friendly way
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) {
    return `Today, ${format(d, 'h:mm a')}`;
  }

  if (isYesterday(d)) {
    return `Yesterday, ${format(d, 'h:mm a')}`;
  }

  return format(d, 'd MMM yyyy');
}

/**
 * Format date for display (short)
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'd MMM yyyy');
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
