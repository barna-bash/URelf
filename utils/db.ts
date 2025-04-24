import { MongoClient } from 'mongodb';
import { DB_NAME } from './constants';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

const client: MongoClient = await MongoClient.connect(MONGODB_URI);

const urlCollection = client.db(DB_NAME).collection('urls');
const userCollection = client.db(DB_NAME).collection('users');
const logCollection = client.db(DB_NAME).collection('logs');

export { userCollection, urlCollection, logCollection, client };
