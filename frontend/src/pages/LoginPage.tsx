import { FormEvent, useEffect, useState } from "react";
import "../styles/login.css";
import { fallbackWorkTypes } from "../data/workTypes";
import {
  completeWorkerOnboarding,
  getWorkTypes,
  signInAdmin,
  signInWorker,
} from "../features/auth/session";
import { getSecureEntryPath, navigateTo } from "../features/navigation";
import { formatPhone } from "../features/phone";
import type { WorkType, WorkTypeSetting } from "../types";

export function LoginPage() {
  const [tab, setTab] = useState<"worker" | "admin">("worker");
  const [mode, setMode] = useState<"register" | "login">("register");
  const [registerName, setRegisterName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerCode, setRegisterCode] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [workTypes, setWorkTypes] = useState<WorkTypeSetting[]>(fallbackWorkTypes);
  const [registerWorkType, setRegisterWorkType] = useState<WorkType>(fallbackWorkTypes[0].label);
  const [loginName, setLoginName] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    getWorkTypes()
      .then((nextWorkTypes) => {
        if (!isMounted || nextWorkTypes.length === 0) return;
        setWorkTypes(nextWorkTypes);
        setRegisterWorkType((current) =>
          nextWorkTypes.some((workType) => workType.label === current) ? current : nextWorkTypes[0].label,
        );
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "고용 유형 목록을 불러오지 못했습니다.");
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
      if (mode === "register") {
        await completeWorkerOnboarding(registerName, phone, code, password, registerWorkType);
        setMessage("등록된 근로자 정보와 일치합니다. 이제 로그인할 수 있습니다.");
        setMode("login");
        setLoginName(registerName);
        setLoginPhone(registerPhone);
        setLoginCode(registerCode);
        setLoginPassword(registerPassword);
        return;
      }

      await signInWorker(phone, code, password, name);
      navigateTo(getSecureEntryPath());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    }
  }

  async function submitAdmin() {
    try {
      await signInAdmin();
      navigateTo(getSecureEntryPath());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "관리자 Google 로그인에 실패했습니다.");
    }
  }

  return (
    <>
      <main className="login-shell">
        <header className="login-header" aria-labelledby="login-title">
          <h1>워터밤 안전 관제 시스템</h1>
        </header>

        <section className="login-panel login-panel--narrow" aria-label="로그인 양식">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Safety Control</p>
              <h2 id="login-title">로그인</h2>
            </div>
          </div>

          <div className="tabs" role="tablist" aria-label="로그인 유형">
            <button
              className={`tab-button ${tab === "worker" ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={tab === "worker"}
              onClick={() => setTab("worker")}
            >
              일반 사용자
            </button>
            <button
              className={`tab-button ${tab === "admin" ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={tab === "admin"}
              onClick={() => setTab("admin")}
            >
              관리자
            </button>
          </div>

          {tab === "worker" ? (
            <div className="auth-form active" role="tabpanel">
              <div className="mode-switch" role="tablist" aria-label="일반 사용자 절차">
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
                      required
                    >
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

                <button className="primary-button" type="submit">
                  {mode === "register" ? "회원가입 완료" : "대시보드로 로그인"}
                </button>
              </form>
            </div>
          ) : (
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
          )}

          <p className="message" role="status" aria-live="polite">
            {message}
          </p>
        </section>
      </main>
    </>
  );
}
