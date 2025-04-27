export const DB_NAME = 'urelf';
export const DEFAULT_RATE_LIMIT = 60; // 60 requests per minute
export const DEFAULT_MAX_URL_PER_DAY = 10;

export const MAX_CUSTOM_ALIAS_LENGTH = 16; // 16 for custom short urls and restrict to 6 characters for better indexing performance and better user experience
export const DEFAULT_AUTO_GENERATED_ALIAS_LENGTH = 6; // Related article: https://medium.com/@sandeep4.verma/system-design-scalable-url-shortener-service-like-tinyurl-106f30f23a82

export const DEFAULT_URL_EXPIRATION_DAYS = 7;

export const DEFAULT_CACHE_TIME_REDIRECT_URL = 60 * 60; // 1 hour
