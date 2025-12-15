import { Response, NextFunction } from 'express'
import { Role } from '@prisma/client'
import { AuthenticatedRequest, Permission, RolePermissions } from '../types/index'

//middleware to check if user has required role
export function requireRole(...allowedRoles: Role[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

  // Middleware to check if user has required permission(s)

  export function requirePermission(...requiredPermissions: Permission[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required'})
            return
        }

        const userPermissions = RolePermissions[req.user.role]

        const hasAllPermissions = requiredPermissions.every(
            permission => userPermissions.includes(permission)
          );
        
          if (!hasAllPermissions) {
            res.status(403).json({
                error: 'Insufficient permissions',
                required: requiredPermissions,
                missing: requiredPermissions.filter(p => !userPermissions.includes(p)),
            })
            return
          }
          next()
    }
  }

  //Middleware to check if user has at least one of the required permissions
  export function requireAnyPermission(...permissions: Permission[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required'
            })
            return
        }
        const userPermissions = RolePermissions[req.user.role]

        const hasAnyPermission = permissions.some(
            permission => userPermissions.includes(permission)
        )

        if (!hasAnyPermission) {
            res.status(403).json({
                error:'Insufficient permissions',
                requiredOnOf: permissions
            })
            return
        }

        next()
    }
  }

  // check if user has a specific permission 

  export function hasAllPermission(role: Role, permission: Permission): boolean {
    return RolePermissions[role].includes(permission)
  }

  // get all permissions for a role
  export function getPermissionsForRole(role: Role): Permission[] {
    return RolePermissions[role]
  }

  //admin only middleware shortcut
  export const adminOnly = requireRole('ADMIN')

  // manager and above middleware shortcut

  export const managerAndAbove = requireRole('ADMIN', 'MANAGER')