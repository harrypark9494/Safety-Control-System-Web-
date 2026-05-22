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
- 운영 경로에서 브라우저 `localStorage`를 데이터 원장으로 사용하지 않습니다.
- 민감 정보는 응답에 포함하지 않습니다. 예: `password`, `passwordHash`, 원본 파일 경로.
- 관리자 API는 최종 관리자 인증이 붙기 전까지 개발용으로만 열어둡니다.

## Common Error Shape

향후 모든 API는 아래 응답 형식으로 통일합니다.

```json
{
  "code": "WORKER_REGISTRATION_PENDING",
  "message": "관리자 승인 전입니다.",
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

### WorkType

```text
직접 고용
외부 고용
```

### WorkerRegistrationStatus

```text
pending
approved
rejected
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
  "registrationStatus": "pending",
  "payrollDocumentStatus": "missing",
  "requestedAt": "2026-05-22T08:00:00Z",
  "approvedAt": null,
  "rejectedAt": null
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
  "status": "등록 승인",
  "payrollDocumentsRequired": true,
  "payrollDocumentStatus": "missing"
}
```

## Implemented APIs

### Request Worker Registration

`POST /api/worker-registrations`

로그인 페이지의 최초 등록 요청입니다. 요청이 생성되면 `pending` 상태로 저장되고,
관리자가 실제 등록 인원과 대조한 뒤 승인 또는 반려합니다.

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
  "registrationStatus": "pending",
  "payrollDocumentStatus": "missing",
  "requestedAt": "2026-05-22T08:00:00Z",
  "approvedAt": null,
  "rejectedAt": null
}
```

Errors:

- `400 Bad Request`: 필수 입력 누락 또는 비밀번호 길이 미달
- `409 Conflict`: 이미 승인된 연락처

### Worker Login

`POST /api/auth/worker-login`

승인된 근로자만 로그인할 수 있습니다. `직접 고용`이고 급여 서류가 `missing`이면
프론트엔드는 대시보드보다 급여 서류 제출 화면을 먼저 표시합니다.

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
  "status": "등록 승인",
  "payrollDocumentsRequired": true,
  "payrollDocumentStatus": "missing"
}
```

Errors:

- `401 Unauthorized`: 이름, 연락처, 인증 코드, 비밀번호 불일치
- `403 Forbidden`: 승인 대기 또는 반려 상태
- `404 Not Found`: 등록 정보 없음

### List Worker Registrations

`GET /api/admin/worker-registrations`

관리자 근로자 관리 화면의 등록 요청 및 승인 목록입니다.

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
    "registrationStatus": "pending",
    "payrollDocumentStatus": "missing",
    "requestedAt": "2026-05-22T08:00:00Z",
    "approvedAt": null,
    "rejectedAt": null
  }
]
```

### Approve Worker Registration

`POST /api/admin/worker-registrations/{phone}/approve`

Path params:

- `phone`: URL encoded phone number, 예: `010-1234-5678`

Response `200 OK`: `WorkerRegistration`

Errors:

- `404 Not Found`: 등록 정보 없음

### Reject Worker Registration

`POST /api/admin/worker-registrations/{phone}/reject`

Path params:

- `phone`: URL encoded phone number, 예: `010-1234-5678`

Response `200 OK`: `WorkerRegistration`

Errors:

- `404 Not Found`: 등록 정보 없음

## Planned APIs

### Admin Login

`POST /api/auth/admin-login`

예정 역할:

- 관리자 계정 인증
- 관리자 API 접근 토큰 또는 서버 세션 발급
- `/api/admin/**` 보호

### Submit Payroll Documents

`POST /api/payroll-documents`

예정 역할:

- 직접 고용 근로자의 급여/세무 정보 제출
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
