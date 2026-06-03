import axios, {
  isAxiosError,
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import { env } from "../config/env";
import { getToken } from "./storage";

/**
 * Shared axios instance. Every request automatically carries the stored
 * JWT as `Authorization: Bearer <token>`. On a 401 we notify a registered
 * handler so the auth store can sign the user out — kept as a callback to
 * avoid a circular import between this module and the store.
 */
export const api: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

let onUnauthorized: (() => void) | null = null;

/** Registered by the auth store so a 401 can trigger a global logout. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Shape returned by service helpers — never throws, always discriminable. */
export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface ApiError {
  message: string;
  status?: number;
  /** Field-level validation errors from the server, when present. */
  fieldErrors?: { field: string; message: string }[];
}

/** Normalize any thrown axios/JS error into a flat, displayable ApiError. */
export function toApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: { field: string; message: string }[] }
      | undefined;
    return {
      message: data?.message ?? error.message ?? "Network error",
      status: error.response?.status,
      fieldErrors: data?.errors,
    };
  }
  return { message: error instanceof Error ? error.message : "Unknown error" };
}

/**
 * Wrap an axios call so callers get an `ApiResult` instead of try/catch.
 * Usage: `const res = await request(() => api.get("/events"))`
 */
export async function request<T>(
  call: () => Promise<{ data: T }>,
): Promise<ApiResult<T>> {
  try {
    const { data } = await call();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: toApiError(error) };
  }
}

export default api;
