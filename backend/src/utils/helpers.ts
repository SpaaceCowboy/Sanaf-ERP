import { PaginationParams, PaginatedResponse } from '../types/index.js';

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${year}${month}-${random}`;
}

/**
 * Generate a unique project number
 */
export function generateProjectNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PRJ-${year}${month}-${random}`;
}

/**
 * Generate a unique document number
 */
export function generateDocumentNumber(type: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  const prefix = {
    INVOICE: 'INV',
    PROFORMA_INVOICE: 'PI',
    PACKING_LIST: 'PL',
    COMMERCIAL_INVOICE: 'CI',
    BILL_OF_LADING: 'BL',
    CERTIFICATE_OF_ORIGIN: 'CO',
    EXPORT_LICENSE: 'EL',
    CUSTOMS_DECLARATION: 'CD',
  }[type] || 'DOC';
  
  return `${prefix}-${year}${month}${day}-${random}`;
}

/**
 * Parse pagination parameters with defaults
 */
export function parsePagination(params: PaginationParams): {
  skip: number;
  take: number;
  orderBy: Record<string, 'asc' | 'desc'>;
} {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const sortBy = params.sortBy || 'createdAt';
  const sortOrder = params.sortOrder || 'desc';
  
  return {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();
}

/**
 * Generate SKU from product info
 */
export function generateSku(category: string, name: string): string {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const nameCode = name.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${categoryCode}-${nameCode}-${random}`;
}

/**
 * Check if date is overdue
 */
export function isOverdue(dueDate: Date | string): boolean {
  return new Date(dueDate) < new Date();
}

/**
 * Calculate days until due
 */
export function daysUntilDue(dueDate: Date | string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
