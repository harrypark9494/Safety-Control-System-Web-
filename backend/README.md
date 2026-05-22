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

When a `직접 고용` worker is onboarded and has `payrollDocumentStatus=missing`,
the login response sets `payrollDocumentsRequired=true`; the frontend should
route that worker to the payroll document submission page before the dashboard.
Phone numbers are normalized to the `010-1234-5678` style before persistence and
lookup. `workType` only accepts `직접 고용` or `외부 고용`.

The admin registration endpoints are temporarily open in local development
until administrator authentication is wired. Before production exposure, move
them behind the final admin auth policy.

The default profile uses an in-memory H2 database so the application can start
before the real database is provisioned. Production database settings are read
from environment variables in `application-prod.yaml`.

Required production variables:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```
