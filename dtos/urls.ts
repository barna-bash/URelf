import type { Url } from "../models/urls";

export type NewUrlDto = Omit<Url, "_id" | "createdAt" | "updatedAt" | "clicks">;