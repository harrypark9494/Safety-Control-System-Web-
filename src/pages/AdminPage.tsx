import { useState } from "react";
import type { CSSProperties } from "react";
import { adminStats } from "../data/demoData";

const navItems = [
  "대시보드",
  "기상 정보 관리",
  "스케줄 관리",
  "식권/생수 QR 사용 현황",
  "근로자 관리",
  "안전 수칙 관리",
  "어드민 관리",
];

export function AdminPage() {
  const [active, setActive] = useState(navItems[0]);

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-block">
          <strong>워터밤 안전 관제 시스템</strong>
          <span>관리자 페이지</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <button className={active === item ? "active" : ""} onClick={() => setActive(item)} type="button" key={item}>
              <span>▣</span>
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-header">
          <h1>{active}</h1>
        </header>

        <div className="admin-content">
          {active === "대시보드" ? (
            <>
              <button className="emergency-button" type="button">
                ☛ 긴급 방송 송출
              </button>
              <section className="admin-stat-grid">
                {adminStats.map((stat) => (
                  <article className="app-card admin-stat" key={stat.label}>
                    <small>{stat.label}</small>
                    <strong>{stat.value}</strong>
                    <span>{stat.note}</span>
                  </article>
                ))}
              </section>
              <section className="app-card admin-panel">
                <div className="section-title-row">
                  <h2>설치 공정률</h2>
                  <span className="status-pill good">정상 진행</span>
                </div>
                <div className="stage-grid">
                  {["메인 스테이지 설치", "워터 캐논 시스템", "관객 안전 펜스", "운영 부스 배치"].map((item, index) => (
                    <article key={item}>
                      <strong>{item}</strong>
                      <i style={{ "--value": `${[75, 40, 95, 15][index]}%` } as CSSProperties & Record<"--value", string>} />
                      <span>{[75, 40, 95, 15][index]}%</span>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="app-card admin-panel">
              <div className="section-title-row">
                <h2>{active}</h2>
                <span className="status-pill">Firestore 전환 예정</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>항목</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{active} mock 데이터</td>
                    <td>Firebase 연결 준비</td>
                    <td>보기</td>
                  </tr>
                </tbody>
              </table>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
