import { useEffect, useState, type CSSProperties } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { getAdminQrUsageSummary } from "../../features/auth/session";
import type { MealType, QrUsageSummary } from "../../types";

export function QrView({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [mealType, setMealType] = useState<MealType | "all">("all");
  const [summary, setSummary] = useState<QrUsageSummary | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAdminQrUsageSummary({ date, mealType, projectId })
      .then((nextSummary) => {
        setSummary(nextSummary);
        setMessage("");
      })
      .catch((error: unknown) => {
        setMessage(error instanceof Error ? error.message : "QR 사용 현황을 불러오지 못했습니다.");
      });
  }, [date, mealType, projectId]);

  const meal = summary?.totals.meal ?? { issued: 0, used: 0, remaining: 0, usageRate: 0 };
  const water = summary?.totals.water ?? { issued: 0, used: 0, remaining: 0, usageRate: 0 };
  const hourlyUsage = summary?.hourlyUsage ?? [];

  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions">
        <h1>식권/생수 QR 사용 현황</h1>
        {projectName ? <span className="page-project-label">{projectName}</span> : null}
        <div>
          <button className="light-button" type="button"><MaterialIcon name="download" />엑셀 다운로드</button>
          <button className="dark-button" type="button"><MaterialIcon name="qr_code_scanner" />QR 수동 발급</button>
        </div>
      </header>
      <div className="page-content narrow-page admin-tab-page">
        <div className="actions-row">
          <h2>실시간 지급 현황</h2>
          <div className="meal-toggle" role="group" aria-label="식사 구분">
            <span>식사 구분</span>
            <button className={mealType === "all" ? "is-active" : ""} type="button" onClick={() => setMealType("all")}>전체</button>
            <button className={mealType === "lunch" ? "is-active" : ""} type="button" onClick={() => setMealType("lunch")}>중식</button>
            <button className={mealType === "dinner" ? "is-active" : ""} type="button" onClick={() => setMealType("dinner")}>석식</button>
          </div>
        </div>
        <section className="app-card search-card">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <select value={mealType} onChange={(event) => setMealType(event.target.value as MealType | "all")}>
            <option value="all">전체 식사</option>
            <option value="lunch">중식</option>
            <option value="dinner">석식</option>
          </select>
          <button type="button" aria-label="새로고침" onClick={() => getAdminQrUsageSummary({ date, mealType, projectId }).then(setSummary).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "QR 사용 현황을 불러오지 못했습니다."))}><MaterialIcon name="refresh" /></button>
        </section>
        {message ? <p className="admin-message" role="status">{message}</p> : null}
        <div className="qr-stats">
          <article className="app-card stat-card">
            <span>식권</span>
            <p>전체 근로자 식권 사용 / 지급 현황</p>
            <strong>{meal.used} <small>/ {meal.issued} ({meal.usageRate}%)</small></strong>
            <i className="bar bar-navy" style={{ "--value": `${meal.usageRate}%` } as CSSProperties}></i>
          </article>
          <article className="app-card stat-card">
            <span>생수</span>
            <p>생수 사용 / 지급 현황</p>
            <strong>{water.used} <small>/ {water.issued} ({water.usageRate}%)</small></strong>
            <i className="bar bar-slate" style={{ "--value": `${water.usageRate}%` } as CSSProperties}></i>
          </article>
        </div>
        <section className="app-card data-table-card">
          <table>
            <thead><tr><th>시간</th><th>식권 사용수</th><th>생수 지급수</th><th>누적 대비율</th><th>상태</th></tr></thead>
            <tbody>
              {hourlyUsage.length > 0 ? hourlyUsage.map((row) => (
                <tr key={row.hourRange}>
                  <td>{row.hourRange}</td>
                  <td>{row.mealUsed} 건</td>
                  <td>{row.waterUsed} 개</td>
                  <td>{meal.used + water.used} / {meal.issued + water.issued}</td>
                  <td>{row.status}</td>
                </tr>
              )) : (
                <tr><td colSpan={5}><p className="empty-table-state">해당 조건의 QR 사용 이력이 없습니다.</p></td></tr>
              )}
            </tbody>
          </table>
          <div className="table-foot"><span>표시 중: {hourlyUsage.length}개 시간대</span></div>
        </section>
      </div>
    </section>
  );
}
