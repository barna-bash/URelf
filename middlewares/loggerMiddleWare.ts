// A loggel middleware for logging requests and responses
import { type RequestHandler } from 'express';
import { type AuthenticatedRequest } from './apiKeyAuthMiddleware';
import { logCollection } from '../utils/db';
import { ObjectId } from 'mongodb';

import type { NewLogDto } from '../dtos/log';

const loggerMiddleware: RequestHandler = async (req, res, next) => {
  res.on('finish', async () => {
    const log: NewLogDto = {
      userId: (req as AuthenticatedRequest).userId ? new ObjectId((req as AuthenticatedRequest).userId!) : undefined, // Assuming user ID is in the request object
      urlId: new ObjectId(req.params?.id), // Assuming URL ID is in the request params
      customAlias: req.params?.customAlias,
      actionType: req.method,
      timestamp: new Date(),
      payload: req.body,
      ip: req.ip,
    };

    try {
      await logCollection.insertOne(log);
    } catch (error) {
      console.error('Failed to log request:', error);
    }
  });

  next();
};
export default loggerMiddleware;
