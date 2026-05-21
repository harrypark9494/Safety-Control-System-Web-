import { ChangeEvent, FormEvent, useState } from "react";
import "../styles/payroll-documents.css";
import { getSession, markPayrollSubmitted, saveSession } from "../features/auth/session";
import { SECURE_ENTRY_PATH, navigateTo } from "../features/navigation";
import type { WorkerSession } from "../types";

const banks = ["국민", "신한", "우리", "하나", "농협", "기업", "카카오뱅크", "토스뱅크"];

function ensureDemoSession() {
  const current = getSession();

  if (current || !window.location.search.includes("demo=1")) {
    return current;
  }

  const demoSession: WorkerSession = {
    uid: "worker-direct-demo",
    role: "worker" as const,
    name: "직접 고용 작업자",
    phone: "010-0000-0000",
    workType: "직접 고용",
    team: "직접 고용 A팀",
    supervisor: "관리자 A",
    schedule: "05.20(수) 09:00-18:00 / A현장 2구역",
    status: "출근 확인",
    payrollDocumentStatus: "missing" as const,
  };
  saveSession(demoSession);
  return demoSession;
}

function fileLabel(file?: File): string {
  if (!file) return "";
  const size = Math.max(1, Math.round(file.size / 1024));
  return `${file.name} · ${size}KB`;
}

export function PayrollDocumentsPage() {
  const session = ensureDemoSession();
  const [step, setStep] = useState<"basic" | "documents">("basic");
  const [bankOpen, setBankOpen] = useState(false);
  const [bankName, setBankName] = useState("");
  const [idFile, setIdFile] = useState<File | undefined>();
  const [bankbookFile, setBankbookFile] = useState<File | undefined>();
  const [message, setMessage] = useState("");

  function goDocuments() {
    setStep("documents");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBasic() {
    setStep("basic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function searchAddress() {
    const postcode = document.querySelector<HTMLInputElement>("#postcode");
    const address = document.querySelector<HTMLInputElement>("#address");
    if (postcode) postcode.value = "00000";
    if (address) address.value = "서울특별시 00구 00로 00";
  }

  function updateFile(setter: (file: File | undefined) => void) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setter(event.target.files?.[0]);
    };
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markPayrollSubmitted();
    setMessage("급여 정보 등록이 완료되었습니다. 대시보드로 이동합니다.");
    window.setTimeout(() => {
      navigateTo(SECURE_ENTRY_PATH);
    }, 650);
  }

  const workerName = session?.role === "worker" ? session.name : "직접 고용 작업자";
  const workerPhone = session?.role === "worker" ? session.phone : "010-0000-0000";
  const workerSchedule = session?.role === "worker" ? session.schedule : "05.20(수) 09:00-18:00 / A현장 2구역";

  return (
    <>
      <main className="app-shell">
        <header className="app-header" aria-labelledby="documents-title">
          <h1>워터밤 안전 관제 시스템</h1>
        </header>

        <section className="app-panel app-panel--wide" aria-label="급여 정보 등록 입력 양식">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Payroll Onboarding</p>
              <h2 id="documents-title">급여 정보 등록</h2>
            </div>
            <div className="progress-steps" aria-label="입력 단계">
              <span className={`progress-step ${step === "basic" ? "active" : ""}`} aria-current={step === "basic" ? "step" : undefined}>
                <span className="progress-number">1</span>
                <span className="progress-label">기본 정보 입력</span>
              </span>
              <span className={`progress-step ${step === "documents" ? "active" : ""}`} aria-current={step === "documents" ? "step" : undefined}>
                <span className="progress-number">2</span>
                <span className="progress-label">서류 제출</span>
              </span>
            </div>
          </div>

          <form className="documents-form" onSubmit={submit}>
            {step === "basic" ? (
              <section className="form-section active" aria-labelledby="basic-info-title">
                <div className="section-heading">
                  <span className="step-badge">1</span>
                  <div>
                    <h2 id="basic-info-title">기본 정보 입력</h2>
                  </div>
                </div>

                <div className="section-intro">
                  <strong>{workerName}님</strong>
                  <span>기본 정보를 확인해주세요.</span>
                </div>

                <div className="readonly-card" aria-label="확인 정보">
                  <div className="readonly-row">
                    <span>연락처</span>
                    <strong>{workerPhone}</strong>
                  </div>
                  <div className="readonly-row">
                    <span>근무 일정</span>
                    <strong>{workerSchedule}</strong>
                  </div>
                </div>

                <div className="additional-info">
                  <h3>추가 정보 입력</h3>

                  <fieldset className="field-group">
                    <legend>주민등록번호</legend>
                    <div className="resident-number-row">
                      <input
                        aria-label="주민등록번호 앞번호"
                        name="residentNumberFront"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="000000"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                      />
                      <span aria-hidden="true">-</span>
                      <input
                        aria-label="주민등록번호 뒷번호"
                        name="residentNumberBack"
                        type="password"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="0000000"
                        pattern="[0-9]{7}"
                        maxLength={7}
                        required
                      />
                    </div>
                  </fieldset>

                  <fieldset className="field-group">
                    <legend>주소</legend>
                    <div className="address-fields">
                      <div className="address-row">
                        <input id="postcode" name="postcode" type="text" inputMode="numeric" placeholder="우편번호" readOnly required />
                        <button className="secondary-button" type="button" onClick={searchAddress}>
                          검색
                        </button>
                      </div>
                      <input id="address" name="address" type="text" placeholder="기본 주소" readOnly required />
                      <input name="addressDetail" type="text" placeholder="상세주소 입력" />
                    </div>
                  </fieldset>
                </div>

                <label className="agreement">
                  <input name="privacyAgreement" type="checkbox" required />
                  <span>급여 및 인사 처리를 위한 개인정보 수집에 동의합니다.</span>
                </label>

                <div className="step-actions">
                  <button className="primary-button" type="button" onClick={goDocuments}>
                    다음
                  </button>
                </div>
              </section>
            ) : (
              <section className="form-section active" aria-labelledby="document-info-title">
                <div className="section-heading">
                  <span className="step-badge">2</span>
                  <div>
                    <h2 id="document-info-title">서류 제출</h2>
                  </div>
                </div>

                <div className="upload-card">
                  <p className="upload-title">
                    신분증 사본 <span>(필수)</span>
                  </p>
                  <input id="id-card-file" className="sr-only" name="idCardFile" type="file" accept="image/*,.pdf" required onChange={updateFile(setIdFile)} />
                  <label className="upload-target" htmlFor="id-card-file">
                    <output className={`file-preview ${idFile ? "" : "empty"}`} aria-live="polite">
                      <span className="upload-icon" aria-hidden="true" />
                      <strong>{idFile ? fileLabel(idFile) : "이미지를 눌러 업로드하세요."}</strong>
                      <small>{idFile ? "선택한 파일을 다시 누르면 변경할 수 있습니다." : "이미지 또는 PDF"}</small>
                    </output>
                  </label>
                </div>

                <div className="bank-grid">
                  <div className="bank-field">
                    <label htmlFor="bank-name">은행명</label>
                    <input
                      id="bank-name"
                      name="bankName"
                      type="text"
                      placeholder="은행명"
                      autoComplete="off"
                      value={bankName}
                      onChange={(event) => setBankName(event.target.value)}
                      required
                    />
                  </div>
                  <button className="secondary-button bank-toggle" type="button" aria-expanded={bankOpen} onClick={() => setBankOpen(!bankOpen)}>
                    은행 목록
                  </button>
                  <label>
                    예금주
                    <input name="accountHolder" type="text" placeholder="예: 작업자 A" required />
                  </label>
                  {bankOpen ? (
                    <div className="bank-list-panel full-field">
                      <div className="bank-list-head">
                        <strong>지원 은행 선택</strong>
                      </div>
                      <div className="bank-list" aria-label="지원 은행 목록">
                        {banks.map((bank) => (
                          <button key={bank} type="button" onClick={() => setBankName(bank)}>
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <label className="full-field">
                    계좌번호
                    <input name="accountNumber" type="text" autoComplete="off" placeholder="은행별 계좌번호 입력" required />
                  </label>
                </div>

                <div className="upload-card">
                  <p className="upload-title">
                    통장 사본 <span>(필수)</span>
                  </p>
                  <input id="bankbook-file" className="sr-only" name="bankbookFile" type="file" accept="image/*,.pdf" required onChange={updateFile(setBankbookFile)} />
                  <label className="upload-target" htmlFor="bankbook-file">
                    <output className={`file-preview ${bankbookFile ? "" : "empty"}`} aria-live="polite">
                      <span className="upload-icon" aria-hidden="true" />
                      <strong>{bankbookFile ? fileLabel(bankbookFile) : "이미지를 눌러 업로드하세요."}</strong>
                      <small>{bankbookFile ? "선택한 파일을 다시 누르면 변경할 수 있습니다." : "이미지 또는 PDF"}</small>
                    </output>
                  </label>
                </div>

                <div className="step-actions split">
                  <button className="secondary-button" type="button" onClick={goBasic}>
                    이전
                  </button>
                  <button className="primary-button" type="submit">
                    HR 제출 정보 저장
                  </button>
                </div>
              </section>
            )}

            <p className="message" role="status" aria-live="polite">
              {message}
            </p>
          </form>
        </section>
      </main>
    </>
  );
}
