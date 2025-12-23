"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Dashboard and reports
router.get('/dashboard', (0, rbac_1.requirePermission)('reports:view'), reportController_1.getDashboardStats);
router.get('/orders', (0, rbac_1.requirePermission)('reports:view'), reportController_1.getOrderReport);
router.get('/inventory', (0, rbac_1.requirePermission)('reports:view'), reportController_1.getInventoryReport);
router.get('/projects', (0, rbac_1.requirePermission)('reports:view'), reportController_1.getProjectReport);
router.get('/financial', (0, rbac_1.requirePermission)('reports:view'), reportController_1.getFinancialReport);
exports.default = router;
//# sourceMappingURL=reports.js.map