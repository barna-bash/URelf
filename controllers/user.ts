import type { NewUserDto } from '../dtos/user';
import { DEFAULT_RATE_LIMIT } from '../utils/constants';
import { userCollection } from '../utils/db';
import crypto from 'crypto';

export default class UserController {
  /**
   * Registers a user to generate an API key. Require username and/or email to be unique and helps identify the users by API key
   * @param {NewUserDto} user - The user data containing username and email
   * @returns {Promise<string>} - The generated API key
   */
  async registerUser(user: NewUserDto): Promise<string> {
    const existingUser = await userCollection.findOne({ $or: [{ userName: user.userName }, ...(user.email ? [{ email: user.email }] : [])] });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const apiKey = crypto.randomBytes(16).toString('hex'); // 32-char API key
    try {
      await userCollection.insertOne({
        userName: user.userName,
        email: user.email,
        apiKeys: [apiKey],
        createdAt: new Date(),
        rateLimit: DEFAULT_RATE_LIMIT,
      });
    } catch (error) {
      console.error('Error inserting user:', error);
      throw new Error('Failed to register user');
    }
    return apiKey;
  }
}
