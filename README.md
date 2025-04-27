# URL Shortener API

This is a simple URL shortener API built with MongoDB and Express.js. It uses Bun for the server-side runtime.

## Features

- Basic CRUD operations for URL shortening
- Rate limit for requests
- API key based authentication
- Basic error handling
- MongoDB integration for persistent storage
- Docker support for containerization
- TypeScript for type safety
- ESLint for code quality

## Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime)
- [MongoDB](https://www.mongodb.com/) (Database)
- [Docker](https://www.docker.com/) (Optional, for containerization)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd urelf
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
Create a `.env` file in the root based on the `.env.example` file and replace the placeholder variables with your own values

## Usage

### Development

To start the development server with hot reloading:
```bash
bun run dev
```

### Production

To build and start the production server:
```bash
bun run build
bun run start
```

### Docker

To build and run the Docker container:
```bash
docker build -t urelf-backend .
docker run -p 3000:3000 urelf-backend
```

## API Documentation

The API documentation is available at `/api-docs` endpoint.
The documentation is generated from the `openapi.yaml` file.

### Authentication

Some endpoints are public and can be accessed without authentication, while others require API key-based authentication. Protected endpoints require a valid API key to be passed in the `Authorization` header.

Example authorization header:
```
Authorization: Api-Key <api-key>
```

### Endpoints

#### Public endpoints

##### Health check
  - `GET /health/server` - Check if the server is running
  - `GET /health/db` - Check if the database connection is set up and working

##### Registration
  - `POST /auth/register` - Register a new user and retrieve the API key

##### Rediredct to original URL
  - `GET /:shortUrl` - Redirect to the original URL - Response code 302 is returned if the short URL exists

#### Protected endpoints

##### URL shortening

  - `POST /urls` - Create a new short URL
  - `GET /urls` - Fetch all URLs created by the user
  - `GET /urls/:urlId` - Get detailed information about the URL (usage, description, etc.) - Only available for the user who created the short URL
  - `DELETE /urls/:urlId` - Delete a URL

### Authorization and logging

The API key is passed in the `Authorization` header and the related userId (if exists) is added to the request object by the `apiKeyAuthMiddleware` middleware.

All controllers require the userId to be passed as the first parameter.

#### Logging

The `loggerMiddleware` logs the request method, URL, and userId to the console.


## Project Structure

```
urelf/
├── controllers/     # Request handlers
├── models/          # Database models
├── routes/          # API routes
├── middlewares/     # Express middlewares
├── utils/           # Utility functions
├── dtos/            # Data Transfer Objects
├── migrations/      # Database migrations
├── dist/            # Compiled TypeScript files
└── index.ts         # Entry point
```

## Scripts

- `bun run dev` - Start development server
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run build` - Build TypeScript files
- `bun run migrate:unique-url` - Run URL uniqueness migration
- `bun run migrate:url-schema` - Run URL schema migration

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.