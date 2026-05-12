# Safety Control System Web

SafetyControl 화면 프로토타입 저장소입니다. 현재 단계에서는 실제 API,
Firebase, Google Sheets 연결 없이 GitHub Pages에서 확인 가능한 정적 데모를
관리합니다.

## GitHub Pages

- Demo Hub: [https://harrypark9494.github.io/Safety-Control-System-Web-/](https://harrypark9494.github.io/Safety-Control-System-Web-/)
- Log in Demo: [https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/)
- Log in Register Link Demo: [https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login-register-link/](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login-register-link/)
- Dashboard Demo: [https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/)
- Payroll Documents Demo: [https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/)

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
   ├─ login-register-link/
   │  ├─ index.html
   │  ├─ styles.css
   │  └─ app.js
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
   │  └─ dashboard-data.js
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
| Log in Register Link Demo | `demos/login-register-link/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login-register-link/) |
| Dashboard Demo | `demos/dashboard/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/) |
| Payroll Documents Demo | `demos/payroll-documents/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/) |

## Current Demo Scope

- Log in Demo: 일반 사용자 등록/로그인과 관리자 mock Google 로그인 흐름
- Log in Register Link Demo: 최초 등록을 일반 로그인 화면 하단 액션으로 배치한 변형 흐름
- Dashboard Demo: 사용자 정보, 현장 날씨, 오늘 할 일, 안전 알림을 목업 데이터로 표시
- Payroll Documents Demo: 급여 지급용 주민등록증 사본과 통장 사본 최초 1회 제출 흐름

실제 Firebase, 날씨 API, 작업 데이터 API 연결은 별도 단계에서 진행합니다.

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
| POST | `/auth/worker/register` | 등록된 사용자 여부 확인 후 최초 비밀번호 설정 |
| POST | `/auth/worker/login` | 등록 사용자 로그인 |
| POST | `/auth/admin/google` | 관리자 Google 계정 확인 |
| POST | `/worker/payroll-documents` | 급여 지급용 서류 제출 |

각 API는 성공 시 화면에서 사용할 사용자 세션 JSON을 반환하고, 실패 시
`{ "message": "오류 메시지" }` 형태로 반환하면 됩니다.

`payrollDocumentRequiredPhones`에 포함된 일반 사용자는 최초 등록 또는 로그인 후
서류 제출 화면으로 이동합니다. 데모에서는 제출 완료 여부를 브라우저
`localStorage`에 저장하므로, 제출 후 같은 브라우저에서는 다시 표시되지 않습니다.
