import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
export declare const getSuppliers: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSupplierById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createSupplier: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateSupplier: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteSupplier: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSupplierItems: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getSupplierStats: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSupplierCountries: (_req: AuthenticatedRequest, res: Response) => Promise<void>;
//# sourceMappingURL=supplierController.d.ts.map