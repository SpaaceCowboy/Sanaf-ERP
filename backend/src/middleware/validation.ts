import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Generic validation middleware factory
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
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

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'WAREHOUSE', 'PRODUCTION', 'SALES', 'VIEWER']).optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
});

// ==================== ORDER SCHEMAS ====================

export const createOrderSchema = z.object({
  customerId: z.string().uuid('Invalid customer ID'),
  requiredDate: z.string().datetime().or(z.date()),
  shippingAddress: z.string().min(1, 'Shipping address is required'),
  shippingCity: z.string().min(1, 'Shipping city is required'),
  shippingCountry: z.string().min(1, 'Shipping country is required'),
  shippingMethod: z.string().optional(),
  incoterms: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  shippingCost: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    inventoryItemId: z.string().uuid().optional(),
    productName: z.string().min(1, 'Product name is required'),
    productCode: z.string().min(1, 'Product code is required'),
    description: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    hsCode: z.string().optional(),
  })).min(1, 'At least one item is required'),
});

export const updateOrderSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'REFUNDED']).optional(),
  shippingMethod: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippedDate: z.string().datetime().or(z.date()).optional(),
  deliveredDate: z.string().datetime().or(z.date()).optional(),
  notes: z.string().optional(),
});

// ==================== PROJECT SCHEMAS ====================

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  orderId: z.string().uuid().optional(),
  managerId: z.string().uuid('Invalid manager ID'),
  startDate: z.string().datetime().or(z.date()),
  dueDate: z.string().datetime().or(z.date()),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedHours: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  actualHours: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  estimatedHours: z.number().int().positive().optional(),
  isChecklist: z.boolean().optional(),
  checklistItems: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().or(z.date()).nullable().optional(),
  actualHours: z.number().int().min(0).optional(),
  checklistItems: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
  })).optional(),
});

// ==================== INVENTORY SCHEMAS ====================

export const createInventoryItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['RAW_MATERIAL', 'COMPONENT', 'FINISHED_GOOD', 'PACKAGING']),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  unitCost: z.number().positive('Unit cost must be positive'),
  currency: z.string().length(3).optional(),
  unit: z.string().optional(),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  hsCode: z.string().optional(),
  countryOfOrigin: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  warehouseZone: z.string().optional(),
  binLocation: z.string().optional(),
});

export const updateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  unitCost: z.number().positive().optional(),
  warehouseZone: z.string().optional(),
  binLocation: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createMovementSchema = z.object({
  inventoryItemId: z.string().uuid('Invalid inventory item ID'),
  type: z.enum(['IMPORT', 'EXPORT', 'PRODUCTION_IN', 'PRODUCTION_OUT', 'ADJUSTMENT', 'RETURN', 'SCRAP']),
  quantity: z.number().int().positive('Quantity must be positive'),
  supplierId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  importBatchNo: z.string().optional(),
  importDate: z.string().datetime().or(z.date()).optional(),
  expiryDate: z.string().datetime().or(z.date()).optional(),
  notes: z.string().optional(),
});

// ==================== PAGINATION SCHEMA ====================

export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ==================== ID PARAM SCHEMA ====================

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});