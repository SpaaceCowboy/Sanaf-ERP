import { Router } from 'express';
import {
  getDocuments,
  getDocumentById,
  generateInvoice,
  downloadDocument,
  deleteDocument,
  getDocumentTypes,
} from '../controllers/documentController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { validate, paginationSchema, idParamSchema } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Document management
router.get('/', requirePermission('documents:read'), validate(paginationSchema, 'query'), getDocuments);
router.get('/types', requirePermission('documents:read'), getDocumentTypes);
router.get('/:id', requirePermission('documents:read'), validate(idParamSchema, 'params'), getDocumentById);
router.post('/generate', requirePermission('documents:generate'), generateInvoice);
router.get('/:id/download', requirePermission('documents:read'), validate(idParamSchema, 'params'), downloadDocument);
router.delete('/:id', requirePermission('documents:delete'), validate(idParamSchema, 'params'), deleteDocument);

export default router;
