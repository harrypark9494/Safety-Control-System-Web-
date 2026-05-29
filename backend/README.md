# Safety Control Backend

NestJS 기반 백엔드 작업 영역입니다. 이 디렉터리는 같은 `/api` 계약을
Node/NestJS 런타임으로 제공합니다.

## Local Run

```powershell
cd backend
npm install
npm run dev
```

백엔드 포트는 루트 `.env.local`의 `LOCAL_BACKEND_PORT=8080`을 기준으로 관리합니다. 프론트엔드 Vite
dev server는 `LOCAL_FRONTEND_PORT=3000`에서 열리고, `/api` 요청을
`http://localhost:8080`으로 전달하므로 백엔드 검증 포트도 `8080`으로
유지합니다.

## Implemented First

- `GET /api/health`
- `GET /api/work-types`
- `GET /api/admin/work-types`
- `POST /api/admin/work-types`
- `POST /api/admin/work-types/rename`
- `DELETE /api/admin/work-types/:label`
- `GET /api/admin/worker-registrations`
- `POST /api/admin/worker-registrations`
- `DELETE /api/admin/worker-registrations/:phone`
- `POST /api/worker-registrations`
- `POST /api/auth/worker-login`
- `POST /api/auth/admin-login`

현재 저장소는 로컬 API 검증용 in-memory store입니다. 다음 단계에서
PostgreSQL 연결, migration, 관리자 API 보호를 붙이면 됩니다.
