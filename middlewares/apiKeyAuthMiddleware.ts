import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { logCollection, userCollection } from '../utils/db';
import type { User } from '../models/users';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(401).json({ message: 'API key is missing' });
  }

  try {
    const user = await userCollection.findOne<User>({ apiKeys: apiKey });

    if (!user) {
      return res.status(403).json({ message: 'Invalid API key' });
    }

    // Check if user has not exceeded their rate limit in the past 1 minute

    const currentDate = new Date();

    const recentActivities = await logCollection
      .find(
        {
          userId: user._id,
          timestamp: { $gte: currentDate.getTime() - 60 * 1000 }, // Last 1 minute
        },
        {
          projection: { _id: 1 },
          sort: { timestamp: -1 }, // Sort by timestamp in descending order
          limit: user.rateLimit,
        }
      )
      .toArray();

    if (recentActivities.length >= user.rateLimit) {
      return res.status(429).json({ message: 'Rate limit exceeded' });
    }

    // Attach user ID to the request object for later use
    (req as AuthenticatedRequest).userId = user._id.toString();

    next();
  } catch (error) {
    return res.status(500).json({ message: 'Database query failed', error });
  }
};

export const apiKeyAuthMiddleware: RequestHandler = (req, res, next) => {
  apiKeyAuth(req as AuthenticatedRequest, res, next).catch(next); // Catch unhandled rejections
};
