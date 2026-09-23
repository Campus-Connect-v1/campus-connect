import { useCallback, useEffect, useRef, useState } from "react";

import type { Result } from "@/src/services/api";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Runs an API call and exposes the states every data screen owes the user:
 * loading, loaded, empty and error — plus pull-to-refresh, which is distinct
 * from initial loading and must not re-show the full-screen spinner.
 *
 * `fn` must be stable (useCallback) or this re-runs forever.
 */
export function useAsync<T>(fn: () => Promise<Result<T>>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Which request is the current one.
   *
   * Without this the handler simply awaited and wrote, so when two requests
   * overlapped the one that FINISHED last won rather than the one ISSUED last
   * -- and it wrote silently, with no error and nothing on screen to suggest
   * the data was stale. The API cold-starts (Render free tier, ~25s for the
   * first request and ~200ms for the next), so an initial load overtaken by a
   * pull-to-refresh reliably resolved in the wrong order.
   *
   * A ref rather than state: it has to be readable synchronously at the moment
   * the response lands, and it must not itself trigger a render.
   */
  const requestId = useRef(0);

  // Writing to state after unmount is pointless work on a component nobody is
  // looking at, and on a screen that unmounts mid-flight it is the same stale
  // write by another route.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async (mode: "load" | "refresh") => {
      const id = ++requestId.current;

      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await fn();

      // Superseded by a newer request, or the screen is gone. Drop it: the
      // newer one owns the state and is responsible for clearing the flags.
      if (id !== requestId.current || !mounted.current) return;

      if (result.success) setData(result.data);
      else setError(result.error);

      setRefreshing(false);
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  useEffect(() => {
    run("load");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Wrapped so they keep a stable identity across renders. They were fresh
  // arrows each render, which made them unusable in a dependency array --
  // call sites worked around it by stashing them in refs or adding manual
  // timestamp guards.
  const refresh = useCallback(() => run("refresh"), [run]);
  const reload = useCallback(() => run("load"), [run]);

  return { data, loading, refreshing, error, refresh, reload };
}
