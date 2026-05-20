const navButtons = document.querySelectorAll("[data-view]");
const views = document.querySelectorAll(".admin-view");
const modal = document.querySelector("#admin-modal");

function setActiveView(viewName) {
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });

  views.forEach((view) => {
    view.classList.toggle("is-active", view.id === `view-${viewName}`);
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.view));
});

document.querySelectorAll("[data-modal-open]").forEach((button) => {
  button.addEventListener("click", () => {
    modal.hidden = false;
    document.body.classList.add("modal-open");
  });
});

document.querySelectorAll("[data-modal-close]").forEach((button) => {
  button.addEventListener("click", () => {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  });
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }
});
