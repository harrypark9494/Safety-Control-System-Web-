import { FormEvent, useState } from "react";
import "../styles/admin.css";
import { clearSession } from "../features/auth/session";
import { navigateTo } from "../features/navigation";

const navItems = [
  ["dashboard", "▦", "대시보드"],
  ["weather", "♨", "기상 정보 관리"],
  ["schedule", "□", "스케줄 관리"],
  ["qr", "▩", "식권/생수 QR 사용 현황"],
  ["workers", "♟", "근로자 관리"],
  ["rules", "⬟", "안전 수칙 관리"],
  ["admins", "▣", "어드민 관리"],
] as const;

type View = (typeof navItems)[number][0];

function Bar({ value, color = "navy" }: { value: string; color?: "navy" | "green" | "orange" | "red" | "slate" }) {
  return <i className={`bar bar-${color}`} style={{ "--value": value } as React.CSSProperties & Record<"--value", string>} />;
}

export function AdminPage() {
  const [view, setView] = useState<View>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  function submitAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalMessage("데모 계정이 목록에 추가된 것으로 표시됩니다.");
  }

  function logout() {
    clearSession();
    navigateTo("/login/");
  }

  return (
    <>
      <main className="admin-shell">
        <aside className="admin-sidebar" aria-label="관리자 메뉴">
          <div className="brand-block">
            <strong>워터밤 안전 관제 시스템</strong>
            <span>관리자 페이지</span>
          </div>

          <nav className="admin-nav" aria-label="주요 메뉴">
            {navItems.slice(0, 6).map(([id, icon, label]) => (
              <button className={`nav-item ${view === id ? "is-active" : ""}`} type="button" key={id} onClick={() => setView(id)}>
                <span className="nav-icon">{icon}</span>
                {label}
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className={`nav-item nav-item--admin ${view === "admins" ? "is-active" : ""}`} type="button" onClick={() => setView("admins")}>
              <span className="nav-icon">▣</span>
              어드민 관리
            </button>
            <button className="nav-item nav-item--plain" type="button">
              <span className="nav-icon">?</span>
              도움말
            </button>
            <button className="nav-item nav-item--plain" type="button" onClick={logout}>
              <span className="nav-icon">↪</span>
              로그아웃
            </button>
          </div>
        </aside>

        <section className="admin-main">
          {view === "dashboard" ? <DashboardView /> : null}
          {view === "weather" ? <WeatherView /> : null}
          {view === "schedule" ? <ScheduleView /> : null}
          {view === "qr" ? <QrView /> : null}
          {view === "workers" ? <WorkersView /> : null}
          {view === "rules" ? <RulesView /> : null}
          {view === "admins" ? <AdminsView onOpen={() => setModalOpen(true)} /> : null}
        </section>
      </main>

      {modalOpen ? (
        <div className="modal-backdrop">
          <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <header>
              <h2 id="modal-title">어드민 계정 추가</h2>
              <button type="button" aria-label="닫기" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </header>
            <form className="account-form" onSubmit={submitAdmin}>
              <div className="modal-body">
                <label>이름<input name="name" placeholder="예: 관리자 E" autoComplete="off" required /></label>
                <label>아이디<input name="accountId" placeholder="예: admin_ops_05" autoComplete="off" required /></label>
                <label>비밀번호<span><input name="password" type="password" placeholder="초기 비밀번호 입력" autoComplete="new-password" required /><button type="button" aria-label="비밀번호 보기">◉</button></span></label>
                <label>권한 설정<select name="role"><option>전체 권한</option><option>운영 권한</option><option>안전 조회</option><option>현장 조회</option></select></label>
                <p>ⓘ 계정 등록 후 초기 비밀번호는 시스템 보안 정책에 따라 즉시 변경을 권장합니다.</p>
                <strong className="modal-message" role="status" aria-live="polite">{modalMessage}</strong>
              </div>
              <footer>
                <button className="light-button" type="button" onClick={() => setModalOpen(false)}>취소</button>
                <button className="dark-button" type="submit">등록하기</button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}

function DashboardView() {
  return (
    <section className="admin-view is-active">
      <header className="page-header">
        <h1>대시보드</h1>
      </header>
      <div className="page-content dashboard-content">
        <button className="emergency-button" type="button"><span>☛</span>긴급 방송 송출</button>
        <div className="dashboard-grid">
          <section className="app-card weather-summary">
            <div className="card-head">
              <h2><span>▣</span> 기상 데이터</h2>
              <strong>킨텍스 제2전시장 일대</strong>
              <em className="status-pill status-good">● 정상 가동 중</em>
            </div>
            <div className="metric-grid">
              {[
                ["≋", "풍속", "4.2", "m/s", "제한: 10m/s", "48%", "navy"],
                ["☁", "강수량", "0.0", "mm", "제한: 50mm", "12%", "navy"],
                ["♨", "온도", "28.5", "°C", "주의: 33°C", "78%", "orange"],
                ["◒", "습도", "65%", "", "제한: 90%", "74%", "navy"],
              ].map(([icon, label, value, unit, note, bar, color]) => (
                <article className="metric-card" key={label}>
                  <span className="metric-icon">{icon}</span>
                  <small>{label}</small>
                  <strong>{value}</strong>
                  {unit ? <b>{unit}</b> : null}
                  <em>{note}</em>
                  <Bar value={bar} color={color as "navy" | "orange"} />
                </article>
              ))}
            </div>
            <div className="heatmap-panel"><span>현장 실시간 위성 데이터 오버레이</span></div>
          </section>

          <section className="app-card checklist-card">
            <div className="card-head"><h2><span>▣</span> 근로자 체크리스트 점검</h2></div>
            <div className="score-list">
              {[["안전모 착용 확인", "98/100", "98%", "green"], ["안전고리 체결 상태", "85/100", "85%", "orange"], ["구역 진입 통제", "45/100", "45%", "red"], ["전기 설비 안전", "92%", "92%", "green"]].map(([title, score, value, color]) => (
                <article key={title}><div><strong>{title}</strong><b>{score}</b></div><Bar value={value} color={color as "green" | "orange" | "red"} /></article>
              ))}
            </div>
            <button className="outline-button" type="button">상세 리포트 확인</button>
          </section>
        </div>

        <section className="app-card stage-card">
          <div className="card-head"><h2><span>▣</span> 설치 공정률</h2></div>
          <div className="stage-list">
            {[["STAGE ALPHA", "메인 스테이지 설치", "75%", "navy", "예정 종료일: 07/15"], ["STAGE BRAVO", "워터 캐논 시스템", "40%", "navy", "예정 종료일: 07/18"], ["STAGE CHARLIE", "관객 안전 펜스", "95%", "green", "완료 단계"], ["STAGE DELTA", "운영 부스 배치", "15%", "orange", "착수 초기"]].map(([stage, title, value, color, note]) => (
              <article key={stage}><small>{stage}</small><div><strong>{title}</strong><b>{value}</b></div><Bar value={value} color={color as "navy" | "green" | "orange"} /><em>{note}</em></article>
            ))}
          </div>
        </section>
        <footer className="sync-status"><span />시스템 정상 연동 중 <b>마지막 동기화: 14:32:05</b></footer>
      </div>
    </section>
  );
}

function WeatherView() {
  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--stack"><h1>기상 정보 관리</h1><p>킨텍스 제2전시장 일대</p></header>
      <div className="page-content weather-layout">
        <div className="title-row"><h2>실시간 기상 현황</h2><span>마지막 업데이트: 14:32:05</span></div>
        <div className="weather-current">
          {["풍속 (WIND SPEED)|● NORMAL|4.2 m/s|42%|green", "강수량 (PRECIPITATION)|▲ CAUTION|12.0 mm|60%|orange", "온도 (TEMPERATURE)|● ALERT|31.5 °C|85%|red", "습도 (HUMIDITY)|● NORMAL|68 %|68%|green"].map((row) => {
            const [label, state, value, bar, color] = row.split("|");
            return <article key={label}><small>{label}</small><em className={`badge ${color}`}>{state}</em><strong>{value}</strong><Bar value={bar} color={color as "green" | "orange" | "red"} /></article>;
          })}
        </div>
        <section className="app-card forecast-card">
          <div className="section-toolbar"><h2>향후 24시간 기상 예보</h2><div><button className="is-active" type="button">Table</button><button type="button">Chart</button></div></div>
          <table><thead><tr><th>시간</th><th>상태</th><th>강수확률</th><th>온도</th><th>풍속</th></tr></thead><tbody>
            {["15:00|☀ 맑음|10%|32°C|3.8m/s", "16:00|☼ 구름조금|15%|31°C|4.1m/s", "17:00|☁ 흐림|40%|29°C|5.5m/s", "18:00|☔ 소나기|85%|26°C|7.2m/s", "19:00|☔ 약한비|60%|25°C|5.0m/s"].map((row) => {
              const [time, status, rain, temp, wind] = row.split("|");
              return <tr className={time === "18:00" ? "danger-row" : ""} key={time}><td>{time}</td><td>{status}</td><td>{rain}</td><td>{temp}</td><td>{wind}</td></tr>;
            })}
          </tbody></table>
        </section>
        <aside className="app-card weather-log-card"><div className="section-toolbar"><h2>기상 알림 로그</h2><button type="button">ALL LOGS</button></div><article className="log danger"><strong>폭염 경보 <span>14:15</span></strong><p>현재 온도 35°C 도달. 현장 작업자 휴식 강제 실시 알림 발송 완료.</p></article><article className="log blue"><strong>강풍 주의 <span>11:02</span></strong><p>풍속 10m/s 이상 감지. 무대 상단 구조물 고정 상태 점검 요청.</p></article></aside>
        <section className="app-card station-card"><div className="section-toolbar"><h2>기상 관측 지점 관리</h2><div className="search-inline"><input type="search" placeholder="관측 지점 검색..." /><button type="button">위치 업데이트</button></div></div><div className="station-grid"><div className="storm-map"><span>킨텍스 제2전시장 (현 위치)</span><em>SOURCE: KOREA METEOROLOGICAL ADMINISTRATION (KMA)</em></div><div className="station-side"><small>현재 좌표 설정</small><label>위도 (Latitude)<input defaultValue="37.6698" /></label><label>경도 (Longitude)<input defaultValue="126.7451" /></label><button className="outline-button" type="button">좌표 수동 입력 저장</button></div></div></section>
        <aside className="app-card threshold-card"><h2>자동 경보 임계값 설정</h2><label>풍속 경보 (M/S)<span><input defaultValue="10" />m/s</span></label><label>강수량 경보 (MM/H)<span><input defaultValue="15" />mm</span></label><label>폭염 경보 (°C)<span><input defaultValue="33" />°C</span></label><button type="button">설정 저장</button></aside>
      </div>
    </section>
  );
}

function ScheduleView() {
  const hours = Array.from({ length: 23 }, (_, index) => `${String(index + 1).padStart(2, "0")}:00`);
  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions"><h1>스케줄 관리</h1><div><button className="light-button" type="button">⇩ 엑셀 내보내기</button><button className="dark-button" type="button">＋ 일정 추가</button></div></header>
      <div className="schedule-board">
        <div className="date-strip"><button type="button">‹</button>{["07.15 (화)", "07.16 (수)", "07.17 (목)", "07.18 (금)", "07.19 (토)", "07.20 (일)", "07.21 (월)", "07.22 (화)", "07.23 (수)", "07.24 (목)"].map((day) => <span className={day.includes("19") ? "is-active" : ""} key={day}>{day}</span>)}<button type="button">›</button></div>
        <div className="schedule-grid" aria-label="스케줄 표">
          {["시간", "구조물", "조명", "무대", "영상", "음향", "특수효과"].map((head) => <div className="grid-head" key={head}>{head}</div>)}
          {hours.map((hour) => (
            <><div key={`${hour}-time`}>{hour}</div>{["구조물", "조명", "무대", "영상", "음향", "특수효과"].map((team) => <div key={`${hour}-${team}`}>{hour === "08:00" && team === "구조물" ? <span className="job green">무대 패널 결합</span> : hour === "10:00" && team === "음향" ? <span className="job orange">스피커 러깅 시작</span> : hour === "13:00" && team === "특수효과" ? <span className="job red">레이저 모듈</span> : null}</div>)}</>
          ))}
        </div>
      </div>
    </section>
  );
}

function QrView() {
  return <SimpleTable title="식권/생수 QR 사용 현황" heading="실시간 지급 현황" rows={["13:00 - 14:00|420 건|580 개|피크타임", "12:00 - 13:00|310 건|450 개|정상", "11:00 - 12:00|85 건|320 개|정상"]} />;
}

function WorkersView() {
  return <SimpleTable title="근로자 관리" heading="근로자 목록" rows={["작업자 A|000-0000-0000|Stage Alpha|보기", "작업자 B|000-0000-0000|Stage Bravo|보기", "작업자 C|000-0000-0000|Main Entry|보기", "작업자 D|000-0000-0000|VIP Lounge|보기"]} />;
}

function RulesView() {
  return <SimpleTable title="안전 수칙 관리" heading="현장 안전을 위한 통합 수칙 관리 시스템" rows={["폭염 대비 휴식 수칙|기상 상황|활성|2024-05-20", "전기 설비 안전 점검|시설 인프라|활성|2024-05-18", "밀집 구역 사고 대응|응급 조치|초안|2024-05-22"]} />;
}

function AdminsView({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="admin-view is-active">
      <header className="page-header"><h1>어드민 관리</h1></header>
      <div className="page-content narrow-page">
        <section className="app-card admin-add-card"><div className="card-head"><h2>♙ 어드민 계정 추가</h2></div><button className="dark-button" type="button" onClick={onOpen}>⊕ 어드민 계정 추가하기</button></section>
        <section className="app-card data-table-card admin-table"><div className="section-toolbar"><h2>☰ 현재 등록된 어드민 목록</h2><span className="count-pill">총 4명</span></div><table><thead><tr><th>아이디</th><th>이름</th><th>등록일</th><th>권한</th><th>관리</th></tr></thead><tbody>{["super_admin|관리자 A|2024-01-15|전체 권한", "ops_manager_01|관리자 B|2024-03-22|운영 권한", "safety_inspector_01|관리자 C|2024-05-10|안전 조회", "staff_admin_ops|관리자 D|2024-06-02|운영 권한"].map((row) => { const [id, name, date, role] = row.split("|"); return <tr key={id}><td>◎ <strong>{id}</strong></td><td>{name}</td><td>{date}</td><td><em>{role}</em></td><td>✎ 🗑</td></tr>; })}</tbody></table></section>
      </div>
    </section>
  );
}

function SimpleTable({ title, heading, rows }: { title: string; heading: string; rows: string[] }) {
  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--actions"><h1>{title}</h1><div><button className="light-button" type="button">⇩ 엑셀 다운로드</button><button className="dark-button" type="button">＋ 추가</button></div></header>
      <div className="page-content narrow-page">
        <div className="actions-row"><h2>{heading}</h2></div>
        <section className="app-card search-card"><input type="search" placeholder="검색" /><select><option>전체</option></select><button type="button">≡</button></section>
        <section className="app-card data-table-card">
          <table><thead><tr><th>항목</th><th>구분</th><th>상태</th><th>관리</th></tr></thead><tbody>{rows.map((row) => { const cells = row.split("|"); return <tr key={row}>{cells.map((cell) => <td key={cell}>{cell}</td>)}</tr>; })}</tbody></table>
          <div className="table-foot"><span>표시 중: 1 - {rows.length}</span><div className="pagination"><button>‹</button><button className="is-active">1</button><button>2</button><button>›</button></div></div>
        </section>
      </div>
    </section>
  );
}
