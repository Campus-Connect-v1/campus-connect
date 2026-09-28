/**
 * The client half of the mention format the server writes: `@[label](user_id)`.
 *
 * Kept as a pure function with no React in it so it can be unit tested, and so
 * the composer (which needs token positions) and the renderer (which needs
 * segments) share exactly one definition of what a mention is.
 */

export interface MentionSegment {
  type: "mention";
  /** Shown to the reader, without the leading "@". */
  label: string;
  userId: string;
}

export interface TextSegment {
  type: "text";
  text: string;
}

export type ContentSegment = TextSegment | MentionSegment;

/**
 * Must stay in step with MENTION_SOURCE in server/utils/mentions.js. Both
 * halves are bounded -- the label cannot contain `]` or a newline, the id is
 * the character set user_id uses, capped at its varchar(50) -- so this cannot
 * run away on adversarial input.
 */
const MENTION_SOURCE = String.raw`@\[([^\]\n]{1,100})\]\(([A-Za-z0-9_-]{1,50})\)`;

/** A fresh regex per call: a shared /g regex carries `lastIndex` between calls. */
const pattern = () => new RegExp(MENTION_SOURCE, "g");

/**
 * Splits content into text and mention runs, in order.
 *
 * Always returns at least one segment for non-empty input, so a caller can
 * render the result without special-casing "no mentions".
 */
export function parseMentions(content: string | null | undefined): ContentSegment[] {
  if (!content) return [];

  const segments: ContentSegment[] = [];
  let cursor = 0;

  for (const match of content.matchAll(pattern())) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ type: "text", text: content.slice(cursor, start) });
    }
    segments.push({ type: "mention", label: match[1], userId: match[2] });
    cursor = start + match[0].length;
  }

  if (cursor < content.length) {
    segments.push({ type: "text", text: content.slice(cursor) });
  }
  return segments;
}

/** `@[Kofi](user_1) hi` -> `@Kofi hi`, for anywhere that cannot render spans. */
export function stripMentions(content: string | null | undefined): string {
  return content ? content.replace(pattern(), "@$1") : "";
}

/** True when there is anything to linkify, so a caller can skip the work. */
export function hasMentions(content: string | null | undefined): boolean {
  return Boolean(content) && new RegExp(MENTION_SOURCE).test(content as string);
}

/**
 * The @-token the caret currently sits in, or null.
 *
 * This is what drives the composer's autocomplete. It deliberately looks
 * backwards from the caret rather than scanning the whole string, so typing
 * "@" anywhere -- including mid-sentence -- opens the picker, while an email
 * address does not: the "@" has to start a word.
 */
export function activeMentionQuery(
  text: string,
  caret: number
): { query: string; start: number } | null {
  const upToCaret = text.slice(0, caret);
  const at = upToCaret.lastIndexOf("@");
  if (at === -1) return null;

  // Must start a word, or "name@school.edu.gh" would open the picker.
  const before = at > 0 ? upToCaret[at - 1] : " ";
  if (!/[\s\n([]/.test(before)) return null;

  const query = upToCaret.slice(at + 1);

  /**
   * A handle never contains whitespace, so the token ends at the first space.
   *
   * This is what closes the picker after an insert. The composer writes the
   * plain `@kofi.mensah ` -- not the marker -- so there is no `)` to end the
   * token on, and anything that tolerated a space would leave the picker open
   * over the next word the user typed.
   */
  if (/[\s\]()]/.test(query)) return null;
  if (query.length > 40) return null;

  return { query, start: at };
}

/**
 * Turns the composer's display text into what gets stored.
 *
 * The composer holds `@kofi.mensah`, because a React Native TextInput cannot
 * style part of its own value -- put the marker in there and the writer sees
 * `@[Kofi Mensah](user_12)` while typing. So the marker is only assembled on
 * submit, from the handles the user actually picked.
 *
 * `registry` maps handle -> user_id and is built as they pick. A handle that
 * is not in it stays plain text: typing `@someone` by hand, or editing a
 * picked name until it no longer matches, deliberately produces no link and
 * no notification.
 */
export function serializeMentions(
  text: string,
  registry: ReadonlyMap<string, string>
): string {
  if (!text || registry.size === 0) return text;

  // Longest first, so `kofi.mensah.ug` is consumed whole rather than matching
  // `kofi.mensah` and stranding `.ug`.
  const handles = [...registry.keys()].sort((a, b) => b.length - a.length);

  let out = text;
  for (const handle of handles) {
    const escaped = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // The @ must start a word (so an email is untouched), and the handle must
    // not be a prefix of a longer one still being typed.
    const pattern = new RegExp(`(^|[\\s(\\[])@${escaped}(?![\\w.-])`, "g");
    out = out.replace(pattern, (_match, prefix) => `${prefix}@[${handle}](${registry.get(handle)})`);
  }
  return out;
}

/**
 * The inverse of serializeMentions, for seeding an edit.
 *
 * Opening an existing post or comment in the composer would otherwise put the
 * stored `@[joyce.elli](user_3)` straight into the TextInput -- the same
 * brackets-and-id the composer exists to hide. This gives back the plain text
 * the writer expects plus the registry needed to turn it back into markers on
 * save, so editing a sentence around a mention does not quietly delete it.
 */
export function hydrateMentions(content: string | null | undefined): {
  text: string;
  registry: Map<string, string>;
} {
  const registry = new Map<string, string>();
  if (!content) return { text: "", registry };

  const text = content.replace(pattern(), (_match, label: string, userId: string) => {
    registry.set(label, userId);
    return `@${label}`;
  });

  return { text, registry };
}
