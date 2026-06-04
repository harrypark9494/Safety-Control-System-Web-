# Agent Guide

이 문서는 Safety Control System Web 작업 방향을 정리합니다. 현재 목표는
GitHub Pages에서 확인하던 정적 UI 데모를 Vite + React + TypeScript
프론트엔드 앱으로 전환하고, 근로자 등록/온보딩 흐름부터 백엔드 API와
연결해 풀스택 개발을 진행하는 것입니다. mock은 테스트나 보존 데모에 필요한
부분으로만 분리합니다.

## Current Direction

- 실제 동작하는 프론트엔드 앱은 Vite + React + TypeScript 기준으로 작성하며,
  소스는 `frontend/src/` 아래에 둡니다.
- 프론트엔드 스택은 Vite + React + TypeScript를 기준으로 합니다.
- 백엔드는 `backend/`의 NestJS 구현을 기준으로 검증합니다.
- 백엔드는 로그인, 권한, 사용자 연동, DB 접근, 민감 데이터 보호를
  담당하며, 프론트엔드가 DB나 민감 외부 API에 직접 접근하지 않게 합니다.
- Firebase 관련 파일은 현재 repo에 남아 있는 전환/배포 검토 산출물입니다. 실제
  운영 백엔드가 확정되면 Firebase Auth, Firestore, Storage 사용
  여부는 별도 결정하고, 브라우저에서 직접 DB성 데이터를 쓰는 구조는 피합니다.
- Firebase Hosting을 계속 사용할 경우에도 배포 대상은 Vite 빌드 결과인
  `frontend/dist/`입니다.
- 정적 HTML/CSS/JS 데모는 실제 앱 소스가 아니라 UI 참고 원본입니다. 모두
  `demos/` 아래에 둡니다.
- 기존 GitHub Pages 비교용 mock 화면은 `/demos/{demo-name}/` 아래에 보존합니다.
- 각 로컬에서 접속해 확인할 수 있는 임시 테스트 사이트는 GitHub에 함께 올릴 수
  있습니다. 단, 실제 계정/연락처/주민등록번호/계좌번호/파일 원본/토큰/서비스
  계정 키를 포함하지 않고 마스킹된 샘플 데이터만 사용합니다.
- Google Sheets를 브라우저에서 직접 호출하지 않습니다.
- 실제 운영 데이터는 프론트엔드 mock 데이터가 아니라 백엔드 API와 운영 DB를 통해
  관리합니다.
- 민감 파일 원본은 프론트엔드 repo나 mock 데이터에 두지 않습니다. 파일 저장소를
  쓰는 경우에도 백엔드 권한 검사를 통과한 뒤 접근하게 합니다.

## GitHub Issue and Commit Guide

에이전트가 커밋 문구를 제안하거나 작업 요약을 정리할 때는 먼저 현재 GitHub
이슈, 최근 커밋 본문, 작업 범위를 확인합니다. `git log --oneline`만 보지 말고
필요하면 `git log --format=%B` 또는 GitHub 이슈 목록을 확인해 제목, 본문 bullet,
`Refs` 사용 방식을 함께 맞춥니다. 커밋 제목은 기본적으로 아래 형식으로 통일합니다.

```text
[#이슈번호] 작업 요약
```

예시:

```text
[#4] 관리자 고용 유형 설정 연동
```

규칙:

- 커밋 제목에는 이번 작업의 대표 이슈 번호 하나만 둡니다.
- 커밋 메시지를 제안할 때는 제목 한 줄만 쓰지 않고, 기본적으로 작업 bullet과
  `Refs #번호`를 포함한 전체 메시지 형태로 작성합니다.
- 여러 이슈에 걸친 작업이면 제목은 가장 직접적인 대표 이슈로 쓰고, 본문에
  `Refs #번호`를 추가합니다.
- 제목의 대표 이슈와 본문의 `Refs`는 항상 같을 필요가 없습니다. 실제 변경이
  여러 이슈 범위에 걸치면 관련 이슈를 여러 줄로 참조합니다.
- 해당 커밋만으로 이슈를 완전히 닫는 것이 확실할 때만 `Fixes #번호`,
  `Closes #번호`를 사용합니다.
- 일부 범위만 처리했거나 연계만 있는 이슈는 `Refs #번호`를 사용합니다.
- 커밋 제목은 `feat:`, `fix:` 같은 prefix보다 `[#번호]` 형식을 우선합니다.
- 사용자가 커밋/푸시는 직접 하므로, 에이전트는 필요한 경우 커밋 메시지와 명령만
  안내합니다.

권장 본문 형식:

```text
[#대표이슈] 작업 요약

- 변경 내용 1
- 변경 내용 2
- 문서/테스트 반영 내용

Refs #연계이슈
```

## Source Ownership

현재 repo는 정적 데모와 실제 앱을 같은 저장소 안에 함께 둡니다. 단, 역할은
명확히 분리합니다.

| Path | Role | Edit 기준 |
| --- | --- | --- |
| `frontend/src/` | 실제 Firebase Hosting에 올라갈 Vite + React + TypeScript 앱 소스 | 신규 기능과 실사용 전환 작업은 여기에서 진행 |
| `frontend/dist/` | `frontend`에서 `npm run build`로 생성되는 Vite 빌드 결과 | 직접 수정하지 않음, Firebase Hosting 배포 대상 |
| `backend/` | NestJS 백엔드 작업 영역 | 같은 `/api` 계약을 Node/NestJS로 재구축 |
| `demos/` | 기존 HTML/CSS/JS 정적 UI 데모와 공개 가능한 임시 테스트 사이트 보존 영역 | UI 비교, 레이아웃 참고, 마스킹된 mock 검증용 |
| `frontend/index.html` | Vite 앱 진입점 | 데모 허브가 아니라 React 앱 mount 파일 |
| root config files | Firebase, 문서, 공통 규칙 설정 | 배포/규칙/프로젝트 방향 관리 |

따라서 새 실사용 화면을 만들 때는 `demos/`에 HTML을 추가하는 방식이 아니라
`frontend/src/pages/`, `frontend/src/features/`, `frontend/src/data/`,
`frontend/src/styles/`를 기준으로 작업합니다.
`demos/`의 파일은 안정화된 UI를 React로 옮길 때 참고하는 원본으로 유지합니다.

## Fullstack Login-First Roadmap

앞으로의 개발은 로그인 시스템을 우선순위 1번으로 두고, 프론트 운영 경로는
백엔드 `/api`를 호출합니다. mock은 정적 데모와 테스트 전용 fixture로만
남깁니다.

API 요청/응답 필드명과 상태값은 루트의 `API_SPEC.md`를 기준으로 맞춥니다.
새 API를 만들거나 응답 필드를 바꾸면 코드 변경과 같은 작업 단위에서
`API_SPEC.md`를 함께 갱신합니다.

권장 단계:

1. 로그인 UI와 사용자 흐름을 확정합니다.
2. 프론트엔드 auth adapter가 `/api` 계약을 호출하게 유지합니다.
3. 관리자 근로자 등록 원장과 근로자 온보딩 상태를 DB 기반으로 관리합니다.
4. 선택한 백엔드 런타임에서 관리자 인증과 관리자 API 보호를 붙입니다.
5. 급여 서류 제출 API와 파일 저장소 권한 검사를 연결합니다.
6. 대시보드 운영 데이터를 API로 단계적으로 교체합니다.

개발 순서:

```text
Frontend + Backend together
→ 로그인 화면은 `/api/worker-registrations`, `/api/auth/worker-login` 호출

Backend persistence
→ 사용자 등록 상태는 서버 저장소를 통해 관리

Test-only mock
→ 테스트 fixture와 `demos/` 보존 화면에만 mock 유지
```

로그인에서 먼저 확정할 항목:

- 관리자와 일반 사용자 역할 구분
- 로그인 성공/실패 상태
- 세션 또는 토큰 저장 위치
- 로그인 후 이동 경로
- 로그아웃 동작

대시보드 클릭 액션에서 먼저 확인할 항목:

- 메뉴 클릭
- 카드 클릭
- 상세 패널 열림
- 상태 변경 버튼
- 모달 또는 페이지 이동

코드 분리 기준:

```text
UI component
→ 화면 표시만 담당

auth service
→ 로그인 요청과 인증 상태 조율 담당

api auth adapter
→ `/api` 백엔드 호출 담당

test auth fixture
→ 테스트 환경에서만 가짜 로그인 또는 응답 fixture 담당
```

운영 경로에서는 mock fallback을 새로 추가하지 않습니다. API가 준비되지 않은
영역은 화면에서 연동 필요 상태를 명확히 표시하고, 테스트에서만 fixture를 둡니다.

## Backend Direction

실제 운영, 관리자 시스템, 사용자 연동, DB 보호가 필요한 조건에서는 브라우저가
직접 DB나 민감 외부 API에 접근하지 않는 별도 백엔드 서버를 둡니다. 현재 구현은
`backend/`의 NestJS 서버이며, `API_SPEC.md` 계약을 먼저 맞춘 뒤 DB, 인증,
파일 권한을 단계적으로 이식합니다.

권장 백엔드 책임:

- 로그인 API와 토큰 또는 세션 발급
- 관리자/일반 사용자 권한 검사
- 사용자, 현장, 급여 서류, 대시보드 데이터 접근 제어
- DB 접속 정보와 외부 API 키 보호
- 민감 정보가 로그, 프론트엔드 번들, 공개 repo에 노출되지 않도록 차단
- 프론트엔드에 필요한 데이터만 선별해서 API로 전달

권장 운영 구조:

```text
Frontend: Vite + React + TypeScript
Backend: NestJS API 서버
Auth: Firebase ID token 검증 + JWT 또는 서버 세션
Database: MySQL 또는 PostgreSQL
Deploy: 정적 프론트 배포 + 백엔드 API 서버 + private DB
```

DB 누수를 막기 위한 기본 원칙:

- 브라우저에서 DB에 직접 접근하지 않습니다.
- 프론트엔드 코드에 DB 주소, DB 계정, 비밀번호, 운영 API key를 넣지 않습니다.
- 운영 DB는 백엔드 서버에서만 접근하게 합니다.
- 관리자 API와 일반 사용자 API는 권한 검사를 분리합니다.
- 로그에는 비밀번호, 토큰, 주민등록번호, 계좌번호, 파일 원본 경로를 남기지 않습니다.
- mock 데이터에도 실제 개인정보처럼 보이는 값을 넣지 않습니다.

## Repository Structure Guide

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
   ├─ shared/
   │  └─ auth/
   ├─ dashboard/
   ├─ admin/
   └─ payroll-documents/
```

위 구조는 앞으로 유지할 기준입니다. `frontend/src/`는 Firebase Hosting에 올라갈
React 앱 소스입니다. `frontend/dist/`는 빌드 결과이며 배포 대상입니다.
`backend/`는 NestJS 백엔드 작업 영역입니다. `demos/`는 기존 GitHub Pages
mock 데모를 보존하는 비교용 폴더입니다. `frontend/index.html`은 React 앱
진입점이므로 데모 허브 역할을 하지 않습니다.

## Dashboard Demo Status

운영 경로:

- source: `frontend/src/pages/DashboardPage.tsx`
- Firebase Hosting: 로그인 후 세션별 opaque 경로(`/s/{sessionToken}`)에서 근로자
  세션 상태에 따라 표시

데모 보존 경로:

- local: `demos/dashboard/index.html`
- Pages: `https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/`

현재 표시 항목:

- 모바일 우선 하단 탭: 대시보드, 스케줄, 안전, 프로필
- 대시보드 탭: 워터밤 일정, 식권/생수 QR 진입, 날씨 현황, 무대 설치 공정률, 안전 수칙 요약
- QR 팝업: 백엔드 `/api/worker/qr-entitlements/today` 응답 기반 식권/생수 QR 모달
- 스케줄 탭: 현장 설치 타임라인과 작업별 진행률
- 안전 탭: 폭염 경보, 필수 안전 수칙, 현장 비상 연락망
- 프로필 탭: 사용자 연락처, 담당 구역, 알림 설정 진입, 로그아웃 버튼
- 현장 날씨 목업: 기상청 원천 예보값, 현장 보정값, 체감온도, 강수확률, 풍속, 습도

현재 날씨 데이터 구조:

- 운영 앱의 로그인/근로자 등록 원장 데이터는 백엔드 API에서 가져옵니다.
- 운영 앱의 식권/생수 QR 지급권은 백엔드 API에서 가져오며, 대시보드는 근로자별
  남은 식권/생수 횟수를 표시합니다.
- `demos/dashboard/` 아래의 `dashboard-data.js`와 `weather-api.js`는 보존 데모
  전용 참고 코드입니다.
- 실제 기상청 API 연결 시에는 브라우저가 직접 외부 API를 호출하지 않고 백엔드
  어댑터를 통해 데이터를 전달받습니다.
- 특보는 일반 날씨 예보와 같은 값으로 섞지 않고 별도 채널에서 받은 뒤, 위험 등급 상향 조건으로만 합산합니다.
- 보정값은 `correctionProfile`에 따로 두며, 원천값과 보정 후 값을 화면에서 구분해 확인할 수 있게 유지합니다.

## Payroll Document Submission Demo Status

운영 경로:

- source: `frontend/src/pages/PayrollDocumentsPage.tsx`
- Firebase Hosting: 로그인 후 세션별 opaque 경로(`/s/{sessionToken}`)에서 급여
  서류 제출 대상자에게 표시

데모 보존 경로:

- local: `demos/payroll-documents/index.html`
- Pages: `https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/`

이 화면은 인증 시스템 전체가 아니라, 직접 급여를 지급받는 노동자가 급여/세무
처리에 필요한 정보를 HR 팀에 제출하는 페이지입니다. 현재 단계의 핵심 목표는
실제 저장소나 데이터베이스 구축이 아니라, 로그인 이후 특정 사용자에게 표시될
급여 정보 수집 UI 흐름을 정적 데모로 확인하는 것입니다.

현재 로그인 후 흐름:

```text
관리자가 근로자 관리에서 근로자 등록
→ 근로자가 최초 회원가입
→ 이름/연락처/고용 유형이 관리자 등록 원장과 일치하는지 대조
→ 온보딩 완료
→ 로그인 성공 후 사용자 세션 저장
→ 고용 유형 설정상 서류 제출 대상이고 제출 기록이 없으면 급여 서류 제출 페이지로 이동
→ 제출 완료 기록이 있거나 대상자가 아니면 대시보드로 이동
```

현재 구현 방식:

- 급여 서류 대상자 판별은 로그인 API 응답의 `payrollDocumentsRequired`와
  `payrollDocumentStatus`를 기준으로 처리합니다.
- 고용 유형은 관리자 화면의 고용 유형 관리 설정에서 추가/활성화하며,
  `payrollDocumentsRequired`가 켜진 유형만 급여 정보 등록 화면으로 이동합니다.
- 제출 완료 여부는 이후 급여 서류 제출 API에서 관리해야 하며, 운영 경로에서
  브라우저 `localStorage`를 원장처럼 쓰지 않습니다.
- 로그인 이후 화면은 URL에 `/dashboard/`, `/payroll-documents/`, `/admin/`을
  직접 노출하지 않고 세션별 opaque 경로(`/s/{sessionToken}`)에서 세션 상태에 따라
  분기합니다.
- 기존 `/app/`, `/dashboard/`, `/payroll-documents/`, `/admin/` 직접 접근은 세션이
  있으면 opaque 경로로 치환합니다. 세션이 없으면 근로자 경로는 `/login/worker/`,
  관리자 경로는 `/login/admin/`로 보냅니다.
- 대시보드 표시 대상이어도 미제출 대상자이면 opaque 경로 안에서 급여 서류 제출
  화면을 먼저 표시합니다.
- 현재 급여 서류 저장 API와 파일 업로드 API는 후속 구현 대상입니다.

현재 표시 항목:

- 로그인 정보에서 선택하는 근무 유형
- 등록 시 적어둔 연락처 확인 영역
- DB에서 내려받을 근무 일정 확인 영역
- 근무 유형 선택 영역
- 주민등록번호 텍스트 입력 영역
- 주소 입력 및 주소 검색 연동 자리
- Kakao/Daum 우편번호 서비스 기반 주소 검색 연동 자리
- 개인정보 수집 동의 체크박스
- 신분증 사본 업로드 영역
- 급여 입금 계좌 정보: 은행명, 예금주, 계좌번호
- 통장 사본 업로드 영역
- 이미지 파일 선택 시 썸네일 미리보기
- PDF 파일 선택 시 파일명, 용량, PDF 표시
- 제출 버튼
- 기본 정보 입력 후 [다음]으로 서류 제출 단계에 진입하는 단계형 입력 흐름

주의사항:

- 이 화면은 "로그인 인증"이나 "본인인증" 화면으로 표현하지 않습니다.
- HR 팀이 급여/세무 처리를 위해 주민등록번호, 계좌번호, 신분증 사본, 통장 사본을
  수집하기 좋은 UI를 우선 구성합니다.
- 보안 절차, 암호화, 접근권한, 보관/파기 정책, 마스킹 등은 이후 단계에서
  추가합니다. 현재 단계에서는 민감정보 수집 자체를 피하는 방향으로 설계를
  되돌리지 않습니다.
- 주민등록번호나 계좌번호 예시는 `000000-0000000`처럼 명백한 placeholder를
  사용할 수 있습니다. 실제 개인정보처럼 보이는 실명, 주민등록번호, 계좌번호,
  이미지 파일명은 mock 데이터에도 넣지 않습니다.
- 지금 단계에서는 업로드 파일을 실제 서버, Firebase Storage, Google Drive,
  Google Sheets 등에 저장하지 않습니다.
- 파일 선택 UI는 브라우저 내부 상태에서만 동작하는 mock으로 구현합니다.
- 주소 검색은 Kakao 우편번호 서비스 스크립트를 우선 사용하고, 정적 데모 환경에서
  스크립트를 불러오지 못하면 placeholder 주소를 넣는 fallback을 둡니다.
- 제출 완료 처리는 백엔드 API와 파일 저장소 연동으로 구현합니다.
- 보관 기간과 파기 기준은 실제 법무/노무 검토 전 확정 문구처럼 쓰지 말고,
  "추후 운영 기준에 따라 명시"하는 가이드 문구로 표현합니다.
- 관리자 열람, 승인, 반려, 파기 이력은 운영 백엔드 권한 검사와 함께 확장합니다.

나중에 데이터베이스를 붙일 때는 프론트에 전화번호 목록을 두지 말고, 로그인 API가
사용자별 서류 제출 상태를 내려줘야 합니다.

DB 영속화 시 1차 운영 데이터는 다음 단위로 분리합니다.

```text
worker_registrations       근로자 원장, 온보딩 상태, 급여 서류 상태
work_type_settings         프로젝트별 고용 유형, 급여 서류 필요 여부
schedule_columns           프로젝트별 스케줄 컬럼
weather_project_settings   프로젝트별 관측 지점, 경보 임계값, 보정 profile
qr_entitlements            프로젝트/근로자별 날짜/QR 유형별 식권·생수 지급권
qr_usage_events            프로젝트와 연결된 실제 QR 스캔 사용 이력
payroll_documents          프로젝트/근로자별 급여/세무 서류 제출 metadata와 검토 상태
```

`worker_registrations`의 근로자 분류 필드는 `category`(고용 유형), `company`(소속 업체),
`team`(팀)으로 분리하며, 담당 역할 용도의 `role` 컬럼은 두지 않습니다.
관리자 운영 데이터는 프로젝트 단위로 묶여 이동하므로 프로젝트 관리와 어드민 계정
같은 workspace-level 데이터를 제외하면 운영 API에서 `projectId`를 필수로 받습니다.
누락 시 기본 프로젝트로 조용히 보정하지 않습니다.
프로젝트가 하나도 없는 pure 상태에서는 관리자 로그인 후 프로젝트 관리 탭으로 바로
이동하고, 첫 프로젝트 생성 모달을 열어 운영 데이터 번들의 기준 프로젝트를 먼저
만들도록 안내합니다.

식권/생수 QR은 근로자 원장에 단순 카운터로만 붙이지 않고, 지급권
`qr_entitlements`와 사용 이벤트 `qr_usage_events`를 분리합니다. 관리자 QR 화면은
사용 이벤트를 집계하고, 근로자 대시보드는 자기 지급권의 남은 횟수만 표시합니다.

## Admin Desktop Demo Status

운영 경로:

- source: `frontend/src/pages/AdminPage.tsx`
- Firebase Hosting: 로그인 후 세션별 opaque 경로(`/s/{sessionToken}`)에서 관리자
  세션 상태에 따라 표시

데모 보존 경로:

- local: `demos/admin/index.html`
- Pages: `https://harrypark9494.github.io/Safety-Control-System-Web-/demos/admin/`

이 화면은 관리자용 데스크탑 관제 페이지입니다. 현재 단계에서는 제공된 시안을
기준으로 화면 구조와 운영 흐름을 유지하되, 근로자 등록 원장과 식권/생수 QR
사용 현황은 백엔드 API에 연결합니다. 작업 데이터 API, 스케줄 API, 관리자 계정
API는 아직 화면 중심 구현입니다.

현재 표시 항목:

- 좌측 고정 사이드바: 대시보드, 기상 정보 관리, 스케줄 관리, 식권/생수 QR 사용 현황, 근로자 관리, 안전 수칙 관리, 어드민 관리
- 대시보드: 긴급 방송 송출 버튼, 기상 데이터, 체크리스트 점검, 현장 오버레이 목업, 공정률 카드
- 기상 정보 관리: 실시간 기상 현황, 24시간 예보, 기상 알림 로그, 관측 지점 관리, 자동 경보 임계값 설정
- 스케줄 관리: 월간 날짜 선택, 선택일 요약, 시간순으로 이어지는 일정 타임라인,
  일정별 담당 팀/장소/선행 조건 확인, 엑셀 내보내기와 일정 추가 진입 버튼
- 식권/생수 QR 사용 현황: 요일/식사 구분 필터, 사용 현황 카드, 시간대별 통계 테이블
- 근로자 관리: 검색/구역 필터, 근로자 목록, 페이지네이션, 등록 인원 카드, 고용 유형 관리,
  서류 제출 필수 대상자의 제출 서류 열람
- 안전 수칙 관리: 요약 카드, 검색/상태 필터, 수칙 목록 테이블
- 어드민 관리: 계정 추가 영역, 등록된 어드민 목록, 계정 추가 모달

현재 구현 방식:

- `frontend/src/pages/AdminPage.tsx`에서 사이드바 메뉴 전환과 관리자 화면 골격을 처리합니다.
- 근로자 등록 원장과 온보딩 상태는 NestJS API를 통해 관리합니다. 현재 저장소는
  메모리 기반이며, 운영 단계에서는 DB 영속화가 필요합니다.
- 식권/생수 QR 사용 현황은 `/api/admin/qr-usage/summary` 응답의 지급량, 사용량,
  잔여량, 시간대별 사용 이력을 표시합니다.
- QR 스캔 처리는 `/api/qr/scan`에서 지급권 잔여 수량을 확인하고 사용 이벤트를
  기록하는 구조로 시작합니다.
- 기상 정보 관리 탭은 `/api/admin/weather` 응답을 읽어 실시간 현황, 24시간 예보,
  기상 알림 로그, 관측 지점, 자동 경보 임계값을 표시합니다. 현재 백엔드는 실제
  기상청 호출 전 단계의 어댑터 placeholder이며, KMA 원천값과 현장 보정값,
  특보 병합 정책을 분리한 응답 구조를 유지합니다.
- 관측 지점 좌표와 자동 경보 임계값은 각각 `/api/admin/weather/station`,
  `/api/admin/weather/thresholds`로 저장합니다. 현재 저장소는 메모리 기반이며,
  운영 단계에서는 DB 영속화와 정확한 KMA 격자 변환, 실제 기상청 API key 관리가
  필요합니다.
- 관리자 화면은 모바일보다 데스크탑 운영 환경을 우선 기준으로 구성합니다.
- 근로자 관리는 관리자가 먼저 근로자 정보를 등록하고, 이후 근로자가 회원가입할
  때 실제 등록 정보와 일치하는지 확인하는 API 흐름을 포함합니다.
- 온보딩이 완료된 근로자 중 고용 유형 설정상 서류 제출 대상자는 최초 로그인 시 급여
  서류 제출 페이지로 먼저 이동합니다.
- 근로자 관리에서 서류 제출 필수 대상자의 제출 서류를 열람할 수 있어야 합니다.
  이 서류에는 주민등록번호, 계좌번호, 신분증/통장 사본 등 민감 개인정보가 포함되므로
  관리자 권한 검사를 통과한 뒤에만 접근합니다.

권장 로그인 응답 필드:

```text
payrollDocumentsRequired: boolean
payrollDocumentsSubmitted: boolean
payrollDocumentStatus: missing | submitted | reviewing | approved | rejected
workType
workSchedule
submittedAt
reviewedAt
retentionUntil
deletedAt
```

실제 Firebase 전환 시 파일은 Firebase Storage의 `payroll/{workerId}/...` 경로에
저장하고, Firestore `payrollDocuments/{workerId}` 문서에는 제출 상태와 파일
metadata만 저장합니다. Google Sheets로 직접 보내지 않습니다.
초기 보안 기준은 `firestore.rules`, `storage.rules`에 둡니다.
서류 원본 열람은 Firebase Storage의 기본 저장 암호화와 접근 규칙을 전제로 하되,
운영 설계에서는 백엔드가 관리자 권한을 검증하고 제한 시간 URL 또는 프록시 응답을
발급하는 흐름을 우선 검토합니다. 브라우저에 원본 Storage 경로, 장기 토큰, 파일
원본 경로를 노출하지 않습니다.

## HTML/CSS Structure Guide

기능 데모는 각각 독립 HTML/CSS를 가지더라도, 같은 역할의 구조는 같은 클래스명을
사용합니다. 새 화면을 만들거나 기존 화면을 수정할 때는 페이지명 중심 클래스보다
공통 구조 클래스와 modifier를 우선 사용합니다.

공통 구조 클래스:

- `app-shell`: 각 데모 화면의 최상위 `<main>` 컨테이너입니다.
- `app-header`: 서비스명 또는 화면 상단 타이틀을 담는 공통 헤더입니다.
- `app-panel`: 로그인, 급여 서류 등록처럼 중앙 입력 패널이 있는 화면의 본문 패널입니다.
- `app-panel--narrow`: 로그인처럼 좁은 패널 폭이 필요한 화면에 붙입니다.
- `app-panel--wide`: 급여 서류 등록처럼 넓은 패널 폭이 필요한 화면에 붙입니다.
- `app-card`: 대시보드 안에서 카드형 UI의 공통 테두리, 배경, 그림자를 담당합니다.

페이지별 의미가 필요한 경우에는 공통 구조 클래스 뒤에 보조 클래스를 붙입니다.

```html
<main class="app-shell">
  <header class="app-header">...</header>
  <section class="app-panel app-panel--narrow">...</section>
</main>
```

```html
<section class="app-card summary-card weather-card">...</section>
```

CSS 작성 기준:

- 같은 시각 속성은 공통 클래스에 둡니다. 예: 카드 테두리, 배경, radius, shadow는
  `app-card`에 둡니다.
- 화면별 차이는 modifier나 보조 클래스에 둡니다. 예: 패널 폭은
  `app-panel--narrow`, `app-panel--wide`로 나눕니다.
- 같은 상태 의미는 같은 상태명으로 유지합니다. 대시보드 탭처럼 현재 선택된
  화면은 `is-active`를 사용합니다.
- 새 색상 hex를 바로 추가하지 말고 먼저 기존 CSS 변수
  `--ink`, `--muted`, `--line`, `--line-strong`, `--panel`, `--field`,
  `--navy`, `--green`, `--orange`, `--red` 중에서 맞는 값을 사용합니다.
- `login-*`, `documents-*`, `dashboard-*`처럼 페이지명을 붙인 클래스는 실제로
  해당 화면에만 필요한 고유 동작이나 레이아웃일 때만 사용합니다.
- 새 대시보드 섹션은 기본적으로 `app-card`를 붙이고, 제목 줄은 가능하면
  `section-title-row` 구조를 재사용합니다.

## Firebase Transition Files

아래 파일은 현재 repo에 남아 있는 Firebase 전환 검토 산출물입니다. NestJS
백엔드 운영 방향에 맞춰, Firebase를 Hosting 용도로만 남길지,
Auth/Firestore/Storage까지 사용할지 별도 결정합니다.

- `firebase.json`: `frontend/dist/` Hosting, Firestore rules, Storage rules 배포 설정
- `firestore.rules`: 관리자/근로자/급여 서류 접근 제어 초안
- `storage.rules`: 급여 파일 업로드 경로와 파일 제한 초안
- `firestore.indexes.json`: Firestore 인덱스 placeholder
- `FIREBASE_SETUP.md`: Firebase 실사용 전환 준비 문서

## Non-Negotiable Rules

- Google Sheets API를 브라우저에서 직접 호출하지 않습니다.
- 외부 날씨 API를 호출하지 않습니다.
- 기상 특보 데이터를 일반 예보 mock에 직접 섞지 않습니다.
- Firebase 프로젝트 ID와 Web App config는 공개 repo에 실서비스 값을 직접 박지 않습니다.
- 운영 경로의 Firebase SDK 또는 백엔드 API 연동에는 무조건적인 mock fallback을 두지 않습니다.
- Cloud Functions가 필요해지기 전까지 브라우저가 직접 민감 외부 API나 Google Sheets를 호출하지 않습니다.
- 운영 DB는 브라우저에서 직접 접근하지 않습니다.
- 프론트엔드 번들에 DB 접속 정보, 운영 API key, 관리자 권한 판단 로직을 넣지 않습니다.
- 실제 개인정보처럼 보이는 데이터는 넣지 않습니다.
- 급여/세무 서류 제출 데모에서도 실제 주민등록번호, 계좌번호, 신분증 이미지,
  통장 이미지, 실명 기반 파일명을 넣지 않습니다.
- 새 정적 데모를 만들면 `README.md` 데모 표를 함께 갱신합니다.
- 새 실사용 화면을 만들면 `frontend/src/App.tsx` 라우팅과 관련
  `frontend/src/pages/` 파일을 함께 갱신합니다.

## Suggested Next Work

1. 관리자 인증을 서버 관리자 인증/인가 정책에 맞춰 연결합니다.
2. 급여 서류 제출 API와 파일 저장소 권한 검사를 구현합니다.
3. 대시보드에서 우선 확인할 클릭 액션 목록을 정하고 API 계약을 작성합니다.
4. 사용자/관리자/급여 서류/대시보드 데이터의 초기 DB 테이블 또는 ERD를 확장합니다.
5. 운영 DB와 파일 저장소는 백엔드 권한 검사를 통과한 경로로만 연결합니다.
