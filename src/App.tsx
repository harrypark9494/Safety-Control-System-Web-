import { AdminPage } from "./pages/AdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { PayrollDocumentsPage } from "./pages/PayrollDocumentsPage";

export function App() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  if (path.endsWith("/login")) {
    return <LoginPage />;
  }

  if (path.endsWith("/dashboard")) {
    return <DashboardPage />;
  }

  if (path.endsWith("/payroll-documents")) {
    return <PayrollDocumentsPage />;
  }

  if (path.endsWith("/admin")) {
    return <AdminPage />;
  }

  return <LoginPage />;
}
