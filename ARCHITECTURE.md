This document describes the architecture of the project from scalability and efficiency perspective. It answers the following questions:

- How the system can handle high concurrency.
- Approaches to distributed rate-limiting.
- Scaling queue-based processing for high-throughput analytics.
- Strategies for ensuring data consistency in a distributed environment.
- API key security best practices.



## High Concurrency Handling

The system is designed to handle high concurrency through several mechanisms:

1. **Indexed Collections**: The `urls` collection is indexed on the `customAlias` field to ensure fast lookups, which is critical for the redirect functionality that experiences the highest traffic.

2. **Caching Layer**: A middleware-based caching system reduces database load by storing frequently accessed data in memory. GET requests are cached for 1 minute by default, with redirect URL caching extended to 1 hour for optimal performance.

3. **Containerization**: The application is containerized using Docker, allowing for horizontal scaling by deploying multiple instances behind a load balancer.

4. **Stateless Design**: The API follows a stateless design pattern, enabling any instance to handle any request without requiring session affinity.

* **Future Improvements**: I mention in the `ARCHITECTURE.md` file that the caching mechanism should be improved with a distributed cache like Redis, which would further enhance concurrency handling in a multi-instance deployment.

## Distributed Rate-Limiting

The system implements multiple layers of rate limiting:

1. **User-Based Quota**: A daily quota of 10 URL creations per user is enforced at the controller level.

2. **Request Rate Limiting**: Users are limited to 60 requests per minute, implemented via middleware.

3. **IP-Based Rate Limiting**: An IP address-based rate limiting mechanism is being implemented to prevent service abuse from individual IP addresses.

For a truly distributed environment, these rate-limiting mechanisms would need to be centralized using:

- A distributed cache like Redis to track rate limit counters across instances
  - Currently the per-minute rate limiting is based on the log entries which all are heavy loaded on the database.  
- Consistent hashing for IP-based rate limiting to distribute the load

## Queue-Based Processing for Analytics

While not fully implemented yet, the system has a foundation for analytics through the `logs` collection:

1. **Logging Middleware**: All requests are logged with detailed information including user ID, URL ID, action type, timestamp, payload, and IP address.

2. **Scalable Processing**: For high-throughput analytics, the architecture could be extended with:
   - Worker processes to consume from the queue and perform analytics
   - Batch processing for efficiency
   - 3rd party analyics/logging services such as Sentry.io

This approach would decouple the logging from the main application flow, ensuring that analytics processing doesn't impact the core URL shortening functionality.

## Data Consistency in a Distributed Environment

The current architecture uses MongoDB, a NoSQL database, with references between collections. To ensure data consistency in a distributed environment:

1. **Document References**: The system uses ObjectId references between `urls`, `logs`, and `users` collections.

2. **Atomic Operations**: MongoDB's atomic operations are used in some controllers but should be used in more areas to ensure consistency. (The same would applies to relational databases to use transactions)

3. **Cache Invalidation**: The system invalidates cache entries after mutation operations (PUT, DELETE) to prevent stale data.

For stronger consistency guarantees in a distributed setup, additional strategies could include:

- Implementing optimistic concurrency control
- Using transactions for operations that span multiple documents

## API Key Security Best Practices

The system uses API keys for authentication. Security best practices implemented or recommended include:

1. **Multiple API Keys**: Users can have multiple API keys, allowing for key rotation and revocation without service disruption. Originally I planned to attach differene rate limits and permessions to each API keys (will be added in the future).

2. **Passwordless Authentication**: The system uses API keys rather than passwords for easier access.

3. **Rate Limiting**: ~~API keys~~ **Users** are subject to rate limiting, preventing abuse even with valid credentials.

Additional security measures that could be implemented:

- Key hashing in storage rather than storing in plaintext
- Implementing JWT or OAuth2 for more advanced authentication scenarios
- Implement functional authorization based on the user roles
- Geo-location based access control
