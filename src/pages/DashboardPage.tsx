import { dashboardMetrics, scheduleItems } from "../data/demoData";
import type { CSSProperties } from "react";
import {
  clearSession,
  getSession,
  requiresPayrollDocuments,
} from "../features/auth/session";

export function DashboardPage() {
  const session = getSession();

  if (requiresPayrollDocuments(session)) {
    window.location.replace("/payroll-documents/");
    return null;
  }

  const worker = session?.role === "worker" ? session : null;
  const documentLabel = worker?.workType === "직접 고용" ? "제출 완료" : "대상 아님";

  function logout() {
    clearSession();
    window.location.href = "/login/";
  }

  return (
    <main className="mobile-shell">
      <header className="mobile-topbar">
        <h1>워터밤 안전 관제 시스템</h1>
        <button aria-label="알림 내역 열기" type="button">
          ♧
        </button>
      </header>

      <section className="mobile-content dashboard-grid">
        <section className="app-card date-card">
          <strong>2026년 7월 23일 (목)</strong>
          <span>워터밤 서울 D-1</span>
        </section>

        <section className="app-card">
          <div className="section-title-row">
            <h2>
              <span>⬟</span>
              안전 수칙
            </h2>
            <span className="status-pill good">양호</span>
          </div>
          <div className="mini-list">
            <article>
              <span>◇</span>
              <strong>안전고리 점검</strong>
              <em>●</em>
            </article>
            <article>
              <span>♙</span>
              <strong>안전모 착용</strong>
              <em>●</em>
            </article>
          </div>
        </section>

        <section className="app-card qr-card">
          <span className="icon-box">▦</span>
          <div>
            <strong>통합 QR 시스템</strong>
            <small>식권 남은 횟수: 2회 · 생수 남은 횟수: 3회</small>
          </div>
        </section>

        <section className="app-card weather-card">
          <div className="section-title-row">
            <h2>날씨 현황 및 작업 지침</h2>
            <span className="status-pill warning">주의</span>
          </div>
          <p className="alert-text">자외선/풍속 주의: 15시 이후 실외 작업 중단 권고</p>
          <div className="progress-block">
            <div>
              <span>작업 가능 지수</span>
              <strong>45% (제한적 가능)</strong>
            </div>
            <i style={{ "--value": "45%" } as CSSProperties & Record<"--value", string>} />
          </div>
          <div className="metric-grid">
            {dashboardMetrics.map((metric) => (
              <article className={`metric ${metric.tone}`} key={metric.label}>
                <span>{metric.icon}</span>
                <div>
                  <small>{metric.label}</small>
                  <strong>{metric.value}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="app-card progress-card">
          <p className="eyebrow">내 팀: [{worker?.team ?? "인프라팀"}]</p>
          <div className="section-title-row">
            <h2>무대 설치 현황</h2>
            <span className="status-pill good">정상 진행</span>
          </div>
          <div className="note-box">
            <strong>오늘 일정: 08:00 - 12:00</strong>
            <span>주요 업무: 메인 트러스 인양 완료</span>
          </div>
          <div className="danger-box">
            <strong>[지연 알림]</strong>
            <p>[음향팀] 세팅 지연으로 인해 작업 가능 시간이 14:00로 변경되었습니다.</p>
          </div>
        </section>
      </section>

      <section className="mobile-content secondary-panels">
        <section className="tab-heading">
          <h2>스케줄</h2>
          <span>2026년 7월 23일</span>
        </section>
        {scheduleItems.map((item) => (
          <article className="app-card team-card" key={item.team}>
            <div className="section-title-row">
              <h3>{item.team}</h3>
              <span>{item.status}</span>
            </div>
            <p>{item.task}</p>
            <strong>{item.time}</strong>
          </article>
        ))}
      </section>

      <section className="mobile-content secondary-panels">
        <section className="app-card profile-card">
          <div className="profile-main">
            <span className="profile-avatar">♟</span>
            <div>
              <strong>{worker?.name ?? "현장 근로자"}</strong>
              <span>{worker?.phone ?? "010-0000-0000"}</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>소속 팀</dt>
              <dd>{worker?.team ?? "인프라팀"}</dd>
            </div>
            <div>
              <dt>급여 서류</dt>
              <dd>{documentLabel}</dd>
            </div>
          </dl>
        </section>
        <button className="primary-button" onClick={() => (window.location.href = "/payroll-documents/?demo=1")} type="button">
          급여 서류 재제출
        </button>
        <button className="danger-button" onClick={logout} type="button">
          로그아웃
        </button>
      </section>
    </main>
  );
}
