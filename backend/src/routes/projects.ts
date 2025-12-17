import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  getMyTasks,
} from '../controllers/projectController';
import { authenticate } from '../middleware/auth';
import { requirePermission, requireAnyPermission } from '../middleware/rbac';
import { validate, createProjectSchema, updateProjectSchema, createTaskSchema, updateTaskSchema, paginationSchema, idParamSchema } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Project CRUD
router.post('/', requirePermission('projects:create'), validate(createProjectSchema), createProject);
router.get('/', requireAnyPermission(['projects:read', 'projects:read_own']), validate(paginationSchema, 'query'), getProjects);
router.get('/my-tasks', getMyTasks); // Get tasks assigned to current user
router.get('/:id', requireAnyPermission(['projects:read', 'projects:read_own']), validate(idParamSchema, 'params'), getProjectById);
router.put('/:id', requirePermission('projects:update'), validate(idParamSchema, 'params'), validate(updateProjectSchema), updateProject);
router.delete('/:id', requirePermission('projects:delete'), validate(idParamSchema, 'params'), deleteProject);

// Task management
router.post('/:id/tasks', requirePermission('projects:update'), validate(idParamSchema, 'params'), validate(createTaskSchema), createTask);
router.put('/:id/tasks/:taskId', requireAnyPermission(['projects:update', 'projects:update_own']), updateTask);
router.delete('/:id/tasks/:taskId', requirePermission('projects:delete'), deleteTask);
router.post('/:id/tasks/reorder', requirePermission('projects:update'), validate(idParamSchema, 'params'), reorderTasks);

export default router;
