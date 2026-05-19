const dashboardWeather = buildDashboardWeather({
  ...mockKmaForecastResponse,
  baseDateTime: "2026-07-23T12:20:00+09:00",
  forecast: {
    ...mockKmaForecastResponse.forecast,
    temperature: 33,
    humidity: 63,
    rainProbability: 5,
    windSpeed: 2.1,
    skyCode: "DB01",
    uvIndex: "높음",
  },
  correctionProfile: {
    ...mockKmaForecastResponse.correctionProfile,
    name: "워터밤 서울 무대 구역 보정",
    temperatureOffset: 1.5,
    windSpeedMultiplier: 1.15,
    rainProbabilityOffset: 5,
    humidityOffset: 2,
    reason: "무대 전면 개방 구역과 관객 밀집에 따른 체감 위험 보정값",
  },
});

const dashboardData = {
  event: {
    title: "워터밤 서울 D-1",
    date: "2026년 7월 23일 (목)",
    weatherWindow: "최고 강도 예상 시간 12:00 - 15:00",
  },
  user: {
    name: "박재형",
    role: "현장 매니저",
    phone: "010-0000-0000",
    zone: "머천다이즈",
    status: "출근 확인",
  },
  site: {
    name: "워터밤 서울",
    location: "서울 잠실 보조경기장",
    shift: "08:00 - 18:00",
  },
  weather: dashboardWeather,
  progress: {
    title: "무대 설치",
    time: "08:00 - 10:00",
    overall: 75,
    parts: [
      { label: "리깅", value: 100 },
      { label: "AV 연결", value: 80 },
      { label: "조명", value: 45 },
    ],
  },
  schedule: [
    {
      start: "08:00",
      title: "무대 설치 리깅 작업",
      time: "08:00 - 10:00",
      status: "done",
      progress: 100,
    },
    {
      start: "10:00",
      title: "AV 및 음향 시스템 연결",
      time: "10:00 - 13:00",
      status: "active",
      progress: 80,
    },
    {
      start: "13:00",
      title: "중식 및 휴식",
      time: "13:00 - 14:00",
      status: "break",
      progress: null,
    },
    {
      start: "14:00",
      title: "조명 장치 설치 및 테스트",
      time: "14:00 - 17:00",
      status: "active",
      progress: 45,
    },
    {
      start: "17:00",
      title: "안전 최종 점검 및 리허설",
      time: "17:00 - 18:00",
      status: "todo",
      progress: null,
    },
  ],
  safetyRules: [
    {
      icon: "♙",
      title: "안전모 착용",
      description: "현장 진입 시 턱끈까지 확실히 체결",
      checked: true,
    },
    {
      icon: "⚓",
      title: "안전 고리 체결",
      description: "고소 작업 시 2중 안전 고리 확보",
      checked: true,
    },
    {
      icon: "ϟ",
      title: "전기 설비 점검",
      description: "침수 구역 및 노출 배선 상시 확인",
      checked: true,
    },
  ],
  emergency: {
    name: "박재형 매니저",
    phone: "010-0000-0000",
  },
  qr: {
    meal: {
      title: "중식 식권",
      label: "식권 QR",
      help: "운영 데스크에서 위 QR 코드를 스캔하세요",
    },
    water: {
      title: "생수 수령",
      label: "생수 QR",
      help: "워터 스테이션에서 위 QR 코드를 스캔하세요",
    },
  },
};
