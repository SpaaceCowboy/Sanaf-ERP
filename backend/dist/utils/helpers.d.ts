import { PaginationParams, PaginatedResponse } from '../types/index.js';
/**
 * Generate a unique order number
 */
export declare function generateOrderNumber(): string;
/**
 * Generate a unique project number
 */
export declare function generateProjectNumber(): string;
/**
 * Generate a unique document number
 */
export declare function generateDocumentNumber(type: string): string;
/**
 * Parse pagination parameters with defaults
 */
export declare function parsePagination(params: PaginationParams): {
    skip: number;
    take: number;
    orderBy: Record<string, 'asc' | 'desc'>;
};
/**
 * Build paginated response
 */
export declare function buildPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResponse<T>;
/**
 * Format currency amount
 */
export declare function formatCurrency(amount: number, currency?: string): string;
/**
 * Format date for display
 */
export declare function formatDate(date: Date | string): string;
/**
 * Format date with time
 */
export declare function formatDateTime(date: Date | string): string;
/**
 * Calculate percentage
 */
export declare function calculatePercentage(value: number, total: number): number;
/**
 * Sanitize filename for safe storage
 */
export declare function sanitizeFilename(filename: string): string;
/**
 * Generate SKU from product info
 */
export declare function generateSku(category: string, name: string): string;
/**
 * Check if date is overdue
 */
export declare function isOverdue(dueDate: Date | string): boolean;
/**
 * Calculate days until due
 */
export declare function daysUntilDue(dueDate: Date | string): number;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=helpers.d.ts.map