import NodeCache from 'node-cache';
import { type Response, type NextFunction, type RequestHandler } from 'express';
import type { AuthenticatedRequest } from './apiKeyAuthMiddleware';
import { DEFAULT_CACHE_TIME_REDIRECT_URL } from '../utils/constants';

function concatenateCacheKey(req: AuthenticatedRequest): string {
  const userId = req.userId;

  const url = (req.originalUrl || req.url).replace('/', '');

  const key = `${userId ? `${userId}-` : ''}${url ? `${url}` : ''}`;
  return key;
}

export const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const cacheResolver = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') {
    //Invalidate cache for non-GET requests
    const key = concatenateCacheKey(req);
    cache.del(key); // Invalidate the cache for this key
    console.log('Cache invalidated for', key);

    return next();
  }
  const key = concatenateCacheKey(req);
  const cachedResponse = cache.get<JSON>(key);

  const cachedRedirectUrl = req.method === 'GET' && cache.get<{ redirectUrl: string }>(key);

  if (cachedResponse) {
    if (req.method === 'GET' && cachedResponse && 'redirectUrl' in cachedResponse) {
      // Continue function execution. Cache is read in controller and usage is incremented.
      next();
    } else {
      console.log('Response read from cache');
      return res.status(200).json(cachedResponse);
    }
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

  if (cachedRedirectUrl) {
    next();
  } else {
    // Monkey-patch res.redirect to capture the redirect URL
    const originalRedirect = res.redirect.bind(res);
    // TODO: Remove type assertion or add validation
    (res.redirect as (url: string) => void) = (url: string): void => {
      cache.set(key, { redirectUrl: url }, DEFAULT_CACHE_TIME_REDIRECT_URL);
      console.log('Set cache for redirect', key);
      originalRedirect(url);
    };
  }

  next();
};

export const cacheMiddleWare: RequestHandler = (req, res, next) => {
  cacheResolver(req as AuthenticatedRequest, res, next); // Call cacheResolver to handle caching
};
