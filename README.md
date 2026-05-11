# Safety Control System Web

SafetyControl 화면 프로토타입 저장소입니다. 현재 단계에서는 실제 API,
Firebase, Google Sheets 연결 없이 GitHub Pages에서 확인 가능한 정적 데모를
관리합니다.

## GitHub Pages

- Demo Hub: [https://harrypark9494.github.io/Safety-Control-System-Web-/](https://harrypark9494.github.io/Safety-Control-System-Web-/)
- Log in Demo: [https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/)
- Dashboard Demo: [https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/)

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
   │  └─ auth-client.js
   └─ dashboard/
      ├─ index.html
      ├─ styles.css
      ├─ app.js
      └─ dashboard-data.js
```

## Demo Pages

| Demo | Local path | GitHub Pages |
| --- | --- | --- |
| Demo Hub | `index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/) |
| Log in Demo | `demos/login/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/) |
| Dashboard Demo | `demos/dashboard/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/) |

## Current Demo Scope

- Log in Demo: 일반 사용자 등록/로그인과 관리자 mock Google 로그인 흐름
- Dashboard Demo: 사용자 정보, 현장 날씨, 오늘 할 일, 안전 알림을 목업 데이터로 표시

실제 Firebase, 날씨 API, 작업 데이터 API 연결은 별도 단계에서 진행합니다.
