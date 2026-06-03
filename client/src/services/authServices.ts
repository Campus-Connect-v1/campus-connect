import { api, request, type ApiResult } from "./api";

/**
 * Auth API client. Mirrors the server's `/api/auth` routes exactly:
 *   register → verify-otp → login, plus Google, forgot/reset password.
 * See server/controllers/auth.controller.js for the source of truth.
 */

// ---- Wire types (match server payloads) -----------------------------------

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  university_id: string;
  profile_picture_url?: string;
}

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  university_id: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  emailSent: boolean;
  emailVerified: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  message: string;
  token: string;
  user: AuthUser;
}

// ---- Calls ----------------------------------------------------------------

export function register(
  payload: RegisterPayload,
): Promise<ApiResult<RegisterResponse>> {
  return request(() => api.post<RegisterResponse>("/auth/register", payload));
}

export function login(payload: LoginPayload): Promise<ApiResult<AuthSession>> {
  return request(() => api.post<AuthSession>("/auth/login", payload));
}

export function verifyOtp(
  email: string,
  otp: string,
): Promise<ApiResult<{ message: string; emailVerified: boolean }>> {
  return request(() => api.post("/auth/verify-otp", { email, otp }));
}

export function resendOtp(
  email: string,
): Promise<ApiResult<{ message: string; emailSent: boolean }>> {
  return request(() => api.post("/auth/resend-otp", { email }));
}

export function forgotPassword(
  email: string,
): Promise<ApiResult<{ message: string; emailSent: boolean }>> {
  return request(() => api.post("/auth/forgot-password", { email }));
}

export function resetPassword(
  token: string,
  password: string,
  confirmPassword: string,
): Promise<ApiResult<{ message: string; passwordUpdated: boolean }>> {
  return request(() =>
    api.post("/auth/reset-password", { token, password, confirmPassword }),
  );
}

/** `idToken` is the Google OAuth **ID token** (not an access token). */
export function loginWithGoogle(
  idToken: string,
): Promise<ApiResult<AuthSession>> {
  return request(() =>
    api.post<AuthSession>("/auth/google", { token: idToken }),
  );
}
