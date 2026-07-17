# Enterprise Observability, Monitoring & Health Platform Architecture
# IndiWebPros LMS — Milestone 25

This document details the production-grade observability platform designed and implemented for the IndiWebPros LMS. The platform provides full visibility into application health, performance, structured logging, request correlation, metrics aggregation, error tracking, and CloudWatch integration.

---

## 1. System Architecture

The observability stack consists of multiple coordinated services and middleware layers running transparently within the application request-response lifecycle:

```
                  ┌────────────────────────────────────────┐
                  │            Incoming Request            │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │         correlationMiddleware          │  ◄── Generates / propagates requestId,
                  └───────────────────┬────────────────────┘      correlationId, traceId (W3C format)
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │         performanceMiddleware          │  ◄── Starts high-res process timer,
                  └───────────────────┬────────────────────┘      sets X-Response-Time header on finish
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │        requestLoggerMiddleware         │  ◄── Logs JSON payload on response finish
                  └───────────────────┬────────────────────┘      (skips health probe noise)
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │        API Routes & Controllers        │  ◄── Business Logic execution
                  └───────────────────┬────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   ┌────────────────────┐                          ┌────────────────────┐
   │   MetricsService   │                          │    ErrorTracker    │
   └──────────┬─────────┘                          └──────────┬─────────┘
              │ (Aggregates CPU/Mem,                       │ (Classifies 12 error types, redacts
              │  p50/p95/p99 latency)                      │  secrets, keeps recent ring buffer)
              ▼                                               ▼
   ┌────────────────────────────────────────────────────────────────────┐
   │                      AWS CloudWatch / SDK                          │
   │           (Structured Logs + Custom Metrics + Alarms)              │
   └────────────────────────────────────────────────────────────────────┘
```

---

## 2. Health Check Flow (`/health/*`)

We implement four separate health probes tailored for orchestrators like Kubernetes or AWS ECS, as well as synthetic monitoring:

### Liveness Probe (`GET /health/live`)
- **Objective**: Determine if the application container needs a restart.
- **Verification**: Verifies that the Node process is running and memory usage is within acceptable thresholds (fails if heap usage exceeds 95%).
- **Characteristics**: Fast, lightweight, avoids any database or third-party API dependencies.

### Readiness Probe (`GET /health/ready`)
- **Objective**: Determine if the application can accept user traffic.
- **Verification**: Verifies connections to the PostgreSQL Database (via Prisma ping timeout check) and AWS S3 storage provider.
- **Characteristics**: Fast query verification, returns 503 if any dependency is down so the load balancer stops routing traffic to the instance.

### Startup Probe (`GET /health/startup`)
- **Objective**: Determine if the container has finished its boot sequence.
- **Verification**: Verifies configuration loading, dependency injection service registration, and database schema migrations accessibility.
- **Characteristics**: Polled only at startup; once successful, the orchestrator switches to liveness/readiness probes.

### Full Health Check (`GET /health`)
- **Objective**: Detailed infrastructure state review.
- **Verification**: Aggregates all readiness + process health checks and list metadata of all registered services.

### Email Health Probe (`GET /health/email`)
- **Objective**: Provide an enterprise email-provider diagnostic without sending mail.
- **Startup behavior**: Runs once during provider initialization and records the latest successful check.
- **Verification**: DNS resolution, TCP connection to the SMTP host, TLS negotiation, and SMTP authentication via Nodemailer's non-sending verification flow.
- **Security**: The detailed endpoint requires an Admin bearer token or an internal `x-internal-key` matching `INTERNAL_EMAIL_HEALTH_KEY`/`INTERNAL_METRICS_KEY`. Public aggregate health only receives a sanitized summary. SMTP credentials are never returned.
- **Response fields**: provider, connection status, authentication status, last successful check timestamp, sanitized error message, per-step status, host, port, and secure mode.

---

## 3. Structured JSON Logging

Every log line is output as a structured JSON object to stdout. This makes it instantly ingestible by CloudWatch Logs, OpenTelemetry, Grafana Loki, or ELK stacks.

### Key Log Fields
- `timestamp`: ISO-8601 string.
- `level`: TRACE, DEBUG, INFO, WARN, ERROR, FATAL.
- `requestId`: Unique token for single request tracking.
- `correlationId`: Identifier propagated across distributed boundaries.
- `traceId`: W3C trace ID compatible with OpenTelemetry.
- `userId`: Contextual identification of the triggering user.
- `ipAddress` & `userAgent`: Client metadata.
- `method` & `path`: HTTP routing details.
- `statusCode`: HTTP response status code.
- `durationMs`: Total request-response latency.
- `requestSize` & `responseSize`: Payload volume tracking.
- `message` & `metadata`: Log message and supplementary variables.

### Redaction and Security
- **No Stack Traces in Production**: Unhandled error stack traces are automatically logged to the secure console, but are stripped from the response payload returned to the user.
- **Auto-Redaction**: In-flight parameters matching patterns for `password`, `secret`, `token`, `authorization`, `creditCard`, and API keys are automatically redacted (`[REDACTED]`) from logs to prevent PII/credential leakage.

---

## 4. Metrics System (`MetricsService`)

The platform collects real-time telemetry metrics:

| Metric Type | Name | Purpose |
|-------------|------|---------|
| **Counter** | `http.requests.total` | Total API requests |
| **Counter** | `http.errors.4xx` / `http.errors.5xx` | HTTP Error rates |
| **Counter** | `auth.failures` / `auth.successes` | Authentication tracking |
| **Counter** | `payment.failures` / `payment.successes` | Razorpay/Stripe transactions |
| **Histogram**| `http.response_time_ms` | API Response latency distribution (min, max, mean, p50, p95, p99) |
| **Histogram**| `db.query_time_ms` | PostgreSQL/Prisma query latency |
| **Gauge** | `process.heap_used_mb` | Node memory footprint |

### Percentiles Calculations
The `MetricsService` utilizes **Reservoir Sampling** to maintain a sliding window of recent latencies. This enables accurate computation of the **95th and 99th percentile** response times in-memory without high CPU/memory overhead or external dependency on Redis/Prometheus.

---

## 5. Request Correlation & Tracing

Distributed tracing is fully supported through automatic extraction, generation, and propagation of headers:

```
Client Header (Optional)
  - x-correlation-id
  - traceparent
       │
       ▼
correlationMiddleware
  ├── Generate x-request-id (UUID)
  ├── Propagate/Generate x-correlation-id
  └── Propagate/Generate x-trace-id (32-char hex)
       │
       ├─► Inject into downstream Log Context (logger.child)
       ├─► Propagate via HTTP Response Headers
       └─► Propagate to Outgoing Services/API Webhooks
```

---

## 6. Centralized Error Classification

Every error caught by the platform is routed to `ErrorTracker` which classifies it into one of the following domains:
1. `validation` (Zod errors, HTTP 400)
2. `authentication` (Invalid JWT, HTTP 401)
3. `authorization` (RBAC violations, HTTP 403)
4. `database` (Prisma/PostgreSQL exceptions)
5. `external_service` (Network/DNS timeouts)
6. `payment` (Razorpay signature failures)
7. `storage` (S3 connection errors)
8. `email` (SES credentials/quota limit issues)
9. `internal_server` (Unhandled exceptions, HTTP 500)
10. `not_found` (HTTP 404)
11. `rate_limit` (HTTP 429)

### Ring Buffer
The `ErrorTracker` retains the last 100 errors in an in-memory ring buffer, accessible via the developer `/metrics` endpoint, allowing immediate operational diagnostics.
