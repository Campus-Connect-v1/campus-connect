import { useCallback, useEffect, useState } from "react";

import { useSession } from "@/src/services/SessionContext";
import {
  primeUniversities,
  universityFromCache,
  type UniversityOption,
} from "@/src/services/universityServices";
import { readableOn } from "@/src/styles/theme";
import { useTheme } from "@/src/styles/useTheme";

export interface CampusRing {
  /** Contrast-safe against the current background. */
  color: string;
  /** Short campus name, for the badge on a cross-campus profile. */
  label: string;
  /** True when this person is at the viewer's own university. */
  isOwn: boolean;
}

/**
 * "Regional Maritime University" -> "Maritime". Long formal names do not fit a
 * badge, and the distinguishing word is rarely the first one.
 */
function shortName(name: string): string {
  const cleaned = name
    .replace(/\b(the|university|universities|college|institute|of|polytechnic)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Everything was a stop word ("University of Ghana" keeps "Ghana", but
  // "The University" would not), so fall back to the original.
  const base = cleaned || name;
  const words = base.split(" ");
  return words.length > 2 ? words.slice(0, 2).join(" ") : base;
}

/**
 * Resolves a university id to the ring drawn around a person's avatar.
 *
 * Returns a lookup rather than taking an id, so a grid of thirty avatars runs
 * one effect instead of thirty. The colour is the university's OWN brand
 * colour from the database, corrected for contrast: many are near-black and
 * would otherwise vanish on a dark ground.
 */
export function useCampusLookup() {
  const { colors } = useTheme();
  const { profile, user } = useSession();
  const [ready, setReady] = useState(false);

  const ownId = profile?.university_id ?? user?.university_id ?? null;

  useEffect(() => {
    let active = true;
    primeUniversities().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return useCallback(
    (universityId?: string | null): CampusRing | null => {
      // `ready` is read here so the callback identity changes once the list
      // lands and consumers re-render with real colours.
      if (!ready || !universityId) return null;

      const uni: UniversityOption | null = universityFromCache(universityId);
      if (!uni) return null;

      const brand = uni.colors?.primary || colors.accent;

      return {
        color: readableOn(brand, colors.background),
        label: shortName(uni.label),
        isOwn: universityId === ownId,
      };
    },
    [ready, ownId, colors.accent, colors.background]
  );
}
