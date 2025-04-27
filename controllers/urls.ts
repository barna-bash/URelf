import { urlCollection, userCollection } from '../utils/db.ts';

import { MongoError, ObjectId } from 'mongodb';
import type { Url } from '../models/urls.ts';
import type { NewUrlDto, UpdateUrlDto, UrlAnalyticsDto, UrlListItemDto } from '../dtos/url.ts';
import { DEFAULT_AUTO_GENERATED_ALIAS_LENGTH, DEFAULT_URL_EXPIRATION_DAYS } from '../utils/constants.ts';
import { nanoid } from 'nanoid';
import { cache } from '../middlewares/cacheMiddleware.ts';
import { AppError, NotFoundError, ConflictError, TooManyRequestsError, InternalServerError, UnauthorizedError } from '../utils/errors.ts';

class URLController {
  /**
   * Fetches all URLs created by user in the context
   *
   * @param userId - The userId of current user in the context
   * @returns A promise that resolves to an array of URL list items
   *
   * @example
   * ```typescript
   * const urlController = new URLController();
   * const urls = await urlController.getUrls('user123');
   * // Returns: [{ _id: '...', originalUrl: 'https://example.com', customAlias: 'example', ... }, ...]
   * ```
   */
  public async getUrls(userId: string): Promise<UrlListItemDto[]> {
    const result = await urlCollection.find({ userId }).sort({ createdAt: -1 }).project({ usage: 0, userId: 0 }).toArray();
    return result as UrlListItemDto[];
  }

  /**
   * Fetches a specific URL by ID for the authenticated user
   *
   * @param userId - The userId of current user in the context
   * @param options - Object containing the URL ID to fetch
   * @returns A promise that resolves to the URL object or null if not found
   * @throws Error if URL is not found
   *
   * @example
   * ```typescript
   * const urlController = new URLController();
   * const url = await urlController.getUrlById('user123', { urlId: '60d21b4667d0d8992e610c85' });
   * // Returns: { _id: '60d21b4667d0d8992e610c85', originalUrl: 'https://example.com', ... }
   * ```
   */
  public async getUrlById(userId: string, { urlId }: { urlId: string }): Promise<Url | null> {
    const urlEntry = await urlCollection.findOne<Url>({ _id: new ObjectId(urlId), userId: userId });

    if (!urlEntry) {
      throw new NotFoundError('URL not found');
    }

    return urlEntry;
  }

  /**
   * Retrieves the original URL by customAlias and records a new visit
   *
   * @param customAlias - The customAlias of the shortened URL
   * @returns A promise that resolves to the original URL string
   * @throws Error if URL is not found
   *
   * @example
   * ```typescript
   * const urlController = new URLController();
   * const originalUrl = await urlController.getRedirectUrl('example');
   * // Returns: 'https://example.com'
   * ```
   */
  public async getRedirectUrl(customAlias: string): Promise<string> {
    const cachedUrl = cache.get<{ redirectUrl: string }>(customAlias);
    if (cachedUrl) {
      console.log('Redirect url read from cache');
      this.incrementUrlUsage(customAlias);
      return cachedUrl.redirectUrl;
    }

    const urlEntry = await urlCollection.findOne<Url>({ customAlias, expiresAt: { $gte: new Date() } }, { projection: { _id: 0, originalUrl: 1 } });
    if (!urlEntry) {
      throw new NotFoundError('URL not found or expired');
    }
    this.incrementUrlUsage(customAlias);

    return urlEntry.originalUrl;
  }

  /**
   * Creates a new shortened URL
   *
   * @param userId - The userId of current user in the context
   * @param url - The URL data to create
   * @returns A promise that resolves to the created URL object
   * @throws Error if URL creation fails or if the URL already exists
   *
   * @example
   * ```typescript
   * const urlController = new URLController();
   * const newUrl = await urlController.addUrl('user123', {
   *   originalUrl: 'https://example.com',
   *   customAlias: 'example',
   *   description: 'Example website',
   *   expiresAt: '2024-12-31T23:59:59Z'
   * });
   * // Returns: { _id: '...', originalUrl: 'https://example.com', customAlias: 'example', ... }
   * ```
   */
  public async addUrl(userId: string, url: NewUrlDto): Promise<string> {
    const createdAt = new Date();
    try {
      const user = await userCollection.findOne({ _id: new ObjectId(userId) });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const urlsCreatedToday = await urlCollection.countDocuments({ userId, createdAt: { $gte: new Date(createdAt.setHours(0, 0, 0, 0)) } });

      if (user.rateLimit && user.rateLimit <= urlsCreatedToday) {
        throw new TooManyRequestsError('Max daily quota reached');
      }

      if (url.customAlias) {
        const existingUrl = await urlCollection.findOne({ customAlias: url.customAlias });
        if (existingUrl) {
          throw new ConflictError('URL with this alias already exists');
        }
      } else {
        url.customAlias = nanoid(DEFAULT_AUTO_GENERATED_ALIAS_LENGTH);
      }

      const expiresAt = url.expiresAt ? new Date(url.expiresAt).getTime() : new Date(createdAt.getTime() + DEFAULT_URL_EXPIRATION_DAYS * 24 * 60 * 60 * 1000).getTime();

      const result = await urlCollection.insertOne({
        ...url,
        createdAt,
        updatedAt: createdAt,
        userId,
        expiresAt: new Date(expiresAt),
      });

      if (!result.insertedId) {
        throw new InternalServerError('Failed to insert URL');
      }

      return url.customAlias;
    } catch (error) {
      if (error instanceof MongoError) {
        if (error.code === 11000) {
          throw new ConflictError('URL already exists');
        }
      }
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Failed to add URL');
    }
  }

  /**
   * Updates an existing URL by ID
   *
   * @param userId - The userId of current user in the context
   * @param urlToUpdate - Object containing the URL ID and fields to update
   * @returns A promise that resolves to the updated URL object
   * @throws Error if URL update fails or if the URL is not found
   *
   * @example
   * ```typescript
   * const urlController = new URLController();
   * const updatedUrl = await urlController.updateUrl('user123', {
   *   urlId: '60d21b4667d0d8992e610c85',
   *   originalUrl: 'https://updated-example.com',
   *   description: 'Updated example website'
   * });
   * // Returns: { _id: '60d21b4667d0d8992e610c85', originalUrl: 'https://updated-example.com', ... }
   * ```
   */
  public async updateUrl(userId: string, urlToUpdate: UpdateUrlDto): Promise<Url> {
    const { urlId, ...urlToUpdateParams } = urlToUpdate;

    try {
      if (urlToUpdateParams.customAlias) {
        const existingUrl = await urlCollection.findOne({ customAlias: urlToUpdateParams.customAlias });
        if (existingUrl) {
          throw new ConflictError('URL with this alias already exists');
        }
      }

      const urlUpdated = (await urlCollection.findOneAndUpdate(
        { _id: new ObjectId(urlId), userId },
        { $set: { ...urlToUpdateParams } },
        { returnDocument: 'after' }
      )) as Url | null;

      if (!urlUpdated) {
        throw new NotFoundError('URL not found');
      }

      return urlUpdated;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Failed to update URL');
    }
  }

  /**
   * Deletes a URL by ID
   *
   * @param userId - The userId of current user in the context
   * @param options - Object containing the URL ID to delete
   * @returns A promise that resolves to true if deletion was successful
   * @throws Error if URL deletion fails or if the URL is not found
   *
   * @example
   * ```typescript
   * const urlController = new URLController();
   * const result = await urlController.deleteUrl('user123', { urlId: '60d21b4667d0d8992e610c85' });
   * // Returns: true
   * ```
   */
  public async deleteUrl(userId: string, { urlId }: { urlId: string }): Promise<boolean> {
    try {
      const result = await urlCollection.findOneAndDelete({ _id: new ObjectId(urlId), userId });
      if (!result) {
        throw new NotFoundError('URL not found');
      }
      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Failed to delete URL');
    }
  }

  public async getUrlAnalytics(userId: string, { alias }: { alias: string }): Promise<UrlAnalyticsDto> {
    try {
      const urlUsage = await urlCollection
        .aggregate<{ usage: Date }>([{ $match: { customAlias: alias, userId } }, { $project: { usage: 1 } }, { $unwind: '$usage' }, { $sort: { usage: -1 } }, { $limit: 5 }])
        .toArray();

      if (!urlUsage.length) {
        throw new UnauthorizedError('Not allowed to access analytics for this URL');
      }

      return {
        totalRedirects: urlUsage.length,
        lastRedirects: urlUsage.map((item) => item.usage),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new InternalServerError('Failed to get URL analytics');
    }
  }

  private incrementUrlUsage(customAlias: string): void {
    // Add new visit timestamp to the usage array
    urlCollection.updateOne({ customAlias }, { $addToSet: { usage: new Date() } });
  }
}

export default URLController;
