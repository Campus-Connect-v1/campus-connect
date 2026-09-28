/**
 * Mentions are stored inline in the text, as `@[Display Name](user_id)`.
 *
 * The alternative was a handle -- `@amab` -- but `users` has no username
 * column and never has. The only `username` in this codebase is on the Mongo
 * conversation participant, where conversation.controller.js overwrites it
 * with "first_name last_name" on every read: a display name with a space in
 * it, not unique, not indexed, not on the users table. Nothing to parse a
 * plain-text mention against.
 *
 * The other alternative was plain text plus character offsets in a join
 * table. Comments are editable, so every edit would invalidate every offset
 * after the edit point.
 *
 * Storing the marker inline means the mention survives an edit, because it
 * travels with the text it is part of. It resolves by user_id, so if handles
 * are ever added the stored data stays correct and only the display text
 * changes.
 *
 * The cost: anything that renders content WITHOUT parsing -- the operator
 * console, a notification body, an email -- would show the raw marker. That is
 * what `stripMentions` is for, and every such call site has to use it.
 */

/**
 * Deliberately strict. This pattern runs over user-submitted text, so it
 * matches the exact shape the composer writes and nothing else:
 *   - the label cannot contain `]` or a newline, so it cannot run away
 *   - the id is the character set user_id actually uses, bounded to its
 *     varchar(50), so a match cannot be longer than a real id
 * Both parts are bounded, so this cannot backtrack catastrophically.
 */
const MENTION_SOURCE = String.raw`@\[([^\]\n]{1,100})\]\(([A-Za-z0-9_-]{1,50})\)`;

/** A fresh regex per call: a shared /g regex carries `lastIndex` between calls. */
const pattern = () => new RegExp(MENTION_SOURCE, "g");

/**
 * The user ids mentioned in `content`, de-duplicated, in order of appearance.
 *
 * Mentioning the same person twice in one post is one mention, not two -- it
 * decides how many notification rows they get.
 */
export const extractMentionIds = (content) => {
  if (typeof content !== "string" || !content) return [];
  const ids = [];
  for (const match of content.matchAll(pattern())) {
    if (!ids.includes(match[2])) ids.push(match[2]);
  }
  return ids;
};

/**
 * `@[Ama Boateng](user_12)` -> `@Ama Boateng`.
 *
 * For every surface that shows content as plain text: notification bodies,
 * push payloads, the operator console, search snippets.
 */
export const stripMentions = (content) =>
  typeof content === "string" ? content.replace(pattern(), "@$1") : content;

/** Character count as a reader sees it, for length limits and previews. */
export const visibleLength = (content) => stripMentions(content ?? "").length;

/**
 * The short handle shown in place of a name: `@kofi.mensah`.
 *
 * Derived, never stored, and deliberately NOT what resolves the mention --
 * the user_id in the marker does that. Which matters, because this value is
 * not unique: `email` is unique but its LOCAL PART is not, and across 43
 * university domains `kofi.mensah@ug.edu.gh` and `kofi.mensah@knust.edu.gh`
 * both reduce to `kofi.mensah`. Since the feed and recommendations now cross
 * campuses, those two people can see each other. A handle that only has to be
 * readable can collide; one that has to resolve cannot.
 *
 * Prefers the email local part, because at a university that issues
 * first.last@ addresses it is exactly the handle people already know
 * themselves by. Falls back to the name when the local part is not
 * name-shaped -- some institutions issue student-ID addresses, and turning
 * `s.1234567@` into a public handle would publish the student's ID.
 */
export const mentionHandle = (user) => {
  const clean = (value) =>
    String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9._-]+/g, ".")
      .replace(/\.{2,}/g, ".")
      .replace(/^[.\-_]+|[.\-_]+$/g, "");

  const local = clean(String(user?.email ?? "").split("@")[0]);
  // "At least half letters" is what separates kofi.mensah from s.1234567 and
  // from a personal address like xxgamer2005.
  const letters = (local.match(/[a-z]/g) || []).length;
  if (local && letters >= Math.ceil(local.replace(/[^a-z0-9]/g, "").length / 2)) {
    return local.slice(0, 40);
  }

  const named = clean([user?.first_name, user?.last_name].filter(Boolean).join("."));
  return (named || "campus.user").slice(0, 40);
};
