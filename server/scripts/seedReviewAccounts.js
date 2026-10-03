// Accounts for Apple App Review (and Google Play review).
//
//   REVIEW_PASSWORD='…' node scripts/seedReviewAccounts.js          create / refresh
//   node scripts/seedReviewAccounts.js --clean                      remove all of it
//
// A reviewer signs in to a production build, so these accounts live in the
// production database. They are dropped into the busiest campus that
// seedDemoData.js populated, then given what a reviewer needs to see every
// feature working without having to create anything first: connections, an
// incoming request to accept, conversations with history, study groups,
// upcoming events and a fresh feed.
//
// Two accounts rather than one, so a reviewer can test messaging and
// connecting from both ends.
//
// Run this shortly before submitting. Posts and events are dated relative to
// NOW, and a feed seeded weeks earlier reads as stale by the time review
// happens. Re-running is safe: rows are keyed by fixed ids, and the relative
// dates are refreshed on every run.
//
// The password is NOT in this file: the repo is the last place a credential
// for a production account belongs. Without REVIEW_PASSWORD one is generated
// and printed once.
//
// EVERY id written carries a "_review_" marker, so --clean removes exactly
// what was seeded. The demo students it borrows are left as they were.

import dotenv from "dotenv";
import bcrypt from "bcrypt";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { db } from "../config/db.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

dotenv.config();

const TAG = "_review_";
const MARK = new RegExp(TAG);

/**
 * example.com is reserved (RFC 2606) and never delivers, so a reviewer who
 * taps "forgot password" sends mail nowhere rather than to a stranger.
 */
const ACCOUNTS = [
  {
    id: `user${TAG}1`,
    email: "appreview1@example.com",
    first: "Ama",
    last: "Mensah",
    gender: "F",
    program: "Computer Science",
    year: 2,
    bio: "Building things that help students. Hackathon regular, jollof critic, hall rep.",
    avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80&auto=format&fit=crop",
    interests: [["academic", "Machine Learning"], ["career", "Software Engineering"], ["sports", "Football"], ["arts", "Afrobeats Production"]],
    courses: [["CS201", "Data Structures and Algorithms"], ["CS305", "Database Systems"], ["CS360", "Computer Networks"]],
  },
  {
    id: `user${TAG}2`,
    email: "appreview2@example.com",
    first: "Kwame",
    last: "Asante",
    gender: "M",
    program: "Computer Science",
    year: 2,
    bio: "Backend dev in training. Always up for a study session or a game of FIFA.",
    avatar: "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&q=80&auto=format&fit=crop",
    interests: [["academic", "Data Analysis"], ["hobby", "Chess"], ["sports", "Basketball"]],
    courses: [["CS201", "Data Structures and Algorithms"], ["CS305", "Database Systems"]],
  },
];

const insert = async (table, columns, rows) => {
  if (!rows.length) return 0;
  const tuple = `(${columns.map(() => "?").join(",")})`;
  const [r] = await db.query(
    `INSERT IGNORE INTO ${table} (${columns.join(",")}) VALUES ${rows.map(() => tuple).join(",")}`,
    rows.flat()
  );
  return r.affectedRows;
};

// ---------------------------------------------------------------------------
const clean = async () => {
  console.log("\nRemoving review accounts…\n");

  const conversations = await Conversation.deleteMany({ "participants.userId": MARK });
  const messages = await Message.deleteMany({ $or: [{ senderId: MARK }, { receiverId: MARK }] });
  console.log(`  ${"conversations (mongo)".padEnd(24)} -${conversations.deletedCount}`);
  console.log(`  ${"messages (mongo)".padEnd(24)} -${messages.deletedCount}`);

  const steps = [
    ["event_attendees", "attendee_id"],
    ["events", "event_id"],
    ["group_members", "group_member_id"],
    ["post_comments", "comment_id"],
    ["post_likes", "like_id"],
    ["posts", "post_id"],
    ["connections", "connection_id"],
    ["user_courses", "user_id"],
    ["user_interests", "interest_id"],
    ["user_privacy_settings", "user_id"],
    ["users", "user_id"],
  ];
  for (const [table, col] of steps) {
    const [r] = await db.execute(`DELETE FROM ${table} WHERE ${col} LIKE ?`, [`%${TAG}%`]);
    if (r.affectedRows) console.log(`  ${table.padEnd(24)} -${r.affectedRows}`);
  }
  console.log("\n✓ Review accounts removed. Demo students untouched.\n");
};

// ---------------------------------------------------------------------------
const seed = async (password) => {
  // The campus with the most demo students, so Connect, Events and the map
  // have the most to show.
  const [[campus]] = await db.execute(
    `SELECT u.university_id, v.name, COUNT(*) n
       FROM users u JOIN universities v USING (university_id)
      WHERE u.user_id LIKE '%\\_demo\\_%'
      GROUP BY u.university_id, v.name ORDER BY n DESC LIMIT 1`
  );
  if (!campus) throw new Error("No demo students. Run scripts/seedDemoData.js first.");
  const uni = campus.university_id;

  const [locals] = await db.execute(
    `SELECT user_id, first_name, last_name, email FROM users
      WHERE university_id = ? AND user_id LIKE '%\\_demo\\_%'
      ORDER BY CAST(SUBSTRING_INDEX(user_id, '_', -1) AS UNSIGNED) LIMIT 16`,
    [uni]
  );
  if (locals.length < 12) throw new Error(`Only ${locals.length} demo students at ${campus.name}; need 12.`);
  const [me, friend] = ACCOUNTS;

  // ---- accounts ----------------------------------------------------------
  // Upsert rather than INSERT IGNORE: re-running with a new REVIEW_PASSWORD
  // must actually change the password.
  const hash = await bcrypt.hash(password, 12);
  for (const a of ACCOUNTS) {
    await db.execute(
      `INSERT INTO users
         (user_id, university_id, email, password_hash, first_name, last_name, gender,
          program, graduation_year, year_of_study, bio, profile_headline, profile_picture_url,
          privacy_profile, is_active, is_email_verified, is_edu_verified, is_profile_complete,
          timezone, auth_provider, last_login)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'public', 1, 1, 1, 1, 'Africa/Accra', 'email', NOW())
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), university_id = VALUES(university_id),
         is_active = 1, is_email_verified = 1, is_profile_complete = 1, last_login = NOW()`,
      [a.id, uni, a.email, hash, a.first, a.last, a.gender, a.program, 2026 + (5 - a.year),
       String(a.year), a.bio, `${a.program} · Year ${a.year}`, a.avatar]
    );
  }
  await insert("user_privacy_settings",
    ["user_id", "profile_visibility", "custom_radius", "show_exact_location", "visible_fields"],
    ACCOUNTS.map((a) => [a.id, "public", 500, 0, JSON.stringify(["program", "year_of_study", "interests"])]));
  await insert("user_interests", ["interest_id", "user_id", "interest_type", "interest_name", "skill_level"],
    ACCOUNTS.flatMap((a) => a.interests.map(([type, name]) => [`int${TAG}${a.id}_${type}`, a.id, type, name, "intermediate"])));
  // user_courses is keyed by an auto-increment id, so INSERT IGNORE cannot
  // dedupe it: clear and rewrite instead.
  await db.execute(`DELETE FROM user_courses WHERE user_id LIKE ?`, [`%${TAG}%`]);
  await insert("user_courses", ["user_id", "course_code", "course_name", "semester", "academic_year", "is_current"],
    ACCOUNTS.flatMap((a) => a.courses.map(([code, name]) => [a.id, code, name, "First Semester", 2026, 1])));

  // ---- connections -------------------------------------------------------
  // Accepted with the other reviewer and most of the campus; two requests
  // waiting to be accepted, so the request flow has something in it.
  const conn = [[`conn${TAG}0`, me.id, friend.id, "accepted", "Same CS201 class."]];
  locals.slice(0, 9).forEach((u, i) =>
    conn.push([`conn${TAG}a${i}`, u.user_id, me.id, "accepted", i % 2 ? "Same hall of residence." : "We take the same course."]));
  locals.slice(9, 11).forEach((u, i) =>
    conn.push([`conn${TAG}p${i}`, u.user_id, me.id, "pending", "Met at orientation."]));
  locals.slice(0, 5).forEach((u, i) =>
    conn.push([`conn${TAG}b${i}`, u.user_id, friend.id, "accepted", null]));
  await insert("connections", ["connection_id", "requester_id", "receiver_id", "status", "connection_note"], conn);

  // ---- study groups: join the ones this campus already belongs to ---------
  const [groups] = await db.execute(
    `SELECT DISTINCT g.group_id FROM study_groups g
       JOIN group_members m ON m.group_id = g.group_id
       JOIN users u ON u.user_id = m.user_id
      WHERE u.university_id = ? AND g.is_active = 1 LIMIT 3`,
    [uni]
  );
  await insert("group_members", ["group_member_id", "group_id", "user_id", "role", "notification_preferences"],
    groups.flatMap((g, i) => [
      [`gm${TAG}${i}a`, g.group_id, me.id, "member", "all"],
      ...(i === 0 ? [[`gm${TAG}${i}b`, g.group_id, friend.id, "member", "all"]] : []),
    ]));

  // ---- events: always in the future, whenever this runs ------------------
  const EVENTS = [
    ["Freshers' Night Market & Live Sessions", "social", "Food stalls, student bands and an open mic. Bring friends.", 3, 18, "Great Hall Lawn", 300],
    ["Inter-hall Basketball Final", "sports", "The final of the inter-hall league. Wear your hall colours.", 6, 16, "Sports Complex", 400],
    ["Intro to Machine Learning Workshop", "academic", "Hands-on session for beginners. Laptops required, no experience needed.", 9, 14, "ICT Centre", 60],
    ["Startup Founders Mixer", "career", "Meet student founders and alumni who have built companies.", 14, 18, "Main Auditorium", 120],
  ];
  for (const [i, [title, type, desc, day, hour, place, cap]] of EVENTS.entries()) {
    await db.execute(
      `INSERT INTO events (event_id, university_id, created_by, event_title, event_description, event_type,
          start_time, end_time, location_type, physical_location, max_attendees, requires_rsvp, is_public)
       VALUES (?,?,?,?,?,?, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL ? DAY), INTERVAL ? HOUR),
               DATE_ADD(DATE_ADD(CURDATE(), INTERVAL ? DAY), INTERVAL ? HOUR), 'physical', ?, ?, 1, 1)
       ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time)`,
      [`evt${TAG}${i}`, uni, locals[i].user_id, title, desc, type, day, hour, day, hour + 3, place, cap]
    );
  }
  const att = [];
  EVENTS.forEach((_, e) => {
    locals.slice(e, e + 8).forEach((u, j) => att.push([`att${TAG}${e}_${j}`, `evt${TAG}${e}`, u.user_id, j % 3 ? "going" : "interested"]));
  });
  att.push([`att${TAG}me0`, `evt${TAG}0`, me.id, "going"], [`att${TAG}fr0`, `evt${TAG}0`, friend.id, "going"]);
  await insert("event_attendees", ["attendee_id", "event_id", "user_id", "rsvp_status"], att);

  // ---- posts: a fresh feed ----------------------------------------------
  const POSTS = [
    [me.id, "Hackathon squad is complete 🚀 36 hours, zero sleep, one very good idea. Wish us luck!", 1],
    [locals[0].user_id, "Who else is going to the Night Market on Friday? Looking for people to go with 🎶", 2],
    [friend.id, "CS201 people: I've put together notes on recursion and dynamic programming. DM me if you want a copy.", 4],
    [locals[1].user_id, "The library's group study rooms are now bookable until 10pm. Finally!", 7],
    [locals[2].user_id, "Lost a blue water bottle near the Science Block this morning. Please message me if you found it 🙏", 11],
    [me.id, "First week back done ✅ What's everyone's favourite spot on campus to study?", 26],
    [locals[3].user_id, "Our hall basketball team made the final 🏀 Come support us next week!", 30],
  ];
  for (const [i, [author, content, hoursAgo]] of POSTS.entries()) {
    await db.execute(
      `INSERT INTO posts (post_id, user_id, content, media_type, visibility, is_active, created_at)
       VALUES (?, ?, ?, 'text', 'public', 1, DATE_SUB(NOW(), INTERVAL ? HOUR))
       ON DUPLICATE KEY UPDATE created_at = VALUES(created_at)`,
      [`post${TAG}${i}`, author, content, hoursAgo]
    );
  }
  const likes = [], comments = [];
  const COMMENTS = ["Good luck!! 🔥", "Count me in", "This is so useful, thank you", "Same here 😅", "See you there!"];
  POSTS.forEach((_, p) => {
    locals.slice(p, p + 3 + (p % 4)).forEach((u, j) => likes.push([`lk${TAG}${p}_${j}`, `post${TAG}${p}`, u.user_id]));
    locals.slice(p + 4, p + 6).forEach((u, j) =>
      comments.push([`cmt${TAG}${p}_${j}`, `post${TAG}${p}`, u.user_id, COMMENTS[(p + j) % COMMENTS.length], 1]));
  });
  likes.push([`lk${TAG}fr0`, `post${TAG}0`, friend.id]);
  comments.push([`cmt${TAG}fr0`, `post${TAG}0`, friend.id, "Let's goooo 🚀", 1]);
  await insert("post_likes", ["like_id", "post_id", "user_id"], likes);
  await insert("post_comments", ["comment_id", "post_id", "user_id", "content", "is_active"], comments);

  // ---- conversations (MongoDB) --------------------------------------------
  // Rebuilt on every run, so message times stay recent.
  await Conversation.deleteMany({ "participants.userId": MARK });
  await Message.deleteMany({ $or: [{ senderId: MARK }, { receiverId: MARK }] });

  const person = (u) => u.email
    ? { userId: u.id ?? u.user_id, email: u.email, username: `${u.first ?? u.first_name} ${u.last ?? u.last_name}` }
    : null;
  const THREADS = [
    [person(friend), [
      [1, "Are you free to go over recursion before Thursday's quiz? 🤯", 180],
      [0, "Yes! Library 2B is free after 4", 175],
      [1, "Perfect. I'll bring last year's past questions 📚", 170],
      [0, "Booked 2B for 4 ✅ see you there", 30],
    ]],
    [person(locals[0]), [
      [1, "Hey! Saw you're going to the Night Market too", 600],
      [0, "Yes! A few of us from Hall 3 are going, you should join", 590],
      [1, "Sounds good, I'll message you on Friday 🙌", 560],
    ]],
    [person(locals[1]), [
      [1, "Hi Ama, are you in the ML study circle? Do you have the slides from Tuesday?", 1500],
      [0, "Yes, I'll send them tonight!", 1440],
    ]],
  ];
  const meP = person(me);
  for (const [other, msgs] of THREADS) {
    const convo = await Conversation.create({
      participants: [meP, other],
      unreadCount: new Map([[meP.userId, msgs.at(-1)[0] === 1 ? 1 : 0], [other.userId, 0]]),
    });
    let last;
    for (const [fromOther, content, minsAgo] of msgs) {
      const at = new Date(Date.now() - minsAgo * 60_000);
      const [from, to] = fromOther ? [other, meP] : [meP, other];
      last = await Message.create({ senderId: from.userId, receiverId: to.userId, content, status: "read", createdAt: at, updatedAt: at });
    }
    convo.lastMessage = { content: last.content, senderId: last.senderId, timestamp: last.createdAt };
    await convo.save();
  }

  return { campus, groups: groups.length, connections: conn.length, events: EVENTS.length, posts: POSTS.length, threads: THREADS.length };
};

// ---------------------------------------------------------------------------
const main = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set.");
    await mongoose.connect(process.env.MONGO_URI);

    if (process.argv.includes("--clean")) {
      await clean();
      return;
    }

    const generated = !process.env.REVIEW_PASSWORD;
    const password = process.env.REVIEW_PASSWORD || `Campus-${crypto.randomBytes(4).toString("hex")}-Review!`;
    const r = await seed(password);

    console.log(`\n✓ Review accounts ready at ${r.campus.name}\n`);
    for (const a of ACCOUNTS) console.log(`  ${a.first} ${a.last}`.padEnd(18) + a.email);
    console.log(`  password          ${password}${generated ? "   (generated: save it now, it is not stored anywhere)" : ""}`);
    console.log(`\n  ${r.connections} connections · ${r.groups} study groups · ${r.events} upcoming events · ${r.posts} posts · ${r.threads} chats`);
    console.log("  Remove everything with: node scripts/seedReviewAccounts.js --clean\n");
  } catch (error) {
    console.error(`\n✗ ${error.message}\n`, error.stack?.split("\n")[1] || "");
    process.exitCode = 1;
  } finally {
    await db.end().catch(() => {});
    await mongoose.disconnect().catch(() => {});
  }
};

main();
