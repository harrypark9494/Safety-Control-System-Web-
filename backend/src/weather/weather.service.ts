import { Injectable } from '@nestjs/common';
import { UpdateWeatherStationRequest, UpdateWeatherThresholdsRequest } from './weather.dto';
import type {
  AdminWeatherOverview,
  WeatherCorrectionProfile,
  WeatherForecastItem,
  WeatherMetric,
  WeatherMetricTone,
  WeatherRiskLevel,
  WeatherStation,
  WeatherThresholds,
} from './weather.types';

type RawWeatherSnapshot = {
  baseDateTime: string;
  condition: string;
  temperature: number;
  precipitation: number;
  rainProbability: number;
  windSpeed: number;
  humidity: number;
  forecast24h: Array<Omit<WeatherForecastItem, 'riskLevel'>>;
};

type WeatherProjectState = {
  station: WeatherStation;
  thresholds: WeatherThresholds;
  correctionProfile: WeatherCorrectionProfile;
};

@Injectable()
export class WeatherService {
  private readonly projectStates = new Map<string, WeatherProjectState>();

  getAdminOverview(projectId?: string): AdminWeatherOverview {
    const state = this.ensureProjectState(projectId);
    const raw = this.getRawKmaSnapshot();
    const adjusted = this.applyCorrection(raw, state.correctionProfile);
    const metrics = this.buildMetrics(adjusted, state.thresholds);
    const riskLevel = this.evaluateRisk(adjusted, state.thresholds);

    return {
      source: {
        provider: 'KMA',
        name: '기상청 단기예보 어댑터',
        mode: 'adapter-placeholder',
        baseDateTime: raw.baseDateTime,
        updatedAt: new Date().toISOString(),
        advisoryMergePolicy: '특보는 예보값에 섞지 않고 별도 채널로 받은 뒤 위험 등급 상향 조건으로만 사용',
      },
      site: state.station,
      thresholds: state.thresholds,
      correctionProfile: state.correctionProfile,
      current: {
        condition: adjusted.condition,
        riskLevel,
        summary: this.buildSummary(adjusted, riskLevel),
        metrics,
      },
      forecast24h: adjusted.forecast24h.map((item) => ({
        ...item,
        riskLevel: this.evaluateForecastRisk(item, state.thresholds),
      })),
      alertLogs: this.buildAlertLogs(adjusted, state.thresholds),
    };
  }

  updateStation(request: UpdateWeatherStationRequest) {
    const state = this.ensureProjectState(request.projectId);
    state.station = {
      ...state.station,
      name: request.name?.trim() || state.station.name,
      latitude: this.roundTo(request.latitude, 4),
      longitude: this.roundTo(request.longitude, 4),
      ...this.toKmaGrid(request.latitude, request.longitude),
      updatedAt: new Date().toISOString(),
    };

    return this.getAdminOverview(request.projectId);
  }

  updateThresholds(request: UpdateWeatherThresholdsRequest) {
    const state = this.ensureProjectState(request.projectId);
    state.thresholds = {
      windSpeed: this.roundTo(request.windSpeed, 1),
      precipitation: this.roundTo(request.precipitation, 1),
      temperature: this.roundTo(request.temperature, 1),
      humidity: this.roundTo(request.humidity, 1),
    };

    return this.getAdminOverview(request.projectId);
  }

  private ensureProjectState(projectId?: string) {
    const key = projectId?.trim() || 'default';
    const existing = this.projectStates.get(key);

    if (existing) {
      return existing;
    }

    const state: WeatherProjectState = {
      station: {
        name: key.includes('winter') ? '운영 장소 미정' : '킨텍스 제2전시장',
        latitude: 37.6698,
        longitude: 126.7451,
        nx: 57,
        ny: 128,
        source: 'KMA',
        updatedAt: new Date().toISOString(),
      },
      thresholds: {
        windSpeed: 10,
        precipitation: 15,
        temperature: key.includes('winter') ? 5 : 33,
        humidity: 90,
      },
      correctionProfile: {
        temperatureOffset: key.includes('winter') ? -1.5 : 1.2,
        windSpeedOffset: 0.4,
        humidityOffset: 3,
        precipitationOffset: 0,
      },
    };
    this.projectStates.set(key, state);
    return state;
  }

  private getRawKmaSnapshot(): RawWeatherSnapshot {
    return {
      baseDateTime: '2026-07-19T05:00:00Z',
      condition: '구름많음',
      temperature: 30.3,
      precipitation: 12,
      rainProbability: 55,
      windSpeed: 4.2,
      humidity: 65,
      forecast24h: this.buildForecast24h(),
    };
  }

  private buildForecast24h(): Array<Omit<WeatherForecastItem, 'riskLevel'>> {
    return Array.from({ length: 24 }, (_, index) => {
      const hour = (12 + index) % 24;
      const rainBlock = index >= 6 && index <= 10;
      const temperature = this.roundTo(26 + Math.sin((index - 2) / 3) * 5 + (index < 5 ? 1.5 : 0), 0);
      const precipitation = rainBlock ? [2, 6, 12, 8, 3][index - 6] : 0;
      const rainProbability = precipitation > 0 ? Math.min(45 + precipitation * 5, 90) : index > 15 ? 25 : 10;
      const windSpeed = this.roundTo(2.5 + Math.sin(index / 2) * 1.8 + (rainBlock ? 2 : 0), 1);

      return {
        time: `${String(hour).padStart(2, '0')}:00`,
        icon: precipitation > 0 ? 'rainy' : temperature >= 30 ? 'sunny' : 'partly_cloudy_day',
        condition: precipitation > 0 ? '비' : temperature >= 30 ? '맑음' : '구름조금',
        rainProbability,
        precipitation,
        temperature,
        windSpeed,
      };
    });
  }

  private applyCorrection(raw: RawWeatherSnapshot, correctionProfile: WeatherCorrectionProfile): RawWeatherSnapshot {
    return {
      ...raw,
      temperature: this.roundTo(raw.temperature + correctionProfile.temperatureOffset, 1),
      precipitation: this.roundTo(Math.max(raw.precipitation + correctionProfile.precipitationOffset, 0), 1),
      windSpeed: this.roundTo(Math.max(raw.windSpeed + correctionProfile.windSpeedOffset, 0), 1),
      humidity: this.roundTo(Math.min(Math.max(raw.humidity + correctionProfile.humidityOffset, 0), 100), 1),
    };
  }

  private buildMetrics(weather: RawWeatherSnapshot, thresholds: WeatherThresholds): WeatherMetric[] {
    return [
      this.metric('windSpeed', '풍속 (WIND SPEED)', weather.windSpeed, 'm/s', thresholds.windSpeed, false),
      this.metric('precipitation', '강수량 (PRECIPITATION)', weather.precipitation, 'mm/h', thresholds.precipitation, false),
      this.metric('temperature', '온도 (TEMPERATURE)', weather.temperature, '°C', thresholds.temperature, false),
      this.metric('humidity', '습도 (HUMIDITY)', weather.humidity, '%', thresholds.humidity, false),
    ];
  }

  private metric(
    key: WeatherMetric['key'],
    label: string,
    value: number,
    unit: string,
    threshold: number,
    lowerIsRisk: boolean,
  ): WeatherMetric {
    const ratio = lowerIsRisk ? threshold / Math.max(value, 1) : value / threshold;
    const percent = Math.min(Math.round(ratio * 100), 100);
    const tone = this.metricTone(ratio);

    return {
      key,
      label,
      sourceLabel: 'KMA + 현장 보정',
      value,
      unit,
      thresholdLabel: `경보: ${threshold}${unit}`,
      percent,
      status: tone === 'red' ? 'ALERT' : tone === 'orange' ? 'CAUTION' : 'NORMAL',
      tone,
    };
  }

  private metricTone(ratio: number): WeatherMetricTone {
    if (ratio >= 1) {
      return 'red';
    }

    if (ratio >= 0.75) {
      return 'orange';
    }

    return 'green';
  }

  private evaluateRisk(weather: RawWeatherSnapshot, thresholds: WeatherThresholds): WeatherRiskLevel {
    if (weather.windSpeed >= thresholds.windSpeed || weather.temperature >= thresholds.temperature) {
      return 'alert';
    }

    if (
      weather.precipitation >= thresholds.precipitation * 0.75
      || weather.rainProbability >= 70
      || weather.temperature >= thresholds.temperature * 0.9
    ) {
      return 'caution';
    }

    return 'normal';
  }

  private evaluateForecastRisk(item: Omit<WeatherForecastItem, 'riskLevel'>, thresholds: WeatherThresholds): WeatherRiskLevel {
    if (item.windSpeed >= thresholds.windSpeed || item.temperature >= thresholds.temperature) {
      return 'alert';
    }

    if (
      item.precipitation >= thresholds.precipitation * 0.75
      || item.rainProbability >= 70
      || item.windSpeed >= thresholds.windSpeed * 0.7
      || item.temperature >= thresholds.temperature * 0.9
    ) {
      return 'caution';
    }

    return 'normal';
  }

  private buildSummary(weather: RawWeatherSnapshot, riskLevel: WeatherRiskLevel) {
    if (riskLevel === 'alert') {
      return `현재 ${weather.condition}, 온도 ${weather.temperature}°C 기준으로 작업 제한 검토가 필요합니다.`;
    }

    if (riskLevel === 'caution') {
      return `현재 ${weather.condition}, 강수 ${weather.precipitation}mm/h 및 체감 위험을 모니터링 중입니다.`;
    }

    return `현재 ${weather.condition}, 주요 기상 위험은 기준치 이내입니다.`;
  }

  private buildAlertLogs(weather: RawWeatherSnapshot, thresholds: WeatherThresholds) {
    const logs = [];

    if (weather.temperature >= thresholds.temperature * 0.9) {
      logs.push({
        id: 'heat-caution',
        level: weather.temperature >= thresholds.temperature ? 'alert' as const : 'caution' as const,
        title: weather.temperature >= thresholds.temperature ? '폭염 경보' : '폭염 주의',
        time: '14:15',
        message: `보정 온도 ${weather.temperature}°C 감지. 그늘 휴식과 수분 보급 안내를 확인하세요.`,
      });
    }

    if (weather.windSpeed >= thresholds.windSpeed * 0.7) {
      logs.push({
        id: 'wind-caution',
        level: 'caution' as const,
        title: '강풍 주의',
        time: '11:02',
        message: `풍속 ${weather.windSpeed}m/s 감지. 무대 상단 구조물 고정 상태 점검이 필요합니다.`,
      });
    }

    if (logs.length === 0) {
      logs.push({
        id: 'normal-weather',
        level: 'caution' as const,
        title: '기상 모니터링',
        time: '현재',
        message: '현재 주요 경보 조건은 없으며 기상청 단기예보 값을 계속 확인 중입니다.',
      });
    }

    return logs;
  }

  private toKmaGrid(latitude: number, longitude: number) {
    return {
      nx: Math.round((longitude - 124) * 12),
      ny: Math.round((latitude - 33) * 18),
    };
  }

  private roundTo(value: number, digits: number) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }
}
