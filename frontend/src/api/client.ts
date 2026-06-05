const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function readApiError(response: Response, fallbackMessage: string): Promise<Error> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const error = await response.json().catch(() => null) as { message?: string } | null;
    return new Error(error?.message || fallbackMessage);
  }

  const text = await response.text();
  return new Error(text || fallbackMessage);
}

export async function requestApi(path: string, init?: RequestInit): Promise<Response> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw await readApiError(response, `요청 처리에 실패했습니다. (${response.status})`);
  }

  return response;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await requestApi(path, init);
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    throw new Error("API 서버 응답이 JSON이 아닙니다. 백엔드 서버 또는 API 배포 연결을 확인해 주세요.");
  }

  return response.json() as Promise<T>;
}

export async function requestNoContent(path: string, init?: RequestInit): Promise<void> {
  await requestApi(path, init);
}
