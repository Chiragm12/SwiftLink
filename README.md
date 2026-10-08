# 🚀 SwiftLink — Distributed URL Shortener

A high-performance URL shortening platform built with **Node.js, Express, PostgreSQL, Redis, React, Docker, and k6**.

SwiftLink is designed for **read-heavy workloads**, where redirect requests significantly outnumber write operations. The system uses a **cache-first architecture**, asynchronous analytics logging, and Dockerized deployment to deliver low-latency redirects at scale.

---

## ✨ Key Features

* 🔗 Short URL generation with Base62 keys
* ⚡ Redis-powered cache-first redirects
* 🗄️ PostgreSQL persistence layer
* 📊 Click analytics and traffic insights
* 🚀 Non-blocking asynchronous click logging
* 📈 React dashboard with charts and summaries
* 🧪 Performance benchmarking using k6
* 🛡️ Rate limiting and cache stampede protection

---

## 📊 Performance Results

Load tested using **k6** with up to **500 concurrent virtual users**.

| Metric          | Result         |
| --------------- | -------------- |
| Requests Served | 107,000+       |
| Throughput      | ~1,644 req/sec |
| Error Rate      | 0.00%          |
| Average Latency | ~19 ms         |
| Median Latency  | ~7 ms          |
| p95 Latency     | ~51 ms         |

---

## 🏗️ System Architecture

```text
                ┌──────────────┐
                │   Client     │
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │ Express API  │
                └──────┬───────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
    ┌──────────┐              ┌───────────┐
    │  Redis   │              │ PostgreSQL│
    │  Cache   │              │ Persistence
    └──────────┘              └───────────┘
          │                         │
          └────────────┬────────────┘
                       ▼
                Analytics Engine
                       │
                       ▼
                React Dashboard
```

---

## 🛠️ Tech Stack

| Layer          | Technology            |
| -------------- | --------------------- |
| Frontend       | React, Vite, Recharts |
| Backend        | Node.js, Express      |
| Cache          | Redis                 |
| Database       | PostgreSQL            |
| Infrastructure | Docker Compose        |
| Testing        | k6              |

---

## 📂 Project Structure

```text
SwiftLink/
├── api/
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── cache.js
│   │   ├── routes/
│   │   │   ├── links.js
│   │   │   └── analytics.js
│   │   └── utils/
│   │       ├── keygen.js
│   │       └── analytics.js
│   ├── Dockerfile
│   ├── package.json
│   └── .env
│
├── dashboard/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
├── loadtest.js
└── README.md
```

---

## 🔄 Request Flow

### Link Creation

1. Client submits a long URL.
2. API generates a unique short key.
3. Mapping is stored in PostgreSQL.
4. Redis cache is pre-warmed.
5. Short URL is returned.

### Redirect Request

1. User requests a short URL.
2. API checks Redis cache.
3. Cache hit → Immediate redirect.
4. Cache miss → Query PostgreSQL.
5. Cache is updated.
6. Redirect returned.
7. Click analytics logged asynchronously.

---

## 🔌 API Endpoints

### Create Short Link

```http
POST /api/links
```

Request:

```json
{
  "longUrl": "https://google.com"
}
```

### Redirect

```http
GET /api/links/:shortKey/redirect
```

### Analytics

```http
GET /api/analytics/:shortKey
```

### Analytics Overview

```http
GET /api/analytics
```

---

## 🚀 Local Setup

### Start Services

```bash
docker compose up --build
```

### Verify Services

```bash
docker compose ps
```

### Health Check

```bash
curl http://localhost:3000/health
```

---

## 🧪 Load Testing

Update `loadtest.js` with a valid short key:

```js
const res = http.get(
  'http://api:3000/api/links/YOUR_SHORT_KEY/redirect',
  {
    redirects: 0,
  }
);
```

Run:

```bash
docker compose run --rm k6
```

---

## 🎯 Engineering Decisions

### Why Redis?

Redirects are significantly more frequent than link creation requests. Redis provides in-memory lookups with sub-millisecond access times, reducing PostgreSQL load.

### Why Async Analytics?

Redirect speed is the highest priority. Analytics writes occur asynchronously so users do not wait for database inserts.

### Why Cache Stampede Protection?

Multiple cache misses for the same key can overwhelm PostgreSQL. A Redis lock ensures only one request fetches from the database while others wait for the cache to be populated.

---

## 📌 Resume Highlights

* Designed and implemented a distributed URL shortener using Redis and PostgreSQL.
* Achieved ~1,600 requests/sec under 500 concurrent users.
* Implemented cache-first redirect architecture with cache stampede protection.
* Built analytics tracking and dashboard visualization.
* Containerized the entire stack using Docker Compose.
* Performed performance benchmarking using k6.

---

## 📜 License

MIT License
