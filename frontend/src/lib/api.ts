import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  User,
  Order,
  Project,
  ProjectTask,
  InventoryItem,
  InventoryMovement,
  Document,
  Customer,
  Supplier,
  DashboardStats,
  PaginatedResponse,
  CreateOrderFormData,
  CreateProjectFormData,
  CreateTaskFormData,
  CreateInventoryItemFormData,
  CreateMovementFormData,
  OrderFilters,
  ProjectFilters,
  InventoryFilters,
  OrderStatus,
  ProjectStatus,
  TaskStatus,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
};

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
          const { accessToken: newToken } = response.data;
          setAccessToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        setAccessToken(null);
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email: string, password: string, name: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    setAccessToken(null);
    localStorage.removeItem('refreshToken');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
};

// Orders API
export const ordersApi = {
  list: async (params?: OrderFilters & { page?: number; limit?: number }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  get: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderFormData): Promise<Order> => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateOrderFormData>): Promise<Order> => {
    const response = await api.put(`/orders/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },

  getStats: async (): Promise<{ total: number; byStatus: Record<OrderStatus, number> }> => {
    const response = await api.get('/orders/stats');
    return response.data;
  },
};

// Projects API
export const projectsApi = {
  list: async (params?: ProjectFilters & { page?: number; limit?: number }): Promise<PaginatedResponse<Project>> => {
    const response = await api.get('/projects', { params });
    return response.data;
  },

  get: async (id: string): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  create: async (data: CreateProjectFormData): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateProjectFormData>): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: ProjectStatus): Promise<Project> => {
    const response = await api.patch(`/projects/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Tasks
  createTask: async (projectId: string, data: CreateTaskFormData): Promise<ProjectTask> => {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data;
  },

  updateTask: async (projectId: string, taskId: string, data: Partial<CreateTaskFormData>): Promise<ProjectTask> => {
    const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  },

  updateTaskStatus: async (projectId: string, taskId: string, status: TaskStatus): Promise<ProjectTask> => {
    const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status });
    return response.data;
  },

  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  },

  reorderTasks: async (projectId: string, taskIds: string[]): Promise<void> => {
    await api.patch(`/projects/${projectId}/tasks/reorder`, { taskIds });
  },

  getMyTasks: async (): Promise<ProjectTask[]> => {
    const response = await api.get('/projects/my-tasks');
    return response.data;
  },
};

// Inventory API
export const inventoryApi = {
  list: async (params?: InventoryFilters & { page?: number; limit?: number }): Promise<PaginatedResponse<InventoryItem>> => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  get: async (id: string): Promise<InventoryItem> => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  create: async (data: CreateInventoryItemFormData): Promise<InventoryItem> => {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateInventoryItemFormData>): Promise<InventoryItem> => {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/inventory/${id}`);
  },

  // Movements
  recordMovement: async (data: CreateMovementFormData): Promise<InventoryMovement> => {
    const response = await api.post('/inventory/movements', data);
    return response.data;
  },

  getMovements: async (itemId?: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<InventoryMovement>> => {
    const response = await api.get('/inventory/movements', { params: { ...params, itemId } });
    return response.data;
  },

  getLowStock: async (): Promise<InventoryItem[]> => {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/inventory/categories');
    return response.data;
  },

  getStats: async (): Promise<{ totalItems: number; totalValue: number; lowStockCount: number }> => {
    const response = await api.get('/inventory/stats');
    return response.data;
  },
};

// Documents API
export const documentsApi = {
  list: async (params?: { orderId?: string; type?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Document>> => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  generate: async (orderId: string, type: string): Promise<Document> => {
    const response = await api.post(`/documents/generate/${orderId}`, { type });
    return response.data;
  },

  download: async (id: string): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
};

// Customers API
export const customersApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  get: async (id: string): Promise<Customer> => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  create: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};

// Suppliers API
export const suppliersApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Supplier>> => {
    const response = await api.get('/suppliers', { params });
    return response.data;
  },

  get: async (id: string): Promise<Supplier> => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  create: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};

// Users API
export const usersApi = {
  list: async (params?: { role?: string; search?: string; page?: number; limit?: number }): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  get: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  create: async (data: { email: string; password: string; name: string; role: string }): Promise<User> => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Reports API
export const reportsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  getOrdersReport: async (params?: { startDate?: string; endDate?: string }): Promise<unknown> => {
    const response = await api.get('/reports/orders', { params });
    return response.data;
  },

  getInventoryReport: async (): Promise<unknown> => {
    const response = await api.get('/reports/inventory');
    return response.data;
  },

  getProjectsReport: async (): Promise<unknown> => {
    const response = await api.get('/reports/projects');
    return response.data;
  },

  getFinancialReport: async (params?: { startDate?: string; endDate?: string }): Promise<unknown> => {
    const response = await api.get('/reports/financial', { params });
    return response.data;
  },
};

export default api;
