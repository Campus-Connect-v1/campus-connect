import { router } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { fetchUniversityById, type UniversityOption } from "./universityServices";
import { fetchProfile, fetchStats, type ApiProfile, type ApiStats } from "./userServices";
import {
  clearSession,
  getUser,
  restoreSession,
  setOnSessionExpired,
  type SessionUser,
} from "./session";

interface SessionValue {
  /** The minimal user the login response carries — available immediately. */
  user: SessionUser | null;
  /** The full record from /user/profile — null until it loads. */
  profile: ApiProfile | null;
  stats: ApiStats | null;
  /**
   * The user's university, resolved from `profile.university_id`.
   *
   * /user/profile returns the id only, so anything that wants to PRINT the
   * campus has to look it up. Doing it here means one lookup per session
   * instead of one per screen that shows it.
   */
  university: UniversityOption | null;
  /** True only during the very first restore, so gates can wait on it. */
  booting: boolean;
  loadingProfile: boolean;
  profileError: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Holds the signed-in user for the whole app.
 *
 * `session.ts` already stores the token, but it stores it in a module variable
 * — reading it from a component gives whatever was there at render time and
 * never re-renders when it changes. That is precisely how a screen ends up
 * still showing the previous account after a fresh login. This context is the
 * reactive layer on top of it; screens read `useSession()`, never `getUser()`.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [university, setUniversity] = useState<UniversityOption | null>(null);
  const [booting, setBooting] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getUser()) {
      setProfile(null);
      setStats(null);
      setUniversity(null);
      return;
    }
    setLoadingProfile(true);
    setProfileError(null);

    // Stats failing must not blank the profile — they are independent reads and
    // one 500 on a COUNT query should not cost the user their own name.
    const [profileResult, statsResult] = await Promise.all([fetchProfile(), fetchStats()]);

    if (profileResult.success) {
      setProfile(profileResult.data);
      const id = profileResult.data.university_id;
      if (id) fetchUniversityById(id).then(setUniversity);
    } else {
      setProfileError(profileResult.error);
    }

    if (statsResult.success) setStats(statsResult.data);

    setLoadingProfile(false);
  }, []);

  const refresh = useCallback(async () => {
    setUser(getUser());
    await load();
  }, [load]);

  useEffect(() => {
    (async () => {
      await restoreSession();
      setUser(getUser());
      setBooting(false);
      await load();
    })();
  }, [load]);

  const signOut = useCallback(async () => {
    await clearSession();
    setUser(null);
    setProfile(null);
    setStats(null);
    setUniversity(null);
    router.replace("/auth");
  }, []);

  useEffect(() => {
    // A 401 from anywhere drops the local copies too, otherwise the next screen
    // renders the expired account's details while routing to sign-in.
    setOnSessionExpired(() => {
      setUser(null);
      setProfile(null);
      setStats(null);
      setUniversity(null);
      router.replace("/auth");
    });
    return () => setOnSessionExpired(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      stats,
      university,
      booting,
      loadingProfile,
      profileError,
      refresh,
      signOut,
    }),
    [user, profile, stats, university, booting, loadingProfile, profileError, refresh, signOut]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
