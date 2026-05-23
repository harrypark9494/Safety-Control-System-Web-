import { useEffect, useState } from "react";
import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PayrollDocumentsPage } from "./pages/PayrollDocumentsPage";
import { getSession, requiresPayrollDocuments } from "./features/auth/session";
import {
  APP_NAVIGATION_EVENT,
  getSecureEntryPath,
  isSecureEntryPath,
  replaceWith,
} from "./features/navigation";

const exposedSecurePaths = ["/app", "/dashboard", "/payroll-documents", "/admin"];

export function App() {
  const [path, setPath] = useState(() => window.location.pathname.replace(/\/+$/, "") || "/");

  useEffect(() => {
    function syncPath() {
      setPath(window.location.pathname.replace(/\/+$/, "") || "/");
    }

    window.addEventListener("popstate", syncPath);
    window.addEventListener(APP_NAVIGATION_EVENT, syncPath);

    return () => {
      window.removeEventListener("popstate", syncPath);
      window.removeEventListener(APP_NAVIGATION_EVENT, syncPath);
    };
  }, []);

  useEffect(() => {
    if (exposedSecurePaths.some((securePath) => path.endsWith(securePath))) {
      replaceWith(getSession() ? getSecureEntryPath() : "/login/");
    }
  }, [path]);

  if (path.endsWith("/login")) {
    return <LoginPage />;
  }

  if (isSecureEntryPath(path)) {
    return <SecureEntry />;
  }

  return <LoginPage />;
}

function SecureEntry() {
  const session = getSession();

  if (!session) {
    return <LoginPage />;
  }

  if (session.role === "admin") {
    return <AdminPage />;
  }

  if (requiresPayrollDocuments(session)) {
    return <PayrollDocumentsPage />;
  }

  return <DashboardPage />;
}
