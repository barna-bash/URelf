import type { ObjectId } from 'mongodb';

export type Log = {
  _id: ObjectId;
  userId?: ObjectId;
  urlId?: ObjectId;
  customAlias?: string;
  actionType: Request['method'];
  timestamp: Date;
  payload: JSON;
  ip?: string;
};
