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

- `POST /api/worker-registrations`: worker registration request from the login
  page. Public endpoint.
- `POST /api/auth/worker-login`: worker login. Public endpoint that only allows
  approved registrations.
- `GET /api/admin/worker-registrations`: admin list of pending and approved
  registrations. Protected endpoint.
- `POST /api/admin/worker-registrations/{phone}/approve`: approve a matched
  registration. Protected endpoint.
- `POST /api/admin/worker-registrations/{phone}/reject`: reject a registration.
  Protected endpoint.

When a `직접 고용` worker is approved and has `payrollDocumentStatus=missing`,
the login response sets `payrollDocumentsRequired=true`; the frontend should
route that worker to the payroll document submission page before the dashboard.

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
