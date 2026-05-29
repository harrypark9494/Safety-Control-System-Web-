import { FormEvent, MouseEvent, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { createRegisteredWorker, deleteRegisteredWorker, deleteWorkType, renameWorkType, saveWorkType } from "../../features/auth/session";
import { formatPhone } from "../../features/phone";
import type { PayrollDocumentStatus, WorkerRegistrationAccount, WorkType, WorkTypeSetting } from "../../types";

type WorkerSortKey = "name" | "phone" | "team" | "workType" | "registrationStatus" | "payrollDocumentStatus";
type SortDirection = "asc" | "desc";
type StatusMeta = {
  label: string;
  tone: string;
};

const workerRegistrationStatusMeta: Record<WorkerRegistrationAccount["registrationStatus"], StatusMeta> = {
  registered: { label: "대기", tone: "orange-text" },
  onboarded: { label: "완료", tone: "green-text" },
};

const payrollStatusMeta: Record<PayrollDocumentStatus, StatusMeta> = {
  missing: { label: "미제출", tone: "orange-text" },
  submitted: { label: "제출 완료", tone: "blue" },
  reviewing: { label: "검토 중", tone: "blue" },
  approved: { label: "승인", tone: "green-text" },
  rejected: { label: "반려", tone: "red-text" },
};

export function WorkersView({
  projectId,
  projectName,
  workers,
  workTypes,
  message,
  onRefresh,
  onRefreshWorkTypes,
}: {
  projectId: string;
  projectName: string;
  workers: WorkerRegistrationAccount[];
  workTypes: WorkTypeSetting[];
  message: string;
  onRefresh: () => Promise<void>;
  onRefreshWorkTypes: () => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [workType, setWorkType] = useState<WorkType>("");
  const [team, setTeam] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");
  const [onboardingFilter, setOnboardingFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [workerSort, setWorkerSort] = useState<{ key: WorkerSortKey; direction: SortDirection }>({ key: "name", direction: "asc" });
  const [formMessage, setFormMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [workTypeModalOpen, setWorkTypeModalOpen] = useState(false);
  const [workTypeListOpen, setWorkTypeListOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerRegistrationAccount | null>(null);
  const [openActionWorkerUid, setOpenActionWorkerUid] = useState("");
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const onboardedCount = workers.filter((worker) => worker.registrationStatus === "onboarded").length;
  const payrollRequiredWorkerCount = workers.filter((worker) => isPayrollDocumentsRequiredWorker(worker, workTypes)).length;
  const nextSortOrder = getNextWorkTypeSortOrder(workTypes);
  const workTypeQuery = workType.trim().toLowerCase();
  const filteredWorkTypes = workTypes.filter((option) => option.label.toLowerCase().includes(workTypeQuery));
  const hasExactWorkType = workTypes.some((option) => option.label === workType.trim());
  const teamOptions = Array.from(new Set(workers.map((worker) => worker.team).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
  const workerTypeOptions = Array.from(new Set([
    ...workTypes.map((option) => option.label),
    ...workers.map((worker) => worker.workType),
  ].filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
  const normalizedWorkerSearch = workerSearch.trim().toLowerCase();
  const workerSearchDigits = normalizedWorkerSearch.replace(/\D/g, "");
  const filteredWorkers = workers.filter((worker) => {
    const phoneDigits = worker.phone.replace(/\D/g, "");
    const matchesSearch = !normalizedWorkerSearch ||
      worker.name.toLowerCase().includes(normalizedWorkerSearch) ||
      worker.phone.toLowerCase().includes(normalizedWorkerSearch) ||
      (workerSearchDigits ? phoneDigits.includes(workerSearchDigits) : false);
    const matchesOnboarding = onboardingFilter === "all" || worker.registrationStatus === onboardingFilter;
    const matchesTeam = teamFilter === "all" || worker.team === teamFilter;
    const matchesWorkerType = workerTypeFilter === "all" || worker.workType === workerTypeFilter;

    return matchesSearch && matchesOnboarding && matchesTeam && matchesWorkerType;
  });
  const sortedWorkers = [...filteredWorkers].sort((current, next) => {
    const currentValue = getWorkerSortValue(current, workerSort.key, workTypes);
    const nextValue = getWorkerSortValue(next, workerSort.key, workTypes);
    const order = currentValue.localeCompare(nextValue, "ko", { numeric: true, sensitivity: "base" });

    if (order !== 0) {
      return workerSort.direction === "asc" ? order : -order;
    }

    return current.name.localeCompare(next.name, "ko", { numeric: true, sensitivity: "base" });
  });

  function resetWorkerFilters() {
    setWorkerSearch("");
    setOnboardingFilter("all");
    setTeamFilter("all");
    setWorkerTypeFilter("all");
  }

  function toggleWorkerSort(key: WorkerSortKey) {
    setWorkerSort((sort) => ({
      key,
      direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc",
    }));
  }

  function getSortAria(key: WorkerSortKey) {
    if (workerSort.key !== key) {
      return "none";
    }

    return workerSort.direction === "asc" ? "ascending" : "descending";
  }

  function getSortMark(key: WorkerSortKey) {
    if (workerSort.key !== key) {
      return "unfold_more";
    }

    return workerSort.direction === "asc" ? "arrow_upward" : "arrow_downward";
  }

  function toggleWorkerActions(workerUid: string, event: MouseEvent<HTMLButtonElement>) {
    if (openActionWorkerUid === workerUid) {
      setOpenActionWorkerUid("");
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 136;
    setActionMenuPosition({
      top: Math.min(window.innerHeight - 148, rect.bottom + 8),
      left: Math.min(window.innerWidth - menuWidth - 12, Math.max(12, rect.right - menuWidth)),
    });
    setOpenActionWorkerUid(workerUid);
  }

  function resetRegistrationForm() {
    setName("");
    setPhone("");
    setWorkType("");
    setTeam("");
    setSupervisor("");
    setWorkTypeListOpen(false);
  }

  async function registerWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedWorkType = workType.trim();

    try {
      if (!workTypes.some((option) => option.label === normalizedWorkType)) {
        await saveWorkType({
          label: normalizedWorkType,
          enabled: true,
          payrollDocumentsRequired: false,
          sortOrder: nextSortOrder,
        });
        await onRefreshWorkTypes();
      }

      await createRegisteredWorker(projectId, name, phone, normalizedWorkType, team, supervisor);
      resetRegistrationForm();
      setFormMessage("근로자 등록 정보가 저장되었습니다.");
      setActionMessage("");
      setRegisterModalOpen(false);
      await onRefresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "근로자 등록에 실패했습니다.");
    }
  }

  async function removeWorker(phone: string) {
    try {
      await deleteRegisteredWorker(phone, projectId);
      setFormMessage("근로자 등록 정보가 삭제되었습니다.");
      setOpenActionWorkerUid("");
      setSelectedWorker(null);
      await onRefresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "근로자 삭제에 실패했습니다.");
    }
  }

  const openActionWorker = workers.find((worker) => worker.uid === openActionWorkerUid);

  return (
    <>
      <section className="admin-view is-active">
        <header className="page-header page-header--actions">
          <h1>근로자 관리</h1>
          {projectName ? <span className="page-project-label">{projectName}</span> : null}
          <div>
            <button className="light-button" type="button"><MaterialIcon name="download" />엑셀 다운로드</button>
            <button className="light-button" type="button" onClick={() => setWorkTypeModalOpen(true)}>고용 유형 관리</button>
            <button className="dark-button" type="button" onClick={() => setRegisterModalOpen(true)}><MaterialIcon name="person_add" />근로자 등록</button>
          </div>
        </header>
        <div className="page-content narrow-page admin-tab-page worker-management">
          <section className="app-card search-card">
            <input type="search" value={workerSearch} onChange={(event) => setWorkerSearch(event.target.value)} placeholder="이름 또는 연락처 검색" />
            <select value={onboardingFilter} onChange={(event) => setOnboardingFilter(event.target.value)} aria-label="온보딩 상태">
              <option value="all">온보딩 전체</option>
              <option value="onboarded">온보딩 완료</option>
              <option value="registered">온보딩 대기</option>
            </select>
            <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} aria-label="담당 구역">
              <option value="all">담당 구역 전체</option>
              {teamOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
            <select value={workerTypeFilter} onChange={(event) => setWorkerTypeFilter(event.target.value)} aria-label="고용 유형">
              <option value="all">고용 유형 전체</option>
              {workerTypeOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
            <button type="button" aria-label="필터 초기화" onClick={resetWorkerFilters}><MaterialIcon name="refresh" /></button>
          </section>
          {message || actionMessage ? <p className="admin-message" role="status">{message || actionMessage}</p> : null}
          {formMessage ? <p className="form-message" role="status">{formMessage}</p> : null}

          <section className="app-card data-table-card workers-table">
          <table>
            <thead>
              <tr>
                <th aria-sort={getSortAria("name")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("name")}>이름 <MaterialIcon name={getSortMark("name")} /></button></th>
                <th aria-sort={getSortAria("phone")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("phone")}>연락처 <MaterialIcon name={getSortMark("phone")} /></button></th>
                <th aria-sort={getSortAria("team")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("team")}>담당 구역 <MaterialIcon name={getSortMark("team")} /></button></th>
                <th aria-sort={getSortAria("workType")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("workType")}>고용 유형 <MaterialIcon name={getSortMark("workType")} /></button></th>
                <th aria-sort={getSortAria("registrationStatus")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("registrationStatus")}>온보딩 <MaterialIcon name={getSortMark("registrationStatus")} /></button></th>
                <th aria-sort={getSortAria("payrollDocumentStatus")}><button className="table-sort-button" type="button" onClick={() => toggleWorkerSort("payrollDocumentStatus")}>서류 <MaterialIcon name={getSortMark("payrollDocumentStatus")} /></button></th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedWorkers.length > 0 ? sortedWorkers.map((worker) => (
                <tr key={worker.uid}>
                  <td>
                    <button className="worker-name-button" type="button" onClick={() => setSelectedWorker(worker)}>
                      <span className="avatar">{worker.name.slice(0, 1)}</span>
                      <strong>{worker.name}</strong>
                    </button>
                  </td>
                  <td>{worker.phone}</td>
                  <td><em>{worker.team}</em></td>
                  <td><em className="blue">{worker.workType}</em></td>
                  <td>
                    <em className={getWorkerRegistrationStatusMeta(worker.registrationStatus).tone}>
                      {getWorkerRegistrationStatusMeta(worker.registrationStatus).label}
                    </em>
                  </td>
                  <td>
                    {isPayrollDocumentsRequiredWorker(worker, workTypes) ? (
                      <em className={getPayrollStatusMeta(worker.payrollDocumentStatus).tone}>
                        {getPayrollStatusMeta(worker.payrollDocumentStatus).label}
                      </em>
                    ) : (
                      <em className="gray">대상 아님</em>
                    )}
                  </td>
                  <td className="worker-action-cell">
                    <button
                      className="table-action-menu"
                      type="button"
                      aria-expanded={openActionWorkerUid === worker.uid}
                      aria-haspopup="menu"
                      onClick={(event) => toggleWorkerActions(worker.uid, event)}
                    >
                      관리
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7}><p className="empty-table-state">{workers.length > 0 ? "조건에 맞는 근로자가 없습니다." : "등록된 근로자가 없습니다."}</p></td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="table-foot">
            <span>필터 결과 {filteredWorkers.length}명 / 전체 {workers.length}명</span>
            <div className="pagination"><button aria-label="이전 페이지"><MaterialIcon name="chevron_left" /></button><button className="is-active">1</button><button>2</button><button>3</button><button aria-label="다음 페이지"><MaterialIcon name="chevron_right" /></button></div>
          </div>
        </section>

          {openActionWorker ? (
            <div className="worker-actions-popover-layer" onClick={() => setOpenActionWorkerUid("")}>
              <div
                className="worker-actions-menu"
                role="menu"
                style={{ top: actionMenuPosition.top, left: actionMenuPosition.left }}
                onClick={(event) => event.stopPropagation()}
              >
                <button type="button" role="menuitem" onClick={() => { setSelectedWorker(openActionWorker); setOpenActionWorkerUid(""); }}>상세 정보</button>
                <button className="danger" type="button" role="menuitem" onClick={() => removeWorker(openActionWorker.phone)}>삭제</button>
              </div>
            </div>
          ) : null}

          <article className="app-card count-card worker-count-card">
            <MaterialIcon name="groups" filled />
            <div>
              <small>등록 인원</small>
              <strong>{workers.length} 명</strong>
              <small>온보딩 완료 {onboardedCount} 명 · 서류 대상 {payrollRequiredWorkerCount} 명</small>
            </div>
          </article>
        </div>
      </section>

      {selectedWorker ? (
        <WorkerDetailModal
          worker={selectedWorker}
          payrollDocumentsRequired={isPayrollDocumentsRequiredWorker(selectedWorker, workTypes)}
          onClose={() => setSelectedWorker(null)}
        />
      ) : null}

      {registerModalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal worker-modal" role="dialog" aria-modal="true" aria-labelledby="worker-modal-title">
            <header>
              <h2 id="worker-modal-title">근로자 등록</h2>
              <button type="button" aria-label="닫기" onClick={() => setRegisterModalOpen(false)}><MaterialIcon name="close" /></button>
            </header>
            <form className="account-form" onSubmit={registerWorker}>
              <div className="modal-body">
                <label>이름<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" required /></label>
                <label>연락처<input value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} placeholder="010-1234-5678" autoComplete="off" maxLength={13} required /></label>
                <div
                  className="work-type-picker"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setWorkTypeListOpen(false);
                    }
                  }}
                >
                  <label>
                    고용 유형
                    <span className="work-type-input-row">
                      <input
                        value={workType}
                        onChange={(event) => {
                          setWorkType(event.target.value);
                          setWorkTypeListOpen(true);
                        }}
                        onFocus={() => setWorkTypeListOpen(true)}
                        placeholder="예: 단기 아르바이트"
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={workTypeListOpen}
                        aria-controls="work-type-options"
                        maxLength={40}
                        required
                      />
                      <button
                        type="button"
                        aria-label="고용 유형 목록 열기"
                        aria-expanded={workTypeListOpen}
                        onClick={() => setWorkTypeListOpen((open) => !open)}
                      >
                        <MaterialIcon name="arrow_drop_down" />
                      </button>
                    </span>
                  </label>
                  {workTypeListOpen ? (
                    <div className="work-type-picker-panel" id="work-type-options" role="listbox">
                      {filteredWorkTypes.map((option) => (
                        <button
                          className={option.label === workType ? "is-selected" : ""}
                          key={option.label}
                          type="button"
                          role="option"
                          aria-selected={option.label === workType}
                          onClick={() => {
                            setWorkType(option.label);
                            setWorkTypeListOpen(false);
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                      {filteredWorkTypes.length === 0 ? <span className="work-type-empty">일치하는 기존 유형이 없습니다.</span> : null}
                      {workType.trim() && !hasExactWorkType ? <span className="work-type-new">새 유형으로 저장됩니다: {workType.trim()}</span> : null}
                    </div>
                  ) : null}
                </div>
                <label>담당 구역<input value={team} onChange={(event) => setTeam(event.target.value)} placeholder="예: Stage Alpha" autoComplete="off" required /></label>
                <label>담당 관리자<input value={supervisor} onChange={(event) => setSupervisor(event.target.value)} placeholder="예: 관리자 A" autoComplete="off" required /></label>
                <p>새 고용 유형을 입력하면 로그인 선택지에도 함께 추가됩니다.</p>
                {actionMessage ? <strong className="modal-message" role="status">{actionMessage}</strong> : null}
              </div>
              <footer>
                <button className="light-button" type="button" onClick={() => setRegisterModalOpen(false)}>취소</button>
                <button className="dark-button" type="submit">등록 저장</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {workTypeModalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal work-type-modal" role="dialog" aria-modal="true" aria-labelledby="work-type-modal-title">
            <header>
              <h2 id="work-type-modal-title">고용 유형 관리</h2>
              <button type="button" aria-label="닫기" onClick={() => setWorkTypeModalOpen(false)}><MaterialIcon name="close" /></button>
            </header>
            <WorkTypeManager
              workers={workers}
              workTypes={workTypes}
              onRefresh={onRefreshWorkTypes}
              onRefreshWorkers={onRefresh}
            />
          </section>
        </div>
      ) : null}
    </>
  );
}

function WorkerDetailModal({
  worker,
  payrollDocumentsRequired,
  onClose,
}: {
  worker: WorkerRegistrationAccount;
  payrollDocumentsRequired: boolean;
  onClose: () => void;
}) {
  const registrationStatusLabel = `온보딩 ${getWorkerRegistrationStatusMeta(worker.registrationStatus).label}`;
  const payrollStatusLabel = getPayrollStatusMeta(worker.payrollDocumentStatus).label;
  const canRequestSecureOpen = payrollDocumentsRequired && worker.payrollDocumentStatus !== "missing";

  return (
    <div className="modal-backdrop">
      <section className="account-modal worker-detail-modal" role="dialog" aria-modal="true" aria-labelledby="worker-detail-title">
        <header>
          <h2 id="worker-detail-title">근로자 상세 정보</h2>
          <button type="button" aria-label="닫기" onClick={onClose}><MaterialIcon name="close" /></button>
        </header>
        <div className="modal-body worker-detail-body">
          <div className="worker-detail-profile">
            <span className="avatar">{worker.name.slice(0, 1)}</span>
            <div>
              <strong>{worker.name}</strong>
              <small>{worker.workType}</small>
            </div>
          </div>
          <dl className="worker-detail-list">
            <div><dt>연락처</dt><dd>{worker.phone}</dd></div>
            <div><dt>담당 구역</dt><dd>{worker.team}</dd></div>
            <div><dt>담당 관리자</dt><dd>{worker.supervisor}</dd></div>
            <div><dt>온보딩 상태</dt><dd>{registrationStatusLabel}</dd></div>
            <div><dt>급여 서류 상태</dt><dd>{payrollDocumentsRequired ? payrollStatusLabel : "대상 아님"}</dd></div>
            <div><dt>등록일</dt><dd>{formatWorkerDate(worker.registeredAt)}</dd></div>
            <div><dt>온보딩 완료일</dt><dd>{worker.onboardedAt ? formatWorkerDate(worker.onboardedAt) : "아직 완료되지 않음"}</dd></div>
          </dl>
          <section className="secure-documents-panel" aria-labelledby="secure-documents-title">
            <div className="secure-documents-head">
              <div>
                <h3 id="secure-documents-title">민감 서류 관리</h3>
                <p>Firebase Storage 원본 경로와 장기 다운로드 토큰은 관리자 화면에 표시하지 않습니다.</p>
              </div>
              <span className={payrollDocumentsRequired ? "status-pill info" : "status-pill"}>{payrollDocumentsRequired ? "서류 대상" : "대상 아님"}</span>
            </div>
            {payrollDocumentsRequired ? (
              <>
                <div className="secure-document-list">
                  {["신분증 사본", "통장 사본"].map((label) => (
                    <article key={label}>
                      <div>
                        <strong>{label}</strong>
                        <small>{canRequestSecureOpen ? "백엔드 권한 확인 후 임시 열람 URL 발급" : "근로자 제출 완료 후 열람 요청 가능"}</small>
                      </div>
                      <button className="light-button" type="button" disabled={!canRequestSecureOpen}>
                        보안 열람 요청
                      </button>
                    </article>
                  ))}
                </div>
                <p className="secure-document-note">
                  운영 구현 시 <code>POST /api/admin/payroll-documents/{"{workerId}"}/files/{"{fileId}"}/open</code>이 관리자 권한과 감사 로그를 확인한 뒤 제한 시간 URL 또는 프록시 응답을 반환해야 합니다.
                </p>
              </>
            ) : (
              <p className="secure-document-note">이 근로자의 고용 유형은 급여/세무 서류 제출 대상으로 설정되어 있지 않습니다.</p>
            )}
          </section>
        </div>
        <footer>
          <button className="dark-button" type="button" onClick={onClose}>확인</button>
        </footer>
      </section>
    </div>
  );
}

function isPayrollDocumentsRequiredWorker(worker: WorkerRegistrationAccount, workTypes: WorkTypeSetting[]) {
  return workTypes.some((workType) => (
    workType.label === worker.workType &&
    workType.enabled &&
    workType.payrollDocumentsRequired
  ));
}

function getWorkerSortValue(worker: WorkerRegistrationAccount, key: WorkerSortKey, workTypes: WorkTypeSetting[]) {
  if (key === "registrationStatus") {
    return getWorkerRegistrationStatusMeta(worker.registrationStatus).label;
  }

  if (key === "payrollDocumentStatus") {
    return isPayrollDocumentsRequiredWorker(worker, workTypes) ? getPayrollStatusMeta(worker.payrollDocumentStatus).label : "대상 아님";
  }

  return worker[key] ?? "";
}

function getWorkerRegistrationStatusMeta(status: WorkerRegistrationAccount["registrationStatus"]) {
  return workerRegistrationStatusMeta[status];
}

function getPayrollStatusMeta(status: PayrollDocumentStatus) {
  return payrollStatusMeta[status];
}

function getNextWorkTypeSortOrder(workTypes: WorkTypeSetting[]) {
  return Math.max(0, ...workTypes.map((workType) => workType.sortOrder)) + 10;
}

function countWorkersByWorkType(workers: WorkerRegistrationAccount[], label: WorkType) {
  return workers.filter((worker) => worker.workType === label).length;
}

function formatWorkerDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function WorkTypeManager({
  workers,
  workTypes,
  onRefresh,
  onRefreshWorkers,
}: {
  workers: WorkerRegistrationAccount[];
  workTypes: WorkTypeSetting[];
  onRefresh: () => Promise<void>;
  onRefreshWorkers: () => Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [payrollDocumentsRequired, setPayrollDocumentsRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [editingLabel, setEditingLabel] = useState("");
  const [nextLabel, setNextLabel] = useState("");
  const nextSortOrder = getNextWorkTypeSortOrder(workTypes);

  async function updateWorkType(workType: WorkTypeSetting, updates: Partial<WorkTypeSetting>) {
    try {
      await saveWorkType({
        label: workType.label,
        enabled: true,
        payrollDocumentsRequired: updates.payrollDocumentsRequired ?? workType.payrollDocumentsRequired,
        sortOrder: updates.sortOrder ?? workType.sortOrder,
      });
      setMessage("고용 유형 설정이 저장되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 설정 저장에 실패했습니다.");
    }
  }

  async function addWorkType(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await saveWorkType({
        label,
        enabled: true,
        payrollDocumentsRequired,
        sortOrder: nextSortOrder,
      });
      setLabel("");
      setPayrollDocumentsRequired(false);
      setMessage("고용 유형이 추가되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 추가에 실패했습니다.");
    }
  }

  async function submitRename(workType: WorkTypeSetting) {
    try {
      const normalized = nextLabel.trim();
      await renameWorkType(workType.label, normalized);
      setEditingLabel("");
      setNextLabel("");
      setMessage("고용 유형 이름이 수정되었습니다.");
      await onRefresh();
      await onRefreshWorkers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 이름 수정에 실패했습니다.");
    }
  }

  async function removeWorkType(workType: WorkTypeSetting) {
    try {
      await deleteWorkType(workType.label);
      setMessage("고용 유형이 삭제되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 삭제에 실패했습니다.");
    }
  }

  return (
    <section className="work-type-card">
      <div className="section-toolbar">
        <h2>고용 유형 관리</h2>
        <span className="count-pill">총 {workTypes.length}개</span>
      </div>
      {message ? <p className="form-message work-type-message" role="status">{message}</p> : null}
      <div className="work-type-list">
        {workTypes.map((workType) => {
          const workerCount = countWorkersByWorkType(workers, workType.label);
          const isEditing = editingLabel === workType.label;

          return (
            <div className="work-type-row" key={workType.label}>
              <div className="work-type-name-cell">
                {isEditing ? (
                  <input value={nextLabel} onChange={(event) => setNextLabel(event.target.value)} maxLength={40} autoComplete="off" />
                ) : (
                  <strong>{workType.label}</strong>
                )}
                <small>등록 근로자 {workerCount}명</small>
              </div>
              <label>
                <input
                  type="checkbox"
                  checked={workType.payrollDocumentsRequired}
                  onChange={(event) => updateWorkType(workType, { payrollDocumentsRequired: event.target.checked })}
                />
                서류 제출 필요
              </label>
              <div className="work-type-actions">
                {isEditing ? (
                  <>
                    <button className="light-button" type="button" onClick={() => submitRename(workType)}>저장</button>
                    <button className="light-button" type="button" onClick={() => { setEditingLabel(""); setNextLabel(""); }}>취소</button>
                  </>
                ) : (
                  <>
                    <button className="light-button" type="button" onClick={() => { setEditingLabel(workType.label); setNextLabel(workType.label); }}>수정</button>
                    <button className="table-action-danger" type="button" disabled={workerCount > 0} onClick={() => removeWorkType(workType)}>삭제</button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form className="work-type-add-form" onSubmit={addWorkType}>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="새 고용 유형"
          autoComplete="off"
          maxLength={40}
          required
        />
        <label>
          <input
            type="checkbox"
            checked={payrollDocumentsRequired}
            onChange={(event) => setPayrollDocumentsRequired(event.target.checked)}
          />
          서류 제출 필요
        </label>
        <button className="dark-button" type="submit">추가</button>
      </form>
    </section>
  );
}
