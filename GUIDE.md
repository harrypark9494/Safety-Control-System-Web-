# Agent Guide

이 문서는 Safety Control System Web 작업 방향을 정리합니다. 현재 목표는 실제
백엔드 연결 전 GitHub Pages에서 확인 가능한 정적 UI 데모를 빠르게 구성하는
것입니다.

## Current Direction

- 루트 페이지는 데모 허브입니다.
- 기능 화면은 `/demos/{demo-name}/` 아래에 독립 데모로 둡니다.
- Firebase, Google Sheets, 외부 API, 서버, Cloud Functions는 아직 실제 연결하지 않습니다.
- 인증 코드는 API 어댑터 구조만 준비하고, 기본 실행 모드는 mock으로 둡니다.
- 데모 데이터는 화면 흐름 확인용 mock 데이터로만 둡니다.

## Current Repository State

```text
Safety-Control-System-Web-/
├─ index.html
├─ styles.css
├─ README.md
├─ GUIDE.md
└─ demos/
   ├─ login/
   ├─ shared/
   │  └─ auth/
   ├─ dashboard/
   └─ payroll-documents/
```

## Dashboard Demo Status

경로:

- local: `demos/dashboard/index.html`
- Pages: `https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/`

현재 표시 항목:

- 모바일 우선 하단 탭: 대시보드, 스케줄, 안전, 프로필
- 대시보드 탭: 워터밤 일정, 식권/생수 QR 진입, 날씨 현황, 무대 설치 공정률, 안전 수칙 요약
- QR 팝업: 정적 데모용 식권/생수 QR 모달
- 스케줄 탭: 현장 설치 타임라인과 작업별 진행률
- 안전 탭: 폭염 경보, 필수 안전 수칙, 현장 비상 연락망
- 프로필 탭: 사용자 연락처, 담당 구역, 알림 설정 진입, 로그아웃 버튼
- 현장 날씨 목업: 기상청 원천 예보값, 현장 보정값, 체감온도, 강수확률, 풍속, 습도

현재 날씨 데이터 구조:

- `demos/dashboard/weather-api.js`가 기상청 mock 원천값, 현장 보정 프로필, 위험 기준을 관리합니다.
- `dashboard-data.js`는 `buildDashboardWeather()` 결과를 워터밤 행사 mock 데이터와 합쳐 하단 탭 화면에 전달합니다.
- 실제 기상청 API 연결 시에는 `weather-api.js`의 `mockKmaForecastResponse`를 API 응답 어댑터로 교체합니다.
- 특보는 일반 날씨 예보와 같은 값으로 섞지 않고 별도 채널에서 받은 뒤, 위험 등급 상향 조건으로만 합산합니다.
- 보정값은 `correctionProfile`에 따로 두며, 원천값과 보정 후 값을 화면에서 구분해 확인할 수 있게 유지합니다.

## Payroll Document Submission Demo Status

경로:

- local: `demos/payroll-documents/index.html`
- Pages: `https://harrypark9494.github.io/Safety-Control-System-Web-/demos/payroll-documents/`

이 화면은 인증 시스템 전체가 아니라, 직접 급여를 지급받는 노동자가 급여/세무
처리에 필요한 정보를 HR 팀에 제출하는 페이지입니다. 현재 단계의 핵심 목표는
실제 저장소나 데이터베이스 구축이 아니라, 로그인 이후 특정 사용자에게 표시될
급여 정보 수집 UI 흐름을 정적 데모로 확인하는 것입니다.

현재 로그인 후 흐름:

```text
최초 등록 또는 로그인 성공
→ mock 사용자 세션 저장
→ `payrollDocumentRequiredWorkTypes`에 포함된 `직접 고용` 사용자이고 제출 기록이 없으면 급여 서류 제출 페이지로 이동
→ 제출 완료 기록이 있거나 대상자가 아니면 대시보드로 이동
```

현재 구현 방식:

- 급여 서류 대상자 판별은 `demos/shared/auth/auth-config.js`의
  `payrollDocumentRequiredWorkTypes` mock 설정으로 처리합니다.
- 현재 mock 고용 유형은 `직접 고용`, `외부 고용` 두 가지이며, `직접 고용`
  계정만 급여 정보 등록 화면으로 이동합니다.
- 제출 완료 여부는 GitHub Pages 정적 데모에 맞춰 브라우저 `localStorage`에 저장합니다.
- 데모 허브에서 급여 정보 등록 화면으로 바로 진입할 때는 `?demo=1` 쿼리로
  mock 사용자 세션을 준비해 GitHub Pages의 새 브라우저 저장소에서도 첫 화면을
  확인할 수 있게 합니다.
- 대시보드에 직접 접근해도 미제출 대상자이면 `demos/payroll-documents/`로 다시 보냅니다.
- 현재 데모에서는 텍스트 입력값과 파일명/크기/형식만 제출 기록에 저장합니다.
- 데모 재테스트나 재제출이 필요하면 대시보드 프로필 탭의 `급여 서류 재제출`을 누릅니다.

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
- 제출 완료 처리는 `localStorage`에 기록하는 mock 동작으로 구현합니다.
- 보관 기간과 파기 기준은 실제 법무/노무 검토 전 확정 문구처럼 쓰지 말고,
  "추후 운영 기준에 따라 명시"하는 가이드 문구로 표현합니다.
- 관리자 열람, 승인, 반려, 파기 이력은 향후 구현 고려사항으로 문서화하되,
  현재 데모에서 관리자 기능까지 만들 필요는 없습니다.

나중에 데이터베이스를 붙일 때는 프론트에 전화번호 목록을 두지 말고, 로그인 API가
사용자별 서류 제출 상태를 내려줘야 합니다.

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

실제 업로드 API를 붙일 때는 `auth-config.js`의
`endpoints.submitPayrollDocuments` 값을 사용하고, 파일은 브라우저에서 Google
Sheets로 직접 보내지 않습니다. Firebase Storage, Cloud Functions, Apps Script
등 서버 측 경계를 둔 후 Sheets에는 파일 URL이나 상태값만 기록하는 방향을
기본값으로 둡니다.

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

## Non-Negotiable Rules

- Firebase Emulator를 실행하지 않습니다.
- Firebase SDK를 설치하거나 import하지 않습니다.
- Google Sheets API를 브라우저에서 직접 호출하지 않습니다.
- 외부 날씨 API를 호출하지 않습니다.
- 기상 특보 데이터를 일반 예보 mock에 직접 섞지 않습니다.
- 실제 API URL이 정해지기 전까지 `auth-config.js`의 기본 모드는 `mock`으로 유지합니다.
- 서버나 백엔드 라우터를 만들지 않습니다.
- 실제 개인정보처럼 보이는 데이터는 넣지 않습니다.
- 급여/세무 서류 제출 데모에서도 실제 주민등록번호, 계좌번호, 신분증 이미지,
  통장 이미지, 실명 기반 파일명을 넣지 않습니다.
- 새 데모를 만들면 루트 `index.html` 링크와 `README.md` 데모 표를 함께 갱신합니다.

## Suggested Next Work

1. 로그인 성공 후 어느 대시보드로 이동할지 역할별 목적지를 확정합니다.
2. 일반 사용자 대시보드와 관리자 대시보드를 분리할지 결정합니다.
3. 사용자 DB 컬럼, 작업 상태 값, 날씨 위험 등급 기준을 문서화합니다.
4. 실제 API 연결 단계에서 `dashboard-data.js`를 API 응답 어댑터로 교체합니다.
5. 실제 API 연결 단계에서 급여 서류 제출 상태를 로그인 API 응답과 제출 API로 교체합니다.
