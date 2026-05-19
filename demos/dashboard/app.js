const tabLabels = {
  dashboard: "대시보드",
  schedule: "스케줄",
  safety: "안전",
  profile: "프로필",
};

const scheduleStatus = {
  done: "완료",
  active: "진행중",
  break: "휴식",
  todo: "대기중",
};

function setText(selector, text) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = text;
  }
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

  if (!button || !isPayrollDocumentTarget(user)) {
    if (button) {
      button.hidden = true;
    }
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
    user: {
      ...dashboardData.user,
      name: savedWorker.name || dashboardData.user.name,
      phone: savedWorker.phone || dashboardData.user.phone,
      role: savedWorker.workType || dashboardData.user.role,
      zone: savedWorker.team || dashboardData.user.zone,
      status: savedWorker.status || dashboardData.user.status,
    },
  };
}

function renderWeatherMetrics(weather) {
  const metrics = [
    { icon: "≋", label: "풍속", value: `${weather.windSpeed} m/s`, tone: "green" },
    { icon: "☁", label: "강수 확률", value: `${weather.rainProbability}%`, tone: "green" },
    { icon: "♨", label: "체감 온도", value: `${weather.feelsLike}°C`, tone: "red" },
    { icon: "♙", label: "습도", value: `${weather.humidity}%`, tone: "orange" },
  ];

  document.querySelector("#weather-metrics").innerHTML = metrics
    .map(
      (metric) => `
        <article class="weather-metric ${metric.tone}">
          <span aria-hidden="true">${metric.icon}</span>
          <div>
            <small>${metric.label}</small>
            <strong>${metric.value}</strong>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderProgress(progress) {
  setText("#stage-title", progress.title);
  setText("#stage-time", progress.time);
  setText("#stage-progress-value", `${progress.overall}%`);
  document.querySelector("#stage-progress-bar").style.width = `${progress.overall}%`;

  document.querySelector("#stage-breakdown").innerHTML = progress.parts
    .map(
      (part) => `
        <div>
          <strong>${part.label}</strong>
          <span>${part.value}%</span>
        </div>
      `,
    )
    .join("");
}

function renderDashboardRules(rules) {
  document.querySelector("#dashboard-rule-list").innerHTML = rules
    .slice(1, 3)
    .map(
      (rule) => `
        <article>
          <span aria-hidden="true">${rule.icon}</span>
          <strong>${rule.title.replace("안전 ", "안전")}</strong>
          <em aria-label="점검 완료">●</em>
        </article>
      `,
    )
    .join("");
}

function renderTimeline(schedule) {
  document.querySelector("#timeline").innerHTML = schedule
    .map((item) => {
      const progress =
        typeof item.progress === "number"
          ? `
            <div class="timeline-progress-label">
              <span>진행률</span>
              <strong>${item.progress}%</strong>
            </div>
            <div class="timeline-progress" aria-hidden="true">
              <span style="width: ${item.progress}%"></span>
            </div>
          `
          : "";

      return `
        <li class="${item.status}">
          <time>${item.start}</time>
          <article>
            <div class="timeline-title">
              <h3>${item.title}</h3>
              <span>${scheduleStatus[item.status]}</span>
            </div>
            <p>${item.time}</p>
            ${progress}
          </article>
        </li>
      `;
    })
    .join("");
}

function renderSafetyRules(rules) {
  document.querySelector("#safety-rule-list").innerHTML = rules
    .map(
      (rule) => `
        <article>
          <span class="rule-icon" aria-hidden="true">${rule.icon}</span>
          <div>
            <strong>${rule.title}</strong>
            <p>${rule.description}</p>
          </div>
          <em aria-label="확인 완료">♡</em>
        </article>
      `,
    )
    .join("");
}

function renderEmergency(emergency) {
  document.querySelector("#manager-call").innerHTML = `
    <span class="profile-icon" aria-hidden="true">♙</span>
    <div>
      <strong>${emergency.name}</strong>
      <p>${emergency.phone}</p>
    </div>
    <a href="tel:${emergency.phone.replaceAll("-", "")}" aria-label="${emergency.name}에게 전화">☎</a>
  `;
}

function renderProfile(user) {
  setText("#profile-name", user.name);
  setText("#profile-phone", user.phone);
  setText("#profile-zone", user.zone);
}

function renderDashboard(data) {
  setText("#event-date", data.event.date);
  setText("#event-name", data.event.title);
  setText("#weather-time", data.event.weatherWindow);
  setText("#weather-risk-title", `자외선 지수 ${data.weather.uvIndex}`);
  setText("#weather-risk-detail", data.event.weatherWindow);
  setText("#schedule-date", data.event.date);

  renderWeatherMetrics(data.weather);
  renderProgress(data.progress);
  renderDashboardRules(data.safetyRules);
  renderTimeline(data.schedule);
  renderSafetyRules(data.safetyRules);
  renderEmergency(data.emergency);
  renderProfile(data.user);
}

function activateTab(nextTab) {
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.panel === nextTab);
  });

  document.querySelectorAll("[data-tab]").forEach((button) => {
    const isActive = button.dataset.tab === nextTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

  document.title = `${tabLabels[nextTab]} · Waterbomb Safety Dashboard`;
}

function buildQrCells(seed) {
  const cells = [];

  for (let row = 0; row < 21; row += 1) {
    for (let col = 0; col < 21; col += 1) {
      const inMarker =
        (row < 7 && col < 7) ||
        (row < 7 && col > 13) ||
        (row > 13 && col < 7);
      const markerHole =
        ((row > 1 && row < 5 && col > 1 && col < 5) ||
          (row > 1 && row < 5 && col > 15 && col < 19) ||
          (row > 15 && row < 19 && col > 1 && col < 5));
      const patterned = (row * 7 + col * 11 + seed) % 5 < 2;
      const isDark = inMarker ? !markerHole : patterned;

      cells.push(`<span class="${isDark ? "dark" : ""}"></span>`);
    }
  }

  return cells.join("");
}

function openQrModal(type, data) {
  const qr = data.qr[type];
  const modal = document.querySelector("#qr-modal");

  setText("#qr-modal-date", data.event.date);
  setText("#qr-modal-title", qr.title);
  setText("#qr-modal-help", qr.help);
  document.querySelector("#qr-code").innerHTML = buildQrCells(type === "meal" ? 17 : 31);
  modal.hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector(".modal-close").focus();
}

function closeQrModal() {
  document.querySelector("#qr-modal").hidden = true;
  document.body.classList.remove("modal-open");
}

function setupInteractions(data) {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  document.querySelectorAll("[data-qr-type]").forEach((button) => {
    button.addEventListener("click", () => openQrModal(button.dataset.qrType, data));
  });

  document.querySelector(".modal-close").addEventListener("click", closeQrModal);
  document.querySelector(".modal-action").addEventListener("click", closeQrModal);
  document.querySelector("#qr-modal").addEventListener("click", (event) => {
    if (event.target.id === "qr-modal") {
      closeQrModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.querySelector("#qr-modal").hidden) {
      closeQrModal();
    }
  });
}

const data = getDashboardData();

renderDashboard(data);
setupInteractions(data);
setupPayrollDocumentAction(savedWorkerForGuard);
