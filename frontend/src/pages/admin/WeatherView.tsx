import { type CSSProperties, useEffect, useState } from "react";
import { getAdminWeatherOverview, updateAdminWeatherStation, updateAdminWeatherThresholds } from "../../features/auth/session";
import type { AdminWeatherOverview, WeatherForecastItem, WeatherThresholds } from "../../types";
import { Bar, formatDateTime } from "./shared";

const chartSlotWidth = 36;
const chartHeight = 132;
const chartPadding = { top: 24, bottom: 18 };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getChartWidth(total: number) {
  return chartSlotWidth * Math.max(total, 1);
}

function getX(index: number) {
  return chartSlotWidth * index + chartSlotWidth / 2;
}

function getY(value: number, min: number, max: number) {
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  const range = max - min;
  const ratio = range > 0 ? clamp((value - min) / range, 0, 1) : 0.5;
  return chartPadding.top + plotHeight - plotHeight * ratio;
}

function linePoints(rows: WeatherForecastItem[], valueFor: (row: WeatherForecastItem) => number, min: number, max: number) {
  return rows.map((row, index) => [getX(index), getY(valueFor(row), min, max)] as const);
}

function smoothPath(points: ReadonlyArray<readonly [number, number]>) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0][0]},${points[0][1]}`;
  }

  const [first, second] = points;
  const firstMid = [(first[0] + second[0]) / 2, (first[1] + second[1]) / 2];
  const segments = [`M ${first[0]},${first[1]}`, `Q ${first[0]},${first[1]} ${firstMid[0]},${firstMid[1]}`];

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midpoint = [(current[0] + next[0]) / 2, (current[1] + next[1]) / 2];
    segments.push(`Q ${current[0]},${current[1]} ${midpoint[0]},${midpoint[1]}`);
  }

  const last = points[points.length - 1];
  segments.push(`T ${last[0]},${last[1]}`);
  return segments.join(" ");
}

function hasForecastAlert(row: WeatherForecastItem, thresholds: WeatherThresholds) {
  return row.temperature >= thresholds.temperature;
}

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
      setMessage("기상청 예보 데이터가 동기화되었습니다.");
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
  const forecastTemperatures = forecastRows.map((row) => row.temperature);
  const rawMinTemperature = forecastTemperatures.length > 0 ? Math.min(...forecastTemperatures) : 0;
  const rawMaxTemperature = forecastTemperatures.length > 0 ? Math.max(...forecastTemperatures) : 1;
  const minTemperature = rawMinTemperature === rawMaxTemperature ? rawMinTemperature - 1 : rawMinTemperature;
  const maxTemperature = rawMinTemperature === rawMaxTemperature ? rawMaxTemperature + 1 : rawMaxTemperature;
  const isTemperatureThresholdVisible = thresholds.temperature >= minTemperature && thresholds.temperature <= maxTemperature;
  const tempPoints = linePoints(forecastRows, (row) => row.temperature, minTemperature, maxTemperature);
  const chartViewWidth = getChartWidth(forecastRows.length);
  const meteogramStyle = {
    "--forecast-column-count": String(Math.max(forecastRows.length, 1)),
    "--forecast-chart-width": `${chartViewWidth}px`,
  } as CSSProperties & Record<"--forecast-column-count" | "--forecast-chart-width", string>;

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
              <em className={`badge ${metric.tone}`}>{metric.status}</em>
              <strong>{metric.value} {metric.unit}</strong>
              <span>{metric.sourceLabel} · {metric.thresholdLabel}</span>
              <Bar value={`${metric.percent}%`} color={metric.tone} />
            </article>
          ))}
        </div>
        <section className="app-card forecast-card">
          <div className="forecast-meteogram" style={meteogramStyle}>
            <div className="forecast-trend" aria-label="시간대별 온도 및 강수량 트렌드 그래프">
              <div className="forecast-trend-title">
                <h2>향후 24시간</h2>
              </div>
              <div className="trend-scale trend-scale-left">
                <strong>{maxTemperature}°C</strong>
                <small>{minTemperature}°C</small>
              </div>
              <svg className="trend-svg" width={chartViewWidth} height={chartHeight} viewBox={`0 0 ${chartViewWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" aria-label="온도와 강수량이 시간대별로 연결된 추세 그래프">
                <defs>
                  <linearGradient id="rainTrendFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity="0.34" />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity="0.04" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75, 1].map((tick) => (
                  <line className="trend-grid-line" key={tick} x1="0" x2={chartViewWidth} y1={getY(tick, 0, 1)} y2={getY(tick, 0, 1)} />
                ))}
                {forecastRows.map((row, index) => (
                  <line className="trend-time-line" key={row.time} x1={getX(index)} x2={getX(index)} y1={chartPadding.top} y2={chartHeight - chartPadding.bottom} />
                ))}
                {isTemperatureThresholdVisible ? <line className="trend-threshold trend-temp-threshold" x1="0" x2={chartViewWidth} y1={getY(thresholds.temperature, minTemperature, maxTemperature)} y2={getY(thresholds.temperature, minTemperature, maxTemperature)} /> : null}
                {tempPoints.length > 0 ? <path className="trend-line trend-line-temp" d={smoothPath(tempPoints)} /> : null}
                {forecastRows.map((row, index) => {
                  const x = getX(index);
                  const tempY = getY(row.temperature, minTemperature, maxTemperature);
                  return (
                    <g key={row.time}>
                      <circle className={`trend-point trend-point-temp ${hasForecastAlert(row, thresholds) ? "is-risk" : ""}`} cx={x} cy={tempY} r="4" />
                      <text className="trend-value trend-temp-value" x={x} y={tempY - 8}>{row.temperature}°</text>
                    </g>
                  );
                })}
              </svg>
              <div className="trend-threshold-labels">
                <span className="temp-threshold-label">{isTemperatureThresholdVisible ? "기준" : "기준 범위 밖"} {thresholds.temperature}°C</span>
              </div>
            </div>
            <div className="forecast-data-grid">
              <span className="forecast-row-label">시간</span>
              {forecastRows.map((row) => <span className="forecast-cell time-cell" key={`time-${row.time}`}>{row.time}</span>)}
              <span className="forecast-row-label">기온 °C</span>
              {forecastRows.map((row) => <span className="forecast-cell temp-cell" key={`temp-${row.time}`}>{row.temperature}°</span>)}
              <span className="forecast-row-label">비 mm</span>
              {forecastRows.map((row) => <span className="forecast-cell rain-cell" key={`rain-${row.time}`}>{row.precipitation > 0 ? row.precipitation : ""}</span>)}
              <span className="forecast-row-label">바람</span>
              {forecastRows.map((row) => <span className="forecast-cell wind-cell" key={`wind-${row.time}`}>{Math.round(row.windSpeed)}</span>)}
            </div>
          </div>
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
          <label>온도 경보 (°C)<span className="threshold-input"><input type="number" value={thresholds.temperature} onChange={(event) => setThresholds({ ...thresholds, temperature: Number(event.target.value) })} />°C</span></label>
          <button type="button" onClick={saveThresholds}>설정 저장</button>
        </aside>
      </div>
    </section>
  );
}
