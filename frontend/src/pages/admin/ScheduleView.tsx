import type { CSSProperties } from "react";
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
  category: string;
  location: string;
  owner: string;
  assignees?: string;
  workAreaGroup?: string;
  status: ScheduleStatus;
  dependency?: string;
};

type ScheduleColumn = {
  label: string;
};

type ScheduleFormState = {
  date: IsoDateString;
  startTime: string;
  endTime: string;
  title: string;
  category: string;
  assignees: string;
  workAreaGroup: string;
};

const defaultScheduleDate: IsoDateString = toIsoDateString(new Date());
const unassignedScheduleColumn = "미배정";
const legacyUnassignedScheduleColumn = "미분류";
const allScheduleColumns = "__all_columns__";
const allScheduleColumnsLabel = "전체 컬럼";

const defaultScheduleColumns: ScheduleColumn[] = [
  { label: "구조물" },
  { label: "조명" },
  { label: "무대" },
  { label: "영상" },
  { label: "음향" },
  { label: "특수효과" },
];

const initialScheduleItems: ScheduleItem[] = [
  {
    id: "stage-foundation",
    date: defaultScheduleDate,
    startTime: "07:30",
    endTime: "09:30",
    title: "메인 스테이지 하부 고정",
    category: "구조물",
    location: "메인 스테이지",
    owner: "설치 A팀",
    status: "confirmed",
  },
  {
    id: "stage-panel",
    date: defaultScheduleDate,
    startTime: "09:30",
    endTime: "11:30",
    title: "무대 패널 결합",
    category: "무대",
    location: "메인 스테이지",
    owner: "무대 B팀",
    status: "confirmed",
    dependency: "메인 스테이지 하부 고정",
  },
  {
    id: "lighting-rigging",
    date: defaultScheduleDate,
    startTime: "11:30",
    endTime: "13:00",
    title: "조명 트러스 러깅",
    category: "조명",
    location: "메인 스테이지 상단",
    owner: "조명 C팀",
    status: "ready",
    dependency: "무대 패널 결합",
  },
  {
    id: "speaker-rigging",
    date: defaultScheduleDate,
    startTime: "13:30",
    endTime: "15:00",
    title: "스피커 러깅 시작",
    category: "음향",
    location: "좌우 PA 타워",
    owner: "음향 A팀",
    status: "ready",
    dependency: "조명 트러스 러깅",
  },
  {
    id: "laser-module",
    date: defaultScheduleDate,
    startTime: "15:30",
    endTime: "16:30",
    title: "레이저 모듈 안전 점검",
    category: "특수효과",
    location: "효과 제어 부스",
    owner: "특수효과팀",
    status: "risk",
    dependency: "스피커 러깅 시작",
  },
  {
    id: "gate-fence",
    date: getRelativeScheduleDate(1),
    startTime: "08:00",
    endTime: "10:00",
    title: "입장 게이트 펜스 설치",
    category: "구조물",
    location: "A 게이트",
    owner: "안전 시설팀",
    status: "confirmed",
  },
  {
    id: "video-wall",
    date: getRelativeScheduleDate(1),
    startTime: "10:00",
    endTime: "12:00",
    title: "영상월 전원 테스트",
    category: "영상",
    location: "서브 스테이지",
    owner: "영상 B팀",
    status: "ready",
    dependency: "입장 게이트 펜스 설치",
  },
];

export function ScheduleView() {
  const [selectedDate, setSelectedDate] = useState<IsoDateString>(defaultScheduleDate);
  const [visibleMonth, setVisibleMonth] = useState<MonthKey>(getMonthKey(defaultScheduleDate));
  const [scheduleColumns, setScheduleColumns] = useState<ScheduleColumn[]>(defaultScheduleColumns);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialScheduleItems);
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(() => createDefaultScheduleForm(defaultScheduleDate, defaultScheduleColumns[0].label));
  const activeDateRef = useRef<HTMLButtonElement | null>(null);
  const hours = Array.from({ length: 14 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);
  const monthDays = getMonthDays(visibleMonth);
  const scheduleMonthOptions = Array.from(new Set([...schedules.map((item) => getMonthKey(item.date)), visibleMonth])).sort();
  const normalizedColumnLabel = newColumnLabel.trim();
  const columnLabels = scheduleColumns.map((column) => column.label);
  const columnLabelSet = new Set(columnLabels);
  const selectedSchedules = schedules
    .filter((item) => item.date === selectedDate)
    .sort((first, second) => first.startTime.localeCompare(second.startTime));
  const getScheduleColumnLabel = (category: string) => {
    if (category === allScheduleColumns) {
      return allScheduleColumnsLabel;
    }
    return columnLabelSet.has(category) ? category : unassignedScheduleColumn;
  };
  const scheduleCountByCategory = schedules.reduce<Record<string, number>>((counts, item) => {
    const columnLabel = getScheduleColumnLabel(item.category);
    counts[columnLabel] = (counts[columnLabel] ?? 0) + 1;
    return counts;
  }, {});
  const scheduleColumnsForGrid = scheduleColumns.some((column) => column.label === unassignedScheduleColumn) || !scheduleCountByCategory[unassignedScheduleColumn]
    ? scheduleColumns
    : [...scheduleColumns, { label: unassignedScheduleColumn }];
  const columnLabelKeys = new Set(scheduleColumnsForGrid.map((column) => column.label.toLocaleLowerCase("ko-KR")));
  const canAddColumn = normalizedColumnLabel.length > 0 && !columnLabelKeys.has(normalizedColumnLabel.toLocaleLowerCase("ko-KR"));
  const canSaveSchedule = scheduleForm.title.trim().length > 0 && scheduleForm.startTime < scheduleForm.endTime;
  const scheduleGridStyle = {
    "--schedule-column-count": Math.max(scheduleColumnsForGrid.length, 1),
    "--schedule-slot-count": hours.length * 2,
  } as CSSProperties & { "--schedule-column-count": number; "--schedule-slot-count": number };
  const selectDate = (date: IsoDateString) => {
    setSelectedDate(date);
    setVisibleMonth(getMonthKey(date));
  };
  const addScheduleColumn = () => {
    if (!canAddColumn) {
      return;
    }

    setScheduleColumns((columns) => [...columns, { label: normalizedColumnLabel }]);
    setNewColumnLabel("");
  };
  const openScheduleModal = () => {
    setScheduleForm(createDefaultScheduleForm(selectedDate, scheduleColumnsForGrid[0]?.label ?? unassignedScheduleColumn));
    setScheduleModalOpen(true);
  };
  const updateScheduleForm = <Key extends keyof ScheduleFormState>(key: Key, value: ScheduleFormState[Key]) => {
    setScheduleForm((form) => ({ ...form, [key]: value }));
  };
  const addScheduleItem = () => {
    if (!canSaveSchedule) {
      return;
    }

    setSchedules((items) => [
      ...items,
      {
        id: `schedule-${Date.now()}`,
        date: scheduleForm.date,
        startTime: scheduleForm.startTime,
        endTime: scheduleForm.endTime,
        title: scheduleForm.title.trim(),
        category: scheduleForm.category,
        location: scheduleForm.category === allScheduleColumns ? "공통 일정" : `${getScheduleColumnLabel(scheduleForm.category)} 구역`,
        owner: "관리자 등록",
        assignees: scheduleForm.assignees.trim() || undefined,
        workAreaGroup: scheduleForm.workAreaGroup.trim() || undefined,
        status: "confirmed",
      },
    ]);
    selectDate(scheduleForm.date);
    setScheduleModalOpen(false);
  };
  const removeScheduleColumn = (label: string) => {
    const assignedScheduleCount = schedules.filter((item) => item.category === label).length;
    if (scheduleColumns.length <= 1 || (label === unassignedScheduleColumn && assignedScheduleCount > 0)) {
      return;
    }

    setScheduleColumns((columns) => {
      const nextColumns = columns.filter((column) => column.label !== label);
      if (assignedScheduleCount === 0 || nextColumns.some((column) => column.label === unassignedScheduleColumn)) {
        return nextColumns;
      }
      return [...nextColumns, { label: unassignedScheduleColumn }];
    });
    if (assignedScheduleCount > 0) {
      setSchedules((items) => items.map((item) => (item.category === label ? { ...item, category: unassignedScheduleColumn } : item)));
    }
  };
  const moveDate = (offset: number) => {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + offset);
    selectDate(toIsoDateString(date));
  };

  useEffect(() => {
    activeDateRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDate, visibleMonth]);

  useEffect(() => {
    setScheduleColumns((columns) => normalizeScheduleColumns(columns));
    setSchedules((items) => items.map((item) => (item.category === legacyUnassignedScheduleColumn ? { ...item, category: unassignedScheduleColumn } : item)));
  }, []);

  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions"><h1>스케줄 관리</h1><div><button className="light-button" type="button"><MaterialIcon name="download" />엑셀 내보내기</button><button className="dark-button" type="button" onClick={openScheduleModal}><MaterialIcon name="add" />일정 추가</button></div></header>
      <div className="page-content schedule-board">
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

        <section className="app-card schedule-column-management" aria-label="스케줄 컬럼 관리">
          <div className="section-title-row">
            <div>
              <h2>스케줄 컬럼</h2>
              <p>공정 구분은 고정값이 아니라 관리자가 현장 운영 기준에 맞게 추가합니다.</p>
            </div>
          </div>
          <form
            className="schedule-column-form"
            onSubmit={(event) => {
              event.preventDefault();
              addScheduleColumn();
            }}
          >
            <input
              aria-label="새 스케줄 컬럼"
              placeholder="예: 출입 통제, 전기, VIP 동선"
              value={newColumnLabel}
              onChange={(event) => setNewColumnLabel(event.target.value)}
            />
            <button className="dark-button" type="submit" disabled={!canAddColumn}>
              <MaterialIcon name="add" />
              컬럼 추가
            </button>
          </form>
          <div className="schedule-column-list">
            {scheduleColumnsForGrid.map((column) => {
              const scheduleCount = scheduleCountByCategory[column.label] ?? 0;
              const deleteDisabled = scheduleColumns.length <= 1 || (column.label === unassignedScheduleColumn && scheduleCount > 0);
              const deleteTitle = deleteDisabled
                ? "마지막 컬럼이거나 미배정 일정이 있는 컬럼은 삭제할 수 없습니다."
                : scheduleCount > 0
                  ? "컬럼 삭제 후 등록된 일정은 미배정으로 이동합니다."
                  : "컬럼 삭제";
              return (
                <span className="schedule-column-chip" key={column.label}>
                  <b>{column.label}</b>
                  <small>{scheduleCount}건</small>
                  <button
                    type="button"
                    title={deleteTitle}
                    aria-label={`${column.label} 컬럼 삭제`}
                    disabled={deleteDisabled}
                    onClick={() => removeScheduleColumn(column.label)}
                  >
                    <MaterialIcon name="close" />
                  </button>
                </span>
              );
            })}
          </div>
        </section>

        <div className="date-strip" aria-label="선택 월 날짜 목록">
          {monthDays.map((date) => (
            <button ref={selectedDate === date ? activeDateRef : null} className={selectedDate === date ? "is-active" : ""} type="button" key={date} onClick={() => selectDate(date)}>
              <span>{formatScheduleDateShort(date)}</span>
              <small>{schedules.filter((item) => item.date === date).length}건</small>
            </button>
          ))}
        </div>

        <div className="schedule-table-wrap">
          <div className="schedule-grid" style={scheduleGridStyle} aria-label={`${formatScheduleDate(selectedDate)} 스케줄 표`}>
            <div className="grid-head">시간</div>
            {scheduleColumnsForGrid.map((column, columnIndex) => (
              <div className={`grid-head${columnIndex === scheduleColumnsForGrid.length - 1 ? " is-row-end" : ""}`} key={column.label}>{column.label}</div>
            ))}
            {hours.map((hour, hourIndex) => (
              <Fragment key={hour}>
                <div className="time-cell" style={{ gridColumn: 1, gridRow: `${hourIndex * 2 + 2} / span 2` }}>{hour}</div>
                {scheduleColumnsForGrid.map((column, columnIndex) => (
                  <div
                    className={`schedule-cell schedule-cell--background${columnIndex === scheduleColumnsForGrid.length - 1 ? " is-row-end" : ""}`}
                    key={`${hour}-${column.label}`}
                    style={{ gridColumn: columnIndex + 2, gridRow: `${hourIndex * 2 + 2} / span 2` }}
                  />
                ))}
              </Fragment>
            ))}
            {selectedSchedules.map((item) => (
              <div
                className={`schedule-cell schedule-cell--job${item.category === allScheduleColumns ? " schedule-cell--span-all" : ""}`}
                key={item.id}
                style={getScheduleItemGridStyle(item, scheduleColumnsForGrid, getScheduleColumnLabel, hours)}
              >
                <ScheduleJobCard item={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {isScheduleModalOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="account-modal schedule-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-modal-title">
            <header>
              <h2 id="schedule-modal-title">일정 추가</h2>
              <button type="button" aria-label="닫기" onClick={() => setScheduleModalOpen(false)}>×</button>
            </header>
            <div className="modal-body schedule-modal-body">
              <label>
                일정 제목
                <input value={scheduleForm.title} onChange={(event) => updateScheduleForm("title", event.target.value)} placeholder="예: 점심시간, 무대 안전 점검" />
              </label>
              <div className="schedule-modal-grid">
                <label>
                  일정 날짜
                  <input type="date" value={scheduleForm.date} onChange={(event) => updateScheduleForm("date", event.target.value as IsoDateString)} />
                </label>
                <label>
                  시작 시간
                  <input type="time" value={scheduleForm.startTime} onChange={(event) => updateScheduleForm("startTime", event.target.value)} />
                </label>
                <label>
                  종료 시간
                  <input type="time" value={scheduleForm.endTime} onChange={(event) => updateScheduleForm("endTime", event.target.value)} />
                </label>
              </div>
              <label>
                컬럼 분류
                <select value={scheduleForm.category} onChange={(event) => updateScheduleForm("category", event.target.value)}>
                  <option value={allScheduleColumns}>{allScheduleColumnsLabel}</option>
                  {scheduleColumnsForGrid.map((column) => (
                    <option value={column.label} key={column.label}>{column.label}</option>
                  ))}
                </select>
              </label>
              <div className="schedule-modal-grid">
                <label>
                  매칭 근로자
                  <input value={scheduleForm.assignees} onChange={(event) => updateScheduleForm("assignees", event.target.value)} placeholder="예: 김작업, 설치 A팀 4명" />
                </label>
                <label>
                  근로 영역 그룹
                  <input value={scheduleForm.workAreaGroup} onChange={(event) => updateScheduleForm("workAreaGroup", event.target.value)} placeholder="예: 메인 스테이지 하부" />
                </label>
              </div>
              <p><MaterialIcon name="info" />전체 컬럼 일정은 점심시간처럼 모든 분류 위에 하나의 긴 일정 카드로 표시됩니다.</p>
            </div>
            <footer>
              <button className="light-button" type="button" onClick={() => setScheduleModalOpen(false)}>취소</button>
              <button className="dark-button" type="button" disabled={!canSaveSchedule} onClick={addScheduleItem}>추가</button>
            </footer>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ScheduleJobCard({ item }: { item: ScheduleItem }) {
  return (
    <article className={`job job--${item.status}${item.category === allScheduleColumns ? " job--all-columns" : ""}`}>
      <strong>{item.title}</strong>
      <span>{item.startTime} - {item.endTime}</span>
      <small>{item.location} · {item.owner}</small>
      {item.assignees || item.workAreaGroup ? (
        <em>{[item.assignees, item.workAreaGroup].filter(Boolean).join(" · ")}</em>
      ) : null}
      {item.dependency ? <em>{item.dependency} 이후</em> : null}
    </article>
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

function createDefaultScheduleForm(date: IsoDateString, category: string): ScheduleFormState {
  return {
    date,
    startTime: "12:00",
    endTime: "13:00",
    title: "",
    category,
    assignees: "",
    workAreaGroup: "",
  };
}

function getTimeMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function getScheduleItemGridStyle(
  item: ScheduleItem,
  columns: ScheduleColumn[],
  getColumnLabel: (category: string) => string,
  hours: string[],
) {
  const startMinutes = getTimeMinutes(item.startTime);
  const endMinutes = getTimeMinutes(item.endTime);
  const firstHourMinutes = getTimeMinutes(hours[0]);
  const rowStart = Math.max(Math.floor((startMinutes - firstHourMinutes) / 30), 0) + 2;
  const rowSpan = Math.max(Math.ceil((endMinutes - startMinutes) / 30), 1);

  if (item.category === allScheduleColumns) {
    return {
      gridColumn: "2 / -1",
      gridRow: `${rowStart} / span ${rowSpan}`,
    } satisfies CSSProperties;
  }

  const columnIndex = Math.max(columns.findIndex((column) => column.label === getColumnLabel(item.category)), 0);
  return {
    gridColumn: `${columnIndex + 2} / span 1`,
    gridRow: `${rowStart} / span ${rowSpan}`,
  } satisfies CSSProperties;
}

function getRelativeScheduleDate(offsetDays: number): IsoDateString {
  const date = new Date(`${defaultScheduleDate}T00:00:00`);
  date.setDate(date.getDate() + offsetDays);
  return toIsoDateString(date);
}

function getMonthDays(value: MonthKey) {
  const [year, month] = value.split("-").map(Number);
  const lastDate = new Date(year, month, 0).getDate();

  return Array.from({ length: lastDate }, (_, index) => `${value}-${String(index + 1).padStart(2, "0")}` as IsoDateString);
}

function normalizeScheduleColumns(columns: ScheduleColumn[]) {
  const normalizedColumns: ScheduleColumn[] = [];
  const labels = new Set<string>();

  columns.forEach((column) => {
    const label = column.label === legacyUnassignedScheduleColumn ? unassignedScheduleColumn : column.label;
    if (labels.has(label)) {
      return;
    }

    normalizedColumns.push({ label });
    labels.add(label);
  });

  return normalizedColumns.length > 0 ? normalizedColumns : [{ label: unassignedScheduleColumn }];
}
