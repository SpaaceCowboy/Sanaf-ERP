"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectController_1 = require("../controllers/projectController");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Project CRUD
router.post('/', (0, rbac_1.requirePermission)('projects:create'), (0, validation_1.validate)(validation_1.createProjectSchema), projectController_1.createProject);
router.get('/', (0, rbac_1.requireAnyPermission)(['projects:read', 'projects:read_own']), (0, validation_1.validate)(validation_1.paginationSchema, 'query'), projectController_1.getProjects);
router.get('/my-tasks', projectController_1.getMyTasks); // Get tasks assigned to current user
router.get('/:id', (0, rbac_1.requireAnyPermission)(['projects:read', 'projects:read_own']), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), projectController_1.getProjectById);
router.put('/:id', (0, rbac_1.requirePermission)('projects:update'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.updateProjectSchema), projectController_1.updateProject);
router.delete('/:id', (0, rbac_1.requirePermission)('projects:delete'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), projectController_1.deleteProject);
// Task management
router.post('/:id/tasks', (0, rbac_1.requirePermission)('projects:update'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), (0, validation_1.validate)(validation_1.createTaskSchema), projectController_1.createTask);
router.put('/:id/tasks/:taskId', (0, rbac_1.requireAnyPermission)(['projects:update', 'projects:update_own']), projectController_1.updateTask);
router.delete('/:id/tasks/:taskId', (0, rbac_1.requirePermission)('projects:delete'), projectController_1.deleteTask);
router.post('/:id/tasks/reorder', (0, rbac_1.requirePermission)('projects:update'), (0, validation_1.validate)(validation_1.idParamSchema, 'params'), projectController_1.reorderTasks);
exports.default = router;
//# sourceMappingURL=projects.js.map