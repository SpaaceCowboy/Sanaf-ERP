import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
export declare const getCustomers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCustomerById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createCustomer: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateCustomer: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteCustomer: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCustomerOrders: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getCustomerStats: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getCountries: (_req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=customerController.d.ts.map