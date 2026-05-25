# API Spec

Safety Control System Web의 프론트엔드와 백엔드가 공유하는 API 계약입니다.
운영 앱은 이 문서를 기준으로 요청/응답 필드명을 맞춥니다.

## Base

- Local frontend: `http://localhost:5173`
- Local backend: `http://localhost:8080`
- Frontend dev proxy: `/api` -> `http://localhost:8080`
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

현재 구현 일부는 Spring 기본 오류 응답 또는 텍스트 메시지를 반환할 수 있습니다.
다음 백엔드 정리 단계에서 위 형식으로 맞춥니다.

## Enums

### UserRole

```text
worker
admin
```

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

`workType`은 관리자 고용 유형 설정에 등록된 `label` 문자열입니다. 로그인 화면에는
`enabled=true`인 항목만 표시하고, 서류 제출 이동 여부는
`payrollDocumentsRequired` 설정으로 계산합니다. 설정에 없는 `workType`은
`400 Bad Request`로 거부합니다.

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

### List Enabled Work Types

`GET /api/work-types`

로그인/최초 등록 화면에서 선택할 수 있는 활성 고용 유형 목록입니다.

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
않습니다. 선택 박스에서만 숨기려면 삭제 대신 `enabled=false`로 저장합니다.

Response `200 OK`: empty

Errors:

- `404 Not Found`: 고용 유형 없음
- `409 Conflict`: 해당 고용 유형을 사용하는 근로자가 있음

### Complete Worker Onboarding

`POST /api/worker-registrations`

로그인 페이지의 최초 등록 절차입니다. 관리자가 먼저 등록한 근로자 원장과
이름, 연락처, 고용 유형이 일치하면 비밀번호와 인증 코드를 저장하고
`onboarded` 상태로 전환합니다.

Request:

```json
{
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

`GET /api/admin/worker-registrations`

관리자 근로자 관리 화면의 등록 원장 및 온보딩 상태 목록입니다.

Response `200 OK`:

```json
[
  {
    "uid": "5b7f5d7d-2c0f-4d4d-8b44-3dbb1cbd39f1",
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
  "name": "홍길동",
  "phone": "010-1234-5678",
  "workType": "직접 고용",
  "team": "직접 고용 A팀",
  "supervisor": "관리자 A"
}
```

Response `200 OK`: `WorkerRegistration`

### Delete Worker Registration

`DELETE /api/admin/worker-registrations/{phone}`

Path params:

- `phone`: URL encoded phone number, 예: `010-1234-5678`

Response `200 OK`: empty body

Errors:

- `404 Not Found`: 등록 정보 없음

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

### Dashboard Data

`GET /api/dashboard/worker`

예정 역할:

- 근무 일정
- 안전 수칙 상태
- QR 지급 상태
- 날씨 및 작업 지침
- 설치 공정 상태

현재 대시보드의 정적 표시 데이터는 API 계약이 확정되는 순서대로 교체합니다.
