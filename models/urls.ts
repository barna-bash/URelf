import type { ObjectId } from 'mongodb';

export type Url = {
  _id: ObjectId;
  originalUrl: string;
  customAlias: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  usage: Date[];
  userId: ObjectId;
};
