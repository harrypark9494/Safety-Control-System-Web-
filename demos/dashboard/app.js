const tabLabels = {
  dashboard: "대시보드",
  schedule: "스케줄",
  safety: "안전",
  profile: "프로필",
};

const qrSeeds = {
  meal: 17,
  water: 31,
};

function setText(selector, text) {
  const element = document.querySelector(selector);

  if (element) {
    element.textContent = text;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function classToken(value) {
  return String(value).replace(/[^a-z0-9_-]/gi, "");
}

function percentValue(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.min(100, Math.max(0, number));
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

  const isPayrollTarget = isPayrollDocumentTarget(savedWorker);
  const payrollSubmitted = !isPayrollDocumentRequired(savedWorker);
  const payrollDocuments = isPayrollTarget
    ? [
        {
          icon: "♙",
          label: "신분증 사본",
          status: payrollSubmitted ? "제출 완료" : "미제출",
          tone: payrollSubmitted ? "info" : "danger",
        },
        {
          icon: "▣",
          label: "통장 사본",
          status: payrollSubmitted ? "제출 완료" : "미제출",
          tone: payrollSubmitted ? "info" : "danger",
        },
      ]
    : [
        {
          icon: "▣",
          label: "급여 서류",
          status: "대상 아님",
          tone: "info",
        },
      ];

  return {
    ...dashboardData,
    user: {
      ...dashboardData.user,
      name: savedWorker.name || dashboardData.user.name,
      role: savedWorker.workType || dashboardData.user.role,
      phone: savedWorker.phone || dashboardData.user.phone,
      zone: savedWorker.team || dashboardData.user.zone,
      status: savedWorker.status || dashboardData.user.status,
    },
    progress: {
      ...dashboardData.progress,
      team: `내 팀: [${savedWorker.team || dashboardData.user.zone}]`,
    },
    emergency: {
      ...dashboardData.emergency,
      name: savedWorker.supervisor || dashboardData.emergency.name,
    },
    documents: payrollDocuments,
  };
}

function renderDashboardRules(rules) {
  setText("#dashboard-rule-status", rules.status);
  document.querySelector("#dashboard-rule-list").innerHTML = rules.items
    .map(
      (rule) => `
        <article>
          <span aria-hidden="true">${escapeHtml(rule.icon)}</span>
          <strong>${escapeHtml(rule.title)}</strong>
          <em aria-label="${rule.checked ? "점검 완료" : "확인 필요"}">${rule.checked ? "●" : "!"}</em>
        </article>
      `,
    )
    .join("");
}

function renderQrSummary(qr) {
  setText("#qr-summary-count", `식권 남은 횟수: ${qr.meal.remaining}회   생수 남은 횟수: ${qr.water.remaining}회`);
}

function renderWeather(weather) {
  setText("#weather-alert", weather.alert);
  setText("#work-index-value", weather.workIndexLabel);
  document.querySelector("#work-index-bar").style.width = `${percentValue(weather.workIndex)}%`;
  document.querySelector("#weather-metrics").innerHTML = weather.metrics
    .map(
      (metric) => `
        <article class="weather-metric ${classToken(metric.tone)}">
          <span aria-hidden="true">${escapeHtml(metric.icon)}</span>
          <div>
            <small>${escapeHtml(metric.label)}</small>
            <strong>${escapeHtml(metric.value)}</strong>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderProgress(progress) {
  setText("#team-name", progress.team);
  setText("#stage-title", progress.title);
  document.querySelector("#task-note").innerHTML = `
    <strong>${escapeHtml(progress.note.schedule)}</strong>
    <span>${escapeHtml(progress.note.task)}</span>
  `;
  document.querySelector("#delay-alert").innerHTML = `
    <strong>△ ${escapeHtml(progress.delay.title)}</strong>
    <p>${escapeHtml(progress.delay.body)}</p>
  `;
  setText("#stage-progress-value", `${progress.overall}%`);
  document.querySelector("#stage-progress-bar").style.width = `${percentValue(progress.overall)}%`;
  document.querySelector("#stage-breakdown").innerHTML = progress.parts
    .map(
      (part) => `
        <div>
          <strong>${escapeHtml(part.label)}</strong>
          <span>${escapeHtml(part.value)}%</span>
        </div>
      `,
    )
    .join("");
}

function renderTeamSchedule(teams) {
  document.querySelector("#team-schedule").innerHTML = teams
    .map((team) => {
      const delayed = team.changedTime
        ? `
          <div class="time-change">
            <div>
              <small>예정 시간</small>
              <strong>${escapeHtml(team.originalTime)}</strong>
            </div>
            <div>
              <small>변경 시간</small>
              <strong>${escapeHtml(team.changedTime)}</strong>
            </div>
          </div>
        `
        : `
          <div class="time-change">
            <div>
              <small>시작 시간</small>
              <strong>${escapeHtml(team.startTime)}</strong>
            </div>
            <div>
              <small>완료 예정</small>
              <strong>${escapeHtml(team.endTime)}</strong>
            </div>
          </div>
        `;
      const action = team.action ? `<button class="inline-action" type="button">${escapeHtml(team.action)}</button>` : "";

      return `
        <article class="team-card ${classToken(team.tone)}">
          <div class="team-card-title">
            <div>
              <h3>${escapeHtml(team.name)}</h3>
              <p>${escapeHtml(team.task)}</p>
            </div>
            <span>${escapeHtml(team.status)}</span>
          </div>
          ${delayed}
          <div class="progress-track" aria-hidden="true">
            <span style="width: ${percentValue(team.progress)}%"></span>
          </div>
          <div class="team-card-foot">
            <strong>진행률 ${escapeHtml(team.progress)}%</strong>
            ${action}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderSafety(data) {
  document.querySelector("#safety-notice").innerHTML = `
    <strong>▲ ${escapeHtml(data.safetyNotice.title)}</strong>
    <p>${escapeHtml(data.safetyNotice.body)}</p>
  `;
  document.querySelector("#safety-bullets").innerHTML = data.safetyBullets
    .map((rule) => `<li>${escapeHtml(rule)}</li>`)
    .join("");
  setText("#checklist-date", data.event.compactDate);
  document.querySelector("#safety-rule-list").innerHTML = data.safetyChecklist
    .map(
      (rule) => `
        <article>
          <span class="rule-icon" aria-hidden="true">${escapeHtml(rule.icon)}</span>
          <div>
            <strong>${escapeHtml(rule.title)}</strong>
            <p>${escapeHtml(rule.description)}</p>
          </div>
          <span class="check-box" aria-label="${rule.checked ? "완료" : "미완료"}"></span>
        </article>
      `,
    )
    .join("");
}

function renderEmergency(emergency) {
  const phone = emergency.phone || "010-0000-0000";

  document.querySelector("#manager-call").innerHTML = `
    <span class="profile-icon" aria-hidden="true">♙</span>
    <div>
      <strong>${escapeHtml(emergency.name)}</strong>
      <p>${escapeHtml(phone)}</p>
    </div>
    <a href="tel:${escapeHtml(phone)}" aria-label="${escapeHtml(emergency.name)}에게 전화">☎</a>
  `;
}

function renderProfile(data) {
  setText("#profile-name", data.user.name);
  setText("#profile-phone", data.user.phone || "010-0000-0000");
  setText("#profile-zone", data.user.zone);
  setText("#profile-period", data.user.period);
  document.querySelector("#event-link-list").innerHTML = data.eventLinks
    .map(
      (link) => `
        <button type="button">
          <span aria-hidden="true">${escapeHtml(link.icon)}</span>
          ${escapeHtml(link.label)}
          <strong aria-hidden="true">›</strong>
        </button>
      `,
    )
    .join("");
  document.querySelector("#document-status-list").innerHTML = data.documents
    .map(
      (doc) => `
        <article>
          <span aria-hidden="true">${escapeHtml(doc.icon)}</span>
          <strong>${escapeHtml(doc.label)}</strong>
          <em class="${classToken(doc.tone)}">${escapeHtml(doc.status)}</em>
        </article>
      `,
    )
    .join("");
}

function renderNotifications(notifications) {
  document.querySelector("#notification-list").innerHTML = notifications
    .map(
      (item) => `
        <article class="notification-item ${classToken(item.tone)}">
          <span aria-hidden="true">${escapeHtml(item.icon)}</span>
          <div>
            <div class="notification-head">
              <strong>${escapeHtml(item.title)}</strong>
              <time>${escapeHtml(item.time)}</time>
            </div>
            <p>${escapeHtml(item.body)}</p>
            ${item.priority ? `<em>${escapeHtml(item.priority)}</em>` : ""}
          </div>
        </article>
      `,
    )
    .join("");
}

function renderDashboard(data) {
  setText("#event-date", data.event.date);
  setText("#event-name", data.event.title);
  setText("#schedule-date", data.event.shortDate);
  document.querySelector("#schedule-alert").innerHTML = `
    <strong>▲ ${escapeHtml(data.scheduleAlert.title)}</strong>
    <p>${escapeHtml(data.scheduleAlert.body)}</p>
  `;

  renderDashboardRules(data.dashboardRules);
  renderQrSummary(data.qr);
  renderWeather(data.weather);
  renderProgress(data.progress);
  renderTeamSchedule(data.teams);
  renderSafety(data);
  renderEmergency(data.emergency);
  renderProfile(data);
  renderNotifications(data.notifications);
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

function renderQrModal(type, data) {
  const qr = data.qr[type];
  setText("#qr-modal-date", data.event.date);
  setText("#qr-modal-count", `${qr.label} 남은 횟수: ${qr.remaining}회`);
  setText("#qr-modal-help", qr.help);
  document.querySelector("#qr-code").innerHTML = buildQrCells(qrSeeds[type]);
  document.querySelectorAll(".qr-tab").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.qrType === type);
  });
}

function openModal(selector) {
  document.querySelector(selector).hidden = false;
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.hidden = true;
  if (!document.querySelector(".modal-backdrop:not([hidden])")) {
    document.body.classList.remove("modal-open");
  }
}

function setupInteractions(data) {
  document.querySelectorAll("[data-tab]").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  document.querySelectorAll("[data-tab-jump]").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tabJump));
  });

  document.querySelector("[data-qr-open]").addEventListener("click", () => {
    renderQrModal("meal", data);
    openModal("#qr-modal");
    document.querySelector("#qr-modal .modal-close").focus();
  });

  document.querySelectorAll(".qr-tab").forEach((button) => {
    button.addEventListener("click", () => renderQrModal(button.dataset.qrType, data));
  });

  document.querySelector(".header-alert-button").addEventListener("click", () => {
    openModal("#notification-modal");
    document.querySelector("#notification-modal .modal-close").focus();
  });

  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.querySelectorAll(".modal-close, .modal-action").forEach((button) => {
      button.addEventListener("click", () => closeModal(modal));
    });
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal-backdrop:not([hidden])").forEach(closeModal);
    }
  });

  document.querySelector("#logout-button").addEventListener("click", () => {
    window.sessionStorage.removeItem("safetyControlUser");
    window.location.href = "../login/";
  });
}

const data = getDashboardData();

renderDashboard(data);
setupInteractions(data);
setupPayrollDocumentAction(savedWorkerForGuard);
