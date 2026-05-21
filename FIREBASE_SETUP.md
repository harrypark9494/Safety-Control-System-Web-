# Firebase 실사용 전환 준비

이 문서는 정적 데모를 Vite + React + TypeScript + Firebase Hosting, Firestore,
Storage 기반 실사용 구조로 옮기기 위한 초기 기준입니다.

## 1. Firebase 프로젝트 준비

Firebase Console에서 다음 리소스를 준비합니다.

- Firebase Hosting
- Cloud Firestore
- Firebase Storage
- Authentication

현재 repo에는 프로젝트 ID를 고정하지 않았습니다. 배포할 때는 로컬에서 다음 중
하나를 사용합니다.

```powershell
Set-Location .\frontend
npm.cmd run build
Set-Location ..
firebase use --add
firebase deploy --only hosting,firestore:rules,storage
```

또는 프로젝트 ID를 직접 지정합니다.

```powershell
Set-Location .\frontend
npm.cmd run build
Set-Location ..
firebase deploy --project YOUR_PROJECT_ID --only hosting,firestore:rules,storage
```

## 2. 현재 포함된 Firebase 파일

| File | Purpose |
| --- | --- |
| `firebase.json` | `frontend/dist/` Hosting, Firestore rules, Storage rules 배포 설정 |
| `firestore.rules` | 관리자/근로자/급여 서류 기본 접근 제어 |
| `storage.rules` | 급여 파일 업로드 경로와 파일 제한 |
| `firestore.indexes.json` | Firestore 인덱스 placeholder |

## 2-1. 폴더 역할

| Folder | Role |
| --- | --- |
| `frontend/src/` | React/TypeScript 실제 앱 소스 |
| `frontend/dist/` | Vite 빌드 결과, Firebase Hosting 배포 대상 |
| `backend/` | Spring Boot 백엔드 작업 영역 |
| `demos/` | 기존 GitHub Pages mock 데모 보존용 |
| root | Firebase 설정, 보안 규칙, 프로젝트 문서 |

현재는 안정화된 UI를 React 페이지로 전환해 `frontend/src/`에 둔 상태입니다.
Firebase 연동을 유지하는 경우에도 프론트엔드 코드는 `frontend/src/` 내부에서
관리하고, Spring Boot 백엔드는 `backend/`에서 분리해 진행합니다.
`demos/`는 비교 기준으로 유지합니다.

## 3. 우선 컬렉션 구조

초기 실사용 구조는 다음 컬렉션을 기준으로 시작합니다.

| Collection | Key | Purpose |
| --- | --- | --- |
| `adminUsers` | Firebase Auth uid | 관리자 권한 판별 |
| `workers` | Firebase Auth uid | 근로자 기본 정보, 근무 유형, 일정 |
| `payrollDocuments` | Firebase Auth uid | 급여 서류 제출 상태와 파일 metadata |
| `workTypes` | auto id or slug | 근무 유형 master data |
| `events` | event id | 행사, 일정, 안전/날씨 표시 데이터 |

## 4. 급여 파일 저장 원칙

- 파일 원본은 Storage의 `payroll/{workerId}/...` 아래에 저장합니다.
- Firestore에는 파일 원본이 아니라 `storagePath`, `fileName`, `mimeType`,
  `size`, `uploadedAt` 같은 metadata만 저장합니다.
- 현재 rules는 이미지와 PDF만 허용하고, 파일 크기는 10MB 미만으로 제한합니다.

## 5. 다음 구현 순서

1. Firebase Auth 로그인 방식을 확정합니다.
2. `auth-config.js`의 mock 모드와 Firebase 모드를 병행할 수 있게 분기합니다.
3. 로그인 성공 시 `workers/{uid}` 문서를 조회해 대시보드/급여 서류 라우팅에
   필요한 필드를 구성합니다.
4. 급여 서류 제출 화면에서 Storage 업로드 후 Firestore metadata 저장으로
   바꿉니다.
5. 관리자 화면에서 `workers`, `payrollDocuments`, `workTypes`를 읽는 구조로
   mock 테이블을 교체합니다.
