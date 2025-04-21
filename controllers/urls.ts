
import { urlCollection } from '../utils/db.ts';

import type { ObjectId } from "mongodb";
import type { Url } from "../models/urls.ts";
import type { NewUrlDto } from '../dtos/urls.ts';

class URLController {

  // Add a url  
  public async addUrls(url: NewUrlDto) {
    return await urlCollection.insertOne(url).then((result) => {
        return urlCollection.findOne({ _id: result.insertedId });
    });
  }

  // Fetch the latest ten urls
  public async getUrls() {
    return await urlCollection.find({}).sort({_id: -1}).limit(10).toArray();
  }

  // Fetch one url
  public async getUrlById(_id: ObjectId) {
    return await urlCollection.findOne({_id});
  }

  // Update the urls
  public async updateUrl(_id: ObjectId, url: Url) {
    return await urlCollection.updateOne({ _id }, { $set: url });
  }

  // Delete a single url
  public async deleteUrl(urlId: ObjectId) {
    return await urlCollection.deleteOne({ _id: urlId });
  }
}

export default URLController;