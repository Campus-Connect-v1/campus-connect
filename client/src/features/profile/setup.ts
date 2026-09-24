import type { ApiInterest, ApiProfile } from "@/src/services/userServices";

export type SignedInDestination = "/setup" | "/(tabs)/home";
export type StudyYear = NonNullable<ApiProfile["year_of_study"]>;

export interface ProfileInterestOption {
  name: string;
  type: ApiInterest["interest_type"];
}

export const PROFILE_INTERESTS: ProfileInterestOption[] = [
  { name: "Coding", type: "academic" },
  { name: "Design", type: "arts" },
  { name: "Research", type: "academic" },
  { name: "Entrepreneurship", type: "career" },
  { name: "Internships", type: "career" },
  { name: "Finance", type: "career" },
  { name: "Music", type: "arts" },
  { name: "Photography", type: "arts" },
  { name: "Fashion", type: "arts" },
  { name: "Writing", type: "hobby" },
  { name: "Gaming", type: "hobby" },
  { name: "Movies", type: "hobby" },
  { name: "Football", type: "sports" },
  { name: "Basketball", type: "sports" },
  { name: "Running", type: "sports" },
  { name: "Volunteering", type: "hobby" },
];

export const STUDY_YEARS: { value: StudyYear; label: string }[] = [
  { value: "1", label: "Year 1" },
  { value: "2", label: "Year 2" },
  { value: "3", label: "Year 3" },
  { value: "4", label: "Year 4" },
  { value: "5+", label: "Year 5+" },
  { value: "graduate", label: "Graduate" },
];

export function hasSetupBasics(profile: ApiProfile | null) {
  return Boolean(
    profile?.program?.trim() && profile.year_of_study && (profile.interests?.length ?? 0) >= 3
  );
}

export function signedInDestination(
  profile: ApiProfile | null,
  setupDismissed = false
): SignedInDestination {
  return setupDismissed || (profile && Boolean(profile.is_profile_complete))
    ? "/(tabs)/home"
    : "/setup";
}

// ---------------------------------------------------------------------------
// Profile completeness and the nudge that follows from it
// ---------------------------------------------------------------------------

export interface ProfileGap {
  key: "program" | "year" | "interests" | "photo" | "headline";
  label: string;
  /** How much of the completeness bar this fills. */
  weight: number;
  /** Where the user goes to fix it. */
  route: string;
}

/**
 * What is missing, in the order it is worth asking for.
 *
 * Weighted by what each field actually buys the user, not by how easy it is to
 * collect. Interests lead because the match score leans on them hardest -- an
 * account with none is invisible to recommendations no matter how complete the
 * rest of the profile looks -- and a photo comes before a headline because a
 * faceless card is the one people scroll past.
 */
export function profileGaps(profile: ApiProfile | null): ProfileGap[] {
  if (!profile) return [];

  const gaps: ProfileGap[] = [];
  const interests = profile.interests?.length ?? 0;

  if (interests < 3) {
    gaps.push({
      key: "interests",
      label: interests === 0 ? "Add your interests" : "Add a few more interests",
      weight: 30,
      route: "/setup",
    });
  }
  if (!profile.program?.trim()) {
    gaps.push({ key: "program", label: "Add your programme", weight: 25, route: "/settings/edit-profile" });
  }
  if (!profile.year_of_study) {
    gaps.push({ key: "year", label: "Add your year of study", weight: 20, route: "/settings/edit-profile" });
  }
  if (!profile.profile_picture_url) {
    gaps.push({ key: "photo", label: "Add a profile photo", weight: 15, route: "/settings/edit-profile" });
  }
  if (!profile.profile_headline?.trim()) {
    gaps.push({ key: "headline", label: "Write a short headline", weight: 10, route: "/settings/edit-profile" });
  }

  return gaps;
}

/** 0-100. Everything present is 100; each gap subtracts its own weight. */
export function profileCompleteness(profile: ApiProfile | null): number {
  if (!profile) return 0;
  return Math.max(0, 100 - profileGaps(profile).reduce((total, gap) => total + gap.weight, 0));
}

/**
 * How long to leave someone alone after they dismiss the nudge.
 *
 * Escalating rather than fixed: the first dismissal is usually "not now", the
 * third is "stop asking". Backing off instead of repeating the same prompt is
 * the difference between a reminder and nagging, and nagging is how a banner
 * gets ignored permanently.
 */
export const NUDGE_BACKOFF_DAYS = [1, 3, 7, 21];

export function nudgeBackoffMs(dismissCount: number) {
  const days = NUDGE_BACKOFF_DAYS[Math.min(dismissCount, NUDGE_BACKOFF_DAYS.length - 1)];
  return days * 24 * 60 * 60 * 1000;
}
