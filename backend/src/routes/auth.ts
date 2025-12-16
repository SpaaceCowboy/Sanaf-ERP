import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  changePassword,
  logout,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, loginSchema, registerSchema, changePasswordSchema } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);
router.post('/logout', authenticate, logout);

export default router;
