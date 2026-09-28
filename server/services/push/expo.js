// services/push/expo.js
//
// The Expo push HTTP API and nothing else: no database, no users, no app
// concepts. Everything here takes tokens and messages and returns what Expo
// said, so it can be exercised without MySQL.

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// getReceipts, not getPushNotificationReceipts -- the latter 404s. Probed
// against the live API rather than trusted from memory.
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

// Expo's own per-request ceilings.
export const SEND_CHUNK_SIZE = 100;
export const RECEIPT_CHUNK_SIZE = 300;

export const isExpoPushToken = (token) =>
  typeof token === "string" &&
  /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token);

const headers = () => {
  const result = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  if (process.env.EXPO_ACCESS_TOKEN) {
    result.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }
  return result;
};

/**
 * Send up to SEND_CHUNK_SIZE messages. Returns one ticket per message, in the
 * same order, so tickets[i] describes messages[i].
 *
 * Expo rejects a whole request whose tokens belong to more than one Expo
 * project (PUSH_TOO_MANY_EXPERIENCE_IDS). That happens here because the app
 * moved projects: devices registered before the move still hold tokens from
 * the old one. The rejection lists which tokens belong to which project, so
 * the batch is re-sent once per project and the tickets stitched back into
 * the original order.
 */
export const sendBatch = async (messages) => {
  if (!messages.length) return [];

  const response = await fetch(EXPO_PUSH_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(messages),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload?.errors?.[0];
    if (error?.code === "PUSH_TOO_MANY_EXPERIENCE_IDS" && error.details) {
      return sendPerProject(messages, error.details);
    }
    throw new Error(
      `Expo push answered ${response.status}${error?.code ? ` (${error.code})` : ""}`
    );
  }

  return Array.isArray(payload?.data) ? payload.data : [];
};

const sendPerProject = async (messages, tokensByProject) => {
  const tickets = new Array(messages.length);

  for (const tokens of Object.values(tokensByProject)) {
    const members = new Set(tokens);
    const indexes = messages.flatMap((message, i) => (members.has(message.to) ? [i] : []));
    if (!indexes.length) continue;

    const groupTickets = await sendBatch(indexes.map((i) => messages[i]));
    indexes.forEach((messageIndex, j) => {
      tickets[messageIndex] = groupTickets[j];
    });
  }

  // Anything Expo did not attribute to a project gets an error ticket rather
  // than a hole, so callers can still index tickets[i] safely.
  return Array.from(tickets, (ticket) =>
    ticket ?? { status: "error", message: "Not attributed to any Expo project" }
  );
};

/** Look up receipts for up to RECEIPT_CHUNK_SIZE ticket ids, keyed by ticket id. */
export const getReceipts = async (ticketIds) => {
  if (!ticketIds.length) return {};

  const response = await fetch(EXPO_RECEIPTS_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ids: ticketIds }),
  });

  if (!response.ok) throw new Error(`Expo receipts answered ${response.status}`);

  const payload = await response.json();
  return payload?.data ?? {};
};
