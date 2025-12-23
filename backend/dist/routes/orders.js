"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Order CRUD
router.post('/', (0, rbac_1.requirePermission)('orders:create'), (0, validation_1.validate)(validation_1.createOrderSchema), orderController_1.createOrder);
router.get('/', (0, rbac_1.requireAnyPermission)('orders:read', 'orders:read_own'), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), orderController_1.getOrders);
router.get('/stats', (0, rbac_1.requirePermission)('reports:view'), orderController_1.getOrderStats);
router.get('/:id', (0, rbac_1.requireAnyPermission)('orders:read', 'orders:read_own'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), orderController_1.getOrderById);
router.put('/:id', (0, rbac_1.requirePermission)('orders:update'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.updateOrderSchema), orderController_1.updateOrder);
router.delete('/:id', (0, rbac_1.requirePermission)('orders:delete'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), orderController_1.deleteOrder);
// Order status management
router.patch('/:id/status', (0, rbac_1.requirePermission)('orders:update'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.updateOrderStatusSchema), orderController_1.updateOrderStatus);
// Invoice generation
router.post('/:id/invoice', (0, rbac_1.requirePermission)('documents:generate'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), orderController_1.generateOrderInvoice);
exports.default = router;
//# sourceMappingURL=orders.js.map