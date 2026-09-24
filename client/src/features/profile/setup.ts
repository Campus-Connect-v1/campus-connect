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
