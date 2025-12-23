import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
export declare function getProjects(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getProjectById(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function createProject(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateProject(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteProject(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function createTask(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateTask(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function reorderTasks(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getMyTasks(req: AuthenticatedRequest, res: Response): Promise<void>;
//# sourceMappingURL=projectController.d.ts.map