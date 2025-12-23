"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Customer management
router.get('/', (0, rbac_1.requireAnyPermission)(['orders:read', 'orders:create']), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), customerController_1.getCustomers);
router.get('/countries', (0, rbac_1.requireAnyPermission)(['orders:read', 'orders:create']), customerController_1.getCountries);
router.get('/:id', (0, rbac_1.requireAnyPermission)(['orders:read', 'orders:create']), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), customerController_1.getCustomerById);
router.post('/', (0, rbac_1.requirePermission)('orders:create'), customerController_1.createCustomer);
router.put('/:id', (0, rbac_1.requirePermission)('orders:update'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), customerController_1.updateCustomer);
router.delete('/:id', (0, rbac_1.requirePermission)('orders:delete'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), customerController_1.deleteCustomer);
// Customer related data
router.get('/:id/orders', (0, rbac_1.requirePermission)('orders:read'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), customerController_1.getCustomerOrders);
router.get('/:id/stats', (0, rbac_1.requirePermission)('reports:view'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), customerController_1.getCustomerStats);
exports.default = router;
//# sourceMappingURL=customers.js.map