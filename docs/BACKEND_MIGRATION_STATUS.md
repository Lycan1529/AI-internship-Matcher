# Backend Migration Status

The Express and Prisma backend is the canonical production target. The browser client already uses the API contract. The Python server is a temporary compatibility fixture for the local presentation dataset until PostgreSQL is configured and the Express workflow suite runs against it.

| Python mock API | Express route | Status |
| --- | --- | --- |
| `GET /api/health` | `GET /api/health` | Implemented; database readiness check pending runtime verification |
| `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | `/api/auth/*` | Implemented; Prisma runtime verification pending |
| `GET/POST/PUT /api/students*` | `/api/students/*` | Implemented; access control added; database verification pending |
| `GET/POST/PUT /api/recruiters*` | `/api/recruiters/*` | Implemented; access control added; database verification pending |
| `GET/POST/PUT /api/companies*` | `/api/companies/*` | Implemented; access control added; database verification pending |
| `GET/POST/PUT /api/internships*` | `/api/internships/*` | Implemented; recruiter ownership checks added; database verification pending |
| `GET/POST/PUT /api/applications*` | `/api/applications/*` | Implemented; lifecycle and ownership checks added; database verification pending |
| `GET/PUT /api/notifications*` | `/api/notifications/*` | Implemented; ownership checks added; database verification pending |
| `GET /api/recommendations/:studentId` | `/api/recommendations/:studentId` | Implemented; student ownership check added; database verification pending |
| `POST /api/cv/upload`, `POST /api/cv/parse` | `/api/cv/*` | Implemented; PDF validation, ownership, and delete support added; database verification pending |
| `POST /api/profile/avatar` | `/api/profile/avatar` | Implemented; authenticated image upload and profile persistence; database verification pending |
| `GET /api/admin/*` | `/api/admin/*` | Implemented; admin bootstrap, user suspension, company verification, listing moderation, audit logs, matching telemetry, and live analytics added; database verification pending |

## Temporary Python Server Policy

`backend/mock_api_server.py` is deprecated for normal development once the Express runtime is available. It must not be deployed as the production API. It may remain as a local test fixture until the Express API passes the documented workflow tests.

## Current Blocker

Node.js LTS, dependencies, Prisma Client generation, the production build, initial committed migration, and the database-independent API test suite are working locally. A PostgreSQL `DATABASE_URL`, `JWT_SECRET`, and deployed frontend origin are still required before an end-to-end production workflow can run. `docker-compose.yml` provides an optional local PostgreSQL service for machines with Docker Desktop installed.
