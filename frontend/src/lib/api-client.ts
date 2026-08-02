import type { ApiEnvelope, ApiErrorPayload } from '@/types/api';

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:8000';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly fields: Record<string, string>;

  constructor(
    message: string,
    status: number,
    options?: { code?: string; fields?: Record<string, string> }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code;
    this.fields = options?.fields ?? {};
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  url: string;
  data?: unknown;
  timeoutMs?: number;
};

export const request = async <T>({
  url,
  data,
  timeoutMs = 15_000,
  headers,
  ...init
}: RequestOptions): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${apiBaseUrl}${url}`, {
      ...init,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(data === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    });
    const payload = (await response.json().catch(() => undefined)) as
      ApiEnvelope<T> | ApiErrorPayload | undefined;

    if (!response.ok) {
      const apiError = payload && 'error' in payload ? payload.error : undefined;
      throw new ApiError(
        apiError?.message ?? `Request failed (${response.status})`,
        response.status,
        {
          ...(apiError?.code ? { code: apiError.code } : {}),
          fields: apiError?.fields ?? {},
        }
      );
    }
    if (!payload || !('data' in payload)) {
      throw new ApiError('The server returned an invalid response', response.status);
    }
    return payload.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('The server took too long to respond', 0);
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Unable to reach the server',
      0
    );
  } finally {
    clearTimeout(timeout);
  }
};

export const getApiBaseUrl = () => apiBaseUrl;
