import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { logCollection, userCollection } from '../utils/db';
import type { User } from '../models/users';

import NodeCache from 'node-cache';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export const userCache = new NodeCache({ stdTTL: 60 * 60, checkperiod: 120 });

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

    // Check if user has not exceeded their rate limit in the past 1 minute
    const currentDate = new Date();

    const recentActivities = await logCollection
      .find(
        {
          userId: cachedUser._id,
          timestamp: { $gte: currentDate.getTime() - 60 * 1000 }, // Last 1 minute
        },
        {
          projection: { _id: 1 },
          sort: { timestamp: -1 }, // Sort by timestamp in descending order
          limit: cachedUser.rateLimit,
        }
      )
      .toArray();

    if (recentActivities.length >= cachedUser.rateLimit) {
      return res.status(429).json({ message: 'Rate limit exceeded' });
    }

    // Attach user ID to the request object for later use
    (req as AuthenticatedRequest).userId = cachedUser._id.toString();

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Database query failed', error });
  }
};

export const apiKeyAuthMiddleware: RequestHandler = (req, res, next) => {
  apiKeyAuth(req as AuthenticatedRequest, res, next).catch(next); // Catch unhandled rejections
};
