# Safety Control Backend

NestJS 기반 백엔드 작업 영역입니다. 이 디렉터리는 같은 `/api` 계약을
Node/NestJS 런타임으로 제공합니다.

## Local Run

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

백엔드 포트는 루트 `.env.local`의 `LOCAL_BACKEND_PORT=8080`을 기준으로 관리합니다. 프론트엔드 Vite
dev server는 `LOCAL_FRONTEND_PORT=3000`에서 열리고, `/api` 요청을
`http://localhost:8080`으로 전달하므로 백엔드 검증 포트도 `8080`으로
유지합니다.

## Local PostgreSQL Check

로컬 DB는 루트 `docker-compose.yml`의 PostgreSQL 컨테이너로 띄웁니다.
DB 접속 정보는 루트 `.env.local`과 `backend/.env.example`의
`DATABASE_URL`을 기준으로 맞춥니다.

```powershell
cd ..
npm.cmd run db:up
npm.cmd run dev:backend
```

다른 PowerShell에서 헬스체크를 호출합니다.

```powershell
Invoke-RestMethod http://localhost:8080/api/health | ConvertTo-Json -Depth 6
```

`database.status`가 `up`이고 `runtime.storage`가 `postgresql`이면 백엔드에서
PostgreSQL 접속과 기본 쿼리가 성공한 상태입니다. `DATABASE_URL`이 없으면
기존처럼 `runtime.storage`는 `memory`, `database.status`는 `disabled`로
응답합니다.

## Implemented First

- `GET /api/health`
- `GET /api/work-types`
- `GET /api/admin/work-types`
- `GET /api/admin/schedule-columns`
- `POST /api/admin/work-types`
- `POST /api/admin/work-types/rename`
- `DELETE /api/admin/work-types/:label`
- `GET /api/admin/worker-registrations`
- `POST /api/admin/worker-registrations`
- `DELETE /api/admin/worker-registrations/:phone`
- `POST /api/worker-registrations`
- `POST /api/auth/worker-login`
- `POST /api/auth/admin-login`

현재 업무 데이터 저장소는 로컬 API 검증용 in-memory store입니다. PostgreSQL은
헬스체크로 연결 가능성을 검증하는 단계이며, 다음 단계에서 테이블 schema,
migration, 관리자 API 보호를 붙이면 됩니다.
