import { Role, OrderStatus, PaymentStatus, ProjectStatus, TaskStatus, TaskPriority, ItemType, MovementType, DocumentType } from '@prisma/client';
import { Request } from 'express';

// ==================== AUTH TYPES ====================

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// ==================== PAGINATION ====================



export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ==================== USER TYPES ====================

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
  department?: string;
  phone?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: Role;
  department?: string;
  phone?: string;
  isActive?: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
  accessToken: string;
  refreshToken: string;
}

// ==================== ORDER TYPES ====================

export interface CreateOrderDto {
  customerId: string;
  requiredDate: Date;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  shippingMethod?: string;
  incoterms?: string;
  taxRate?: number;
  shippingCost?: number;
  discount?: number;
  notes?: string;
  items: CreateOrderItemDto[];
}

export interface CreateOrderItemDto {
  inventoryItemId?: string;
  productName: string;
  productCode: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  hsCode?: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingMethod?: string;
  trackingNumber?: string;
  shippedDate?: Date;
  deliveredDate?: Date;
  notes?: string;
}

// ==================== PROJECT TYPES ====================

export interface CreateProjectDto {
  name: string;
  description?: string;
  orderId?: string;
  managerId: string;
  startDate: Date;
  dueDate: Date;
  priority?: TaskPriority;
  estimatedHours?: number;
  notes?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  progress?: number;
  actualHours?: number;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}


export interface CreateTaskDto {
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  isChecklist?: boolean;
  checklistItems?: ChecklistItem[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  actualHours?: number;
  checklistItems?: ChecklistItem[];
}


// ==================== INVENTORY TYPES ====================

export interface CreateInventoryItemDto {
  sku: string;
  name: string;
  description?: string;
  type: ItemType;
  category: string;
  quantity?: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  unitCost: number;
  currency?: string;
  unit?: string;
  weight?: number;
  dimensions?: string;
  hsCode?: string;
  countryOfOrigin?: string;
  supplierId?: string;
  warehouseZone?: string;
  binLocation?: string;
}

export interface UpdateInventoryItemDto {
  name?: string;
  description?: string;
  category?: string;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  unitCost?: number;
  warehouseZone?: string;
  binLocation?: string;
  isActive?: boolean;
}

export interface CreateMovementDto {
  inventoryItemId: string;
  type: MovementType;
  quantity: number;
  supplierId?: string;
  referenceType?: string;
  referenceId?: string;
  importBatchNo?: string;
  importDate?: Date;
  expiryDate?: Date;
  notes?: string;
}

// ==================== DOCUMENT TYPES ====================

export interface GenerateDocumentDto {
  type: DocumentType;
  orderId: string;
  metadata?: Record<string, unknown>;
}

// ==================== REPORT TYPES ====================

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    revenue: number;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    totalValue: number;
  };
  projects: {
    total: number;
    active: number;
    overdue: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customer: string;
    status: OrderStatus;
    totalAmount: number;
    createdAt: Date;
  }>;
}

export interface OrderReport {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByCountry: Array<{ country: string; count: number; revenue: number }>;
  topProducts: Array<{ productName: string; quantity: number; revenue: number }>;
}

export interface InventoryReport {
  totalItems: number;
  totalValue: number;
  itemsByType: Record<ItemType, number>;
  lowStockItems: Array<{
    id: string;
    sku: string;
    name: string;
    quantity: number;
    minStock: number;
  }>;
  recentMovements: Array<{
    id: string;
    itemName: string;
    type: MovementType;
    quantity: number;
    date: Date;
  }>;
}

// ==================== RBAC TYPES ====================

export type Permission =
  | 'orders:read'
  | 'orders:create'
  | 'orders:update'
  | 'orders:delete'
  | 'projects:read'
  | 'projects:create'
  | 'projects:update'
  | 'projects:delete'
  | 'inventory:read'
  | 'inventory:create'
  | 'inventory:update'
  | 'inventory:delete'
  | 'documents:read'
  | 'documents:create'
  | 'reports:read'
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'settings:read'
  | 'settings:update';

export const RolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    'orders:read', 'orders:create', 'orders:update', 'orders:delete',
    'projects:read', 'projects:create', 'projects:update', 'projects:delete',
    'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
    'documents:read', 'documents:create',
    'reports:read',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'settings:read', 'settings:update',
  ],
  MANAGER: [
    'orders:read', 'orders:create', 'orders:update',
    'projects:read', 'projects:create', 'projects:update',
    'inventory:read',
    'documents:read', 'documents:create',
    'reports:read',
    'users:read',
  ],
  WAREHOUSE: [
    'orders:read',
    'projects:read',
    'inventory:read', 'inventory:create', 'inventory:update',
    'documents:read',
    'reports:read',
  ],
  PRODUCTION: [
    'orders:read',
    'projects:read', 'projects:update',
    'inventory:read',
    'documents:read',
  ],
  SALES: [
    'orders:read', 'orders:create', 'orders:update',
    'inventory:read',
    'documents:read', 'documents:create',
    'reports:read',
  ],
  VIEWER: [
    'orders:read',
    'projects:read',
    'inventory:read',
    'documents:read',
    'reports:read',
  ],
};
