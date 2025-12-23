"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documentController_1 = require("../controllers/documentController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Document management
router.get('/', (0, rbac_1.requirePermission)('documents:read'), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), documentController_1.getDocuments);
router.get('/types', (0, rbac_1.requirePermission)('documents:read'), documentController_1.getDocumentTypes);
router.get('/:id', (0, rbac_1.requirePermission)('documents:read'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), documentController_1.getDocumentById);
router.post('/generate', (0, rbac_1.requirePermission)('documents:generate'), documentController_1.generateInvoice);
router.get('/:id/download', (0, rbac_1.requirePermission)('documents:read'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), documentController_1.downloadDocument);
router.delete('/:id', (0, rbac_1.requirePermission)('documents:delete'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), documentController_1.deleteDocument);
exports.default = router;
//# sourceMappingURL=documents.js.map