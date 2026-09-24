// models/poll.model.js
import { v4 as uuidv4 } from "uuid";
import { db } from "../config/db.js";

// Whether a poll has closed is decided by the database clock, not the node
// process, so a skewed app server cannot accept a late vote or reject an
// early one.
const IS_CLOSED_EXPR =
  "(p.closes_at IS NOT NULL AND p.closes_at <= NOW()) AS is_closed";

// Create a poll
//
// A poll is a post: one row in `posts` with media_type='poll' so it lands in
// the existing feed with likes and comments, plus the poll and its options.
// All of it in one transaction -- a post with no options would render as an
// empty poll nobody could vote on or delete cleanly.
export const createPollModel = async (pollData) => {
  const conn = await db.getConnection();

  try {
    const {
      user_id,
      question,
      options,
      max_selections = 1,
      closes_at = null,
      allow_change = 1,
      visibility = "connections",
    } = pollData;

    const postId = `post_${uuidv4()}`;
    const pollId = `poll_${uuidv4()}`;

    await conn.beginTransaction();

    await conn.execute(
      `INSERT INTO posts (post_id, user_id, content, media_type, visibility)
       VALUES (?, ?, ?, 'poll', ?)`,
      [postId, user_id, question, visibility]
    );

    await conn.execute(
      `INSERT INTO polls (poll_id, post_id, question, max_selections, closes_at, allow_change)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [pollId, postId, question, max_selections, closes_at, allow_change]
    );

    // `position` is the client's display order and carries the UNIQUE that
    // stops two options claiming the same slot.
    for (const [index, optionText] of options.entries()) {
      await conn.execute(
        `INSERT INTO poll_options (option_id, poll_id, option_text, position)
         VALUES (?, ?, ?, ?)`,
        [`opt_${uuidv4()}`, pollId, optionText, index]
      );
    }

    await conn.commit();

    return { poll_id: pollId, post_id: postId };
  } catch (error) {
    await conn.rollback();
    throw new Error(`Database error in createPoll: ${error.message}`);
  } finally {
    conn.release();
  }
};

// Get a poll with its options, tallies and the caller's own selections
export const getPollByIdModel = async (pollId, userId) => {
  try {
    const [polls] = await db.execute(
      `SELECT
         p.poll_id,
         p.post_id,
         p.question,
         p.max_selections,
         p.closes_at,
         p.allow_change,
         p.created_at,
         ps.user_id,
         ps.visibility,
         u.first_name,
         u.last_name,
         u.profile_picture_url,
         ${IS_CLOSED_EXPR}
       FROM polls p
       JOIN posts ps ON p.post_id = ps.post_id
       JOIN users u ON ps.user_id = u.user_id
       WHERE p.poll_id = ? AND ps.is_active = 1`,
      [pollId]
    );

    if (polls.length === 0) {
      return null;
    }

    const [options, totalVoters, ownVotes] = await Promise.all([
      getPollOptionCountsModel(pollId),
      getPollVoterCountModel(pollId),
      getUserSelectionsModel(pollId, userId),
    ]);

    return {
      ...polls[0],
      is_closed: Boolean(polls[0].is_closed),
      options,
      total_voters: totalVoters,
      user_selections: ownVotes,
    };
  } catch (error) {
    throw new Error(`Database error in getPollById: ${error.message}`);
  }
};

// Per-option vote rows. LEFT JOIN so an option nobody picked still reports 0.
export const getPollOptionCountsModel = async (pollId) => {
  try {
    const [rows] = await db.execute(
      `SELECT
         o.option_id,
         o.option_text,
         o.position,
         COUNT(v.vote_id) AS vote_count
       FROM poll_options o
       LEFT JOIN poll_votes v ON v.option_id = o.option_id
       WHERE o.poll_id = ?
       GROUP BY o.option_id, o.option_text, o.position
       ORDER BY o.position ASC`,
      [pollId]
    );

    return rows.map((row) => ({ ...row, vote_count: Number(row.vote_count) }));
  } catch (error) {
    throw new Error(`Database error in getPollOptionCounts: ${error.message}`);
  }
};

// Turnout as DISTINCT people, not vote rows. A multi-select poll stores one
// row per chosen option, so counting rows would inflate turnout and drive the
// percentages above 100.
export const getPollVoterCountModel = async (pollId) => {
  try {
    const [rows] = await db.execute(
      `SELECT COUNT(DISTINCT user_id) AS total_voters
       FROM poll_votes
       WHERE poll_id = ?`,
      [pollId]
    );

    return Number(rows[0].total_voters);
  } catch (error) {
    throw new Error(`Database error in getPollVoterCount: ${error.message}`);
  }
};

export const getUserSelectionsModel = async (pollId, userId) => {
  try {
    const [rows] = await db.execute(
      `SELECT option_id
       FROM poll_votes
       WHERE poll_id = ? AND user_id = ?`,
      [pollId, userId]
    );

    return rows.map((row) => row.option_id);
  } catch (error) {
    throw new Error(`Database error in getUserSelections: ${error.message}`);
  }
};

// Results, served whether or not the poll is still open
export const getPollResultsModel = async (pollId) => {
  try {
    const [polls] = await db.execute(
      `SELECT
         p.poll_id,
         p.question,
         p.max_selections,
         p.closes_at,
         ${IS_CLOSED_EXPR}
       FROM polls p
       JOIN posts ps ON p.post_id = ps.post_id
       WHERE p.poll_id = ? AND ps.is_active = 1`,
      [pollId]
    );

    if (polls.length === 0) {
      return null;
    }

    const [options, totalVoters] = await Promise.all([
      getPollOptionCountsModel(pollId),
      getPollVoterCountModel(pollId),
    ]);

    return {
      ...polls[0],
      is_closed: Boolean(polls[0].is_closed),
      total_voters: totalVoters,
      // Share of VOTERS who picked this option, so on a multi-select poll the
      // columns can legitimately sum past 100% -- one person choosing both of
      // two options makes each 100%. Dividing by vote rows instead would
      // report 50/50 and understate both.
      options: options.map((option) => ({
        ...option,
        percentage:
          totalVoters === 0
            ? 0
            : Math.round((option.vote_count / totalVoters) * 1000) / 10,
      })),
    };
  } catch (error) {
    throw new Error(`Database error in getPollResults: ${error.message}`);
  }
};

// Cast or replace a vote
export const votePollModel = async (pollId, userId, optionIds) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // FOR UPDATE serialises concurrent votes on the same poll, so two requests
    // racing from one voter cannot both pass the allow_change check below and
    // leave twice the intended selections behind.
    const [polls] = await conn.execute(
      `SELECT
         p.poll_id,
         p.max_selections,
         p.allow_change,
         ${IS_CLOSED_EXPR}
       FROM polls p
       JOIN posts ps ON p.post_id = ps.post_id
       WHERE p.poll_id = ? AND ps.is_active = 1
       FOR UPDATE`,
      [pollId]
    );

    if (polls.length === 0) {
      throw new Error("Poll not found");
    }

    const poll = polls[0];

    if (poll.is_closed) {
      throw new Error("Poll is closed");
    }

    if (optionIds.length > poll.max_selections) {
      throw new Error(
        `Too many selections: this poll allows at most ${poll.max_selections}`
      );
    }

    // Every id must belong to THIS poll. Without the check a caller could pass
    // another poll's option ids and have them recorded against this poll_id.
    const placeholders = optionIds.map(() => "?").join(",");
    const [valid] = await conn.execute(
      `SELECT option_id
       FROM poll_options
       WHERE poll_id = ? AND option_id IN (${placeholders})`,
      [pollId, ...optionIds]
    );

    if (valid.length !== optionIds.length) {
      throw new Error(
        "Invalid option: one or more options do not belong to this poll"
      );
    }

    const [existing] = await conn.execute(
      `SELECT vote_id
       FROM poll_votes
       WHERE poll_id = ? AND user_id = ?`,
      [pollId, userId]
    );

    const isChange = existing.length > 0;

    if (isChange) {
      if (!poll.allow_change) {
        throw new Error(
          "Vote already recorded and this poll does not allow changes"
        );
      }

      // Replace rather than merge: the new selection is the whole answer. The
      // delete and the inserts share this transaction, so a failed re-vote
      // never leaves the voter with nothing recorded.
      await conn.execute(
        `DELETE FROM poll_votes WHERE poll_id = ? AND user_id = ?`,
        [pollId, userId]
      );
    }

    const voteRows = optionIds.map((optionId) => [
      `vote_${uuidv4()}`,
      pollId,
      optionId,
      userId,
    ]);

    await conn.query(
      `INSERT INTO poll_votes (vote_id, poll_id, option_id, user_id) VALUES ?`,
      [voteRows]
    );

    await conn.commit();

    return { poll_id: pollId, option_ids: optionIds, changed: isChange };
  } catch (error) {
    await conn.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Duplicate vote: that option is already selected");
    }

    throw new Error(`Database error in votePoll: ${error.message}`);
  } finally {
    conn.release();
  }
};

// Retract the caller's votes
export const retractVoteModel = async (pollId, userId) => {
  try {
    const [polls] = await db.execute(
      `SELECT p.poll_id, ${IS_CLOSED_EXPR}
       FROM polls p
       JOIN posts ps ON p.post_id = ps.post_id
       WHERE p.poll_id = ? AND ps.is_active = 1`,
      [pollId]
    );

    if (polls.length === 0) {
      throw new Error("Poll not found");
    }

    if (polls[0].is_closed) {
      throw new Error("Poll is closed");
    }

    const [result] = await db.execute(
      `DELETE FROM poll_votes WHERE poll_id = ? AND user_id = ?`,
      [pollId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error("No vote to retract");
    }

    return { success: true, removed: result.affectedRows };
  } catch (error) {
    throw new Error(`Database error in retractVote: ${error.message}`);
  }
};

// Delete a poll
//
// posts -> polls cascades, not the other way round, so the POST is the row to
// delete: it takes the poll, its options and its votes with it. Deleting the
// poll alone would strand a media_type='poll' post in the feed with nothing
// left to render.
export const deletePollModel = async (pollId, userId) => {
  try {
    const [polls] = await db.execute(
      `SELECT p.post_id, ps.user_id
       FROM polls p
       JOIN posts ps ON p.post_id = ps.post_id
       WHERE p.poll_id = ?`,
      [pollId]
    );

    if (polls.length === 0) {
      throw new Error("Poll not found");
    }

    if (polls[0].user_id !== userId) {
      throw new Error("Access denied: only the poll author can delete it");
    }

    await db.execute(`DELETE FROM posts WHERE post_id = ?`, [polls[0].post_id]);

    return { success: true };
  } catch (error) {
    throw new Error(`Database error in deletePoll: ${error.message}`);
  }
};
