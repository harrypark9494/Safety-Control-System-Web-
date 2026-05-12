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
  preview.innerHTML = "<span>선택된 파일 없음</span>";
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

const worker = getCurrentWorker();

if (!worker) {
  window.location.replace(loginPath);
} else if (!isPayrollDocumentRequired(worker)) {
  window.location.replace(dashboardPath);
} else {
  renderWorker(worker);
}

renderEmptyPreview(document.querySelector("#id-card-preview"));
renderEmptyPreview(document.querySelector("#bankbook-preview"));

document.querySelector("#id-card-file").addEventListener("change", (event) => {
  renderFilePreview(event.currentTarget, document.querySelector("#id-card-preview"));
});

document.querySelector("#bankbook-file").addEventListener("change", (event) => {
  renderFilePreview(event.currentTarget, document.querySelector("#bankbook-preview"));
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
