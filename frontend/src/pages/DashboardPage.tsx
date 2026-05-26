import { useEffect, useState } from "react";
import { MaterialIcon } from "../components/MaterialIcon";
import { clearSession, getSession, getWorkerQrEntitlements, requiresPayrollDocuments } from "../features/auth/session";
import { getSecureEntryPath, navigateTo } from "../features/navigation";
import type { QrEntitlement } from "../types";

type Tab = "dashboard" | "schedule" | "safety" | "profile";
type IconName =
  | "alert"
  | "bell"
  | "calendar"
  | "check"
  | "grid"
  | "history"
  | "id"
  | "map"
  | "phone"
  | "rain"
  | "shield"
  | "thermo"
  | "user"
  | "users"
  | "wallet"
  | "wind"
  | "x";

const dashboardStyles = `
:root {
  color-scheme: light;
  --ink: #172233;
  --muted: #6b7280;
  --line: #d9dde3;
  --panel: #ffffff;
  --field: #f5f1f3;
  --navy: #061527;
  --green: #009444;
  --orange: #ff8a1c;
  --red: #e60012;
  font-family: Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "Segoe UI", Arial, sans-serif;
}

* { box-sizing: border-box; }
body { min-height: 100vh; margin: 0; color: var(--ink); background: #f6f8fa; }
button { border: 0; cursor: pointer; font: inherit; }
h1, h2, h3, p, ul, dl, dd { margin: 0; }

.app-shell {
  width: min(100%, 480px);
  min-height: 100vh;
  margin: 0 auto;
  padding: 72px 0 92px;
  background: #fff9fb;
}

.app-header, .bottom-tabs {
  position: fixed;
  left: 50%;
  width: min(100%, 480px);
  transform: translateX(-50%);
  z-index: 6;
  background: rgba(255, 249, 251, 0.98);
}

.app-header {
  top: 0;
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  min-height: 72px;
  align-items: center;
  border-bottom: 1px solid var(--line);
}

.app-header h1 {
  grid-column: 2;
  text-align: center;
  font-size: 1.18rem;
  font-weight: 900;
  letter-spacing: 0;
}

.icon-button {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  color: var(--navy);
  background: transparent;
}

.header-alert-button { grid-column: 3; }
.tab-panels { min-height: calc(100vh - 164px); }
.tab-panel { display: grid; gap: 12px; padding: 16px 22px 24px; }

.app-card {
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--panel);
  box-shadow: 0 1px 3px rgba(16, 24, 39, 0.08);
}

.date-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  color: #3b414c;
  font-weight: 900;
}

.date-card span { text-align: right; }
.rules-card, .weather-card, .progress-card, .emergency-card, .profile-card, .profile-list-card { padding: 18px 16px; }
.section-title-row, .progress-label, .tab-heading, .modal-title-row, .notification-head, .team-card-title, .team-card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title-row h2, .tab-heading h2, .safety-section h2, .profile-list-card h2, .notification-modal h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  font-weight: 900;
}

.svg-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  font-size: 24px;
  overflow: hidden;
  stroke: currentColor;
  stroke-width: 2.3;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.status-pill, .emergency-badge {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 0 13px;
  font-size: 0.78rem;
  font-weight: 900;
  white-space: nowrap;
}

.status-good { color: #fff; background: var(--green); }
.status-warning { color: #573500; background: #ffddb0; }
.status-danger { color: #fff; background: var(--red); }

.mini-rule-list { display: grid; gap: 10px; margin-top: 16px; }
.mini-rule-list article {
  display: grid;
  grid-template-columns: 34px 1fr 28px;
  align-items: center;
  gap: 12px;
  min-height: 62px;
  padding: 0 14px;
  border: 1px solid var(--line);
  border-radius: 2px;
}

.mini-rule-list .rule-state {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: var(--green);
}

.mini-rule-list .rule-state.needs-check { color: var(--red); background: #fff; border: 3px solid #ff5a67; }
.outline-action {
  width: 100%;
  min-height: 56px;
  margin-top: 18px;
  border: 2px solid #6d7682;
  color: #333943;
  background: #fff;
  font-weight: 900;
}

.qr-summary { padding: 0; overflow: hidden; }
.qr-summary-button {
  display: grid;
  grid-template-columns: 64px 1fr;
  width: 100%;
  min-height: 110px;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  color: var(--ink);
  background: #fff;
  text-align: left;
}

.qr-summary-button.is-locked {
  position: relative;
}

.qr-summary-button.is-locked::after {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.42);
  font-weight: 900;
  content: "안전 수칙을 확인하세요";
}

.qr-icon-box {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 2px;
  color: #fff;
  background: var(--navy);
}

.qr-summary strong, .qr-summary small { display: block; }
.qr-summary strong { margin-bottom: 8px; font-size: 1rem; }
.qr-summary small { color: #333943; font-weight: 800; line-height: 1.45; }

.weather-alert {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #ffc8c8;
  border-radius: 4px;
  color: var(--red);
  background: #fff1f1;
  font-weight: 900;
  line-height: 1.5;
}

.work-index {
  margin-top: 16px;
  padding: 18px 16px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: #f4f0f2;
}

.progress-label { margin-bottom: 10px; color: var(--muted); font-weight: 800; }
.progress-label strong { color: #ef3f4f; }
.progress-track { overflow: hidden; height: 9px; border-radius: 999px; background: #d9dce2; }
.progress-track span { display: block; height: 100%; border-radius: inherit; background: var(--navy); }
.progress-track--danger span { background: var(--red); }

.weather-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.weather-metric {
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  min-height: 76px;
  gap: 8px;
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 3px;
  background: #f4f0f2;
}

.weather-metric small { color: var(--muted); font-weight: 800; }
.weather-metric strong { display: block; margin-top: 2px; font-size: 1.08rem; font-weight: 900; }
.metric-red { color: var(--red); border-color: #ffb4b4; }
.metric-green { color: var(--green); }
.metric-orange { color: var(--orange); }

.team-kicker { margin-bottom: 4px; font-size: 0.82rem; font-weight: 900; }
.task-note {
  display: grid;
  gap: 6px;
  margin-top: 16px;
  padding: 16px;
  border-left: 4px solid var(--navy);
  background: #f3eef0;
  line-height: 1.45;
}

.task-note strong, .task-note span { font-weight: 800; }
.delay-alert {
  display: grid;
  grid-template-columns: 38px 1fr;
  gap: 10px;
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #ffb6b6;
  border-radius: 4px;
  color: var(--red);
  background: #ffd6d3;
  font-weight: 800;
  line-height: 1.55;
}

.delay-alert strong { display: block; margin-bottom: 4px; }
.progress-card .progress-label { margin-top: 26px; }
.stage-breakdown { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 26px; }
.stage-breakdown div {
  display: grid;
  min-height: 48px;
  place-items: center;
  gap: 2px;
  border-right: 1px solid var(--line);
  text-align: center;
}

.stage-breakdown div:last-child { border-right: 0; }
.stage-breakdown strong { color: var(--muted); font-size: 0.82rem; }
.stage-breakdown span { font-weight: 900; }

.schedule-alert {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  margin: -16px -22px 8px;
  padding: 16px 22px;
  color: #fff;
  background: #f07c85;
  line-height: 1.45;
}

.schedule-alert strong { font-size: 1rem; font-weight: 900; }
.schedule-alert p { font-size: 0.84rem; font-weight: 800; }
.tab-heading { margin: 6px 0 4px; }
.tab-heading span { color: #4f5663; font-size: 0.88rem; font-weight: 800; }
.segmented-control { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding: 6px; background: #f3eef1; }
.segment-button { min-height: 48px; border-radius: 5px; color: #4f5663; background: transparent; font-weight: 900; }
.segment-button.is-active { color: #fff; background: var(--navy); }
.team-schedule { display: grid; gap: 14px; }

.team-card { padding: 18px; border-radius: 8px; }
.team-card.danger { border-color: #ffc9c9; }
.team-card-title h3 {
  position: relative;
  margin-bottom: 4px;
  padding-left: 16px;
  font-size: 1.18rem;
  font-weight: 900;
}

.team-card-title h3::before {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 0;
  width: 7px;
  border-radius: 999px;
  background: var(--red);
  content: "";
}

.team-card.warning .team-card-title h3::before { background: #ebc997; }
.team-card.muted .team-card-title h3::before { background: #d6d8de; }
.team-card-title p { color: #3b414c; font-size: 0.86rem; font-weight: 800; }
.team-card-title span { border-radius: 999px; padding: 7px 14px; color: var(--red); background: #ffe1e1; font-size: 0.78rem; font-weight: 900; }
.team-card.warning .team-card-title span { color: #6b4400; background: #ffe2aa; }
.team-card.muted .team-card-title span { color: #686f79; background: #efedf0; }
.time-change { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 18px 0 12px; padding: 14px; border: 1px solid var(--line); border-radius: 4px; background: var(--field); }
.time-change small, .team-card-foot { color: var(--muted); font-size: 0.84rem; font-weight: 800; }
.time-change strong { display: block; margin-top: 4px; font-size: 1.28rem; font-weight: 900; }
.team-card.danger .time-change div:first-child strong { color: #6f7480; text-decoration: line-through; }
.team-card.danger .time-change div:last-child, .team-card.danger .time-change div:last-child strong { color: var(--red); }
.team-card-foot { margin-top: 12px; }
.inline-action { display: inline-flex; align-items: center; gap: 6px; color: #344052; background: transparent; font-weight: 800; }
.team-card.danger .progress-track span { background: var(--red); }
.team-card.warning .progress-track span { background: var(--navy); }
.team-card.muted .progress-track span { background: #c7cbd3; }

.safety-section { display: grid; gap: 14px; }
.safety-notice { padding: 18px; border-color: #ffcaca; color: var(--red); background: #fff7f7; line-height: 1.55; }
.safety-notice strong { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-size: 1.05rem; font-weight: 900; }
.safety-notice p, .safety-bullets { color: #333943; font-weight: 800; }
.safety-bullets { display: grid; gap: 14px; padding-left: 20px; line-height: 1.55; }
.safety-rule-list { display: grid; gap: 12px; }
.safety-rule-list article { display: grid; grid-template-columns: 52px 1fr 30px; align-items: center; gap: 14px; min-height: 86px; padding: 14px; border: 1px solid var(--line); border-radius: 4px; background: #fff; }
.rule-icon, .profile-icon { display: grid; width: 52px; height: 52px; place-items: center; color: #fff; background: #182436; }
.safety-rule-list strong { display: block; margin-bottom: 5px; font-size: 1rem; }
.safety-rule-list p { color: #4a5260; font-size: 0.84rem; font-weight: 700; }
.check-box { width: 26px; height: 26px; border: 3px solid #c8cdd5; border-radius: 3px; }
.emergency-card { background: #f4eff1; }
.emergency-badge { color: #fff; background: var(--red); }
.manager-call { display: grid; grid-template-columns: 52px 1fr 62px; align-items: center; gap: 14px; margin-top: 18px; padding: 14px; border: 1px solid var(--line); background: #fff; }
.manager-call .profile-icon { border-radius: 50%; color: var(--ink); background: #ebe9eb; }
.manager-call strong { display: block; margin-bottom: 4px; }
.manager-call p { font-weight: 800; }
.manager-call a { display: grid; height: 62px; place-items: center; border-radius: 4px; color: #fff; background: var(--navy); text-decoration: none; }
.emergency-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.emergency-actions button { display: grid; min-height: 74px; place-items: center; gap: 5px; border: 1px solid var(--line); border-radius: 2px; color: var(--ink); background: #fff; font-weight: 800; }

.profile-card { display: grid; gap: 18px; }
.profile-main { display: grid; grid-template-columns: 70px 1fr; align-items: center; gap: 16px; }
.profile-avatar { display: grid; width: 70px; height: 70px; place-items: center; border-radius: 12px; color: var(--navy); background: #ede8eb; }
.profile-main strong, .profile-main span { display: block; }
.profile-main strong { margin-bottom: 6px; font-size: 1.4rem; font-weight: 900; }
.profile-main span { font-size: 1.08rem; font-weight: 800; }
.profile-meta { display: grid; grid-template-columns: 0.7fr 1.3fr; gap: 12px; padding-top: 14px; border-top: 1px solid var(--line); }
.profile-meta dt { color: var(--muted); font-size: 0.82rem; font-weight: 800; }
.profile-meta dd { margin-top: 4px; font-weight: 900; }
.profile-list-card { display: grid; gap: 16px; }
.profile-link-list, .document-status-list { display: grid; }
.profile-link-list button, .settings-link { display: grid; grid-template-columns: 34px 1fr 24px; align-items: center; min-height: 58px; gap: 10px; border-top: 1px solid var(--line); color: #333943; background: #fff; text-align: left; font-weight: 800; }
.profile-link-list button:first-child { border-top: 0; }
.document-status-list { gap: 10px; }
.document-status-list article { display: grid; grid-template-columns: 34px minmax(0, 1fr) max-content; align-items: center; min-height: 54px; gap: 10px; border: 1px solid var(--line); border-radius: 4px; padding: 0 10px; background: #f7f4f6; color: #333943; font-weight: 800; }
.document-status-list em { justify-self: end; white-space: nowrap; border-radius: 2px; padding: 4px 8px; font-style: normal; font-size: 0.78rem; font-weight: 900; }
.document-status-list em.danger { color: var(--red); background: #ffe1e1; }
.document-status-list em.info { color: var(--navy); background: #e6f2ff; }
.settings-link { min-height: 64px; padding: 0 16px; border: 1px solid var(--line); border-radius: 4px; font-size: 1rem; }
.logout-button { width: 100%; min-height: 62px; border: 1px solid #ff6f6f; border-radius: 4px; color: var(--red); background: #fff; font-size: 1.05rem; font-weight: 900; }

.bottom-tabs { bottom: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); min-height: 86px; border-top: 1px solid var(--line); box-shadow: 0 -10px 26px rgba(16, 24, 39, 0.08); }
.tab-button { display: grid; place-items: center; align-content: center; gap: 4px; color: #6f7480; background: transparent; font-size: 0.76rem; font-weight: 900; line-height: 1; }
.tab-button .tab-icon { display: grid; width: 48px; height: 42px; place-items: center; border-radius: 10px; }
.tab-button.is-active { color: var(--navy); }
.tab-button.is-active .tab-icon { color: #fff; background: var(--navy); }

.modal-backdrop { position: fixed; inset: 0; display: grid; place-items: center; padding: 22px; background: rgba(0, 0, 0, 0.45); z-index: 10; }
.qr-modal, .notification-modal { position: relative; width: min(100%, 420px); background: #fff; box-shadow: 0 22px 70px rgba(6, 21, 39, 0.32); }
.qr-modal { padding: 26px 28px 28px; border-radius: 8px; text-align: center; }
.modal-close { color: #2f3540; background: transparent; }
.qr-modal > .modal-close { position: absolute; top: 14px; right: 16px; }
.qr-modal > p:first-of-type { color: #555d6a; font-size: 0.86rem; font-weight: 800; }
.qr-modal h2 { margin: 6px 0 16px; font-size: 1.55rem; font-weight: 900; }
.qr-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); width: min(100%, 230px); margin: 0 auto 26px; padding: 4px; border-radius: 4px; background: #f2edf0; }
.qr-tab { min-height: 34px; border-radius: 4px; color: #5f6672; background: transparent; font-size: 0.82rem; font-weight: 900; }
.qr-tab.is-active { color: #fff; background: var(--navy); }
.qr-frame { display: grid; width: min(100%, 312px); aspect-ratio: 1; margin: 0 auto; padding: 50px; border: 1px solid var(--line); border-radius: 4px; background: #fff; box-shadow: inset 0 0 34px rgba(16, 24, 39, 0.08); }
.qr-fake { display: grid; grid-template-columns: repeat(13, 1fr); gap: 2px; padding: 8px; border: 4px solid #888; border-radius: 20px; background: #fff; }
.qr-fake span { aspect-ratio: 1; background: #111; }
.qr-fake span:nth-child(3n) { background: transparent; }
.qr-fake span:nth-child(5n) { background: #111; }
.qr-count { display: block; margin-top: 24px; }
.qr-help { margin: 20px 0 24px; color: var(--muted); font-size: 0.86rem; font-weight: 700; }
.modal-action { width: 100%; min-height: 54px; border-radius: 4px; color: #fff; background: var(--navy); font-weight: 900; }
.modal-backdrop--sheet { align-items: end; padding: 0; }
.notification-modal { display: grid; max-height: calc(100vh - 80px); border-radius: 8px 8px 0 0; overflow: hidden; }
.modal-title-row { min-height: 76px; padding: 0 18px; border-bottom: 1px solid var(--line); }
.notification-list { display: grid; gap: 12px; overflow: auto; padding: 18px; }
.notification-item { display: grid; grid-template-columns: 44px 1fr; gap: 12px; padding: 16px; border: 1px solid var(--line); background: #fff; }
.notification-item > span { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 4px; background: #f0eef1; }
.notification-item.danger > span { color: var(--red); background: #ffe1e1; }
.notification-item.info > span { color: #2c5d8f; background: #e6f2ff; }
.notification-head time { color: var(--muted); font-size: 0.78rem; font-weight: 800; }
.notification-item p { margin-top: 8px; color: #4f5663; line-height: 1.55; font-size: 0.9rem; font-weight: 700; }
.notification-item em { display: inline-flex; margin-top: 10px; padding: 4px 8px; color: #fff; background: var(--red); font-style: normal; font-size: 0.72rem; font-weight: 900; }
.notification-modal > .modal-action { width: calc(100% - 36px); margin: 0 18px 18px; }

@media (max-width: 380px) {
  .tab-panel { padding-right: 14px; padding-left: 14px; }
  .weather-metrics, .emergency-actions { grid-template-columns: 1fr; }
  .qr-frame { padding: 38px; }
}
`;

const weatherMetrics = [
  { icon: "wind" as const, label: "풍속", value: "7.8 m/s", tone: "red" },
  { icon: "rain" as const, label: "강수 확률", value: "0%", tone: "green" },
  { icon: "thermo" as const, label: "체감 온도", value: "34.5°C", tone: "orange" },
  { icon: "alert" as const, label: "습도", value: "65%", tone: "orange" },
];

const safetyPassed = true;

export function DashboardPage() {
  const session = getSession();
  const worker = session?.role === "worker" ? session : null;
  const [tab, setTab] = useState<Tab>("dashboard");
  const [qrOpen, setQrOpen] = useState(false);
  const [qrEntitlements, setQrEntitlements] = useState<QrEntitlement[]>([]);
  const [qrMessage, setQrMessage] = useState("");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const shouldRedirectToPayroll = requiresPayrollDocuments(session);

  useEffect(() => {
    if (shouldRedirectToPayroll) {
    navigateTo(getSecureEntryPath());
    }
  }, [shouldRedirectToPayroll]);

  useEffect(() => {
    if (!worker) {
      return;
    }

    getWorkerQrEntitlements(worker.uid)
      .then((entitlements) => {
        setQrEntitlements(entitlements);
        setQrMessage("");
      })
      .catch((error: unknown) => {
        setQrMessage(error instanceof Error ? error.message : "QR 지급 정보를 불러오지 못했습니다.");
      });
  }, [worker?.uid]);

  if (shouldRedirectToPayroll) return null;

  function logout() {
    clearSession();
    navigateTo("/login/");
  }

  return (
    <>
      <style>{dashboardStyles}</style>
      <main className="app-shell">
        <header className="app-header">
          <h1>워터밤 안전 관제 시스템</h1>
          <button className="icon-button header-alert-button" type="button" aria-label="알림 내역 열기" onClick={() => setNoticeOpen(true)}>
            <Icon name="bell" />
          </button>
        </header>

        <div className="tab-panels">
          {tab === "dashboard" ? <DashboardTab setTab={setTab} openQr={() => setQrOpen(true)} qrEntitlements={qrEntitlements} qrMessage={qrMessage} /> : null}
          {tab === "schedule" ? <ScheduleTab /> : null}
          {tab === "safety" ? <SafetyTab /> : null}
          {tab === "profile" ? <ProfileTab worker={worker} logout={logout} /> : null}
        </div>

        <BottomTabs tab={tab} setTab={setTab} />
      </main>

      {qrOpen ? <QrModal entitlements={qrEntitlements} close={() => setQrOpen(false)} /> : null}
      {noticeOpen ? <NotificationModal close={() => setNoticeOpen(false)} /> : null}
    </>
  );
}

function DashboardTab({
  setTab,
  openQr,
  qrEntitlements,
  qrMessage,
}: {
  setTab: (tab: Tab) => void;
  openQr: () => void;
  qrEntitlements: QrEntitlement[];
  qrMessage: string;
}) {
  const meal = findQrEntitlement(qrEntitlements, "meal");
  const water = findQrEntitlement(qrEntitlements, "water");

  return (
    <section className="tab-panel">
      <section className="app-card date-card" aria-label="오늘 행사 정보">
        <strong>2026년 7월 23일 (목)</strong>
        <span>워터밤 서울 D-1</span>
      </section>

      <section className="app-card rules-card">
        <div className="section-title-row">
          <h2><Icon name="shield" />안전 수칙</h2>
          <span className={`status-pill ${safetyPassed ? "status-good" : "status-danger"}`}>{safetyPassed ? "양호" : "확인 필요"}</span>
        </div>
        <div className="mini-rule-list">
          {[
            ["id", "안전고리 점검"],
            ["users", "안전모 착용"],
          ].map(([icon, title]) => (
            <article key={title}>
              <Icon name={icon as IconName} />
              <strong>{title}</strong>
              <span className="rule-state"><Icon name="check" /></span>
            </article>
          ))}
        </div>
        <button className="outline-action" type="button" onClick={() => setTab("safety")}>전체 안전 수칙 확인하기</button>
      </section>

      <section className="app-card qr-summary">
        <button className={`qr-summary-button ${safetyPassed ? "" : "is-locked"}`} type="button" onClick={openQr}>
          <span className="qr-icon-box" aria-hidden="true"><Icon name="grid" /></span>
          <span>
            <strong>통합 QR 시스템</strong>
            <small>
              {qrMessage || (
                <>식권 남은 횟수: <b>{meal.remainingCount}회</b>&nbsp;&nbsp;생수 남은 횟수: <b>{water.remainingCount}회</b></>
              )}
            </small>
          </span>
        </button>
      </section>

      <section className="app-card weather-card">
        <div className="section-title-row">
          <h2>날씨 현황 및 작업 지침</h2>
          <span className="status-pill status-warning"><Icon name="alert" />주의</span>
        </div>
        <p className="weather-alert">자외선/풍속 주의: 15시 이후 실외 작업 중단 권고</p>
        <div className="work-index">
          <div className="progress-label">
            <span>작업 가능 지수</span>
            <strong>45% (제한적 가능)</strong>
          </div>
          <div className="progress-track progress-track--danger" aria-hidden="true"><span style={{ width: "45%" }} /></div>
        </div>
        <div className="weather-metrics">
          {weatherMetrics.map((metric) => (
            <article className={`weather-metric metric-${metric.tone}`} key={metric.label}>
              <Icon name={metric.icon} />
              <div>
                <small>{metric.label}</small>
                <strong>{metric.value}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="app-card progress-card">
        <div className="team-kicker">내 팀: [리깅 A팀]</div>
        <div className="section-title-row">
          <h2>무대 설치 현황</h2>
          <span className="status-pill status-good">정상 진행</span>
        </div>
        <div className="task-note">
          <strong>오늘 일정: 08:00 - 12:00</strong>
          <span>주요 업무: 메인 트러스 인양 완료</span>
        </div>
        <div className="delay-alert">
          <Icon name="alert" />
          <div>
            <strong>[지연 알림]</strong>
            <p>[음향팀] 세팅 지연으로 인해 [리깅 A팀] 작업 가능 시간이 <b>14:00</b>로 변경되었습니다.</p>
          </div>
        </div>
        <div className="progress-label">
          <span>전체 공정률</span>
          <strong style={{ color: "var(--ink)" }}>75%</strong>
        </div>
        <div className="progress-track" aria-hidden="true"><span style={{ width: "75%" }} /></div>
        <div className="stage-breakdown">
          <div><strong>리깅</strong><span>100%</span></div>
          <div><strong>AV 연결</strong><span>80%</span></div>
          <div><strong>조명</strong><span>45%</span></div>
        </div>
      </section>
    </section>
  );
}

function ScheduleTab() {
  const cards = [
    { tone: "danger", team: "리깅 A팀", task: "메인 무대 상부 트러스 리프팅", firstLabel: "예정 시간", first: "11:00", secondLabel: "변경 시간", second: "14:00", progress: "15%", state: "지연" },
    { tone: "warning", team: "음향팀", task: "메인 L/R 스피커 어레이 세팅", firstLabel: "시작 시간", first: "09:00", secondLabel: "완료 예정", second: "13:30", progress: "65%", state: "진행중" },
    { tone: "muted", team: "조명팀", task: "스테이지 전면 무빙라이트 배선", firstLabel: "시작 예정", first: "15:00", secondLabel: "완료 예정", second: "18:00", progress: "0%", state: "대기중" },
  ];

  return (
    <section className="tab-panel">
      <section className="schedule-alert">
        <Icon name="alert" />
        <div>
          <strong>공정 지연 경고</strong>
          <p>[음향팀] 메인 스피커 세팅 지연으로 인해 [리깅 A팀]의 후속 작업 가능 시간이 14:00로 변경되었습니다.</p>
        </div>
      </section>
      <section className="tab-heading">
        <h2>스케줄</h2>
        <span>2026년 7월 23일</span>
      </section>
      <div className="segmented-control" role="tablist" aria-label="스케줄 범위">
        <button className="segment-button" type="button">전체 팀</button>
        <button className="segment-button is-active" type="button">내 팀</button>
      </div>
      <div className="team-schedule">
        {cards.map((card) => (
          <article className={`app-card team-card ${card.tone}`} key={card.team}>
            <div className="team-card-title">
              <div>
                <h3>{card.team}</h3>
                <p>{card.task}</p>
              </div>
              <span>{card.state}</span>
            </div>
            <div className="time-change">
              <div><small>{card.firstLabel}</small><strong>{card.first}</strong></div>
              <div><small>{card.secondLabel}</small><strong>{card.second}</strong></div>
            </div>
            <div className="progress-track" aria-hidden="true"><span style={{ width: card.progress }} /></div>
            <div className="team-card-foot">
              <span>진행률 {card.progress}</span>
              {card.tone === "danger" ? <button className="inline-action" type="button"><Icon name="history" />변경 이력 보기</button> : card.tone === "warning" ? <button className="inline-action" type="button"><Icon name="alert" />상세 정보</button> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SafetyTab() {
  return (
    <section className="tab-panel">
      <section className="safety-section">
        <h2>필수 안전 수칙</h2>
        <div className="app-card safety-notice">
          <strong><Icon name="alert" />폭염 경보 발령</strong>
          <p>날씨가 매우 덥습니다. 작업 중 충분한 수분 섭취와 규칙적인 휴식을 반드시 지켜주시기 바랍니다.</p>
        </div>
        <ul className="safety-bullets">
          <li>현장 내 금연 및 화기 사용 엄금</li>
          <li>작업 전 개인 보호구 착용 상태 상호 점검</li>
          <li>음주 후 작업 현장 출입 절대 불가</li>
          <li>비상 탈출구 및 소화기 위치 사전 숙지</li>
        </ul>
      </section>

      <section className="safety-section">
        <div className="section-title-row">
          <h2>근로자 일일 체크리스트</h2>
          <span>2026.07.23 (목)</span>
        </div>
        <div className="safety-rule-list">
          {[
            ["users", "안전모 착용", "턱끈 체결 및 파손 여부 확인"],
            ["id", "안전 고리 체결", "고소 작업 시 이중 잠금 확인"],
            ["alert", "전기 설비 점검", "누전 차단기 및 전선 노출 확인"],
          ].map(([icon, title, text]) => (
            <article key={title}>
              <span className="rule-icon"><Icon name={icon as IconName} /></span>
              <div><strong>{title}</strong><p>{text}</p></div>
              <span className="check-box" />
            </article>
          ))}
        </div>
      </section>

      <section className="app-card emergency-card">
        <div className="section-title-row">
          <h2>현장 비상 연락망</h2>
          <strong className="emergency-badge">EMERGENCY</strong>
        </div>
        <div className="manager-call">
          <span className="profile-icon"><Icon name="user" /></span>
          <div><strong>현장 매니저</strong><p>010-0000-0000</p></div>
          <a href="tel:01000000000" aria-label="현장 매니저에게 전화"><Icon name="phone" /></a>
        </div>
        <div className="emergency-actions">
          <button type="button"><Icon name="alert" />의료팀 본부</button>
          <button type="button"><Icon name="alert" />소방 관계실</button>
        </div>
      </section>
    </section>
  );
}

function ProfileTab({ worker, logout }: { worker: ReturnType<typeof getSession>; logout: () => void }) {
  const name = worker?.role === "worker" ? worker.name : "현장 매니저";
  const phone = worker?.role === "worker" ? worker.phone : "010-0000-0000";
  const team = worker?.role === "worker" ? worker.team : "인프라팀";

  return (
    <section className="tab-panel">
      <section className="app-card profile-card">
        <div className="profile-main">
          <span className="profile-avatar"><Icon name="user" /></span>
          <div>
            <strong>{name}</strong>
            <span>{phone}</span>
          </div>
        </div>
        <dl className="profile-meta">
          <div><dt>소속 팀</dt><dd>{team}</dd></div>
          <div><dt>근무 기간</dt><dd>2026.07.20 - 2026.07.27</dd></div>
        </dl>
      </section>

      <section className="app-card profile-list-card">
        <h2>행사 정보</h2>
        <div className="profile-link-list">
          <button type="button"><Icon name="map" />행사 맵 (Map)<MaterialIcon name="chevron_right" /></button>
          <button type="button"><Icon name="calendar" />타임테이블 (Timetable)<MaterialIcon name="chevron_right" /></button>
          <button type="button"><Icon name="id" />관객 FAQ<MaterialIcon name="chevron_right" /></button>
        </div>
      </section>

      <section className="app-card profile-list-card">
        <h2>근로자 서류 제출 현황</h2>
        <div className="document-status-list">
          <article><Icon name="id" /><strong>신분증 (ID Card)</strong><em className="danger">미제출</em></article>
          <article><Icon name="wallet" /><strong>통장 사본 (Bankbook Copy)</strong><em className="info">제출 완료</em></article>
        </div>
      </section>

      <button className="settings-link" type="button"><Icon name="bell" />알림 설정<MaterialIcon name="chevron_right" /></button>
      <button className="logout-button" type="button" onClick={logout}>로그아웃</button>
    </section>
  );
}

function BottomTabs({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const items: Array<[Tab, IconName, string]> = [
    ["dashboard", "grid", "대시보드"],
    ["schedule", "calendar", "스케줄"],
    ["safety", "shield", "안전"],
    ["profile", "user", "프로필"],
  ];

  return (
    <nav className="bottom-tabs" aria-label="대시보드 메뉴">
      {items.map(([id, icon, label]) => (
        <button className={`tab-button ${tab === id ? "is-active" : ""}`} type="button" key={id} onClick={() => setTab(id)}>
          <span className="tab-icon"><Icon name={icon} /></span>
          {label}
        </button>
      ))}
    </nav>
  );
}

function QrModal({ entitlements, close }: { entitlements: QrEntitlement[]; close: () => void }) {
  const [activeType, setActiveType] = useState<"meal" | "water">("meal");
  const entitlement = findQrEntitlement(entitlements, activeType);

  return (
    <div className="modal-backdrop">
      <section className="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qr-modal-title">
        <button className="modal-close" type="button" aria-label="닫기" onClick={close}><Icon name="x" /></button>
        <p>{entitlement.issuedDate}</p>
        <h2 id="qr-modal-title">통합 QR (식권/생수)</h2>
        <div className="qr-tabs" role="tablist" aria-label="QR 유형">
          <button className={`qr-tab ${activeType === "meal" ? "is-active" : ""}`} type="button" onClick={() => setActiveType("meal")}>식권 QR</button>
          <button className={`qr-tab ${activeType === "water" ? "is-active" : ""}`} type="button" onClick={() => setActiveType("water")}>생수 QR</button>
        </div>
        <div className="qr-frame" aria-label={`${entitlement.label} QR 코드`} title={entitlement.qrToken}>
          <div className="qr-fake">{Array.from({ length: 169 }, (_, index) => <span key={index} />)}</div>
        </div>
        <strong className="qr-count">{entitlement.label} 남은 횟수: {entitlement.remainingCount}회</strong>
        <p className="qr-help">{entitlement.help}</p>
        <button className="modal-action" type="button" onClick={close}>닫기</button>
      </section>
    </div>
  );
}

function findQrEntitlement(entitlements: QrEntitlement[], qrType: "meal" | "water"): QrEntitlement {
  return entitlements.find((entitlement) => entitlement.qrType === qrType) ?? {
    qrType,
    label: qrType === "meal" ? "식권" : "생수",
    issuedDate: new Date().toISOString().slice(0, 10),
    totalCount: qrType === "meal" ? 2 : 3,
    usedCount: 0,
    remainingCount: qrType === "meal" ? 2 : 3,
    status: "active",
    qrToken: "",
    help: qrType === "meal" ? "운영 데스크에서 위 QR 코드를 스캔하세요" : "워터 스테이션에서 위 QR 코드를 스캔하세요",
  };
}

function NotificationModal({ close }: { close: () => void }) {
  const items = [
    { tone: "danger", icon: "alert", title: "공정 지연 안내", time: "10분 전", text: "무대 B구역 급수 펌프 부하로 인해 특수효과 테스트 공정이 20분 지연되었습니다.", priority: true },
    { tone: "info", icon: "shield", title: "안전 수칙 업데이트", time: "1시간 전", text: "야외 구역 지면 미끄럼 방지 매트 설치에 따른 통행 주의 사항이 업데이트되었습니다." },
    { tone: "", icon: "calendar", title: "스케줄 변경 알림", time: "3시간 전", text: "오후 2시 예정된 메인 스테이지 조명 리허설 시간이 30분 앞당겨졌습니다." },
    { tone: "", icon: "history", title: "로그 기록 완료", time: "어제", text: "현장 안전 점검 일일 리포트가 시스템에 성공적으로 업로드되었습니다." },
  ];

  return (
    <div className="modal-backdrop modal-backdrop--sheet">
      <section className="notification-modal" role="dialog" aria-modal="true" aria-labelledby="notification-title">
        <div className="modal-title-row">
          <h2 id="notification-title">알림 내역</h2>
          <button className="modal-close" type="button" aria-label="알림 내역 닫기" onClick={close}><Icon name="x" /></button>
        </div>
        <div className="notification-list">
          {items.map((item) => (
            <article className={`notification-item ${item.tone}`} key={item.title}>
              <span><Icon name={item.icon as IconName} /></span>
              <div>
                <div className="notification-head"><strong>{item.title}</strong><time>{item.time}</time></div>
                <p>{item.text}</p>
                {item.priority ? <em>HIGH PRIORITY</em> : null}
              </div>
            </article>
          ))}
        </div>
        <button className="modal-action" type="button" onClick={close}>닫기</button>
      </section>
    </div>
  );
}

function Icon({ name }: { name: IconName }) {
  const icons: Record<IconName, string> = {
    alert: "warning",
    bell: "notifications",
    calendar: "calendar_month",
    check: "check",
    grid: "qr_code_scanner",
    history: "history",
    id: "badge",
    map: "map",
    phone: "call",
    rain: "rainy",
    shield: "health_and_safety",
    thermo: "device_thermostat",
    user: "person",
    users: "groups",
    wallet: "account_balance_wallet",
    wind: "air",
    x: "close",
  };

  return <MaterialIcon name={icons[name]} className="svg-icon" />;
}
