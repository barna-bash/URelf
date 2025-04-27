This file demonstrates the decisions I made for the project in the following areas:

- Data model
- Entity relationships
- Scalability
- Rate limiting
- Efficienty querying
  

## Data model

The initial data model consist of the 2 required collections `urls` and `users`. And for future use I added the `logs` collection.

### URL

The `urls` collection is used to store the shortened URLs and the related information to make it privately manageable by the user.

Short urls (aliases) are set up as unique and indexed to improve the performance of the queries.

The files under the `migrations` folder are used to create the indexes and the schema for the `urls` collection. This is run automatically when the app is initialized (after dependencies are installed).

```typescript
type Url = {
    _id: ObjectId;
  originalUrl: string;
  customAlias: string;  // Optional. Length based on related article: https://medium.com/@sandeep4.verma/system-design-scalable-url-shortener-service-like-tinyurl-106f30f23a82
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  usage: Date[];
  userId: ObjectId;
  expiresAt: Date;
}
```

### User

The `users` collection is used to store the users of the application. It uses passwordless authentication with simple api key based authentication for the private endpoints. One user can have multiple api keys (for future use).

Users may provide email addresses but I decided to not make it mandatory for better privacy.

```typescript
type User = {
  _id: ObjectId;
  email?: string;
  userName: string;
  apiKeys: string[];
  // Rate limit in requests per minute
  rateLimit: number;
  createdAt?: Date;
}
```

### Log

The `logs` collection is used to store the logs of the application. The `loggerMiddleware` inserts a new log entry for each request including the request method, params, url and body as payload. This is used for future analytics.

```typescript
type Log = {
  _id: ObjectId;
  userId?: ObjectId;
  urlId?: ObjectId;
  customAlias?: string;
  actionType: Request['method'];
  timestamp: Date;
  payload: JSON;
  ip?: string;
};

``` 

## Entity relationships

`urls`,`logs` and `users` are related to each other. Since the app is based on noSQL database, I decided to use the reference to the `_id` of the related entities. Maybe the `users` collection will be moved to a different relational database in the future.



Many thanks to the following articles and tutorials which helped me to understand and optimize the data the context of this project: 

- https://medium.com/@sandeep4.verma/system-design-scalable-url-shortener-service-like-tinyurl-106f30f23a82
- https://www.youtube.com/watch?v=zgIyzEEXfiA&ab_channel=CodeTour




## Scalability

The app is designed to be scalable. The `urls` collection is indexed to improve the performance of the queries. The `logs` collection is used to store the logs of the application. The `users` collection is used to store the users of the application. 

### Containerization

The app is containerized using Docker. The Dockerfile is located in the root of the project. Also the Dockerfile is used to deploy the app to production (currently hosted on Digital Ocean).

Kubernetes or other container orchestration tools could be used to scale the app (currently not needed but could be useful for future use in larger scale).




## Rate limiting

As per the original requirement user daily quota is (10 urls can be created per day) set up. The quota is checked for each request in the controller layer.

### Extended rate limiting

To avoid abuse of the service, I added a rate limiting mechanism. The rate limit is set to 60 requests per minute per user. The rate limit is checked for each request in a middleware.

### IP rate limiting

To avoid overusage or failure of the service due to a single IP address the IP address based rate limiting is being implemneted (will be finished in the future).



## Efficiency querying
For the best performance query results are being cached by the cache middleware. Each GET requests creates a cache entry which is being used for 1 minute by default (excpet the `redirectUrl` cache which is being used for 1 hour).

The mutation endpoints invalidate the cache entries for the related url (PUT,DELETE).

 ***Caching mechanism should be improved and refactored in the future (e.g. Redis)***









