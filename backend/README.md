# Backend Workspace

Spring Boot backend workspace for Safety Control System Web.

This folder is the Spring Boot application root. The Gradle project name and
Java package are:

- project: `safety-control-backend`
- package: `com.madeone.safetycontrol`
- Java: `21`
- Spring Boot: `3.5.14`

## Responsibilities

- Authentication and authorization
- User, worker, admin, payroll, schedule, and safety data APIs
- Database access and transaction handling
- File access authorization and metadata APIs
- Protection of DB credentials, API keys, tokens, and private storage paths

Frontend code under `../frontend/` must not connect directly to the production
database or sensitive external APIs. Integration should happen through backend
API contracts used by the React frontend.

## Local Run

```powershell
Set-Location .\backend
.\gradlew.bat bootRun
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

## Worker Registration API Draft

Worker registration state is persisted through JPA. The default local profile
uses H2, while the production profile is configured for PostgreSQL through
environment variables.
Flyway migrations under `src/main/resources/db/migration/` create the database
schema, and JPA validates that schema on startup.

- `POST /api/worker-registrations`: worker onboarding completion from the login
  page. Public endpoint that must match an existing admin-created worker record.
- `POST /api/auth/worker-login`: worker login. Public endpoint that only allows
  onboarded registrations.
- `GET /api/admin/worker-registrations`: admin list of worker records and
  onboarding status. Protected endpoint.
- `POST /api/admin/worker-registrations`: create or update an expected worker
  record. Protected endpoint.
- `DELETE /api/admin/worker-registrations/{phone}`: delete a worker record.
  Protected endpoint.

When a worker's admin-managed work type has `payrollDocumentsRequired=true`
and that worker has `payrollDocumentStatus=missing`, the login response sets
`payrollDocumentsRequired=true`; the frontend should route that worker to the
payroll document submission page before the dashboard.
Phone numbers are normalized to the `010-1234-5678` style before persistence and
lookup. `workType` accepts labels registered in the `work_types` table.

The admin registration endpoints are temporarily open in local development
until administrator authentication is wired. Before production exposure, move
them behind the final admin auth policy.

## Admin Login Direction

Administrator entry uses Google login by default. The frontend should obtain a
Firebase Auth Google ID token and send it to `POST /api/auth/admin-login`.
The backend validates the token signature through Firebase Admin SDK, requires a
verified email, then allows the login only when the email matches
`ADMIN_ALLOWED_EMAILS` or the domain matches `ADMIN_ALLOWED_DOMAIN`.

The Google hosted-domain value is only a login hint on the frontend. It must
not be treated as the authorization boundary unless the backend has verified
the token claims and the active admin allowlist.

Local admin login requires Firebase configuration on both sides.

Frontend local environment:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_APP_ID
VITE_ADMIN_GOOGLE_DOMAIN
VITE_ENABLE_LOCAL_ADMIN_BYPASS
```

Set `VITE_ENABLE_LOCAL_ADMIN_BYPASS=true` only for local Vite dev-server
testing when Firebase/Google Workspace login is not available. The bypass is
ignored outside Vite development mode.

Backend local environment:

```text
FIREBASE_ADMIN_ENABLED=true
FIREBASE_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS
ADMIN_ALLOWED_EMAILS
ADMIN_ALLOWED_DOMAIN
```

`GOOGLE_APPLICATION_CREDENTIALS` should point to a local Firebase service
account JSON file. Keep that file outside git-tracked paths or covered by
`.gitignore`.

Example local PowerShell setup:

```powershell
$env:FIREBASE_ADMIN_ENABLED="true"
$env:FIREBASE_PROJECT_ID="your-firebase-project-id"
$env:GOOGLE_APPLICATION_CREDENTIALS="E:\secure\firebase-adminsdk.json"
$env:ADMIN_ALLOWED_EMAILS="admin@example.com"
.\gradlew.bat bootRun
```

`POST /api/auth/admin-login` currently returns the frontend admin session shape.
Moving `/api/admin/**` behind a Bearer token or server session is the next
authorization hardening step before production exposure.

The default profile uses an in-memory H2 database so the application can start
before the real database is provisioned. Production database settings are read
from environment variables in `application-prod.yaml`.

Required production variables:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
FIREBASE_ADMIN_ENABLED
FIREBASE_PROJECT_ID
GOOGLE_APPLICATION_CREDENTIALS
ADMIN_ALLOWED_EMAILS or ADMIN_ALLOWED_DOMAIN
```
