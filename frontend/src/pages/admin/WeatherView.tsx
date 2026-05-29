import { useEffect, useState } from "react";
import { MaterialIcon } from "../../components/MaterialIcon";
import { getAdminWeatherOverview, updateAdminWeatherStation, updateAdminWeatherThresholds } from "../../features/auth/session";
import type { AdminWeatherOverview, WeatherThresholds } from "../../types";
import { Bar, formatDateTime } from "./shared";

export function WeatherView({ projectId }: { projectId: string }) {
  const [weather, setWeather] = useState<AdminWeatherOverview | null>(null);
  const [message, setMessage] = useState("기상 데이터를 불러오는 중입니다.");
  const [thresholds, setThresholds] = useState<WeatherThresholds>({
    windSpeed: 10,
    precipitation: 15,
    temperature: 33,
    humidity: 90,
  });
  const [stationName, setStationName] = useState("킨텍스 제2전시장");
  const [latitude, setLatitude] = useState("37.6698");
  const [longitude, setLongitude] = useState("126.7451");

  useEffect(() => {
    refreshWeather();
  }, [projectId]);

  async function refreshWeather() {
    try {
      const nextWeather = await getAdminWeatherOverview(projectId);
      applyWeatherState(nextWeather);
      setMessage("기상청 어댑터 데이터가 동기화되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "기상 데이터를 불러오지 못했습니다.");
    }
  }

  function applyWeatherState(nextWeather: AdminWeatherOverview) {
    setWeather(nextWeather);
    setThresholds(nextWeather.thresholds);
    setStationName(nextWeather.site.name);
    setLatitude(String(nextWeather.site.latitude));
    setLongitude(String(nextWeather.site.longitude));
  }

  async function saveStation() {
    const nextLatitude = Number(latitude);
    const nextLongitude = Number(longitude);

    if (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude)) {
      setMessage("위도와 경도는 숫자로 입력해 주세요.");
      return;
    }

    try {
      applyWeatherState(await updateAdminWeatherStation({
        projectId,
        name: stationName,
        latitude: nextLatitude,
        longitude: nextLongitude,
      }));
      setMessage("관측 지점 설정을 저장했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "관측 지점 저장에 실패했습니다.");
    }
  }

  async function saveThresholds() {
    try {
      applyWeatherState(await updateAdminWeatherThresholds({ ...thresholds, projectId }));
      setMessage("자동 경보 임계값을 저장했습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "임계값 저장에 실패했습니다.");
    }
  }

  const updatedAt = weather ? formatDateTime(weather.source.updatedAt) : "연동 대기";
  const forecastRows = weather?.forecast24h ?? [];
  const logs = weather?.alertLogs ?? [];

  return (
    <section className="admin-view is-active">
      <header className="page-header page-header--stack">
        <h1>기상 정보 관리</h1>
        <p>{weather ? `${weather.site.name} 일대 · ${weather.source.name}` : "기상청 API 어댑터 연동 대기"}</p>
      </header>
      <div className="page-content weather-layout">
        <div className="title-row">
          <h2>실시간 기상 현황</h2>
          <span>마지막 업데이트: {updatedAt}</span>
        </div>
        <p className="weather-sync-message" role="status" aria-live="polite">{message}</p>
        <div className="weather-current">
          {(weather?.current.metrics ?? []).map((metric) => (
            <article key={metric.key}>
              <small>{metric.label}</small>
              <em className={`badge ${metric.tone}`}><MaterialIcon name={metric.tone === "green" ? "check_circle" : "warning"} filled />{metric.status}</em>
              <strong>{metric.value} {metric.unit}</strong>
              <span>{metric.sourceLabel} · {metric.thresholdLabel}</span>
              <Bar value={`${metric.percent}%`} color={metric.tone} />
            </article>
          ))}
        </div>
        <section className="app-card forecast-card">
          <div className="section-toolbar">
            <h2>향후 24시간 기상 예보</h2>
            <div className="toolbar-actions">
              <button className="is-active" type="button">Table</button>
              <button type="button">Chart</button>
            </div>
          </div>
          {weather ? <p className="weather-source-note">{weather.current.summary}</p> : null}
          <table><thead><tr><th>시간</th><th>상태</th><th>강수확률</th><th>온도</th><th>풍속</th></tr></thead><tbody>
            {forecastRows.map((row) => (
              <tr className={row.riskLevel === "alert" || row.riskLevel === "danger" ? "danger-row" : ""} key={row.time}>
                <td>{row.time}</td>
                <td><span className="weather-state"><MaterialIcon name={row.icon} />{row.condition}</span></td>
                <td>{row.rainProbability}%</td>
                <td>{row.temperature}°C</td>
                <td>{row.windSpeed}m/s</td>
              </tr>
            ))}
          </tbody></table>
        </section>
        <aside className="app-card weather-log-card">
          <div className="section-toolbar">
            <h2>기상 알림 로그</h2>
            <button type="button" onClick={refreshWeather}>새로고침</button>
          </div>
          {logs.map((log) => (
            <article className={`log ${log.level === "alert" || log.level === "danger" ? "danger" : "blue"}`} key={log.id}>
              <strong>{log.title} <span>{log.time}</span></strong>
              <p>{log.message}</p>
            </article>
          ))}
        </aside>
        <section className="app-card station-card">
          <div className="section-toolbar station-toolbar">
            <h2>기상 관측 지점 관리</h2>
            <div className="station-search">
              <input type="search" value={stationName} onChange={(event) => setStationName(event.target.value)} placeholder="관측 지점 검색..." />
              <button type="button" onClick={saveStation}>위치 업데이트</button>
            </div>
          </div>
          <div className="station-grid">
            <div className="storm-map">
              <span>{weather?.site.name ?? "킨텍스 제2전시장"} (현 위치)</span>
              <em>SOURCE: KOREA METEOROLOGICAL ADMINISTRATION (KMA) · NX {weather?.site.nx ?? "-"} / NY {weather?.site.ny ?? "-"}</em>
            </div>
            <div className="station-side">
              <small>현재 좌표 설정</small>
              <label>위도 (Latitude)<input value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label>
              <label>경도 (Longitude)<input value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label>
              <button className="outline-button" type="button" onClick={saveStation}>좌표 수동 입력 저장</button>
            </div>
          </div>
        </section>
        <aside className="app-card threshold-card">
          <h2>자동 경보 임계값 설정</h2>
          <label>풍속 경보 (M/S)<span className="threshold-input"><input type="number" value={thresholds.windSpeed} onChange={(event) => setThresholds({ ...thresholds, windSpeed: Number(event.target.value) })} />m/s</span></label>
          <label>강수량 경보 (MM/H)<span className="threshold-input"><input type="number" value={thresholds.precipitation} onChange={(event) => setThresholds({ ...thresholds, precipitation: Number(event.target.value) })} />mm</span></label>
          <label>폭염 경보 (°C)<span className="threshold-input"><input type="number" value={thresholds.temperature} onChange={(event) => setThresholds({ ...thresholds, temperature: Number(event.target.value) })} />°C</span></label>
          <button type="button" onClick={saveThresholds}>설정 저장</button>
        </aside>
      </div>
    </section>
  );
}
