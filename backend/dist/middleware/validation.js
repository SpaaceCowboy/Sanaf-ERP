"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.idParamSchema = exports.paginationSchema = exports.createMovementSchema = exports.updateInventoryItemSchema = exports.createInventoryItemSchema = exports.updateTaskSchema = exports.createTaskSchema = exports.updateProjectSchema = exports.createProjectSchema = exports.updateOrderStatusSchema = exports.updateOrderSchema = exports.createOrderSchema = exports.changePasswordSchema = exports.registerSchema = exports.loginSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
/**
 * Generic validation middleware factory
 */
function validate(schema, source = 'body') {
    return (req, res, next) => {
        try {
            const data = req[source];
            const validated = schema.parse(data);
            req[source] = validated;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    error: 'Validation failed',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
// ==================== AUTH SCHEMAS ====================
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters'),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters'),
    role: zod_1.z.enum(['ADMIN', 'MANAGER', 'WAREHOUSE', 'PRODUCTION', 'SALES', 'VIEWER']).optional(),
    department: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});
// ==================== ORDER SCHEMAS ====================
exports.createOrderSchema = zod_1.z.object({
    customerId: zod_1.z.string().uuid('Invalid customer ID'),
    requiredDate: zod_1.z.string().datetime().or(zod_1.z.date()),
    shippingAddress: zod_1.z.string().min(1, 'Shipping address is required'),
    shippingCity: zod_1.z.string().min(1, 'Shipping city is required'),
    shippingCountry: zod_1.z.string().min(1, 'Shipping country is required'),
    shippingMethod: zod_1.z.string().optional(),
    incoterms: zod_1.z.string().optional(),
    taxRate: zod_1.z.number().min(0).max(100).optional(),
    shippingCost: zod_1.z.number().min(0).optional(),
    discount: zod_1.z.number().min(0).optional(),
    notes: zod_1.z.string().optional(),
    items: zod_1.z.array(zod_1.z.object({
        inventoryItemId: zod_1.z.string().uuid().optional(),
        productName: zod_1.z.string().min(1, 'Product name is required'),
        productCode: zod_1.z.string().min(1, 'Product code is required'),
        description: zod_1.z.string().optional(),
        quantity: zod_1.z.number().int().positive('Quantity must be positive'),
        unitPrice: zod_1.z.number().positive('Unit price must be positive'),
        hsCode: zod_1.z.string().optional(),
    })).min(1, 'At least one item is required'),
});
exports.updateOrderSchema = zod_1.z.object({
    status: zod_1.z.enum(['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    paymentStatus: zod_1.z.enum(['PENDING', 'PARTIAL', 'PAID', 'REFUNDED']).optional(),
    shippingMethod: zod_1.z.string().optional(),
    trackingNumber: zod_1.z.string().optional(),
    shippedDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    deliveredDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
        errorMap: () => ({ message: 'Invalid order status' }),
    }),
    notes: zod_1.z.string().optional(),
});
// ==================== PROJECT SCHEMAS ====================
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Project name is required'),
    description: zod_1.z.string().optional(),
    orderId: zod_1.z.string().uuid().optional(),
    managerId: zod_1.z.string().uuid('Invalid manager ID'),
    startDate: zod_1.z.string().datetime().or(zod_1.z.date()),
    dueDate: zod_1.z.string().datetime().or(zod_1.z.date()),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    estimatedHours: zod_1.z.number().int().positive().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    progress: zod_1.z.number().int().min(0).max(100).optional(),
    actualHours: zod_1.z.number().int().min(0).optional(),
    notes: zod_1.z.string().optional(),
});
exports.createTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Task title is required'),
    description: zod_1.z.string().optional(),
    assigneeId: zod_1.z.string().uuid().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    startDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    dueDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    estimatedHours: zod_1.z.number().int().positive().optional(),
    isChecklist: zod_1.z.boolean().optional(),
    checklistItems: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        text: zod_1.z.string(),
        completed: zod_1.z.boolean(),
    })).optional(),
});
exports.updateTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    assigneeId: zod_1.z.string().uuid().nullable().optional(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: zod_1.z.string().datetime().or(zod_1.z.date()).nullable().optional(),
    actualHours: zod_1.z.number().int().min(0).optional(),
    checklistItems: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        text: zod_1.z.string(),
        completed: zod_1.z.boolean(),
    })).optional(),
});
// ==================== INVENTORY SCHEMAS ====================
exports.createInventoryItemSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1, 'SKU is required'),
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(['RAW_MATERIAL', 'COMPONENT', 'FINISHED_GOOD', 'PACKAGING']),
    category: zod_1.z.string().min(1, 'Category is required'),
    quantity: zod_1.z.number().int().min(0).optional(),
    minStock: zod_1.z.number().int().min(0).optional(),
    maxStock: zod_1.z.number().int().min(0).optional(),
    reorderPoint: zod_1.z.number().int().min(0).optional(),
    unitCost: zod_1.z.number().positive('Unit cost must be positive'),
    currency: zod_1.z.string().length(3).optional(),
    unit: zod_1.z.string().optional(),
    weight: zod_1.z.number().positive().optional(),
    dimensions: zod_1.z.string().optional(),
    hsCode: zod_1.z.string().optional(),
    countryOfOrigin: zod_1.z.string().optional(),
    supplierId: zod_1.z.string().uuid().optional(),
    warehouseZone: zod_1.z.string().optional(),
    binLocation: zod_1.z.string().optional(),
});
exports.updateInventoryItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    minStock: zod_1.z.number().int().min(0).optional(),
    maxStock: zod_1.z.number().int().min(0).optional(),
    reorderPoint: zod_1.z.number().int().min(0).optional(),
    unitCost: zod_1.z.number().positive().optional(),
    warehouseZone: zod_1.z.string().optional(),
    binLocation: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.createMovementSchema = zod_1.z.object({
    inventoryItemId: zod_1.z.string().uuid('Invalid inventory item ID'),
    type: zod_1.z.enum(['IMPORT', 'EXPORT', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'ADJUSTMENT', 'RETURN', 'SCRAP']),
    quantity: zod_1.z.number().int().positive('Quantity must be positive'),
    supplierId: zod_1.z.string().uuid().optional(),
    referenceType: zod_1.z.string().optional(),
    referenceId: zod_1.z.string().optional(),
    importBatchNo: zod_1.z.string().optional(),
    importDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    expiryDate: zod_1.z.string().datetime().or(zod_1.z.date()).optional(),
    notes: zod_1.z.string().optional(),
});
// ==================== PAGINATION SCHEMA ====================
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().positive()).optional(),
    limit: zod_1.z.string().transform(Number).pipe(zod_1.z.number().int().positive().max(100)).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
// ==================== ID PARAM SCHEMA ====================
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid ID format'),
});
//# sourceMappingURL=validation.js.map