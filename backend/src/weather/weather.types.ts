export type WeatherRiskLevel = 'normal' | 'caution' | 'alert' | 'danger';

export type WeatherMetricKey = 'windSpeed' | 'precipitation' | 'temperature' | 'humidity';

export type WeatherMetricTone = 'green' | 'orange' | 'red';

export type WeatherForecastItem = {
  time: string;
  icon: string;
  condition: string;
  rainProbability: number;
  temperature: number;
  windSpeed: number;
  riskLevel: WeatherRiskLevel;
};

export type WeatherMetric = {
  key: WeatherMetricKey;
  label: string;
  sourceLabel: string;
  value: number;
  unit: string;
  thresholdLabel: string;
  percent: number;
  status: 'NORMAL' | 'CAUTION' | 'ALERT';
  tone: WeatherMetricTone;
};

export type WeatherAlertLog = {
  id: string;
  level: Exclude<WeatherRiskLevel, 'normal'>;
  title: string;
  time: string;
  message: string;
};

export type WeatherStation = {
  name: string;
  latitude: number;
  longitude: number;
  nx: number;
  ny: number;
  source: 'KMA';
  updatedAt: string;
};

export type WeatherThresholds = {
  windSpeed: number;
  precipitation: number;
  temperature: number;
  humidity: number;
};

export type WeatherCorrectionProfile = {
  temperatureOffset: number;
  windSpeedOffset: number;
  humidityOffset: number;
  precipitationOffset: number;
};

export type AdminWeatherOverview = {
  source: {
    provider: 'KMA';
    name: string;
    mode: 'adapter-placeholder' | 'live';
    baseDateTime: string;
    updatedAt: string;
    advisoryMergePolicy: string;
  };
  site: WeatherStation;
  thresholds: WeatherThresholds;
  correctionProfile: WeatherCorrectionProfile;
  current: {
    condition: string;
    riskLevel: WeatherRiskLevel;
    summary: string;
    metrics: WeatherMetric[];
  };
  forecast24h: WeatherForecastItem[];
  alertLogs: WeatherAlertLog[];
};
