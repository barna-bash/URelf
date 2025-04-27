import { urlCollection } from '../utils/db.ts';

import { MongoError, ObjectId } from 'mongodb';
import type { Url } from '../models/urls.ts';
import type { NewUrlDto, UpdateUrlDto, UrlListItemDto } from '../dtos/url.ts';
import { DEFAULT_AUTO_GENERATED_ALIAS_LENGTH } from '../utils/constants.ts';
import { nanoid } from 'nanoid';

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
      throw new Error('URL not found');
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
    const urlEntry = await urlCollection.findOne<Url>({ customAlias }, { projection: { _id: 0, originalUrl: 1 } });
    if (!urlEntry) {
      throw new Error('URL not found');
    }

    // Add new visit timestamp to the usage array
    await urlCollection.updateOne({ customAlias }, { $addToSet: { usage: new Date() } });

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
   *   description: 'Example website'
   * });
   * // Returns: { _id: '...', originalUrl: 'https://example.com', customAlias: 'example', ... }
   * ```
   */
  public async addUrl(userId: string, url: NewUrlDto): Promise<string> {
    const createdAt = new Date();
    try {
      if (url.customAlias) {
        const existingUrl = await urlCollection.findOne({ customAlias: url.customAlias });
        if (existingUrl) {
          throw new Error('URL with this alias already exists');
        }
      } else {
        url.customAlias = nanoid(DEFAULT_AUTO_GENERATED_ALIAS_LENGTH);
      }

      const result = await urlCollection.insertOne({
        ...url,
        createdAt,
        updatedAt: createdAt,
        userId,
      });

      if (!result.insertedId) {
        throw new Error('Failed to insert URL');
      }

      return url.customAlias;
    } catch (error) {
      if (error instanceof MongoError) {
        if (error.code === 11000) {
          // Duplicate key error
          console.log('Duplicate key error:', error.message);
          throw new Error('URL already exists');
        }
      }
      console.log(error);
      throw new Error('Failed to add URL');
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
          throw new Error('URL with this alias already exists');
        }
      }

      const urlUpdated = (await urlCollection.findOneAndUpdate(
        { _id: new ObjectId(urlId), userId },
        { $set: { ...urlToUpdateParams } },
        { returnDocument: 'after' }
      )) as Url | null;

      if (!urlUpdated) {
        throw new Error('URL not found');
      }

      return urlUpdated;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to update URL');
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
        throw new Error('URL not found');
      }
      return true;
    } catch (error) {
      console.log(error);
      throw new Error('Failed to delete URL');
    }
  }
}

export default URLController;
