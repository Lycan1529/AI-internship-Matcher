# FHNW AI Internship Matching API

Backend scaffold for upgrading the current static prototype into a production-ready SaaS MVP.

## Stack

- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT authentication
- Multer + PDF parsing for CV upload
- Service modules for matching, notifications, CV parsing, and safe ingestion

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

The API will run on `http://localhost:4000` by default.

## Recommended Real Keys

Best first real key setup for this project:

1. `OPENAI_API_KEY`
   - use for match explanations first
   - optionally use embeddings for semantic ranking later

2. `GOOGLE_API_KEY` + `GOOGLE_CSE_ID`
   - use for broader search-style discovery
   - keep both server-side only

Do not put these keys in the frontend.

## API Map

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Students

- `GET /api/students`
- `POST /api/students`
- `PUT /api/students/:id`

### Internships

- `GET /api/internships`
- `POST /api/internships`
- `GET /api/internships/:id`

### Applications

- `POST /api/applications`
- `GET /api/applications/student/:id`
- `PUT /api/applications/:id/status`

### Notifications

- `GET /api/notifications`
- `PUT /api/notifications/:id/read`

### Recommendations

- `GET /api/recommendations/:studentId`

### CV

- `POST /api/cv/upload`
- `POST /api/cv/parse`

## Migration From Prototype

The current frontend uses `localStorage`. Replace each local data operation with API calls in this order:

1. Load internships from `GET /api/internships`.
2. Submit applications with `POST /api/applications`.
3. Load application tracker from `GET /api/applications/student/:id`.
4. Update recruiter statuses through `PUT /api/applications/:id/status`.
5. Load notifications from `GET /api/notifications`.
6. Replace local match scoring with `GET /api/recommendations/:studentId`.

## Notes

The matching service currently uses deterministic weighted scoring. The intended production evolution is:

- embeddings for profile/job similarity
- rule-based scoring for deterministic constraints
- LLM explanations for "Why this match?"

The ingestion service is intentionally designed for approved APIs, company feeds, and allowed public sources. It should not depend on restricted scraping.

## Provider Modes

Supported environment modes:

- `MATCHING_PROVIDER=local`
- `EXPLANATION_PROVIDER=local`
- `SEARCH_PROVIDER=local`

Later, switch to:

- `EXPLANATION_PROVIDER=openai`
- `MATCHING_PROVIDER=openai`
- `SEARCH_PROVIDER=google`

That lets the same codebase run safely in prototype mode before real keys are added.
