import { FormEvent, useEffect, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import {
  createRegisteredWorker,
  deleteRegisteredWorker,
  deleteWorkerCategory,
  getWorkerQrEntitlements,
  importRegisteredWorkersXlsx,
  renameWorkerCategory,
  saveWorkerCategory,
  updateRegisteredWorker,
} from "../../features/auth/session";
import { formatPhone } from "../../features/phone";
import type { PayrollDocumentStatus, QrEntitlement, WorkerCategorySetting, WorkerImportError, WorkerRegistrationAccount } from "../../types";

type WorkerSortKey = "name" | "phone" | "company" | "team" | "category" | "registrationStatus" | "payrollDocumentStatus";
type SortDirection = "asc" | "desc";
type StatusMeta = { label: string; tone: string };
type WorkerFormState = Pick<WorkerRegistrationAccount, "name" | "phone" | "category" | "company" | "team" | "memo">;

const labels = {
  name: "이름",
  phone: "연락처",
  company: "소속 업체",
  team: "팀",
  category: "고용 유형",
  onboarding: "온보딩",
  document: "서류 제출",
  memo: "메모",
  import: "XLSX 업로드",
  categoryManage: "고용 유형 관리",
  workerAdd: "근로자 등록",
  edit: "수정",
  delete: "삭제",
  close: "닫기",
  save: "저장",
  cancel: "취소",
  detail: "상세",
  qr: "QR 사용 이력",
  importTitle: "근로자 XLSX 업로드",
};

const emptyWorkerForm: WorkerFormState = {
  name: "",
  phone: "",
  category: "",
  company: "",
  team: "",
  memo: "",
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
  workers,
  workerCategories,
  workerCategoriesReady,
  message,
  onRefresh,
  onRefreshWorkerCategories,
}: {
  projectId: string;
  workers: WorkerRegistrationAccount[];
  workerCategories: WorkerCategorySetting[];
  workerCategoriesReady: boolean;
  message: string;
  onRefresh: () => Promise<void>;
  onRefreshWorkerCategories: () => Promise<void>;
}) {
  const [workerForm, setWorkerForm] = useState<WorkerFormState>(emptyWorkerForm);
  const [editingWorker, setEditingWorker] = useState<WorkerRegistrationAccount | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<WorkerRegistrationAccount | null>(null);
  const [workerSearch, setWorkerSearch] = useState("");
  const [onboardingFilter, setOnboardingFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [workerSort, setWorkerSort] = useState<{ key: WorkerSortKey; direction: SortDirection }>({ key: "name", direction: "asc" });
  const [formMessage, setFormMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<WorkerImportError[]>([]);
  const [importMessage, setImportMessage] = useState("");
  const [importActionMessage, setImportActionMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const canManageCategories = workerCategoriesReady;
  const categoryOptions = Array.from(new Set([...workerCategories.map((option) => option.category), ...workers.map((worker) => worker.category)].filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
  const companyOptions = Array.from(new Set(workers.map((worker) => worker.company).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
  const teamOptions = Array.from(new Set(workers.map((worker) => worker.team).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko"));
  const onboardedCount = workers.filter((worker) => worker.registrationStatus === "onboarded").length;
  const documentRequiredWorkerCount = workers.filter((worker) => isPayrollDocumentsRequiredWorker(worker, workerCategories)).length;
  const missingDocumentWorkerCount = workers.filter((worker) => isPayrollDocumentsRequiredWorker(worker, workerCategories) && worker.payrollDocumentStatus === "missing").length;
  const normalizedWorkerSearch = workerSearch.trim().toLowerCase();
  const workerSearchDigits = normalizedWorkerSearch.replace(/\D/g, "");
  const filteredWorkers = workers.filter((worker) => {
    const phoneDigits = worker.phone.replace(/\D/g, "");
    const matchesSearch = !normalizedWorkerSearch ||
      worker.name.toLowerCase().includes(normalizedWorkerSearch) ||
      worker.phone.toLowerCase().includes(normalizedWorkerSearch) ||
      worker.company.toLowerCase().includes(normalizedWorkerSearch) ||
      worker.team.toLowerCase().includes(normalizedWorkerSearch) ||
      (workerSearchDigits ? phoneDigits.includes(workerSearchDigits) : false);
    const matchesOnboarding = onboardingFilter === "all" || worker.registrationStatus === onboardingFilter;
    const matchesDocument = documentFilter === "all" || worker.payrollDocumentStatus === documentFilter;
    const matchesCompany = companyFilter === "all" || worker.company === companyFilter;
    const matchesTeam = teamFilter === "all" || worker.team === teamFilter;
    const matchesCategory = categoryFilter === "all" || worker.category === categoryFilter;

    return matchesSearch && matchesOnboarding && matchesDocument && matchesCompany && matchesTeam && matchesCategory;
  });
  const sortedWorkers = [...filteredWorkers].sort((current, next) => {
    const currentValue = getWorkerSortValue(current, workerSort.key, workerCategories);
    const nextValue = getWorkerSortValue(next, workerSort.key, workerCategories);
    const order = currentValue.localeCompare(nextValue, "ko", { numeric: true, sensitivity: "base" });
    return order === 0 ? current.name.localeCompare(next.name, "ko", { numeric: true, sensitivity: "base" }) : workerSort.direction === "asc" ? order : -order;
  });

  function updateForm<K extends keyof WorkerFormState>(key: K, value: WorkerFormState[K]) {
    setWorkerForm((current) => ({ ...current, [key]: value }));
  }

  function resetWorkerFilters() {
    setWorkerSearch("");
    setOnboardingFilter("all");
    setDocumentFilter("all");
    setCompanyFilter("all");
    setTeamFilter("all");
    setCategoryFilter("all");
  }

  function toggleWorkerSort(key: WorkerSortKey) {
    setWorkerSort((sort) => ({ key, direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc" }));
  }

  function getSortAria(key: WorkerSortKey): "none" | "ascending" | "descending" {
    return workerSort.key !== key ? "none" : workerSort.direction === "asc" ? "ascending" : "descending";
  }

  function getSortMark(key: WorkerSortKey) {
    return workerSort.key !== key ? "unfold_more" : workerSort.direction === "asc" ? "arrow_upward" : "arrow_downward";
  }

  function openCreateModal() {
    setActionMessage("");
    setEditingWorker(null);
    setWorkerForm({ ...emptyWorkerForm, category: categoryOptions[0] ?? "" });
    setRegisterModalOpen(true);
  }

  function openEditModal(worker: WorkerRegistrationAccount) {
    setActionMessage("");
    setEditingWorker(worker);
    setWorkerForm({ name: worker.name, phone: worker.phone, category: worker.category, company: worker.company, team: worker.team, memo: worker.memo });
    setRegisterModalOpen(true);
  }

  function closeWorkerModal() {
    setRegisterModalOpen(false);
    setEditingWorker(null);
    setWorkerForm(emptyWorkerForm);
  }

  function openImportModal() {
    setImportActionMessage("");
    setImportMessage("");
    setImportErrors([]);
    setImportFile(null);
    setImportModalOpen(true);
  }

  function closeImportModal() {
    if (importing) {
      return;
    }

    setImportModalOpen(false);
    setImportFile(null);
    setImportActionMessage("");
    setImportMessage("");
    setImportErrors([]);
  }

  async function saveWorker(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (!canManageCategories) {
        setActionMessage("고용 유형 목록을 불러온 뒤 근로자를 저장할 수 있습니다.");
        return;
      }

      if (editingWorker) {
        await updateRegisteredWorker(editingWorker.uid, { ...workerForm, phone: formatPhone(workerForm.phone) });
        setFormMessage("근로자 정보가 수정되었습니다.");
      } else {
        await createRegisteredWorker(projectId, workerForm.name, workerForm.phone, workerForm.category, workerForm.company, workerForm.team, workerForm.memo);
        setFormMessage("근로자 등록 정보가 저장되었습니다.");
      }

      setActionMessage("");
      closeWorkerModal();
      await onRefresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "근로자 저장에 실패했습니다.");
    }
  }

  async function removeWorker(uid: string) {
    try {
      await deleteRegisteredWorker(uid);
      setFormMessage("근로자 등록 정보가 삭제되었습니다.");
      setSelectedWorker(null);
      await onRefresh();
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "근로자 삭제에 실패했습니다.");
    }
  }

  async function uploadXlsx(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!importFile) {
      setImportActionMessage("업로드할 .xlsx 파일을 선택해 주세요.");
      return;
    }

    if (!importFile.name.toLowerCase().endsWith(".xlsx")) {
      setImportActionMessage(".xlsx 파일만 업로드할 수 있습니다. .xls와 .csv 파일은 지원하지 않습니다.");
      setImportErrors([]);
      return;
    }

    try {
      setImporting(true);
      setImportActionMessage("");
      const result = await importRegisteredWorkersXlsx(projectId, importFile);
      setImportErrors(result.errors);
      setImportMessage(`업로드 ${result.importedCount}건, 반려 ${result.rejectedCount}건`);
      await onRefresh();
    } catch (error) {
      setImportActionMessage(error instanceof Error ? error.message : "XLSX 업로드에 실패했습니다.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <section className="admin-view is-active">
        <header className="page-header page-header--actions">
          <h1>근로자 관리</h1>
          <div>
            <button className="light-button" type="button" onClick={openImportModal}><MaterialIcon name="upload_file" />{labels.import}</button>
            <button className="light-button" type="button" disabled={!canManageCategories} onClick={() => setCategoryModalOpen(true)}>{labels.categoryManage}</button>
            <button className="dark-button" type="button" disabled={!canManageCategories} onClick={openCreateModal}><MaterialIcon name="person_add" />{labels.workerAdd}</button>
          </div>
        </header>
        <div className="page-content narrow-page admin-tab-page worker-management">
          <section className="app-card search-card">
            <input type="search" value={workerSearch} onChange={(event) => setWorkerSearch(event.target.value)} placeholder="이름, 연락처, 업체, 팀 검색" />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label={labels.category}>
              <option value="all">{labels.category} 전체</option>
              {categoryOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
            <select value={companyFilter} onChange={(event) => setCompanyFilter(event.target.value)} aria-label={labels.company}>
              <option value="all">{labels.company} 전체</option>
              {companyOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
            <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} aria-label={labels.team}>
              <option value="all">{labels.team} 전체</option>
              {teamOptions.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
            <select value={onboardingFilter} onChange={(event) => setOnboardingFilter(event.target.value)} aria-label={labels.onboarding}>
              <option value="all">{labels.onboarding} 전체</option>
              <option value="onboarded">{workerRegistrationStatusMeta.onboarded.label}</option>
              <option value="registered">{workerRegistrationStatusMeta.registered.label}</option>
            </select>
            <select value={documentFilter} onChange={(event) => setDocumentFilter(event.target.value)} aria-label={labels.document}>
              <option value="all">{labels.document} 전체</option>
              {Object.entries(payrollStatusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}
            </select>
            <button type="button" aria-label="필터 초기화" onClick={resetWorkerFilters}><MaterialIcon name="refresh" /></button>
          </section>
          {message || actionMessage ? <p className="admin-message" role="status">{message || actionMessage}</p> : null}
          {formMessage ? <p className="form-message" role="status">{formMessage}</p> : null}

          <section className="app-card data-table-card workers-table">
            <table>
              <thead>
                <tr>
                  <SortableHeader label={labels.name} sortKey="name" sortAria={getSortAria("name")} sortMark={getSortMark("name")} onSort={toggleWorkerSort} />
                  <SortableHeader label={labels.phone} sortKey="phone" sortAria={getSortAria("phone")} sortMark={getSortMark("phone")} onSort={toggleWorkerSort} />
                  <SortableHeader label={labels.company} sortKey="company" sortAria={getSortAria("company")} sortMark={getSortMark("company")} onSort={toggleWorkerSort} />
                  <SortableHeader label={labels.team} sortKey="team" sortAria={getSortAria("team")} sortMark={getSortMark("team")} onSort={toggleWorkerSort} />
                  <SortableHeader label={labels.category} sortKey="category" sortAria={getSortAria("category")} sortMark={getSortMark("category")} onSort={toggleWorkerSort} />
                  <SortableHeader label={labels.onboarding} sortKey="registrationStatus" sortAria={getSortAria("registrationStatus")} sortMark={getSortMark("registrationStatus")} onSort={toggleWorkerSort} />
                  <SortableHeader label={labels.document} sortKey="payrollDocumentStatus" sortAria={getSortAria("payrollDocumentStatus")} sortMark={getSortMark("payrollDocumentStatus")} onSort={toggleWorkerSort} />
                  <th>{labels.detail}</th>
                </tr>
              </thead>
              <tbody>
                {sortedWorkers.length > 0 ? sortedWorkers.map((worker) => (
                  <tr key={worker.uid}>
                    <td><button className="worker-name-button" type="button" onClick={() => setSelectedWorker(worker)}><span className="avatar">{worker.name.slice(0, 1)}</span><strong>{worker.name}</strong></button></td>
                    <td>{worker.phone}</td>
                    <td>{worker.company}</td>
                    <td>{worker.team}</td>
                    <td><em className="blue">{worker.category}</em></td>
                    <td><em className={getWorkerRegistrationStatusMeta(worker.registrationStatus).tone}>{getWorkerRegistrationStatusMeta(worker.registrationStatus).label}</em></td>
                    <td>{isPayrollDocumentsRequiredWorker(worker, workerCategories) ? <em className={getPayrollStatusMeta(worker.payrollDocumentStatus).tone}>{getPayrollStatusMeta(worker.payrollDocumentStatus).label}</em> : <em className="gray">대상 아님</em>}</td>
                    <td className="worker-action-cell">
                      <button className="table-action-menu" type="button" onClick={() => setSelectedWorker(worker)}>{labels.detail}</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={8}><p className="empty-table-state">현재 필터와 일치하는 근로자가 없습니다.</p></td></tr>}
              </tbody>
            </table>
            <div className="table-foot">
              <span>{filteredWorkers.length} / {workers.length}</span>
            </div>
          </section>

          <article className="app-card count-card worker-count-card">
            <MaterialIcon name="groups" filled />
            <div>
              <small>등록 근로자</small>
              <strong>{workers.length}</strong>
              <small>온보딩 완료 {onboardedCount}명 / 서류 대상 {documentRequiredWorkerCount}명 / 미제출 {missingDocumentWorkerCount}명</small>
            </div>
          </article>
        </div>
      </section>

      {selectedWorker ? (
        <WorkerDetailModal
          worker={selectedWorker}
          payrollDocumentsRequired={isPayrollDocumentsRequiredWorker(selectedWorker, workerCategories)}
          onEdit={() => { openEditModal(selectedWorker); setSelectedWorker(null); }}
          onDelete={() => removeWorker(selectedWorker.uid)}
          onClose={() => setSelectedWorker(null)}
        />
      ) : null}

      {registerModalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal worker-modal" role="dialog" aria-modal="true" aria-labelledby="worker-modal-title">
            <header>
              <h2 id="worker-modal-title">{editingWorker ? labels.edit : labels.workerAdd}</h2>
              <button type="button" aria-label={labels.close} onClick={closeWorkerModal}><MaterialIcon name="close" /></button>
            </header>
            <form className="account-form" onSubmit={saveWorker}>
              <div className="modal-body">
                <label>{labels.name}<input value={workerForm.name} onChange={(event) => updateForm("name", event.target.value)} autoComplete="off" required /></label>
                <label>{labels.phone}<input value={workerForm.phone} onChange={(event) => updateForm("phone", formatPhone(event.target.value))} placeholder="010-1234-5678" autoComplete="off" maxLength={13} required /></label>
                <label>{labels.category}<input value={workerForm.category} onChange={(event) => updateForm("category", event.target.value)} list="worker-category-options" autoComplete="off" required /><datalist id="worker-category-options">{categoryOptions.map((option) => <option key={option} value={option} />)}</datalist></label>
                <label>{labels.company}<input value={workerForm.company} onChange={(event) => updateForm("company", event.target.value)} autoComplete="off" required /></label>
                <label>{labels.team}<input value={workerForm.team} onChange={(event) => updateForm("team", event.target.value)} autoComplete="off" required /></label>
                <label>{labels.memo}<textarea value={workerForm.memo} onChange={(event) => updateForm("memo", event.target.value)} maxLength={500} /></label>
                <p className="modal-help-text">고용 유형은 서류 필요 여부를 결정하고, 팀은 근로자의 배치 팀으로 저장됩니다. 새 고용 유형은 저장 시 자동 등록됩니다.</p>
              </div>
              <footer>
                <button className="light-button" type="button" onClick={closeWorkerModal}>{labels.cancel}</button>
                <button className="dark-button" type="submit" disabled={!canManageCategories}>{labels.save}</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {categoryModalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal work-type-modal" role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
            <header>
              <h2 id="category-modal-title">{labels.categoryManage}</h2>
              <button type="button" aria-label={labels.close} onClick={() => setCategoryModalOpen(false)}><MaterialIcon name="close" /></button>
            </header>
            <WorkerCategoryManager workers={workers} categories={workerCategories} canManage={canManageCategories} onRefresh={onRefreshWorkerCategories} />
          </section>
        </div>
      ) : null}

      {importModalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal worker-import-modal" role="dialog" aria-modal="true" aria-labelledby="worker-import-title">
            <header>
              <h2 id="worker-import-title">{labels.importTitle}</h2>
              <button type="button" aria-label={labels.close} onClick={closeImportModal} disabled={importing}><MaterialIcon name="close" /></button>
            </header>
            <form className="worker-import-form" onSubmit={uploadXlsx}>
              <div className="modal-body">
                <p>고용 유형, 팀, 소속 업체, 이름, 연락처, 메모 열을 포함한 .xlsx 파일만 업로드할 수 있습니다. 새 고용 유형은 자동 등록됩니다.</p>
                <label className="file-drop-field">
                  <span><MaterialIcon name="upload_file" />{importFile ? importFile.name : ".xlsx 파일 선택"}</span>
                  <input type="file" accept=".xlsx" disabled={importing} onChange={(event) => { setImportFile(event.target.files?.[0] ?? null); setImportActionMessage(""); setImportMessage(""); setImportErrors([]); }} />
                </label>
                {importActionMessage ? <p className="modal-message is-error" role="alert">{importActionMessage}</p> : null}
                {importMessage ? <p className="modal-message" role="status">{importMessage}</p> : null}
                {importErrors.length > 0 ? <ImportErrorList errors={importErrors} /> : null}
              </div>
              <footer>
                <button className="light-button" type="button" onClick={closeImportModal} disabled={importing}>{labels.cancel}</button>
                <button className="dark-button" type="submit" disabled={importing || !importFile}>{importing ? "업로드 중" : "업로드"}</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function SortableHeader({ label, sortKey, sortAria, sortMark, onSort }: { label: string; sortKey: WorkerSortKey; sortAria: "none" | "ascending" | "descending"; sortMark: string; onSort: (key: WorkerSortKey) => void }) {
  return <th aria-sort={sortAria}><button className="table-sort-button" type="button" onClick={() => onSort(sortKey)}>{label} <MaterialIcon name={sortMark} /></button></th>;
}

function ImportErrorList({ errors }: { errors: WorkerImportError[] }) {
  return <section className="import-error-card"><strong>업로드 오류</strong><ul>{errors.slice(0, 20).map((error) => <li key={`${error.row}-${error.column}-${error.code}`}>{error.row}행 · {error.column}/{error.label} · {error.code}: {error.message}</li>)}</ul></section>;
}

function WorkerDetailModal({ worker, payrollDocumentsRequired, onEdit, onDelete, onClose }: { worker: WorkerRegistrationAccount; payrollDocumentsRequired: boolean; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const [entitlements, setEntitlements] = useState<QrEntitlement[]>([]);
  const [qrMessage, setQrMessage] = useState("불러오는 중");

  useEffect(() => {
    let active = true;
    getWorkerQrEntitlements(worker.uid)
      .then((nextEntitlements) => {
        if (!active) return;
        setEntitlements(nextEntitlements);
        setQrMessage("");
      })
      .catch((error) => {
        if (!active) return;
        setQrMessage(error instanceof Error ? error.message : "QR 사용 이력을 불러오지 못했습니다.");
      });
    return () => { active = false; };
  }, [worker.uid]);

  return (
    <div className="modal-backdrop">
      <section className="account-modal worker-detail-modal" role="dialog" aria-modal="true" aria-labelledby="worker-detail-title">
        <header>
          <h2 id="worker-detail-title">{worker.name}</h2>
          <button type="button" aria-label={labels.close} onClick={onClose}><MaterialIcon name="close" /></button>
        </header>
        <dl className="modal-body worker-detail-grid">
          <div><dt>{labels.phone}</dt><dd>{worker.phone}</dd></div>
          <div><dt>{labels.company}</dt><dd>{worker.company}</dd></div>
          <div><dt>{labels.team}</dt><dd>{worker.team}</dd></div>
          <div><dt>{labels.category}</dt><dd>{worker.category}</dd></div>
          <div><dt>{labels.onboarding}</dt><dd>{getWorkerRegistrationStatusMeta(worker.registrationStatus).label}</dd></div>
          <div><dt>{labels.document}</dt><dd>{payrollDocumentsRequired ? getPayrollStatusMeta(worker.payrollDocumentStatus).label : "대상 아님"}</dd></div>
          <div><dt>{labels.memo}</dt><dd>{worker.memo}</dd></div>
          <div><dt>{labels.qr}</dt><dd>{qrMessage || entitlements.map((item) => `${item.label} ${item.usedCount}/${item.totalCount}`).join(" · ")}</dd></div>
        </dl>
        <footer>
          <button className="light-button" type="button" onClick={onEdit}>{labels.edit}</button>
          <button className="table-action-danger" type="button" onClick={onDelete}>{labels.delete}</button>
        </footer>
      </section>
    </div>
  );
}

function WorkerCategoryManager({ workers, categories, canManage, onRefresh }: { workers: WorkerRegistrationAccount[]; categories: WorkerCategorySetting[]; canManage: boolean; onRefresh: () => Promise<void> }) {
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [nextCategory, setNextCategory] = useState("");
  const [message, setMessage] = useState("");
  const nextSortOrder = Math.max(0, ...categories.map((category) => category.sortOrder)) + 10;

  async function updateCategory(category: WorkerCategorySetting, updates: Partial<WorkerCategorySetting>) {
    try {
      await saveWorkerCategory({
        category: updates.category ?? category.category,
        enabled: true,
        signupEnabled: true,
        payrollDocumentsRequired: updates.payrollDocumentsRequired ?? category.payrollDocumentsRequired,
        sortOrder: updates.sortOrder ?? category.sortOrder,
      });
      setMessage("고용 유형 설정이 저장되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 설정 저장에 실패했습니다.");
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = newCategory.trim();
    if (!normalized) {
      setMessage("추가할 고용 유형 이름을 입력해 주세요.");
      return;
    }
    if (categories.some((category) => category.category === normalized)) {
      setMessage("이미 등록된 고용 유형입니다.");
      return;
    }
    await updateCategory({ category: normalized, enabled: true, signupEnabled: true, payrollDocumentsRequired: false, sortOrder: nextSortOrder }, {});
    setNewCategory("");
  }

  async function submitRename(category: WorkerCategorySetting) {
    const normalized = nextCategory.trim();
    if (!normalized || normalized === category.category) {
      setEditingCategory("");
      return;
    }
    try {
      await renameWorkerCategory(category.category, normalized);
      setEditingCategory("");
      setNextCategory("");
      setMessage("고용 유형 이름이 수정되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 이름 수정에 실패했습니다.");
    }
  }

  async function removeCategory(category: WorkerCategorySetting) {
    try {
      await deleteWorkerCategory(category.category);
      setMessage("고용 유형이 삭제되었습니다.");
      await onRefresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "고용 유형 삭제에 실패했습니다.");
    }
  }

  return (
    <div className="modal-body work-type-manager">
      <p className="modal-help-text">근로자 등록 또는 XLSX 업로드에서 입력한 고용 유형이 자동 등록됩니다. 팀은 근로자 원장에 저장되며 이 화면에서는 관리하지 않습니다.</p>
      {message ? <p className="modal-message" role="status">{message}</p> : null}
      <div className="work-type-list">
        {categories.map((category) => {
          const workerCount = workers.filter((worker) => worker.category === category.category).length;
          const isEditing = editingCategory === category.category;
          return (
            <div className="work-type-row" key={category.category}>
              <div className="work-type-main">
                {isEditing ? <input value={nextCategory} onChange={(event) => setNextCategory(event.target.value)} autoComplete="off" maxLength={40} /> : <strong>{category.category}</strong>}
                <small>등록 근로자 {workerCount}명</small>
              </div>
              <label className="work-type-document-toggle">서류 필요 <input type="checkbox" checked={category.payrollDocumentsRequired} disabled={!canManage} onChange={(event) => updateCategory(category, { payrollDocumentsRequired: event.target.checked })} /></label>
              <div className="work-type-actions">
                {isEditing ? (
                  <>
                    <button className="light-button" type="button" disabled={!canManage} onClick={() => submitRename(category)}>{labels.save}</button>
                    <button className="light-button" type="button" onClick={() => { setEditingCategory(""); setNextCategory(""); }}>{labels.cancel}</button>
                  </>
                ) : (
                  <button className="light-button" type="button" disabled={!canManage} onClick={() => { setEditingCategory(category.category); setNextCategory(category.category); }}>{labels.edit}</button>
                )}
                <button className="table-action-danger" type="button" disabled={!canManage || workerCount > 0} onClick={() => removeCategory(category)}>{labels.delete}</button>
              </div>
            </div>
          );
        })}
        {categories.length === 0 ? <p className="work-type-empty-state">등록된 고용 유형이 없습니다. 새 고용 유형을 먼저 추가해 주세요.</p> : null}
      </div>
      <form className="work-type-add-form" onSubmit={addCategory}>
        <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="새 고용 유형" autoComplete="off" maxLength={40} disabled={!canManage} />
        <button className="dark-button" type="submit" disabled={!canManage}>추가</button>
      </form>
    </div>
  );
}

function isPayrollDocumentsRequiredWorker(worker: WorkerRegistrationAccount, categories: WorkerCategorySetting[]) {
  return categories.some((category) => category.category === worker.category && category.payrollDocumentsRequired);
}

function getWorkerSortValue(worker: WorkerRegistrationAccount, key: WorkerSortKey, categories: WorkerCategorySetting[]) {
  if (key === "registrationStatus") {
    return getWorkerRegistrationStatusMeta(worker.registrationStatus).label;
  }
  if (key === "payrollDocumentStatus") {
    return isPayrollDocumentsRequiredWorker(worker, categories) ? getPayrollStatusMeta(worker.payrollDocumentStatus).label : "대상 아님";
  }
  return String(worker[key] ?? "");
}

function getWorkerRegistrationStatusMeta(status: WorkerRegistrationAccount["registrationStatus"]) {
  return workerRegistrationStatusMeta[status] ?? { label: status, tone: "gray" };
}

function getPayrollStatusMeta(status: PayrollDocumentStatus) {
  return payrollStatusMeta[status] ?? { label: status, tone: "gray" };
}
