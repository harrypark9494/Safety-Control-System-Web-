function createMockAuthClient(config = SAFETY_CONTROL_AUTH_CONFIG) {
  const demoAccounts = config.demoAccounts || [config.demoAccount];
  const approvedWorkerAccount = demoAccounts[0];
  const allowedAdminDomains = ["safetycontrol.local"];
  const registeredWorkers = new Map(
    demoAccounts.map((account) => [
      account.phone,
      {
        name: account.name,
        workType: account.workType,
        team: account.team,
        supervisor: account.supervisor,
        password: account.password,
        autoApproved: true,
      },
    ]),
  );

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
      throw new Error("인증 코드가 일치하지 않습니다.");
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
      schedule: worker.schedule || "05.20(수) 09:00-18:00 / A현장 2구역",
      status: worker.autoApproved ? "자동 승인" : "출근 확인",
    };
  }

  return {
    getApprovedWorkerAccount() {
      return { ...approvedWorkerAccount };
    },

    getDemoWorkerAccounts() {
      return demoAccounts.map((account) => ({ ...account }));
    },

    async requestWorkerCode({ phone }) {
      await wait();

      if (!phone) {
        throw new Error("연락처를 먼저 입력하세요.");
      }

      return {
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
        throw new Error("등록된 사용자가 아닙니다.");
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
        throw new Error("등록된 사용자가 아닙니다.");
      }

      if (worker.name !== name.trim()) {
        throw new Error("등록된 이름과 연락처가 일치하지 않습니다.");
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
        "Google 로그인 이메일을 입력하세요.",
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
