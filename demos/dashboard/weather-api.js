const weatherApiConfig = {
  mode: "mock",
  provider: "KMA short-term forecast lookup service",
  specialAdvisoryChannel: {
    status: "planned",
    mergePolicy: "특보는 별도 채널에서 수신한 뒤 위험 등급 상향 조건으로만 합칩니다.",
  },
  riskThresholds: {
    cautionWindSpeed: 6,
    dangerWindSpeed: 10,
    cautionRainProbability: 50,
    cautionFeelsLike: 30,
  },
};

const mockKmaForecastResponse = {
  sourceName: "기상청 단기예보",
  baseDateTime: "2026-05-11T09:20:00+09:00",
  siteGrid: {
    nx: 61,
    ny: 126,
    label: "서울 성동구 성수동",
  },
  forecast: {
    temperature: 24,
    humidity: 68,
    rainProbability: 35,
    windSpeed: 5.4,
    skyCode: "DB03",
    precipitationType: "none",
    uvIndex: "보통",
  },
  correctionProfile: {
    name: "A-3 철골 고소작업 보정",
    temperatureOffset: 1.5,
    windSpeedMultiplier: 1.15,
    rainProbabilityOffset: 5,
    humidityOffset: 2,
    reason: "개방형 철골 구간과 복사열을 고려한 현장 보정값",
  },
  specialAdvisory: null,
};

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundTo(value, digit = 1) {
  const scale = 10 ** digit;
  return Math.round(value * scale) / scale;
}

function formatUpdatedAt(dateTime) {
  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return "업데이트 시간 확인 필요";
  }

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }) + " 기준";
}

function getSkyCondition(forecast) {
  const skyLabels = {
    DB01: "맑음",
    DB02: "구름 조금",
    DB03: "구름 많음",
    DB04: "흐림",
  };

  if (forecast.precipitationType !== "none") {
    return "강수 가능";
  }

  return skyLabels[forecast.skyCode] || "날씨 확인 필요";
}

function applyWeatherCorrection(rawWeather) {
  const { forecast, correctionProfile } = rawWeather;

  return {
    temperature: roundTo(forecast.temperature + correctionProfile.temperatureOffset),
    humidity: clampNumber(forecast.humidity + correctionProfile.humidityOffset, 0, 100),
    rainProbability: clampNumber(
      forecast.rainProbability + correctionProfile.rainProbabilityOffset,
      0,
      100,
    ),
    windSpeed: roundTo(forecast.windSpeed * correctionProfile.windSpeedMultiplier),
    uvIndex: forecast.uvIndex,
  };
}

function calculateFeelsLike(adjustedWeather) {
  const heatFactor = adjustedWeather.humidity >= 65 ? 1.5 : 0.8;
  const windFactor = adjustedWeather.windSpeed >= 6 ? 0.4 : 0;

  return roundTo(adjustedWeather.temperature + heatFactor + windFactor);
}

function evaluateWeatherRisk(adjustedWeather, thresholds) {
  const reasons = [];

  if (adjustedWeather.windSpeed >= thresholds.dangerWindSpeed) {
    reasons.push("강풍 기준 초과");
  } else if (adjustedWeather.windSpeed >= thresholds.cautionWindSpeed) {
    reasons.push("고소작업 전 풍속 확인 필요");
  }

  if (adjustedWeather.rainProbability >= thresholds.cautionRainProbability) {
    reasons.push("강수 가능성 증가");
  }

  if (adjustedWeather.feelsLike >= thresholds.cautionFeelsLike) {
    reasons.push("온열 부담 확인 필요");
  }

  if (adjustedWeather.windSpeed >= thresholds.dangerWindSpeed) {
    return {
      level: "위험",
      statusLabel: "작업 제한 검토",
      detail: reasons.join(", "),
    };
  }

  if (reasons.length > 0) {
    return {
      level: "주의",
      statusLabel: "작업 전 확인",
      detail: reasons.join(", "),
    };
  }

  return {
    level: "정상",
    statusLabel: "정상 범위",
    detail: "현재 보정값 기준으로 주요 기상 위험이 낮습니다.",
  };
}

function buildDashboardWeather(rawWeather = mockKmaForecastResponse) {
  const adjusted = applyWeatherCorrection(rawWeather);
  const feelsLike = calculateFeelsLike(adjusted);
  const adjustedWithFeelsLike = {
    ...adjusted,
    feelsLike,
  };
  const risk = evaluateWeatherRisk(adjustedWithFeelsLike, weatherApiConfig.riskThresholds);

  return {
    source: {
      provider: weatherApiConfig.provider,
      name: rawWeather.sourceName,
      baseDateTime: rawWeather.baseDateTime,
      updatedAt: formatUpdatedAt(rawWeather.baseDateTime),
      gridLabel: rawWeather.siteGrid.label,
    },
    raw: rawWeather.forecast,
    correction: rawWeather.correctionProfile,
    specialAdvisory: {
      status: weatherApiConfig.specialAdvisoryChannel.status,
      mergePolicy: weatherApiConfig.specialAdvisoryChannel.mergePolicy,
      current: rawWeather.specialAdvisory,
    },
    temperature: adjustedWithFeelsLike.temperature,
    feelsLike: adjustedWithFeelsLike.feelsLike,
    condition: getSkyCondition(rawWeather.forecast),
    updatedAt: formatUpdatedAt(rawWeather.baseDateTime),
    rainProbability: adjustedWithFeelsLike.rainProbability,
    windSpeed: adjustedWithFeelsLike.windSpeed,
    humidity: adjustedWithFeelsLike.humidity,
    uvIndex: adjustedWithFeelsLike.uvIndex,
    risk,
  };
}
