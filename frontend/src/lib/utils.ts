import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(date: string | Date, pattern: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isOverdue(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(new Date(), d);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Order statuses
    DRAFT: 'bg-carbon-700 text-carbon-200',
    CONFIRMED: 'bg-circuit-900/50 text-circuit-300',
    IN_PRODUCTION: 'bg-volt-900/50 text-volt-300',
    READY: 'bg-electric-900/50 text-electric-300',
    SHIPPED: 'bg-circuit-800/50 text-circuit-200',
    DELIVERED: 'bg-electric-800/50 text-electric-200',
    CANCELLED: 'bg-danger-900/50 text-danger-300',
    // Project statuses
    NOT_STARTED: 'bg-carbon-700 text-carbon-200',
    IN_PROGRESS: 'bg-circuit-900/50 text-circuit-300',
    ON_HOLD: 'bg-volt-900/50 text-volt-300',
    COMPLETED: 'bg-electric-800/50 text-electric-200',
    // Task statuses
    TODO: 'bg-carbon-700 text-carbon-200',
    REVIEW: 'bg-volt-900/50 text-volt-300',
    // Payment statuses
    PENDING: 'bg-volt-900/50 text-volt-300',
    PARTIAL: 'bg-circuit-900/50 text-circuit-300',
    PAID: 'bg-electric-800/50 text-electric-200',
    REFUNDED: 'bg-danger-900/50 text-danger-300',
  };
  return colors[status] || 'bg-carbon-700 text-carbon-200';
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'text-carbon-400',
    MEDIUM: 'text-circuit-400',
    HIGH: 'text-volt-400',
    CRITICAL: 'text-danger-400',
  };
  return colors[priority] || 'text-carbon-400';
}

export function getPriorityBadgeColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: 'bg-carbon-800/50 text-carbon-300 border-carbon-700',
    MEDIUM: 'bg-circuit-900/50 text-circuit-300 border-circuit-800',
    HIGH: 'bg-volt-900/50 text-volt-300 border-volt-800',
    CRITICAL: 'bg-danger-900/50 text-danger-300 border-danger-800',
  };
  return colors[priority] || 'bg-carbon-800/50 text-carbon-300 border-carbon-700';
}

export function getInventoryTypeColor(type: string): string {
  const colors: Record<string, string> = {
    RAW_MATERIAL: 'bg-circuit-900/50 text-circuit-300',
    COMPONENT: 'bg-volt-900/50 text-volt-300',
    FINISHED_GOOD: 'bg-electric-900/50 text-electric-300',
    PACKAGING: 'bg-carbon-700 text-carbon-200',
    CONSUMABLE: 'bg-carbon-600 text-carbon-100',
  };
  return colors[type] || 'bg-carbon-700 text-carbon-200';
}

export function getMovementTypeColor(type: string): string {
  const colors: Record<string, string> = {
    IMPORT: 'text-electric-400',
    EXPORT: 'text-volt-400',
    PRODUCTION_IN: 'text-circuit-400',
    PRODUCTION_OUT: 'text-circuit-300',
    ADJUSTMENT: 'text-carbon-400',
    RETURN: 'text-volt-300',
    SCRAP: 'text-danger-400',
  };
  return colors[type] || 'text-carbon-400';
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}
