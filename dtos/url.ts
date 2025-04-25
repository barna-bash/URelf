import type { Url } from '../models/urls';
export type NewUrlDto = Omit<Url, '_id' | 'createdAt' | 'updatedAt' | 'usage' | 'userId'> & {
  slug?: string;
};

export type UpdateUrlDto = Partial<NewUrlDto> & {
  _id: string;
};

export type UrlListItemDto = Pick<Url, '_id' | 'originalUrl' | 'slug' | 'createdAt' | 'updatedAt'>;
