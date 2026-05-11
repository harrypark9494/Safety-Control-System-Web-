# Safety Control System Web

SafetyControl 웹 화면 프로토타입 저장소입니다. 이 README는 폴더 구조와 GitHub Pages 데모 경로를 빠르게 확인하기 위한 공개 안내 문서입니다.

## GitHub Pages

- Demo Hub: [https://harrypark9494.github.io/Safety-Control-System-Web-/](https://harrypark9494.github.io/Safety-Control-System-Web-/)
- Log in Demo: [https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/)

## Folder Tree

```text
Safety-Control-System-Web-/
├─ index.html
│  └─ GitHub Pages에서 처음 열리는 데모 허브 페이지
├─ styles.css
│  └─ 데모 허브 전용 스타일
├─ README.md
│  └─ 폴더 구조와 Pages 데모 링크 안내
├─ GUIDE.md
│  └─ 에이전트 작업 현황, 제약 조건, 다음 할 일 정리
└─ demos/
   └─ login/
      ├─ index.html
      │  └─ 일반 사용자/관리자 로그인 데모 화면
      ├─ styles.css
      │  └─ 로그인 데모 전용 스타일
      ├─ app.js
      │  └─ 화면 이벤트, 탭 전환, mock 로그인 흐름
      └─ auth-client.js
         └─ 실제 Firebase 연결 전 사용하는 mock AuthClient 구현
```

## Demo Pages

| Demo | Local path | GitHub Pages |
| --- | --- | --- |
| Demo Hub | `index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/) |
| Log in Demo | `demos/login/index.html` | [Open](https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/) |

## Current Demo Scope

Log in Demo는 현재 mock 인증 흐름으로 동작합니다.

- 일반 사용자 최초 등록: 연락처 인증 코드, 비밀번호 설정
- 일반 사용자 로그인: 이름, 연락처, 인증 코드, 비밀번호
- 관리자 로그인: mock Google Workspace 계정 확인

실제 Firebase 연결은 별도 단계에서 진행합니다.
