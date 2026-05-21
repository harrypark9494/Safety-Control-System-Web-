import { FormEvent, useState } from "react";
import {
  requiresPayrollDocuments,
  signInDemoAdmin,
  signInDemoWorker,
} from "../features/auth/session";

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function LoginPage() {
  const [tab, setTab] = useState<"worker" | "admin">("worker");
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function submitWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      const session = signInDemoWorker(phone, code, password);
      window.location.href = requiresPayrollDocuments(session)
        ? "/payroll-documents/"
        : "/dashboard/";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    }
  }

  function submitAdmin() {
    signInDemoAdmin();
    window.location.href = "/admin/";
  }

  return (
    <main className="auth-shell">
      <header className="app-topbar">
        <h1>워터밤 안전 관제 시스템</h1>
      </header>

      <section className="auth-panel" aria-label="로그인 양식">
        <div className="page-heading">
          <div>
            <p className="eyebrow">Safety Control</p>
            <h2>로그인</h2>
          </div>
        </div>

        <div className="segmented">
          <button className={tab === "worker" ? "active" : ""} onClick={() => setTab("worker")} type="button">
            일반 사용자
          </button>
          <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")} type="button">
            관리자
          </button>
        </div>

        {tab === "worker" ? (
          <>
            <div className="segmented muted">
              <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">
                최초 등록
              </button>
              <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">
                로그인
              </button>
            </div>

            <form className="form-grid" onSubmit={submitWorker}>
              {mode === "login" && (
                <label>
                  이름
                  <input value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
              )}
              <label>
                연락처
                <input
                  value={phone}
                  onChange={(event) => setPhone(formatPhone(event.target.value))}
                  placeholder="010-0000-0000"
                  required
                />
              </label>
              <label>
                인증 코드
                <div className="code-row">
                  <input value={code} onChange={(event) => setCode(event.target.value)} required />
                  <button className="secondary-button" onClick={() => setMessage("인증 코드를 보냈습니다.")} type="button">
                    코드 요청
                  </button>
                </div>
              </label>
              <label>
                비밀번호
                <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
              </label>
              <button className="primary-button" type="submit">
                {mode === "register" ? "등록 승인 요청" : "대시보드로 로그인"}
              </button>
            </form>
          </>
        ) : (
          <div className="form-grid">
            <section className="admin-copy">
              <h2>관리자 Google 로그인</h2>
            </section>
            <button className="google-button" onClick={submitAdmin} type="button">
              <span>G</span>
              Google 계정으로 계속
            </button>
          </div>
        )}

        <p className="message" role="status">
          {message}
        </p>
      </section>
    </main>
  );
}
