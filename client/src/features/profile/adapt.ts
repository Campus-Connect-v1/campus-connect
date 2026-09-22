import type { ApiProfile, ApiPublicUser } from "@/src/services/userServices";

/** What the profile screens render, whoever the profile belongs to. */
export interface DisplayProfile {
  id: string;
  name: string;
  handle: string;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  programme: string | null;
  year: string | null;
  university: string | null;
  interests: string[];
  age: number | null;
}

function ageFrom(dob: string | null | undefined) {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const age = Math.floor((Date.now() - born.getTime()) / 31557600000);
  return age > 0 && age < 120 ? age : null;
}

/**
 * A handle, derived from the email local part.
 *
 * The users table has no username column. Deriving one keeps the "@name" the
 * design calls for without inventing a field the API cannot round-trip — and
 * it is stable, which a random slug would not be.
 */
function handleFrom(email: string | null | undefined, id: string) {
  const local = email?.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "");
  return local && local.length > 1 ? local.toLowerCase() : id.slice(0, 8);
}

function yearLabel(year: ApiProfile["year_of_study"]) {
  if (!year) return null;
  if (year === "graduate") return "Graduate";
  if (year === "5+") return "Level 500+";
  return `Level ${Number(year) * 100}`;
}

/** The signed-in user's own record (GET /user/profile). */
export function adaptProfile(profile: ApiProfile): DisplayProfile {
  return {
    id: profile.id,
    name: [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim(),
    handle: handleFrom(profile.email, profile.id),
    email: profile.email,
    avatar: profile.profile_picture_url,
    bio: profile.bio,
    programme: profile.program,
    year: yearLabel(profile.year_of_study),
    university: null, // /user/profile returns university_id only, never its name.
    interests: (profile.interests ?? []).map((item) => item.interest_name).filter(Boolean),
    age: ageFrom(profile.date_of_birth),
  };
}

/** Somebody else's record (GET /user/:userId), which joins the university. */
export function adaptPublicUser(user: ApiPublicUser): DisplayProfile {
  return {
    id: user.user_id,
    name: [user.first_name, user.last_name].filter(Boolean).join(" ").trim(),
    handle: handleFrom(user.email, user.user_id),
    email: user.email,
    avatar: user.profile_picture_url,
    bio: user.bio ?? user.profile_headline,
    programme: user.program,
    year: yearLabel(user.year_of_study),
    university: user.university_name,
    interests: (user.interests ?? []).map((item) => item.interest_name).filter(Boolean),
    age: ageFrom(user.date_of_birth),
  };
}
