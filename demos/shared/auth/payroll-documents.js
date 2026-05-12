const SAFETY_CONTROL_PAYROLL_DOCUMENTS_KEY = "safetyControlPayrollDocuments";

function getPayrollDocumentRecords() {
  const rawRecords = window.localStorage.getItem(SAFETY_CONTROL_PAYROLL_DOCUMENTS_KEY);

  if (!rawRecords) {
    return {};
  }

  try {
    return JSON.parse(rawRecords);
  } catch {
    window.localStorage.removeItem(SAFETY_CONTROL_PAYROLL_DOCUMENTS_KEY);
    return {};
  }
}

function getPayrollDocumentUserKey(user) {
  return user?.phone || user?.email || "";
}

function hasSubmittedPayrollDocuments(user) {
  const userKey = getPayrollDocumentUserKey(user);

  if (!userKey) {
    return false;
  }

  return Boolean(getPayrollDocumentRecords()[userKey]?.submittedAt);
}

function isPayrollDocumentRequired(user, config = SAFETY_CONTROL_AUTH_CONFIG) {
  if (user?.role !== "worker") {
    return false;
  }

  const requiredPhones = config.payrollDocumentRequiredPhones || [];

  return requiredPhones.includes(user.phone) && !hasSubmittedPayrollDocuments(user);
}

function savePayrollDocumentSubmission(user, submission) {
  const userKey = getPayrollDocumentUserKey(user);

  if (!userKey) {
    throw new Error("로그인 사용자 정보를 찾을 수 없습니다.");
  }

  const records = getPayrollDocumentRecords();

  records[userKey] = {
    ...submission,
    submittedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(
    SAFETY_CONTROL_PAYROLL_DOCUMENTS_KEY,
    JSON.stringify(records),
  );
}

function markCurrentSessionPayrollSubmitted() {
  const rawUser = window.sessionStorage.getItem("safetyControlUser");

  if (!rawUser) {
    return;
  }

  try {
    const user = JSON.parse(rawUser);
    window.sessionStorage.setItem(
      "safetyControlUser",
      JSON.stringify({ ...user, payrollDocumentsSubmitted: true }),
    );
  } catch {
    window.sessionStorage.removeItem("safetyControlUser");
  }
}
