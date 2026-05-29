import { FormEvent, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { createAdminProject, updateAdminProjectStatus } from "../../features/auth/session";
import type { Project, ProjectStatus } from "../../types";

const projectStatusLabels: Record<ProjectStatus, string> = {
  DRAFT: "준비 중",
  ACTIVE: "운영 중",
  ARCHIVED: "아카이브",
};

const projectStatusGroups: { status: ProjectStatus; icon: string; title: string }[] = [
  { status: "ACTIVE", icon: "folder_open", title: "운영 중" },
  { status: "DRAFT", icon: "folder", title: "준비 중" },
  { status: "ARCHIVED", icon: "inventory_2", title: "아카이브" },
];

export function ProjectsView({
  projects,
  selectedProjectId,
  onSelect,
  onRefresh,
}: {
  projects: Project[];
  selectedProjectId: string;
  onSelect: (projectId: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("DRAFT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const project = await createAdminProject({
        name,
        status,
        startDate,
        endDate: endDate || null,
        location,
        description,
        createdBy: "admin",
      });
      setName("");
      setStatus("DRAFT");
      setStartDate("");
      setEndDate("");
      setLocation("");
      setDescription("");
      setMessage("프로젝트가 생성되었습니다.");
      await onRefresh();
      onSelect(project.id);
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

  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions">
        <h1>프로젝트 관리</h1>
        <span className="page-project-label">프로젝트 보관함</span>
      </header>
      <div className="page-content admin-tab-page project-page">
        <form className="app-card project-create-card" onSubmit={submitProject}>
          <div className="section-toolbar">
            <h2>프로젝트 생성</h2>
            <span className="count-pill">상태 기반 관리</span>
          </div>
          <div className="project-form-grid">
            <label>프로젝트명<input value={name} onChange={(event) => setName(event.target.value)} placeholder="예: 2026 워터밤 겨울 준비" required /></label>
            <label>상태<select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}><option value="DRAFT">준비 중</option><option value="ACTIVE">운영 중</option><option value="ARCHIVED">아카이브</option></select></label>
            <label>시작일<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label>
            <label>종료일<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
            <label>장소<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="예: 킨텍스 제2전시장" required /></label>
            <label>설명<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="운영 메모" /></label>
          </div>
          <footer>
            {message ? <p className="form-message" role="status">{message}</p> : <span></span>}
            <button className="dark-button" type="submit"><MaterialIcon name="create_new_folder" />생성</button>
          </footer>
        </form>

        <div className="project-folder-grid">
          {projectStatusGroups.map((group) => {
            const groupedProjects = projects.filter((project) => project.status === group.status);

            return (
              <section className="app-card project-folder" aria-labelledby={`project-folder-${group.status}`} key={group.status}>
                <div className="project-folder-head">
                  <MaterialIcon name={group.icon} filled={group.status === "ACTIVE"} />
                  <div>
                    <h2 id={`project-folder-${group.status}`}>{group.title}</h2>
                    <small>{groupedProjects.length}개 프로젝트</small>
                  </div>
                </div>
                <div className="project-list">
                  {groupedProjects.length > 0 ? groupedProjects.map((project) => (
                    <article className={`project-row ${project.id === selectedProjectId ? "is-selected" : ""}`} key={project.id}>
                      <div>
                        <strong>{project.name}</strong>
                        <small>{project.location} · {project.startDate}{project.endDate ? ` - ${project.endDate}` : ""}</small>
                      </div>
                      <span className={`project-status project-status--${project.status.toLowerCase()}`}>
                        {projectStatusLabels[project.status]}
                      </span>
                      <div className="project-row-actions">
                        <button className={project.id === selectedProjectId ? "light-button" : "dark-button"} type="button" disabled={project.id === selectedProjectId} onClick={() => onSelect(project.id)}>
                          {project.id === selectedProjectId ? "선택됨" : "선택"}
                        </button>
                        <select value={project.status} onChange={(event) => changeStatus(project.id, event.target.value as ProjectStatus)} aria-label={`${project.name} 상태 변경`}>
                          <option value="DRAFT">준비 중</option>
                          <option value="ACTIVE">운영 중</option>
                          <option value="ARCHIVED">아카이브</option>
                        </select>
                      </div>
                    </article>
                  )) : (
                    <p className="empty-table-state">이 상태의 프로젝트가 없습니다.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
