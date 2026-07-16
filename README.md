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
