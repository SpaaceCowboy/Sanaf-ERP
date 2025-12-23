import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
export declare function getInventoryItems(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getInventoryItemById(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function createInventoryItem(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateInventoryItem(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteInventoryItem(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function recordMovement(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getMovements(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getLowStockItems(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getInventoryStats(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getCategories(req: AuthenticatedRequest, res: Response): Promise<void>;
//# sourceMappingURL=inventoryController.d.ts.map