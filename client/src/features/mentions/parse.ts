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

  // A completed mention is not a query. Once a marker has been inserted the
  // caret sits after ")", and its label may contain spaces, so bail on the
  // syntax rather than on whitespace alone.
  if (/[\]()\n]/.test(query)) return null;

  // One space is allowed so "@kofi m" still matches "Kofi Mensah"; two means
  // the user has moved on and is writing prose.
  if ((query.match(/ /g) || []).length > 1) return null;
  if (query.length > 40) return null;

  return { query, start: at };
}
