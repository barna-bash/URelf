import NodeCache from 'node-cache';
import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

const cacheResolver = (req: Request, res: Response, next: NextFunction) => {
  const key = req.originalUrl || req.url;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log('Read from cache');
    return res.status(200).json(cachedResponse);
  }

  // Monkey-patch res.json to capture the response payload
  const originalJson = res.json.bind(res);

  res.json = (body: JSON): Response => {
    cache.set(key, body); // Cache the response body
    console.log('Set cache for', key);
    return originalJson(body);
  };

  next();
};

export const cacheMiddleWare: RequestHandler = (req, res, next) => {
  cacheResolver(req, res, next); // Call cacheResolver to handle caching
};
