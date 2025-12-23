"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.managerAndAbove = exports.adminOnly = void 0;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
exports.hasPermission = hasPermission;
exports.getPermissionsForRole = getPermissionsForRole;
const index_1 = require("../types/index");
/**
 * Middleware to check if user has required role(s)
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: req.user.role,
            });
            return;
        }
        next();
    };
}
/**
 * Middleware to check if user has required permission(s)
 */
function requirePermission(...requiredPermissions) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const userPermissions = index_1.RolePermissions[req.user.role];
        const hasAllPermissions = requiredPermissions.every(permission => userPermissions.includes(permission));
        if (!hasAllPermissions) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: requiredPermissions,
                missing: requiredPermissions.filter(p => !userPermissions.includes(p)),
            });
            return;
        }
        next();
    };
}
/**
 * Middleware to check if user has at least one of the required permissions
 */
function requireAnyPermission(...permissions) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        const userPermissions = index_1.RolePermissions[req.user.role];
        const hasAnyPermission = permissions.some(permission => userPermissions.includes(permission));
        if (!hasAnyPermission) {
            res.status(403).json({
                error: 'Insufficient permissions',
                requiredOneOf: permissions,
            });
            return;
        }
        next();
    };
}
/**
 * Check if user has a specific permission (helper function)
 */
function hasPermission(role, permission) {
    return index_1.RolePermissions[role].includes(permission);
}
/**
 * Get all permissions for a role
 */
function getPermissionsForRole(role) {
    return index_1.RolePermissions[role];
}
/**
 * Admin-only middleware shortcut
 */
exports.adminOnly = requireRole('ADMIN');
/**
 * Manager and above middleware shortcut
 */
exports.managerAndAbove = requireRole('ADMIN', 'MANAGER');
//# sourceMappingURL=rbac.js.map