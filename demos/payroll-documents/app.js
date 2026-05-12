const dashboardPath = "../dashboard/";
const loginPath = "../login/";
const form = document.querySelector("#documents-form");
const message = document.querySelector("#documents-message");

function setMessage(text, type = "info") {
  message.textContent = text;
  message.classList.toggle("error", type === "error");
}

function getCurrentWorker() {
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

function renderWorker(worker) {
  document.querySelector("#worker-name").textContent = worker.name || "-";
  document.querySelector("#worker-phone").textContent = worker.phone || "-";
  document.querySelector("#worker-team").textContent = worker.team || "-";
}

function getFileSummary(file) {
  return {
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
  };
}

const worker = getCurrentWorker();

if (!worker) {
  window.location.replace(loginPath);
} else if (!isPayrollDocumentRequired(worker)) {
  window.location.replace(dashboardPath);
} else {
  renderWorker(worker);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const idCardFile = document.querySelector("#id-card-file").files[0];
  const bankbookFile = document.querySelector("#bankbook-file").files[0];
  const agreed = document.querySelector("#privacy-agreement").checked;

  if (!idCardFile || !bankbookFile || !agreed) {
    setMessage("주민등록증 사본, 통장 사본, 수집 동의를 모두 완료하세요.", "error");
    return;
  }

  form.querySelector("button").disabled = true;
  setMessage("제출 정보를 저장하는 중입니다.");

  savePayrollDocumentSubmission(worker, {
    idCardFile: getFileSummary(idCardFile),
    bankbookFile: getFileSummary(bankbookFile),
    privacyAgreement: agreed,
  });
  markCurrentSessionPayrollSubmitted();

  setMessage("급여 서류 제출이 완료되었습니다. 대시보드로 이동합니다.");
  window.setTimeout(() => {
    window.location.href = dashboardPath;
  }, 650);
});
