import { FormEvent, useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { createAdminProject, updateAdminProjectStatus } from "../../features/auth/session";
import type { Project, ProjectStatus } from "../../types";

const projectStatusLabels: Record<ProjectStatus, string> = {
  DRAFT: "준비중",
  ACTIVE: "활성",
  ARCHIVED: "종료",
};

type ProjectFilter = "ALL" | ProjectStatus;

const projectFilterTabs: { filter: ProjectFilter; label: string }[] = [
  { filter: "ALL", label: "전체" },
  { filter: "ACTIVE", label: "활성" },
  { filter: "DRAFT", label: "준비중" },
  { filter: "ARCHIVED", label: "종료" },
];

const projectSummaryCards: { filter: ProjectFilter; icon: string; title: string }[] = [
  { filter: "ALL", icon: "folder", title: "전체 프로젝트" },
  { filter: "ACTIVE", icon: "check_circle", title: "활성" },
  { filter: "DRAFT", icon: "schedule", title: "준비중" },
  { filter: "ARCHIVED", icon: "inventory_2", title: "종료" },
];

export function ProjectsView({
  projects,
  selectedProjectId,
  shouldGuideInitialCreate = false,
  onSelect,
  onRefresh,
}: {
  projects: Project[];
  selectedProjectId: string;
  shouldGuideInitialCreate?: boolean;
  onSelect: (projectId: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("DRAFT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const projectCounts = useMemo(() => {
    return {
      ALL: projects.length,
      ACTIVE: projects.filter((project) => project.status === "ACTIVE").length,
      DRAFT: projects.filter((project) => project.status === "DRAFT").length,
      ARCHIVED: projects.filter((project) => project.status === "ARCHIVED").length,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const nextProjects = filter === "ALL" ? projects : projects.filter((project) => project.status === filter);
    return [...nextProjects].sort((a, b) => getProjectEventStartDate(b).localeCompare(getProjectEventStartDate(a)));
  }, [filter, projects]);

  useEffect(() => {
    if (shouldGuideInitialCreate && projects.length === 0) {
      setFilter("ALL");
      setCreateModalOpen(true);
      setMessage("첫 프로젝트를 생성하면 관리자 운영 데이터가 해당 프로젝트에 묶여 저장됩니다.");
    }
  }, [projects.length, shouldGuideInitialCreate]);

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const project = await createAdminProject({
        name,
        status,
        startDate,
        endDate: endDate || null,
        eventStartDate,
        eventEndDate: eventEndDate || null,
        location,
        description,
        createdBy: "admin",
      });
      setName("");
      setStatus("DRAFT");
      setStartDate("");
      setEndDate("");
      setEventStartDate("");
      setEventEndDate("");
      setLocation("");
      setDescription("");
      setMessage("프로젝트가 생성되었습니다.");
      await onRefresh();
      onSelect(project.id);
      setCreateModalOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "프로젝트 생성에 실패했습니다.");
    }
  }

  async function changeStatus(projectId: string, nextStatus: ProjectStatus) {
    try {
      await updateAdminProjectStatus(projectId, nextStatus);
      setMessage("프로젝트 상태가 변경되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "프로젝트 상태 변경에 실패했습니다.");
    }
  }

  function markIntegrationNeeded(action: "edit" | "delete") {
    setMessage(action === "edit" ? "프로젝트 수정 API 연동이 필요합니다." : "프로젝트 삭제 API 연동이 필요합니다.");
  }

  function closeCreateModal() {
    setCreateModalOpen(false);
  }

  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions">
        <h1>프로젝트 관리</h1>
        <button className="dark-button" type="button" onClick={() => setCreateModalOpen(true)}>
          <MaterialIcon name="add" />{projects.length === 0 ? "첫 프로젝트 만들기" : "새 프로젝트"}
        </button>
      </header>
      <div className="page-content admin-tab-page project-page">
        {message ? <p className="form-message" role="status">{message}</p> : null}

        {projects.length === 0 ? (
          <section className="project-empty-guide" aria-label="프로젝트 생성 안내">
            <span><MaterialIcon name="create_new_folder" /></span>
            <div>
              <h2>첫 프로젝트 등록 필요</h2>
              <p>프로젝트를 만든 뒤 근로자 원장, 스케줄, QR, 기상 설정을 프로젝트 단위로 관리합니다.</p>
            </div>
            <button className="dark-button" type="button" onClick={() => setCreateModalOpen(true)}>
              <MaterialIcon name="add" />첫 프로젝트 만들기
            </button>
          </section>
        ) : null}

        <section className="project-summary-grid" aria-label="프로젝트 상태 요약">
          {projectSummaryCards.map((card) => (
            <button
              className={`project-summary-card ${filter === card.filter ? "is-active" : ""} project-summary-card--${card.filter.toLowerCase()}`}
              type="button"
              onClick={() => setFilter(card.filter)}
              key={card.filter}
            >
              <span className="project-summary-icon">
                <MaterialIcon name={card.icon} filled={card.filter === "ACTIVE"} />
              </span>
              <span>
                <small>{card.title}</small>
                <strong>{projectCounts[card.filter]}개</strong>
              </span>
            </button>
          ))}
        </section>

        <section className="app-card project-history-panel" aria-labelledby="project-history-title">
          <div className="section-toolbar project-history-toolbar">
            <div>
              <h2 id="project-history-title">프로젝트 이력</h2>
              <span>{projectFilterTabs.find((tab) => tab.filter === filter)?.label} {filteredProjects.length}개</span>
            </div>
            <div className="project-filter-tabs" role="tablist" aria-label="프로젝트 상태 필터">
              {projectFilterTabs.map((tab) => (
                <button
                  className={filter === tab.filter ? "is-active" : ""}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.filter}
                  onClick={() => setFilter(tab.filter)}
                  key={tab.filter}
                >
                  {tab.label}
                  <span>{projectCounts[tab.filter]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="project-history-table" role="table" aria-label="프로젝트 이력 목록">
            <div className="project-history-head" role="row">
              <span role="columnheader">선택</span>
              <span role="columnheader">프로젝트</span>
              <span role="columnheader">행사 스케줄</span>
              <span role="columnheader">실제 스케줄</span>
              <span role="columnheader">장소</span>
              <span role="columnheader">상태</span>
              <span role="columnheader">관리</span>
            </div>
            <div className="project-history-body">
              {filteredProjects.length > 0 ? filteredProjects.map((project) => (
                <article className={`project-history-row ${project.id === selectedProjectId ? "is-selected" : ""}`} role="row" key={project.id}>
                  <div className="project-select-cell" role="cell">
                    <button
                      className={project.id === selectedProjectId ? "is-selected" : ""}
                      type="button"
                      aria-label={`${project.name} 선택`}
                      aria-pressed={project.id === selectedProjectId}
                      onClick={() => onSelect(project.id)}
                    >
                      <MaterialIcon name={project.id === selectedProjectId ? "check_circle" : "radio_button_unchecked"} filled={project.id === selectedProjectId} />
                      <span>{project.id === selectedProjectId ? "선택됨" : "선택"}</span>
                    </button>
                  </div>
                  <div className="project-history-name" role="cell">
                    <button type="button" onClick={() => onSelect(project.id)}>
                      <strong>{project.name}</strong>
                      <small>{project.description || "운영 메모 없음"}</small>
                    </button>
                  </div>
                  <div className="project-date-cell" role="cell">
                    <span>행사 스케줄</span>
                    <strong>{formatDateRange(getProjectEventStartDate(project), getProjectEventEndDate(project))}</strong>
                  </div>
                  <div className="project-date-cell" role="cell">
                    <span>실제 스케줄</span>
                    <strong>{formatDateRange(project.startDate, project.endDate)}</strong>
                  </div>
                  <div className="project-location-cell" role="cell">
                    <MaterialIcon name="location_on" />
                    <span>{project.location}</span>
                  </div>
                  <div className="project-status-control" role="cell">
                    <span className={`project-status project-status--${project.status.toLowerCase()}`}>
                      {projectStatusLabels[project.status]}
                    </span>
                    <select value={project.status} onChange={(event) => changeStatus(project.id, event.target.value as ProjectStatus)} aria-label={`${project.name} 상태 변경`}>
                      <option value="DRAFT">준비중</option>
                      <option value="ACTIVE">활성</option>
                      <option value="ARCHIVED">종료</option>
                    </select>
                  </div>
                  <div className="project-icon-actions" role="cell">
                    <button type="button" aria-label={`${project.name} 수정`} onClick={() => markIntegrationNeeded("edit")}>
                      <MaterialIcon name="edit" />
                    </button>
                    <button type="button" aria-label={`${project.name} 삭제`} onClick={() => markIntegrationNeeded("delete")}>
                      <MaterialIcon name="delete" />
                    </button>
                  </div>
                </article>
              )) : (
                <p className="empty-table-state">{projects.length === 0 ? "등록된 프로젝트가 없습니다." : "이 조건에 맞는 프로젝트가 없습니다."}</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {createModalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal project-create-modal" role="dialog" aria-modal="true" aria-labelledby="project-create-title">
            <header>
              <h2 id="project-create-title">새 프로젝트 등록</h2>
              <button type="button" aria-label="닫기" onClick={closeCreateModal}>
                <MaterialIcon name="close" />
              </button>
            </header>
            <form className="project-create-form" onSubmit={submitProject}>
              <div className="modal-body project-create-modal-body">
                <label>프로젝트명<input value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 2026 워터밤 겨울 준비" required /></label>
                <label>장소<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="예: 킨텍스 제2전시장" required /></label>
                <label>상태<select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}><option value="DRAFT">준비중</option><option value="ACTIVE">활성</option><option value="ARCHIVED">종료</option></select></label>
                <div className="project-schedule-stack">
                  <span>실제 스케줄</span>
                  <div>
                    <input aria-label="실제 스케줄 시작일" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
                    <input aria-label="실제 스케줄 종료일" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
                  </div>
                </div>
                <div className="project-schedule-stack">
                  <span>행사 스케줄</span>
                  <div>
                    <input aria-label="행사 스케줄 시작일" type="date" value={eventStartDate} onChange={(event) => setEventStartDate(event.target.value)} required />
                    <input aria-label="행사 스케줄 종료일" type="date" value={eventEndDate} onChange={(event) => setEventEndDate(event.target.value)} required />
                  </div>
                </div>
                <label>설명<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="운영 메모" /></label>
                {message ? <strong className="modal-message" role="status" aria-live="polite">{message}</strong> : null}
              </div>
              <footer>
                <button className="light-button" type="button" onClick={closeCreateModal}>취소</button>
                <button className="dark-button" type="submit"><MaterialIcon name="create_new_folder" />등록</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function getProjectEventStartDate(project: Project) {
  return project.eventStartDate || project.startDate;
}

function getProjectEventEndDate(project: Project) {
  return project.eventEndDate ?? project.endDate;
}

function formatDateRange(startDate: string, endDate: string | null) {
  const formattedStart = formatIsoDate(startDate);
  const formattedEnd = endDate ? formatIsoDate(endDate) : "미정";
  return `${formattedStart} ~ ${formattedEnd}`;
}

function formatIsoDate(value: string) {
  if (!value) {
    return "미정";
  }

  return value.slice(0, 10).replaceAll("-", ".");
}
