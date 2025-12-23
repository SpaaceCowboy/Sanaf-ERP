import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
export declare function getOrders(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getOrderById(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function createOrder(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateOrder(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteOrder(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getOrderStats(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function generateOrderInvoice(req: AuthenticatedRequest, res: Response): Promise<void>;
//# sourceMappingURL=orderController.d.ts.map