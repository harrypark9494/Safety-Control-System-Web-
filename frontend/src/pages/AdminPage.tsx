import { FormEvent, useEffect, useRef, useState } from "react";
import { MaterialIcon } from "../components/MaterialIcon";
import "../styles/admin.css";
import { clearSession, getAdminProjects, getAdminScheduleColumns, getRegisteredWorkers, getSession, getAdminWorkerCategories } from "../features/auth/session";
import { navigateTo } from "../features/navigation";
import type { AdminAccess, AdminScheduleColumn, Project, WorkerRegistrationAccount, WorkerCategorySetting } from "../types";
import { AdminsView } from "./admin/AdminsView";
import { DashboardView } from "./admin/DashboardView";
import { ProjectsView } from "./admin/ProjectsView";
import { QrView } from "./admin/QrView";
import { RulesView } from "./admin/RulesView";
import { ScheduleView } from "./admin/ScheduleView";
import { WeatherView } from "./admin/WeatherView";
import { WorkersView } from "./admin/WorkersView";

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
type AdminView = View | "projects";

const adminAccessViews: Record<AdminAccess, AdminView[]> = {
  workspace: ["dashboard", "weather", "schedule", "qr", "workers", "rules", "admins", "projects"],
  schedule: ["dashboard", "weather", "schedule", "rules"],
  qr: ["qr"],
};

export function AdminPage() {
  const [view, setView] = useState<AdminView>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectMessage, setProjectMessage] = useState("");
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);
  const [workers, setWorkers] = useState<WorkerRegistrationAccount[]>([]);
  const [workerCategories, setWorkerCategories] = useState<WorkerCategorySetting[]>([]);
  const [workerCategoriesReady, setWorkerCategoriesReady] = useState(false);
  const [workerMessage, setWorkerMessage] = useState("");
  const [scheduleColumns, setScheduleColumns] = useState<AdminScheduleColumn[]>([]);
  const [scheduleColumnsReady, setScheduleColumnsReady] = useState(false);
  const [scheduleMessage, setScheduleMessage] = useState("");
  const session = getSession();
  const adminAccess = session?.role === "admin" ? session.adminAccess : "workspace";
  const allowedViews = adminAccessViews[adminAccess];
  const primaryNavItems = navItems.slice(0, 6).filter(([id]) => allowedViews.includes(id));
  const canOpenAdminManagement = allowedViews.includes("admins");
  const canOpenProjectManagement = allowedViews.includes("projects");
  const projectSwitcherRef = useRef<HTMLDivElement | null>(null);

  function submitAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalMessage("관리자 계정 등록 API 연동이 필요합니다.");
  }

  function logout() {
    clearSession();
    navigateTo("/login/admin/");
  }

  useEffect(() => {
    refreshProjects();
  }, []);

  useEffect(() => {
    if (!allowedViews.includes(view)) {
      setView(allowedViews[0] ?? "dashboard");
    }
  }, [allowedViews, view]);

  useEffect(() => {
    if (selectedProjectId) {
      refreshWorkers(selectedProjectId);
      refreshWorkerCategories(selectedProjectId);
      refreshScheduleColumns(selectedProjectId);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!projectSwitcherOpen) {
      return undefined;
    }

    function closeProjectSwitcher(event: MouseEvent) {
      if (!projectSwitcherRef.current?.contains(event.target as Node)) {
        setProjectSwitcherOpen(false);
      }
    }

    document.addEventListener("mousedown", closeProjectSwitcher);
    return () => document.removeEventListener("mousedown", closeProjectSwitcher);
  }, [projectSwitcherOpen]);

  async function refreshProjects() {
    try {
      const nextProjects = await getAdminProjects({ includeArchived: true });
      setProjects(nextProjects);
      const nextSelectedProjectId = nextProjects.find((project) => project.status === "ACTIVE")?.id || nextProjects[0]?.id || "";
      setSelectedProjectId((current) => nextProjects.some((project) => project.id === current) ? current : nextSelectedProjectId);

      if (nextProjects.length === 0) {
        setProjectMessage("등록된 프로젝트가 없습니다. 새 프로젝트를 먼저 생성해 주세요.");
        if (canOpenProjectManagement) {
          setView("projects");
        }
        return;
      }

      setProjectMessage("");
    } catch (error) {
      setProjectMessage(error instanceof Error ? error.message : "프로젝트 목록을 불러오지 못했습니다.");
    }
  }

  async function refreshWorkers(projectId = selectedProjectId) {
    if (!projectId) {
      setWorkers([]);
      return;
    }

    try {
      setWorkers(await getRegisteredWorkers(projectId));
      setWorkerMessage("");
    } catch (error) {
      setWorkerMessage(error instanceof Error ? error.message : "근로자 목록을 불러오지 못했습니다.");
    }
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null;

  function selectProject(projectId: string) {
    setSelectedProjectId(projectId);
    setProjectSwitcherOpen(false);
  }

  async function refreshWorkerCategories(projectId = selectedProjectId) {
    if (!projectId) {
      setWorkerCategories([]);
      setWorkerCategoriesReady(false);
      return;
    }

    try {
      const nextWorkerCategories = await getAdminWorkerCategories(projectId);
      setWorkerCategories(nextWorkerCategories);
      setWorkerCategoriesReady(true);
    } catch (error) {
      setWorkerCategories([]);
      setWorkerCategoriesReady(false);
      setWorkerMessage(error instanceof Error ? error.message : "고용 유형 목록을 불러오지 못했습니다.");
    }
  }

  async function refreshScheduleColumns(projectId = selectedProjectId) {
    try {
      setScheduleColumnsReady(false);
      const nextColumns = await getAdminScheduleColumns(projectId);
      setScheduleColumns(nextColumns);
      setScheduleColumnsReady(true);
      setScheduleMessage("");
    } catch (error) {
      setScheduleColumns([]);
      setScheduleColumnsReady(false);
      setScheduleMessage(error instanceof Error ? error.message : "스케줄 컬럼 목록을 불러오지 못했습니다.");
    }
  }

  return (
    <>
      <main className="admin-shell">
        <aside className="admin-sidebar" aria-label="관리자 메뉴">
          <div className="brand-block">
            <strong>워터밤 안전 관제 시스템</strong>
            <span>관리자 페이지</span>
            <div className="project-switcher" ref={projectSwitcherRef}>
              <button
                className="current-project-button"
                type="button"
                onClick={() => setProjectSwitcherOpen((current) => !current)}
                disabled={projects.length === 0}
                aria-haspopup="listbox"
                aria-expanded={projectSwitcherOpen}
              >
                <span>
                  <b>{selectedProject?.name ?? "프로젝트 선택 필요"}</b>
                  <small>{selectedProject ? `${formatProjectStatus(selectedProject.status)} · ${selectedProject.location}` : "선택 가능한 프로젝트 없음"}</small>
                </span>
                <MaterialIcon name="expand_more" />
              </button>
              {projectSwitcherOpen ? (
                <div className="project-switcher-menu" role="listbox" aria-label="프로젝트 선택">
                  {projects.map((project) => (
                    <button
                      className={project.id === selectedProjectId ? "is-selected" : ""}
                      type="button"
                      role="option"
                      aria-selected={project.id === selectedProjectId}
                      key={project.id}
                      onClick={() => selectProject(project.id)}
                    >
                      <span>
                        <b>{project.name}</b>
                        <small>{formatProjectStatus(project.status)} · {project.location}</small>
                      </span>
                      {project.id === selectedProjectId ? <MaterialIcon name="check" /> : null}
                    </button>
                  ))}
                  {canOpenProjectManagement ? (
                    <button className="project-switcher-manage" type="button" onClick={() => { setProjectSwitcherOpen(false); setView("projects"); }}>
                      <MaterialIcon name="folder_managed" />
                      프로젝트 관리
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <nav className="admin-nav" aria-label="주요 메뉴">
            {primaryNavItems.map(([id, icon, label]) => (
              <button className={`nav-item ${view === id ? "is-active" : ""}`} type="button" key={id} onClick={() => setView(id)}>
                <MaterialIcon name={icon} className="nav-icon" filled={view === id} />
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            {canOpenAdminManagement ? (
              <button className={`nav-item nav-item--admin ${view === "admins" ? "is-active" : ""}`} type="button" onClick={() => setView("admins")}>
                <MaterialIcon name="admin_panel_settings" className="nav-icon" filled={view === "admins"} />
                어드민 관리
              </button>
            ) : null}
            {canOpenProjectManagement ? (
              <button className={`nav-item nav-item--plain ${view === "projects" ? "is-active" : ""}`} type="button" onClick={() => setView("projects")}>
                <MaterialIcon name="folder_managed" className="nav-icon" filled={view === "projects"} />
                프로젝트 관리
              </button>
            ) : null}
            <button className="nav-item nav-item--plain" type="button" onClick={logout}>
              <MaterialIcon name="logout" className="nav-icon" />
              로그아웃
            </button>
          </div>
        </aside>

        <section className="admin-main">
          {projectMessage ? <p className="admin-message admin-message--global" role="status">{projectMessage}</p> : null}
          {view === "dashboard" ? <DashboardView project={selectedProject} /> : null}
          {view === "weather" ? <WeatherView projectId={selectedProjectId} /> : null}
          {view === "schedule" ? <ScheduleView columns={scheduleColumns} columnsReady={scheduleColumnsReady} message={scheduleMessage} project={selectedProject} onColumnsChange={setScheduleColumns} /> : null}
          {view === "qr" ? <QrView projectId={selectedProjectId} /> : null}
          {view === "workers" ? (
            <WorkersView
              projectId={selectedProjectId}
              workers={workers}
              workerCategories={workerCategories}
              workerCategoriesReady={workerCategoriesReady}
              message={workerMessage}
              onRefresh={refreshWorkers}
              onRefreshWorkerCategories={refreshWorkerCategories}
            />
          ) : null}
          {view === "rules" ? <RulesView projectId={selectedProjectId} /> : null}
          {view === "admins" ? <AdminsView onOpen={() => setModalOpen(true)} /> : null}
          {view === "projects" ? (
            <ProjectsView
              projects={projects}
              selectedProjectId={selectedProjectId}
              shouldGuideInitialCreate={projects.length === 0}
              onSelect={selectProject}
              onRefresh={refreshProjects}
            />
          ) : null}
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
                <label>권한 설정<select name="role"><option>워크스페이스 전체 권한</option><option>스케줄 감독</option><option>QR코드 관리자</option></select></label>
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

function formatProjectStatus(status: Project["status"]) {
  return {
    DRAFT: "준비중",
    ACTIVE: "활성",
    ARCHIVED: "종료",
  }[status];
}
