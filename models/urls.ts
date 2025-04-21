import type { ObjectId } from "mongodb";

export interface Url {
  _id?: ObjectId,
  from: string,
  to: string,
  description?: string,
  createdAt?: Date,
  updatedAt?: Date,
  clicks?: number,
}