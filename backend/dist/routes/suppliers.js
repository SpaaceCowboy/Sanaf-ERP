"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supplierController_1 = require("../controllers/supplierController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Supplier management
router.get('/', (0, rbac_1.requireAnyPermission)(['inventory:read', 'inventory:create']), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), supplierController_1.getSuppliers);
router.get('/countries', (0, rbac_1.requireAnyPermission)(['inventory:read', 'inventory:create']), supplierController_1.getSupplierCountries);
router.get('/:id', (0, rbac_1.requireAnyPermission)(['inventory:read', 'inventory:create']), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), supplierController_1.getSupplierById);
router.post('/', (0, rbac_1.requirePermission)('inventory:create'), supplierController_1.createSupplier);
router.put('/:id', (0, rbac_1.requirePermission)('inventory:update'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), supplierController_1.updateSupplier);
router.delete('/:id', (0, rbac_1.requirePermission)('inventory:delete'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), supplierController_1.deleteSupplier);
// Supplier related data
router.get('/:id/items', (0, rbac_1.requirePermission)('inventory:read'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), supplierController_1.getSupplierItems);
router.get('/:id/stats', (0, rbac_1.requirePermission)('reports:view'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), supplierController_1.getSupplierStats);
exports.default = router;
//# sourceMappingURL=suppliers.js.map