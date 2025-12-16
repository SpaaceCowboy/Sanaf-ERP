import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  getUserActivity,
  getRoles,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { adminOnly, managerAndAbove } from '../middleware/rbac';
import { validate, registerSchema, paginationSchema, idParamSchema } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User management (admin only for most operations)
router.get('/', managerAndAbove, validate(paginationSchema, 'query'), getUsers);
router.get('/roles', managerAndAbove, getRoles);
router.get('/:id', managerAndAbove, validate(idParamSchema, 'params'), getUserById);
router.post('/', adminOnly, validate(registerSchema), createUser);
router.put('/:id', adminOnly, validate(idParamSchema, 'params'), updateUser);
router.post('/:id/reset-password', adminOnly, validate(idParamSchema, 'params'), resetUserPassword);
router.delete('/:id', adminOnly, validate(idParamSchema, 'params'), deleteUser);
router.get('/:id/activity', adminOnly, validate(idParamSchema, 'params'), validate(paginationSchema, 'query'), getUserActivity);

export default router;
