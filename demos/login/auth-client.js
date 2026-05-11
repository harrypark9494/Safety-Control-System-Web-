const APPROVED_WORKER_ACCOUNT = {
  name: "박현장",
  phone: "010-1234-5678",
  code: "123456",
  password: "safety1234",
  workType: "철골 설치",
  team: "철골 2팀",
  supervisor: "김안전 관리자",
};

/**
 * AuthClient contract used by the login demo.
 *
 * Real Firebase code should implement the same methods later:
 * - requestWorkerCode({ phone })
 * - registerWorker({ phone, code, password })
 * - signInWorker({ name, phone, code, password })
 * - signInAdminWithGoogle()
 * - signOut()
 */
function createMockAuthClient() {
  const allowedAdminDomains = ["safetycontrol.local"];
  const registeredWorkers = new Map([
    [
      APPROVED_WORKER_ACCOUNT.phone,
      {
        name: APPROVED_WORKER_ACCOUNT.name,
        workType: APPROVED_WORKER_ACCOUNT.workType,
        team: APPROVED_WORKER_ACCOUNT.team,
        supervisor: APPROVED_WORKER_ACCOUNT.supervisor,
        password: APPROVED_WORKER_ACCOUNT.password,
        autoApproved: true,
      },
    ],
    [
      "010-2222-3333",
      {
        name: "김안전",
        workType: "장비 작업",
        team: "장비 1팀",
        supervisor: "이관리 관리자",
        password: null,
        autoApproved: false,
      },
    ],
  ]);

  function wait(ms = 350) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function getEmailDomain(email) {
    return email.split("@").at(-1)?.toLowerCase() || "";
  }

  function normalizePhone(phone) {
    return phone.trim();
  }

  function validateCode(code) {
    if (code !== "123456") {
      throw new Error("mock 인증 코드는 123456입니다.");
    }
  }

  function validatePassword(password) {
    if (!password || password.length < 8) {
      throw new Error("비밀번호는 8자 이상으로 입력하세요.");
    }
  }

  function toWorkerSession(worker, phone) {
    return {
      role: "worker",
      name: worker.name,
      workType: worker.workType,
      team: worker.team,
      supervisor: worker.supervisor,
      phone,
      status: worker.autoApproved ? "자동 승인" : "출근 확인",
    };
  }

  return {
    getApprovedWorkerAccount() {
      return { ...APPROVED_WORKER_ACCOUNT };
    },

    async requestWorkerCode({ phone }) {
      await wait();

      if (!phone) {
        throw new Error("연락처를 먼저 입력하세요.");
      }

      return {
        delivery: "mock",
        maskedPhone: phone.replace(/\d(?=\d{4})/g, "*"),
      };
    },

    async registerWorker({ phone, code, password }) {
      await wait();

      if (!phone || !code || !password) {
        throw new Error("연락처, 인증 코드, 비밀번호를 모두 입력하세요.");
      }

      const normalizedPhone = normalizePhone(phone);
      const worker = registeredWorkers.get(normalizedPhone);

      if (!worker) {
        throw new Error("DB에 등록된 사용자가 아닙니다.");
      }

      validateCode(code);
      validatePassword(password);

      worker.password = password;

      return {
        ...toWorkerSession(worker, normalizedPhone),
        status: "등록 승인",
      };
    },

    async signInWorker({ name, phone, code, password }) {
      await wait();

      if (!name || !phone || !code || !password) {
        throw new Error("이름, 연락처, 인증 코드, 비밀번호를 모두 입력하세요.");
      }

      const normalizedPhone = normalizePhone(phone);
      const worker = registeredWorkers.get(normalizedPhone);

      if (!worker) {
        throw new Error("DB에 등록된 사용자가 아닙니다.");
      }

      if (worker.name !== name.trim()) {
        throw new Error("DB에 등록된 이름과 연락처가 일치하지 않습니다.");
      }

      if (!worker.password) {
        throw new Error("최초 등록을 먼저 완료하세요.");
      }

      validateCode(code);

      if (worker.password !== password) {
        throw new Error("비밀번호가 일치하지 않습니다.");
      }

      return toWorkerSession(worker, normalizedPhone);
    },

    async signInAdminWithGoogle() {
      await wait();

      const email = window.prompt(
        "Mock Google 로그인 이메일을 입력하세요.",
        "admin@safetycontrol.local",
      );

      if (!email) {
        throw new Error("Google 로그인이 취소되었습니다.");
      }

      const domain = getEmailDomain(email);

      if (!allowedAdminDomains.includes(domain)) {
        await this.signOut();
        throw new Error("허용된 Google Workspace 계정이 아닙니다.");
      }

      return {
        role: "admin",
        email,
      };
    },

    async signOut() {
      await wait(120);
    },
  };
}
