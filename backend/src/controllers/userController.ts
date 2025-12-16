import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { parsePagination, buildPaginatedResponse } from '../utils/helpers';

const prisma = new PrismaClient();

// Get all users with pagination
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { skip, take, page, limit } = parsePagination(req.query);
    const { search, role, isActive } = req.query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
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
          name: true,
          role: true,
          department: true,
          phone: true,
          isActive: true,
          lastLogin: true,
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

    res.json(buildPaginatedResponse(users, total, page, limit));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get single user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        lastLogin: true,
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
export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, department, phone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'VIEWER',
        department,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user.id,
        details: { email: user.email, name: user.name, role: user.role },
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, department, phone, isActive } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-demotion from admin
    if (id === req.user!.id && existingUser.role === 'ADMIN' && role !== 'ADMIN') {
      return res.status(400).json({ error: 'Cannot demote yourself from admin' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
        department,
        phone,
        isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: user.id,
        details: { changes: req.body },
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Reset user password (admin only)
export const resetUserPassword = async (req: Request, res: Response) => {
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
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'USER_PASSWORD_RESET',
        entityType: 'User',
        entityId: id,
        details: { resetBy: req.user!.email },
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Delete user (soft delete by deactivating)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user!.id) {
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
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: id,
        details: { email: existingUser.email },
      },
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get user activity log
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { skip, take, page, limit } = parsePagination(req.query);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where: { userId: id } }),
    ]);

    res.json(buildPaginatedResponse(logs, total, page, limit));
  } catch (error) {
    console.error('Error fetching user activity:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};

// Get available roles
export const getRoles = async (_req: Request, res: Response) => {
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
