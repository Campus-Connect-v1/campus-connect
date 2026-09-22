import { router } from "expo-router";

import { disconnectSocket, getSocket } from "./socket";
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
  getSetupCompleted,
  getUser,
  restoreSession,
  saveSetupCompleted,
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
  /** True after an incomplete user chooses "Skip for now" in this session. */
  setupDismissed: boolean;
  setupCompleted: boolean;
  dismissSetup: () => void;
  completeSetup: () => Promise<void>;
  refresh: () => Promise<{ profile: ApiProfile | null; setupCompleted: boolean }>;
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
  const [setupDismissed, setSetupDismissed] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);

  const load = useCallback(async () => {
    if (!getUser()) {
      setProfile(null);
      setStats(null);
      setUniversity(null);
      return null;
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
    return profileResult.success ? profileResult.data : null;
  }, []);

  const refresh = useCallback(async () => {
    const currentUser = getUser();
    setUser(currentUser);
    const [nextProfile, completed] = await Promise.all([
      load(),
      getSetupCompleted(currentUser?.id),
    ]);
    setSetupCompleted(completed);
    return { profile: nextProfile, setupCompleted: completed };
  }, [load]);

  useEffect(() => {
    (async () => {
      await restoreSession();
      const currentUser = getUser();
      setUser(currentUser);
      setSetupCompleted(await getSetupCompleted(currentUser?.id));
      await load();
      setBooting(false);
    })();
  }, [load]);

  // Open the shared socket for the whole signed-in session, not just while a
  // message thread is on screen. Notifications and post rooms are delivered
  // over the same connection, so leaving it to the DM screen meant a user who
  // never opened a conversation received no live updates anywhere.
  //
  // getSocket() is idempotent and returns null without a token, so this is
  // safe to run on every user change.
  useEffect(() => {
    if (!user) return;
    getSocket();
  }, [user]);

  const signOut = useCallback(async () => {
    await clearSession();
    // Before clearing local state: the socket authenticates with the token
    // this is about to drop, and it must not stay open as the previous user.
    disconnectSocket();
    setUser(null);
    setProfile(null);
    setStats(null);
    setUniversity(null);
    setSetupDismissed(false);
    setSetupCompleted(false);
    router.replace("/auth");
  }, []);

  useEffect(() => {
    // A 401 from anywhere drops the local copies too, otherwise the next screen
    // renders the expired account's details while routing to sign-in.
    setOnSessionExpired(() => {
      // The socket authenticated with the now-expired token; leaving it open
      // would keep pushing the previous session's events at the sign-in screen.
      disconnectSocket();
      setUser(null);
      setProfile(null);
      setStats(null);
      setUniversity(null);
      setSetupDismissed(false);
      setSetupCompleted(false);
      router.replace("/auth");
    });
    return () => setOnSessionExpired(null);
  }, []);

  const completeSetup = useCallback(async () => {
    await saveSetupCompleted(getUser()?.id);
    setSetupCompleted(true);
    setSetupDismissed(true);
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
      setupDismissed,
      setupCompleted,
      dismissSetup: () => setSetupDismissed(true),
      completeSetup,
      refresh,
      signOut,
    }),
    [
      user,
      profile,
      stats,
      university,
      booting,
      loadingProfile,
      profileError,
      setupDismissed,
      setupCompleted,
      completeSetup,
      refresh,
      signOut,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
