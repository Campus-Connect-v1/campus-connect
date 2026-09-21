import { useEffect, useState } from "react";

import { uploadsEnabled } from "@/src/services/uploadServices";

/**
 * Whether media can be attached at all.
 *
 * Starts null so a screen can render nothing rather than flashing an attach
 * button that is about to disappear, or hiding one that is about to appear.
 */
export function useUploadsEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    uploadsEnabled().then((value) => {
      if (active) setEnabled(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return enabled;
}
