const dashboardPath = "../dashboard/";
const loginPath = "../login/";
const form = document.querySelector("#documents-form");
const message = document.querySelector("#documents-message");
const workTypeSelect = document.querySelector("#work-type");
const residentNumberInput = document.querySelector("#resident-number");
const steps = {
  basic: document.querySelector("#basic-step"),
  document: document.querySelector("#document-step"),
};
const stepIndicators = {
  basic: document.querySelector("#basic-step-indicator"),
  document: document.querySelector("#document-step-indicator"),
};
const basicStepFields = [
  "#work-type",
  "#resident-number",
  "#postcode",
  "#address",
  "#privacy-agreement",
];

function setMessage(text, type = "info") {
  message.textContent = text;
  message.classList.toggle("error", type === "error");
}

function formatResidentNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 13);

  if (digits.length <= 6) {
    return digits;
  }

  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
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

function getDemoWorkerFromUrl() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("demo") !== "1") {
    return null;
  }

  return {
    ...SAFETY_CONTROL_AUTH_CONFIG.demoAccount,
    payrollDocumentsSubmitted: false,
  };
}

function saveWorkerSession(user) {
  window.sessionStorage.setItem("safetyControlUser", JSON.stringify(user));
}

function renderWorkTypeOptions(worker) {
  SAFETY_CONTROL_AUTH_CONFIG.workTypeOptions.forEach((workType) => {
    const option = document.createElement("option");
    option.value = workType;
    option.textContent = workType;
    workTypeSelect.append(option);
  });

  workTypeSelect.value = worker.workType || "";
}

function renderWorker(worker) {
  document.querySelector("#worker-greeting").textContent =
    `${worker.name || "작업자"}님, 안녕하세요.`;
  document.querySelector("#worker-phone").textContent = worker.phone || "-";
  document.querySelector("#worker-schedule").textContent =
    worker.schedule || "DB 근무 일정 연동 예정";
  renderWorkTypeOptions(worker);
}

function setStep(stepName) {
  const isDocumentStep = stepName === "document";

  steps.basic.hidden = isDocumentStep;
  steps.document.hidden = !isDocumentStep;
  steps.basic.classList.toggle("active", !isDocumentStep);
  steps.document.classList.toggle("active", isDocumentStep);
  stepIndicators.basic.classList.toggle("active", !isDocumentStep);
  stepIndicators.document.classList.toggle("active", isDocumentStep);
  stepIndicators.basic.toggleAttribute("aria-current", !isDocumentStep);
  stepIndicators.document.toggleAttribute("aria-current", isDocumentStep);
  setMessage("");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateBasicStep() {
  const invalidField = basicStepFields
    .map((selector) => document.querySelector(selector))
    .find((field) => !field.checkValidity());

  if (invalidField) {
    invalidField.reportValidity();
    setMessage("기본 정보 입력을 완료한 뒤 다음 단계로 이동하세요.", "error");
    return false;
  }

  return true;
}

function getFileSummary(file) {
  return {
    name: file.name,
    size: file.size,
    type: file.type || "unknown",
  };
}

function formatFileSize(size) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entities[char];
  });
}

function getFileExtension(fileName) {
  return fileName.split(".").pop()?.toUpperCase() || "FILE";
}

function isPreviewableImage(file) {
  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name)
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function renderEmptyPreview(preview) {
  preview.classList.add("empty");
  preview.innerHTML = `
    <span class="upload-icon" aria-hidden="true"></span>
    <strong>이미지를 눌러 업로드하세요.</strong>
    <small>이미지 또는 PDF</small>
  `;
}

function renderFileMeta(file, inputId, options = {}) {
  const safeFileName = escapeHtml(file.name);
  const safeFileType = escapeHtml(file.type || "파일 형식 알 수 없음");

  return `
    <div class="file-preview-body">
      <div>
        <strong>${safeFileName}</strong>
        <small>${safeFileType} · ${formatFileSize(file.size)}${options.note ? ` · ${options.note}` : ""}</small>
      </div>
      <button class="remove-file" type="button" data-file-input="${inputId}">파일 제거</button>
    </div>
  `;
}

function renderFileIconPreview(file, input, preview, label) {
  preview.classList.remove("empty");
  preview.innerHTML = `
    <span class="file-icon" aria-hidden="true">${label}</span>
    ${renderFileMeta(file, input.id)}
  `;
}

async function renderFilePreview(input, preview) {
  const file = input.files[0];

  if (!file) {
    renderEmptyPreview(preview);
    return;
  }

  if (!isPreviewableImage(file)) {
    renderFileIconPreview(file, input, preview, getFileExtension(file.name));
    return;
  }

  try {
    const imageUrl = await readFileAsDataUrl(file);
    const safeFileName = escapeHtml(file.name);
    preview.classList.remove("empty");
    preview.innerHTML = `
      <img src="${imageUrl}" alt="${safeFileName} 미리보기" />
      ${renderFileMeta(file, input.id)}
    `;

    preview.querySelector("img").addEventListener("error", () => {
      preview.innerHTML = `
        <span class="file-icon" aria-hidden="true">IMG</span>
        ${renderFileMeta(file, input.id, { note: "이 브라우저에서 미리보기를 표시할 수 없음" })}
      `;
    });
  } catch {
    renderFileIconPreview(file, input, preview, "IMG");
  }
}

function getFormPayload(idCardFile, bankbookFile) {
  const formData = new FormData(form);

  return {
    workType: formData.get("workType"),
    residentNumber: formData.get("residentNumber"),
    postcode: formData.get("postcode"),
    address: formData.get("address"),
    addressDetail: formData.get("addressDetail"),
    privacyAgreement: formData.get("privacyAgreement") === "on",
    bankName: formData.get("bankName"),
    accountHolder: formData.get("accountHolder"),
    accountNumber: formData.get("accountNumber"),
    idCardFile: getFileSummary(idCardFile),
    bankbookFile: getFileSummary(bankbookFile),
  };
}

const demoWorker = getDemoWorkerFromUrl();
const worker = demoWorker || getCurrentWorker();

if (demoWorker) {
  clearPayrollDocumentSubmission(worker);
  saveWorkerSession(worker);
}

if (!worker) {
  window.location.replace(loginPath);
} else if (!isPayrollDocumentRequired(worker)) {
  window.location.replace(dashboardPath);
} else {
  renderWorker(worker);
}

renderEmptyPreview(document.querySelector("#id-card-preview"));
renderEmptyPreview(document.querySelector("#bankbook-preview"));

residentNumberInput.addEventListener("input", () => {
  residentNumberInput.value = formatResidentNumber(residentNumberInput.value);
});

document.querySelector("#id-card-file").addEventListener("change", (event) => {
  renderFilePreview(event.currentTarget, document.querySelector("#id-card-preview"));
});

document.querySelector("#bankbook-file").addEventListener("change", (event) => {
  renderFilePreview(event.currentTarget, document.querySelector("#bankbook-preview"));
});

document.querySelector("#search-address").addEventListener("click", () => {
  if (!window.kakao?.Postcode) {
    document.querySelector("#postcode").value = "00000";
    document.querySelector("#address").value = "서울특별시 00구 00로 00";
    document.querySelector("#address-detail").focus();
    setMessage("우편번호 스크립트를 불러오지 못해 데모 주소를 입력했습니다.");
    return;
  }

  new window.kakao.Postcode({
    oncomplete(data) {
      const address = data.userSelectedType === "R"
        ? data.roadAddress
        : data.jibunAddress;

      document.querySelector("#postcode").value = data.zonecode;
      document.querySelector("#address").value = address;
      document.querySelector("#address-detail").focus();
      setMessage("우편번호 검색 결과를 입력했습니다.");
    },
  }).open();
});

document.querySelector("#next-step").addEventListener("click", () => {
  if (validateBasicStep()) {
    setStep("document");
  }
});

document.querySelector("#prev-step").addEventListener("click", () => {
  setStep("basic");
});

form.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-file");

  if (!removeButton) {
    return;
  }

  event.preventDefault();

  const input = document.querySelector(`#${removeButton.dataset.fileInput}`);
  const preview = input.id === "id-card-file"
    ? document.querySelector("#id-card-preview")
    : document.querySelector("#bankbook-preview");

  input.value = "";
  renderEmptyPreview(preview);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const idCardFile = document.querySelector("#id-card-file").files[0];
  const bankbookFile = document.querySelector("#bankbook-file").files[0];

  if (!validateBasicStep()) {
    setStep("basic");
    return;
  }

  if (!form.checkValidity() || !idCardFile || !bankbookFile) {
    form.reportValidity();
    setMessage("계좌 정보와 사본 이미지를 모두 완료하세요.", "error");
    return;
  }

  form.querySelector("button[type='submit']").disabled = true;
  setMessage("HR 제출 정보를 저장하는 중입니다.");

  savePayrollDocumentSubmission(worker, getFormPayload(idCardFile, bankbookFile));
  markCurrentSessionPayrollSubmitted();

  setMessage("급여 정보 등록이 완료되었습니다. 대시보드로 이동합니다.");
  window.setTimeout(() => {
    window.location.href = dashboardPath;
  }, 650);
});
