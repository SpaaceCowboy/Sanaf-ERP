import { Router } from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierItems,
  getSupplierStats,
  getSupplierCountries,
} from '../controllers/supplierController';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { validate, paginationSchema, idParamSchema } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Supplier management
router.get('/', requireAnyPermission(['inventory:read', 'inventory:create']), validate(paginationSchema, 'query'), getSuppliers);
router.get('/countries', requireAnyPermission(['inventory:read', 'inventory:create']), getSupplierCountries);
router.get('/:id', requireAnyPermission(['inventory:read', 'inventory:create']), validate(idParamSchema, 'params'), getSupplierById);
router.post('/', requirePermission('inventory:create'), createSupplier);
router.put('/:id', requirePermission('inventory:update'), validate(idParamSchema, 'params'), updateSupplier);
router.delete('/:id', requirePermission('inventory:delete'), validate(idParamSchema, 'params'), deleteSupplier);

// Supplier related data
router.get('/:id/items', requirePermission('inventory:read'), validate(idParamSchema, 'params'), validate(paginationSchema, 'query'), getSupplierItems);
router.get('/:id/stats', requirePermission('reports:view'), validate(idParamSchema, 'params'), getSupplierStats);

export default router;
