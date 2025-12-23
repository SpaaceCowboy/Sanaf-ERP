"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrderNumber = generateOrderNumber;
exports.generateProjectNumber = generateProjectNumber;
exports.generateDocumentNumber = generateDocumentNumber;
exports.parsePagination = parsePagination;
exports.buildPaginatedResponse = buildPaginatedResponse;
exports.formatCurrency = formatCurrency;
exports.formatDate = formatDate;
exports.formatDateTime = formatDateTime;
exports.calculatePercentage = calculatePercentage;
exports.sanitizeFilename = sanitizeFilename;
exports.generateSku = generateSku;
exports.isOverdue = isOverdue;
exports.daysUntilDue = daysUntilDue;
exports.deepClone = deepClone;
exports.sleep = sleep;
/**
 * Generate a unique order number
 */
function generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${year}${month}-${random}`;
}
/**
 * Generate a unique project number
 */
function generateProjectNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PRJ-${year}${month}-${random}`;
}
/**
 * Generate a unique document number
 */
function generateDocumentNumber(type) {
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
function parsePagination(params) {
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
function buildPaginatedResponse(data, total, params) {
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
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
}
/**
 * Format date for display
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(new Date(date));
}
/**
 * Format date with time
 */
function formatDateTime(date) {
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
function calculatePercentage(value, total) {
    if (total === 0)
        return 0;
    return Math.round((value / total) * 100 * 100) / 100;
}
/**
 * Sanitize filename for safe storage
 */
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_+/g, '_')
        .toLowerCase();
}
/**
 * Generate SKU from product info
 */
function generateSku(category, name) {
    const categoryCode = category.substring(0, 3).toUpperCase();
    const nameCode = name.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${categoryCode}-${nameCode}-${random}`;
}
/**
 * Check if date is overdue
 */
function isOverdue(dueDate) {
    return new Date(dueDate) < new Date();
}
/**
 * Calculate days until due
 */
function daysUntilDue(dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
/**
 * Deep clone an object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=helpers.js.map