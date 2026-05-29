# Safety Control System Web

SafetyControl 풀스택 작업 저장소입니다. 현재 실제 앱 경로는 Vite + React +
TypeScript 프론트엔드와 Spring Boot 백엔드를 기준으로 개발하며, 정적 데모는
비교용 참고 자료로만 보존합니다.

## GitHub Pages

[![Login Demo](https://img.shields.io/badge/Login%20Demo-Open-2f8f5b?style=flat-square)](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/)
[![Dashboard Demo](https://img.shields.io/badge/Dashboard%20Demo-Open-2f8f5b?style=flat-square)](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/)
[![Payroll Documents Demo](https://img.shields.io/badge/Payroll%20Documents%20Demo-Open-d97706?style=flat-square)](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/?demo=1)
[![Admin Desktop Demo](https://img.shields.io/badge/Admin%20Desktop%20Demo-Open-061527?style=flat-square)](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/admin/)

## Folder Tree

```text
Safety-Control-System-Web-/
├─ README.md
├─ GUIDE.md
├─ package.json
├─ FIREBASE_SETUP.md
├─ firebase.json
├─ firestore.rules
├─ firestore.indexes.json
├─ storage.rules
├─ frontend/
│  ├─ index.html
│  ├─ package.json
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  └─ src/
│     ├─ App.tsx
│     ├─ main.tsx
│     ├─ pages/
│     ├─ features/
│     ├─ data/
│     └─ styles/
├─ backend/
│  ├─ README.md
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ tsconfig.build.json
│  └─ src/
└─ demos/
   ├─ login/
   │  ├─ index.html
   │  ├─ styles.css
   │  ├─ app.js
   ├─ shared/
   │  └─ auth/
   │     ├─ auth-config.js
   │     ├─ auth-client.js
   │     ├─ mock-auth-client.js
   │     ├─ payroll-documents.js
   │     └─ api-auth-client.js
   ├─ dashboard/
   │  ├─ index.html
   │  ├─ styles.css
   │  ├─ app.js
   │  ├─ weather-api.js
   │  └─ dashboard-data.js
   ├─ admin/
   │  ├─ index.html
   │  ├─ styles.css
   │  └─ app.js
   └─ payroll-documents/
      ├─ index.html
      ├─ styles.css
      └─ app.js
```

## Firebase App Pages

| Page | Local path | Hosting path |
| --- | --- | --- |
| Log in | `frontend/src/pages/LoginPage.tsx` | `/`, `/login/` |
| Secure app entry | `frontend/src/App.tsx` | `/s/{sessionToken}` after login |
| Dashboard | `frontend/src/pages/DashboardPage.tsx` | `/s/{sessionToken}` after worker login |
| Admin Desktop | `frontend/src/pages/AdminPage.tsx` | `/s/{sessionToken}` after admin login |
| Payroll Documents | `frontend/src/pages/PayrollDocumentsPage.tsx` | `/s/{sessionToken}` when required after worker login |

## API Contract

프론트엔드와 백엔드는 [API_SPEC.md](API_SPEC.md)를 기준으로 요청/응답 필드명을
맞춥니다. 새 API를 추가하거나 기존 API 응답을 바꾸면 구현과 함께 이 문서를
갱신합니다.

## Preserved Demo Pages

| Demo | Local path | GitHub Pages |
| --- | --- | --- |
| Log in Demo | `demos/login/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/) |
| Dashboard Demo | `demos/dashboard/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/) |
| Admin Desktop Demo | `demos/admin/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/admin/) |
| Payroll Documents Demo | `demos/payroll-documents/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/?demo=1) |

## Preserved Demo Scope

- Log in Demo: 일반 사용자 등록/로그인과 관리자 mock Google 로그인 흐름
- Dashboard Demo: 워터밤 현장 모바일 관제 UI, 하단 4탭, QR 팝업, 날씨/설치 공정/안전 수칙/프로필 mock 표시
- Admin Desktop Demo: 관리자용 데스크탑 관제 UI, 날씨/스케줄/QR/근로자/안전 수칙/어드민 관리 mock 표시
- Payroll Documents Demo: HR 급여 처리용 기본 정보, 주민등록번호, Kakao 우편번호 주소 검색, 계좌 정보, 신분증/통장 사본 제출 흐름

Firebase Hosting 배포 대상은 Vite 빌드 결과인 `frontend/dist/`입니다.
`frontend/src/`는 실제 React/TypeScript 앱 소스이고, `backend/`는 NestJS
백엔드 작업 영역입니다. `demos/`는 기존 UI 비교용으로만 둡니다.

## Root Commands

루트 `package.json`은 `frontend/`와 `backend/`의 npm 작업을 한 번에 실행하는
명령 진입점입니다. 실제 의존성 정의와 lockfile은 각 패키지 디렉터리에 유지합니다.

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run typecheck
```

개발 서버는 각각 별도 터미널에서 실행합니다.

```powershell
npm.cmd run dev:frontend
npm.cmd run dev:backend
```

## Local Test Run

로컬 테스트용 파일은 `.gitignore` 정책에 따라 추적하지 않는 실제 환경 파일로
둡니다.

| File | Purpose |
| --- | --- |
| `frontend/.env.local` | Vite 로컬 관리자 우회와 API 프록시 설정 |
| `backend/.env.local` | 백엔드 포트와 로컬 테스트 근로자 시드 설정 |
| `scripts/dev-local-test.ps1` | 백엔드와 프론트엔드를 함께 실행하는 PowerShell 실행 파일 |

한 번에 실행:

```powershell
npm.cmd run dev:local-test
```

별도 터미널로 실행할 때는 백엔드 환경 파일 값을 현재 PowerShell 세션에 올린 뒤
백엔드를 실행하고, 다른 터미널에서 프론트엔드를 실행합니다.

```powershell
Get-Content backend\.env.local | Where-Object { $_ -and -not $_.StartsWith("#") } | ForEach-Object {
  $name, $value = $_.Split("=", 2)
  Set-Item -Path "Env:$name" -Value $value
}
npm.cmd run dev:backend
```

```powershell
npm.cmd run dev:frontend
```

접속 주소는 `http://localhost:3000/login/`입니다. 관리자는 `관리자` 탭에서
`Google 계정으로 계속` 버튼을 누르면 로컬 관리자 세션으로 바로 진입합니다.

근로자 대시보드 테스트 계정:

| Field | Value |
| --- | --- |
| 이름 | `backend/.env.local`의 `LOCAL_TEST_WORKER_NAME` |
| 연락처 | `backend/.env.local`의 `LOCAL_TEST_WORKER_PHONE` |
| 인증 코드 | `backend/.env.local`의 `LOCAL_TEST_WORKER_CODE` |
| 비밀번호 | `backend/.env.local`의 `LOCAL_TEST_WORKER_PASSWORD` |

이 계정은 `외부 고용` / `서류 제출 승인` 상태로 시드되어 근로자 로그인 후
급여 서류 화면이 아니라 대시보드로 바로 진입합니다.

Dashboard Demo는 현재 모바일 우선 화면으로 구성되어 있으며 하단 탭은
`대시보드`, `스케줄`, `안전`, `프로필` 네 가지입니다. QR 코드는 실제 발급값이
아닌 정적 데모용 화면 상태입니다.

## Firebase Setup

로컬 Firebase CLI에서 프로젝트를 연결한 뒤 배포합니다.

```powershell
npm.cmd run build
firebase use --add
firebase deploy --only hosting,firestore:rules,storage
```

프로젝트 ID를 직접 지정하는 경우:

```powershell
npm.cmd run build
firebase deploy --project YOUR_PROJECT_ID --only hosting,firestore:rules,storage
```

## Auth API Integration

로그인 화면은 `frontend/src/features/auth/session.ts`에서 NestJS `/api`
엔드포인트를 호출합니다. Vite 개발 서버는 `frontend/vite.config.ts`의 proxy로
`/api` 요청을 `http://localhost:8080`에 전달합니다.

고용 유형 선택지는 NestJS `/api/work-types`에서 가져오며, 관리자 화면의
고용 유형 관리에서 활성 여부와 급여/세무 서류 제출 필요 여부를 조절합니다.
`frontend/src/data/workTypes.ts`는 API 연결 실패 시 사용하는 기본 fallback만 둡니다.

서류 제출 대상 사용자는 관리자 등록 승인 후 최초 로그인 시 급여 정보 등록 화면으로
이동합니다. 이 판단은 백엔드 로그인 응답의 `payrollDocumentsRequired`와
`payrollDocumentStatus`를 기준으로 처리합니다.
