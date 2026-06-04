# API Spec

Safety Control System Web의 프론트엔드와 백엔드가 공유하는 API 계약입니다.
운영 앱은 이 문서를 기준으로 요청/응답 필드명을 맞춥니다.

## Base

- Local frontend: `http://localhost:3000`
- Worker login URL: `http://localhost:3000/login/worker/`
- Admin login URL: `http://localhost:3000/login/admin/`
- Local backend: `http://localhost:8080`
- Frontend dev proxy: `/api` -> `http://localhost:8080`
- Backend runtime: NestJS `backend/`
- Content type: `application/json`
- Date/time: ISO-8601 UTC string, 예: `2026-05-22T08:00:00Z`

## Common Rules

- API path는 `/api`로 시작합니다.
- Request/response body는 camelCase를 사용합니다.
- 연락처는 숫자만 입력해도 백엔드가 `010-1234-5678` 형식으로 정규화해 저장하고 응답합니다.
- 운영 경로에서 브라우저 `localStorage`를 데이터 원장으로 사용하지 않습니다.
- 로그인 이후 화면 URL은 `/dashboard`, `/payroll-documents`, `/admin`처럼 역할이나
  화면명을 드러내지 않고 세션별 opaque 경로(`/s/{sessionToken}`)를 사용합니다.
  이 경로는 화면명 노출을 줄이는 UX 처리이며, 실제 권한은 백엔드 인증/인가로
  강제합니다.
- 민감 정보는 응답에 포함하지 않습니다. 예: `password`, `passwordHash`, 원본 파일 경로.
- 관리자 로그인은 Firebase ID token을 백엔드에서 검증합니다.
- `/api/admin/**` 관리자 API는 Bearer token 또는 서버 세션 기반 보호가 붙기 전까지
  개발용으로만 열어둡니다.

## Common Error Shape

향후 모든 API는 아래 응답 형식으로 통일합니다.

```json
{
  "code": "WORKER_ONBOARDING_REQUIRED",
  "message": "회원가입 절차가 완료되지 않았습니다.",
  "details": {}
}
```

현재 구현 일부는 레거시 기본 오류 응답 또는 텍스트 메시지를 반환할 수 있습니다.
다음 백엔드 정리 단계에서 위 형식으로 맞춥니다.

## Enums

### UserRole

```text
worker
admin
```

### AdminAccess

```text
workspace
schedule
qr
```

- `workspace`: 특정 workspace에 존재하는 모든 인원 기준으로 모든 관리자 시스템 접근 가능
- `schedule`: 스케줄 감독 권한, 대시보드·기상 정보·스케줄·안전 수칙 화면 접근 가능
- `qr`: QR코드 관리자 권한, 식권/생수 QR 관련 화면만 접근 가능

### ProjectStatus

```text
DRAFT
ACTIVE
ARCHIVED
```

프로젝트는 `DRAFT → ACTIVE → ARCHIVED` 흐름을 기본으로 하며, 운영 데이터는
삭제보다 아카이브 상태 전환을 우선합니다.

### WorkerCategorySetting

```json
{
  "category": "direct-hire",
  "enabled": true,
  "signupEnabled": true,
  "payrollDocumentsRequired": true,
  "sortOrder": 10,
  "updatedAt": "2026-05-23T09:00:00Z"
}
```

`category` is the employment-type value recorded in the admin worker ledger.
When an admin creates a worker registration or imports XLSX rows, a new category value
is automatically added to the category settings if it does not already exist. `company`
and `team` are normalized free-text worker attributes for the first pass, not separately
managed catalogs. Worker signup category choices use the current
category settings. Document submission display is computed from
`payrollDocumentsRequired` plus each worker `payrollDocumentStatus`.

### WorkerRegistration

```json
{
  "uid": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
  "projectId": "waterbomb-2026-summer",
  "name": "Hong Gil-dong",
  "phone": "010-1234-5678",
  "category": "direct-hire",
  "company": "Madeone",
  "team": "safety lead",
  "memo": "site lead",
  "registrationStatus": "registered",
  "payrollDocumentStatus": "missing",
  "registeredAt": "2026-05-22T08:00:00Z",
  "onboardedAt": null,
  "qrUsage": {
    "meal": { "issued": 2, "used": 1, "remaining": 1, "usageRate": 50 },
    "water": { "issued": 3, "used": 1, "remaining": 2, "usageRate": 33.3 }
  }
}
```

### WorkerSession

```json
{
  "uid": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
  "projectId": "waterbomb-2026-summer",
  "role": "worker",
  "name": "Hong Gil-dong",
  "phone": "010-1234-5678",
  "category": "direct-hire",
  "company": "Madeone",
  "workerTeam": "safety lead",
  "schedule": "unassigned",
  "status": "onboarded",
  "payrollDocumentsRequired": true,
  "payrollDocumentStatus": "missing"
}
```

The top-level `role` remains only as the auth/session discriminator. The worker's
assignment team is exposed as `workerTeam` in session responses.

### Project

```json
{
  "id": "waterbomb-2026-summer",
  "name": "2026 워터밤 여름 프로젝트",
  "status": "ACTIVE",
  "startDate": "2026-07-14",
  "endDate": "2026-07-24",
  "eventStartDate": "2026-07-19",
  "eventEndDate": "2026-07-21",
  "location": "킨텍스 제2전시장",
  "description": "현재 운영 중인 안전 관제 프로젝트",
  "createdBy": "system",
  "createdAt": "2026-05-29T00:00:00Z",
  "archivedAt": null
}
```

### QrEntitlement

```json
{
  "qrType": "meal",
  "label": "식권",
  "issuedDate": "2026-05-26",
  "totalCount": 2,
  "usedCount": 1,
  "remainingCount": 1,
  "status": "active",
  "qrToken": "opaque-token",
  "help": "운영 데스크에서 위 QR 코드를 스캔하세요"
}
```

### QrUsageSummary

```json
{
  "date": "2026-05-26",
  "mealType": "all",
  "totals": {
    "meal": { "issued": 2, "used": 1, "remaining": 1, "usageRate": 50 },
    "water": { "issued": 3, "used": 1, "remaining": 2, "usageRate": 33.3 }
  },
  "hourlyUsage": [
    {
      "hourRange": "12:00 - 13:00",
      "mealUsed": 1,
      "waterUsed": 1,
      "status": "정상"
    }
  ]
}
```

### QrUsageEvent

```json
{
  "id": "9c89d708-9242-4e80-ae57-2f6f0bb7a5b5",
  "entitlementId": "f0e5ab6f-45b0-4686-9c25-5683e48beef7",
  "workerId": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
  "workerName": "홍길동",
  "projectId": "waterbomb-2026-summer",
  "qrType": "meal",
  "mealType": "lunch",
  "usedAt": "2026-05-26T12:10:00.000Z",
  "scanLocation": "운영 데스크",
  "scannerId": "scanner-main-desk-01",
  "result": "allowed",
  "reason": "ok"
}
```

운영 DB 영속화 단계에서는 QR 사용 성공뿐 아니라 거부 이력도 같은 로그 모델에
남깁니다. `result`는 `allowed`, `denied`를 사용하고, `reason`은 `ok`,
`limit_exceeded`, `invalid_token`, `revoked`, `inactive_worker` 등으로
확장할 수 있습니다.

### AdminWeatherOverview

```json
{
  "source": {
    "provider": "KMA",
    "name": "기상청 단기예보 어댑터",
    "mode": "adapter-placeholder",
    "baseDateTime": "2026-07-19T05:00:00Z",
    "updatedAt": "2026-07-19T05:30:00Z",
    "advisoryMergePolicy": "특보는 예보값에 섞지 않고 별도 채널로 받은 뒤 위험 등급 상향 조건으로만 사용"
  },
  "site": {
    "name": "킨텍스 제2전시장",
    "latitude": 37.6698,
    "longitude": 126.7451,
    "nx": 57,
    "ny": 128,
    "source": "KMA",
    "updatedAt": "2026-07-19T05:30:00Z"
  },
  "thresholds": {
    "windSpeed": 10,
    "precipitation": 15,
    "temperature": 33,
    "humidity": 90
  },
  "correctionProfile": {
    "temperatureOffset": 1.2,
    "windSpeedOffset": 0.4,
    "humidityOffset": 3,
    "precipitationOffset": 0
  },
  "current": {
    "condition": "구름많음",
    "riskLevel": "caution",
    "summary": "현재 구름많음, 강수 12mm/h 및 체감 위험을 모니터링 중입니다.",
    "metrics": [
      {
        "key": "windSpeed",
        "label": "풍속 (WIND SPEED)",
        "sourceLabel": "KMA + 현장 보정",
        "value": 4.6,
        "unit": "m/s",
        "thresholdLabel": "경보: 10m/s",
        "percent": 46,
        "status": "NORMAL",
        "tone": "green"
      }
    ]
  },
  "forecast24h": [
    {
      "time": "18:00",
      "icon": "rainy",
      "condition": "소나기",
      "rainProbability": 85,
      "precipitation": 12,
      "temperature": 26,
      "windSpeed": 7.2,
      "riskLevel": "caution"
    }
  ],
  "alertLogs": [
    {
      "id": "heat-caution",
      "level": "caution",
      "title": "폭염 주의",
      "time": "14:15",
      "message": "보정 온도 31.5°C 감지. 그늘 휴식과 수분 보급 안내를 확인하세요."
    }
  ]
}
```

### AdminSession

```json
{
  "uid": "firebase-auth-uid",
  "role": "admin",
  "name": "관리자",
  "email": "admin@example.com",
  "adminAccess": "workspace"
}
```

## Implemented APIs

### List Admin Projects

`GET /api/admin/projects?includeArchived=true`

관리자 페이지의 프로젝트 전환 메뉴와 프로젝트 단위 데이터 필터링에 사용할 목록입니다.
`includeArchived=true`이면 종료된 프로젝트도 함께 반환합니다.

Response `200 OK`: `Project[]`

### Get Active Admin Project

`GET /api/admin/projects/active`

관리자 페이지 최초 진입 시 기본으로 선택할 운영 프로젝트를 반환합니다. `ACTIVE`
프로젝트가 없으면 가장 우선순위가 높은 비아카이브 프로젝트를 반환하고, 프로젝트가
없으면 `null`을 반환합니다.

Response `200 OK`: `Project | null`

### List Worker Selectable Projects

`GET /api/projects`

근로자 최초 등록과 로그인 화면에서 선택할 수 있는 비아카이브 프로젝트 목록입니다.
동일한 근로자가 여러 프로젝트에 참여할 수 있으므로, 근로자 인증 요청은 이 목록에서
선택한 `projectId`를 함께 보냅니다.

Response `200 OK`: `Project[]`

### Create Admin Project

`POST /api/admin/projects`

Request:

```json
{
  "name": "2026 워터밤 겨울 준비",
  "status": "DRAFT",
  "startDate": "2026-12-01",
  "endDate": "2026-12-31",
  "eventStartDate": "2026-12-18",
  "eventEndDate": "2026-12-20",
  "location": "운영 장소 미정",
  "description": "다음 운영 준비 프로젝트",
  "createdBy": "admin"
}
```

Response `200 OK`: `Project`

### Update Admin Project Status

`POST /api/admin/projects/{projectId}/status`

프로젝트 상태를 `DRAFT`, `ACTIVE`, `ARCHIVED` 중 하나로 변경합니다.

Request:

```json
{
  "status": "ARCHIVED"
}
```

Response `200 OK`: `Project`

### List Worker Selectable Categories

`GET /api/worker-categories`

Lists category settings that workers may choose during signup or first login. Categories
are created automatically from admin worker registrations and XLSX imports.

Response `200 OK`: `WorkerCategorySetting[]`

### List Admin Worker Categories

`GET /api/admin/worker-categories`

Lists all category settings for admin management. Registration/signup allow toggles are
not managed by operators; every recorded employment type remains usable. Company and team
are not managed as nested category catalogs in the first pass.

Response `200 OK`: `WorkerCategorySetting[]`

### List Admin Schedule Columns

`GET /api/admin/schedule-columns?projectId=waterbomb-2026-summer`

스케줄 표 컬럼은 프로젝트별 수동 관리 목록입니다. 근로자 관리의 고용 유형/팀
설정과 자동 동기화하지 않으며, 관리자가 스케줄 관리 화면에서 직접 추가하거나
삭제합니다. 기존 근로자 팀 목록은 스케줄 컬럼 초기값으로도 사용하지 않고,
근로자 매핑이나 팀별 인원 집계도 스케줄 컬럼에서 관리하지 않습니다.

Response `200 OK`:

```json
[
  {
    "id": "7f705b3d-c6d8-4b6e-b3f0-5a8651adf874",
    "label": "입장 게이트 A팀",
    "projectId": "waterbomb-2026-summer",
    "createdAt": "2026-06-04T00:00:00.000Z",
    "updatedAt": "2026-06-04T00:00:00.000Z"
  }
]
```

### Create Admin Schedule Column

`POST /api/admin/schedule-columns`

Request:

```json
{
  "projectId": "waterbomb-2026-summer",
  "label": "입장 게이트 A팀"
}
```

Response `201 Created`: 변경 후 `ScheduleColumn[]`

Errors:

- `400 Bad Request`: 컬럼명 누락 또는 길이 초과
- `409 Conflict`: 같은 프로젝트에 이미 같은 이름의 스케줄 컬럼이 있음

### Delete Admin Schedule Column

`DELETE /api/admin/schedule-columns/{id}?projectId=waterbomb-2026-summer`

Response `200 OK`: 변경 후 `ScheduleColumn[]`

Errors:

- `404 Not Found`: 스케줄 컬럼 없음

### Save Admin Worker Category

`POST /api/admin/worker-categories`

Request:

```json
{
  "category": "short-term-staff",
  "enabled": true,
  "signupEnabled": true,
  "payrollDocumentsRequired": true,
  "sortOrder": 15
}
```

Response `200 OK`: `WorkerCategorySetting`

`enabled` and `signupEnabled` are kept for API compatibility and are stored as `true`.
Operators only need to manage `payrollDocumentsRequired`.

### Rename Admin Worker Category

`POST /api/admin/worker-categories/rename`

Renames a category and updates existing worker registrations that reference it.

Request:

```json
{
  "currentCategory": "external",
  "nextCategory": "partner-company"
}
```

Response `200 OK`: `WorkerCategorySetting`

Errors:

- `404 Not Found`: existing category not found
- `409 Conflict`: next category already exists

### Delete Admin Worker Category

`DELETE /api/admin/worker-categories/{category}`

Deletes a category only when no worker registration uses it.

Response `200 OK`: empty

Errors:

- `404 Not Found`: category not found
- `409 Conflict`: category is used by existing workers

### Worker Onboarding

`POST /api/worker-registrations`

Worker signup matches a pre-registered worker ledger entry by project, name, phone, and
category, then stores password and verification code and moves the registration to
`onboarded`.

Request:

```json
{
  "projectId": "waterbomb-2026-summer",
  "name": "Hong Gil-dong",
  "phone": "010-1234-5678",
  "code": "123456",
  "password": "user-password",
  "category": "direct-hire"
}
```

Response `200 OK`: `WorkerRegistration`

Errors:

- `400 Bad Request`: missing input, short password, missing or unknown category
- `403 Forbidden`: worker ledger mismatch
- `404 Not Found`: worker ledger entry not found

### Worker Login

`POST /api/auth/worker-login`

Only onboarded workers can log in. If the matched category has
`payrollDocumentsRequired=true` and the worker document status is `missing`, the frontend
routes the worker to document submission before the dashboard.

Request:

```json
{
  "projectId": "waterbomb-2026-summer",
  "name": "Hong Gil-dong",
  "phone": "010-1234-5678",
  "code": "123456",
  "password": "user-password"
}
```

Response `200 OK`: `WorkerSession`

Errors:

- `401 Unauthorized`: name, phone, code, or password mismatch
- `403 Forbidden`: onboarding incomplete
- `404 Not Found`: registration not found

### Admin Login

`POST /api/auth/admin-login`

The admin frontend signs in with Firebase Auth Google Provider, sends the Firebase ID
token to the backend, and the backend validates token signature, email verification,
and the configured admin allow-list/domain. The frontend `hd` parameter is only a UX
hint; authorization decisions remain backend-owned.

Request:

```json
{
  "idToken": "firebase-id-token"
}
```

Response `200 OK`: `AdminSession`

Errors:

- `401 Unauthorized`: token validation failed, email missing, or email unverified
- `403 Forbidden`: email or domain is not allowed for admin access
- `503 Service Unavailable`: Firebase Admin SDK or admin allow-list is not configured

### List Worker Registrations

`GET /api/admin/worker-registrations?projectId=waterbomb-2026-summer`

Admin worker ledger with onboarding, document, and QR usage state. `projectId` may be
omitted to list every project.

Response `200 OK`: `WorkerRegistration[]`

### Create Worker Registration

`POST /api/admin/worker-registrations`

Request:

```json
{
  "projectId": "waterbomb-2026-summer",
  "name": "Hong Gil-dong",
  "phone": "010-1234-5678",
  "category": "direct-hire",
  "company": "Madeone",
  "team": "safety lead",
  "memo": "site lead"
}
```

Response `200 OK`: `WorkerRegistration`

Errors:

- `400 Bad Request`: missing input, invalid phone, invalid employment type or team name, empty company
- `409 Conflict`: same project already has the phone registered

### Update Worker Registration

`PATCH /api/admin/worker-registrations/{uid}`

Request fields are the editable subset of `WorkerRegistration`: `name`, `phone`, `category`,
`company`, `team`, and `memo`. Category is the employment type and is auto-added to
`WorkerCategorySetting` when needed; company and team are normalized free text in the first pass.

Response `200 OK`: `WorkerRegistration`

Errors:

- `400 Bad Request`: invalid phone, category, company, team, or memo
- `404 Not Found`: registration uid not found
- `409 Conflict`: updated phone duplicates another worker in the same project

### Delete Worker Registration

`DELETE /api/admin/worker-registrations/{uid}`

Response `200 OK`: empty body

Errors:

- `404 Not Found`: registration uid not found

### Import Worker Registrations XLSX

`POST /api/admin/worker-registrations/import-xlsx`

Content type: `multipart/form-data`, field name: `file`. Only `.xlsx` is accepted; `.xls`, `.csv`,
and other extensions are rejected before parsing. Required Excel columns are C(employment type), D(team),
E(company), F(name), H(phone), and I(memo). New C column values are automatically added as category
settings. B(No.) and G(resident registration number) are ignored
and never stored, displayed, logged, or echoed in error responses.

Row error shape never includes raw name, phone, memo, resident number, or raw row payload:

```json
{
  "row": 12,
  "column": "H",
  "label": "phone",
  "code": "INVALID_PHONE",
  "message": "Phone format is invalid."
}
```

Response `200 OK`:

```json
{
  "importedCount": 10,
  "rejectedCount": 1,
  "errors": [],
  "workers": []
}
```

### List Worker QR Entitlements

`GET /api/worker/qr-entitlements/today?workerId={workerUid}`

근로자 대시보드의 식권/생수 QR 지급권과 남은 횟수를 반환합니다. 현재 구현은
오늘 기준 식권 2회, 생수 3회 지급권을 생성하고 사용 이력을 반영합니다. DB
영속화 단계에서는 `qr_entitlements` 테이블에서 조회합니다.

운영 예정 설계에서는 근로자별 정적 QR 토큰을 발급하고, 서버가 날짜와 정책을
기준으로 사용 가능 횟수를 계산합니다. 캡처본 공유 방지는 현재 범위에서 제외하며,
QR 토큰은 개인정보 원문이 아니라 서버에서만 사용자와 매핑되는 opaque token으로
관리합니다.

Response `200 OK`: `QrEntitlement[]`

### List Admin QR Usage Summary

`GET /api/admin/qr-usage/summary?projectId=waterbomb-2026-summer&date=2026-05-26&mealType=all`

관리자 식권/생수 QR 사용 현황 화면의 프로젝트별 지급량, 사용량, 잔여량,
시간대별 사용 집계를 반환합니다. `mealType`은 `all`, `lunch`, `dinner`를
지원합니다.

Response `200 OK`: `QrUsageSummary`

### List Admin QR Usage Logs

`GET /api/admin/qr-usage/logs?projectId=waterbomb-2026-summer&date=2026-05-26&workerId={workerUid}&qrType=meal&result=allowed`

운영 예정 API입니다. 관리자 식권/생수 QR 사용 현황 화면의 전체 스캔 로그를
반환합니다. `projectId`, `date`, `workerId`, `qrType`, `result`로 필터링할 수
있고, `workerId`를 생략하면 프로젝트 전체 로그를 반환합니다.

Response `200 OK`: `QrUsageEvent[]`

### Get Worker QR Usage Detail

`GET /api/admin/workers/{workerId}/qr-usage?date=2026-05-26`

운영 예정 API입니다. 관리자 화면에서 사용자를 검색했을 때 해당 사용자의 식권/생수
사용량과 스캔 로그를 함께 반환합니다.

Response `200 OK`:

```json
{
  "worker": {
    "uid": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
    "name": "홍길동",
    "projectId": "waterbomb-2026-summer",
    "category": "direct-hire",
    "company": "Madeone",
    "team": "safety lead"
  },
  "date": "2026-05-26",
  "entitlements": [
    {
      "qrType": "meal",
      "label": "식권",
      "issuedDate": "2026-05-26",
      "totalCount": 2,
      "usedCount": 1,
      "remainingCount": 1,
      "status": "active",
      "qrToken": "opaque-token",
      "help": "운영 데스크에서 위 QR 코드를 스캔하세요"
    }
  ],
  "logs": []
}
```

### Record QR Scan

`POST /api/qr/scan`

QR 스캔 시 지급권 잔여 수량을 확인한 뒤 사용 이력을 기록합니다. 현재는 운영
스캐너/관리자 권한 검사가 붙기 전의 도메인 API이며, 운영 단계에서는 스캔 장비
또는 관리자 권한 검사를 통과한 요청만 허용해야 합니다.

Request:

```json
{
  "workerId": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
  "qrType": "meal",
  "scanLocation": "운영 데스크",
  "mealType": "lunch"
}
```

운영 예정 요청 형식은 스캐너가 읽은 QR 토큰만 서버에 전달하는 방식입니다. 서버는
`qr_tokens` 또는 `qr_entitlements`에서 토큰을 조회해 근로자, QR 유형, 날짜별
정책을 판정합니다.

```json
{
  "qrToken": "opaque-token",
  "scanLocation": "운영 데스크",
  "scannerId": "scanner-main-desk-01"
}
```

Response `200 OK`: `{ "event": QrUsageEvent, "entitlement": QrEntitlement }`

운영 DB 영속화 예정 테이블:

- `qr_policies`: 프로젝트/날짜/QR 유형별 허용 횟수. 예: 식권 2회, 생수 3회
- `qr_tokens`: 근로자별 정적 QR 토큰과 활성 상태
- `qr_entitlements`: 근로자/날짜/QR 유형별 지급권과 사용량
- `qr_usage_events`: 모든 스캔 성공/거부 로그

### Get Admin Weather Overview

`GET /api/admin/weather?projectId=waterbomb-2026-summer`

관리자 기상 정보 관리 탭에서 현재 기상, 24시간 예보, 알림 로그, 관측 지점,
자동 경보 임계값을 함께 조회합니다. 현재 구현은 실제 기상청 호출 전 단계의
백엔드 어댑터 placeholder이며, 프론트엔드는 이 API만 호출합니다. `projectId`별로
관측 지점과 자동 경보 임계값을 분리합니다.

테스트 환경에서 백엔드 또는 외부 기상 연동이 준비되지 않은 경우에만
`VITE_ENABLE_TEST_WEATHER_MOCK=true`로 프론트엔드 기상 fixture fallback을 켤 수
있습니다. 이 경우 응답의 `source.mode`는 `test-fixture`로 표시되며 운영 배포
환경에서는 사용하지 않습니다.

Response `200 OK`: `AdminWeatherOverview`

### Update Admin Weather Station

`POST /api/admin/weather/station`

기상청 격자 위치 산출에 사용할 관측 지점 좌표를 저장합니다. 운영 단계에서는
KMA 격자 변환 공식을 정확히 적용하고 DB에 저장합니다.

Request:

```json
{
  "projectId": "waterbomb-2026-summer",
  "name": "킨텍스 제2전시장",
  "latitude": 37.6698,
  "longitude": 126.7451
}
```

Response `200 OK`: `AdminWeatherOverview`

### Update Admin Weather Thresholds

`POST /api/admin/weather/thresholds`

자동 경보 판단에 사용할 임계값을 저장합니다.

Request:

```json
{
  "projectId": "waterbomb-2026-summer",
  "windSpeed": 10,
  "precipitation": 15,
  "temperature": 33,
  "humidity": 90
}
```

Response `200 OK`: `AdminWeatherOverview`

## Planned APIs

### Protect Admin APIs

관리자 로그인 이후 `/api/admin/**` 요청에 Bearer token 또는 서버 세션을 요구하도록
보호합니다. 현재 관리자 로그인 API는 구현되어 있지만, 관리자 API 보호는 다음
권한 강화 단계입니다.

### Submit Payroll Documents

`POST /api/payroll-documents`

예정 역할:

- 서류 제출 대상 고용 유형 근로자의 급여/세무 정보 제출
- 신분증 사본, 통장 사본 파일 업로드 metadata 연결
- 제출 후 `payrollDocumentStatus=submitted` 전환

파일은 브라우저에서 직접 DB나 외부 저장소에 쓰지 않고, 백엔드 권한 검사를 거친
저장 경로만 사용합니다.

Firebase Storage 사용 시 파일 원본은 Storage에 저장하되, 원본 경로와 다운로드
토큰은 클라이언트 원장에 저장하지 않습니다. 백엔드는 제출자 권한을 확인한 뒤
업로드 가능한 제한 시간 URL 또는 중계 업로드를 제공하고, 저장된 파일의 metadata만
DB에 남깁니다. 주민등록번호, 계좌번호, 신분증/통장 이미지는 응답 JSON에 원문으로
포함하지 않습니다.

### List Admin Payroll Documents

`GET /api/admin/payroll-documents`

관리자 근로자 관리 화면에서 서류 제출 필수 대상자와 제출 상태를 확인하기 위한
목록입니다. 응답에는 원본 파일 경로나 장기 다운로드 토큰을 포함하지 않습니다.

예정 역할:

- `payrollDocumentsRequired=true`인 고용 유형 근로자 목록 확인
- 제출 상태, 제출 시각, 검토 상태 확인
- 관리자 서류 열람 액션의 대상 식별

응답 예시:

```json
[
  {
    "workerId": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
    "workerName": "홍길동",
    "category": "직접 고용",
    "payrollDocumentStatus": "submitted",
    "submittedAt": "2026-05-22T08:20:00Z",
    "files": [
      {
        "fileId": "id-card",
        "label": "신분증 사본",
        "contentType": "application/pdf",
        "encrypted": true,
        "openable": true
      },
      {
        "fileId": "bankbook",
        "label": "통장 사본",
        "contentType": "image/png",
        "encrypted": true,
        "openable": true
      }
    ]
  }
]
```

`files`에는 관리자 화면 표시와 열람 요청에 필요한 최소 metadata만 포함합니다.
Firebase Storage object path, signed URL, download token, 암호화 키 식별자는 이
목록 응답에 포함하지 않습니다.

### Open Admin Payroll Document

`POST /api/admin/payroll-documents/{workerId}/files/{fileId}/open`

관리자가 특정 근로자의 제출 서류를 열람하기 위한 임시 접근 정보를 발급합니다.
파일 원본은 Firebase Storage의 `payroll/{workerId}/...` 경로에 두고, 백엔드가
관리자 권한과 감사 로그 정책을 확인한 뒤 제한 시간 URL 또는 프록시 응답을
반환합니다.

보안 기준:

- 관리자 권한 검사를 통과한 요청만 허용
- 원본 Storage 경로, 장기 토큰, 서비스 계정 정보는 응답에 포함하지 않음
- Firebase Storage 저장 암호화, Storage Rules, 필요한 경우 애플리케이션 레벨
  envelope encryption을 함께 사용
- 응답 URL은 짧은 만료 시간을 가지며, 가능하면 파일 내용을 백엔드 프록시로
  중계해 Storage 경로 노출을 줄임
- 운영 단계에서는 열람자, 열람 시각, 대상 파일에 대한 감사 로그를 남김

### Dashboard Data

`GET /api/dashboard/worker`

예정 역할:

- 근무 일정
- 안전 수칙 상태
- QR 지급 상태
- 날씨 및 작업 지침
- 설치 공정 상태

현재 대시보드의 정적 표시 데이터는 API 계약이 확정되는 순서대로 교체합니다.
