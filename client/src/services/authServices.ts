import { api, request } from "./api";
import { saveSession, type SessionUser } from "./session";
import type { LoginSchema, SignupSchema } from "../schemas/authSchemas";

export { EMAIL_UNVERIFIED } from "./constants";

interface AuthPayload {
  message: string;
  token: string;
  user: SessionUser;
}

/** Stores the token on success, so subsequent calls are authenticated. */
async function authenticate(fn: () => Promise<{ data: AuthPayload }>) {
  const result = await request<AuthPayload>(fn);
  if (result.success) await saveSession(result.data.token, result.data.user);
  return result;
}

export function signInWithEmail(data: LoginSchema) {
  return authenticate(() => api.post<AuthPayload>("/auth/login", data));
}

export function signUpWithEmail(data: SignupSchema) {
  // confirmPassword is a client-only field and the server's Joi schema rejects
  // unknown keys, so it must not be sent.
  const { confirmPassword, ...payload } = data;
  return request<{ message: string; userId: string; emailSent: boolean }>(() =>
    api.post("/auth/register", payload)
  );
}

/** Registration returns 201, but the account is unusable until this succeeds. */
export function verifyOtp(email: string, otp: string) {
  return request<{ message: string; emailVerified: boolean }>(() =>
    api.post("/auth/verify-otp", { email, otp })
  );
}

export function resendOtp(email: string) {
  return request<{ message: string }>(() => api.post("/auth/resend-otp", { email }));
}

export function requestPasswordReset(email: string) {
  return request<{ message: string }>(() => api.post("/auth/forgot-password", { email }));
}

/**
 * Completes the forgot-password flow.
 *
 * The token arrives by email, so the user types or pastes it; there is no deep
 * link registered for it yet.
 */
export function resetPassword(token: string, password: string) {
  return request<{ message: string; passwordUpdated: boolean }>(() =>
    api.post("/auth/reset-password", {
      token,
      password,
      confirmPassword: password,
    })
  );
}

export function signInWithGoogle(accessToken: string) {
  return authenticate(() => api.post<AuthPayload>("/auth/google", { accessToken }));
}
