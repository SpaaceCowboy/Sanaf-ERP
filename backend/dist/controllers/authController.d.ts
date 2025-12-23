import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
export declare function register(req: Request, res: Response): Promise<void>;
export declare function login(req: Request, res: Response): Promise<void>;
export declare function refreshToken(req: Request, res: Response): Promise<void>;
export declare function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function changePassword(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function logout(req: AuthenticatedRequest, res: Response): Promise<void>;
//# sourceMappingURL=authController.d.ts.map