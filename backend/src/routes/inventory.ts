import { Router } from 'express';
import {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  updateInventoryItem,
  deleteInventoryItem,
  recordMovement,
  getMovements,
  getLowStockItems,
  getInventoryStats,
  getCategories,
} from '../controllers/inventoryController';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { validate, createInventoryItemSchema, updateInventoryItemSchema, createMovementSchema, paginationSchema, idParamSchema } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Inventory item CRUD
router.post('/', requirePermission('inventory:create'), validate(createInventoryItemSchema), createInventoryItem);
router.get('/', requireAnyPermission(['inventory:read', 'inventory:read_own']), validate(paginationSchema, 'query'), getInventoryItems);
router.get('/low-stock', requirePermission('inventory:read'), getLowStockItems);
router.get('/stats', requirePermission('reports:view'), getInventoryStats);
router.get('/categories', requirePermission('inventory:read'), getCategories);
router.get('/:id', requirePermission('inventory:read'), validate(idParamSchema, 'params'), getInventoryItemById);
router.put('/:id', requirePermission('inventory:update'), validate(idParamSchema, 'params'), validate(updateInventoryItemSchema), updateInventoryItem);
router.delete('/:id', requirePermission('inventory:delete'), validate(idParamSchema, 'params'), deleteInventoryItem);

// Inventory movements
router.post('/:id/movements', requirePermission('inventory:update'), validate(idParamSchema, 'params'), validate(createMovementSchema), recordMovement);
router.get('/:id/movements', requirePermission('inventory:read'), validate(idParamSchema, 'params'), validate(paginationSchema, 'query'), getMovements);

export default router;
