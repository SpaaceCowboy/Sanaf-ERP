"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventoryController_1 = require("../controllers/inventoryController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Inventory item CRUD
router.post('/', (0, rbac_1.requirePermission)('inventory:create'), (0, validation_1.validate)(validation_1.createInventoryItemSchema), inventoryController_1.createInventoryItem);
router.get('/', (0, rbac_1.requireAnyPermission)(['inventory:read', 'inventory:read_own']), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), inventoryController_1.getInventoryItems);
router.get('/low-stock', (0, rbac_1.requirePermission)('inventory:read'), inventoryController_1.getLowStockItems);
router.get('/stats', (0, rbac_1.requirePermission)('reports:view'), inventoryController_1.getInventoryStats);
router.get('/categories', (0, rbac_1.requirePermission)('inventory:read'), inventoryController_1.getCategories);
router.get('/:id', (0, rbac_1.requirePermission)('inventory:read'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), inventoryController_1.getInventoryItemById);
router.put('/:id', (0, rbac_1.requirePermission)('inventory:update'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.updateInventoryItemSchema), inventoryController_1.updateInventoryItem);
router.delete('/:id', (0, rbac_1.requirePermission)('inventory:delete'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), inventoryController_1.deleteInventoryItem);
// Inventory movements
router.post('/:id/movements', (0, rbac_1.requirePermission)('inventory:update'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.createMovementSchema), inventoryController_1.recordMovement);
router.get('/:id/movements', (0, rbac_1.requirePermission)('inventory:read'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), inventoryController_1.getMovements);
exports.default = router;
//# sourceMappingURL=inventory.js.map