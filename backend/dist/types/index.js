"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissions = void 0;
exports.RolePermissions = {
    ADMIN: [
        'orders:read', 'orders:create', 'orders:update', 'orders:delete',
        'projects:read', 'projects:create', 'projects:update', 'projects:delete',
        'inventory:read', 'inventory:create', 'inventory:update', 'inventory:delete',
        'documents:read', 'documents:create',
        'reports:read',
        'users:read', 'users:create', 'users:update', 'users:delete',
        'settings:read', 'settings:update',
    ],
    MANAGER: [
        'orders:read', 'orders:create', 'orders:update',
        'projects:read', 'projects:create', 'projects:update',
        'inventory:read',
        'documents:read', 'documents:create',
        'reports:read',
        'users:read',
    ],
    WAREHOUSE: [
        'orders:read',
        'projects:read',
        'inventory:read', 'inventory:create', 'inventory:update',
        'documents:read',
        'reports:read',
    ],
    PRODUCTION: [
        'orders:read',
        'projects:read', 'projects:update',
        'inventory:read',
        'documents:read',
    ],
    SALES: [
        'orders:read', 'orders:create', 'orders:update',
        'inventory:read',
        'documents:read', 'documents:create',
        'reports:read',
    ],
    VIEWER: [
        'orders:read',
        'projects:read',
        'inventory:read',
        'documents:read',
        'reports:read',
    ],
};
//# sourceMappingURL=index.js.map