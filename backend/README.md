# Backend Workspace

This folder is reserved for the Spring Boot backend.

Backend responsibilities:

- Authentication and authorization
- User, worker, admin, payroll, schedule, and safety data APIs
- Database access and transaction handling
- File access authorization and metadata APIs
- Protection of DB credentials, API keys, tokens, and private storage paths

Frontend code under `../frontend/` must not connect directly to the production database or sensitive external APIs. Integration should happen through backend API contracts after the mock frontend flow is stable.
