import { Fragment, FormEvent, MouseEvent, useEffect, useState } from "react";
import { MaterialIcon } from "../components/MaterialIcon";
import "../styles/admin.css";
import { fallbackWorkTypes } from "../data/workTypes";
import {
  clearSession,
  createRegisteredWorker,
  deleteRegisteredWorker,
  deleteWorkType,
  getRegisteredWorkers,
  getWorkTypes,
  renameWorkType,
  saveWorkType,
} from "../features/auth/session";
import { navigateTo } from "../features/navigation";
import { formatPhone } from "../features/phone";
import type { PayrollDocumentStatus, WorkerRegistrationAccount, WorkType, WorkTypeSetting } from "../types";

const navItems = [
  ["dashboard", "dashboard", "대시보드"],
  ["weather", "partly_cloudy_day", "기상 정보 관리"],
  ["schedule", "calendar_month", "스케줄 관리"],
  ["qr", "qr_code_scanner", "식권/생수 QR 사용 현황"],
  ["workers", "groups", "근로자 관리"],
  ["rules", "health_and_safety", "안전 수칙 관리"],
  ["admins", "admin_panel_settings", "어드민 관리"],
] as const;

type View = (typeof navItems)[number][0];
type WorkerSortKey = "name" | "phone" | "team" | "workType" | "registrationStatus" | "payrollDocumentStatus";
type SortDirection = "asc" | "desc";
type SafetyRuleStatus = "active" | "draft" | "urgent";
type ScheduleStatus = "confirmed" | "ready" | "risk";

type ScheduleItem = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  team: string;
  location: string;
  owner: string;
  status: ScheduleStatus;
  dependency?: string;
};

type SafetyRule = {
  id: string;
  title: string;
  category: string;
  status: SafetyRuleStatus;
  content: string;
  updatedAt: string;
};

const initialSafetyRules: SafetyRule[] = [
  {
    id: "heat-rest",
    title: "폭염 대비 휴식 수칙",
    category: "기상 상황",
    status: "active",
    content: "야외 현장 근로자는 체감온도 상승 시 50분 작업 후 10분 이상 그늘에서 휴식하고, 물과 전해질을 보충합니다.",
    updatedAt: "2024-05-20",
  },
  {
    id: "electric-check",
    title: "전기 설비 안전 점검",
    category: "시설 인프라",
    status: "active",
    content: "음향 및 조명 타워 주변 누전 차단기, 케이블 피복, 접지 상태를 작업 시작 전과 우천 예보 시 추가 점검합니다.",
    updatedAt: "2024-05-18",
  },
  {
    id: "crowd-response",
    title: "밀집 구역 사고 대응",
    category: "응급 조치",
    status: "draft",
    content: "메인 스테이지 앞 펜스 붕괴 또는 압착 위험 발생 시 가장 가까운 비상 통로를 개방하고 관객 흐름을 분산합니다.",
    updatedAt: "2024-05-22",
  },
];

const scheduleDays = [
  "2026-07-15",
  "2026-07-16",
  "2026-07-17",
  "2026-07-18",
  "2026-07-19",
  "2026-07-20",
  "2026-07-21",
  "2026-07-22",
  "2026-07-23",
  "2026-07-24",
];

const scheduleItems: ScheduleItem[] = [
  {
    id: "stage-foundation",
    date: "2026-07-19",
    startTime: "07:30",
    endTime: "09:30",
    title: "메인 스테이지 하부 고정",
    team: "구조물",
    location: "메인 스테이지",
    owner: "설치 A팀",
    status: "confirmed",
  },
  {
    id: "stage-panel",
    date: "2026-07-19",
    startTime: "09:30",
    endTime: "11:30",
    title: "무대 패널 결합",
    team: "무대",
    location: "메인 스테이지",
    owner: "무대 B팀",
    status: "confirmed",
    dependency: "메인 스테이지 하부 고정",
  },
  {
    id: "lighting-rigging",
    date: "2026-07-19",
    startTime: "11:30",
    endTime: "13:00",
    title: "조명 트러스 러깅",
    team: "조명",
    location: "메인 스테이지 상단",
    owner: "조명 C팀",
    status: "ready",
    dependency: "무대 패널 결합",
  },
  {
    id: "speaker-rigging",
    date: "2026-07-19",
    startTime: "13:30",
    endTime: "15:00",
    title: "스피커 러깅 시작",
    team: "음향",
    location: "좌우 PA 타워",
    owner: "음향 A팀",
    status: "ready",
    dependency: "조명 트러스 러깅",
  },
  {
    id: "laser-module",
    date: "2026-07-19",
    startTime: "15:30",
    endTime: "16:30",
    title: "레이저 모듈 안전 점검",
    team: "특수효과",
    location: "효과 제어 부스",
    owner: "특수효과팀",
    status: "risk",
    dependency: "스피커 러깅 시작",
  },
  {
    id: "gate-fence",
    date: "2026-07-20",
    startTime: "08:00",
    endTime: "10:00",
    title: "입장 게이트 펜스 설치",
    team: "구조물",
    location: "A 게이트",
    owner: "안전 시설팀",
    status: "confirmed",
  },
  {
    id: "video-wall",
    date: "2026-07-20",
    startTime: "10:00",
    endTime: "12:00",
    title: "영상월 전원 테스트",
    team: "영상",
    location: "서브 스테이지",
    owner: "영상 B팀",
    status: "ready",
    dependency: "입장 게이트 펜스 설치",
  },
];

function Bar({ value, color = "navy" }: { value: string; color?: "navy" | "green" | "orange" | "red" | "slate" }) {
  return <i className={`bar bar-${color}`} style={{ "--value": value } as React.CSSProperties & Record<"--value", string>} />;
}

export function AdminPage() {
  const [view, setView] = useState<View>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [workers, setWorkers] = useState<WorkerRegistrationAccount[]>([]);
  const [workTypes, setWorkTypes] = useState<WorkTypeSetting[]>(fallbackWorkTypes);
  const [workerMessage, setWorkerMessage] = useState("");

  function submitAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalMessage("관리자 계정 등록 API 연동이 필요합니다.");
  }

  function logout() {
    clearSession();
    navigateTo("/login/");
  }

  useEffect(() => {
    refreshWorkers();
    refreshWorkTypes();
  }, []);

  async function refreshWorkers() {
    try {
      setWorkers(await getRegisteredWorkers());
      setWorkerMessage("");
    } catch (error) {
      setWorkerMessage(error instanceof Error ? error.message : "근로자 목록을 불러오지 못했습니다.");
    }
  }

  async function refreshWorkTypes() {
    try {
      const nextWorkTypes = await getWorkTypes({ includeDisabled: true });
      if (nextWorkTypes.length > 0) {
        setWorkTypes(nextWorkTypes);
      }
    } catch (error) {
      setWorkerMessage(error instanceof Error ? error.message : "고용 유형 목록을 불러오지 못했습니다.");
    }
  }

  return (
    <>
      <main className="admin-shell">
        <aside className="admin-sidebar" aria-label="관리자 메뉴">
          <div className="brand-block">
            <strong>워터밤 안전 관제 시스템</strong>
            <span>관리자 페이지</span>
          </div>

          <nav className="admin-nav" aria-label="주요 메뉴">
            {navItems.slice(0, 6).map(([id, icon, label]) => (
              <button className={`nav-item ${view === id ? "is-active" : ""}`} type="button" key={id} onClick={() => setView(id)}>
                <MaterialIcon name={icon} className="nav-icon" filled={view === id} />
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className={`nav-item nav-item--admin ${view === "admins" ? "is-active" : ""}`} type="button" onClick={() => setView("admins")}>
              <MaterialIcon name="admin_panel_settings" className="nav-icon" filled={view === "admins"} />
              어드민 관리
            </button>
            <button className="nav-item nav-item--plain" type="button">
              <MaterialIcon name="help" className="nav-icon" />
              도움말
            </button>
            <button className="nav-item nav-item--plain" type="button" onClick={logout}>
              <MaterialIcon name="logout" className="nav-icon" />
              로그아웃
            </button>
          </div>
        </aside>

        <section className="admin-main">
          {view === "dashboard" ? <DashboardView /> : null}
          {view === "weather" ? <WeatherView /> : null}
          {view === "schedule" ? <ScheduleView /> : null}
          {view === "qr" ? <QrView /> : null}
          {view === "workers" ? (
            <WorkersView
              workers={workers}
              workTypes={workTypes}
              message={workerMessage}
              onRefresh={refreshWorkers}
              onRefreshWorkTypes={refreshWorkTypes}
            />
          ) : null}
          {view === "rules" ? <RulesView /> : null}
          {view === "admins" ? <AdminsView onOpen={() => setModalOpen(true)} /> : null}
        </section>
      </main>

      {modalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header>
              <h2 id="modal-title">어드민 계정 추가</h2>
              <button type="button" aria-label="닫기" onClick={() => setModalOpen(false)}>
                <MaterialIcon name="close" />
              </button>
            </header>
            <form className="account-form" onSubmit={submitAdmin}>
              <div className="modal-body">
                <label>이름<input name="name" placeholder="예: 관리자 E" autoComplete="off" required /></label>
                <label>아이디<input name="accountId" placeholder="예: admin_ops_05" autoComplete="off" required /></label>
                <label>비밀번호<span><input name="password" type="password" placeholder="초기 비밀번호 입력" autoComplete="new-password" required /><button type="button" aria-label="비밀번호 보기"><MaterialIcon name="visibility" /></button></span></label>
                <label>권한 설정<select name="role"><option>전체 권한</option><option>운영 권한</option><option>안전 조회</option><option>현장 조회</option></select></label>
                <p><MaterialIcon name="info" />계정 등록 후 초기 비밀번호는 시스템 보안 정책에 따라 즉시 변경을 권장합니다.</p>
                <strong className="modal-message" role="status" aria-live="polite">{modalMessage}</strong>
              </div>
              <footer>
                <button className="light-button" type="button" onClick={() => setModalOpen(false)}>취소</button>
                <button className="dark-button" type="submit">등록하기</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function DashboardView() {
  return (
    <section className="admin-view is-active">
      <header className="page-header">
        <h1>대시보드</h1>
      </header>
      <div className="page-content dashboard-content">
        <button className="emergency-button" type="button"><MaterialIcon name="campaign" filled />긴급 방송 송출</button>
        <div className="dashboard-grid">
          <section className="app-card weather-summary">
            <div className="card-head">
              <h2><MaterialIcon name="monitoring" /> 기상 데이터</h2>
              <strong>킨텍스 제2전시장 일대</strong>
              <em className="status-pill status-good"><MaterialIcon name="check_circle" filled />정상 가동 중</em>
            </div>
            <div className="metric-grid">
              {[
                ["air", "풍속", "4.2", "m/s", "제한: 10m/s", "48%", "navy"],
                ["rainy", "강수량", "0.0", "mm", "제한: 50mm", "12%", "navy"],
                ["device_thermostat", "온도", "28.5", "°C", "주의: 33°C", "78%", "orange"],
                ["humidity_percentage", "습도", "65%", "", "제한: 90%", "74%", "navy"],
              ].map(([icon, label, value, unit, note, bar, color]) => (
                <article className="metric-card" key={label}>
                  <MaterialIcon name={icon} className="metric-icon" />
                  <small>{label}</small>
                  <strong>{value}</strong>
                  {unit ? <b>{unit}</b> : null}
                  <em>{note}</em>
                  <Bar value={bar} color={color as "navy" | "orange"} />
                </article>
              ))}
            </div>
            <div className="heatmap-panel"><span>현장 실시간 위성 데이터 오버레이</span></div>
          </section>

          <section className="app-card checklist-card">
            <div className="card-head"><h2><MaterialIcon name="checklist" />근로자 체크리스트 점검</h2></div>
            <div className="score-list">
              {[["안전모 착용 확인", "98/100", "98%", "green"], ["안전고리 체결 상태", "85/100", "85%", "orange"], ["구역 진입 통제", "45/100", "45%", "red"], ["전기 설비 안전", "92%", "92%", "green"]].map(([title, score, value, color]) => (
                <article key={title}><div><strong>{title}</strong><b>{score}</b></div><Bar value={value} color={color as "green" | "orange" | "red"} /></article>
              ))}
            </div>
            <button className="outline-button" type="button">상세 리포트 확인</button>
          </section>
        </div>

        <section className="app-card stage-card">
          <div className="card-head"><h2><MaterialIcon name="construction" />설치 공정률</h2></div>
          <div className="stage-list">
            {[["STAGE ALPHA", "메인 스테이지 설치", "75%", "navy", "예정 종료일: 07/15"], ["STAGE BRAVO", "워터 캐논 시스템", "40%", "navy", "예정 종료일: 07/18"], ["STAGE CHARLIE", "관객 안전 펜스", "95%", "green", "완료 단계"], ["STAGE DELTA", "운영 부스 배치", "15%", "orange", "착수 초기"]].map(([stage, title, value, color, note]) => (
              <article key={stage}><small>{stage}</small><div><strong>{title}</strong><b>{value}</b></div><Bar value={value} color={color as "navy" | "green" | "orange"} /><em>{note}</em></article>
            ))}
          </div>
        </section>
        <footer className="sync-status"><span />시스템 정상 연동 중 <b>마지막 동기화: 14:32:05</b></footer>
      </div>
    </section>
  );
}

function WeatherView() {
  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--stack"><h1>기상 정보 관리</h1><p>킨텍스 제2전시장 일대</p></header>
      <div className="page-content weather-layout">
        <div className="title-row"><h2>실시간 기상 현황</h2><span>마지막 업데이트: 14:32:05</span></div>
        <div className="weather-current">
          {["풍속 (WIND SPEED)|check_circle|NORMAL|4.2 m/s|42%|green", "강수량 (PRECIPITATION)|warning|CAUTION|12.0 mm|60%|orange", "온도 (TEMPERATURE)|warning|ALERT|31.5 °C|85%|red", "습도 (HUMIDITY)|check_circle|NORMAL|68 %|68%|green"].map((row) => {
            const [label, icon, state, value, bar, color] = row.split("|");
            return <article key={label}><small>{label}</small><em className={`badge ${color}`}><MaterialIcon name={icon} filled />{state}</em><strong>{value}</strong><Bar value={bar} color={color as "green" | "orange" | "red"} /></article>;
          })}
        </div>
        <section className="app-card forecast-card">
          <div className="section-toolbar"><h2>향후 24시간 기상 예보</h2><div><button className="is-active" type="button">Table</button><button type="button">Chart</button></div></div>
          <table><thead><tr><th>시간</th><th>상태</th><th>강수확률</th><th>온도</th><th>풍속</th></tr></thead><tbody>
            {["15:00|sunny|맑음|10%|32°C|3.8m/s", "16:00|partly_cloudy_day|구름조금|15%|31°C|4.1m/s", "17:00|cloud|흐림|40%|29°C|5.5m/s", "18:00|rainy|소나기|85%|26°C|7.2m/s", "19:00|rainy|약한비|60%|25°C|5.0m/s"].map((row) => {
              const [time, icon, status, rain, temp, wind] = row.split("|");
              return <tr className={time === "18:00" ? "danger-row" : ""} key={time}><td>{time}</td><td><span className="weather-state"><MaterialIcon name={icon} />{status}</span></td><td>{rain}</td><td>{temp}</td><td>{wind}</td></tr>;
            })}
          </tbody></table>
        </section>
        <aside className="app-card weather-log-card"><div className="section-toolbar"><h2>기상 알림 로그</h2><button type="button">ALL LOGS</button></div><article className="log danger"><strong>폭염 경보 <span>14:15</span></strong><p>현재 온도 35°C 도달. 현장 작업자 휴식 강제 실시 알림 발송 완료.</p></article><article className="log blue"><strong>강풍 주의 <span>11:02</span></strong><p>풍속 10m/s 이상 감지. 무대 상단 구조물 고정 상태 점검 요청.</p></article></aside>
        <section className="app-card station-card"><div className="section-toolbar"><h2>기상 관측 지점 관리</h2><div className="search-inline"><input type="search" placeholder="관측 지점 검색..." /><button type="button">위치 업데이트</button></div></div><div className="station-grid"><div className="storm-map"><span>킨텍스 제2전시장 (현 위치)</span><em>SOURCE: KOREA METEOROLOGICAL ADMINISTRATION (KMA)</em></div><div className="station-side"><small>현재 좌표 설정</small><label>위도 (Latitude)<input defaultValue="37.6698" /></label><label>경도 (Longitude)<input defaultValue="126.7451" /></label><button className="outline-button" type="button">좌표 수동 입력 저장</button></div></div></section>
        <aside className="app-card threshold-card"><h2>자동 경보 임계값 설정</h2><label>풍속 경보 (M/S)<span><input defaultValue="10" />m/s</span></label><label>강수량 경보 (MM/H)<span><input defaultValue="15" />mm</span></label><label>폭염 경보 (°C)<span><input defaultValue="33" />°C</span></label><button type="button">설정 저장</button></aside>
      </div>
    </section>
  );
}

function ScheduleView() {
  const [selectedDate, setSelectedDate] = useState("2026-07-19");
  const teams = ["구조물", "조명", "무대", "영상", "음향", "특수효과"];
  const hours = Array.from({ length: 14 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);
  const selectedSchedules = scheduleItems
    .filter((item) => item.date === selectedDate)
    .sort((first, second) => first.startTime.localeCompare(second.startTime));
  const firstSchedule = selectedSchedules[0];
  const lastSchedule = selectedSchedules[selectedSchedules.length - 1];

  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions"><h1>스케줄 관리</h1><div><button className="light-button" type="button"><MaterialIcon name="download" />엑셀 내보내기</button><button className="dark-button" type="button"><MaterialIcon name="add" />일정 추가</button></div></header>
      <div className="page-content schedule-board">
        <section className="schedule-overview" aria-label="스케줄 요약">
          <article className="app-card schedule-summary-card">
            <small>선택 날짜</small>
            <strong>{formatScheduleDate(selectedDate)}</strong>
            <span>{firstSchedule && lastSchedule ? `${firstSchedule.startTime} - ${lastSchedule.endTime}` : "등록된 일정 없음"}</span>
          </article>
          <article className="app-card schedule-summary-card">
            <small>등록 일정</small>
            <strong>{selectedSchedules.length} <b>건</b></strong>
            <span>{Array.from(new Set(selectedSchedules.map((item) => item.team))).join(", ") || "배정 전"}</span>
          </article>
          <article className="app-card schedule-summary-card">
            <small>주의 필요</small>
            <strong>{selectedSchedules.filter((item) => item.status === "risk").length} <b>건</b></strong>
            <span>일정 간 선행 조건 확인</span>
          </article>
        </section>

        <div className="date-strip" aria-label="날짜 선택">
          <button type="button" aria-label="이전 날짜"><MaterialIcon name="chevron_left" /></button>
          {scheduleDays.map((date) => (
            <button className={selectedDate === date ? "is-active" : ""} type="button" key={date} onClick={() => setSelectedDate(date)}>
              <span>{formatScheduleDateShort(date)}</span>
              <small>{scheduleItems.filter((item) => item.date === date).length}건</small>
            </button>
          ))}
          <button type="button" aria-label="다음 날짜"><MaterialIcon name="chevron_right" /></button>
        </div>

        <div className="schedule-table-wrap">
          <div className="schedule-grid" aria-label={`${formatScheduleDate(selectedDate)} 스케줄 표`}>
            <div className="grid-head">시간</div>
            {teams.map((team) => <div className="grid-head" key={team}>{team}</div>)}
            {hours.map((hour) => (
              <Fragment key={hour}>
                <div className="time-cell">{hour}</div>
                {teams.map((team) => {
                  const item = selectedSchedules.find((schedule) => schedule.team === team && schedule.startTime.startsWith(hour.slice(0, 2)));
                  return (
                    <div className="schedule-cell" key={`${hour}-${team}`}>
                      {item ? (
                        <article className={`job job--${item.status}`}>
                          <strong>{item.title}</strong>
                          <span>{item.startTime} - {item.endTime}</span>
                          <small>{item.location} · {item.owner}</small>
                          {item.dependency ? <em>{item.dependency} 이후</em> : null}
                        </article>
                      ) : null}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatScheduleDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatScheduleDateShort(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function QrView() {
  return <SimpleTable title="식권/생수 QR 사용 현황" heading="실시간 지급 현황" rows={["13:00 - 14:00|420 건|580 개|피크타임", "12:00 - 13:00|310 건|450 개|정상", "11:00 - 12:00|85 건|320 개|정상"]} />;
}

function WorkersView({
  workers,
  workTypes,
  message,
  onRefresh,
  onRefreshWorkTypes,
}: {
  workers: WorkerRegistrationAccount[];
  workTypes: WorkTypeSetting[];
  message: string;
  onRefresh: () => Promise<void>;
  onRefreshWorkTypes: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [workType, setWorkType] = useState<WorkType>("");
  const [team, setTeam] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const [onboardingFilter, setOnboardingFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [workerSort, setWorkerSort] = useState<{ key: WorkerSortKey; direction: SortDirection }>({ key: "name", direction: "asc" });
  const [formMessage, setFormMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [workTypeModalOpen, setWorkTypeModalOpen] = useState(false);
  const [workTypeListOpen, setWorkTypeListOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerRegistrationAccount | null>(null);
  const [openActionWorkerUid, setOpenActionWorkerUid] = useState("");
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const onboardedCount = workers.filter((worker) => worker.registrationStatus === "onboarded").length;
  const payrollRequiredWorkerCount = workers.filter((worker) => isPayrollDocumentsRequiredWorker(worker, workTypes)).length;
  const nextSortOrder = Math.max(0, ...workTypes.map((option) => option.sortOrder)) + 10;
  const workTypeQuery = workType.trim().toLowerCase();
  const filteredWorkTypes = workTypes.filter((option) => option.label.toLowerCase().includes(workTypeQuery));
  const hasExactWorkType = workTypes.some((option) => option.label === workType.trim());
  const teamOptions = Array.from(new Set(workers.map((worker) => worker.team).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
  const workerTypeOptions = Array.from(new Set([
    ...workTypes.map((option) => option.label),
    ...workers.map((worker) => worker.workType),
  ].filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
  const normalizedWorkerSearch = workerSearch.trim().toLowerCase();
  const workerSearchDigits = normalizedWorkerSearch.replace(/\D/g, "");
  const filteredWorkers = workers.filter((worker) => {
    const phoneDigits = worker.phone.replace(/\D/g, "");
    const matchesSearch = !normalizedWorkerSearch ||
      worker.name.toLowerCase().includes(normalizedWorkerSearch) ||
      worker.phone.toLowerCase().includes(normalizedWorkerSearch) ||
      (workerSearchDigits ? phoneDigits.includes(workerSearchDigits) : false);
    const matchesOnboarding = onboardingFilter === "all" || worker.registrationStatus === onboardingFilter;
    const matchesTeam = teamFilter === "all" || worker.team === teamFilter;
    const matchesWorkerType = workerTypeFilter === "all" || worker.workType === workerTypeFilter;

    return matchesSearch && matchesOnboarding && matchesTeam && matchesWorkerType;
  });
  const sortedWorkers = [...filteredWorkers].sort((current, next) => {
    const currentValue = getWorkerSortValue(current, workerSort.key, workTypes);
    const nextValue = getWorkerSortValue(next, workerSort.key, workTypes);
    const order = currentValue.localeCompare(nextValue, "ko", { numeric: true, sensitivity: "base" });

    if (order !== 0) {
      return workerSort.direction === "asc" ? order : -order;
    }

    return current.name.localeCompare(next.name, "ko", { numeric: true, sensitivity: "base" });
  });

  function resetWorkerFilters() {
    setWorkerSearch("");
    setOnboardingFilter("all");
    setTeamFilter("all");
    setWorkerTypeFilter("all");
  }

  function toggleWorkerSort(key: WorkerSortKey) {
    setWorkerSort((sort) => ({
      key,
      direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc",
    }));
  }

  function getSortAria(key: WorkerSortKey) {
    if (workerSort.key !== key) {
      return "none";
    }

    return workerSort.direction === "asc" ? "ascending" : "descending";
  }

  function getSortMark(key: WorkerSortKey) {
    if (workerSort.key !== key) {
      return "unfold_more";
    }

    return workerSort.direction === "asc" ? "arrow_upward" : "arrow_downward";
  }

  function toggleWorkerActions(workerUid: string, event: MouseEvent<HTMLButtonElement>) {
    if (openActionWorkerUid === workerUid) {
      setOpenActionWorkerUid("");
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 136;
    setActionMenuPosition({
      top: Math.min(window.innerHeight - 148, rect.bottom + 8),
      left: Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth)),
    });
    setOpenActionWorkerUid(workerUid);
  }

  function resetRegistrationForm() {
    setName("");
    setPhone("");
    setWorkType("");
    setTeam("");
    setSupervisor("");
    setWorkTypeListOpen(false);
  }

  async function registerWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedWorkType = workType.trim();

    try {
      if (!workTypes.some((option) => option.label === normalizedWorkType)) {
        await saveWorkType({
          label: normalizedWorkType,
          enabled: true,
          payrollDocumentsRequired: false,
          sortOrder: nextSortOrder,
        });
        await onRefreshWorkTypes();
      }

      await createRegisteredWorker(name, phone, normalizedWorkType, team, supervisor);
      resetRegistrationForm();
      setFormMessage("근로자 등록 정보가 저장되었습니다.");
      setActionMessage("");
      setRegisterModalOpen(false);
      await onRefresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "근로자 등록에 실패했습니다.");
    }
  }

  async function removeWorker(phone: string) {
    try {
      await deleteRegisteredWorker(phone);
      setFormMessage("근로자 등록 정보가 삭제되었습니다.");
      setOpenActionWorkerUid("");
      setSelectedWorker(null);
      await onRefresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "근로자 삭제에 실패했습니다.");
    }
  }

  const openActionWorker = workers.find((worker) => worker.uid === openActionWorkerUid);

  return (
    <>
      <section className="admin-view is-active">
        <header className="page-header page-header--actions">
          <h1>근로자 관리</h1>
          <div>
            <button className="light-button" type="button"><MaterialIcon name="download" />엑셀 다운로드</button>
            <button className="light-button" type="button" onClick={() => setWorkTypeModalOpen(true)}>고용 유형 관리</button>
            <button className="dark-button" type="button" onClick={() => setRegisterModalOpen(true)}><MaterialIcon name="person_add" />근로자 등록</button>
          </div>
        </header>
        <div className="page-content narrow-page admin-tab-page worker-management">
          <section className="app-card search-card">
            <input type="search" value={workerSearch} onChange={(event) => setWorkerSearch(event.target.value)} placeholder="이름 또는 연락처 검색" />
            <select value={onboardingFilter} onChange={(event) => setOnboardingFilter(event.target.value)} aria-label="온보딩 상태">
              <option value="all">온보딩 전체</option>
              <option value="onboarded">온보딩 완료</option>
              <option value="registered">온보딩 대기</option>
            </select>
            <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} aria-label="담당 구역">
              <option value="all">담당 구역 전체</option>
              {teamOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
            <select value={workerTypeFilter} onChange={(event) => setWorkerTypeFilter(event.target.value)} aria-label="고용 유형">
              <option value="all">고용 유형 전체</option>
              {workerTypeOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
            <button type="button" aria-label="필터 초기화" onClick={resetWorkerFilters}><MaterialIcon name="refresh" /></button>
          </section>
          {message || actionMessage ? <p className="admin-message" role="status">{message || actionMessage}</p> : null}
          {formMessage ? <p className="form-message" role="status">{formMessage}</p> : null}

          <section className="app-card data-table-card workers-table">
          <table>
            <thead>
              <tr>
                <th aria-sort={getSortAria("name")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("name")}>이름 <MaterialIcon name={getSortMark("name")} /></button></th>
                <th aria-sort={getSortAria("phone")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("phone")}>연락처 <MaterialIcon name={getSortMark("phone")} /></button></th>
                <th aria-sort={getSortAria("team")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("team")}>담당 구역 <MaterialIcon name={getSortMark("team")} /></button></th>
                <th aria-sort={getSortAria("workType")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("workType")}>고용 유형 <MaterialIcon name={getSortMark("workType")} /></button></th>
                <th aria-sort={getSortAria("registrationStatus")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("registrationStatus")}>온보딩 <MaterialIcon name={getSortMark("registrationStatus")} /></button></th>
                <th aria-sort={getSortAria("payrollDocumentStatus")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("payrollDocumentStatus")}>서류 <MaterialIcon name={getSortMark("payrollDocumentStatus")} /></button></th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedWorkers.length > 0 ? sortedWorkers.map((worker) => (
                <tr key={worker.uid}>
                  <td>
                    <button className="worker-name-button" type="button" onClick={() => setSelectedWorker(worker)}>
                      <span className="avatar">{worker.name.slice(0, 1)}</span>
                      <strong>{worker.name}</strong>
                    </button>
                  </td>
                  <td>{worker.phone}</td>
                  <td><em>{worker.team}</em></td>
                  <td><em className="blue">{worker.workType}</em></td>
                  <td>{worker.registrationStatus === "onboarded" ? <em className="green-text">완료</em> : <em className="orange-text">대기</em>}</td>
                  <td>
                    {isPayrollDocumentsRequiredWorker(worker, workTypes) ? (
                      <em className={getPayrollStatusTone(worker.payrollDocumentStatus)}>{getPayrollStatusLabel(worker.payrollDocumentStatus)}</em>
                    ) : (
                      <em className="gray">대상 아님</em>
                    )}
                  </td>
                  <td className="worker-action-cell">
                    <button
                      className="table-action-menu"
                      type="button"
                      aria-expanded={openActionWorkerUid === worker.uid}
                      aria-haspopup="menu"
                      onClick={(event) => toggleWorkerActions(worker.uid, event)}
                    >
                      관리
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}><p className="empty-table-state">{workers.length > 0 ? "조건에 맞는 근로자가 없습니다." : "등록된 근로자가 없습니다."}</p></td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="table-foot">
            <span>필터 결과 {filteredWorkers.length}명 / 전체 {workers.length}명</span>
            <div className="pagination"><button aria-label="이전 페이지"><MaterialIcon name="chevron_left" /></button><button className="is-active">1</button><button>2</button><button>3</button><button aria-label="다음 페이지"><MaterialIcon name="chevron_right" /></button></div>
          </div>
        </section>

          {openActionWorker ? (
            <div className="worker-actions-popover-layer" onClick={() => setOpenActionWorkerUid("")}>
              <div
                className="worker-actions-menu"
                role="menu"
                style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                onClick={(event) => event.stopPropagation()}
              >
                <button type="button" role="menuitem" onClick={() => { setSelectedWorker(openActionWorker); setOpenActionWorkerUid(""); }}>상세 정보</button>
                <button className="danger" type="button" role="menuitem" onClick={() => removeWorker(openActionWorker.phone)}>삭제</button>
              </div>
            </div>
          ) : null}

          <article className="app-card count-card worker-count-card">
            <MaterialIcon name="groups" filled />
            <div>
              <small>등록 인원</small>
              <strong>{workers.length} 명</strong>
              <small>온보딩 완료 {onboardedCount} 명 · 서류 대상 {payrollRequiredWorkerCount} 명</small>
            </div>
          </article>
        </div>
      </section>

      {selectedWorker ? (
        <WorkerDetailModal
          worker={selectedWorker}
          payrollDocumentsRequired={isPayrollDocumentsRequiredWorker(selectedWorker, workTypes)}
          onClose={() => setSelectedWorker(null)}
        />
      ) : null}

      {registerModalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal worker-modal" role="dialog" aria-modal="true" aria-labelledby="worker-modal-title">
            <header>
              <h2 id="worker-modal-title">근로자 등록</h2>
              <button type="button" aria-label="닫기" onClick={() => setRegisterModalOpen(false)}><MaterialIcon name="close" /></button>
            </header>
            <form className="account-form" onSubmit={registerWorker}>
              <div className="modal-body">
                <label>이름<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" required /></label>
                <label>연락처<input value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} placeholder="010-1234-5678" autoComplete="off" maxLength={13} required /></label>
                <div
                  className="work-type-picker"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setWorkTypeListOpen(false);
                    }
                  }}
                >
                  <label>
                    고용 유형
                    <span className="work-type-input-row">
                      <input
                        value={workType}
                        onChange={(event) => {
                          setWorkType(event.target.value);
                          setWorkTypeListOpen(true);
                        }}
                        onFocus={() => setWorkTypeListOpen(true)}
                        placeholder="예: 단기 아르바이트"
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={workTypeListOpen}
                        aria-controls="work-type-options"
                        maxLength={40}
                        required
                      />
                      <button
                        type="button"
                        aria-label="고용 유형 목록 열기"
                        aria-expanded={workTypeListOpen}
                        onClick={() => setWorkTypeListOpen((open) => !open)}
                      >
                        <MaterialIcon name="arrow_drop_down" />
                      </button>
                    </span>
                  </label>
                  {workTypeListOpen ? (
                    <div className="work-type-picker-panel" id="work-type-options" role="listbox">
                      {filteredWorkTypes.map((option) => (
                        <button
                          className={option.label === workType ? "is-selected" : ""}
                          key={option.label}
                          type="button"
                          role="option"
                          aria-selected={option.label === workType}
                          onClick={() => {
                            setWorkType(option.label);
                            setWorkTypeListOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                      {filteredWorkTypes.length === 0 ? <span className="work-type-empty">일치하는 기존 유형이 없습니다.</span> : null}
                      {workType.trim() && !hasExactWorkType ? <span className="work-type-new">새 유형으로 저장됩니다: {workType.trim()}</span> : null}
                    </div>
                  ) : null}
                </div>
                <label>담당 구역<input value={team} onChange={(event) => setTeam(event.target.value)} placeholder="예: Stage Alpha" autoComplete="off" required /></label>
                <label>담당 관리자<input value={supervisor} onChange={(event) => setSupervisor(event.target.value)} placeholder="예: 관리자 A" autoComplete="off" required /></label>
                <p>새 고용 유형을 입력하면 로그인 선택지에도 함께 추가됩니다.</p>
                {actionMessage ? <strong className="modal-message" role="status">{actionMessage}</strong> : null}
              </div>
              <footer>
                <button className="light-button" type="button" onClick={() => setRegisterModalOpen(false)}>취소</button>
                <button className="dark-button" type="submit">등록 저장</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {workTypeModalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal work-type-modal" role="dialog" aria-modal="true" aria-labelledby="work-type-modal-title">
            <header>
              <h2 id="work-type-modal-title">고용 유형 관리</h2>
              <button type="button" aria-label="닫기" onClick={() => setWorkTypeModalOpen(false)}><MaterialIcon name="close" /></button>
            </header>
            <WorkTypeManager
              workers={workers}
              workTypes={workTypes}
              onRefresh={onRefreshWorkTypes}
              onRefreshWorkers={onRefresh}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}

function WorkerDetailModal({
  worker,
  payrollDocumentsRequired,
  onClose,
}: {
  worker: WorkerRegistrationAccount;
  payrollDocumentsRequired: boolean;
  onClose: () => void;
}) {
  const registrationStatusLabel = worker.registrationStatus === "onboarded" ? "온보딩 완료" : "온보딩 대기";
  const payrollStatusLabel = getPayrollStatusLabel(worker.payrollDocumentStatus);
  const canRequestSecureOpen = payrollDocumentsRequired && worker.payrollDocumentStatus !== "missing";

  return (
    <div className="modal-backdrop">
      <section className="account-modal worker-detail-modal" role="dialog" aria-modal="true" aria-labelledby="worker-detail-title">
        <header>
          <h2 id="worker-detail-title">근로자 상세 정보</h2>
          <button type="button" aria-label="닫기" onClick={onClose}><MaterialIcon name="close" /></button>
        </header>
        <div className="modal-body worker-detail-body">
          <div className="worker-detail-profile">
            <span className="avatar">{worker.name.slice(0, 1)}</span>
            <div>
              <strong>{worker.name}</strong>
              <small>{worker.workType}</small>
            </div>
          </div>
          <dl className="worker-detail-list">
            <div><dt>연락처</dt><dd>{worker.phone}</dd></div>
            <div><dt>담당 구역</dt><dd>{worker.team}</dd></div>
            <div><dt>담당 관리자</dt><dd>{worker.supervisor}</dd></div>
            <div><dt>온보딩 상태</dt><dd>{registrationStatusLabel}</dd></div>
            <div><dt>급여 서류 상태</dt><dd>{payrollDocumentsRequired ? payrollStatusLabel : "대상 아님"}</dd></div>
            <div><dt>등록일</dt><dd>{formatWorkerDate(worker.registeredAt)}</dd></div>
            <div><dt>온보딩 완료일</dt><dd>{worker.onboardedAt ? formatWorkerDate(worker.onboardedAt) : "아직 완료되지 않음"}</dd></div>
          </dl>
          <section className="secure-documents-panel" aria-labelledby="secure-documents-title">
            <div className="secure-documents-head">
              <div>
                <h3 id="secure-documents-title">민감 서류 관리</h3>
                <p>Firebase Storage 원본 경로와 장기 다운로드 토큰은 관리자 화면에 표시하지 않습니다.</p>
              </div>
              <span className={payrollDocumentsRequired ? "status-pill info" : "status-pill"}>{payrollDocumentsRequired ? "서류 대상" : "대상 아님"}</span>
            </div>
            {payrollDocumentsRequired ? (
              <>
                <div className="secure-document-list">
                  {["신분증 사본", "통장 사본"].map((label) => (
                    <article key={label}>
                      <div>
                        <strong>{label}</strong>
                        <small>{canRequestSecureOpen ? "백엔드 권한 확인 후 임시 열람 URL 발급" : "근로자 제출 완료 후 열람 요청 가능"}</small>
                      </div>
                      <button className="light-button" type="button" disabled={!canRequestSecureOpen}>
                        보안 열람 요청
                      </button>
                    </article>
                  ))}
                </div>
                <p className="secure-document-note">
                  운영 구현 시 <code>POST /api/admin/payroll-documents/{"{workerId}"}/files/{"{fileId}"}/open</code>이 관리자 권한과 감사 로그를 확인한 뒤 제한 시간 URL 또는 프록시 응답을 반환해야 합니다.
                </p>
              </>
            ) : (
              <p className="secure-document-note">이 근로자의 고용 유형은 급여/세무 서류 제출 대상으로 설정되어 있지 않습니다.</p>
            )}
          </section>
        </div>
        <footer>
          <button className="dark-button" type="button" onClick={onClose}>확인</button>
        </footer>
      </section>
    </div>
  );
}

function isPayrollDocumentsRequiredWorker(worker: WorkerRegistrationAccount, workTypes: WorkTypeSetting[]) {
  return workTypes.some((workType) => (
    workType.label === worker.workType &&
    workType.enabled &&
    workType.payrollDocumentsRequired
  ));
}

function getWorkerSortValue(worker: WorkerRegistrationAccount, key: WorkerSortKey, workTypes: WorkTypeSetting[]) {
  if (key === "registrationStatus") {
    return worker.registrationStatus === "onboarded" ? "완료" : "대기";
  }

  if (key === "payrollDocumentStatus") {
    return isPayrollDocumentsRequiredWorker(worker, workTypes) ? getPayrollStatusLabel(worker.payrollDocumentStatus) : "대상 아님";
  }

  return worker[key] ?? "";
}

function getPayrollStatusLabel(status: PayrollDocumentStatus) {
  const labels: Record<PayrollDocumentStatus, string> = {
    missing: "미제출",
    submitted: "제출 완료",
    reviewing: "검토 중",
    approved: "승인",
    rejected: "반려",
  };

  return labels[status] ?? status;
}

function getPayrollStatusTone(status: PayrollDocumentStatus) {
  const tones: Record<PayrollDocumentStatus, string> = {
    missing: "orange-text",
    submitted: "blue",
    reviewing: "blue",
    approved: "green-text",
    rejected: "red-text",
  };

  return tones[status] ?? "gray";
}

function formatWorkerDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function WorkTypeManager({
  workers,
  workTypes,
  onRefresh,
  onRefreshWorkers,
}: {
  workers: WorkerRegistrationAccount[];
  workTypes: WorkTypeSetting[];
  onRefresh: () => Promise<void>;
  onRefreshWorkers: () => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [payrollDocumentsRequired, setPayrollDocumentsRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [editingLabel, setEditingLabel] = useState("");
  const [nextLabel, setNextLabel] = useState("");
  const nextSortOrder = Math.max(0, ...workTypes.map((workType) => workType.sortOrder)) + 10;

  async function updateWorkType(workType: WorkTypeSetting, updates: Partial<WorkTypeSetting>) {
    try {
      await saveWorkType({
        label: workType.label,
        enabled: true,
        payrollDocumentsRequired: updates.payrollDocumentsRequired ?? workType.payrollDocumentsRequired,
        sortOrder: updates.sortOrder ?? workType.sortOrder,
      });
      setMessage("고용 유형 설정이 저장되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 설정 저장에 실패했습니다.");
    }
  }

  async function addWorkType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveWorkType({
        label,
        enabled: true,
        payrollDocumentsRequired,
        sortOrder: nextSortOrder,
      });
      setLabel("");
      setPayrollDocumentsRequired(false);
      setMessage("고용 유형이 추가되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 추가에 실패했습니다.");
    }
  }

  async function submitRename(workType: WorkTypeSetting) {
    try {
      const normalized = nextLabel.trim();
      await renameWorkType(workType.label, normalized);
      setEditingLabel("");
      setNextLabel("");
      setMessage("고용 유형 이름이 수정되었습니다.");
      await onRefresh();
      await onRefreshWorkers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 이름 수정에 실패했습니다.");
    }
  }

  async function removeWorkType(workType: WorkTypeSetting) {
    try {
      await deleteWorkType(workType.label);
      setMessage("고용 유형이 삭제되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 삭제에 실패했습니다.");
    }
  }

  return (
    <section className="work-type-card">
      <div className="section-toolbar">
        <h2>고용 유형 관리</h2>
        <span className="count-pill">총 {workTypes.length}개</span>
      </div>
      {message ? <p className="form-message work-type-message" role="status">{message}</p> : null}
      <div className="work-type-list">
        {workTypes.map((workType) => {
          const workerCount = workers.filter((worker) => worker.workType === workType.label).length;
          const isEditing = editingLabel === workType.label;

          return (
            <div className="work-type-row" key={workType.label}>
              <div className="work-type-name-cell">
                {isEditing ? (
                  <input value={nextLabel} onChange={(event) => setNextLabel(event.target.value)} maxLength={40} autoComplete="off" />
                ) : (
                  <strong>{workType.label}</strong>
                )}
                <small>등록 근로자 {workerCount}명</small>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={workType.payrollDocumentsRequired}
                  onChange={(event) => updateWorkType(workType, { payrollDocumentsRequired: event.target.checked })}
                />
                서류 제출 필요
              </label>
              <div className="work-type-actions">
                {isEditing ? (
                  <>
                    <button className="light-button" type="button" onClick={() => submitRename(workType)}>저장</button>
                    <button className="light-button" type="button" onClick={() => { setEditingLabel(""); setNextLabel(""); }}>취소</button>
                  </>
                ) : (
                  <>
                    <button className="light-button" type="button" onClick={() => { setEditingLabel(workType.label); setNextLabel(workType.label); }}>수정</button>
                    <button className="table-action-danger" type="button" disabled={workerCount > 0} onClick={() => removeWorkType(workType)}>삭제</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form className="work-type-add-form" onSubmit={addWorkType}>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="새 고용 유형"
          autoComplete="off"
          maxLength={40}
          required
        />
        <label>
          <input
            type="checkbox"
            checked={payrollDocumentsRequired}
            onChange={(event) => setPayrollDocumentsRequired(event.target.checked)}
          />
          서류 제출 필요
        </label>
        <button className="dark-button" type="submit">추가</button>
      </form>
    </section>
  );
}

function RulesView() {
  const [rules, setRules] = useState<SafetyRule[]>(initialSafetyRules);
  const [ruleSearch, setRuleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SafetyRuleStatus | "all">("all");
  const [editingRule, setEditingRule] = useState<SafetyRule | null>(null);
  const [ruleTitle, setRuleTitle] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");
  const [ruleStatus, setRuleStatus] = useState<SafetyRuleStatus>("active");
  const [ruleContent, setRuleContent] = useState("");
  const [ruleMessage, setRuleMessage] = useState("");
  const normalizedSearch = ruleSearch.trim().toLowerCase();
  const filteredRules = rules.filter((rule) => {
    const matchesSearch = !normalizedSearch ||
      rule.title.toLowerCase().includes(normalizedSearch) ||
      rule.category.toLowerCase().includes(normalizedSearch) ||
      rule.content.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "all" || rule.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const activeRuleCount = rules.filter((rule) => rule.status === "active" || rule.status === "urgent").length;

  function openRuleEditor(rule?: SafetyRule) {
    const targetRule = rule ?? {
      id: "",
      title: "",
      category: "",
      status: "active" as SafetyRuleStatus,
      content: "",
      updatedAt: "",
    };

    setEditingRule(targetRule);
    setRuleTitle(targetRule.title);
    setRuleCategory(targetRule.category);
    setRuleStatus(targetRule.status);
    setRuleContent(targetRule.content);
    setRuleMessage("");
  }

  function closeRuleEditor() {
    setEditingRule(null);
    setRuleTitle("");
    setRuleCategory("");
    setRuleStatus("active");
    setRuleContent("");
  }

  function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const nextRule: SafetyRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      title: ruleTitle.trim(),
      category: ruleCategory.trim(),
      status: ruleStatus,
      content: ruleContent.trim(),
      updatedAt: today,
    };

    setRules((currentRules) => {
      if (editingRule?.id) {
        return currentRules.map((rule) => rule.id === editingRule.id ? nextRule : rule);
      }

      return [nextRule, ...currentRules];
    });
    setRuleMessage(editingRule?.id ? "안전 수칙이 수정되었습니다." : "안전 수칙이 추가되었습니다.");
    closeRuleEditor();
  }

  return (
    <>
      <section className="admin-view is-active">
        <header className="page-header page-header--actions">
          <h1>안전 수칙 관리</h1>
          <div>
            <button className="dark-button" type="button" onClick={() => openRuleEditor()}>
              <MaterialIcon name="add" />안전 수칙 추가
            </button>
          </div>
        </header>
        <div className="page-content narrow-page admin-tab-page rules-management">
          <section className="app-card search-card">
            <input type="search" value={ruleSearch} onChange={(event) => setRuleSearch(event.target.value)} placeholder="수칙 제목, 카테고리, 내용 검색" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SafetyRuleStatus | "all")} aria-label="수칙 상태">
              <option value="all">상태 전체</option>
              <option value="active">활성</option>
              <option value="urgent">긴급</option>
              <option value="draft">초안</option>
            </select>
            <button type="button" aria-label="필터 초기화" onClick={() => { setRuleSearch(""); setStatusFilter("all"); }}><MaterialIcon name="refresh" /></button>
          </section>
          {ruleMessage ? <p className="form-message" role="status">{ruleMessage}</p> : null}
          <section className="rule-summary">
            <article className="app-card"><MaterialIcon name="article" /><small>전체 수칙 수</small><strong>{rules.length} <b>건</b></strong></article>
            <article className="app-card"><MaterialIcon name="published_with_changes" className="green-text" /><small>대시보드 노출 대상</small><strong>{activeRuleCount} <b>건</b></strong></article>
            <article className="app-card danger"><MaterialIcon name="priority_high" /><small>긴급 공지</small><strong>{rules.filter((rule) => rule.status === "urgent").length} <b>건</b></strong></article>
          </section>
          <section className="app-card data-table-card rules-table">
            <table>
              <thead><tr><th>수칙 제목</th><th>카테고리</th><th>상태</th><th>최종 업데이트</th><th>관리</th></tr></thead>
              <tbody>
                {filteredRules.length > 0 ? filteredRules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <button className="rule-title-button" type="button" onClick={() => openRuleEditor(rule)}>
                        <strong>{rule.title}</strong>
                        <small>{rule.content}</small>
                      </button>
                    </td>
                    <td>{rule.category}</td>
                    <td><em className={`state ${getRuleStatusTone(rule.status)}`}>{getRuleStatusLabel(rule.status)}</em></td>
                    <td>{rule.updatedAt}</td>
                    <td><button className="light-button table-inline-button" type="button" onClick={() => openRuleEditor(rule)}><MaterialIcon name="edit_note" />내용 확인/수정</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5}><p className="empty-table-state">조건에 맞는 안전 수칙이 없습니다.</p></td></tr>
                )}
              </tbody>
            </table>
            <div className="table-foot"><span>표시 중: {filteredRules.length} / 전체 {rules.length}개 수칙</span></div>
          </section>
        </div>
      </section>

      {editingRule ? (
        <div className="modal-backdrop">
          <section className="account-modal rule-modal" role="dialog" aria-modal="true" aria-labelledby="rule-modal-title">
            <header>
              <h2 id="rule-modal-title">{editingRule.id ? "안전 수칙 수정" : "안전 수칙 추가"}</h2>
              <button type="button" aria-label="닫기" onClick={closeRuleEditor}><MaterialIcon name="close" /></button>
            </header>
            <form className="account-form" onSubmit={saveRule}>
              <div className="modal-body rule-modal-body">
                <label>제목<input value={ruleTitle} onChange={(event) => setRuleTitle(event.target.value)} placeholder="예: 폭염 대비 휴식 수칙" autoComplete="off" maxLength={80} required /></label>
                <label>카테고리<input value={ruleCategory} onChange={(event) => setRuleCategory(event.target.value)} placeholder="예: 기상 상황" autoComplete="off" maxLength={40} required /></label>
                <label>상태<select value={ruleStatus} onChange={(event) => setRuleStatus(event.target.value as SafetyRuleStatus)}><option value="active">활성</option><option value="urgent">긴급</option><option value="draft">초안</option></select></label>
                <label>내용<textarea value={ruleContent} onChange={(event) => setRuleContent(event.target.value)} placeholder="사용자 대시보드에 표시될 안전 수칙 내용을 입력하세요." rows={8} maxLength={1200} required /></label>
                <p><MaterialIcon name="info" />활성 또는 긴급 상태의 항목은 이후 사용자 대시보드 연동 대상입니다.</p>
              </div>
              <footer>
                <button className="light-button" type="button" onClick={closeRuleEditor}>취소</button>
                <button className="dark-button" type="submit">저장</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function getRuleStatusLabel(status: SafetyRuleStatus) {
  if (status === "urgent") {
    return "긴급";
  }

  if (status === "draft") {
    return "초안";
  }

  return "활성";
}

function getRuleStatusTone(status: SafetyRuleStatus) {
  if (status === "urgent") {
    return "urgent";
  }

  if (status === "draft") {
    return "draft";
  }

  return "on";
}

function AdminsView({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="admin-view is-active">
      <header className="page-header"><h1>어드민 관리</h1></header>
      <div className="page-content narrow-page">
        <section className="app-card admin-add-card"><div className="card-head"><h2><MaterialIcon name="person_add" />어드민 계정 추가</h2></div><button className="dark-button" type="button" onClick={onOpen}><MaterialIcon name="add" />어드민 계정 추가하기</button></section>
        <section className="app-card data-table-card admin-table"><div className="section-toolbar"><h2><MaterialIcon name="list_alt" />현재 등록된 어드민 목록</h2><span className="count-pill">총 4명</span></div><table><thead><tr><th>아이디</th><th>이름</th><th>등록일</th><th>권한</th><th>관리</th></tr></thead><tbody>{["super_admin|관리자 A|2024-01-15|전체 권한", "ops_manager_01|관리자 B|2024-03-22|운영 권한", "safety_inspector_01|관리자 C|2024-05-10|안전 조회", "staff_admin_ops|관리자 D|2024-06-02|운영 권한"].map((row) => { const [id, name, date, role] = row.split("|"); return <tr key={id}><td><MaterialIcon name="account_circle" filled /> <strong>{id}</strong></td><td>{name}</td><td>{date}</td><td><em>{role}</em></td><td><span className="table-icon-actions"><MaterialIcon name="edit" /><MaterialIcon name="delete" /></span></td></tr>; })}</tbody></table></section>
      </div>
    </section>
  );
}

function SimpleTable({ title, heading, rows }: { title: string; heading?: string; rows: string[] }) {
  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions"><h1>{title}</h1><div><button className="light-button" type="button"><MaterialIcon name="download" />엑셀 다운로드</button><button className="dark-button" type="button"><MaterialIcon name="add" />추가</button></div></header>
      <div className="page-content narrow-page admin-tab-page">
        {heading ? <div className="actions-row"><h2>{heading}</h2></div> : null}
        <section className="app-card search-card"><input type="search" placeholder="검색" /><select><option>전체</option></select><button type="button" aria-label="필터"><MaterialIcon name="filter_list" /></button></section>
        <section className="app-card data-table-card">
          <table><thead><tr><th>항목</th><th>구분</th><th>상태</th><th>관리</th></tr></thead><tbody>{rows.map((row) => { const cells = row.split("|"); return <tr key={row}>{cells.map((cell) => <td key={cell}>{cell}</td>)}</tr>; })}</tbody></table>
          <div className="table-foot"><span>표시 중: 1 - {rows.length}</span><div className="pagination"><button aria-label="이전 페이지"><MaterialIcon name="chevron_left" /></button><button className="is-active">1</button><button>2</button><button aria-label="다음 페이지"><MaterialIcon name="chevron_right" /></button></div></div>
        </section>
      </div>
    </section>
  );
}
