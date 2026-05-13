const dashboardWeather = buildDashboardWeather();

const dashboardData = {
  dateLabel: "2026년 5월 11일 월요일",
  greeting: "오늘 배정된 안전 점검을 확인하세요.",
  site: {
    name: "A-3 구역 철골 설치 현장",
    location: "서울 성동구 성수동",
    shift: "오전 08:00 - 오후 17:00",
  },
  risk: {
    level: dashboardWeather.risk.level,
    detail: `${dashboardWeather.risk.detail} 기상 특보는 별도 채널 연동 후 위험 등급 상향 조건으로 합산합니다.`,
  },
  user: {
    name: "박현장",
    role: "현장 작업자",
    phone: "010-1234-5678",
    team: "철골 2팀",
    supervisor: "김안전 관리자",
    status: "출근 확인",
  },
  weather: dashboardWeather,
  tasks: [
    {
      title: "작업 전 안전교육 참석",
      time: "08:10",
      status: "done",
    },
    {
      title: "개인 보호구 착용 상태 확인",
      time: "08:30",
      status: "done",
    },
    {
      title: "A-3 구역 난간 고정 상태 점검",
      time: "10:30",
      status: "active",
    },
    {
      title: "오후 강풍 예보 확인 후 고소작업 승인 요청",
      time: "13:00",
      status: "todo",
    },
  ],
  alerts: [
    {
      label: "주의",
      text: `${dashboardWeather.risk.detail}. 양중 작업 전 관리자 확인 필요`,
    },
    {
      label: "확인",
      text: `${dashboardWeather.source.name} 원천값에 현장 보정값이 적용되었습니다.`,
    },
    {
      label: "대기",
      text: "기상 특보 채널은 별도 연동 예정입니다. 특보 수신 시 위험 등급 상향 조건으로 합산합니다.",
    },
  ],
};
