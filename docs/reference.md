# Backend Configuration & Dependencies — Conduit Core

## 1. Internal Shared Dependencies
Core libraries utilized by the backend engine for orchestration, validation, and connectivity.

| Dependency | Purpose |
| :--- | :--- |
| **@nestjs/core** | Application framework foundation. |
| **@nestjs/mongoose** | MongoDB Object Modeling and connection management. |
| **kafkajs** | High-performance Kafka client for content enrichment flows. |
| **@grpc/grpc-js** | High-performance gRPC communication for storage services. |
| **passport-jwt** | Secure authentication strategy for identity management. |
| **joi** | Environment variable validation and schema enforcement. |
| **class-validator** | DTO validation for incoming API requests. |

---

## 2. External Service Inventory

| Service | Category | Integration Method | Role |
| :--- | :--- | :---: | :--- |
| **MongoDB** | Primary Database | Mongoose / TCP | Master & Tenant data storage. |
| **Elasticsearch** | Semantic Search | HTTP / REST | Semantic vector store and full-text index. |
| **Kafka** | Message Broker | kafkajs / TCP | Orchestration of content enrichment tasks. |
| **Ingestion Svc** | Semantic Search | HTTP / REST | Content vectorization and NLP analysis. |
| **Dictionary Svc** | Language Processing | HTTP / REST | Lexicon lookups & typography support. |
| **Storage Svc** | Media Persistence | gRPC | Decoupled image/asset management gateway. |
| **Unsplash** | Asset Library | HTTP / REST | Public image discovery and selection. |

---

## 3. Environment Variables Index (Conduit Core)

| Variable | Description | Required | Default |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | Environment mode (development/production) | No | `development` |
| `PORT` | API Server Port | No | `4000` |
| `MONGO_URI` | MongoDB Connection String | **Yes** | - |
| `MONGO_DB_NAME` | Master Database Name | No | `conduit_master` |
| `ELASTICSEARCH_NODE` | Elasticsearch connection host | **Yes** | - |
| `JWT_SECRET` | Secret key for token signing | **Yes** | - |
| `JWT_REFRESH_EXPIRY` | Refresh token duration | No | `7d` |
| `SHARED_API_KEY` | Key for internal microservice auth | **Yes** | - |
| `INGESTION_SVC_URL` | URL for Semantic Search service | **Yes** | - |
| `KAFKA_BROKERS` | CSV list of Kafka brokers | No | - |
| `KAFKA_INGEST_RESULTS_TOPIC` | Topic for enrichments | No | `ingestion_results` |
| `STORAGE_SERVICE_URL` | gRPC address for storage gateway | No | - |
| `UNSPLASH_ACCESS_KEY` | Unsplash API Access Key | No | - |
| `UNSPLASH_SECRET_KEY` | Unsplash API Secret | No | - |
