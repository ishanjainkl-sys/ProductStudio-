export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-ProductStudio-Client": "web",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: { code: string; message: string; details?: Record<string, unknown> };
    page?: number;
    pageSize?: number;
    total?: number;
  };

  if (!res.ok) {
    throw new ApiClientError(
      res.status,
      json.error?.code ?? "INTERNAL_ERROR",
      json.error?.message ?? "Request failed",
      json.error?.details,
    );
  }

  if ("page" in json && Array.isArray(json.data)) {
    return json as T;
  }

  return (json.data ?? json) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
