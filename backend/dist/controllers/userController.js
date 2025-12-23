"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoles = exports.getUserActivity = exports.deleteUser = exports.resetUserPassword = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
const helpers_1 = require("../utils/helpers");
// Get all users with pagination
const getUsers = async (req, res) => {
    try {
        const paginationParams = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc',
        };
        const { skip, take } = (0, helpers_1.parsePagination)(paginationParams);
        const { search, role, isActive } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (role) {
            where.role = role;
        }
        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }
        const [users, total] = await Promise.all([
            database_1.default.user.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    department: true,
                    phone: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: {
                            assignedTasks: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.user.count({ where }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(users, total, paginationParams));
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
exports.getUsers = getUsers;
// Get single user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await database_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                department: true,
                phone: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                assignedTasks: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        project: {
                            select: { id: true, name: true },
                        },
                    },
                },
                _count: {
                    select: {
                        assignedTasks: true,
                        auditLogs: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};
exports.getUserById = getUserById;
// Create new user
const createUser = async (req, res) => {
    try {
        const { email, password, firstName, lastName, role, department, phone } = req.body;
        // Check if user already exists
        const existingUser = await database_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await database_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                role: role || 'VIEWER',
                department,
                phone,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                department: true,
                phone: true,
                isActive: true,
                createdAt: true,
            },
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'USER_CREATED',
                    entity: 'User',
                    entityId: user.id,
                    newValues: { email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
                },
            });
        }
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};
exports.createUser = createUser;
// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, role, department, phone, isActive } = req.body;
        const existingUser = await database_1.default.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Prevent self-demotion from admin
        if (req.user && id === req.user.userId && existingUser.role === 'ADMIN' && role !== 'ADMIN') {
            return res.status(400).json({ error: 'Cannot demote yourself from admin' });
        }
        const user = await database_1.default.user.update({
            where: { id },
            data: {
                firstName,
                lastName,
                role,
                department,
                phone,
                isActive,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                department: true,
                phone: true,
                isActive: true,
                updatedAt: true,
            },
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'USER_UPDATED',
                    entity: 'User',
                    entityId: user.id,
                    newValues: { changes: req.body },
                },
            });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
};
exports.updateUser = updateUser;
// Reset user password (admin only)
const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;
        const existingUser = await database_1.default.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Hash new password
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await database_1.default.user.update({
            where: { id },
            data: { password: hashedPassword },
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'USER_PASSWORD_RESET',
                    entity: 'User',
                    entityId: id,
                    newValues: { resetBy: req.user.email },
                },
            });
        }
        res.json({ message: 'Password reset successfully' });
    }
    catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};
exports.resetUserPassword = resetUserPassword;
// Delete user (soft delete by deactivating)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent self-deletion
        if (req.user && id === req.user.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        const existingUser = await database_1.default.user.findUnique({
            where: { id },
        });
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Soft delete by deactivating
        await database_1.default.user.update({
            where: { id },
            data: { isActive: false },
        });
        // Create audit log
        if (req.user) {
            await database_1.default.auditLog.create({
                data: {
                    userId: req.user.userId,
                    action: 'USER_DELETED',
                    entity: 'User',
                    entityId: id,
                    oldValues: { email: existingUser.email },
                },
            });
        }
        res.json({ message: 'User deactivated successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
// Get user activity log
const getUserActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const paginationParams = {
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        };
        const { skip, take } = (0, helpers_1.parsePagination)(paginationParams);
        const [logs, total] = await Promise.all([
            database_1.default.auditLog.findMany({
                where: { userId: id },
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            database_1.default.auditLog.count({ where: { userId: id } }),
        ]);
        res.json((0, helpers_1.buildPaginatedResponse)(logs, total, paginationParams));
    }
    catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ error: 'Failed to fetch user activity' });
    }
};
exports.getUserActivity = getUserActivity;
// Get available roles
const getRoles = async (_req, res) => {
    try {
        const roles = [
            { value: 'ADMIN', label: 'Administrator', description: 'Full system access' },
            { value: 'MANAGER', label: 'Manager', description: 'Manage orders, projects, and view reports' },
            { value: 'WAREHOUSE', label: 'Warehouse Staff', description: 'Manage inventory and movements' },
            { value: 'PRODUCTION', label: 'Production Staff', description: 'Update project tasks and progress' },
            { value: 'SALES', label: 'Sales Staff', description: 'Manage orders and customers' },
            { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' },
        ];
        res.json(roles);
    }
    catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};
exports.getRoles = getRoles;
//# sourceMappingURL=userController.js.map