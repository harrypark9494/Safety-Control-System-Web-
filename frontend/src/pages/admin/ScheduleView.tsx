import type { CSSProperties } from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { createAdminScheduleColumn, deleteAdminScheduleColumn } from "../../features/auth/session";
import type { AdminScheduleColumn, Project } from "../../types";

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
  id?: string;
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

const fallbackScheduleColumns: ScheduleColumn[] = [{ label: unassignedScheduleColumn }];

function createInitialScheduleItems(
  projectId: string,
  columns: ScheduleColumn[],
  baseDate: IsoDateString = defaultScheduleDate,
  endDate: IsoDateString = baseDate,
): ScheduleItem[] {
  const prefix = projectId || "default";
  const isDraftProject = prefix.includes("winter");
  const secondDate = clampScheduleDate(getRelativeScheduleDate(baseDate, 1), { startDate: baseDate, endDate });
  const getTeamColumn = (index: number) => {
    if (columns.length === 0) {
      return unassignedScheduleColumn;
    }

    return getScheduleColumnKey(columns[index % columns.length]);
  };
  const getTeamColumnLabel = (index: number) => {
    if (columns.length === 0) {
      return unassignedScheduleColumn;
    }

    return columns[index % columns.length].label;
  };

  if (isDraftProject) {
    return [
      {
        id: `${prefix}-planning`,
        date: baseDate,
        startTime: "09:00",
        endTime: "10:30",
        title: "운영 계획 회의",
        category: getTeamColumn(0),
        location: "프로젝트 준비실",
        owner: getTeamColumnLabel(0),
        status: "ready",
      },
      {
        id: `${prefix}-vendor`,
        date: baseDate,
        startTime: "11:00",
        endTime: "12:00",
        title: "협력사 배정 검토",
        category: getTeamColumn(1),
        location: "준비 구역",
        owner: getTeamColumnLabel(1),
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
    category: getTeamColumn(0),
    location: "메인 스테이지",
    owner: getTeamColumnLabel(0),
    status: "confirmed",
  },
  {
    id: `${prefix}-stage-panel`,
    date: baseDate,
    startTime: "09:30",
    endTime: "11:30",
    title: "무대 패널 결합",
    category: getTeamColumn(1),
    location: "메인 스테이지",
    owner: getTeamColumnLabel(1),
    status: "confirmed",
    dependency: "메인 스테이지 하부 고정",
  },
  {
    id: `${prefix}-lighting-rigging`,
    date: baseDate,
    startTime: "11:30",
    endTime: "13:00",
    title: "조명 트러스 러깅",
    category: getTeamColumn(2),
    location: "메인 스테이지 상단",
    owner: getTeamColumnLabel(2),
    status: "ready",
    dependency: "무대 패널 결합",
  },
  {
    id: `${prefix}-speaker-rigging`,
    date: baseDate,
    startTime: "13:30",
    endTime: "15:00",
    title: "스피커 러깅 시작",
    category: getTeamColumn(3),
    location: "좌우 PA 타워",
    owner: getTeamColumnLabel(3),
    status: "ready",
    dependency: "조명 트러스 러깅",
  },
  {
    id: `${prefix}-laser-module`,
    date: baseDate,
    startTime: "15:30",
    endTime: "16:30",
    title: "레이저 모듈 안전 점검",
    category: getTeamColumn(4),
    location: "효과 제어 부스",
    owner: getTeamColumnLabel(4),
    status: "risk",
    dependency: "스피커 러깅 시작",
  },
  {
    id: `${prefix}-gate-fence`,
    date: secondDate,
    startTime: "08:00",
    endTime: "10:00",
    title: "입장 게이트 펜스 설치",
    category: getTeamColumn(0),
    location: "A 게이트",
    owner: getTeamColumnLabel(0),
    status: "confirmed",
  },
  {
    id: `${prefix}-video-wall`,
    date: secondDate,
    startTime: "10:00",
    endTime: "12:00",
    title: "영상월 전원 테스트",
    category: getTeamColumn(1),
    location: "서브 스테이지",
    owner: getTeamColumnLabel(1),
    status: "ready",
    dependency: "입장 게이트 펜스 설치",
  },
  ];
}

export function ScheduleView({
  columns,
  columnsReady,
  message,
  onColumnsChange,
  project,
}: {
  columns: AdminScheduleColumn[];
  columnsReady: boolean;
  message: string;
  onColumnsChange: (columns: AdminScheduleColumn[]) => void;
  project: Project | null;
}) {
  const projectId = project?.id ?? "";
  const scheduleRange = getProjectScheduleRange(project);
  const scheduleDates = getDateRange(scheduleRange.startDate, scheduleRange.endDate);
  const scheduleColumns = normalizeScheduleColumns(columns);
  const [selectedDate, setSelectedDate] = useState<IsoDateString>(scheduleRange.startDate);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => createInitialScheduleItems(projectId, scheduleColumns, scheduleRange.startDate, scheduleRange.endDate));
  const [activeSchedulePopover, setActiveSchedulePopover] = useState<SchedulePopoverState | null>(null);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [activeScheduleActionId, setActiveScheduleActionId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(() => createDefaultScheduleForm(scheduleRange.startDate, scheduleColumns[0] ? getScheduleColumnKey(scheduleColumns[0]) : unassignedScheduleColumn));
  const [newColumnLabel, setNewColumnLabel] = useState("");
  const [columnMessage, setColumnMessage] = useState("");
  const [isSavingColumn, setIsSavingColumn] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);
  const activeDateRef = useRef<HTMLButtonElement | null>(null);
  const hours = Array.from({ length: 14 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);
  const scheduleTimeSlots = hours.flatMap((hour) => [hour, addMinutesToTime(hour, 30)]);
  const selectedDateIndex = Math.max(scheduleDates.indexOf(selectedDate), 0);
  const isFirstScheduleDate = selectedDate <= scheduleRange.startDate;
  const isLastScheduleDate = selectedDate >= scheduleRange.endDate;
  const columnKeys = scheduleColumns.map(getScheduleColumnKey);
  const columnKeySet = new Set(columnKeys);
  const selectedSchedules = schedules
    .filter((item) => item.date === selectedDate)
    .sort((first, second) => first.startTime.localeCompare(second.startTime));
  const getScheduleColumnLabel = (category: string) => {
    if (category === allScheduleColumns) {
      return allScheduleColumnsLabel;
    }
    const column = scheduleColumns.find((option) => getScheduleColumnKey(option) === category || option.label === category);
    return column ? getScheduleColumnDisplayName(column) : unassignedScheduleColumn;
  };
  const getScheduleColumnCategory = (category: string) => {
    if (category === allScheduleColumns) {
      return allScheduleColumns;
    }
    const column = scheduleColumns.find((option) => getScheduleColumnKey(option) === category || option.label === category);
    return column && columnKeySet.has(getScheduleColumnKey(column)) ? getScheduleColumnKey(column) : unassignedScheduleColumn;
  };
  const scheduleCountByCategory = schedules.reduce<Record<string, number>>((counts, item) => {
    const columnKey = getScheduleColumnCategory(item.category);
    counts[columnKey] = (counts[columnKey] ?? 0) + 1;
    return counts;
  }, {});
  const scheduleColumnsForGrid = scheduleColumns.some((column) => getScheduleColumnKey(column) === unassignedScheduleColumn) || !scheduleCountByCategory[unassignedScheduleColumn]
    ? scheduleColumns
    : [...scheduleColumns, { label: unassignedScheduleColumn }];
  const canSaveSchedule = scheduleForm.title.trim().length > 0 && scheduleForm.startTime < scheduleForm.endTime;
  const canCreateColumn = projectId.length > 0 && newColumnLabel.trim().length > 0 && !isSavingColumn;
  const scheduleGridStyle = {
    "--schedule-column-count": Math.max(scheduleColumnsForGrid.length, 1),
    "--schedule-slot-count": scheduleTimeSlots.length,
  } as CSSProperties & { "--schedule-column-count": number; "--schedule-slot-count": number };
  const selectDate = (date: IsoDateString) => {
    setSelectedDate(clampScheduleDate(date, scheduleRange));
    setActiveSchedulePopover(null);
    setEditingScheduleId(null);
    setActiveScheduleActionId(null);
  };
  const updateScheduleForm = <Key extends keyof ScheduleFormState>(key: Key, value: ScheduleFormState[Key]) => {
    setScheduleForm((form) => ({ ...form, [key]: value }));
  };
  const closeScheduleEditor = () => {
    setActiveSchedulePopover(null);
    setEditingScheduleId(null);
    setActiveScheduleActionId(null);
  };
  const saveScheduleItem = () => {
    if (!canSaveSchedule) {
      return;
    }

    const existingSchedule = editingScheduleId ? schedules.find((item) => item.id === editingScheduleId) : null;
    const nextItem: ScheduleItem = {
      id: editingScheduleId ?? `schedule-${Date.now()}`,
      date: scheduleForm.date,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      title: scheduleForm.title.trim(),
      category: scheduleForm.category,
      location: scheduleForm.category === allScheduleColumns ? "공통 일정" : `${getScheduleColumnLabel(scheduleForm.category)} 구역`,
      owner: existingSchedule?.owner ?? "관리자 등록",
      assignees: scheduleForm.assignees.trim() || undefined,
      workAreaGroup: scheduleForm.workAreaGroup.trim() || undefined,
      status: existingSchedule?.status ?? "confirmed",
      dependency: existingSchedule?.dependency,
    };

    setSchedules((items) => editingScheduleId
      ? items.map((item) => (item.id === editingScheduleId ? nextItem : item))
      : [...items, nextItem]);
    selectDate(scheduleForm.date);
    closeScheduleEditor();
  };
  const editScheduleItem = (item: ScheduleItem) => {
    setScheduleForm({
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      title: item.title,
      category: item.category,
      assignees: item.assignees ?? "",
      workAreaGroup: item.workAreaGroup ?? "",
    });
    setEditingScheduleId(item.id);
    setActiveScheduleActionId(null);
    setActiveSchedulePopover({ key: getScheduleEditKey(item.id), row: 0, columnIndex: 0 });
  };
  const deleteScheduleItem = (id: string) => {
    setSchedules((items) => items.filter((item) => item.id !== id));
    if (editingScheduleId === id) {
      closeScheduleEditor();
    }
    if (activeScheduleActionId === id) {
      setActiveScheduleActionId(null);
    }
  };
  const addScheduleColumn = async () => {
    if (!canCreateColumn) {
      return;
    }

    try {
      setIsSavingColumn(true);
      const nextColumns = await createAdminScheduleColumn(projectId, newColumnLabel);
      onColumnsChange(nextColumns);
      setNewColumnLabel("");
      setColumnMessage("스케줄 컬럼이 추가되었습니다.");
    } catch (error) {
      setColumnMessage(error instanceof Error ? error.message : "스케줄 컬럼 추가에 실패했습니다.");
    } finally {
      setIsSavingColumn(false);
    }
  };
  const removeScheduleColumn = async (column: ScheduleColumn) => {
    const columnId = column.id?.trim();
    if (!columnId || !projectId) {
      return;
    }

    try {
      const nextColumns = await deleteAdminScheduleColumn(columnId, projectId);
      onColumnsChange(nextColumns);
      setColumnMessage("스케줄 컬럼이 삭제되었습니다.");
      setActiveSchedulePopover(null);
    } catch (error) {
      setColumnMessage(error instanceof Error ? error.message : "스케줄 컬럼 삭제에 실패했습니다.");
    }
  };
  const openSchedulePopover = (time: string, column: ScheduleColumn, row: number, columnIndex: number) => {
    const columnKey = getScheduleColumnKey(column);
    setScheduleForm(createDefaultScheduleForm(selectedDate, columnKey, time));
    setEditingScheduleId(null);
    setActiveScheduleActionId(null);
    setActiveSchedulePopover({ key: getScheduleSlotKey(time, columnKey), row, columnIndex });
  };
  const moveDate = (offset: number) => {
    const nextIndex = Math.min(Math.max(selectedDateIndex + offset, 0), scheduleDates.length - 1);
    selectDate(scheduleDates[nextIndex] ?? scheduleRange.startDate);
  };

  useEffect(() => {
    activeDateRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDate, scheduleRange.startDate, scheduleRange.endDate]);

  useEffect(() => {
    setSelectedDate(scheduleRange.startDate);
    setSchedules(createInitialScheduleItems(projectId, scheduleColumns, scheduleRange.startDate, scheduleRange.endDate));
    setScheduleForm(createDefaultScheduleForm(scheduleRange.startDate, scheduleColumns[0] ? getScheduleColumnKey(scheduleColumns[0]) : unassignedScheduleColumn));
    setActiveSchedulePopover(null);
    setEditingScheduleId(null);
    setActiveScheduleActionId(null);
  }, [projectId, scheduleRange.startDate, scheduleRange.endDate, columnsReady]);

  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions">
        <h1>스케줄 관리</h1>
        <div>
          <button className="light-button" type="button"><MaterialIcon name="download" />엑셀 내보내기</button>
          <button className="dark-button" type="button" disabled={!projectId} onClick={() => setColumnModalOpen(true)}><MaterialIcon name="view_column" />팀 컬럼 관리</button>
        </div>
      </header>
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
            {scheduleColumnsForGrid.map((column, columnIndex) => {
              const columnKey = getScheduleColumnKey(column);
              return (
                <div className={`grid-head${columnIndex === scheduleColumnsForGrid.length - 1 ? " is-row-end" : ""}`} key={columnKey}>{column.label}</div>
              );
            })}
            {hours.map((hour, hourIndex) => (
              <Fragment key={hour}>
                <div className="time-cell" style={{ gridColumn: 1, gridRow: `${hourIndex * 2 + 2} / span 2` }}>{hour}</div>
              </Fragment>
            ))}
            {scheduleTimeSlots.map((time, slotIndex) => (
              <Fragment key={time}>
                {scheduleColumnsForGrid.map((column, columnIndex) => {
                  const row = slotIndex + 2;
                  const columnKey = getScheduleColumnKey(column);
                  const slotKey = getScheduleSlotKey(time, columnKey);
                  const isSlotOccupied = isScheduleSlotOccupied(selectedSchedules, time, columnKey, getScheduleColumnCategory);
                  const isPopoverActive = activeSchedulePopover?.key === slotKey;

                  return (
                    <div
                      className={`schedule-cell schedule-cell--background${columnIndex === scheduleColumnsForGrid.length - 1 ? " is-row-end" : ""}${isSlotOccupied ? " is-occupied" : ""}${isPopoverActive ? " is-editing" : ""}`}
                      key={slotKey}
                      onClick={() => {
                        if (!isSlotOccupied) {
                          openSchedulePopover(time, column, row, columnIndex);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (!isSlotOccupied && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          openSchedulePopover(time, column, row, columnIndex);
                        }
                      }}
                      role={isSlotOccupied ? undefined : "button"}
                      style={{ gridColumn: columnIndex + 2, gridRow: `${row} / span 1` }}
                      tabIndex={isSlotOccupied ? undefined : 0}
                    >
                      {!isSlotOccupied ? (
                        <button
                          className="schedule-add-cell-button"
                          type="button"
                          aria-expanded={isPopoverActive}
                          aria-label={`${formatScheduleDate(selectedDate)} ${time} ${getScheduleColumnDisplayName(column)} 일정 추가`}
                          onClick={(event) => {
                            event.stopPropagation();
                            openSchedulePopover(time, column, row, columnIndex);
                          }}
                        >
                          <MaterialIcon name="add" />
                        </button>
                      ) : null}
                      {isPopoverActive ? (
                        <ScheduleAddPopover
                          canSave={canSaveSchedule}
                          mode="create"
                          form={scheduleForm}
                          onCancel={closeScheduleEditor}
                          onSave={saveScheduleItem}
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
                className={`schedule-cell schedule-cell--job${activeScheduleActionId === item.id ? " is-menu-open" : ""}${item.category === allScheduleColumns ? " schedule-cell--span-all" : ""}`}
                key={item.id}
                style={getScheduleItemGridStyle(item, scheduleColumnsForGrid, getScheduleColumnCategory, hours)}
              >
                <ScheduleJobCard
                  isActionsOpen={activeScheduleActionId === item.id}
                  item={item}
                  onCloseActions={() => setActiveScheduleActionId(null)}
                  onDelete={() => deleteScheduleItem(item.id)}
                  onEdit={() => editScheduleItem(item)}
                  onToggleActions={() => {
                    setActiveSchedulePopover(null);
                    setEditingScheduleId(null);
                    setActiveScheduleActionId((activeId) => activeId === item.id ? null : item.id);
                  }}
                />
                {activeSchedulePopover?.key === getScheduleEditKey(item.id) ? (
                  <ScheduleAddPopover
                    canSave={canSaveSchedule}
                    mode="edit"
                    form={scheduleForm}
                    onCancel={closeScheduleEditor}
                    onDelete={() => deleteScheduleItem(item.id)}
                    onSave={saveScheduleItem}
                    onUpdate={updateScheduleForm}
                    placement="is-left-aligned is-bottom-aligned"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
      {columnModalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal schedule-column-modal" role="dialog" aria-modal="true" aria-labelledby="schedule-column-modal-title">
            <header>
              <h2 id="schedule-column-modal-title">팀 컬럼 관리</h2>
              <button type="button" aria-label="닫기" onClick={() => setColumnModalOpen(false)}><MaterialIcon name="close" /></button>
            </header>
            <form
              className="account-form"
              onSubmit={(event) => {
                event.preventDefault();
                void addScheduleColumn();
              }}
            >
              <div className="modal-body schedule-column-modal-body">
                <label>
                  팀 컬럼명
                  <span className="schedule-column-input-row">
                    <input
                      value={newColumnLabel}
                      onChange={(event) => setNewColumnLabel(event.target.value)}
                      placeholder="예: 메인 설치 A팀"
                      disabled={!projectId || isSavingColumn}
                      autoFocus
                    />
                    <button className="dark-button" type="submit" disabled={!canCreateColumn}><MaterialIcon name="add" />추가</button>
                  </span>
                </label>
                {message || columnMessage ? <strong className="modal-message" role="status">{columnMessage || message}</strong> : null}
                <div className="schedule-column-list" aria-label="등록된 스케줄 컬럼">
                  {scheduleColumns.map((column) => {
                    const columnKey = getScheduleColumnKey(column);
                    const scheduleCount = scheduleCountByCategory[columnKey] ?? 0;
                    return (
                      <span className="schedule-column-chip" key={columnKey}>
                        <b>{column.label}</b>
                        <small>{scheduleCount}건</small>
                        {column.id ? (
                          <button type="button" aria-label={`${column.label} 컬럼 삭제`} onClick={() => void removeScheduleColumn(column)}>
                            <MaterialIcon name="close" />
                          </button>
                        ) : null}
                      </span>
                    );
                  })}
                </div>
              </div>
              <footer>
                <button className="light-button" type="button" onClick={() => setColumnModalOpen(false)}>닫기</button>
                <button className="dark-button" type="button" onClick={() => setColumnModalOpen(false)}>확인</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function ScheduleAddPopover({
  canSave,
  form,
  mode,
  onCancel,
  onDelete,
  onSave,
  onUpdate,
  placement,
}: {
  canSave: boolean;
  form: ScheduleFormState;
  mode: "create" | "edit";
  onCancel: () => void;
  onDelete?: () => void;
  onSave: () => void;
  onUpdate: <Key extends keyof ScheduleFormState>(key: Key, value: ScheduleFormState[Key]) => void;
  placement: string;
}) {
  return (
    <form
      className={`schedule-add-popover ${placement}`}
      onClick={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <header>
        <div>
          <strong>{mode === "edit" ? "일정 수정" : "일정 추가"}</strong>
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
        {mode === "edit" && onDelete ? <button className="table-action-danger" type="button" onClick={onDelete}>삭제</button> : null}
        <button className="light-button" type="button" onClick={onCancel}>취소</button>
        <button className="dark-button" type="submit" disabled={!canSave}>{mode === "edit" ? "저장" : "추가"}</button>
      </footer>
    </form>
  );
}

function ScheduleJobCard({
  isActionsOpen,
  item,
  onCloseActions,
  onDelete,
  onEdit,
  onToggleActions,
}: {
  isActionsOpen: boolean;
  item: ScheduleItem;
  onCloseActions: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleActions: () => void;
}) {
  return (
    <article className={`job job--${item.status}${isActionsOpen ? " is-actions-open" : ""}${item.category === allScheduleColumns ? " job--all-columns" : ""}`}>
      <div className="job-actions">
        <button type="button" aria-expanded={isActionsOpen} aria-label={`${item.title} 관리 메뉴`} onClick={onToggleActions}><MaterialIcon name="more_vert" /></button>
        {isActionsOpen ? (
          <div className="job-actions-popover" role="menu">
            <button type="button" role="menuitem" onClick={onEdit}><MaterialIcon name="edit" />수정</button>
            <button type="button" role="menuitem" onClick={onDelete}><MaterialIcon name="delete" />삭제</button>
            <button type="button" role="menuitem" onClick={onCloseActions}><MaterialIcon name="close" />닫기</button>
          </div>
        ) : null}
      </div>
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

function getScheduleEditKey(id: string) {
  return `edit-${id}`;
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
  getColumnCategory: (category: string) => string,
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

  const columnCategory = getColumnCategory(item.category);
  const foundColumnIndex = columns.findIndex((column) => getScheduleColumnKey(column) === columnCategory);
  const columnIndex = foundColumnIndex >= 0 ? foundColumnIndex : 0;
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
    const label = (column.label === legacyUnassignedScheduleColumn ? unassignedScheduleColumn : column.label).trim();
    const id = (column.id ?? label).trim();
    if (!label || labels.has(id)) {
      return;
    }

    normalizedColumns.push({
      id,
      label,
    });
    labels.add(id);
  });

  return normalizedColumns.length > 0 ? normalizedColumns : fallbackScheduleColumns;
}

function getScheduleColumnKey(column: ScheduleColumn) {
  return column.id?.trim() || column.label;
}

function getScheduleColumnDisplayName(column: ScheduleColumn) {
  return column.label;
}
