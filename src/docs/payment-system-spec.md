## PAYMENT PLATFORM – TECHNICAL SPECIFICATION (BUILD ORDER)

## 1. System overview

This document describes the architecture and technical design for a secure, scalable payment processing platform.
The platform enables users to:

- initiate payments
- process transactions securely
- track payment status
- receive real-time updates
  The system prioritizes:
- security
- reliability
- idempotent transactions
- horizontal scalability

---

## 2. DATABASE LAYER

The platform uses a hybrid database architecture.

### 2.1 SQL Database

Relational databases store financial data.
Example tables: users, transactions, payments, accounts

### Requirements:

- ACID compliance :
  - Atomicity → All or nothing
  - Consistency → Database rules stay valid
  - Isolation → Transactions don't interfere
  - Durability → Data never disappears
- strong consistency
- transactional guarantees
  - Why SQL: Financial operations must be atomic and reliable.

    Financial transactions must follow ACID guarantees.

### Payment flow:

1. Begin transaction
2. Verify account balance
3. Debit sender
4. Credit receiver
5. Record transaction
6. Commit transaction
   If any step fails, the system performs a rollback.

---

## 3. Security layer

Security is the highest priority in a payment system.

### 3.1 HTTPS Encryption

All communication between client and server must use HTTPS.
Benefits:

- encrypts sensitive data
- prevents man-in-the-middle attacks
- protects authentication tokens

### 3.2 Authentication

Authentication will be implemented using JSON Web Tokens (JWT).
JWT Structure — A JWT contains three parts: Header, Payload, Signature.
Token Strategy — Two token types will be used:

### Access Token:

- returned in the response body
- short lifespan
- used for authenticated requests
  Refresh Token:
- stored in HttpOnly cookies
- used to generate new access tokens
- longer lifespan

### Refresh Token Security — Refresh tokens must include:

- HttpOnly cookie
- Secure flag
- SameSite protection
  This prevents XSS attacks, CSRF attacks, and token theft.
  Security Stack:

  ```
  HTTPS
   ↓
  JWT Authentication
   ↓
  Refresh Tokens (HttpOnly Cookies)
  ```

---

## 4. Role-Based Access Control (RBAC)

The platform implements Role-Based Access Control to manage permissions across three user types: Customer, Support Agent, and Admin. The user role is embedded in the JWT payload and validated at the API Gateway before any request reaches backe

### 4.1 Role Definitions

| Role          | Permissions                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Customer      | Start chats, send messages, lodge complaints, view own transaction history, check own complaint status                       |
| Support Agent | View assigned chat sessions, respond to customers, update complaint status (Open → In Review → Resolved)                     |
| Admin         | View all chats and complaints, assign agents, close/escalate tickets, manage agent accounts, access dashboards and analytics |

### 4.2 JWT Role Integration

The JWT payload must include a role field on all authenticated requests:

```json
{ "userId": "uuid", "role": "customer" | "agent" | "admin", "exp": 1234567890 }
```

Every support endpoint checks the role claim before allowing access. Unauthorized role access returns HTTP 403 Forbidden.

## 5. CORE BACKEND DESIGN

### 5.1 UUID for Identifiers

All critical records use UUIDs including payment IDs, transaction IDs, order IDs, user IDs, chat session IDs, and complaint ticket IDs.

### Benefits:

- globally unique
- safe for distributed systems
- prevents ID collisions

### 5.2 Idempotency

Payment requests must be idempotent.
Problem — A network glitch may cause duplicate requests. Without idempotency, two payments could be processed for a single user action.
Example: User clicks Pay → Network delay → User clicks Pay again → Without idempotency: Two payments processed ❌
Solution — Use Idempotency Keys.

### Workflow:

- Client sends request with Idempotency-Key
- Server checks Redis for existing key
- If key exists → return previous result (no duplicate charge)
- If key does not exist → process payment and store result
  Benefits: prevents duplicate payments, ensures transaction safety.

### 5.3 Payment API Endpoints

These are the core APIs the platform exposes:
Endpoint Method Description

| Endpoint          | Method | Description                        |
| ----------------- | ------ | ---------------------------------- |
| /payments/send    | POST   | Initiate a payment to another user |
| /payments/receive | POST   | Receive/accept an incoming payment |
| /payments/:id     | GET    | Get status of a specific payment   |
| /payments/history | GET    | List all transactions for a user   |
| /accounts/balance | GET    | Check account balance              |
| /auth/register    | POST   | Register a new user                |
| /auth/login       | POST   | Login and receive tokens           |
| /auth/refresh     | POST   | Refresh access token               |

## 6. PERFORMANCE LAYER — REDIS CACHE

Redis will be used to reduce database load.
Use cases:

- caching frequently accessed data
- session storage
- rate limiting counters : Redis tracks how many requests each user makes within a time window.
- idempotency key storage
- Agent availabilty tracking (for live chat routing)

Rate Limiting Flow:

```
User makes request
        ↓
Redis checks counter for that user
        ↓
Counter < 100 → allow request → increment counter
        ↓
Counter = 100 → block request → return 429 Too Many Requests
        ↓
After 60 seconds → counter resets
```

- Cache Flow

```

API Request
↓
Redis Cache
↓
Database (if cache miss)

```

Benefits: faster response time, reduced database load.

---

## 7. API PROTECTION LAYER

### 7.1 Rate Limiting

Rate limiting prevents API abuse.
Example policy: 100 requests per minute per user
Protects against: bots, brute force attacks, API abuse

- Implementation: Redis-based rate limiting

### 7.2 API Gateway

An API Gateway will sit in front of backend services.
Responsibilities:

- authentication validation (JWT + RBAC role check)
- rate limiting enforcement
- request routing to correct microservice
- logging and monitoring

```
Client
  ↓
API Gateway
  ↓
Backend Services
```

---

## 8. ASYNCHRONOUS PROCESSING - RABBITMQ

Payment processing avoids blocking requests. RabbitMQ handles all background jobs including payments, chat message delivery, and complaint notifications.-Technology: RabbitMQ

### 8.1 Payment Processing Flow:

```

User → Payment Request
↓
API Server → publishes to RabbitMq
↓
Payment Processor Service consumes
↓
Database
↓
Notification Service

```

Benefits: retries, reliability, failure isolation, background processing.

### 8.2 Live Chat Message Flow (Agent Online)

```
Customer sends message
  ↓
WebSocket Server receives it
  ↓
Published to RabbitMQ → 'chat.messages' exchange
  ↓
Chat Processor Service consumes
  ↓
Saves to DB (chat_messages table)
  ↓
Routes to Agent's WebSocket connection
  ↓
Agent sees message in real time → replies via same flow
```

### 8.3 Offline Handling — No Agent Available

When no support agent is online, the system handles messages durably without loss:

```

Customer sends message
  ↓
WebSocket Server receives it
  ↓
Published to RabbitMQ → 'chat.messages' exchange
  ↓
Chat Processor checks agent availability (Redis)
  ↓
No agent online → message saved to DB (status = 'pending')
  ↓
RabbitMQ holds message in 'offline.queue' (durable — survives restarts)
  ↓
Customer receives auto-reply:
  'No agents available. We will respond within 24 hours.'
  ↓
When agent comes online → Redis updates availability flag
  ↓
RabbitMQ delivers pending messages from 'offline.queue'
  ↓
Agent sees full conversation history
  ↓
Agent replies → SSE pushes notification to customer
```

Key property: The 'offline.queue' is durable, meaning messages survive server restarts and are never lost even if the system goes down between the customer sending and the agent coming online.

### 8.4 Complaint Notification Flow

```
Customer lodges complaint → POST /support/complaints
  ↓
API saves complaint (status = 'Open')
  ↓
Published to RabbitMQ → 'complaints' exchange
  ↓
Notification Service consumes event
  ↓
SSE pushes to customer: 'Complaint #UUID received'
  ↓
Admin dashboard receives alert: 'New complaint assigned'
  ↓
Agent updates status → PATCH /support/complaints/:id
  ↓
RabbitMQ → Notification Service
  ↓
SSE pushes to customer: 'Your complaint is now In Review'
```

---

## 9. Real-Time Updates

Clients receive live updates via Server-Sent Events (SSE) for payment events, and WebSockets for bidirectional chat communication.

| Technology               | Direction            | Use Case                                                      |
| ------------------------ | -------------------- | ------------------------------------------------------------- |
| SSE (Server-Sent Events) | Server → Client only | Payment status, complaint status updates, agent notifications |
| WebSockets               | Bidirectional        | Live chat between customer and support agent                  |

SSE Events:

- Payment status changes
- Transaction completion or failure
- Complaint status updates (Open → In Review → Resolved)
- New complaint assigned (agent/admin)

---

## 10. Customer Support Features

### 10.1 Inbuilt Live Chat

The platform provides a real-time chat widget enabling customers to communicate with support agents directly within the application. No redirect to external services.

Technology Stack:

- WebSockets — bidirectional real-time messaging
- RabbitMQ — message queuing, offline handling, routing
- Redis — agent availability tracking, active session management

Components:

- Customer-facing chat widget (floating button, all pages)
- Agent dashboard — web interface for agents to read and respond
- Queue system — routes incoming chats to available agents via RabbitMQ
- Offline fallback — durable queue stores messages when no agents online
- Auto-reply — customer notified when agents are unavailable

### New Database Tables:

| Table          | Key Fields                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| chat_sessions  | session_id (UUID), user_id, agent_id, status (active/closed), created_at, closed_at                   |
| chat_messages  | message_id (UUID), session_id, sender_id, sender_role, content, status (pending/delivered), timestamp |
| support_agents | agent_id (UUID), user_id, name, availability_status (online/offline/busy), assigned_chats             |

### Live Chat API Endpoints

| Endpoint                          | Method | Role            | Description                        |
| --------------------------------- | ------ | --------------- | ---------------------------------- |
| /support/chat/start               | POST   | Customer        | Start a new chat session           |
| /support/chat/:sessionId/messages | GET    | Customer, Agent | Fetch full chat history            |
| /support/chat/:sessionId/send     | POST   | Customer, Agent | Send a message in session          |
| /support/chat/:sessionId/close    | PATCH  | Agent, Admin    | Close/end a chat session           |
| /support/chat/queue               | GET    | Agent, Admin    | View pending/unassigned chats      |
| /support/agents/availability      | PATCH  | Agent           | Update agent online/offline status |

### 10.2 Complaint & Dispute System

Users can lodge complaints for issues such as failed transactions, incorrect debits, delayed payments, or unauthorized activity. Each complaint is tracked with a unique ticket and real-time status updates.

Complaint Lifecycle:
Open → In Review → Resolved → Closed

System Behaviour:
• Each complaint is assigned a unique UUID ticket number
• System auto-links the relevant transaction record from user history
• Status changes trigger SSE notifications to the customer in real time
• Admin dashboard receives alerts on new complaint submissions

Complaint Types (Issue Categories):
• Failed transaction
• Wrong amount debited
• Delayed payment
• Unauthorized transaction
• Refund request
• Other

### New Database Table — complaints:

| Field          | Type      | Description                                                              |
| -------------- | --------- | ------------------------------------------------------------------------ |
| complaint_id   | UUID      | Unique ticket identifier                                                 |
| user_id        | UUID      | Customer who lodged the complaint                                        |
| transaction_id | UUID      | Auto-linked transaction record                                           |
| issue_type     | ENUM      | Category: failed_txn, wrong_amount, delayed, unauthorized, refund, other |
| description    | TEXT      | Customer's description of the issue                                      |
| status         | ENUM      | open/ in review,/resolved/closed                                         |
| created_at     | TIMESTAMP | When complaint was lodged                                                |
| updated_at     | TIMESTAMP | Last status change time                                                  |

### Complaint API Endpoints

| Endpoint                       | Method | Role                   | Description                          |
| ------------------------------ | ------ | ---------------------- | ------------------------------------ |
| /support/complaints            | POST   | Customer               | Lodge a new complaint                |
| /support/complaints/:id        | GET    | Customer, Agent, Admin | Get complaint details and status     |
| /support/complaints/history    | GET    | Customer               | List all complaints for the user     |
| /support/complaints/:id/update | PATCH  | Agent, Admin           | Update complaint status              |
| /support/complaints/all        | GET    | Admin                  | View all complaints across all users |
| /support/complaints/:id/assign | PATCH  | Admin                  | Assign complaint to a specific agent |

## 11. OBSERVABILITY & LOGGING

Reliable payment systems must provide structured logging to monitor transactions, detect failures, and assist debugging.
The platform will use Pino for high-performance logging.
Reasons for using Pino:

- extremely fast, structured JSON logs, production ready, integrates easily with monitoring tools.

### 11.1 Logging Strategy

Logs will be generated at multiple system layers:

- API Layer — Log incoming requests (endpoint accessed, request ID, user ID, response time).

- Payment Processing — Critical payment events must be logged (payment initiated, processed, failed, duplicate prevented).

- Error Logging — System errors must be logged for investigation.

### 11.2 REQUEST CORRELATION

- Each request should have a Request ID that travels across all services so engineers can trace a payment end to end.

### 11.3 Log Levels

| Level | Purpose                                                                             |
| ----- | ----------------------------------------------------------------------------------- |
| info  | normal operations - request,payments, cha messages sent                             |
| warn  | Unusual but recoverable — rate limit hit, agent unavailable, offline message queued |
| error | Failures — payment failure, DB timeout, WebSocket disconnect                        |
| debug | development debugging                                                               |

### 11.4 Log Storage

- Application Servers → Pino Logs (JSON) → Log Aggregation → Monitoring Dashboard
  Examples of log platforms: Elastic Stack, Grafana, Datadog.

### 11.5 Security Logging

Sensitive events must be logged: failed login attempts, suspicious payment activity, rate limit violations, authentication failures.unauthorized role access (403 events).

### 11.6 Performance Metrics

Logs will track: request latency, payment processing time, queue processing delays, database query performance.

---

## 12. SCALABILITY LAYER

### 12.1 Docker

The application will be containerized using Docker.

- Benefits: consistent environments, easier deployment, portability.

### 12.2 Kubernetes

Kubernetes will orchestrate containers.

- Responsibilities: container scheduling, auto-scaling, service discovery, automatic restarts.

### 12.3 Load Balancing

```

Users → Load Balancer → Multiple Application Servers

```

Benefits: high availability, improved performance, fault tolerance.

---

## 13. DevOps & CI/CD

Continuous Integration and Deployment will automate releases.

```

Developer pushes code
↓
Automated tests run
↓
Docker image built
↓
Image pushed to registry
↓
Deployment to Kubernetes

```

Benefits: faster deployments, automated testing, reliable releases.

---

## 12. High Level Architecture (Final System)

```

Client
│
HTTPS
│
Load Balancer
│
API Gateway  ←→  RBAC (JWT Role Check)
│
Backend Services
│
┌───────────────┬────────────────┬──────────────────┐│ │ │
SQL Database  Redis Cache      RabbitMQ         webDockets
│                |                |                  |
Financial     Idempotency      Exchanges:           Chat services
Records       Sessions.        chat.messages        agent dashboard
              Agent status     offline.queue
              Rate limits      complaints
                               payments

↓
Pino Logs
↓
Log Aggregation
↓
Monitoring Dashboard
```

---

## 15. Key System Properties

### Property Implementation

| Property         | Implementation                                                     |
| ---------------- | ------------------------------------------------------------------ |
| Security         | HTTPS + JWT + Secure refresh tokens + RBAC role enforcement        |
| Reliability      | Idempotent payments + durable RabbitMQ offline.queue               |
| Consistency      | ACID transactions for all financial data                           |
| Scalability      | Docker + Kubernetes + Load Balancing                               |
| Performance      | Redis caching + async RabbitMQ processing                          |
| Observability    | Pino logging + request correlation + centralized monitoring        |
| Customer Support | WebSocket live chat + complaint ticket system + SSE status updates |
| Access Control   | RBAC — Customer / Support Agent / Admin role separation            |
