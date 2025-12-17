import { Response } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest, CreateProjectDto, UpdateProjectDto, CreateTaskDto, UpdateTaskDto, PaginationParams } from '../types/index';
import { generateProjectNumber, parsePagination, buildPaginatedResponse } from '../utils/helpers';

export async function getProjects(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { status, managerId, search } = req.query;
    const paginationParams: PaginationParams = {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };
    
    const { skip, take, orderBy } = parsePagination(paginationParams);
    
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (managerId) {
      where.managerId = managerId;
    }
    
    if (search) {
      where.OR = [
        { projectNumber: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
              customer: {
                select: { companyName: true },
              },
            },
          },
          _count: {
            select: { tasks: true },
          },
        },
      }),
      prisma.project.count({ where }),
    ]);
    
    res.json(buildPaginatedResponse(projects, total, paginationParams));
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
}

export async function getProjectById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        order: {
          include: {
            customer: true,
            items: true,
          },
        },
        tasks: {
          orderBy: { sortOrder: 'asc' },
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        materials: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                sku: true,
                name: true,
                quantity: true,
                unit: true,
              },
            },
          },
        },
      },
    });
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
}

export async function createProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const data: CreateProjectDto = req.body;
    
    // Verify manager exists
    const manager = await prisma.user.findUnique({
      where: { id: data.managerId },
    });
    
    if (!manager) {
      res.status(400).json({ error: 'Manager not found' });
      return;
    }
    
    // If orderId provided, verify it exists and doesn't have a project
    if (data.orderId) {
      const order = await prisma.order.findUnique({
        where: { id: data.orderId },
        include: { project: true },
      });
      
      if (!order) {
        res.status(400).json({ error: 'Order not found' });
        return;
      }
      
      if (order.project) {
        res.status(400).json({ error: 'Order already has a project assigned' });
        return;
      }
    }
    
    const project = await prisma.project.create({
      data: {
        projectNumber: generateProjectNumber(),
        name: data.name,
        description: data.description,
        orderId: data.orderId,
        managerId: data.managerId,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
        priority: data.priority || 'MEDIUM',
        estimatedHours: data.estimatedHours,
        notes: data.notes,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'CREATE',
        entity: 'Project',
        entityId: project.id,
        newValues: {
          projectNumber: project.projectNumber,
          name: project.name,
        },
      },
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
}

export async function updateProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { id } = req.params;
    const data: UpdateProjectDto = req.body;
    
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!existingProject) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        progress: data.progress,
        actualHours: data.actualHours,
        notes: data.notes,
        completedDate: data.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tasks: true,
      },
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'UPDATE',
        entity: 'Project',
        entityId: project.id,
        oldValues: {
          status: existingProject.status,
          progress: existingProject.progress,
        },
        newValues: data,
      },
    });
    
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    await prisma.project.delete({
      where: { id },
    });
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'DELETE',
        entity: 'Project',
        entityId: id,
        oldValues: {
          projectNumber: project.projectNumber,
          name: project.name,
        },
      },
    });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
}

// ==================== TASK MANAGEMENT ====================

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { projectId } = req.params;
    const data: CreateTaskDto = req.body;
    
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    
    // Get max sort order
    const maxOrder = await prisma.projectTask.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    });
    
    const task = await prisma.projectTask.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        assigneeId: data.assigneeId,
        priority: data.priority || 'MEDIUM',
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        estimatedHours: data.estimatedHours,
        isChecklist: data.isChecklist || false,
        checklistItems: data.checklistItems,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
    
    // Update project progress
    await updateProjectProgress(projectId);
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { projectId, taskId } = req.params;
    const data: UpdateTaskDto = req.body;
    
    const existingTask = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });
    
    if (!existingTask) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    const task = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        assigneeId: data.assigneeId,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
        actualHours: data.actualHours,
        checklistItems: data.checklistItems,
        completedDate: data.status === 'COMPLETED' ? new Date() : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
    
    // Update project progress
    await updateProjectProgress(projectId);
    
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { projectId, taskId } = req.params;
    
    const task = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });
    
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    await prisma.projectTask.delete({
      where: { id: taskId },
    });
    
    // Update project progress
    await updateProjectProgress(projectId);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
}

export async function reorderTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { projectId } = req.params;
    const { taskIds } = req.body; // Array of task IDs in new order
    
    // Update sort order for each task
    await Promise.all(
      taskIds.map((taskId: string, index: number) =>
        prisma.projectTask.update({
          where: { id: taskId },
          data: { sortOrder: index },
        })
      )
    );
    
    const tasks = await prisma.projectTask.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
}

// Helper function to update project progress
async function updateProjectProgress(projectId: string): Promise<void> {
  const tasks = await prisma.projectTask.findMany({
    where: { projectId },
  });
  
  if (tasks.length === 0) {
    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 0 },
    });
    return;
  }
  
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const progress = Math.round((completedTasks / tasks.length) * 100);
  
  await prisma.project.update({
    where: { id: projectId },
    data: { progress },
  });
}

export async function getMyTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const tasks = await prisma.projectTask.findMany({
      where: {
        assigneeId: req.user.userId,
        status: { not: 'COMPLETED' },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
      include: {
        project: {
          select: {
            id: true,
            projectNumber: true,
            name: true,
          },
        },
      },
    });
    
    res.json(tasks);
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}
