import { client, urlCollection } from '../utils/db';

await urlCollection.createIndex(
  { customAlias: 1 },
  {
    unique: true,
    partialFilterExpression: { customAlias: { $type: 'string' } },
  }
);

console.log("✅ Created unique index on 'customAlias' (if not already present).");
await client.close();
