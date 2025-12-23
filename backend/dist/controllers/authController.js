"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refreshToken = refreshToken;
exports.getCurrentUser = getCurrentUser;
exports.changePassword = changePassword;
exports.logout = logout;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
async function register(req, res) {
    try {
        const data = req.body;
        // Check if user exists
        const existingUser = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        // Create user
        const user = await database_1.default.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || 'VIEWER',
                department: data.department,
                phone: data.phone,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                department: true,
                createdAt: true,
            },
        });
        // Generate tokens
        const tokens = (0, auth_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: user.id,
                action: 'REGISTER',
                entity: 'User',
                entityId: user.id,
                newValues: { email: user.email, role: user.role },
            },
        });
        res.status(201).json({
            user,
            ...tokens,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
}
async function login(req, res) {
    try {
        const data = req.body;
        // Find user
        const user = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Check if user is active
        if (!user.isActive) {
            res.status(401).json({ error: 'Account is deactivated' });
            return;
        }
        // Verify password
        const isValid = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        // Update last login
        await database_1.default.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        // Generate tokens
        const tokens = (0, auth_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: user.id,
                action: 'LOGIN',
                entity: 'User',
                entityId: user.id,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
        });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                department: user.department,
                avatar: user.avatar,
            },
            ...tokens,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
}
async function refreshToken(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ error: 'Refresh token required' });
            return;
        }
        // Verify refresh token
        const payload = (0, auth_1.verifyRefreshToken)(refreshToken);
        // Check if user still exists and is active
        const user = await database_1.default.user.findUnique({
            where: { id: payload.userId },
        });
        if (!user || !user.isActive) {
            res.status(401).json({ error: 'User not found or inactive' });
            return;
        }
        // Generate new tokens
        const tokens = (0, auth_1.generateTokens)({
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        res.json(tokens);
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
}
async function getCurrentUser(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                department: true,
                phone: true,
                avatar: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
}
async function changePassword(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        // Get user with password
        const user = await database_1.default.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Verify current password
        const isValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValid) {
            res.status(400).json({ error: 'Current password is incorrect' });
            return;
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        // Update password
        await database_1.default.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        // Log audit
        await database_1.default.auditLog.create({
            data: {
                userId: user.id,
                action: 'CHANGE_PASSWORD',
                entity: 'User',
                entityId: user.id,
            },
        });
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
}
async function logout(req, res) {
    try {
        if (req.user) {
            // Log audit
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'LOGOUT',
                    entity: 'User',
                    entityId: req.user.userId,
                },
            });
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
}
//# sourceMappingURL=authController.js.map