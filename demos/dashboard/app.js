const statusText = {
  done: "완료",
  active: "진행",
  todo: "예정",
};

function setText(selector, text) {
  document.querySelector(selector).textContent = text;
}

function getSavedWorker() {
  const rawUser = window.sessionStorage.getItem("safetyControlUser");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    window.sessionStorage.removeItem("safetyControlUser");
    return null;
  }
}

function getDashboardData() {
  const savedWorker = getSavedWorker();

  if (!savedWorker) {
    return dashboardData;
  }

  return {
    ...dashboardData,
    greeting: `${savedWorker.name}님, 오늘 배정된 안전 점검을 확인하세요.`,
    user: {
      ...dashboardData.user,
      name: savedWorker.name,
      role: savedWorker.workType || dashboardData.user.role,
      phone: savedWorker.phone,
      team: savedWorker.team || dashboardData.user.team,
      supervisor: savedWorker.supervisor || dashboardData.user.supervisor,
      status: savedWorker.status || dashboardData.user.status,
    },
  };
}

function renderUser(user, site) {
  setText("#user-avatar", user.name.slice(0, 1));
  setText("#user-name", user.name);
  setText("#user-role", `${user.role} · ${site.name}`);
  setText("#user-status", user.status);

  const info = [
    ["연락처", user.phone],
    ["소속", user.team],
    ["담당 관리자", user.supervisor],
    ["근무 시간", site.shift],
    ["현장 위치", site.location],
  ];

  document.querySelector("#user-info").innerHTML = info
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("");
}

function renderWeather(weather) {
  setText("#metric-temperature", `${weather.feelsLike}°C`);
  setText("#metric-temperature-note", `실제 ${weather.temperature}°C`);
  setText("#metric-rain", `${weather.rainProbability}%`);
  setText("#metric-rain-note", "오후 기준");
  setText("#metric-wind", `${weather.windSpeed}m/s`);
  setText("#metric-wind-note", weather.windSpeed >= 6 ? "작업 전 확인" : "정상 범위");

  setText("#weather-status", weather.windSpeed >= 6 ? "작업 전 확인" : "정상");
  setText("#weather-temperature", `${weather.temperature}°C`);
  setText("#weather-condition", weather.condition);
  setText("#weather-updated", weather.updatedAt);

  const items = [
    ["체감온도", `${weather.feelsLike}°C`],
    ["습도", `${weather.humidity}%`],
    ["강수확률", `${weather.rainProbability}%`],
    ["자외선", weather.uvIndex],
  ];

  document.querySelector("#weather-list").innerHTML = items
    .map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`)
    .join("");
}

function renderTasks(tasks) {
  const doneCount = tasks.filter((task) => task.status === "done").length;

  setText("#metric-tasks", `${doneCount}/${tasks.length}`);
  setText("#metric-tasks-note", "완료");
  setText("#tasks-progress", `${doneCount}개 완료`);

  document.querySelector("#task-list").innerHTML = tasks
    .map(
      (task) => `
        <li class="${task.status}">
          <div class="task-check" aria-hidden="true"></div>
          <div>
            <strong>${task.title}</strong>
            <span>${task.time} · ${statusText[task.status]}</span>
          </div>
        </li>
      `,
    )
    .join("");
}

function renderAlerts(alerts) {
  document.querySelector("#alert-list").innerHTML = alerts
    .map(
      (alert) => `
        <li>
          <span>${alert.label}</span>
          <p>${alert.text}</p>
        </li>
      `,
    )
    .join("");
}

function renderDashboard(data) {
  setText("#today-label", data.dateLabel);
  setText("#dashboard-title", data.greeting);
  setText("#site-summary", `${data.site.name} · ${data.risk.detail}`);
  setText("#risk-badge", data.risk.level);

  renderUser(data.user, data.site);
  renderWeather(data.weather);
  renderTasks(data.tasks);
  renderAlerts(data.alerts);
}

renderDashboard(getDashboardData());
