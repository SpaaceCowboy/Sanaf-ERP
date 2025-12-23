// User types
export type UserRole = 'ADMIN' | 'MANAGER' | 'WAREHOUSE' | 'PRODUCTION' | 'SALES' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Order types
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  notes?: string;
  createdAt: string;
  companyName: string
}

export interface OrderItem {
  id: string;
  productName: string;
  productSku?: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  hsCode?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: Customer;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
  internalNotes?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  incoterm?: string;
  deliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: User;
}

// Project types
export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assignee?: User;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  checklist: TaskChecklistItem[];
  order: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMaterial {
  id: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  quantity: number;
  notes?: string;
}

export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description?: string;
  orderId?: string;
  order?: Order;
  status: ProjectStatus;
  priority: TaskPriority;
  progress: number;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  managerId?: string;
  manager?: User;
  tasks: ProjectTask[];
  materials: ProjectMaterial[];
  createdAt: string;
  updatedAt: string;
}

// Inventory types
export type InventoryType = 'RAW_MATERIAL' | 'COMPONENT' | 'FINISHED_GOOD' | 'PACKAGING' | 'CONSUMABLE';
export type MovementType = 'IMPORT' | 'EXPORT' | 'PRODUCTION_IN' | 'PRODUCTION_OUT' | 'ADJUSTMENT' | 'RETURN' | 'SCRAP';

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  notes?: string;
  companyName: string
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  type: InventoryType;
  category?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  reorderPoint: number;
  unitCost: number;
  currency: string;
  supplierId?: string;
  supplier?: Supplier;
  location?: string;
  hsCode?: string;
  countryOfOrigin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  inventoryItem: InventoryItem;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string;
  notes?: string;
  userId: string;
  user: User;
  createdAt: string;
}

// Document types
export type DocumentType = 'INVOICE' | 'PROFORMA_INVOICE' | 'PACKING_LIST' | 'COMMERCIAL_INVOICE' | 'EXPORT_DECLARATION' | 'CERTIFICATE_OF_ORIGIN';

export interface Document {
  id: string;
  documentNumber: string;
  type: DocumentType;
  orderId?: string;
  order?: Order;
  filename: string;
  filepath: string;
  filesize: number;
  generatedById: string;
  generatedBy: User;
  createdAt: string;
}

// Report types
export interface DashboardStats {
  orders: {
    total: number;
    thisMonth: number;
    pending: number;
    trend: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    trend: number;
  };
  inventory: {
    totalItems: number;
    lowStock: number;
    totalValue: number;
  };
  projects: {
    active: number;
    completed: number;
    overdue: number;
  };
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

// API types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  name: string;
}

export interface CreateOrderFormData {
  customerId: string;
  items: {
    productName: string;
    productSku?: string;
    description?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    hsCode?: string;
  }[];
  currency?: string;
  taxRate?: number;
  shippingCost?: number;
  discount?: number;
  notes?: string;
  internalNotes?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingCountry?: string;
  incoterm?: string;
  deliveryDate?: string;
}

export interface CreateProjectFormData {
  name: string;
  description?: string;
  orderId?: string;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  managerId?: string;
}

export interface CreateTaskFormData {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  checklist?: { text: string; completed: boolean }[];
}

export interface CreateInventoryItemFormData {
  name: string;
  description?: string;
  type: InventoryType;
  category?: string;
  unit: string;
  currentStock?: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  unitCost?: number;
  currency?: string;
  supplierId?: string;
  location?: string;
  hsCode?: string;
  countryOfOrigin?: string;
}

export interface CreateMovementFormData {
  inventoryItemId: string;
  type: MovementType;
  quantity: number;
  reference?: string;
  notes?: string;
}

// Filter types
export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: TaskPriority;
  managerId?: string;
  orderId?: string;
  search?: string;
}

export interface InventoryFilters {
  type?: InventoryType;
  category?: string;
  supplierId?: string;
  lowStock?: boolean;
  search?: string;
}
