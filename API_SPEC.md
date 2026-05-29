# API Spec

Safety Control System Web의 프론트엔드와 백엔드가 공유하는 API 계약입니다.
운영 앱은 이 문서를 기준으로 요청/응답 필드명을 맞춥니다.

## Base

- Local frontend: `http://localhost:3000`
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

### ProjectStatus

```text
DRAFT
ACTIVE
ARCHIVED
```

프로젝트는 `DRAFT → ACTIVE → ARCHIVED` 흐름을 기본으로 하며, 운영 데이터는
삭제보다 아카이브 상태 전환을 우선합니다.

### WorkTypeSetting

```json
{
  "label": "직접 고용",
  "enabled": true,
  "payrollDocumentsRequired": true,
  "sortOrder": 10,
  "updatedAt": "2026-05-23T09:00:00Z"
}
```

`workType`은 관리자 고용 유형 설정에 등록된 `label` 문자열입니다. 외부 근로자가
직접 최초 등록을 진행하므로, 로그인 화면의 고용 유형 선택 박스에는 등록된 모든
고용 유형을 표시합니다. 서류 제출 이동 여부는 `payrollDocumentsRequired`
설정으로 계산합니다. 설정에 없는 `workType`은 `400 Bad Request`로 거부합니다.

### WorkerRegistrationStatus

```text
registered
onboarded
```

### PayrollDocumentStatus

```text
missing
submitted
reviewing
approved
rejected
```

## Object Shapes

### WorkerRegistration

```json
{
  "uid": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
  "projectId": "waterbomb-2026-summer",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "workType": "직접 고용",
  "team": "직접 고용 확인 대기",
  "supervisor": "관리자 배정 전",
  "registrationStatus": "registered",
  "payrollDocumentStatus": "missing",
  "registeredAt": "2026-05-22T08:00:00Z",
  "onboardedAt": null
}
```

### WorkerSession

```json
{
  "uid": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
  "projectId": "waterbomb-2026-summer",
  "role": "worker",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "workType": "직접 고용",
  "team": "직접 고용 A팀",
  "supervisor": "관리자 A",
  "schedule": "근무 일정 배정 전",
  "status": "온보딩 완료",
  "payrollDocumentsRequired": true,
  "payrollDocumentStatus": "missing"
}
```

### Project

```json
{
  "id": "waterbomb-2026-summer",
  "name": "2026 워터밤 여름 프로젝트",
  "status": "ACTIVE",
  "startDate": "2026-07-19",
  "endDate": "2026-07-21",
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
  "email": "admin@example.com"
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

### Create Admin Project

`POST /api/admin/projects`

Request:

```json
{
  "name": "2026 워터밤 겨울 준비",
  "status": "DRAFT",
  "startDate": "2026-12-18",
  "endDate": "2026-12-20",
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

### List Worker Selectable Work Types

`GET /api/work-types`

로그인/최초 등록 화면에서 선택할 수 있는 전체 고용 유형 목록입니다.

Response `200 OK`: `WorkTypeSetting[]`

### List Admin Work Types

`GET /api/admin/work-types`

관리자가 활성/비활성 고용 유형과 서류 제출 필요 여부를 관리하기 위한 전체 목록입니다.

Response `200 OK`: `WorkTypeSetting[]`

### Save Admin Work Type

`POST /api/admin/work-types`

Request:

```json
{
  "label": "단기 아르바이트",
  "enabled": true,
  "payrollDocumentsRequired": true,
  "sortOrder": 15
}
```

Response `200 OK`: `WorkTypeSetting`

### Rename Admin Work Type

`POST /api/admin/work-types/rename`

고용 유형 이름을 수정합니다. 기존 근로자 등록 원장에서 같은 고용 유형을 쓰던
근로자도 새 이름으로 함께 갱신합니다.

Request:

```json
{
  "currentLabel": "외부 고용",
  "nextLabel": "협력사 고용"
}
```

Response `200 OK`: `WorkTypeSetting`

Errors:

- `404 Not Found`: 기존 고용 유형 없음
- `409 Conflict`: 새 이름이 이미 등록되어 있음

### Delete Admin Work Type

`DELETE /api/admin/work-types/{label}`

고용 유형을 삭제합니다. 해당 고용 유형을 사용하는 근로자가 있으면 삭제하지
않습니다.

Response `200 OK`: empty

Errors:

- `404 Not Found`: 고용 유형 없음
- `409 Conflict`: 해당 고용 유형을 사용하는 근로자가 있음

### Complete Worker Onboarding

`POST /api/worker-registrations`

로그인 페이지의 최초 등록 절차입니다. 관리자가 먼저 등록한 프로젝트별 근로자 원장과
이름, 연락처, 고용 유형이 일치하면 비밀번호와 인증 코드를 저장하고
`onboarded` 상태로 전환합니다.

Request:

```json
{
  "projectId": "waterbomb-2026-summer",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "code": "123456",
  "password": "user-password",
  "workType": "직접 고용"
}
```

Response `200 OK`:

```json
{
  "uid": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
  "projectId": "waterbomb-2026-summer",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "workType": "직접 고용",
  "team": "직접 고용 확인 대기",
  "supervisor": "관리자 배정 전",
  "registrationStatus": "onboarded",
  "payrollDocumentStatus": "missing",
  "registeredAt": "2026-05-22T08:00:00Z",
  "onboardedAt": "2026-05-22T08:10:00Z"
}
```

Errors:

- `400 Bad Request`: 필수 입력 누락 또는 비밀번호 길이 미달
- `403 Forbidden`: 관리자 등록 정보와 불일치
- `404 Not Found`: 관리자 등록 정보 없음

### Worker Login

`POST /api/auth/worker-login`

온보딩이 완료된 근로자만 로그인할 수 있습니다. 해당 고용 유형 설정의
`payrollDocumentsRequired=true`이고 급여 서류가 `missing`이면 프론트엔드는
대시보드보다 급여 서류 제출 화면을 먼저 표시합니다.

Request:

```json
{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "code": "123456",
  "password": "user-password"
}
```

Response `200 OK`:

```json
{
  "uid": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
  "projectId": "waterbomb-2026-summer",
  "role": "worker",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "workType": "직접 고용",
  "team": "직접 고용 A팀",
  "supervisor": "관리자 A",
  "schedule": "근무 일정 배정 전",
  "status": "온보딩 완료",
  "payrollDocumentsRequired": true,
  "payrollDocumentStatus": "missing"
}
```

Errors:

- `401 Unauthorized`: 이름, 연락처, 인증 코드, 비밀번호 불일치
- `403 Forbidden`: 회원가입 절차 미완료
- `404 Not Found`: 등록 정보 없음

### Admin Login

`POST /api/auth/admin-login`

관리자 화면 진입은 Google 로그인으로 처리합니다. 프론트엔드는 Firebase Auth
Google Provider로 로그인한 뒤 Firebase ID token을 백엔드에 전달하고, 백엔드는
Firebase Admin SDK로 토큰 서명과 `email_verified`를 검증합니다. 그 다음
`ADMIN_ALLOWED_EMAILS` 또는 `ADMIN_ALLOWED_DOMAIN` 설정과 비교해 관리자 진입을
허용합니다.

프론트의 `hd` 파라미터는 Google 계정 선택 UX를 좁히는 힌트일 뿐이며, 권한 판단은
백엔드에서만 합니다.

Request:

```json
{
  "idToken": "firebase-id-token"
}
```

Response `200 OK`: `AdminSession`

Errors:

- `401 Unauthorized`: 토큰 검증 실패, 이메일 없음, 이메일 미인증
- `403 Forbidden`: 허용된 관리자 이메일 또는 도메인이 아님
- `503 Service Unavailable`: Firebase Admin SDK 또는 관리자 허용 설정 누락

### List Worker Registrations

`GET /api/admin/worker-registrations?projectId=waterbomb-2026-summer`

관리자 근로자 관리 화면의 프로젝트별 등록 원장 및 온보딩 상태 목록입니다.
`projectId`를 생략하면 모든 프로젝트의 근로자를 반환합니다.

Response `200 OK`:

```json
[
  {
    "uid": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
    "projectId": "waterbomb-2026-summer",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "workType": "직접 고용",
    "team": "직접 고용 확인 대기",
    "supervisor": "관리자 배정 전",
    "registrationStatus": "registered",
    "payrollDocumentStatus": "missing",
    "registeredAt": "2026-05-22T08:00:00Z",
    "onboardedAt": null
  }
]
```

### Create Worker Registration

`POST /api/admin/worker-registrations`

관리자가 실제 근로자 원장을 먼저 등록합니다. 이후 근로자가 회원가입하면 이
데이터와 대조합니다.

Request:

```json
{
  "projectId": "waterbomb-2026-summer",
  "name": "홍길동",
  "phone": "010-1234-5678",
  "workType": "직접 고용",
  "team": "직접 고용 A팀",
  "supervisor": "관리자 A"
}
```

Response `200 OK`: `WorkerRegistration`

### Delete Worker Registration

`DELETE /api/admin/worker-registrations/{phone}?projectId=waterbomb-2026-summer`

Path params:

- `phone`: URL encoded phone number, 예: `010-1234-5678`

Response `200 OK`: empty body

Errors:

- `404 Not Found`: 등록 정보 없음

### List Worker QR Entitlements

`GET /api/worker/qr-entitlements/today?workerId={workerUid}`

근로자 대시보드의 식권/생수 QR 지급권과 남은 횟수를 반환합니다. 현재 구현은
오늘 기준 식권 2회, 생수 3회 지급권을 생성하고 사용 이력을 반영합니다. DB
영속화 단계에서는 `qr_entitlements` 테이블에서 조회합니다.

Response `200 OK`: `QrEntitlement[]`

### List Admin QR Usage Summary

`GET /api/admin/qr-usage/summary?projectId=waterbomb-2026-summer&date=2026-05-26&mealType=all`

관리자 식권/생수 QR 사용 현황 화면의 프로젝트별 지급량, 사용량, 잔여량,
시간대별 사용 집계를 반환합니다. `mealType`은 `all`, `lunch`, `dinner`를
지원합니다.

Response `200 OK`: `QrUsageSummary`

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

Response `200 OK`: `{ "event": QrUsageEvent, "entitlement": QrEntitlement }`

### Get Admin Weather Overview

`GET /api/admin/weather`

관리자 기상 정보 관리 탭에서 현재 기상, 24시간 예보, 알림 로그, 관측 지점,
자동 경보 임계값을 함께 조회합니다. 현재 구현은 실제 기상청 호출 전 단계의
백엔드 어댑터 placeholder이며, 프론트엔드는 이 API만 호출합니다.

Response `200 OK`: `AdminWeatherOverview`

### Update Admin Weather Station

`POST /api/admin/weather/station`

기상청 격자 위치 산출에 사용할 관측 지점 좌표를 저장합니다. 운영 단계에서는
KMA 격자 변환 공식을 정확히 적용하고 DB에 저장합니다.

Request:

```json
{
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
    "workType": "직접 고용",
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
