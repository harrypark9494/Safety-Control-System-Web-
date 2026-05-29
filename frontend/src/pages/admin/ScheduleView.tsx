import { Fragment, useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";

type ScheduleStatus = "confirmed" | "ready" | "risk";
type IsoDateString = `${number}-${number}-${number}`;
type MonthKey = `${number}-${number}`;

type ScheduleItem = {
  id: string;
  date: IsoDateString;
  startTime: string;
  endTime: string;
  title: string;
  team: string;
  location: string;
  owner: string;
  status: ScheduleStatus;
  dependency?: string;
};

const defaultScheduleDate: IsoDateString = "2026-07-19";

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

export function ScheduleView() {
  const [selectedDate, setSelectedDate] = useState<IsoDateString>(defaultScheduleDate);
  const [visibleMonth, setVisibleMonth] = useState<MonthKey>(getMonthKey(defaultScheduleDate));
  const activeDateRef = useRef<HTMLButtonElement | null>(null);
  const teams = ["구조물", "조명", "무대", "영상", "음향", "특수효과"];
  const hours = Array.from({ length: 14 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);
  const monthDays = getMonthDays(visibleMonth);
  const scheduleMonthOptions = Array.from(new Set([...scheduleItems.map((item) => getMonthKey(item.date)), visibleMonth])).sort();
  const selectedSchedules = scheduleItems
    .filter((item) => item.date === selectedDate)
    .sort((first, second) => first.startTime.localeCompare(second.startTime));
  const firstSchedule = selectedSchedules[0];
  const lastSchedule = selectedSchedules[selectedSchedules.length - 1];
  const selectDate = (date: IsoDateString) => {
    setSelectedDate(date);
    setVisibleMonth(getMonthKey(date));
  };
  const moveDate = (offset: number) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + offset);
    selectDate(toIsoDateString(date));
  };

  useEffect(() => {
    activeDateRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDate, visibleMonth]);

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

        <section className="app-card search-card schedule-date-search" aria-label="일정 날짜 이동">
          <input type="date" value={selectedDate} onChange={(event) => selectDate(event.target.value as IsoDateString)} />
          <select value={visibleMonth} onChange={(event) => selectDate(getFirstDateOfMonth(event.target.value as MonthKey))}>
            {scheduleMonthOptions.map((month) => (
              <option value={month} key={month}>{formatScheduleMonth(month)}</option>
            ))}
          </select>
          <button type="button" aria-label="이전 날짜" onClick={() => moveDate(-1)}><MaterialIcon name="chevron_left" /></button>
          <button type="button" aria-label="다음 날짜" onClick={() => moveDate(1)}><MaterialIcon name="chevron_right" /></button>
          <button type="button" aria-label="기본 날짜로 이동" onClick={() => selectDate(defaultScheduleDate)}><MaterialIcon name="refresh" /></button>
        </section>

        <div className="date-strip" aria-label="선택 월 날짜 목록">
          {monthDays.map((date) => (
            <button ref={selectedDate === date ? activeDateRef : null} className={selectedDate === date ? "is-active" : ""} type="button" key={date} onClick={() => selectDate(date)}>
              <span>{formatScheduleDateShort(date)}</span>
              <small>{scheduleItems.filter((item) => item.date === date).length}건</small>
            </button>
          ))}
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

function formatScheduleMonth(value: MonthKey) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(new Date(`${value}-01T00:00:00`));
}

function formatScheduleDateShort(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function getMonthKey(value: IsoDateString): MonthKey {
  return value.slice(0, 7) as MonthKey;
}

function getDayOfMonth(value: IsoDateString) {
  return Number(value.slice(8, 10));
}

function getFirstDateOfMonth(value: MonthKey): IsoDateString {
  return `${value}-01` as IsoDateString;
}

function toIsoDateString(value: Date): IsoDateString {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}` as IsoDateString;
}

function getMonthDays(value: MonthKey) {
  const [year, month] = value.split("-").map(Number);
  const lastDate = new Date(year, month, 0).getDate();

  return Array.from({ length: lastDate }, (_, index) => `${value}-${String(index + 1).padStart(2, "0")}` as IsoDateString);
}
