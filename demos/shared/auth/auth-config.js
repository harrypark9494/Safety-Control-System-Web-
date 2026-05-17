const SAFETY_CONTROL_AUTH_CONFIG = {
  mode: "mock",
  apiBaseUrl: "",
  endpoints: {
    requestWorkerCode: "/auth/worker/code",
    registerWorker: "/auth/worker/register",
    signInWorker: "/auth/worker/login",
    signInAdminWithGoogle: "/auth/admin/google",
    submitPayrollDocuments: "/worker/payroll-documents",
  },
  payrollDocumentRequiredPhones: ["010-1234-5678"],
  workTypeOptions: ["철골 설치", "장비 작업", "전기 작업", "안전 관리", "현장 지원"],
  demoAccount: {
    name: "박현장",
    phone: "010-1234-5678",
    code: "123456",
    password: "safety1234",
    workType: "철골 설치",
    team: "철골 2팀",
    supervisor: "김안전 관리자",
  },
};
