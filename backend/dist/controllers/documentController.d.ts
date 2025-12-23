import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index';
export declare function getDocuments(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getDocumentById(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function generateInvoice(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function downloadDocument(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function regenerateDocument(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getDocumentTypes(req: AuthenticatedRequest, res: Response): Promise<void>;
//# sourceMappingURL=documentController.d.ts.map