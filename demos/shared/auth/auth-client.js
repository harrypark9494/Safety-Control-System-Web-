function createAuthClient(config = SAFETY_CONTROL_AUTH_CONFIG) {
  if (config.mode === "api") {
    if (!config.apiBaseUrl) {
      throw new Error("API 인증 모드에는 apiBaseUrl이 필요합니다.");
    }

    return createApiAuthClient(config);
  }

  return createMockAuthClient(config);
}
