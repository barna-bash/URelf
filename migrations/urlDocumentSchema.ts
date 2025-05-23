import { DB_NAME, MAX_CUSTOM_ALIAS_LENGTH } from '../utils/constants';
import { client } from '../utils/db';

await client.db(DB_NAME).command({
  collMod: 'urls',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['originalUrl', 'userId', 'createdAt', 'updatedAt'],
      properties: {
        originalUrl: {
          bsonType: 'string',
          description: 'Required string',
        },
        customAlias: {
          bsonType: 'string',
          description: 'Optional string',
          maxLength: MAX_CUSTOM_ALIAS_LENGTH,
        },
        createdAt: {
          bsonType: 'date',
          description: 'must be a date',
        },
        updatedAt: {
          bsonType: 'date',
          description: 'must be a date',
        },
        description: {
          bsonType: 'string',
          description: 'Optional string',
        },
        userId: {
          bsonType: 'string',
          description: 'Required string',
        },
      },
    },
  },
});

console.log('✅ URL document schema updated successfully');
await client.close();
