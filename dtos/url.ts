import type { Url } from '../models/urls';
export type NewUrlDto = Omit<Url, '_id' | 'createdAt' | 'updatedAt' | 'usage' | 'userId'> & {
  customAlias?: string;
};

export type UpdateUrlDto = Partial<NewUrlDto> & {
  urlId: string;
};

export type UrlListItemDto = Pick<Url, '_id' | 'originalUrl' | 'customAlias' | 'createdAt' | 'updatedAt'>;
