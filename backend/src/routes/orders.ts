import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  updateOrderStatus,
  getOrderStats,
  generateOrderInvoice,
} from '../controllers/orderController';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { validate, createOrderSchema, updateOrderSchema, paginationSchema, idParamSchema } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Order CRUD
router.post('/', requirePermission('orders:create'), validate(createOrderSchema), createOrder);
router.get('/', requireAnyPermission(['orders:read', 'orders:read_own']), validate(paginationSchema, 'query'), getOrders);
router.get('/stats', requirePermission('reports:view'), getOrderStats);
router.get('/:id', requireAnyPermission(['orders:read', 'orders:read_own']), validate(idParamSchema, 'params'), getOrderById);
router.put('/:id', requirePermission('orders:update'), validate(idParamSchema, 'params'), validate(updateOrderSchema), updateOrder);
router.delete('/:id', requirePermission('orders:delete'), validate(idParamSchema, 'params'), deleteOrder);

// Order status management
router.patch('/:id/status', requirePermission('orders:update'), validate(idParamSchema, 'params'), updateOrderStatus);

// Invoice generation
router.post('/:id/invoice', requirePermission('documents:generate'), validate(idParamSchema, 'params'), generateOrderInvoice);

export default router;
