const navButtons = document.querySelectorAll("[data-view]");
const views = document.querySelectorAll(".admin-view");
const modal = document.querySelector("#admin-modal");
const modalOpenButtons = document.querySelectorAll("[data-modal-open]");
const modalCloseButtons = document.querySelectorAll("[data-modal-close]");
const accountForm = document.querySelector("#admin-account-form");
const adminTableBody = document.querySelector(".admin-table tbody");
const adminCount = document.querySelector("[data-admin-count]");
const passwordInput = accountForm?.querySelector('input[name="password"]');
const passwordToggle = accountForm?.querySelector("[data-password-toggle]");
const modalMessage = accountForm?.querySelector(".modal-message");
let lastFocusedElement = null;

function setActiveView(viewName) {
  navButtons.forEach((button) => {
    const isActive = button.dataset.view === viewName;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "page" : "false");
  });

  views.forEach((view) => {
    const isActive = view.id === `view-${viewName}`;

    view.classList.toggle("is-active", isActive);
    view.setAttribute("aria-hidden", String(!isActive));
  });
}

function resetModalState() {
  accountForm?.reset();

  if (passwordInput) {
    passwordInput.type = "password";
  }

  if (modalMessage) {
    modalMessage.textContent = "";
  }
}

function openModal(trigger) {
  lastFocusedElement = trigger;
  resetModalState();
  modal.hidden = false;
  document.body.classList.add("modal-open");
  accountForm?.querySelector("input")?.focus();
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  resetModalState();
  lastFocusedElement?.focus();
}

function getRoleClass(role) {
  if (role === "운영 권한" || role === "안전 조회") {
    return "blue";
  }

  if (role === "현장 조회") {
    return "gray";
  }

  return "";
}

function updateAdminCount() {
  if (!adminCount || !adminTableBody) {
    return;
  }

  adminCount.textContent = `총 ${adminTableBody.rows.length}명`;
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.view));
});

modalOpenButtons.forEach((button) => {
  button.addEventListener("click", () => openModal(button));
});

modalCloseButtons.forEach((button) => {
  button.addEventListener("click", closeModal);
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) {
    closeModal();
  }
});

passwordToggle?.addEventListener("click", () => {
  if (!passwordInput) {
    return;
  }

  const shouldShow = passwordInput.type === "password";

  passwordInput.type = shouldShow ? "text" : "password";
  passwordToggle.setAttribute("aria-label", shouldShow ? "비밀번호 숨기기" : "비밀번호 보기");
});

accountForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!accountForm.reportValidity() || !adminTableBody) {
    return;
  }

  const formData = new FormData(accountForm);
  const accountId = String(formData.get("accountId")).trim();
  const name = String(formData.get("name")).trim();
  const role = String(formData.get("role")).trim();
  const roleClass = getRoleClass(role);
  const today = new Date().toISOString().slice(0, 10);

  if (!accountId || !name) {
    if (modalMessage) {
      modalMessage.textContent = "이름과 아이디를 입력해주세요.";
    }

    return;
  }

  const isDuplicate = [...adminTableBody.querySelectorAll("strong")].some(
    (item) => item.textContent === accountId,
  );

  if (isDuplicate) {
    if (modalMessage) {
      modalMessage.textContent = "이미 등록된 아이디입니다.";
    }

    return;
  }

  const row = adminTableBody.insertRow();

  row.innerHTML = `
    <td>◎ <strong></strong></td>
    <td></td>
    <td>${today}</td>
    <td><em${roleClass ? ` class="${roleClass}"` : ""}></em></td>
    <td>✎ 🗑</td>
  `;
  row.querySelector("strong").textContent = accountId;
  row.cells[1].textContent = name;
  row.querySelector("em").textContent = role;
  updateAdminCount();

  if (modalMessage) {
    modalMessage.textContent = `${name} 계정이 목업 목록에 추가되었습니다.`;
  }
});

setActiveView("dashboard");
updateAdminCount();
