# Use official Bun image
FROM oven/bun

# Set working directory
WORKDIR /app

ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI

# Copy files and install deps
COPY . .
RUN bun install

# Expose the port
EXPOSE 3000

# Start the server
CMD ["bun", "index.ts"]