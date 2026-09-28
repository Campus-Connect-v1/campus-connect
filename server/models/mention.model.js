// models/mention.model.js
import { db } from "../config/db.js";
import { extractMentionIds } from "../utils/mentions.js";

/**
 * How many mentions one piece of content may register.
 *
 * Past this the extra ids are ignored rather than rejected: the post still
 * publishes, it just does not turn into a fan-out to a hundred people. A cap
 * here is the difference between a mention and a broadcast channel.
 */
const MAX_MENTIONS = 10;

/**
 * Narrows the ids parsed out of content to people who may actually be
 * mentioned.
 *
 * The parser trusts nothing: the marker is user-submitted text, so an id in it
 * is a claim, not a fact. Anyone could hand-write `@[Dean](user_1)`. This is
 * the only thing that decides who really gets notified.
 *
 * `is_active = 1` matches what searchUsersModel already exposes, so the rule
 * is "you can mention anyone you could have found" -- including across
 * campuses, which is the same direction the feed and recommendations took.
 */
const resolveMentionables = async (ids, actorId) => {
  const wanted = ids.filter((id) => id !== actorId).slice(0, MAX_MENTIONS);
  if (!wanted.length) return [];

  const placeholders = wanted.map(() => "?").join(",");
  const [rows] = await db.execute(
    `SELECT user_id, first_name, last_name, email
       FROM users
      WHERE user_id IN (${placeholders})
        AND is_active = 1`,
    wanted
  );
  return rows;
};

/**
 * Rewrites the mention index for one piece of content and returns the people
 * who should be told about it.
 *
 * Rewritten wholesale rather than appended to, because this runs on edit as
 * well as create: a mention removed by an edit has to stop existing here. The
 * delete-then-insert is what makes the index match the text rather than the
 * history of the text.
 *
 * Returns only the NEWLY mentioned users. Editing a comment to fix a typo
 * should not notify everyone in it a second time.
 */
const syncMentions = async ({ table, column, id, content, actorId }) => {
  const parsed = extractMentionIds(content);
  const mentionable = await resolveMentionables(parsed, actorId);

  const [existing] = await db.execute(
    `SELECT user_id FROM ${table} WHERE ${column} = ?`,
    [id]
  );
  const alreadyMentioned = new Set(existing.map((row) => row.user_id));

  await db.execute(`DELETE FROM ${table} WHERE ${column} = ?`, [id]);

  if (mentionable.length) {
    const values = mentionable.map(() => "(?, ?)").join(",");
    await db.execute(
      `INSERT INTO ${table} (${column}, user_id) VALUES ${values}`,
      mentionable.flatMap((user) => [id, user.user_id])
    );
  }

  return mentionable.filter((user) => !alreadyMentioned.has(user.user_id));
};

/**
 * `table` and `column` are never caller-supplied -- they are the two literals
 * below. Interpolating an identifier is unavoidable for a shared helper, so
 * the values are pinned here rather than reaching this file from a request.
 */
export const syncPostMentions = ({ postId, content, actorId }) =>
  syncMentions({
    table: "post_mentions",
    column: "post_id",
    id: postId,
    content,
    actorId,
  });

export const syncCommentMentions = ({ commentId, content, actorId }) =>
  syncMentions({
    table: "comment_mentions",
    column: "comment_id",
    id: commentId,
    content,
    actorId,
  });
