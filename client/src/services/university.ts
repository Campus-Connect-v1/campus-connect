import { api, request, type ApiResult } from "./api";

/** A university option as returned by GET /university/domains. */
export interface UniversityOption {
  value: string; // email domain, e.g. "stanford.edu"
  label: string; // display name
  university_id: string; // e.g. "uni_1"
  logo_url?: string;
  location?: string;
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
}

interface DomainsResponse {
  message: string;
  count: number;
  universities: UniversityOption[];
}

/** Fetch the list of supported universities (optionally filtered by search). */
export function getUniversityDomains(
  search = "",
): Promise<ApiResult<UniversityOption[]>> {
  return request(async () => {
    const { data } = await api.get<DomainsResponse>("/university/domains", {
      params: search ? { search } : undefined,
    });
    return { data: data.universities };
  });
}

/** Extract the domain portion of an email, lowercased. */
export function domainOf(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

/**
 * Resolve a `university_id` from the user's email domain. Returns the id
 * (e.g. "uni_1") or null if the domain isn't a recognized university.
 */
export async function resolveUniversityIdFromEmail(
  email: string,
): Promise<string | null> {
  const domain = domainOf(email);
  if (!domain) return null;
  const result = await getUniversityDomains(domain);
  if (!result.success) return null;
  const match =
    result.data.find((u) => u.value.toLowerCase() === domain) ??
    result.data[0];
  return match?.university_id ?? null;
}
