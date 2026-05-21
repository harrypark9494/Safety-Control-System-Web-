const authClient = createAuthClient();
const demoWorkers = authClient.getDemoWorkerAccounts();
const approvedWorker = authClient.getApprovedWorkerAccount();

const tabs = {
  user: document.querySelector("#user-tab"),
  admin: document.querySelector("#admin-tab"),
};

const panels = {
  user: document.querySelector("#user-panel"),
  admin: document.querySelector("#admin-panel"),
};

const message = document.querySelector("#auth-message");
const workerRegisterForm = document.querySelector("#worker-register-form");
const workerLoginForm = document.querySelector("#worker-login-form");
const requestCodeButtons = document.querySelectorAll(".request-code");
const googleLoginButton = document.querySelector("#google-login");
const fillDemoWorkerButton = document.querySelector("#fill-demo-worker");
const demoAccountSelect = document.querySelector("#demo-account-select");
const demoAccountSummary = document.querySelector("#demo-account-summary");
const dashboardPath = "../dashboard/";
const payrollDocumentsPath = "../payroll-documents/";
const workerModes = {
  register: document.querySelector("#register-mode"),
  login: document.querySelector("#login-mode"),
};
const workerFlows = {
  register: workerRegisterForm,
  login: workerLoginForm,
};
const workTypeSelects = document.querySelectorAll('select[name="workType"]');
const phoneInputs = document.querySelectorAll('input[name="phone"]');

function setMessage(text, type = "info") {
  message.textContent = text;
  message.classList.toggle("error", type === "error");
}

function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  if (!digits.startsWith("010") && digits.length <= 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function activateTab(tabName) {
  Object.entries(tabs).forEach(([name, button]) => {
    const isActive = name === tabName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(panels).forEach(([name, panel]) => {
    const isActive = name === tabName;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });

  setMessage("");
}

function activateWorkerMode(modeName, options = {}) {
  Object.entries(workerModes).forEach(([name, button]) => {
    const isActive = name === modeName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(workerFlows).forEach(([name, form]) => {
    const isActive = name === modeName;
    form.classList.toggle("active", isActive);
    form.hidden = !isActive;
  });

  if (!options.keepMessage) {
    setMessage("");
  }
}

function getSelectedDemoWorker() {
  return demoWorkers.find((worker) => worker.phone === demoAccountSelect.value) || approvedWorker;
}

function renderDemoWorkerOptions() {
  demoWorkers.forEach((worker) => {
    const option = document.createElement("option");
    option.value = worker.phone;
    option.textContent = worker.label || `${worker.name} 계정`;
    demoAccountSelect.append(option);
  });

  demoAccountSelect.value = approvedWorker.phone;
}

function renderDemoAccountSummary(worker = getSelectedDemoWorker()) {
  demoAccountSummary.textContent = `${worker.name} · ${worker.phone} · ${worker.workType} · 코드 ${worker.code}`;
}

function fillApprovedWorkerLogin() {
  const worker = getSelectedDemoWorker();

  activateTab("user");
  activateWorkerMode("login", { keepMessage: true });
  document.querySelector("#login-name").value = worker.name;
  document.querySelector("#login-phone").value = worker.phone;
  document.querySelector("#login-work-type").value = worker.workType;
  document.querySelector("#login-code").value = worker.code;
  document.querySelector("#login-password").value = worker.password;
  setMessage(
    `${worker.label || worker.name}이 입력되었습니다. 직접 고용 계정만 급여 정보 등록으로 이동합니다.`,
  );
}

function saveWorkerSession(user) {
  window.sessionStorage.setItem("safetyControlUser", JSON.stringify(user));
}

function goToDashboard() {
  window.location.href = dashboardPath;
}

function goToNextPage(user) {
  if (isPayrollDocumentRequired(user)) {
    window.location.href = payrollDocumentsPath;
    return;
  }

  goToDashboard();
}

function renderWorkTypeOptions() {
  workTypeSelects.forEach((select) => {
    SAFETY_CONTROL_AUTH_CONFIG.workTypeOptions.forEach((workType) => {
      const option = document.createElement("option");
      option.value = workType;
      option.textContent = workType;
      select.append(option);
    });
  });
}

renderWorkTypeOptions();
renderDemoWorkerOptions();
document.querySelector("#register-work-type").value = approvedWorker.workType;

renderDemoAccountSummary();

phoneInputs.forEach((input) => {
  input.addEventListener("input", () => {
    input.value = formatPhoneNumber(input.value);
  });
});

tabs.user.addEventListener("click", () => activateTab("user"));
tabs.admin.addEventListener("click", () => activateTab("admin"));
workerModes.register.addEventListener("click", () => activateWorkerMode("register"));
workerModes.login.addEventListener("click", () => activateWorkerMode("login"));
fillDemoWorkerButton.addEventListener("click", fillApprovedWorkerLogin);
demoAccountSelect.addEventListener("change", () => renderDemoAccountSummary());

requestCodeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const phoneInput = document.querySelector(`#${button.dataset.phoneInput}`);
    const phone = phoneInput.value.trim();

    if (!phoneInput.reportValidity()) {
      return;
    }

    button.disabled = true;
    setMessage("인증 코드를 요청하는 중입니다.");

    try {
      const result = await authClient.requestWorkerCode({ phone });
      setMessage(`${result.maskedPhone} 연락처로 mock 인증 코드를 보냈습니다.`);
    } catch (error) {
      setMessage(error.message, "error");
    } finally {
      button.disabled = false;
    }
  });
});

workerRegisterForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(workerRegisterForm);
  const payload = Object.fromEntries(formData.entries());

  setMessage("DB 등록 여부와 인증 코드를 확인하는 중입니다.");

  try {
    const user = await authClient.registerWorker(payload);
    saveWorkerSession(user);
    setMessage(`${user.name}님 등록이 승인되었습니다. 다음 화면으로 이동합니다.`);
    window.setTimeout(() => goToNextPage(user), 450);
  } catch (error) {
    setMessage(error.message, "error");
  }
});

workerLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(workerLoginForm);
  const payload = Object.fromEntries(formData.entries());

  setMessage("일반 사용자 로그인을 확인하는 중입니다.");

  try {
    const user = await authClient.signInWorker(payload);
    saveWorkerSession(user);
    setMessage(`${user.name}님 로그인 완료. 다음 화면으로 이동합니다.`);
    window.setTimeout(() => goToNextPage(user), 450);
  } catch (error) {
    setMessage(error.message, "error");
  }
});

googleLoginButton.addEventListener("click", async () => {
  googleLoginButton.disabled = true;
  setMessage("Mock Google 로그인 흐름을 시작합니다.");

  try {
    const admin = await authClient.signInAdminWithGoogle();
    setMessage(`${admin.email} 관리자 계정으로 인증되었습니다.`);
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    googleLoginButton.disabled = false;
  }
});
