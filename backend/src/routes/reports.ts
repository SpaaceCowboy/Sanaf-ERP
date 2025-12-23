import { Router } from 'express';
import {
  getDashboardStats,
  getOrderReport,
  getInventoryReport,
  getProjectReport,
  getFinancialReport,
} from '../controllers/reportController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Dashboard and reports
router.get('/dashboard', requirePermission('reports:view'), getDashboardStats);
router.get('/orders', requirePermission('reports:view'), getOrderReport);
router.get('/inventory', requirePermission('reports:view'), getInventoryReport);
router.get('/projects', requirePermission('reports:view'), getProjectReport);
router.get('/financial', requirePermission('reports:view'), getFinancialReport);

export default router;
