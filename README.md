# IndiWebPros LMS

IndiWebPros Learning Management System (LMS) is an enterprise-grade, production-ready, and highly scalable web platform designed to facilitate course catalog browsing, student learning paths, progress tracking, and certificate generation.

---

## Tech Stack

### Frontend

- **Framework**: React 19 (Vite, TypeScript)
- **Styling**: Tailwind CSS & shadcn/ui
- **Routing**: React Router v7
- **Data Fetching**: TanStack Query & Axios
- **Form Handling**: React Hook Form & Zod
- **Icons**: Lucide React

### Backend

- **Framework**: Node.js & Express (TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL (Dockerized in Development)
- **Security**: Helmet, CORS, Dotenv, and Zod env validation

### Code Quality Tools

- **Linter**: ESLint v9 (Flat Config)
- **Formatter**: Prettier
- **Pre-commit Hooks**: Husky & lint-staged
- **Editor Config**: EditorConfig

---

## Requirements

Ensure you have the following installed locally:

- **Node.js** (v20 or higher)
- **pnpm** (v10 or higher)
- **Docker** and **Docker Compose** (for dev database and environment)

---

## Installation

Clone the repository and install all workspace dependencies:

```bash
# Clone the repository
git clone https://github.com/your-org/IndiWebPros-LMS.git
cd IndiWebPros-LMS

# Install dependencies using pnpm
pnpm install
```

---

## Running Development Server

### 1. Docker Compose (Database & Application Services)

To spin up the local development database (PostgreSQL), backend Express server, and frontend Vite server:

```bash
docker-compose up --build
```

### 2. Local Process Execution (Standard Local Development)

If you prefer running services directly on your host machine:

#### Configure Environment Variables

Copy `.env.example` templates to `.env` files:

- **Root**: `cp .env.example .env` (fill with local PostgreSQL credentials)
- **Frontend**: `cp frontend/.env.example frontend/.env`
- **Backend**: `cp backend/.env.example backend/.env`

#### Start Services

```bash
# Run both frontend and backend concurrently
pnpm dev

# Run only frontend
pnpm dev:frontend

# Run only backend
pnpm dev:backend
```

#### Email Provider Configuration

The backend email layer supports provider switching only through configuration. Set `EMAIL_PROVIDER` to `brevo`, `ses`, or `smtp` and keep the existing templates unchanged.

Brevo SMTP development configuration:

```bash
EMAIL_PROVIDER=brevo
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=IndiWebPros LMS
SMTP_FROM_EMAIL=noreply@indiwebpros.com
SMTP_SECURE=false
```

AWS SES configuration:

```bash
EMAIL_PROVIDER=ses
```

Generic SMTP configuration:

```bash
EMAIL_PROVIDER=smtp
```

Credentials are always read from environment variables and never hardcoded in the application. Logs include provider, recipient, message type, success/failure, and retry attempts without exposing secrets.

#### Email Health Checks

On startup, the backend performs a non-sending email health check for the configured provider. The check verifies DNS resolution, TCP connectivity, SMTP TLS negotiation, and SMTP authentication through Nodemailer's verification flow. It does not send a message.

Detailed email health is available at `GET /api/v1/health/email` for Admin users or internal callers that pass `x-internal-key` matching `INTERNAL_EMAIL_HEALTH_KEY` or `INTERNAL_METRICS_KEY`. The response includes provider, connection status, authentication status, last successful check, and a sanitized error message. SMTP usernames and passwords are never returned.

Run the related backend checks with:

```bash
pnpm --dir backend test:email
pnpm --dir backend test:observability
```

---

## Folder Structure

```
IndiWebPros-LMS/
├── .github/              # GitHub Actions workflows and issue templates
├── .husky/               # Pre-commit git hooks config
├── .vscode/              # Shared VS Code settings
├── assets/               # Branding, logos, icons, and certificates
├── backend/              # Node.js Express Backend
│   ├── prisma/           # Database schema definition
│   └── src/              # Express source code
├── docker/               # Container configuration files
├── docs/                 # PRD, SRS, and architecture documentation
├── frontend/             # React Vite Frontend
│   └── src/              # React components, layouts, pages, and hooks
├── infrastructure/       # IaC configurations
├── deployments/          # Production deployment scripts
├── logs/                 # System and API logs
├── backups/              # Database dump backups
├── tests/                # Automated API and integration test suites
└── uploads/              # Local upload storage
```

---

## Coding Standards

- **Strict Type Safety**: `any` types are prohibited unless explicitly disabled via ESLint comment.
- **Absolute Imports**: Always use the `@/` prefix to import components, configurations, and utilities relative to the package's `src` folder.
- **Component Design**: Functional components using custom hooks for state isolation. Keep UI presentation separate from side-effects.
- **Formatting**: Format code with Prettier and verify quality with ESLint prior to pushing commits.
- **Secrets Management**: Never commit credentials to git. Set secrets in local `.env` configuration files.
