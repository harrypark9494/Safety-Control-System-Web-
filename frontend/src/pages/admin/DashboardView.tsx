import { MaterialIcon } from "../../components/MaterialIcon";
import { Bar } from "./shared";

export function DashboardView() {
  return (
    <section className="admin-view is-active">
      <header className="page-header">
        <h1>대시보드</h1>
      </header>
      <div className="page-content dashboard-content">
        <button className="emergency-button" type="button"><MaterialIcon name="campaign" filled />긴급 방송 송출</button>
        <div className="dashboard-grid">
          <section className="app-card weather-summary">
            <div className="card-head">
              <h2><MaterialIcon name="monitoring" /> 기상 데이터</h2>
              <strong>킨텍스 제2전시장 일대</strong>
              <em className="status-pill status-good"><MaterialIcon name="check_circle" filled />정상 가동 중</em>
            </div>
            <div className="metric-grid">
              {[
                ["air", "풍속", "4.2", "m/s", "제한: 10m/s", "48%", "navy"],
                ["rainy", "강수량", "0.0", "mm", "제한: 50mm", "12%", "navy"],
                ["device_thermostat", "온도", "28.5", "°C", "주의: 33°C", "78%", "orange"],
                ["humidity_percentage", "습도", "65%", "", "제한: 90%", "74%", "navy"],
              ].map(([icon, label, value, unit, note, bar, color]) => (
                <article className="metric-card" key={label}>
                  <MaterialIcon name={icon} className="metric-icon" />
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
            <div className="card-head"><h2><MaterialIcon name="checklist" />근로자 체크리스트 점검</h2></div>
            <div className="score-list">
              {[["안전모 착용 확인", "98/100", "98%", "green"], ["안전고리 체결 상태", "85/100", "85%", "orange"], ["구역 진입 통제", "45/100", "45%", "red"], ["전기 설비 안전", "92%", "92%", "green"]].map(([title, score, value, color]) => (
                <article key={title}><div><strong>{title}</strong><b>{score}</b></div><Bar value={value} color={color as "green" | "orange" | "red"} /></article>
              ))}
            </div>
            <button className="outline-button" type="button">상세 리포트 확인</button>
          </section>
        </div>

        <section className="app-card stage-card">
          <div className="card-head"><h2><MaterialIcon name="construction" />설치 공정률</h2></div>
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
