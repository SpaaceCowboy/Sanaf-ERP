import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
/**
 * Generic validation middleware factory
 */
export declare function validate(schema: ZodSchema, source?: 'body' | 'query' | 'params'): (req: Request, res: Response, next: NextFunction) => void;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<["ADMIN", "MANAGER", "WAREHOUSE", "PRODUCTION", "SALES", "VIEWER"]>>;
    department: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: "ADMIN" | "MANAGER" | "WAREHOUSE" | "PRODUCTION" | "SALES" | "VIEWER" | undefined;
    department?: string | undefined;
    phone?: string | undefined;
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: "ADMIN" | "MANAGER" | "WAREHOUSE" | "PRODUCTION" | "SALES" | "VIEWER" | undefined;
    department?: string | undefined;
    phone?: string | undefined;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const createOrderSchema: z.ZodObject<{
    customerId: z.ZodString;
    requiredDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    shippingAddress: z.ZodString;
    shippingCity: z.ZodString;
    shippingCountry: z.ZodString;
    shippingMethod: z.ZodOptional<z.ZodString>;
    incoterms: z.ZodOptional<z.ZodString>;
    taxRate: z.ZodOptional<z.ZodNumber>;
    shippingCost: z.ZodOptional<z.ZodNumber>;
    discount: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        inventoryItemId: z.ZodOptional<z.ZodString>;
        productName: z.ZodString;
        productCode: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        hsCode: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        productName: string;
        productCode: string;
        quantity: number;
        unitPrice: number;
        inventoryItemId?: string | undefined;
        description?: string | undefined;
        hsCode?: string | undefined;
    }, {
        productName: string;
        productCode: string;
        quantity: number;
        unitPrice: number;
        inventoryItemId?: string | undefined;
        description?: string | undefined;
        hsCode?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    requiredDate: string | Date;
    shippingAddress: string;
    shippingCity: string;
    shippingCountry: string;
    items: {
        productName: string;
        productCode: string;
        quantity: number;
        unitPrice: number;
        inventoryItemId?: string | undefined;
        description?: string | undefined;
        hsCode?: string | undefined;
    }[];
    shippingMethod?: string | undefined;
    incoterms?: string | undefined;
    taxRate?: number | undefined;
    shippingCost?: number | undefined;
    discount?: number | undefined;
    notes?: string | undefined;
}, {
    customerId: string;
    requiredDate: string | Date;
    shippingAddress: string;
    shippingCity: string;
    shippingCountry: string;
    items: {
        productName: string;
        productCode: string;
        quantity: number;
        unitPrice: number;
        inventoryItemId?: string | undefined;
        description?: string | undefined;
        hsCode?: string | undefined;
    }[];
    shippingMethod?: string | undefined;
    incoterms?: string | undefined;
    taxRate?: number | undefined;
    shippingCost?: number | undefined;
    discount?: number | undefined;
    notes?: string | undefined;
}>;
export declare const updateOrderSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "CONFIRMED", "IN_PRODUCTION", "QUALITY_CHECK", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "CANCELLED"]>>;
    paymentStatus: z.ZodOptional<z.ZodEnum<["PENDING", "PARTIAL", "PAID", "REFUNDED"]>>;
    shippingMethod: z.ZodOptional<z.ZodString>;
    trackingNumber: z.ZodOptional<z.ZodString>;
    shippedDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    deliveredDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "CONFIRMED" | "IN_PRODUCTION" | "QUALITY_CHECK" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "CANCELLED" | undefined;
    shippingMethod?: string | undefined;
    notes?: string | undefined;
    paymentStatus?: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED" | undefined;
    trackingNumber?: string | undefined;
    shippedDate?: string | Date | undefined;
    deliveredDate?: string | Date | undefined;
}, {
    status?: "DRAFT" | "CONFIRMED" | "IN_PRODUCTION" | "QUALITY_CHECK" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "CANCELLED" | undefined;
    shippingMethod?: string | undefined;
    notes?: string | undefined;
    paymentStatus?: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED" | undefined;
    trackingNumber?: string | undefined;
    shippedDate?: string | Date | undefined;
    deliveredDate?: string | Date | undefined;
}>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["DRAFT", "CONFIRMED", "IN_PRODUCTION", "QUALITY_CHECK", "READY_TO_SHIP", "SHIPPED", "DELIVERED", "CANCELLED"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "CONFIRMED" | "IN_PRODUCTION" | "QUALITY_CHECK" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    notes?: string | undefined;
}, {
    status: "DRAFT" | "CONFIRMED" | "IN_PRODUCTION" | "QUALITY_CHECK" | "READY_TO_SHIP" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    notes?: string | undefined;
}>;
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    orderId: z.ZodOptional<z.ZodString>;
    managerId: z.ZodString;
    startDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    dueDate: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    estimatedHours: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    managerId: string;
    startDate: string | Date;
    dueDate: string | Date;
    notes?: string | undefined;
    description?: string | undefined;
    orderId?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    estimatedHours?: number | undefined;
}, {
    name: string;
    managerId: string;
    startDate: string | Date;
    dueDate: string | Date;
    notes?: string | undefined;
    description?: string | undefined;
    orderId?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    estimatedHours?: number | undefined;
}>;
export declare const updateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["PLANNING", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "CANCELLED"]>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    dueDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    progress: z.ZodOptional<z.ZodNumber>;
    actualHours: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    status?: "CANCELLED" | "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | undefined;
    notes?: string | undefined;
    description?: string | undefined;
    dueDate?: string | Date | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    progress?: number | undefined;
    actualHours?: number | undefined;
}, {
    name?: string | undefined;
    status?: "CANCELLED" | "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | undefined;
    notes?: string | undefined;
    description?: string | undefined;
    dueDate?: string | Date | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    progress?: number | undefined;
    actualHours?: number | undefined;
}>;
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    assigneeId: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    startDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    dueDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    estimatedHours: z.ZodOptional<z.ZodNumber>;
    isChecklist: z.ZodOptional<z.ZodBoolean>;
    checklistItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        completed: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        completed: boolean;
    }, {
        id: string;
        text: string;
        completed: boolean;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description?: string | undefined;
    startDate?: string | Date | undefined;
    dueDate?: string | Date | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    estimatedHours?: number | undefined;
    assigneeId?: string | undefined;
    isChecklist?: boolean | undefined;
    checklistItems?: {
        id: string;
        text: string;
        completed: boolean;
    }[] | undefined;
}, {
    title: string;
    description?: string | undefined;
    startDate?: string | Date | undefined;
    dueDate?: string | Date | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    estimatedHours?: number | undefined;
    assigneeId?: string | undefined;
    isChecklist?: boolean | undefined;
    checklistItems?: {
        id: string;
        text: string;
        completed: boolean;
    }[] | undefined;
}>;
export declare const updateTaskSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"]>>;
    assigneeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodUnion<[z.ZodString, z.ZodDate]>>>;
    actualHours: z.ZodOptional<z.ZodNumber>;
    checklistItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        completed: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        completed: boolean;
    }, {
        id: string;
        text: string;
        completed: boolean;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "IN_PROGRESS" | "COMPLETED" | "TODO" | "REVIEW" | undefined;
    description?: string | undefined;
    dueDate?: string | Date | null | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    actualHours?: number | undefined;
    title?: string | undefined;
    assigneeId?: string | null | undefined;
    checklistItems?: {
        id: string;
        text: string;
        completed: boolean;
    }[] | undefined;
}, {
    status?: "IN_PROGRESS" | "COMPLETED" | "TODO" | "REVIEW" | undefined;
    description?: string | undefined;
    dueDate?: string | Date | null | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
    actualHours?: number | undefined;
    title?: string | undefined;
    assigneeId?: string | null | undefined;
    checklistItems?: {
        id: string;
        text: string;
        completed: boolean;
    }[] | undefined;
}>;
export declare const createInventoryItemSchema: z.ZodObject<{
    sku: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["RAW_MATERIAL", "COMPONENT", "FINISHED_GOOD", "PACKAGING"]>;
    category: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    minStock: z.ZodOptional<z.ZodNumber>;
    maxStock: z.ZodOptional<z.ZodNumber>;
    reorderPoint: z.ZodOptional<z.ZodNumber>;
    unitCost: z.ZodNumber;
    currency: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
    weight: z.ZodOptional<z.ZodNumber>;
    dimensions: z.ZodOptional<z.ZodString>;
    hsCode: z.ZodOptional<z.ZodString>;
    countryOfOrigin: z.ZodOptional<z.ZodString>;
    supplierId: z.ZodOptional<z.ZodString>;
    warehouseZone: z.ZodOptional<z.ZodString>;
    binLocation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "RAW_MATERIAL" | "COMPONENT" | "FINISHED_GOOD" | "PACKAGING";
    sku: string;
    category: string;
    unitCost: number;
    description?: string | undefined;
    quantity?: number | undefined;
    hsCode?: string | undefined;
    minStock?: number | undefined;
    maxStock?: number | undefined;
    reorderPoint?: number | undefined;
    currency?: string | undefined;
    unit?: string | undefined;
    weight?: number | undefined;
    dimensions?: string | undefined;
    countryOfOrigin?: string | undefined;
    supplierId?: string | undefined;
    warehouseZone?: string | undefined;
    binLocation?: string | undefined;
}, {
    name: string;
    type: "RAW_MATERIAL" | "COMPONENT" | "FINISHED_GOOD" | "PACKAGING";
    sku: string;
    category: string;
    unitCost: number;
    description?: string | undefined;
    quantity?: number | undefined;
    hsCode?: string | undefined;
    minStock?: number | undefined;
    maxStock?: number | undefined;
    reorderPoint?: number | undefined;
    currency?: string | undefined;
    unit?: string | undefined;
    weight?: number | undefined;
    dimensions?: string | undefined;
    countryOfOrigin?: string | undefined;
    supplierId?: string | undefined;
    warehouseZone?: string | undefined;
    binLocation?: string | undefined;
}>;
export declare const updateInventoryItemSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    minStock: z.ZodOptional<z.ZodNumber>;
    maxStock: z.ZodOptional<z.ZodNumber>;
    reorderPoint: z.ZodOptional<z.ZodNumber>;
    unitCost: z.ZodOptional<z.ZodNumber>;
    warehouseZone: z.ZodOptional<z.ZodString>;
    binLocation: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    minStock?: number | undefined;
    maxStock?: number | undefined;
    reorderPoint?: number | undefined;
    unitCost?: number | undefined;
    warehouseZone?: string | undefined;
    binLocation?: string | undefined;
}, {
    isActive?: boolean | undefined;
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    minStock?: number | undefined;
    maxStock?: number | undefined;
    reorderPoint?: number | undefined;
    unitCost?: number | undefined;
    warehouseZone?: string | undefined;
    binLocation?: string | undefined;
}>;
export declare const createMovementSchema: z.ZodObject<{
    inventoryItemId: z.ZodString;
    type: z.ZodEnum<["IMPORT", "EXPORT", "PRODUCTION_IN", "PRODUCTION_OUT", "ADJUSTMENT", "RETURN", "SCRAP"]>;
    quantity: z.ZodNumber;
    supplierId: z.ZodOptional<z.ZodString>;
    referenceType: z.ZodOptional<z.ZodString>;
    referenceId: z.ZodOptional<z.ZodString>;
    importBatchNo: z.ZodOptional<z.ZodString>;
    importDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    expiryDate: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "IMPORT" | "EXPORT" | "PRODUCTION_IN" | "PRODUCTION_OUT" | "ADJUSTMENT" | "RETURN" | "SCRAP";
    inventoryItemId: string;
    quantity: number;
    notes?: string | undefined;
    supplierId?: string | undefined;
    referenceType?: string | undefined;
    referenceId?: string | undefined;
    importBatchNo?: string | undefined;
    importDate?: string | Date | undefined;
    expiryDate?: string | Date | undefined;
}, {
    type: "IMPORT" | "EXPORT" | "PRODUCTION_IN" | "PRODUCTION_OUT" | "ADJUSTMENT" | "RETURN" | "SCRAP";
    inventoryItemId: string;
    quantity: number;
    notes?: string | undefined;
    supplierId?: string | undefined;
    referenceType?: string | undefined;
    referenceId?: string | undefined;
    importBatchNo?: string | undefined;
    importDate?: string | Date | undefined;
    expiryDate?: string | Date | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    limit: z.ZodOptional<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}, {
    page?: string | undefined;
    limit?: string | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
//# sourceMappingURL=validation.d.ts.map