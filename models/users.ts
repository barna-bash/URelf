import type { ObjectId } from 'mongodb';

export type User = {
  _id: ObjectId;
  email?: string;
  userName: string;
  apiKeys: string[];
  // Rate limit in requests per minute
  rateLimit: number;
  createdAt?: Date;
};
