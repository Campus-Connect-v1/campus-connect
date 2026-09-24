import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { setIncognito, setLocationSharing } from "./geolocation";

interface LocationSharingValue {
  /** False means you are not on anyone's map. */
  sharing: boolean;
  /** The soft control: stop broadcasting, stay in the system. */
  setSharing: (next: boolean) => Promise<boolean>;
  /** The hard one: also drops you out of the proximity index immediately. */
  setGhost: (ghost: boolean) => Promise<boolean>;
}

const LocationSharingContext = createContext<LocationSharingValue>({
  sharing: true,
  setSharing: async () => false,
  setGhost: async () => false,
});

/**
 * One flag behind two controls.
 *
 * `POST /geofencing/location/toggle` and `POST /geofencing/incognito` write the
 * SAME Mongo field, `location_sharing_enabled`, in opposite directions —
 * incognito additionally clears `is_active`, which drops you out of the
 * `$geoNear` index outright. Left to themselves the two switches would
 * disagree: flipping Ghost Mode on the map would leave the privacy row still
 * reading "sharing".
 *
 * Holding the state here means whichever control the user touches, both
 * reflect it.
 *
 * KNOWN GAP: no endpoint returns `location_sharing_enabled`, so this starts
 * optimistic at `true` and is only correct once the user touches a control.
 * A GET is requested in BACKEND-REQUEST-4.
 */
export function LocationSharingProvider({ children }: { children: ReactNode }) {
  const [sharing, setSharingState] = useState(true);

  const write = useCallback(
    async (next: boolean, run: () => Promise<{ success: boolean }>) => {
      const previous = sharing;
      setSharingState(next);

      const result = await run();
      if (!result.success) {
        // Reverted: a control claiming you are hidden while the server still
        // shows you is the worst outcome available here.
        setSharingState(previous);
        return false;
      }
      return true;
    },
    [sharing]
  );

  const value = useMemo(
    () => ({
      sharing,
      setSharing: (next: boolean) => write(next, () => setLocationSharing(next)),
      setGhost: (ghost: boolean) => write(!ghost, () => setIncognito(ghost)),
    }),
    [sharing, write]
  );

  return (
    <LocationSharingContext.Provider value={value}>{children}</LocationSharingContext.Provider>
  );
}

export function useLocationSharing() {
  return useContext(LocationSharingContext);
}
