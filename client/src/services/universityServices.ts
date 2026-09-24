import { api, request } from "./api";

export interface UniversityOption {
  value: string; // email domain, e.g. "stanford.edu"
  label: string;
  university_id: string; // matches the server's /^uni_\d+$/
  logo_url: string | null;
  location: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
}

/**
 * Registration requires a `university_id`, and this is the only endpoint that
 * can supply one.
 *
 * NOTE: the server filters this list on `is_verified = 1`. A university row
 * that exists but is unverified will not appear here, and sign-up will then be
 * impossible for its students even though the row is in the table.
 */
export async function fetchUniversities(search = "") {
  const result = await request<{ universities?: UniversityOption[] }>(() =>
    api.get("/university/domains", { params: search ? { search } : undefined })
  );
  if (!result.success) throw new Error(result.error);
  return result.data.universities ?? [];
}

/** Picks the university whose domain matches the email the user typed. */
export function matchUniversityByEmail(email: string, universities: UniversityOption[]) {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return undefined;
  return universities.find((uni) => domain === uni.value || domain.endsWith(`.${uni.value}`));
}

/**
 * Resolves a `university_id` to its record.
 *
 * GET /user/profile returns only the id, and there is no GET /university/:id,
 * so this filters the domains list — the one endpoint that exposes names. The
 * list is small and rarely changes, hence the module-level cache: without it
 * every screen that wants to print the campus name refetches the whole table.
 */
let cache: UniversityOption[] | null = null;

export async function fetchUniversityById(universityId: string) {
  await primeUniversities();
  return cache?.find((uni) => uni.university_id === universityId) ?? null;
}

/**
 * Loads the university list once per session.
 *
 * The promise is cached rather than the value, so several screens mounting at
 * once share one request instead of racing three.
 */
let priming: Promise<void> | null = null;

export function primeUniversities(): Promise<void> {
  priming ??= fetchUniversities()
    .then((list) => {
      cache = list;
    })
    .catch(() => {
      // Left uncached so a later call can retry rather than being stuck empty.
      priming = null;
    });
  return priming;
}

/** Synchronous read of the primed list. Null until `primeUniversities` lands. */
export function universityFromCache(universityId: string): UniversityOption | null {
  return cache?.find((uni) => uni.university_id === universityId) ?? null;
}
