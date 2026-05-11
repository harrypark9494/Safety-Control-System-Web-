const dashboardData = {
  dateLabel: "2026년 5월 11일 월요일",
  greeting: "박현장님, 오늘 배정된 안전 점검을 확인하세요.",
  site: {
    name: "A-3 구역 철골 설치 현장",
    location: "서울 성동구 성수동",
    shift: "오전 08:00 - 오후 17:00",
  },
  risk: {
    level: "주의",
    detail: "오후 강풍 가능성이 있어 고소작업 전 재점검이 필요합니다.",
  },
  user: {
    name: "박현장",
    role: "현장 작업자",
    phone: "010-1234-5678",
    team: "철골 2팀",
    supervisor: "김안전 관리자",
    status: "출근 확인",
  },
  weather: {
    temperature: 24,
    feelsLike: 27,
    condition: "구름 많음",
    updatedAt: "오전 09:20 기준",
    rainProbability: 35,
    windSpeed: 6.2,
    humidity: 68,
    uvIndex: "보통",
  },
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
      text: "풍속 6m/s 이상 예보. 양중 작업 전 관리자 확인 필요",
    },
    {
      label: "확인",
      text: "오전 TBM 참석 기록이 정상 반영되었습니다.",
    },
    {
      label: "대기",
      text: "13:00 이후 작업 승인 여부를 다시 확인하세요.",
    },
  ],
};
