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

const savedWorkerForGuard = getSavedWorker();

if (isPayrollDocumentRequired(savedWorkerForGuard)) {
  window.location.replace("../payroll-documents/");
}

function setupPayrollDocumentAction(user) {
  const button = document.querySelector("#payroll-resubmit");

  if (!isPayrollDocumentTarget(user)) {
    button.hidden = true;
    return;
  }

  button.hidden = false;
  button.addEventListener("click", () => {
    clearPayrollDocumentSubmission(user);
    window.location.href = "../payroll-documents/";
  });
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
  setText("#metric-temperature-note", `보정 기온 ${weather.temperature}°C`);
  setText("#metric-rain", `${weather.rainProbability}%`);
  setText("#metric-rain-note", `원천 ${weather.raw.rainProbability}%`);
  setText("#metric-wind", `${weather.windSpeed}m/s`);
  setText("#metric-wind-note", `원천 ${weather.raw.windSpeed}m/s`);

  setText("#weather-source-status", `${weather.source.name} · mock`);
  setText("#weather-status", weather.risk.statusLabel);
  setText("#weather-temperature", `${weather.temperature}°C`);
  setText("#weather-condition", weather.condition);
  setText("#weather-updated", `${weather.updatedAt} · ${weather.correction.name}`);

  const items = [
    ["체감온도", `${weather.feelsLike}°C`],
    ["보정 습도", `${weather.humidity}%`],
    ["보정 강수확률", `${weather.rainProbability}%`],
    ["보정 풍속", `${weather.windSpeed}m/s`],
    ["원천 기온", `${weather.raw.temperature}°C`],
    ["원천 풍속", `${weather.raw.windSpeed}m/s`],
    ["특보 채널", weather.specialAdvisory.current ? weather.specialAdvisory.current.title : "별도 연동 예정"],
    ["보정 근거", weather.correction.reason],
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
setupPayrollDocumentAction(savedWorkerForGuard);
