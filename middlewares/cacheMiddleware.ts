import NodeCache from 'node-cache';
import { type Response, type NextFunction, type RequestHandler } from 'express';
import type { AuthenticatedRequest } from './apiKeyAuthMiddleware';

function concatenateCacheKey(req: AuthenticatedRequest): string {
  const userId = req.userId;

  const url = req.originalUrl || req.url;

  const key = `${userId}-${url}`;
  return key;
}

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const cacheResolver = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') {
    //Invalidate cache for non-GET requests
    const key = concatenateCacheKey(req);
    cache.del(key); // Invalidate the cache for this key
    console.log('Cache invalidated for', key);

    return next();
  }
  const key = concatenateCacheKey(req);
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log('Read from cache');
    return res.status(200).json(cachedResponse);
  }

  // Monkey-patch res.json to capture the response payload
  const originalJson = res.json.bind(res);

  if ([200, 201].includes(res.statusCode)) {
    res.json = (body: JSON): Response => {
      cache.set(key, body);
      console.log('Set cache for', key);
      return originalJson(body);
    };
  }

  next();
};

export const cacheMiddleWare: RequestHandler = (req, res, next) => {
  cacheResolver(req as AuthenticatedRequest, res, next); // Call cacheResolver to handle caching
};
