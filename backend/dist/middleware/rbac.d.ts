import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest, Permission } from '../types/index';
/**
 * Middleware to check if user has required role(s)
 */
export declare function requireRole(...allowedRoles: Role[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has required permission(s)
 */
export declare function requirePermission(...requiredPermissions: Permission[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has at least one of the required permissions
 */
export declare function requireAnyPermission(...permissions: Permission[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Check if user has a specific permission (helper function)
 */
export declare function hasPermission(role: Role, permission: Permission): boolean;
/**
 * Get all permissions for a role
 */
export declare function getPermissionsForRole(role: Role): Permission[];
/**
 * Admin-only middleware shortcut
 */
export declare const adminOnly: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Manager and above middleware shortcut
 */
export declare const managerAndAbove: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map