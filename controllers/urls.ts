import { urlCollection } from '../utils/db.ts';

import { MongoError, ObjectId } from 'mongodb';
import type { Url } from '../models/urls.ts';
import type { NewUrlDto, UpdateUrlDto, UrlListItemDto } from '../dtos/url.ts';

class URLController {
  // Fetch all urls which were created by the user on context
  public async getUrls(userId: string): Promise<UrlListItemDto[]> {
    const result = await urlCollection.find({ userId }).sort({ createdAt: -1 }).project({ usage: 0, userId: 0 }).toArray();
    return result as UrlListItemDto[];
  }

  // Fetch one url by id  - allow details for the user who created it
  public async getUrlById(userId: string, { urlId }: { urlId: string }): Promise<Url | null> {
    const urlEntry = await urlCollection.findOne<Url>({ _id: new ObjectId(urlId), userId: userId });

    return urlEntry;
  }

  // Fetch the original url by slug and redirect to it by the router
  public async getRedirectUrl(slug: string): Promise<string> {
    const urlEntry = await urlCollection.findOne<Url>({ slug }, { projection: { _id: 0, originalUrl: 1 } });
    if (!urlEntry) {
      throw new Error('URL not found');
    }

    // Add new visit timestamp to the usage array
    await urlCollection.updateOne({ slug }, { $addToSet: { usage: new Date() } });

    return urlEntry.originalUrl;
  }

  // Add a new shortened url
  public async addUrl(userId: string, url: NewUrlDto): Promise<Url> {
    const createdAt = new Date();
    try {
      const result = await urlCollection.insertOne({ ...url, createdAt, updatedAt: createdAt, userId });

      return { _id: result.insertedId, ...url, createdAt, updatedAt: createdAt, usage: [], userId: new ObjectId(userId) };
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

  // Update the url by given id
  public async updateUrl(userId: string, urlToUpdate: UpdateUrlDto): Promise<Url> {
    const { urlId, ...urlToUpdateParams } = urlToUpdate;

    try {
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

  // Delete a single url
  public async deleteUrl(userId: string, urlId: string): Promise<boolean> {
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
