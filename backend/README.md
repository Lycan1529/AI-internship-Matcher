# FHNW AI Internship Matching API

Backend API for the Lycan AI Internship Matching Platform.

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

The API runs on `http://127.0.0.1:4000` by default. `DATABASE_URL` and `JWT_SECRET` are required before it starts; this prevents a server from accidentally running with insecure configuration.

For the current MVP, keep `MATCHING_PROVIDER=local` unless you are ready to add a real `OPENAI_API_KEY`.

## Recommended Real Keys

Best first real key setup for this project:

1. `OPENAI_API_KEY`
   - use for embeddings and match explanations
   - keep it server-side only

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
- `GET /api/students/:id`
- `POST /api/students`
- `PUT /api/students/:id`

### Recruiters

- `GET /api/recruiters`
- `GET /api/recruiters/:id`
- `POST /api/recruiters`
- `PUT /api/recruiters/:id`

### Companies

- `GET /api/companies`
- `POST /api/companies`
- `PUT /api/companies/:id`

### Internships

- `GET /api/internships`
- `POST /api/internships`
- `GET /api/internships/:id`

### Applications

- `POST /api/applications`
- `GET /api/applications/student/:id`
- `PUT /api/applications/:id/status`

### Notifications

- `GET /api/notifications/:userId` (frontend-facing target)
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`

### Recommendations

- `GET /api/recommendations/:studentId`

### CV

- `POST /api/cv/upload`
- `POST /api/cv/parse`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/sources`
- `GET /api/admin/analytics`

## Migration From Prototype

The current frontend uses `localStorage`. Replace each local data operation with API calls in this order:

1. Load internships from `GET /api/internships`.
2. Submit applications with `POST /api/applications`.
3. Load application tracker from `GET /api/applications/student/:id`.
4. Update recruiter statuses through `PUT /api/applications/:id/status`.
5. Load notifications from `GET /api/notifications`.
6. Replace local match scoring with `GET /api/recommendations/:studentId`.

## Notes

The matching service now uses a hybrid architecture:

- rule-based scoring for deterministic constraints
- embeddings for semantic profile/job similarity
- LLM explanations for "Why this match?"

Final score formula:

- `60%` rule-based score
- `40%` embedding similarity score

Current provider behavior:

- `MATCHING_PROVIDER=local`: weighted local semantic scoring
- `MATCHING_PROVIDER=openai`: remote embedding similarity with automatic local fallback
- `EXPLANATION_PROVIDER=local`: deterministic human-readable explanation
- `EXPLANATION_PROVIDER=openai`: generated explanation through the OpenAI responses API

Provider selection rule:

- if `OPENAI_API_KEY` is available and `MATCHING_PROVIDER` is not `local`, use OpenAI embeddings
- otherwise, use local fallback scoring

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
