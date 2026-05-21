import { FormEvent, useState } from "react";
import { getSession, markPayrollSubmitted } from "../features/auth/session";
import type { WorkType } from "../types";

export function PayrollDocumentsPage() {
  const session = getSession();
  const [step, setStep] = useState<"basic" | "documents">("basic");
  const [workType, setWorkType] = useState<WorkType>("직접 고용");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markPayrollSubmitted();
    setMessage("급여 정보 등록이 완료되었습니다. 대시보드로 이동합니다.");
    window.setTimeout(() => {
      window.location.href = "/dashboard/";
    }, 650);
  }

  return (
    <main className="auth-shell wide">
      <header className="app-topbar">
        <h1>급여 정보 등록</h1>
      </header>

      <form className="auth-panel wide-panel" onSubmit={submit}>
        <div className="page-heading">
          <div>
            <p className="eyebrow">Payroll / Tax</p>
            <h2>{step === "basic" ? "기본 정보 확인" : "서류 제출"}</h2>
          </div>
          <span className="status-pill">Firebase Storage 준비</span>
        </div>

        <section className="info-strip">
          <div>
            <small>로그인 사용자</small>
            <strong>{session?.role === "worker" ? session.name : "작업자 A"}</strong>
          </div>
          <div>
            <small>근무 일정</small>
            <strong>{session?.role === "worker" ? session.schedule : "DB 근무 일정 연동 예정"}</strong>
          </div>
        </section>

        {step === "basic" ? (
          <div className="form-grid two-col">
            <label>
              근무 유형
              <select value={workType} onChange={(event) => setWorkType(event.target.value as WorkType)} required>
                <option>직접 고용</option>
                <option>외부 고용</option>
              </select>
            </label>
            <label>
              주민등록번호
              <input placeholder="000000-0000000" required />
            </label>
            <label>
              우편번호
              <input placeholder="00000" required />
            </label>
            <label>
              주소
              <input placeholder="서울특별시 00구 00로 00" required />
            </label>
            <label className="full-field">
              상세 주소
              <input placeholder="상세 주소 입력" />
            </label>
            <label className="check-row full-field">
              <input type="checkbox" required />
              개인정보 수집 및 급여/세무 처리 목적 이용에 동의합니다.
            </label>
            <button className="primary-button full-field" onClick={() => setStep("documents")} type="button">
              다음
            </button>
          </div>
        ) : (
          <div className="form-grid two-col">
            <label>
              은행명
              <input placeholder="은행 선택 또는 입력" required />
            </label>
            <label>
              예금주
              <input placeholder="예: 작업자 A" required />
            </label>
            <label className="full-field">
              계좌번호
              <input placeholder="계좌번호 입력" required />
            </label>
            <label>
              신분증 사본
              <input accept="image/*,.pdf" type="file" required />
            </label>
            <label>
              통장 사본
              <input accept="image/*,.pdf" type="file" required />
            </label>
            <button className="secondary-button" onClick={() => setStep("basic")} type="button">
              이전
            </button>
            <button className="primary-button" type="submit">
              제출하기
            </button>
          </div>
        )}

        <p className="message">{message}</p>
      </form>
    </main>
  );
}
