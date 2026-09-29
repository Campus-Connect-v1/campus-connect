/**
 * The topics a post may be filed under.
 *
 * These are the home screen's category chips, and the list is deliberately
 * short. A taxonomy a student has to scroll is one they will not use, and an
 * empty category reads as a broken app rather than a quiet one.
 *
 * Not the interest vocabulary from PROFILE_INTERESTS: those are 16 fine
 * grained things a PERSON is into (Coding, Football, Photography), and these
 * are coarse buckets a POST belongs to. Football and Basketball are both
 * sports; nobody wants a chip each.
 *
 * "Events" is not here on purpose. The rail's Events chip opens the events
 * tab, where real Event rows live with times, places and RSVPs -- a post
 * tagged "events" would be a strictly worse version of that.
 */
export const POST_TOPICS = ["sports", "academic", "music", "food"];

/**
 * Normalises a client-supplied topic, or null.
 *
 * Returns null rather than throwing for anything unrecognised: a bad topic
 * should cost the post its chip, not its publication.
 */
export const normaliseTopic = (topic) => {
  if (typeof topic !== "string") return null;
  const value = topic.trim().toLowerCase();
  return POST_TOPICS.includes(value) ? value : null;
};
