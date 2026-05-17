function createApiAuthClient(config = SAFETY_CONTROL_AUTH_CONFIG) {
  const baseUrl = config.apiBaseUrl.replace(/\/$/, "");

  async function request(endpoint, payload) {
    const response = await window.fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = null;

    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.message || "인증 API 요청에 실패했습니다.");
    }

    return data;
  }

  return {
    getApprovedWorkerAccount() {
      return { ...config.demoAccount };
    },

    requestWorkerCode({ phone }) {
      return request(config.endpoints.requestWorkerCode, { phone });
    },

    registerWorker({ phone, code, password, workType }) {
      return request(config.endpoints.registerWorker, {
        phone,
        code,
        password,
        workType,
      });
    },

    signInWorker({ name, phone, code, password, workType }) {
      return request(config.endpoints.signInWorker, {
        name,
        phone,
        code,
        password,
        workType,
      });
    },

    async signInAdminWithGoogle() {
      const email = window.prompt("Google 로그인 이메일을 입력하세요.", "");

      if (!email) {
        throw new Error("Google 로그인이 취소되었습니다.");
      }

      return request(config.endpoints.signInAdminWithGoogle, { email });
    },

    signOut() {
      return Promise.resolve();
    },
  };
}
