import type { Url } from '../models/urls';
export type NewUrlDto = Omit<Url, '_id' | 'createdAt' | 'updatedAt' | 'usage' | 'userId' | 'expiresAt'> & {
  customAlias?: string;
  expiresAt?: Date;
};

export type UpdateUrlDto = Partial<NewUrlDto> & {
  urlId: string;
};

export type UrlListItemDto = Pick<Url, '_id' | 'originalUrl' | 'customAlias' | 'createdAt' | 'updatedAt'>;

export type UrlAnalyticsDto = { totalRedirects: number; lastRedirects: Date[] };
