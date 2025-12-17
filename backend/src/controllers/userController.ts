import { Response } from 'express';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AuthenticatedRequest, PaginationParams } from '../types/index';
import { parsePagination, buildPaginatedResponse } from '../utils/helpers';

// Get all users with pagination
export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const paginationParams: PaginationParams = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const { skip, take } = parsePagination(paginationParams);
    const { search, role, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as Role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count({ where }),
    ]);

    res.json(buildPaginatedResponse(users, total, paginationParams));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get single user by ID
export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
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
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user
export const createUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, department, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
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
      await prisma.auditLog.create({
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
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
export const updateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, department, phone, isActive } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-demotion from admin
    if (req.user && id === req.user.userId && existingUser.role === 'ADMIN' && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Cannot demote yourself from admin' });
    }

    const user = await prisma.user.update({
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
      await prisma.auditLog.create({
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
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Reset user password (admin only)
export const resetUserPassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Create audit log
    if (req.user) {
      await prisma.auditLog.create({
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
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Delete user (soft delete by deactivating)
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user && id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Create audit log
    if (req.user) {
      await prisma.auditLog.create({
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
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get user activity log
export const getUserActivity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const paginationParams: PaginationParams = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    const { skip, take } = parsePagination(paginationParams);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where: { userId: id } }),
    ]);

    res.json(buildPaginatedResponse(logs, total, paginationParams));
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};

// Get available roles
export const getRoles = async (_req: AuthenticatedRequest, res: Response) => {
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
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};
