# HEROY Database Guide

HEROY uses **PostgreSQL** as its database and **Prisma** as its ORM. The full
schema lives in `backend/prisma/schema.prisma`.

## Prerequisites

- PostgreSQL 15+ running locally (or via Docker — see `docker-compose.yml`)
- `backend/.env` configured with a valid `DATABASE_URL`

## Creating the database

```bash
createdb heroy_dev
```

Or, if using Docker Postgres (once `docker-compose.yml` exists in Phase 21):
```bash
docker compose up -d postgres
```

## Running migrations

From the `backend/` folder:

```bash
cd backend
npx prisma migrate dev
```

This will:
1. Create the database tables based on `schema.prisma`
2. Generate a migration file under `prisma/migrations/`
3. Regenerate the Prisma Client (typed database access used throughout the backend)

Name the migration something descriptive when prompted, e.g. `init`.

## Seeding sample data

```bash
npx prisma db seed
```

This runs `prisma/seed.ts`, which creates:
- 2 locations (Downtown, Bole Airport)
- 8 vehicles across all categories
- 2 users:
  - Admin: `admin@heroy.example` / `Password123!`
  - Customer: `customer@heroy.example` / `Password123!`
- 3 bookings (completed, confirmed, pending)
- 1 review, 1 coupon (`WELCOME10`), 1 wishlist entry

## Useful commands

| Command | What it does |
|---|---|
| `npx prisma studio` | Opens a visual database browser in your browser |
| `npx prisma migrate dev` | Creates a new migration and applies it |
| `npx prisma migrate deploy` | Applies existing migrations (used in production) |
| `npx prisma generate` | Regenerates the Prisma Client after schema changes |
| `npx prisma migrate reset` | **Destructive** — drops the database, reapplies all migrations, reruns the seed |

## Making schema changes later

1. Edit `backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name describe_your_change`
3. Commit both the schema file and the new folder created under `prisma/migrations/`

## Entity overview

- **User** — customers, staff, and admins (role-based)
- **Vehicle** / **VehicleImage** — the fleet
- **Location** — rental branches
- **Booking** — a reservation linking a user, vehicle, and date range
- **Payment** — one-to-one with a booking
- **Review** — one-to-one with a completed booking
- **Coupon** — discount codes applied to bookings
- **Wishlist** — saved vehicles per user
- **Notification** — in-app alerts per user
- **MaintenanceRecord** — service history per vehicle
- **InspectionReport** — pickup/return condition checks per booking
- **VerificationDocument** — KYC/driver license verification
- **CorporateAccount** — company accounts with multiple employee users
- **AIConversation** / **AIMessage** — AI assistant chat history
- **AuditLog** — compliance trail of sensitive actions
