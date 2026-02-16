# Conduit Core — Backend Engine

**Conduit** is an artisan publishing engine engineered for enterprise-grade scalability. It leverages a high-performance **Multi-Tenant Architecture** with strict database-per-tenant isolation, seamless subdomain-driven routing, and a **Fluidic UI** theme engine. Deeply integrated with NLP-powered semantic search and asynchronous enrichment pipelines, Conduit transforms digital publishing into a sophisticated, immersive experience where high-performance engineering meets premium aesthetic fluidity.

## Quick Start

1. **Setup Development Environment**:
   ```bash
   cp .env.example .env
   npm install
   ```
2. **Launch Services**:
   - Master API: `npm run start:dev`
   - Docker: `docker-compose up -d`

3. **Prerequisites**:
   - **Node.js**: v22 or later
   - **MongoDB**: A running instance (local or Atlas)
   - **Kafka**: Broker access (for search enrichment)
   - **Unsplash API Key**: (Optional, for image search)

4. **API Documentation**: Available at `http://localhost:4001/api/docs` (Swagger UI).

## Showcase-Level Architecture
Conduit is built with an enterprise-first mindset, featuring:
- **Scalable Tenancy**: Automated Database-per-tenant provisioning.
- **AI-Native Discovery**: Hybrid search combining Vector and Keyword indexing.
- **Decoupled Orchestration**: Kafka-driven enrichment and gRPC-based media handling.

## Technical Documentation Suite

The complete authoritative documentation is available in the `docs` directory:

| Document | Description |
| :--- | :--- |
| [**Architecture**](./docs/architecture.md) | High-level backend design, multi-tenancy, and diagrams. |
| [**Backend Deep Dive**](./docs/backend.md) | Modular structure, database switching, and service mapping. |
| [**Operations**](./docs/operations.md) | CI/CD pipelines, containerization, and scaling. |
| [**User Flows**](./docs/flows.md) | Visual data flow diagrams for provisioning and enrichment. |
| [**Configuration**](./docs/reference.md) | Environment variables and service reference. |

---

## Primary Capabilities
- **Dynamic Database Switching**: Real-time context resolution for thousands of tenants.
- **Semantic Feedback Loop**: Asynchronous NLP enrichment using Kafka, Elasticsearch and LLM (Shared services across octanebrew platform).
- **Smart Scheduling**: Integrated cron tasks for automated content visibility management.

---

## Testing & Quality
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