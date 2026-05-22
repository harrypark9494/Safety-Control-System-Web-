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
API contracts after the mock frontend flow is stable.

## Local Run

```powershell
Set-Location .\backend
.\gradlew.bat bootRun
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

The default profile uses an in-memory H2 database so the application can start
before the real database is provisioned. Production database settings are read
from environment variables in `application-prod.yaml`.

Required production variables:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
```
