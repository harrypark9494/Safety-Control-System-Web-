# Agent Guide

이 문서는 Safety Control System Web 작업을 이어가는 에이전트를 위한 작업 지시서입니다. 공개 README는 폴더 구조와 GitHub Pages 링크 안내에 집중하고, 이 파일은 현재 작업 상태, 제약 조건, 다음 작업 우선순위를 정리합니다.

## Current Direction

현재 단계의 목표는 실제 Firebase 서비스 구현이 아니라 GitHub Pages에서 확인 가능한 정적 UI 데모를 만드는 것입니다.

핵심 방향:

- 루트 페이지는 데모 허브입니다.
- 각 기능 화면은 `/demos/{demo-name}/` 아래에 독립 데모로 둡니다.
- 실제 Firebase, Google Sheets, 외부 API 연동은 아직 하지 않습니다.
- 인증/DB 흐름은 mock `AuthClient`와 mock 데이터로 먼저 표현합니다.
- 실제 앱 코드와 Firebase 연결은 화면 흐름이 정리된 뒤 별도 단계에서 진행합니다.

## Current Repository State

현재 실제 구조:

```text
Safety-Control-System-Web-/
├─ index.html
├─ styles.css
├─ README.md
├─ GUIDE.md
└─ demos/
   └─ login/
      ├─ index.html
      ├─ styles.css
      ├─ app.js
      └─ auth-client.js
```

역할:

- `/index.html`: GitHub Pages 루트에서 열리는 데모 허브
- `/styles.css`: 데모 허브 전용 스타일
- `/README.md`: 폴더 트리와 Pages URL 안내
- `/GUIDE.md`: 에이전트용 작업 지시서
- `/demos/login/`: 로그인 흐름 데모

예전 `main`의 가이드에는 `docs/`, `prototypes/`, `app/`, `mocks/`, `firebase/`, `sheets/`, `decisions/` 구조가 제안되어 있었습니다. 지금은 더 단순한 GitHub Pages 데모 구조를 우선합니다. 필요해질 때만 해당 폴더를 추가합니다.

## Non-Negotiable Rules

- Firebase Emulator를 실행하지 않습니다.
- Firebase SDK를 설치하거나 import하지 않습니다.
- Google Sheets API를 호출하지 않습니다.
- 외부 API, 서버, Cloud Functions, 백엔드 라우트를 만들지 않습니다.
- 실제 개인정보처럼 보이는 데이터를 넣지 않습니다.
- mock 데이터는 화면 흐름을 확인할 만큼만 둡니다.
- 새 데모를 만들면 루트 `index.html` 버튼과 `README.md` 트리를 함께 갱신합니다.

## Login Demo Status

현재 로그인 데모 경로:

- local: `demos/login/index.html`
- Pages: `https://harrypark9494.github.io/Safety-Control-System-Web-/demos/login/`

일반 사용자 흐름:

1. 최초 등록
   - 이름과 근무 유형은 화면에서 직접 입력하지 않습니다.
   - 이름과 근무 유형은 DB에 이미 있다고 가정합니다.
   - 사용자는 연락처로 인증 코드를 받고 비밀번호를 설정합니다.
   - mock DB에 등록된 연락처이면 등록을 승인합니다.
2. 이후 로그인
   - 이름, 연락처, 인증 코드, 비밀번호로 로그인합니다.

관리자 흐름:

- 관리자 탭은 별도 입력 없이 Google 로그인으로 연결되는 구조를 목표로 합니다.
- 현재 데모에서는 prompt 기반 mock Google 로그인을 사용합니다.
- 허용 Workspace가 아니면 차단합니다.

현재 mock 데이터:

- `010-1234-5678` / `홍길동` / `현장 순찰`
- `010-2222-3333` / `김안전` / `장비 작업`
- 인증 코드: `123456`
- 관리자 mock Workspace: `safetycontrol.local`

## Immediate To Do

우선순위 높은 다음 작업입니다.

- [ ] 로그인 성공 후 이동할 데모 목적지를 정합니다.
  - 일반 사용자: 공통 대시보드 데모
  - 관리자: 관리자 대시보드 데모
- [ ] `/demos/dashboard/` 공통 대시보드 데모를 만듭니다.
- [ ] `/demos/admin-dashboard/` 관리자 대시보드 데모를 만듭니다.
- [ ] 루트 데모 허브에 Dashboard Demo, Admin Dashboard Demo 버튼을 추가합니다.
- [ ] README의 Folder Tree와 Demo Pages 표를 새 데모 기준으로 갱신합니다.
- [ ] 로그인 데모에서 성공 시 실제 이동 대신 mock 이동 메시지 또는 데모 링크 버튼을 보여줄지 결정합니다.

## Next Design Decisions

아직 결정이 필요한 항목입니다. 구현 전에 사용자에게 확인하거나 별도 문서로 정리합니다.

- 일반 사용자 대시보드에서 보여줄 핵심 정보
- 관리자 대시보드에서 관리할 항목
- 사용자 DB의 실제 컬럼
- 사용자의 근무 유형 분류 기준
- 관리자 Workspace 허용 기준
- 인증 코드 발송 방식
- 비밀번호 저장 방식
- 로그인 후 세션 유지 방식
- GitHub Pages 데모 구조를 계속 쓸지, 나중에 `docs/` 배포 구조로 전환할지

## Deferred Integration Work

아래 작업은 UI 데모가 정리된 뒤 진행합니다. 현재 단계에서 구현하지 않습니다.

- Firebase 프로젝트 생성
- Firebase Authentication 설정
- Google 로그인 Provider 설정
- Firebase Hosting 설정
- Google Sheets 문서 생성
- Google Sheets API 접근 방식 설계
- Cloud Functions 또는 백엔드 중계 필요 여부 검토
- Firestore 또는 별도 DB 필요 여부 검토
- 실제 보안 규칙과 권한 정책 설계

## Future Folder Candidates

필요해질 때만 추가합니다.

- `/mocks`: 여러 데모가 공유할 mock 데이터
- `/decisions`: 구조와 설계 결정 기록
- `/firebase`: Firebase 연결 설계 문서
- `/sheets`: Google Sheets 스키마 문서
- `/app`: 실제 제품 코드
- `/prototypes`: 폐기 또는 비교용 실험 화면

현재는 로그인 데모 하나만 있으므로, mock 데이터는 `demos/login/auth-client.js` 안에 둡니다. 두 개 이상의 데모가 같은 데이터를 공유하게 되면 `/mocks`로 분리합니다.

## Suggested Work Order

1. 현재 로그인 데모를 유지하면서 이동 대상만 정리합니다.
2. 공통 대시보드 데모를 정적 화면으로 만듭니다.
3. 관리자 대시보드 데모를 정적 화면으로 만듭니다.
4. 로그인 성공 흐름을 각 데모 페이지로 연결합니다.
5. mock 데이터가 중복되면 `/mocks`로 분리합니다.
6. 사용자 DB 스키마와 관리자 권한 기준을 문서화합니다.
7. 이후 Firebase/Sheets real 구현 단계를 시작합니다.

## Verification Checklist

작업 후 최소 확인 항목:

- [ ] `demos/login/app.js` 문법 검사
- [ ] 새로 만든 JS 파일 문법 검사
- [ ] 루트 `index.html`에서 모든 데모 링크가 상대 경로로 연결되는지 확인
- [ ] README의 Pages URL이 실제 경로와 일치하는지 확인
- [ ] Firebase SDK 또는 Emulator 관련 코드가 추가되지 않았는지 확인
