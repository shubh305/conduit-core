FROM node:22-bookworm-slim AS builder

# Set workspace
WORKDIR /usr/src/app

# Patch OS vulnerabilities
RUN apt-get update && apt-get upgrade -y

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Runtime Stage
FROM node:22.13.1-alpine3.21

# Set workspace
WORKDIR /usr/src/app

# Patch OS vulnerabilities in runtime image
RUN apk update && apk upgrade --no-cache

# Create a non-root user for security
RUN addgroup -S conduit && adduser -S conduit -G conduit

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts from builder
COPY --from=builder /usr/src/app/dist ./dist

# Change ownership to the non-root user
RUN chown -R conduit:conduit /usr/src/app

# Switch to non-root user
USER conduit

EXPOSE 4001

CMD ["node", "dist/main"]
