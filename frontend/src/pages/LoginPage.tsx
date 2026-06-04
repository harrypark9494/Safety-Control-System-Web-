import { FormEvent, useEffect, useState } from "react";
import "../styles/login.css";
import {
  completeWorkerOnboarding,
  getSelectableProjects,
  getWorkTypes,
  signInAdmin,
  signInWorker,
} from "../features/auth/session";
import { getSecureEntryPath, navigateTo } from "../features/navigation";
import { formatPhone } from "../features/phone";
import type { Project, WorkType, WorkTypeSetting } from "../types";

export function WorkerLoginPage() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerCode, setRegisterCode] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [workTypes, setWorkTypes] = useState<WorkTypeSetting[]>([]);
  const [registerWorkType, setRegisterWorkType] = useState<WorkType>("");
  const [workTypesStatus, setWorkTypesStatus] = useState<"loading" | "ready" | "error">("loading");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectsStatus, setProjectsStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loginName, setLoginName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [message, setMessage] = useState("");
  const canRegisterWithWorkTypes = workTypesStatus === "ready" && workTypes.length > 0;
  const canUseWorkerProject = projectsStatus === "ready" && projects.length > 0 && Boolean(selectedProjectId);

  useEffect(() => {
    let isMounted = true;

    getWorkTypes()
      .then((nextWorkTypes) => {
        if (!isMounted) return;
        setWorkTypes(nextWorkTypes);
        setWorkTypesStatus("ready");
        setRegisterWorkType((current) => {
          if (nextWorkTypes.length === 0) {
            return "";
          }

          return nextWorkTypes.some((workType) => workType.label === current) ? current : nextWorkTypes[0].label;
        });
      })
      .catch((error) => {
        if (!isMounted) return;
        setWorkTypes([]);
        setRegisterWorkType("");
        setWorkTypesStatus("error");
        setMessage(error instanceof Error ? error.message : "고용 유형 목록을 불러오지 못했습니다.");
      });

    getSelectableProjects()
      .then((nextProjects) => {
        if (!isMounted) return;
        setProjects(nextProjects);
        setProjectsStatus("ready");
        setSelectedProjectId((current) => {
          if (nextProjects.length === 0) {
            return "";
          }

          return nextProjects.some((project) => project.id === current) ? current : nextProjects[0].id;
        });
      })
      .catch((error) => {
        if (!isMounted) return;
        setProjects([]);
        setSelectedProjectId("");
        setProjectsStatus("error");
        setMessage(error instanceof Error ? error.message : "프로젝트 목록을 불러오지 못했습니다.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function submitWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const phone = mode === "register" ? registerPhone : loginPhone;
    const code = mode === "register" ? registerCode : loginCode;
    const password = mode === "register" ? registerPassword : loginPassword;
    const name = mode === "register" ? registerName : loginName;

    try {
      if (!canUseWorkerProject) {
        setMessage("프로젝트 목록을 불러온 뒤 진행할 수 있습니다.");
        return;
      }

      if (mode === "register") {
        if (!canRegisterWithWorkTypes) {
          setMessage("고용 유형 목록을 불러온 뒤 최초 등록을 진행할 수 있습니다.");
          return;
        }

        await completeWorkerOnboarding(selectedProjectId, registerName, phone, code, password, registerWorkType);
        setMessage("등록된 근로자 정보와 일치합니다. 이제 로그인할 수 있습니다.");
        setMode("login");
        setLoginName(registerName);
        setLoginPhone(registerPhone);
        setLoginCode(registerCode);
        setLoginPassword(registerPassword);
        return;
      }

      await signInWorker(selectedProjectId, phone, code, password, name);
      navigateTo(getSecureEntryPath());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    }
  }

  return (
    <main className="login-shell">
      <LoginHeader />

      <section className="login-panel login-panel--narrow" aria-label="근로자 로그인 양식">
        <LoginPageHeading title="근로자 로그인" />

        <div className="mode-switch" role="tablist" aria-label="근로자 절차">
          <button
            className={`mode-button ${mode === "register" ? "active" : ""}`}
            type="button"
            aria-selected={mode === "register"}
            onClick={() => setMode("register")}
          >
            최초 등록
          </button>
          <button
            className={`mode-button ${mode === "login" ? "active" : ""}`}
            type="button"
            aria-selected={mode === "login"}
            onClick={() => setMode("login")}
          >
            로그인
          </button>
        </div>

        <form className="worker-flow active" onSubmit={submitWorker}>
          <label className="login-field">
            <span className="login-field-title">프로젝트</span>
            <select
              name="projectId"
              value={selectedProjectId}
              onChange={(event) => setSelectedProjectId(event.target.value)}
              disabled={!canUseWorkerProject}
              required
            >
              {!canUseWorkerProject ? (
                <option value="">
                  {projectsStatus === "loading" ? "프로젝트를 불러오는 중입니다" : "선택 가능한 프로젝트가 없습니다"}
                </option>
              ) : null}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          {mode === "register" ? (
            <label className="login-field">
              <span className="login-field-title">이름</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                required
              />
            </label>
          ) : (
            <label className="login-field">
              <span className="login-field-title">이름</span>
              <input
                name="name"
                type="text"
                autoComplete="name"
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                required
              />
            </label>
          )}

          <label className="login-field">
            <span className="login-field-title">연락처</span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="010-1234-5678"
              maxLength={13}
              value={mode === "register" ? registerPhone : loginPhone}
              onChange={(event) => {
                const next = formatPhone(event.target.value);
                if (mode === "register") setRegisterPhone(next);
                else setLoginPhone(next);
              }}
              required
            />
          </label>

          <label className="login-field">
            <span className="login-field-title">인증 코드</span>
            <div className="code-row">
              <input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={mode === "register" ? registerCode : loginCode}
                onChange={(event) => {
                  if (mode === "register") setRegisterCode(event.target.value);
                  else setLoginCode(event.target.value);
                }}
                required
              />
              <button
                className="secondary-button request-code"
                type="button"
                onClick={() => setMessage("인증 코드 발송 API 연동이 필요합니다. 현재는 발급받은 코드를 입력해 주세요.")}
              >
                코드 요청
              </button>
            </div>
          </label>

          {mode === "register" ? (
            <label className="login-field">
              <span className="login-field-title">고용 유형</span>
              <select
                name="workType"
                value={registerWorkType}
                onChange={(event) => setRegisterWorkType(event.target.value as WorkType)}
                disabled={!canRegisterWithWorkTypes}
                required
              >
                {!canRegisterWithWorkTypes ? (
                  <option value="">
                    {workTypesStatus === "loading" ? "고용 유형을 불러오는 중입니다" : "등록 가능한 고용 유형이 없습니다"}
                  </option>
                ) : null}
                {workTypes.map((workTypeOption) => (
                  <option key={workTypeOption.label} value={workTypeOption.label}>
                    {workTypeOption.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="login-field">
            <span className="login-field-title">
              {mode === "register" ? "비밀번호 설정" : "비밀번호"}
            </span>
            <input
              name="password"
              type="password"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              placeholder={mode === "register" ? "8자 이상" : "등록된 비밀번호"}
              value={mode === "register" ? registerPassword : loginPassword}
              onChange={(event) => {
                if (mode === "register") setRegisterPassword(event.target.value);
                else setLoginPassword(event.target.value);
              }}
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={!canUseWorkerProject || (mode === "register" && !canRegisterWithWorkTypes)}>
            {mode === "register" ? "회원가입 완료" : "대시보드로 로그인"}
          </button>
        </form>

        <LoginMessage message={message} />
      </section>
    </main>
  );
}

export function AdminLoginPage() {
  const [message, setMessage] = useState("");

  async function submitAdmin() {
    try {
      await signInAdmin();
      navigateTo(getSecureEntryPath());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "관리자 Google 로그인에 실패했습니다.");
    }
  }

  return (
    <main className="login-shell">
      <LoginHeader />

      <section className="login-panel login-panel--narrow" aria-label="관리자 로그인 양식">
        <LoginPageHeading title="관리자 로그인" />

        <div className="auth-form active" role="tabpanel">
          <div className="admin-copy">
            <h2>관리자 Google 로그인</h2>
          </div>
          <button className="google-button" type="button" onClick={submitAdmin}>
            <span className="google-g" aria-hidden="true">
              G
            </span>
            Google 계정으로 계속
          </button>
        </div>

        <LoginMessage message={message} />
      </section>
    </main>
  );
}

function LoginHeader() {
  return (
    <header className="login-header">
      <h1>워터밤 안전 관제 시스템</h1>
    </header>
  );
}

function LoginPageHeading({ title }: { title: string }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">Safety Control</p>
        <h2>{title}</h2>
      </div>
    </div>
  );
}

function LoginMessage({ message }: { message: string }) {
  return (
    <p className="message" role="status" aria-live="polite">
      {message}
    </p>
  );
}
