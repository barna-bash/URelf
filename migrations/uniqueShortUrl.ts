import { client, urlCollection } from '../utils/db';

await urlCollection.createIndex(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { slug: { $type: 'string' } },
  }
);

console.log("✅ Created unique index on 'slug' (if not already present).");
await client.close();
