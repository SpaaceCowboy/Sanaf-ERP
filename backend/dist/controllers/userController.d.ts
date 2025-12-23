import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
export declare const getUsers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getUserById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const resetUserPassword: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteUser: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getUserActivity: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getRoles: (_req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=userController.d.ts.map