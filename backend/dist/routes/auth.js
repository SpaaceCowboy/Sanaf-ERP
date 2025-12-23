"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', (0, validation_1.validate)(validation_1.registerSchema), authController_1.register);
router.post('/login', (0, validation_1.validate)(validation_1.loginSchema), authController_1.login);
router.post('/refresh', authController_1.refreshToken);
// Protected routes
router.get('/me', auth_1.authenticate, authController_1.getCurrentUser);
router.post('/change-password', auth_1.authenticate, (0, validation_1.validate)(validation_1.changePasswordSchema), authController_1.changePassword);
router.post('/logout', auth_1.authenticate, authController_1.logout);
exports.default = router;
//# sourceMappingURL=auth.js.map