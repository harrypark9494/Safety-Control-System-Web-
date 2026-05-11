# Agent Guide

이 문서는 Safety Control System Web 작업 방향을 정리합니다. 현재 목표는 실제
백엔드 연결 전 GitHub Pages에서 확인 가능한 정적 UI 데모를 빠르게 구성하는
것입니다.

## Current Direction

- 루트 페이지는 데모 허브입니다.
- 기능 화면은 `/demos/{demo-name}/` 아래에 독립 데모로 둡니다.
- Firebase, Google Sheets, 외부 API, 서버, Cloud Functions는 아직 연결하지 않습니다.
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
   └─ dashboard/
```

## Dashboard Demo Status

경로:

- local: `demos/dashboard/index.html`
- Pages: `https://harrypark9494.github.io/Safety-Control-System-Web-/demos/dashboard/`

현재 표시 항목:

- 사용자 이름, 역할, 연락처, 소속, 담당 관리자, 근무 시간, 현장 위치
- 현장 날씨 목업: 기온, 체감온도, 강수확률, 풍속, 습도, 자외선
- 오늘 할 일 목업: 완료/진행/예정 상태
- 안전 알림 목업: 주의, 확인, 대기 메시지

## Non-Negotiable Rules

- Firebase Emulator를 실행하지 않습니다.
- Firebase SDK를 설치하거나 import하지 않습니다.
- Google Sheets API를 호출하지 않습니다.
- 외부 날씨 API를 호출하지 않습니다.
- 서버나 백엔드 라우터를 만들지 않습니다.
- 실제 개인정보처럼 보이는 데이터는 넣지 않습니다.
- 새 데모를 만들면 루트 `index.html` 링크와 `README.md` 데모 표를 함께 갱신합니다.

## Suggested Next Work

1. 로그인 성공 후 어느 대시보드로 이동할지 역할별 목적지를 확정합니다.
2. 일반 사용자 대시보드와 관리자 대시보드를 분리할지 결정합니다.
3. 사용자 DB 컬럼, 작업 상태 값, 날씨 위험 등급 기준을 문서화합니다.
4. 실제 API 연결 단계에서 `dashboard-data.js`를 API 응답 어댑터로 교체합니다.
