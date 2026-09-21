import { useCallback, useState } from "react";

import type { Result } from "@/src/services/api";

/**
 * A switch that flips immediately and reverts if the server refuses.
 *
 * A settings switch that waits for a round trip feels broken, and one that
 * flips and silently fails is worse than no switch at all — it tells the user
 * their privacy changed when it did not. This does the only honest version:
 * flip, write, and put it back with an error if the write fails.
 */
export function useOptimisticToggle(
  initial: boolean,
  write: (next: boolean) => Promise<Result<unknown>>
) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = useCallback(
    async (next: boolean) => {
      const previous = value;
      setValue(next);
      setError(null);
      setBusy(true);

      const result = await write(next);
      setBusy(false);

      if (!result.success) {
        setValue(previous);
        setError(result.error);
      }
    },
    [value, write]
  );

  /** Used when the real value arrives from the server after first paint. */
  const sync = useCallback((next: boolean) => setValue(next), []);

  return { value, toggle, sync, error, busy };
}
