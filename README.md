# Safety Control System Web

SafetyControl 화면 프로토타입 저장소입니다. 현재 단계에서는 GitHub Pages에서
확인하던 정적 데모를 Vite + React + TypeScript + Firebase 기반 실사용 구조로
전환하기 위한 준비를 시작했습니다.

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
│  ├─ build.gradle
│  ├─ settings.gradle
│  ├─ gradlew
│  ├─ gradlew.bat
│  ├─ gradle/
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
| Secure app entry | `frontend/src/App.tsx` | `/app/` |
| Dashboard | `frontend/src/pages/DashboardPage.tsx` | `/app/` after worker login |
| Admin Desktop | `frontend/src/pages/AdminPage.tsx` | `/app/` after admin login |
| Payroll Documents | `frontend/src/pages/PayrollDocumentsPage.tsx` | `/app/` when required after worker login |

## Preserved Demo Pages

| Demo | Local path | GitHub Pages |
| --- | --- | --- |
| Log in Demo | `demos/login/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/) |
| Dashboard Demo | `demos/dashboard/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/) |
| Admin Desktop Demo | `demos/admin/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/admin/) |
| Payroll Documents Demo | `demos/payroll-documents/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/?demo=1) |

## Current Demo Scope

- Log in Demo: 일반 사용자 등록/로그인과 관리자 mock Google 로그인 흐름
- Dashboard Demo: 워터밤 현장 모바일 관제 UI, 하단 4탭, QR 팝업, 날씨/설치 공정/안전 수칙/프로필 mock 표시
- Admin Desktop Demo: 관리자용 데스크탑 관제 UI, 날씨/스케줄/QR/근로자/안전 수칙/어드민 관리 mock 표시
- Payroll Documents Demo: HR 급여 처리용 기본 정보, 주민등록번호, Kakao 우편번호 주소 검색, 계좌 정보, 신분증/통장 사본 제출 흐름

Firebase 실사용 전환 기준은 `FIREBASE_SETUP.md`와 `GUIDE.md`를 우선 확인합니다.
Firebase Hosting 배포 대상은 Vite 빌드 결과인 `frontend/dist/`입니다.
`frontend/src/`는 실제 React/TypeScript 앱 소스이고, `backend/`는 Spring Boot
백엔드 작업 영역입니다. `demos/`는 기존 mock 데모 보존용으로 둡니다.

Dashboard의 현재 React 데이터는 `frontend/src/data/demoData.ts`에 mock 데이터로
분리되어 있습니다. 실제 연동 단계에서 Firestore 조회 어댑터로 교체합니다.

Dashboard Demo는 현재 모바일 우선 화면으로 구성되어 있으며 하단 탭은
`대시보드`, `스케줄`, `안전`, `프로필` 네 가지입니다. QR 코드는 실제 발급값이
아닌 정적 데모용 화면 상태입니다.

## Firebase Setup

로컬 Firebase CLI에서 프로젝트를 연결한 뒤 배포합니다.

```powershell
Set-Location .\frontend
npm.cmd run build
Set-Location ..
firebase use --add
firebase deploy --only hosting,firestore:rules,storage
```

프로젝트 ID를 직접 지정하는 경우:

```powershell
Set-Location .\frontend
npm.cmd run build
Set-Location ..
firebase deploy --project YOUR_PROJECT_ID --only hosting,firestore:rules,storage
```

## Auth API Adapter

로그인 화면은 `frontend/src/features/auth/session.ts`의 mock 세션 어댑터를 사용합니다.
Firebase Auth 전환 전까지는 이 어댑터를 fallback으로 유지합니다.

Firebase Web App config는 코드에 직접 넣지 않고 Vite 환경변수로 주입합니다.

```powershell
$env:VITE_FIREBASE_API_KEY="..."
$env:VITE_FIREBASE_AUTH_DOMAIN="..."
$env:VITE_FIREBASE_PROJECT_ID="..."
$env:VITE_FIREBASE_STORAGE_BUCKET="..."
$env:VITE_FIREBASE_APP_ID="..."
```

`workTypeOptions`는 로그인/등록 및 급여 정보 등록 화면의 고용 유형 선택값으로
사용합니다. 현재 mock 값은 `직접 고용`, `외부 고용` 두 가지입니다. 실제
서비스에서는 관리자 페이지에서 수정 가능한 DB 값으로 대체될 예정입니다.

`payrollDocumentRequiredWorkTypes`에 포함된 `직접 고용` 사용자는 최초 등록 또는
로그인 후 급여 정보 등록 화면으로 이동합니다. `외부 고용` 사용자는 대시보드로
이동합니다. 데모에서는 제출 완료 여부를 브라우저 `localStorage`에 저장하므로,
제출 후 같은 브라우저에서는 다시 표시되지 않습니다.
