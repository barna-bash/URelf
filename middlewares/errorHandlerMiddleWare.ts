import type { Request, Response } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (err: unknown, _req: Request, res: Response): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};
