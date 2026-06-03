import { create } from "zustand";
import { setUnauthorizedHandler } from "../services/api";
import {
  login as loginRequest,
  loginWithGoogle as googleRequest,
  type AuthSession,
  type AuthUser,
  type LoginPayload,
} from "../services/authServices";
import {
  StorageKeys,
  clearAuth,
  getItem,
  getToken,
  setItem,
  setToken,
} from "../services/storage";
import type { ApiResult } from "../services/api";

type AuthStatus = "idle" | "authenticated" | "unauthenticated";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: AuthStatus;
  /** Whether the user has completed onboarding. */
  hasOnboarded: boolean;
  /** True until the first hydrate from storage completes. */
  hydrating: boolean;

  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<ApiResult<AuthSession>>;
  loginWithGoogle: (idToken: string) => Promise<ApiResult<AuthSession>>;
  setSession: (session: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  status: "idle",
  hasOnboarded: false,
  hydrating: true,

  /** Load any persisted session on app start. */
  hydrate: async () => {
    const [token, user, onboarded] = await Promise.all([
      getToken(),
      getItem<AuthUser>(StorageKeys.user),
      getItem<boolean>(StorageKeys.hasSeenOnboarding),
    ]);
    set({
      token,
      user,
      hasOnboarded: !!onboarded,
      status: token ? "authenticated" : "unauthenticated",
      hydrating: false,
    });
  },

  /** Mark onboarding complete (persisted + in-memory). */
  completeOnboarding: async () => {
    await setItem(StorageKeys.hasSeenOnboarding, true);
    set({ hasOnboarded: true });
  },

  login: async (payload) => {
    const result = await loginRequest(payload);
    if (result.success) await get().setSession(result.data);
    return result;
  },

  loginWithGoogle: async (idToken) => {
    const result = await googleRequest(idToken);
    if (result.success) await get().setSession(result.data);
    return result;
  },

  /** Persist a fresh session and flip state to authenticated. */
  setSession: async (session) => {
    await Promise.all([
      setToken(session.token),
      setItem(StorageKeys.user, session.user),
    ]);
    set({
      token: session.token,
      user: session.user,
      status: "authenticated",
    });
  },

  logout: async () => {
    await clearAuth();
    set({ token: null, user: null, status: "unauthenticated" });
  },
}));

// A 401 from any request signs the user out globally.
setUnauthorizedHandler(() => {
  void useAuthStore.getState().logout();
});
