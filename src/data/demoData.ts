import type { DemoWorkerAccount } from "../types";

export const workTypeOptions = ["직접 고용", "외부 고용"] as const;

export const demoWorkers: DemoWorkerAccount[] = [
  {
    label: "직접 고용 계정",
    uid: "worker-direct-demo",
    name: "직접 고용 작업자",
    phone: "010-0000-0000",
    code: "123456",
    password: "safety1234",
    workType: "직접 고용",
    team: "직접 고용 A팀",
    supervisor: "관리자 A",
    payrollDocumentStatus: "missing",
  },
  {
    label: "외부 고용 계정",
    uid: "worker-partner-demo",
    name: "외부 고용 작업자",
    phone: "010-0000-0001",
    code: "123456",
    password: "partner1234",
    workType: "외부 고용",
    team: "협력사 B팀",
    supervisor: "관리자 A",
    payrollDocumentStatus: "approved",
  },
];

export const dashboardMetrics = [
  { label: "풍속", value: "7.8 m/s", icon: "≋", tone: "danger" },
  { label: "강수 확률", value: "0%", icon: "☁", tone: "good" },
  { label: "체감 온도", value: "34.5°C", icon: "♨", tone: "warning" },
  { label: "습도", value: "65%", icon: "♢", tone: "warning" },
];

export const scheduleItems = [
  {
    team: "리깅 A팀",
    task: "메인 무대 상부 트러스 리프팅",
    status: "지연",
    time: "11:00 → 14:00",
    progress: 15,
  },
  {
    team: "음향팀",
    task: "메인 L/R 스피커 어레이 세팅",
    status: "진행중",
    time: "09:00 - 13:30",
    progress: 65,
  },
  {
    team: "조명팀",
    task: "스테이지 전면 무빙라이트 배선",
    status: "대기중",
    time: "15:00 - 18:00",
    progress: 0,
  },
];

export const adminStats = [
  { label: "현장 근로자", value: "128명", note: "등록 기준" },
  { label: "체크리스트", value: "92%", note: "전체 점검률" },
  { label: "식권 사용", value: "70.8%", note: "중식 기준" },
  { label: "기상 상태", value: "주의", note: "폭염/풍속 확인" },
];
