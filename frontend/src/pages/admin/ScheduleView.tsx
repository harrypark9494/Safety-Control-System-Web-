import type { CSSProperties } from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import type { Project } from "../../types";

type ScheduleStatus = "confirmed" | "ready" | "risk";
type IsoDateString = `${number}-${number}-${number}`;

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

type ScheduleRange = {
  startDate: IsoDateString;
  endDate: IsoDateString;
};

type SchedulePopoverState = {
  key: string;
  row: number;
  columnIndex: number;
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

function createInitialScheduleItems(projectId: string, baseDate: IsoDateString = defaultScheduleDate, endDate: IsoDateString = baseDate): ScheduleItem[] {
  const prefix = projectId || "default";
  const isDraftProject = prefix.includes("winter");
  const secondDate = clampScheduleDate(getRelativeScheduleDate(baseDate, 1), { startDate: baseDate, endDate });

  if (isDraftProject) {
    return [
      {
        id: `${prefix}-planning`,
        date: baseDate,
        startTime: "09:00",
        endTime: "10:30",
        title: "운영 계획 회의",
        category: "구조물",
        location: "프로젝트 준비실",
        owner: "운영팀",
        status: "ready",
      },
      {
        id: `${prefix}-vendor`,
        date: baseDate,
        startTime: "11:00",
        endTime: "12:00",
        title: "협력사 배정 검토",
        category: "음향",
        location: "준비 구역",
        owner: "관리자",
        status: "risk",
      },
    ];
  }

  return [
  {
    id: `${prefix}-stage-foundation`,
    date: baseDate,
    startTime: "07:30",
    endTime: "09:30",
    title: "메인 스테이지 하부 고정",
    category: "구조물",
    location: "메인 스테이지",
    owner: "설치 A팀",
    status: "confirmed",
  },
  {
    id: `${prefix}-stage-panel`,
    date: baseDate,
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
    id: `${prefix}-lighting-rigging`,
    date: baseDate,
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
    id: `${prefix}-speaker-rigging`,
    date: baseDate,
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
    id: `${prefix}-laser-module`,
    date: baseDate,
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
    id: `${prefix}-gate-fence`,
    date: secondDate,
    startTime: "08:00",
    endTime: "10:00",
    title: "입장 게이트 펜스 설치",
    category: "구조물",
    location: "A 게이트",
    owner: "안전 시설팀",
    status: "confirmed",
  },
  {
    id: `${prefix}-video-wall`,
    date: secondDate,
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
}

export function ScheduleView({ project }: { project: Project | null }) {
  const projectId = project?.id ?? "";
  const scheduleRange = getProjectScheduleRange(project);
  const scheduleDates = getDateRange(scheduleRange.startDate, scheduleRange.endDate);
  const [selectedDate, setSelectedDate] = useState<IsoDateString>(scheduleRange.startDate);
  const [scheduleColumns, setScheduleColumns] = useState<ScheduleColumn[]>(defaultScheduleColumns);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => createInitialScheduleItems(projectId, scheduleRange.startDate, scheduleRange.endDate));
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [activeSchedulePopover, setActiveSchedulePopover] = useState<SchedulePopoverState | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(() => createDefaultScheduleForm(scheduleRange.startDate, defaultScheduleColumns[0].label));
  const activeDateRef = useRef<HTMLButtonElement | null>(null);
  const hours = Array.from({ length: 14 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);
  const scheduleTimeSlots = hours.flatMap((hour) => [hour, addMinutesToTime(hour, 30)]);
  const selectedDateIndex = Math.max(scheduleDates.indexOf(selectedDate), 0);
  const isFirstScheduleDate = selectedDate <= scheduleRange.startDate;
  const isLastScheduleDate = selectedDate >= scheduleRange.endDate;
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
    "--schedule-slot-count": scheduleTimeSlots.length,
  } as CSSProperties & { "--schedule-column-count": number; "--schedule-slot-count": number };
  const selectDate = (date: IsoDateString) => {
    setSelectedDate(clampScheduleDate(date, scheduleRange));
    setActiveSchedulePopover(null);
  };
  const addScheduleColumn = () => {
    if (!canAddColumn) {
      return;
    }

    setScheduleColumns((columns) => [...columns, { label: normalizedColumnLabel }]);
    setNewColumnLabel("");
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
    setActiveSchedulePopover(null);
  };
  const openSchedulePopover = (time: string, column: ScheduleColumn, row: number, columnIndex: number) => {
    setScheduleForm(createDefaultScheduleForm(selectedDate, column.label, time));
    setActiveSchedulePopover({ key: getScheduleSlotKey(time, column.label), row, columnIndex });
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
    const nextIndex = Math.min(Math.max(selectedDateIndex + offset, 0), scheduleDates.length - 1);
    selectDate(scheduleDates[nextIndex] ?? scheduleRange.startDate);
  };

  useEffect(() => {
    activeDateRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDate, scheduleRange.startDate, scheduleRange.endDate]);

  useEffect(() => {
    setScheduleColumns((columns) => normalizeScheduleColumns(columns));
    setSchedules((items) => items.map((item) => (item.category === legacyUnassignedScheduleColumn ? { ...item, category: unassignedScheduleColumn } : item)));
  }, []);

  useEffect(() => {
    setSelectedDate(scheduleRange.startDate);
    setScheduleColumns(defaultScheduleColumns);
    setSchedules(createInitialScheduleItems(projectId, scheduleRange.startDate, scheduleRange.endDate));
    setScheduleForm(createDefaultScheduleForm(scheduleRange.startDate, defaultScheduleColumns[0].label));
    setActiveSchedulePopover(null);
  }, [projectId, scheduleRange.startDate, scheduleRange.endDate]);

  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions"><h1>스케줄 관리</h1><div><button className="light-button" type="button"><MaterialIcon name="download" />엑셀 내보내기</button></div></header>
      <div className="page-content schedule-board">
        <section className="app-card schedule-period-card" aria-label="프로젝트 일정 기간">
          <div>
            <span>프로젝트 기간</span>
            <strong>{formatScheduleDateRange(scheduleRange)}</strong>
          </div>
          <p>{formatScheduleDate(selectedDate)} · {selectedSchedules.length}건</p>
          <div>
            <button type="button" aria-label="이전 날짜" disabled={isFirstScheduleDate} onClick={() => moveDate(-1)}><MaterialIcon name="chevron_left" /></button>
            <button type="button" aria-label="기간 첫 날짜로 이동" disabled={isFirstScheduleDate} onClick={() => selectDate(scheduleRange.startDate)}><MaterialIcon name="first_page" /></button>
            <button type="button" aria-label="다음 날짜" disabled={isLastScheduleDate} onClick={() => moveDate(1)}><MaterialIcon name="chevron_right" /></button>
          </div>
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

        <div className="date-strip" aria-label="프로젝트 기간 날짜 목록">
          {scheduleDates.map((date) => (
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
              </Fragment>
            ))}
            {scheduleTimeSlots.map((time, slotIndex) => (
              <Fragment key={time}>
                {scheduleColumnsForGrid.map((column, columnIndex) => {
                  const row = slotIndex + 2;
                  const slotKey = getScheduleSlotKey(time, column.label);
                  const isSlotOccupied = isScheduleSlotOccupied(selectedSchedules, time, column.label, getScheduleColumnLabel);
                  const isPopoverActive = activeSchedulePopover?.key === slotKey;

                  return (
                    <div
                      className={`schedule-cell schedule-cell--background${columnIndex === scheduleColumnsForGrid.length - 1 ? " is-row-end" : ""}${isSlotOccupied ? " is-occupied" : ""}${isPopoverActive ? " is-editing" : ""}`}
                      key={slotKey}
                      style={{ gridColumn: columnIndex + 2, gridRow: `${row} / span 1` }}
                    >
                      {!isSlotOccupied ? (
                        <button
                          className="schedule-add-cell-button"
                          type="button"
                          aria-expanded={isPopoverActive}
                          aria-label={`${formatScheduleDate(selectedDate)} ${time} ${column.label} 일정 추가`}
                          onClick={() => openSchedulePopover(time, column, row, columnIndex)}
                        >
                          <MaterialIcon name="add" />
                        </button>
                      ) : null}
                      {isPopoverActive ? (
                        <ScheduleAddPopover
                          canSave={canSaveSchedule}
                          form={scheduleForm}
                          onCancel={() => setActiveSchedulePopover(null)}
                          onSave={addScheduleItem}
                          onUpdate={updateScheduleForm}
                          placement={getSchedulePopoverPlacement(activeSchedulePopover, scheduleColumnsForGrid.length, scheduleTimeSlots.length)}
                        />
                      ) : null}
                    </div>
                  );
                })}
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
    </section>
  );
}

function ScheduleAddPopover({
  canSave,
  form,
  onCancel,
  onSave,
  onUpdate,
  placement,
}: {
  canSave: boolean;
  form: ScheduleFormState;
  onCancel: () => void;
  onSave: () => void;
  onUpdate: <Key extends keyof ScheduleFormState>(key: Key, value: ScheduleFormState[Key]) => void;
  placement: string;
}) {
  return (
    <form
      className={`schedule-add-popover ${placement}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <header>
        <div>
          <strong>일정 추가</strong>
          <p>{formatScheduleDate(form.date)} · {form.category}</p>
        </div>
        <button type="button" aria-label="닫기" onClick={onCancel}>
          <MaterialIcon name="close" />
        </button>
      </header>
      <label>
        일정 제목
        <input value={form.title} onChange={(event) => onUpdate("title", event.target.value)} placeholder="예: 무대 안전 점검" autoFocus />
      </label>
      <div className="schedule-add-popover-grid">
        <label>
          시작
          <input type="time" value={form.startTime} onChange={(event) => onUpdate("startTime", event.target.value)} />
        </label>
        <label>
          종료
          <input type="time" value={form.endTime} onChange={(event) => onUpdate("endTime", event.target.value)} />
        </label>
      </div>
      <label>
        매칭 근로자
        <input value={form.assignees} onChange={(event) => onUpdate("assignees", event.target.value)} placeholder="예: 설치 A팀 4명" />
      </label>
      <label>
        근로 영역 그룹
        <input value={form.workAreaGroup} onChange={(event) => onUpdate("workAreaGroup", event.target.value)} placeholder="예: 메인 스테이지 하부" />
      </label>
      <footer>
        <button className="light-button" type="button" onClick={onCancel}>취소</button>
        <button className="dark-button" type="submit" disabled={!canSave}>추가</button>
      </footer>
    </form>
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

function formatScheduleDateShort(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function toIsoDateString(value: Date): IsoDateString {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}` as IsoDateString;
}

function createDefaultScheduleForm(date: IsoDateString, category: string, startTime = "12:00"): ScheduleFormState {
  return {
    date,
    startTime,
    endTime: addMinutesToTime(startTime, 60),
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

function addMinutesToTime(value: string, minutesToAdd: number) {
  const nextMinutes = getTimeMinutes(value) + minutesToAdd;
  const hour = Math.floor(nextMinutes / 60);
  const minute = nextMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getScheduleSlotKey(time: string, columnLabel: string) {
  return `${time}-${columnLabel}`;
}

function isScheduleSlotOccupied(
  schedules: ScheduleItem[],
  slotTime: string,
  columnLabel: string,
  getColumnLabel: (category: string) => string,
) {
  const slotStart = getTimeMinutes(slotTime);
  const slotEnd = slotStart + 30;

  return schedules.some((item) => {
    const itemStart = getTimeMinutes(item.startTime);
    const itemEnd = getTimeMinutes(item.endTime);
    const overlaps = itemStart < slotEnd && itemEnd > slotStart;
    const sameColumn = item.category === allScheduleColumns || getColumnLabel(item.category) === columnLabel;
    return overlaps && sameColumn;
  });
}

function getSchedulePopoverPlacement(popover: SchedulePopoverState, columnCount: number, slotCount: number) {
  const horizontal = popover.columnIndex >= Math.max(columnCount - 2, 1) ? "is-left-aligned" : "is-right-aligned";
  const vertical = popover.row > slotCount - 4 ? "is-top-aligned" : "is-bottom-aligned";
  return `${horizontal} ${vertical}`;
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

function getRelativeScheduleDate(baseDate: IsoDateString, offsetDays: number): IsoDateString {
  const date = new Date(`${baseDate}T00:00:00`);
  date.setDate(date.getDate() + offsetDays);
  return toIsoDateString(date);
}

function getProjectScheduleRange(project: Project | null): ScheduleRange {
  const startDate = isIsoDateString(project?.startDate) ? project.startDate : defaultScheduleDate;
  const rawEndDate = isIsoDateString(project?.endDate) ? project.endDate : startDate;

  return rawEndDate < startDate
    ? { startDate: rawEndDate, endDate: startDate }
    : { startDate, endDate: rawEndDate };
}

function getDateRange(startDate: IsoDateString, endDate: IsoDateString) {
  const dates: IsoDateString[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    dates.push(toIsoDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates.length > 0 ? dates : [startDate];
}

function clampScheduleDate(date: IsoDateString, range: ScheduleRange) {
  if (date < range.startDate) {
    return range.startDate;
  }

  if (date > range.endDate) {
    return range.endDate;
  }

  return date;
}

function formatScheduleDateRange(range: ScheduleRange) {
  if (range.startDate === range.endDate) {
    return formatScheduleDate(range.startDate);
  }

  return `${formatScheduleDate(range.startDate)} - ${formatScheduleDate(range.endDate)}`;
}

function isIsoDateString(value: string | null | undefined): value is IsoDateString {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
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
