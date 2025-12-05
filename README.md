# PayVerse Backend

A distributed payments platform backend built with Node.js, Express, PostgreSQL, Redis, and WebSockets.

## 🏗️ Technical Decisions

- **PostgreSQL** - For ACID compliance and strong data integrity in financial transactions
- **WebSockets** - For real-time bi-directional transaction updates
- **Redis** - For distributed caching across multiple server instances

📄 **Full Trade-off Analysis:** https://docs.google.com/document/d/1WD4lgkRT2HhAQyxUZfD08WUeRF3LMQCx3gR40IiGOU4/edit?usp=sharing

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Setup

1. **Install dependencies**

```bash
npm install
```

2. **Environment variables** (`.env`)

```env
check .env.example
```

3. **Initialize database**

```bash
createdb payverse
psql -d payverse -f src/db/schema.sql
```

4. **Start services**

```bash
# Start Redis
redis-server

# Start server
npm run dev
```

---

## 📡 API Endpoints

### Users

- `POST /api/users` - Create user
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID

### Transactions

- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:userId` - Get user transactions

### WebSocket

- `ws://localhost:3001` - Real-time updates

  **Postman Collection:** [Import `postman_collection.json`]

---

## Tech Stack

Node.js • Express • TypeScript • PostgreSQL • Redis • WebSockets

---
