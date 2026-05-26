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

@Injectable()
export class WeatherService {
  private station: WeatherStation = {
    name: '킨텍스 제2전시장',
    latitude: 37.6698,
    longitude: 126.7451,
    nx: 57,
    ny: 128,
    source: 'KMA',
    updatedAt: new Date().toISOString(),
  };

  private thresholds: WeatherThresholds = {
    windSpeed: 10,
    precipitation: 15,
    temperature: 33,
    humidity: 90,
  };

  private correctionProfile: WeatherCorrectionProfile = {
    temperatureOffset: 1.2,
    windSpeedOffset: 0.4,
    humidityOffset: 3,
    precipitationOffset: 0,
  };

  getAdminOverview(): AdminWeatherOverview {
    const raw = this.getRawKmaSnapshot();
    const adjusted = this.applyCorrection(raw);
    const metrics = this.buildMetrics(adjusted);
    const riskLevel = this.evaluateRisk(adjusted);

    return {
      source: {
        provider: 'KMA',
        name: '기상청 단기예보 어댑터',
        mode: 'adapter-placeholder',
        baseDateTime: raw.baseDateTime,
        updatedAt: new Date().toISOString(),
        advisoryMergePolicy: '특보는 예보값에 섞지 않고 별도 채널로 받은 뒤 위험 등급 상향 조건으로만 사용',
      },
      site: this.station,
      thresholds: this.thresholds,
      correctionProfile: this.correctionProfile,
      current: {
        condition: adjusted.condition,
        riskLevel,
        summary: this.buildSummary(adjusted, riskLevel),
        metrics,
      },
      forecast24h: adjusted.forecast24h.map((item) => ({
        ...item,
        riskLevel: this.evaluateForecastRisk(item),
      })),
      alertLogs: this.buildAlertLogs(adjusted),
    };
  }

  updateStation(request: UpdateWeatherStationRequest) {
    this.station = {
      ...this.station,
      name: request.name?.trim() || this.station.name,
      latitude: this.roundTo(request.latitude, 4),
      longitude: this.roundTo(request.longitude, 4),
      ...this.toKmaGrid(request.latitude, request.longitude),
      updatedAt: new Date().toISOString(),
    };

    return this.getAdminOverview();
  }

  updateThresholds(request: UpdateWeatherThresholdsRequest) {
    this.thresholds = {
      windSpeed: this.roundTo(request.windSpeed, 1),
      precipitation: this.roundTo(request.precipitation, 1),
      temperature: this.roundTo(request.temperature, 1),
      humidity: this.roundTo(request.humidity, 1),
    };

    return this.getAdminOverview();
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
      forecast24h: [
        { time: '15:00', icon: 'sunny', condition: '맑음', rainProbability: 10, temperature: 32, windSpeed: 3.8 },
        { time: '16:00', icon: 'partly_cloudy_day', condition: '구름조금', rainProbability: 15, temperature: 31, windSpeed: 4.1 },
        { time: '17:00', icon: 'cloud', condition: '흐림', rainProbability: 40, temperature: 29, windSpeed: 5.5 },
        { time: '18:00', icon: 'rainy', condition: '소나기', rainProbability: 85, temperature: 26, windSpeed: 7.2 },
        { time: '19:00', icon: 'rainy', condition: '약한비', rainProbability: 60, temperature: 25, windSpeed: 5 },
      ],
    };
  }

  private applyCorrection(raw: RawWeatherSnapshot): RawWeatherSnapshot {
    return {
      ...raw,
      temperature: this.roundTo(raw.temperature + this.correctionProfile.temperatureOffset, 1),
      precipitation: this.roundTo(Math.max(raw.precipitation + this.correctionProfile.precipitationOffset, 0), 1),
      windSpeed: this.roundTo(Math.max(raw.windSpeed + this.correctionProfile.windSpeedOffset, 0), 1),
      humidity: this.roundTo(Math.min(Math.max(raw.humidity + this.correctionProfile.humidityOffset, 0), 100), 1),
    };
  }

  private buildMetrics(weather: RawWeatherSnapshot): WeatherMetric[] {
    return [
      this.metric('windSpeed', '풍속 (WIND SPEED)', weather.windSpeed, 'm/s', this.thresholds.windSpeed, false),
      this.metric('precipitation', '강수량 (PRECIPITATION)', weather.precipitation, 'mm/h', this.thresholds.precipitation, false),
      this.metric('temperature', '온도 (TEMPERATURE)', weather.temperature, '°C', this.thresholds.temperature, false),
      this.metric('humidity', '습도 (HUMIDITY)', weather.humidity, '%', this.thresholds.humidity, false),
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

  private evaluateRisk(weather: RawWeatherSnapshot): WeatherRiskLevel {
    if (weather.windSpeed >= this.thresholds.windSpeed || weather.temperature >= this.thresholds.temperature) {
      return 'alert';
    }

    if (
      weather.precipitation >= this.thresholds.precipitation * 0.75
      || weather.rainProbability >= 70
      || weather.temperature >= this.thresholds.temperature * 0.9
    ) {
      return 'caution';
    }

    return 'normal';
  }

  private evaluateForecastRisk(item: Omit<WeatherForecastItem, 'riskLevel'>): WeatherRiskLevel {
    if (item.windSpeed >= this.thresholds.windSpeed || item.temperature >= this.thresholds.temperature) {
      return 'alert';
    }

    if (item.rainProbability >= 70 || item.windSpeed >= this.thresholds.windSpeed * 0.7) {
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

  private buildAlertLogs(weather: RawWeatherSnapshot) {
    const logs = [];

    if (weather.temperature >= this.thresholds.temperature * 0.9) {
      logs.push({
        id: 'heat-caution',
        level: weather.temperature >= this.thresholds.temperature ? 'alert' as const : 'caution' as const,
        title: weather.temperature >= this.thresholds.temperature ? '폭염 경보' : '폭염 주의',
        time: '14:15',
        message: `보정 온도 ${weather.temperature}°C 감지. 그늘 휴식과 수분 보급 안내를 확인하세요.`,
      });
    }

    if (weather.windSpeed >= this.thresholds.windSpeed * 0.7) {
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
