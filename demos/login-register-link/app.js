const authClient = createMockAuthClient();
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
const demoAccountSummary = document.querySelector("#demo-account-summary");
const dashboardPath = "../dashboard/";
const workerModes = {
  register: document.querySelector("#register-mode"),
  login: document.querySelector("#login-mode"),
};
const workerFlows = {
  register: workerRegisterForm,
  login: workerLoginForm,
};
const workerFooters = {
  register: document.querySelector("#register-footer"),
  login: document.querySelector("#login-footer"),
};

function setMessage(text, type = "info") {
  message.textContent = text;
  message.classList.toggle("error", type === "error");
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

  Object.entries(workerFooters).forEach(([name, footer]) => {
    footer.hidden = name !== modeName;
  });

  if (!options.keepMessage) {
    setMessage("");
  }
}

function fillApprovedWorkerLogin() {
  activateTab("user");
  activateWorkerMode("login", { keepMessage: true });
  document.querySelector("#login-name").value = approvedWorker.name;
  document.querySelector("#login-phone").value = approvedWorker.phone;
  document.querySelector("#login-code").value = approvedWorker.code;
  document.querySelector("#login-password").value = approvedWorker.password;
  setMessage("자동 승인 데모 계정이 입력되었습니다. 로그인하면 대시보드로 이동합니다.");
}

function saveWorkerSession(user) {
  window.sessionStorage.setItem("safetyControlUser", JSON.stringify(user));
}

function goToDashboard() {
  window.location.href = dashboardPath;
}

demoAccountSummary.textContent = `${approvedWorker.name} · ${approvedWorker.phone} · 코드 ${approvedWorker.code}`;

tabs.user.addEventListener("click", () => activateTab("user"));
tabs.admin.addEventListener("click", () => activateTab("admin"));
workerModes.register.addEventListener("click", () => activateWorkerMode("register"));
workerModes.login.addEventListener("click", () => activateWorkerMode("login"));
fillDemoWorkerButton.addEventListener("click", fillApprovedWorkerLogin);

requestCodeButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const phoneInput = document.querySelector(`#${button.dataset.phoneInput}`);
    const phone = phoneInput.value.trim();

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
    activateWorkerMode("login", { keepMessage: true });
    document.querySelector("#login-name").value = user.name;
    document.querySelector("#login-phone").value = user.phone;
    document.querySelector("#login-code").value = payload.code;
    document.querySelector("#login-password").value = payload.password;
    setMessage(`${user.name}님 등록이 승인되었습니다. 로그인하면 대시보드로 이동합니다.`);
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
    setMessage(`${user.name}님 로그인 완료. 대시보드로 이동합니다.`);
    window.setTimeout(goToDashboard, 450);
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
