# Safety Control System Web

SafetyControl 풀스택 작업 저장소입니다. 현재 실제 앱 경로는 Vite + React +
TypeScript 프론트엔드와 NestJS 백엔드를 기준으로 개발하며, 정적 데모는
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

## Temporary Test Site Policy

GitHub Pages 또는 로컬 정적 서버로 확인할 수 있는 임시 테스트 사이트는 GitHub에 함께 올릴 수 있습니다. 단, 테스트 사이트에 포함되는 데이터는 실제 계정, 연락처, 주민등록번호, 계좌번호, 파일 원본, 토큰, 서비스 계정 키를 사용하지 않고 마스킹된 샘플 값만 사용합니다.

공개 가능한 로컬 테스트 설정은 루트 `.env.local`에 두고 GitHub에 포함합니다. 이 저장소에서는 다른 PC에서도 같은 관리자/근로자 테스트 화면을 재현하는 것이 목표이므로, 이 파일은 일반적인 개인 비밀값 파일이 아니라 공유용 로컬 테스트 fixture입니다. 실제 배포용 `.env`, 비밀키, 서비스 계정, 운영 토큰은 계속 GitHub에 올리지 않습니다.

| File pattern | GitHub policy | Allowed contents |
| --- | --- | --- |
| `.env.local` | Commit | 로컬 관리자 우회, 개발 포트, 마스킹된 테스트 근로자 시드 |
| `.env` | Do not commit | 배포용 환경 변수, 운영 API key, 실제 토큰 |
| `*.secret`, `*.secrets`, service account JSON | Do not commit | 비밀키, 서비스 계정, 장기 인증 정보 |

공유되는 `.env.local` 파일에는 실제 계정, 실제 연락처, 운영 Firebase 설정, Google 서비스 계정, 운영 DB 접속 정보, 원본 파일 경로를 넣지 않습니다. 이런 값이 필요해지면 `.env` 또는 Git에 올리지 않는 별도 로컬 파일에 둡니다.

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

로컬 테스트의 공식 실행 경로는 최신 Git 기준의 `dev:local-test`입니다.
다른 PC에서도 같은 화면을 재현할 수 있도록 공개 가능한 로컬 테스트 설정은
루트 `.env.local`에 두고 Git에 포함합니다.
실제 배포용 `.env`, 비밀키, 서비스 계정, 운영 토큰은 계속 `.gitignore` 정책에
따라 추적하지 않습니다.

실행 전 `3000`과 `8080` 포트가 비어 있어야 합니다. 이미 다른 개발 서버가
떠 있으면 이전 서버의 메모리 상태가 응답할 수 있으므로 종료한 뒤 다시 실행합니다.
관리자 화면의 근로자 목록에 `로컬 근로자`가 보이지 않으면 대부분 기존 `8080`
백엔드가 계속 떠 있는 상태입니다. `npm.cmd run dev:local-test`는 포트가 이미
사용 중이면 새 서버를 띄우지 않고 중단합니다.
백엔드는 직접 실행해도 루트 `.env.local`을 읽어 공유 로컬 근로자를 시드합니다.
따라서 새 서버가 정상 기동했다면 근로자 관리 API에는 `테스트 근로자`와
온보딩 완료 상태의 `로컬 근로자`가 함께 보여야 합니다.

| File | Purpose |
| --- | --- |
| `.env.local` | Vite 로컬 관리자 우회, 프론트/백엔드 포트, 로컬 테스트 근로자 시드 설정 |
| `scripts/dev-local-test.ps1` | 백엔드와 프론트엔드를 함께 실행하는 PowerShell 실행 파일 |

공식 실행:

```powershell
npm.cmd run dev:local-test
```

이 명령은 프론트엔드와 백엔드를 함께 백그라운드로 띄운 뒤 터미널에서 대기합니다.
종료할 때는 `Ctrl+C` 대신 Enter를 한 번 눌러 두 서버를 함께 정리합니다.
서버 로그는 `tmp/dev-local-test/`에 생성되며, 이 폴더는 Git에 올리지 않습니다.

별도 터미널 실행은 백엔드 로그를 직접 보거나 프로세스 기동을 분리해서 확인해야
하는 디버깅용 경로입니다. 이 경우에도 공유 로컬 환경 파일 값을 현재 PowerShell
세션에 올린 뒤 백엔드를 실행하고, 다른 터미널에서 프론트엔드를 실행합니다.

```powershell
Get-Content -Encoding UTF8 .env.local | Where-Object { $_ -and -not $_.StartsWith("#") } | ForEach-Object {
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

| Field | Env key | Shared local value |
| --- | --- | --- |
| 이름 | `LOCAL_TEST_WORKER_NAME` | `로컬 근로자` |
| 연락처 | `LOCAL_TEST_WORKER_PHONE` | `010-9000-0001` |
| 인증 코드 | `LOCAL_TEST_WORKER_CODE` | `123456` |
| 비밀번호 | `LOCAL_TEST_WORKER_PASSWORD` | `local-test-password` |

이 계정은 `외부 고용` / `서류 제출 승인` 상태로 시드되어 근로자 로그인 후
급여 서류 화면이 아니라 대시보드로 바로 진입합니다.
기본 등록 fixture인 `테스트 근로자`는 관리자 원장 확인용이며, 이 공유 로컬 계정이
로그인 가능한 온보딩 완료 테스트 계정입니다.

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
API 연결에 실패하면 프론트엔드는 기본 고용 유형 fallback으로 제출하지 않고,
고용 유형을 불러온 뒤에만 최초 등록과 관리자 고용 유형 관리를 허용합니다.

서류 제출 대상 사용자는 관리자 등록 승인 후 최초 로그인 시 급여 정보 등록 화면으로
이동합니다. 이 판단은 백엔드 로그인 응답의 `payrollDocumentsRequired`와
`payrollDocumentStatus`를 기준으로 처리합니다.
