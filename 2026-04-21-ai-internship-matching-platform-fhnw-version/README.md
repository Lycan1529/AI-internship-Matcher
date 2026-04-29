# FHNW AI Internship Matching Platform

Project workspace organized for VS Code and future development.

## Structure

- `frontend/`
  - Static prototype UI
  - `index.html`
  - `styles.css`
  - `app.js`
  - `apiClient.js`

- `backend/`
  - Express API scaffold
  - Prisma/PostgreSQL integration
  - Routes, middleware, services
  - Backend architecture docs

- `docs/`
  - Migration notes and supporting documentation

- `.vscode/`
  - Workspace recommendations and editor settings

## Run Locally

Open [index.html](./index.html) in your browser. It redirects to the frontend app. If your browser blocks `file://` access, serve this folder with a simple local server (for example, VS Code Live Server).

## Main Files

- Frontend app: [frontend/index.html](./frontend/index.html)
- Backend readme: [backend/README.md](./backend/README.md)
- Backend architecture: [backend/ARCHITECTURE.md](./backend/ARCHITECTURE.md)
- Frontend migration notes: [docs/FRONTEND_API_MIGRATION.md](./docs/FRONTEND_API_MIGRATION.md)

## Notes

- Database schema and seed files live under `backend/prisma/`.
- The root `index.html` redirects to the frontend app for convenience in the browser.
