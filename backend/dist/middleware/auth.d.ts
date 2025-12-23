import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, JwtPayload } from '../types/index';
export declare function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void;
export declare function generateTokens(payload: JwtPayload): {
    accessToken: string;
    refreshToken: string;
};
export declare function verifyRefreshToken(token: string): JwtPayload;
//# sourceMappingURL=auth.d.ts.map