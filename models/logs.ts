import type { ObjectId } from 'mongodb';

export type Log = {
  _id: ObjectId;
  userId: ObjectId;
  urlId: ObjectId;
  actionType: 'click' | 'create' | 'update' | 'delete';
  timestamp: Date;
  payload: JSON;
  ip: string;
};
