import { useCallback, useEffect, useState } from "react";

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

  const run = useCallback(
    async (mode: "load" | "refresh") => {
      if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError(null);

      const result = await fn();
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

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: () => run("refresh"),
    reload: () => run("load"),
  };
}
