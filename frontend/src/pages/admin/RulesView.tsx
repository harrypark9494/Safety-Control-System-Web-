import { FormEvent, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";

type SafetyRuleStatus = "active" | "draft" | "urgent";
type StatusMeta = {
  label: string;
  tone: string;
};

type SafetyRule = {
  id: string;
  title: string;
  category: string;
  status: SafetyRuleStatus;
  content: string;
  updatedAt: string;
};

const initialSafetyRules: SafetyRule[] = [
  {
    id: "heat-rest",
    title: "폭염 대비 휴식 수칙",
    category: "기상 상황",
    status: "active",
    content: "야외 현장 근로자는 체감온도 상승 시 50분 작업 후 10분 이상 그늘에서 휴식하고, 물과 전해질을 보충합니다.",
    updatedAt: "2024-05-20",
  },
  {
    id: "electric-check",
    title: "전기 설비 안전 점검",
    category: "시설 인프라",
    status: "active",
    content: "음향 및 조명 타워 주변 누전 차단기, 케이블 피복, 접지 상태를 작업 시작 전과 우천 예보 시 추가 점검합니다.",
    updatedAt: "2024-05-18",
  },
  {
    id: "crowd-response",
    title: "밀집 구역 사고 대응",
    category: "응급 조치",
    status: "draft",
    content: "메인 스테이지 앞 펜스 붕괴 또는 압착 위험 발생 시 가장 가까운 비상 통로를 개방하고 관객 흐름을 분산합니다.",
    updatedAt: "2024-05-22",
  },
];

const ruleStatusMeta: Record<SafetyRuleStatus, StatusMeta> = {
  active: { label: "활성", tone: "on" },
  urgent: { label: "긴급", tone: "urgent" },
  draft: { label: "초안", tone: "draft" },
};

export function RulesView() {
  const [rules, setRules] = useState<SafetyRule[]>(initialSafetyRules);
  const [ruleSearch, setRuleSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SafetyRuleStatus | "all">("all");
  const [editingRule, setEditingRule] = useState<SafetyRule | null>(null);
  const [ruleTitle, setRuleTitle] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");
  const [ruleStatus, setRuleStatus] = useState<SafetyRuleStatus>("active");
  const [ruleContent, setRuleContent] = useState("");
  const [ruleMessage, setRuleMessage] = useState("");
  const normalizedSearch = ruleSearch.trim().toLowerCase();
  const filteredRules = rules.filter((rule) => {
    const matchesSearch = !normalizedSearch ||
      rule.title.toLowerCase().includes(normalizedSearch) ||
      rule.category.toLowerCase().includes(normalizedSearch) ||
      rule.content.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "all" || rule.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const activeRuleCount = rules.filter((rule) => rule.status === "active" || rule.status === "urgent").length;

  function openRuleEditor(rule?: SafetyRule) {
    const targetRule = rule ?? {
      id: "",
      title: "",
      category: "",
      status: "active" as SafetyRuleStatus,
      content: "",
      updatedAt: "",
    };

    setEditingRule(targetRule);
    setRuleTitle(targetRule.title);
    setRuleCategory(targetRule.category);
    setRuleStatus(targetRule.status);
    setRuleContent(targetRule.content);
    setRuleMessage("");
  }

  function closeRuleEditor() {
    setEditingRule(null);
    setRuleTitle("");
    setRuleCategory("");
    setRuleStatus("active");
    setRuleContent("");
  }

  function saveRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    const nextRule: SafetyRule = {
      id: editingRule?.id || `rule-${Date.now()}`,
      title: ruleTitle.trim(),
      category: ruleCategory.trim(),
      status: ruleStatus,
      content: ruleContent.trim(),
      updatedAt: today,
    };

    setRules((currentRules) => {
      if (editingRule?.id) {
        return currentRules.map((rule) => rule.id === editingRule.id ? nextRule : rule);
      }

      return [nextRule, ...currentRules];
    });
    setRuleMessage(editingRule?.id ? "안전 수칙이 수정되었습니다." : "안전 수칙이 추가되었습니다.");
    closeRuleEditor();
  }

  return (
    <>
      <section className="admin-view is-active">
        <header className="page-header page-header--actions">
          <h1>안전 수칙 관리</h1>
          <div>
            <button className="dark-button" type="button" onClick={() => openRuleEditor()}>
              <MaterialIcon name="add" />안전 수칙 추가
            </button>
          </div>
        </header>
        <div className="page-content narrow-page admin-tab-page rules-management">
          <section className="app-card search-card">
            <input type="search" value={ruleSearch} onChange={(event) => setRuleSearch(event.target.value)} placeholder="수칙 제목, 카테고리, 내용 검색" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as SafetyRuleStatus | "all")} aria-label="수칙 상태">
              <option value="all">상태 전체</option>
              <option value="active">활성</option>
              <option value="urgent">긴급</option>
              <option value="draft">초안</option>
            </select>
            <button type="button" aria-label="필터 초기화" onClick={() => { setRuleSearch(""); setStatusFilter("all"); }}><MaterialIcon name="refresh" /></button>
          </section>
          {ruleMessage ? <p className="form-message" role="status">{ruleMessage}</p> : null}
          <section className="rule-summary">
            <article className="app-card"><MaterialIcon name="article" /><small>전체 수칙 수</small><strong>{rules.length} <b>건</b></strong></article>
            <article className="app-card"><MaterialIcon name="published_with_changes" className="green-text" /><small>대시보드 노출 대상</small><strong>{activeRuleCount} <b>건</b></strong></article>
            <article className="app-card danger"><MaterialIcon name="priority_high" /><small>긴급 공지</small><strong>{rules.filter((rule) => rule.status === "urgent").length} <b>건</b></strong></article>
          </section>
          <section className="app-card data-table-card rules-table">
            <table>
              <thead><tr><th>수칙 제목</th><th>카테고리</th><th>상태</th><th>최종 업데이트</th><th>관리</th></tr></thead>
              <tbody>
                {filteredRules.length > 0 ? filteredRules.map((rule) => (
                  <tr key={rule.id}>
                    <td>
                      <button className="rule-title-button" type="button" onClick={() => openRuleEditor(rule)}>
                        <strong>{rule.title}</strong>
                        <small>{rule.content}</small>
                      </button>
                    </td>
                    <td>{rule.category}</td>
                    <td><em className={`state ${getRuleStatusMeta(rule.status).tone}`}>{getRuleStatusMeta(rule.status).label}</em></td>
                    <td>{rule.updatedAt}</td>
                    <td><button className="light-button table-inline-button" type="button" onClick={() => openRuleEditor(rule)}><MaterialIcon name="edit_note" />내용 확인/수정</button></td>
                  </tr>
                )) : (
                  <tr><td colSpan={5}><p className="empty-table-state">조건에 맞는 안전 수칙이 없습니다.</p></td></tr>
                )}
              </tbody>
            </table>
            <div className="table-foot"><span>표시 중: {filteredRules.length} / 전체 {rules.length}개 수칙</span></div>
          </section>
        </div>
      </section>

      {editingRule ? (
        <div className="modal-backdrop">
          <section className="account-modal rule-modal" role="dialog" aria-modal="true" aria-labelledby="rule-modal-title">
            <header>
              <h2 id="rule-modal-title">{editingRule.id ? "안전 수칙 수정" : "안전 수칙 추가"}</h2>
              <button type="button" aria-label="닫기" onClick={closeRuleEditor}><MaterialIcon name="close" /></button>
            </header>
            <form className="account-form" onSubmit={saveRule}>
              <div className="modal-body rule-modal-body">
                <label>제목<input value={ruleTitle} onChange={(event) => setRuleTitle(event.target.value)} placeholder="예: 폭염 대비 휴식 수칙" autoComplete="off" maxLength={80} required /></label>
                <label>카테고리<input value={ruleCategory} onChange={(event) => setRuleCategory(event.target.value)} placeholder="예: 기상 상황" autoComplete="off" maxLength={40} required /></label>
                <label>상태<select value={ruleStatus} onChange={(event) => setRuleStatus(event.target.value as SafetyRuleStatus)}><option value="active">활성</option><option value="urgent">긴급</option><option value="draft">초안</option></select></label>
                <label>내용<textarea value={ruleContent} onChange={(event) => setRuleContent(event.target.value)} placeholder="사용자 대시보드에 표시될 안전 수칙 내용을 입력하세요." rows={8} maxLength={1200} required /></label>
                <p><MaterialIcon name="info" />활성 또는 긴급 상태의 항목은 이후 사용자 대시보드 연동 대상입니다.</p>
              </div>
              <footer>
                <button className="light-button" type="button" onClick={closeRuleEditor}>취소</button>
                <button className="dark-button" type="submit">저장</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function getRuleStatusMeta(status: SafetyRuleStatus) {
  return ruleStatusMeta[status];
}
