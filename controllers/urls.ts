import { urlCollection } from '../utils/db.ts';

import { MongoError, ObjectId } from 'mongodb';
import type { Url } from '../models/urls.ts';
import type { NewUrlDto } from '../dtos/url.ts';

class URLController {
  // Fetch all urls which were created by the user on context
  public async getUrls({ userId }: { userId: string }): Promise<Url[]> {
    const result = await urlCollection.find<Url>({ userId }).sort({ createdAt: -1 }).toArray();
    return result;

    // .sort({ createdAt: -1 }).toArray();
  }

  // Fetch one url
  public async getUrlById(id: ObjectId): Promise<Url | null> {
    const urlEntry = await urlCollection.findOne<Url>({ _id: id });

    return urlEntry;
  }

  public async getRedirectUrl(shortUrl: string): Promise<string | null> {
    const urlEntry = await urlCollection.findOne<Url>({ from: shortUrl }, { projection: { _id: 0, to: 1 } });
    if (!urlEntry) {
      return null;
    }

    // Increment the clicks count assuming this url was fetched
    await urlCollection.updateOne({ from: shortUrl }, { $inc: { clicks: 1 } });

    return urlEntry?.slug || null;
  }

  // Add a url
  public async addUrl(userId: string, url: NewUrlDto): Promise<Url> {
    const createdAt = new Date();

    console.log(url);
    try {
      const result = await urlCollection.insertOne({ ...url, createdAt, updatedAt: createdAt, userId });
      console.log(result);

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

  // Update the urls
  public async updateUrl(id: ObjectId, url: Url) {
    return await urlCollection.updateOne({ id }, { $set: url });
  }

  // Delete a single url
  public async deleteUrl(id: ObjectId) {
    return await urlCollection.deleteOne({ _id: id });
  }
}

export default URLController;
