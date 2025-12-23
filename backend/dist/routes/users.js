"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// User management (admin only for most operations)
router.get('/', rbac_1.managerAndAbove, (0, validation_1.validate)(validation_1.paginationSchema, 'query'), userController_1.getUsers);
router.get('/roles', rbac_1.managerAndAbove, userController_1.getRoles);
router.get('/:id', rbac_1.managerAndAbove, (0, validation_1.validate)(validation_1.idParamSchema, 'params'), userController_1.getUserById);
router.post('/', rbac_1.adminOnly, (0, validation_1.validate)(validation_1.registerSchema), userController_1.createUser);
router.put('/:id', rbac_1.adminOnly, (0, validation_1.validate)(validation_1.idParamSchema, 'params'), userController_1.updateUser);
router.post('/:id/reset-password', rbac_1.adminOnly, (0, validation_1.validate)(validation_1.idParamSchema, 'params'), userController_1.resetUserPassword);
router.delete('/:id', rbac_1.adminOnly, (0, validation_1.validate)(validation_1.idParamSchema, 'params'), userController_1.deleteUser);
router.get('/:id/activity', rbac_1.adminOnly, (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), userController_1.getUserActivity);
exports.default = router;
//# sourceMappingURL=users.js.map