# HEROY — AI-Native Car Rental Management System

HEROY is a full-stack car rental platform: a public booking site, a customer
dashboard, a staff/admin console, and a built-in AI assistant (text + voice)
that can answer questions and help customers find and book a vehicle.

## Tech stack

**Frontend**

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion (animated gradient text, transitions)
- React Three Fiber + drei (interactive 3D background)
- Zustand (client state) + TanStack Query (server state/caching)

**Backend**

- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Custom JWT auth (access + refresh tokens)
- Stripe (payments)
- Anthropic Claude API (AI assistant, function-calling into live fleet/booking data)
- Web Speech API on the client for voice input/output

**Infrastructure**

- Docker + docker-compose (Postgres, backend, frontend)
- GitHub Actions CI
- Sentry (error monitoring)

## Repository layout

heroy/
├── backend/ Express API, Prisma schema, business logic
├── frontend/ Next.js app (public site, dashboard, admin, AI widget)
├── docker-compose.yml
└── README.md

## Local setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (local install or Docker)
- npm 10+

### 1. Clone and install

```bash
git clone <your-repo-url> heroy
cd heroy
npm install
```

### 2. Database

```bash
createdb heroy_dev
```

### 3. Environment variables

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Required backend values: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`.

### 4. Run migrations and seed data

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 5. Start the apps

```bash
npm run dev
```

Backend runs on `http://localhost:4000`, frontend on `http://localhost:3000`.

## Project roadmap

- **Phase 0** — Project foundation & tooling
- **Phase 1** — Database design (Postgres + Prisma)
- **Phase 2** — Backend core infrastructure
- **Phase 3** — Auth module
- **Phase 4** — Users module
- **Phase 5** — Vehicles module
- **Phase 6** — Bookings module
- **Phase 7** — Payments module
- **Phase 8** — Reviews, locations, notifications
- **Phase 9** — Coupons & loyalty
- **Phase 10** — Wishlist/favorites
- **Phase 11** — AI assistant module
- **Phase 12** — Admin analytics module
- **Phase 13** — Third-party integrations
- **Phase 14** — Background jobs & real-time
- **Phase 15** — API docs & observability
- **Phase 16** — Frontend foundation
- **Phase 17** — Public site pages
- **Phase 18** — Legal & static pages
- **Phase 19** — Admin dashboard pages
- **Phase 20** — AI assistant widget
- **Phase 21** — Testing, CI/CD, security, deployment
- **Phase 22** — Driver verification (KYC)
- **Phase 23** — Vehicle inspection & damage reports
- **Phase 24** — Fleet maintenance scheduling
- **Phase 25** — Corporate accounts & long-term plans
- **Phase 26** — Admin roles, permissions & compliance
- **Phase 27** — Reporting & exports
- **Phase 28** — Advanced AI layer
- **Phase 29** — Localization, currency & tax
- **Phase 30** — Delivery & support logistics
- **Phase 31** — Growth & retention
- **Phase 32** — Partner/B2B API
- **Phase 33** — Compliance & accessibility polish

## License

Private project. All rights reserved.
