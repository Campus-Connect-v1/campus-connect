// Send a one-off push notification to people who have the app installed.
//
// Previews by default and sends nothing until --send is passed, because a
// push cannot be recalled once it is on someone's lock screen.
//
//   # Preview who would receive it
//   node scripts/sendPush.js --all --title "Welcome to Campus Connect" --body "..."
//
//   # Send to yourself first (email or user id)
//   node scripts/sendPush.js --to you@example.com --title "..." --body "..." --send
//
//   # Then everyone
//   node scripts/sendPush.js --all --title "..." --body "..." --send
//
// Or through npm, from server/ -- note the -- before the flags:
//   npm run push -- --all --title "..." --body "..."
//
// {first_name} in the title or body is replaced per recipient, e.g.
//   --title "Welcome, {first_name}!"
//
// Recipients are users with at least one active device and push turned on in
// their settings. Quiet hours and the hourly ceiling are not applied -- this
// is a deliberate operator send, not app activity. Push only: no row is added
// to anyone's in-app notification list.
//
// Reads server/.env for the database connection, so it sends to whichever
// database that points at.

import dotenv from "dotenv";
import { db } from "../config/db.js";
import { sendToUsers } from "../services/push/index.js";

dotenv.config();

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

const title = option("title");
const body = option("body") ?? null;
const to = option("to");
const all = flag("all");
const send = flag("send");

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!title) fail('Missing --title "..."');
if (Boolean(to) === all) fail("Pass exactly one of --to <email or user id> or --all");

const personalise = (text, user) =>
  text == null ? text : text.replaceAll("{first_name}", user.first_name || "there");

const personalised = /\{first_name\}/.test(`${title} ${body ?? ""}`);

try {
  const [users] = await db.execute(
    `SELECT u.user_id, u.email, u.first_name,
            COUNT(pt.expo_push_token) AS devices,
            GROUP_CONCAT(DISTINCT pt.platform) AS platforms
     FROM users u
     JOIN user_push_tokens pt ON pt.user_id = u.user_id AND pt.is_active = 1
     WHERE u.notification_push = 1
       ${to ? "AND (u.email = ? OR u.user_id = ?)" : ""}
     GROUP BY u.user_id, u.email, u.first_name
     ORDER BY u.first_name`,
    to ? [to, to] : []
  );

  if (users.length === 0) {
    fail(
      to
        ? `${to} has no active device with push on. Open the app on your phone, log in and allow notifications, then retry.`
        : "Nobody currently has an active device with push on."
    );
  }

  console.log(`\n${users.length} recipient(s):`);
  for (const user of users) {
    console.log(`  ${user.first_name ?? "(no name)"} <${user.email}>  ${user.devices} device(s): ${user.platforms}`);
  }

  const sample = users[0];
  console.log(`\nTitle: ${personalise(title, sample)}`);
  if (body) console.log(`Body:  ${personalise(body, sample)}`);

  if (!send) {
    console.log("\nPreview only. Re-run with --send to deliver.\n");
    process.exit(0);
  }

  const data = { type: "system" };
  let accepted = 0;

  if (personalised) {
    // One recipient failing must not cost everyone after them their message.
    for (const user of users) {
      try {
        const result = await sendToUsers([user.user_id], {
          title: personalise(title, user),
          body: personalise(body, user),
          data,
        });
        accepted += result.accepted;
      } catch (error) {
        console.error(`  ${user.first_name ?? user.email}: ${error.message}`);
      }
    }
  } else {
    ({ accepted } = await sendToUsers(users.map((u) => u.user_id), { title, body, data }));
  }

  const total = users.reduce((sum, u) => sum + Number(u.devices), 0);
  console.log(`\nExpo accepted ${accepted} of ${total} device(s).`);
  if (accepted < total) {
    console.log("The rest were rejected; any uninstalled devices have been deactivated.");
  }
  console.log("");

  // sendToUsers records delivery tickets in the background so receipts can
  // prune dead tokens later; give those writes a moment before exiting.
  await new Promise((resolve) => setTimeout(resolve, 1500));
  process.exit(0);
} catch (error) {
  fail(`Send failed: ${error.message}`);
}
