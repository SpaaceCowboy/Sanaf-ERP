import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerOrders,
  getCustomerStats,
  getCountries,
} from '../controllers/customerController';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { validate, paginationSchema, idParamSchema } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer management
router.get('/', requireAnyPermission(['orders:read', 'orders:create']), validate(paginationSchema, 'query'), getCustomers);
router.get('/countries', requireAnyPermission(['orders:read', 'orders:create']), getCountries);
router.get('/:id', requireAnyPermission(['orders:read', 'orders:create']), validate(idParamSchema, 'params'), getCustomerById);
router.post('/', requirePermission('orders:create'), createCustomer);
router.put('/:id', requirePermission('orders:update'), validate(idParamSchema, 'params'), updateCustomer);
router.delete('/:id', requirePermission('orders:delete'), validate(idParamSchema, 'params'), deleteCustomer);

// Customer related data
router.get('/:id/orders', requirePermission('orders:read'), validate(idParamSchema, 'params'), validate(paginationSchema, 'query'), getCustomerOrders);
router.get('/:id/stats', requirePermission('reports:view'), validate(idParamSchema, 'params'), getCustomerStats);

export default router;
