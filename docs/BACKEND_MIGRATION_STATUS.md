# Backend Migration Status

The Express and Prisma backend is the canonical production target. The Python server remains a temporary compatibility fixture only until PostgreSQL is configured and the Express workflow suite runs against it.

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
| `GET /api/admin/*` | `/api/admin/*` | Implemented; live analytics queries added; database verification pending |

## Temporary Python Server Policy

`backend/mock_api_server.py` is deprecated for normal development once the Express runtime is available. It must not be deployed as the production API. It may remain as a local test fixture until the Express API passes the documented workflow tests.

## Current Blocker

Node.js LTS, dependencies, Prisma Client generation, the production build, and the database-independent API test suite are working locally. A PostgreSQL `DATABASE_URL` and `JWT_SECRET` are still required before the first migration, seed, and end-to-end database workflow can run. `docker-compose.yml` provides an optional local PostgreSQL service for machines with Docker Desktop installed.
