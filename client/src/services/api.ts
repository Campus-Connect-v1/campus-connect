import axios, { AxiosError, type AxiosInstance } from "axios";

import { API_URL } from "../constants/env";
import { getToken, notifySessionExpired } from "./session";
import { getSocketId } from "./socket";

export type Result<T> =
  { success: true; data: T } | { success: false; error: string; status?: number };

/**
 * One axios instance for the whole API.
 *
 * Every service builds on this so the auth header, the timeout and the error
 * shaping exist in exactly one place — four separate axios instances is how an
 * app ends up with three different ideas of what an error looks like.
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  // Render free instances cold-start; the default gives up long before.
  timeout: 45000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Lets the server leave this client out of the broadcast for its own write.
  // We already have the authoritative result in the response and have usually
  // applied it optimistically, so the echo would only make counters flicker.
  const socketId = getSocketId();
  if (socketId) config.headers["x-socket-id"] = socketId;

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 401 means the token is gone or expired. 403 is a live token that is not
    // allowed to do this thing (an unverified email, for one) and must NOT
    // clear the session.
    // A 401 from an authenticated request means an existing session expired.
    // Login also returns 401 for bad credentials, but there is no session to
    // expire in that case and redirecting would erase the form's error state.
    if (error.response?.status === 401 && getToken()) notifySessionExpired();
    return Promise.reject(error);
  }
);

/**
 * The API reports validation failures as
 * `{ message, errors: [{ field, message }] }`, so surfacing `message` alone
 * reduces five specific field errors to the words "Validation failed".
 */
export function toMessage(error: unknown): string {
  const axiosError = error as AxiosError<{
    message?: string;
    errors?: { field: string; message: string }[];
  }>;

  if (axiosError.code === "ECONNABORTED") {
    return "The server took too long to respond. Try again.";
  }
  if (!axiosError.response) {
    return "Cannot reach the server. Check your connection and the API URL.";
  }

  const body = axiosError.response.data;
  if (body?.errors?.length) {
    return body.errors.map((e) => e.message.replace(/"/g, "")).join("\n");
  }
  return body?.message ?? "Something went wrong. Try again.";
}

export async function request<T>(fn: () => Promise<{ data: T }>): Promise<Result<T>> {
  try {
    const response = await fn();
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: toMessage(error),
      status: (error as AxiosError).response?.status,
    };
  }
}
