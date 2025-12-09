import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { userCollection } from '../utils/db';
import type { User } from '../models/users';

import NodeCache from 'node-cache';
import { DEFAULT_RATE_LIMIT } from '../utils/constants';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export const userCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 });
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
type RateLimiterEntry = { count: number; resetAt: number };
const rateLimiterCache = new NodeCache({ stdTTL: RATE_LIMIT_WINDOW_MS / 1000, checkperiod: 30 });

const consumeRateLimitToken = (userId: string, maxRequestsPerWindow: number): boolean => {
  const key = `rate:${userId}`;
  const existingWindow = rateLimiterCache.get<RateLimiterEntry>(key);
  const now = Date.now();

  if (!existingWindow || existingWindow.resetAt <= now) {
    rateLimiterCache.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }, RATE_LIMIT_WINDOW_MS / 1000);
    return true;
  }

  if (existingWindow.count >= maxRequestsPerWindow) {
    return false;
  }

  const remainingWindowSeconds = Math.max(1, Math.round((existingWindow.resetAt - now) / 1000));
  rateLimiterCache.set(
    key,
    { count: existingWindow.count + 1, resetAt: existingWindow.resetAt },
    remainingWindowSeconds
  );
  return true;
};

const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const authHeader = req.headers['authorization'];
  const apiKey = typeof authHeader === 'string' && authHeader.startsWith('Api-Key ') ? authHeader.substring(8) : null;

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(401).json({ message: 'API key is missing' });
  }

  try {
    let cachedUser = userCache.get<User>(apiKey);
    if (!cachedUser) {
      const user = await userCollection.findOne<User>({ apiKeys: apiKey });
      if (!user) {
        return res.status(401).json({ message: 'Invalid API key' });
      }
      userCache.set(apiKey, user);
      cachedUser = user;
    }

    const userRateLimit = cachedUser.rateLimit ?? DEFAULT_RATE_LIMIT;
    const userId = cachedUser._id.toString();

    if (!consumeRateLimitToken(userId, userRateLimit)) {
      return res.status(429).json({ message: 'Rate limit exceeded' });
    }

    // Attach user ID to the request object for later use
    (req as AuthenticatedRequest).userId = userId;

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Database query failed', error });
  }
};

export const apiKeyAuthMiddleware: RequestHandler = (req, res, next) => {
  apiKeyAuth(req as AuthenticatedRequest, res, next).catch(next); // Catch unhandled rejections
};
