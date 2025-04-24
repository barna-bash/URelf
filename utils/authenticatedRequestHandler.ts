// utils/typedHandler.ts
import type { Response, NextFunction, RequestHandler } from 'express';
import type { AuthenticatedRequest } from '../middlewares/apiKeyAuthMiddleware';

export function authenticatedRoute(handler: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> | void): RequestHandler {
  return (req, res, next) => {
    return Promise.resolve(handler(req as AuthenticatedRequest, res, next)).catch(next);
  };
}
