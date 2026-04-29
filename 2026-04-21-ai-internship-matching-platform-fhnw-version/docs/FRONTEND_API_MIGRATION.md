# Frontend API Migration Plan

The current `index.html`, `styles.css`, and `app.js` prototype should keep working with `localStorage` until the backend can be installed and run. The next integration step is to gradually replace local state operations with calls from `apiClient.js`.

## Runtime Blocker In This Environment

The current shell has:

- Node.js available
- no `npm`
- no `corepack`
- no `psql`
- no Docker

So the backend scaffold is ready, but package installation, Prisma migration, and PostgreSQL startup need a machine/session with those tools available.

## API Client

`apiClient.js` contains wrappers for:

- auth
- students
- internships
- applications
- notifications
- recommendations

It expects the backend at:

```txt
http://localhost:4000/api
```

Override it before loading the module if needed:

```html
<script>
  window.FHNW_API_BASE_URL = "https://your-api.example.com/api";
</script>
```

## Recommended Integration Order

1. Keep `localStorage` as fallback.
2. Replace internship loading:
   - current: local `internships`
   - target: `api.internships()`
3. Replace application submit:
   - current: `applyForInternship()`
   - target: `api.apply({ studentId, internshipId })`
4. Replace application tracker:
   - target: `api.studentApplications(studentId)`
5. Replace recruiter status updates:
   - target: `api.updateApplicationStatus(applicationId, { status })`
6. Replace notifications:
   - target: `api.notifications()`
7. Replace recommendation scoring:
   - target: `api.recommendations(studentId)`

## Suggested Hybrid Adapter

Use this pattern while migrating:

```js
const USE_BACKEND = false;

async function loadInternships() {
  if (!USE_BACKEND) return internships;
  return api.internships();
}
```

That lets the demo remain stable while backend modules are connected one at a time.
