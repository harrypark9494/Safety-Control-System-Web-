# Safety Control System Web

SafetyControl 화면 프로토타입 저장소입니다. 현재 단계에서는 실제 API,
Firebase, Google Sheets 연결 없이 GitHub Pages에서 확인 가능한 정적 데모를
관리합니다.

## GitHub Pages

[![Demo Hub](https://img.shields.io/badge/Demo%20Hub-Open-2f8f5b?style=flat-square)](https://harrypark9494.github.io/Safety-Control-System-Web-/)
[![Login Demo](https://img.shields.io/badge/Login%20Demo-Open-2f8f5b?style=flat-square)](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/)
[![Dashboard Demo](https://img.shields.io/badge/Dashboard%20Demo-Open-2f8f5b?style=flat-square)](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/)
[![Payroll Documents Demo](https://img.shields.io/badge/Payroll%20Documents%20Demo-Open-d97706?style=flat-square)](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/?demo=1)
[![Admin Desktop Demo](https://img.shields.io/badge/Admin%20Desktop%20Demo-Open-061527?style=flat-square)](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/admin/)

## Folder Tree

```text
Safety-Control-System-Web-/
├─ index.html
├─ styles.css
├─ README.md
├─ GUIDE.md
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

## Demo Pages

| Demo | Local path | GitHub Pages |
| --- | --- | --- |
| Demo Hub | `index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/) |
| Log in Demo | `demos/login/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/) |
| Dashboard Demo | `demos/dashboard/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/) |
| Admin Desktop Demo | `demos/admin/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/admin/) |
| Payroll Documents Demo | `demos/payroll-documents/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/?demo=1) |

## Current Demo Scope

- Log in Demo: 일반 사용자 등록/로그인과 관리자 mock Google 로그인 흐름
- Dashboard Demo: 워터밤 현장 모바일 관제 UI, 하단 4탭, QR 팝업, 날씨/설치 공정/안전 수칙/프로필 mock 표시
- Admin Desktop Demo: 관리자용 데스크탑 관제 UI, 날씨/스케줄/QR/근로자/안전 수칙/어드민 관리 mock 표시
- Payroll Documents Demo: HR 급여 처리용 기본 정보, 주민등록번호, Kakao 우편번호 주소 검색, 계좌 정보, 신분증/통장 사본 제출 흐름

실제 Firebase, 날씨 API, 작업 데이터 API 연결은 별도 단계에서 진행합니다.

Dashboard Demo의 날씨 데이터는 `demos/dashboard/weather-api.js`에 mock API 레이어로
분리되어 있습니다. 현재는 기상청 단기예보 mock 원천값에 현장 보정 프로필을
적용한 뒤 대시보드에 표시하며, 기상 특보는 별도 채널에서 받은 뒤 위험 등급
상향 조건으로 합산하는 구조만 준비해 두었습니다.

Dashboard Demo는 현재 모바일 우선 화면으로 구성되어 있으며 하단 탭은
`대시보드`, `스케줄`, `안전`, `프로필` 네 가지입니다. QR 코드는 실제 발급값이
아닌 정적 데모용 화면 상태입니다.

## Auth API Adapter

로그인 데모는 `demos/shared/auth/`의 공통 인증 클라이언트를 사용합니다.
기본값은 `mock` 모드라 GitHub Pages에서 바로 동작합니다.

실제 DB 확인 API를 붙일 때는 `demos/shared/auth/auth-config.js`에서 다음 값을
변경합니다.

```js
mode: "api",
apiBaseUrl: "https://your-api.example.com",
```

API 모드에서 호출하는 기본 엔드포인트는 다음과 같습니다.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/auth/worker/code` | 사용자 인증 코드 요청 |
| POST | `/auth/worker/register` | 등록된 사용자 여부 확인, 근무 유형 선택, 최초 비밀번호 설정 |
| POST | `/auth/worker/login` | 등록 사용자 로그인과 근무 유형 선택 |
| POST | `/auth/admin/google` | 관리자 Google 계정 확인 |
| POST | `/worker/payroll-documents` | 급여 지급용 서류 제출 |

각 API는 성공 시 화면에서 사용할 사용자 세션 JSON을 반환하고, 실패 시
`{ "message": "오류 메시지" }` 형태로 반환하면 됩니다.

`workTypeOptions`는 로그인/등록 및 급여 정보 등록 화면의 고용 유형 선택값으로
사용합니다. 현재 mock 값은 `직접 고용`, `외부 고용` 두 가지입니다. 실제
서비스에서는 관리자 페이지에서 수정 가능한 DB 값으로 대체될 예정입니다.

`payrollDocumentRequiredWorkTypes`에 포함된 `직접 고용` 사용자는 최초 등록 또는
로그인 후 급여 정보 등록 화면으로 이동합니다. `외부 고용` 사용자는 대시보드로
이동합니다. 데모에서는 제출 완료 여부를 브라우저 `localStorage`에 저장하므로,
제출 후 같은 브라우저에서는 다시 표시되지 않습니다.
