import type {
  AdminWeatherOverview,
  WeatherCorrectionProfile,
  WeatherForecastItem,
  WeatherMetric,
  WeatherRiskLevel,
  WeatherThresholds,
} from "../../types";

type RawTestWeather = {
  condition: string;
  temperature: number;
  precipitation: number;
  rainProbability: number;
  windSpeed: number;
  humidity: number;
};

const defaultThresholds: WeatherThresholds = {
  windSpeed: 10,
  precipitation: 15,
  temperature: 33,
  humidity: 90,
};

const correctionProfile: WeatherCorrectionProfile = {
  temperatureOffset: 1.2,
  windSpeedOffset: 0.4,
  humidityOffset: 3,
  precipitationOffset: 0,
};

function roundTo(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function metric(
  key: WeatherMetric["key"],
  label: string,
  value: number,
  unit: string,
  threshold: number,
): WeatherMetric {
  const ratio = value / threshold;
  const tone = ratio >= 1 ? "red" : ratio >= 0.75 ? "orange" : "green";

  return {
    key,
    label,
    sourceLabel: "테스트 fixture + 현장 보정",
    value,
    unit,
    thresholdLabel: `경보: ${threshold}${unit}`,
    percent: Math.min(Math.round(ratio * 100), 100),
    status: tone === "red" ? "ALERT" : tone === "orange" ? "CAUTION" : "NORMAL",
    tone,
  };
}

function evaluateRisk(weather: RawTestWeather, thresholds: WeatherThresholds): WeatherRiskLevel {
  if (weather.windSpeed >= thresholds.windSpeed || weather.temperature >= thresholds.temperature) {
    return "alert";
  }

  if (
    weather.precipitation >= thresholds.precipitation * 0.75 ||
    weather.rainProbability >= 70 ||
    weather.temperature >= thresholds.temperature * 0.9
  ) {
    return "caution";
  }

  return "normal";
}

function buildForecast24h(thresholds: WeatherThresholds): WeatherForecastItem[] {
  return Array.from({ length: 24 }, (_, index) => {
    const hour = (12 + index) % 24;
    const rainBlock = index >= 5 && index <= 9;
    const temperature = roundTo(25 + Math.sin((index - 1) / 3) * 5 + (index < 7 ? 2 : 0), 0);
    const precipitation = rainBlock ? [1, 4, 10, 7, 2][index - 5] : 0;
    const rainProbability = precipitation > 0 ? Math.min(45 + precipitation * 5, 90) : index > 16 ? 30 : 15;
    const windSpeed = roundTo(2.8 + Math.sin(index / 2) * 1.7 + (rainBlock ? 1.8 : 0), 1);
    const item = {
      time: `${String(hour).padStart(2, "0")}:00`,
      icon: precipitation > 0 ? "rainy" : temperature >= 30 ? "sunny" : "partly_cloudy_day",
      condition: precipitation > 0 ? "비" : temperature >= 30 ? "맑음" : "구름조금",
      rainProbability,
      precipitation,
      temperature,
      windSpeed,
    };

    return {
      ...item,
      riskLevel: evaluateRisk({ ...item, humidity: 68 }, thresholds),
    };
  });
}

export function buildTestWeatherOverview(projectId?: string): AdminWeatherOverview {
  const now = new Date();
  const raw: RawTestWeather = {
    condition: "구름많음",
    temperature: projectId?.includes("winter") ? 7.5 : 30.3,
    precipitation: 12,
    rainProbability: 55,
    windSpeed: 4.2,
    humidity: 65,
  };
  const adjusted: RawTestWeather = {
    ...raw,
    temperature: roundTo(raw.temperature + correctionProfile.temperatureOffset, 1),
    precipitation: roundTo(Math.max(raw.precipitation + correctionProfile.precipitationOffset, 0), 1),
    windSpeed: roundTo(Math.max(raw.windSpeed + correctionProfile.windSpeedOffset, 0), 1),
    humidity: roundTo(Math.min(Math.max(raw.humidity + correctionProfile.humidityOffset, 0), 100), 1),
  };
  const riskLevel = evaluateRisk(adjusted, defaultThresholds);

  return {
    source: {
      provider: "KMA",
      name: "테스트 기상 fixture",
      mode: "test-fixture",
      baseDateTime: now.toISOString(),
      updatedAt: now.toISOString(),
      advisoryMergePolicy: "테스트 fixture는 특보 채널을 포함하지 않으며 API 실패 시 화면 검증용으로만 사용",
    },
    site: {
      name: projectId?.includes("winter") ? "운영 장소 미정" : "킨텍스 제2전시장",
      latitude: 37.6698,
      longitude: 126.7451,
      nx: 57,
      ny: 128,
      source: "KMA",
      updatedAt: now.toISOString(),
    },
    thresholds: defaultThresholds,
    correctionProfile,
    current: {
      condition: adjusted.condition,
      riskLevel,
      summary: `테스트 fixture 기준 ${adjusted.condition}, 강수 ${adjusted.precipitation}mm/h 상태입니다.`,
      metrics: [
        metric("windSpeed", "풍속 (WIND SPEED)", adjusted.windSpeed, "m/s", defaultThresholds.windSpeed),
        metric("precipitation", "강수량 (PRECIPITATION)", adjusted.precipitation, "mm/h", defaultThresholds.precipitation),
        metric("temperature", "온도 (TEMPERATURE)", adjusted.temperature, "°C", defaultThresholds.temperature),
        metric("humidity", "습도 (HUMIDITY)", adjusted.humidity, "%", defaultThresholds.humidity),
      ],
    },
    forecast24h: buildForecast24h(defaultThresholds),
    alertLogs: [
      {
        id: "test-weather-fixture",
        level: "caution",
        title: "테스트 기상 데이터",
        time: "현재",
        message: "실시간 기상 API 연결 실패로 테스트 fixture를 표시 중입니다.",
      },
    ],
  };
}
