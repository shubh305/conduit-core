# Conduit Core

Conduit Core is the backend API for **Project Conduit**, a scalable multi-tenant publishing platform. It provides a robust, isolated data architecture for creators to manage their own blogs while participating in a global discovery network.

## Architecture

### Multi-Tenancy Strategy
Conduit Core implements a **Database-per-Tenant** strategy using MongoDB. This ensures strict data isolation and performance predictability.

- **`conduit_master`**: The central authority database storing tenant metadata, global configurations, and the aggregated **Global Feed**.
- **`conduit_tenant_{id}`**: Dynamic, isolated databases created for each tenant. These contain tenant-specific data including Users, Posts, Comments, and Site Settings.

### Core Components
- **Framework**: [NestJS](https://nestjs.com/) (Modular Architecture)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Auth**: Passport.js with JWT strategies, scoped at the tenant level.
- **Rich Text**: Built-in support for [Tiptap](https://tiptap.dev/) JSON content structures.

---

## Project Structure

```text
src/
├── auth/             # Authentication & Authorization logic (JWT, Guards)
├── common/           # Shared filters, interceptors, and tenant middleware
├── content/          # Core publishing: Posts, Comments, and Categories
├── database/         # Multi-tenant connection management & repository patterns
├── feed/             # Global discovery service and tag management
├── scheduler/        # Background tasks (e.g., publishing scheduled posts)
├── search/           # Multi-tenant search and suggestion engine
├── site-settings/    # Tenant-specific branding and configuration
├── storage/          # Media management (e.g., Unsplash integration)
├── tenants/          # Tenant lifecycle and management
└── users/            # User profiles and social features (follow/unfollow)
```

---

## Prerequisites

- **Node.js**: v18 or later
- **MongoDB**: A running instance (or Docker)
- **Unsplash API Key**: For integrated image search (Optional)

---

## Getting Started

### 1. Local Development
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Copy `.env.example` to `.env` and fill in your secrets:
   ```bash
   cp .env.example .env
   ```

3. **Run**
   ```bash
   npm run start:dev
   ```

### 2. Docker Deployment (Recommended)
You can run the backend using Docker Compose:
```bash
docker-compose up -d
```

---

## Features & Endpoints

### 1. Multi-Tenancy
Most requests require an `x-tenant-id` header to route queries to the correct database.
- **Tenant Context**: Automatic database switching based on the provided tenant ID.
- **Tenant Lifecycle**: `POST /tenants` to create a blog, `GET /tenants/check-slug` for availability checks.
- **Ownership**: `GET /tenants/me` to list all blogs owned by the authenticated user.

### 2. Advanced Publishing
- **Post Lifecycle**: Robust support for **Draft**, **Published**, and **Scheduled** statuses.
- **Reactive Interactions**: Fully reactive Like and Save systems; hierarchical comments with nested replies.
- **Reading Lists**: `POST /lists` – Create personal, curated collections of posts across the platform.
- **Tiptap Core**: Native support for structured rich-text content via JSON storage.

### 3. Media & Asset Management
- **Unsplash Integration**: `GET /media/unsplash/search` – Integrated high-quality photo search with automatic attribution tracking.
- **Isolated Storage**: `POST /media/upload` – Multipart file uploads scoped to tenant-specific storage buckets.

### 4. Search & Discovery
- **Global Discovery**: `GET /feed` – Aggregates published content from all tenants into a single, unified stream.
- **Unified Search**: `GET /search` – High-performance search across Posts, Users, and Tags.
- **Intelligent Suggestions**: `GET /search/suggest` – Type-ahead discovery engine for tags, users, and content.

### 5. Social & Personalization
- **Dynamic Profiles**: `GET /users/:username` – Detailed user profiles with social links and activity history.
- **Social Graph**: Tenant-scoped follow/unfollow system to foster creator-audience relationships.
- **Branding**: `PATCH /site-settings` – Per-tenant configuration for site headers, descriptions, and site-wide metadata.

---

## Testing

```bash
# Unit Tests
npm test

# E2E Tests
npm run test:e2e

# Linting
npm run lint
```

## API Documentation

Once the app is running, visit:
- **Swagger UI**: `http://localhost:4001/docs`
- **gRPC Support**: Service definitions available for internal microservices integration.