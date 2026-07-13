import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiEnvelope, ApiErrorPayload } from '../types/api';

const apiBaseUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  ''
) ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly fields: Record<string, string>;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      fields?: Record<string, string>;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options?.code;
    this.fields = options?.fields ?? {};
  }
}

const toApiError = (error: unknown): ApiError => {
  if (!(error instanceof AxiosError)) {
    return new ApiError(
      error instanceof Error ? error.message : 'Something went wrong',
      0
    );
  }

  const payload = error.response?.data as ApiErrorPayload | undefined;
  const fields = Object.fromEntries(
    (payload?.errors ?? []).map((item) => [item.field, item.message])
  );

  return new ApiError(
    payload?.message ??
      (error.code === 'ECONNABORTED'
        ? 'The server took too long to respond'
        : 'Unable to reach the server'),
    error.response?.status ?? 0,
    {
      ...(payload?.code ? { code: payload.code } : {}),
      fields,
    }
  );
};

export const request = async <T>(
  config: AxiosRequestConfig
): Promise<T> => {
  try {
    const response = await apiClient.request<ApiEnvelope<T>>(config);
    return response.data.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const getApiBaseUrl = () => apiBaseUrl;
