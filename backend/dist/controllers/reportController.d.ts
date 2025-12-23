import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
export declare function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getOrderReport(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getInventoryReport(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getProjectReport(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getFinancialReport(req: AuthenticatedRequest, res: Response): Promise<void>;
//# sourceMappingURL=reportController.d.ts.map