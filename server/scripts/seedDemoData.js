// Realistic demo data for frontend development.
//
//   node scripts/seedDemoData.js          populate
//   node scripts/seedDemoData.js --clean  remove every row it created
//
// EVERY id this script writes carries a "_demo_" marker, so --clean removes
// exactly what was seeded and nothing else. Real data is never matched.
// Deleting the demo users cascades their posts, connections, RSVPs and
// memberships, so cleanup is short by design.
//
// Universities are NOT created or removed here -- those are real records.
//
// Rows are inserted in batches. Single-row inserts against a remote database
// spend nearly all their time on round trips: ~6,000 rows at ~60ms each would
// take six minutes, where batches of 200 take seconds.

import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { db } from "../config/db.js";
import * as C from "./lib/demoContent.js";

dotenv.config();

export const DEMO_PASSWORD = "CampusTest!2026";
const DEMO = "_demo_";

// Deterministic PRNG so repeated runs produce the same dataset, which keeps
// frontend bugs reproducible instead of shifting under you.
let seed = 20260921;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const pick = (a) => a[Math.floor(rnd() * a.length)];
const pickN = (a, n) => {
  const copy = [...a];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  }
  return out;
};
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const chance = (p) => rnd() < p;

// ---------------------------------------------------------------------------
const insertMany = async (table, columns, rows) => {
  if (!rows.length) return 0;
  const CHUNK = 200;
  let affected = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const tuple = `(${columns.map(() => "?").join(",")})`;
    const [r] = await db.query(
      `INSERT IGNORE INTO ${table} (${columns.join(",")}) VALUES ${chunk
        .map(() => tuple)
        .join(",")}`,
      chunk.flat()
    );
    affected += r.affectedRows;
  }
  return affected;
};

const clean = async () => {
  console.log("\nRemoving demo data…\n");
  const steps = [
    ["event_attendees", "attendee_id"],
    ["events", "event_id"],
    ["group_members", "group_member_id"],
    ["study_groups", "group_id"],
    ["post_comments", "comment_id"],
    ["post_likes", "like_id"],
    ["posts", "post_id"],
    ["connections", "connection_id"],
    ["campus_facilities", "facility_id"],
    ["campus_buildings", "building_id"],
    ["university_departments", "department_id"],
    ["users", "user_id"],
  ];
  for (const [table, col] of steps) {
    const [r] = await db.execute(
      `DELETE FROM ${table} WHERE ${col} LIKE ?`,
      [`%${DEMO}%`]
    );
    if (r.affectedRows) console.log(`  ${table.padEnd(24)} -${r.affectedRows}`);
  }
  console.log("\n✓ Demo data removed. Universities and operators untouched.\n");
};

const seedData = async () => {
  const [allUnis] = await db.execute(
    `SELECT university_id, name, domain FROM universities
     ORDER BY CAST(SUBSTRING(university_id,5) AS UNSIGNED)`
  );
  if (!allUnis.length) throw new Error("No universities. Import the seed pack first.");

  // 15 campuses, so cross-campus behaviour has somewhere to happen, with
  // deliberately uneven sizes: a couple of large campuses, several mid, a few
  // nearly empty. Uniform counts hide pagination and empty-state bugs.
  const campuses = pickN(allUnis, Math.min(15, allUnis.length)).map((u, i) => ({
    ...u,
    size: i < 2 ? int(34, 42) : i < 5 ? int(18, 26) : i < 11 ? int(9, 15) : int(2, 5),
  }));

  console.log(`\nSeeding ${campuses.length} campuses\n`);
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const counts = {};
  const set = (k, v) => (counts[k] = v);

  // ---- reference data ----------------------------------------------------
  const deptRows = [], bldRows = [], facRows = [];
  let dn = 0, bn = 0, fn = 0;
  const buildingsByUni = {};

  for (const c of campuses) {
    for (const [code, name] of pickN(C.DEPARTMENTS, int(5, 9))) {
      deptRows.push([`dep${DEMO}${++dn}`, c.university_id, code, name,
                     `${name} at ${c.name}.`]);
    }
    for (const [code, name, type] of pickN(C.BUILDINGS, int(4, 7))) {
      const id = `bld${DEMO}${++bn}`;
      bldRows.push([id, c.university_id, code, name, type,
                    (5.55 + rnd() * 5.2).toFixed(6), (-3.0 + rnd() * 3.0).toFixed(6),
                    int(1, 6), chance(0.85) ? 1 : 0]);
      (buildingsByUni[c.university_id] ||= []).push(id);
      for (const [fname, ftype, cap] of pickN(C.FACILITIES, int(2, 4))) {
        facRows.push([`fac${DEMO}${++fn}`, id, fname, ftype, cap, int(1, 3),
                      `${int(1, 3)}${String(int(1, 24)).padStart(2, "0")}`,
                      ftype === "study_room" ? 1 : 0, "Mon-Fri 08:00-20:00"]);
      }
    }
  }
  set("departments", await insertMany("university_departments",
    ["department_id","university_id","department_code","department_name","description"], deptRows));
  set("buildings", await insertMany("campus_buildings",
    ["building_id","university_id","building_code","building_name","building_type",
     "latitude","longitude","floors","is_accessible"], bldRows));
  set("facilities", await insertMany("campus_facilities",
    ["facility_id","building_id","facility_name","facility_type","capacity",
     "floor","room_number","is_reservable","operating_hours"], facRows));

  // ---- students ----------------------------------------------------------
  const users = [];
  const userRows = [], privacyRows = [], courseRows = [], interestRows = [], availRows = [];
  let n = 0;

  for (const c of campuses) {
    for (let i = 0; i < c.size; i++) {
      const female = chance(0.48);
      const first = female ? pick(C.FIRST_F) : pick(C.FIRST_M);
      const last = pick(C.LAST);
      const [program, pcode] = pick(C.PROGRAMS);
      const year = int(1, 4);
      const id = `user${DEMO}${++n}`;
      const slug = `${first.toLowerCase().replace(/ /g, ".")}.${last.toLowerCase()}`;

      userRows.push([
        id, c.university_id, `${slug}${n}@${c.domain}`, hash, first, last,
        female ? "F" : "M", program, 2026 + (5 - year), String(year),
        `${["Second","Third","Final","First"][year % 4]}-year ${program} student at ${c.name}. ` +
          pick(["Interested in research.","Looking for study partners.",
                "Open to project collaborations.","Happy to help juniors with coursework.",
                "Also in the inter-university study network.","Focused on final-year project work."]),
        `${program} · Year ${year}`,
        `https://i.pravatar.cc/300?img=${(n % 70) + 1}`,
        `+2332${String(int(10000000, 99999999))}`,
        pick(["public","public","university","friends"]),
        int(1, 700),
      ]);

      privacyRows.push([id, pick(["public","geofenced","friends_only"]),
        pick([100,250,500]), chance(0.3) ? 1 : 0,
        JSON.stringify(["program","year_of_study","interests"])]);

      const courses = pickN(C.COURSES[pcode] || C.COURSES.CS, int(3, 5));
      for (const [code, name] of courses) {
        courseRows.push([id, code, name,
          pick(["First Semester","Second Semester"]), 2026, 1]);
      }
      for (const type of pickN(Object.keys(C.INTERESTS), int(2, 4))) {
        interestRows.push([`int${DEMO}${id}_${type}`, id, type,
          pick(C.INTERESTS[type]), pick(["beginner","intermediate","advanced","expert"])]);
      }
      for (const day of pickN(["monday","tuesday","wednesday","thursday","friday","saturday"], int(2, 4))) {
        const start = int(8, 17);
        availRows.push([`av${DEMO}${id}_${day}`, id, day,
          `${String(start).padStart(2,"0")}:00:00`,
          `${String(Math.min(start + int(1,3), 21)).padStart(2,"0")}:00:00`,
          pick(["studying","social","sports","meetings"]), 1]);
      }

      users.push({ id, first, last, uni: c.university_id, pcode, year,
                   courses: courses.map((x) => x[0]) });
    }
  }

  set("users", await insertMany("users",
    ["user_id","university_id","email","password_hash","first_name","last_name","gender",
     "program","graduation_year","year_of_study","bio","profile_headline",
     "profile_picture_url","phone_number","privacy_profile","last_login"],
    userRows.map((r) => r.slice(0, 15).concat([null])) ));
  // last_login is relative, so it is applied after insert in one statement
  // rather than with a per-row expression.
  await db.execute(
    `UPDATE users SET last_login = DATE_SUB(NOW(), INTERVAL FLOOR(RAND()*700) HOUR),
            is_active = 1, is_email_verified = 1, is_edu_verified = 1,
            is_profile_complete = 1, timezone = 'Africa/Accra', auth_provider = 'email'
     WHERE user_id LIKE ?`,
    [`%${DEMO}%`]
  );

  set("privacy_settings", await insertMany("user_privacy_settings",
    ["user_id","profile_visibility","custom_radius","show_exact_location","visible_fields"], privacyRows));
  set("courses", await insertMany("user_courses",
    ["user_id","course_code","course_name","semester","academic_year","is_current"], courseRows));
  set("interests", await insertMany("user_interests",
    ["interest_id","user_id","interest_type","interest_name","skill_level"], interestRows));
  set("availability", await insertMany("user_availability",
    ["availability_id","user_id","day_of_week","start_time","end_time","preferred_activity","is_recurring"], availRows));

  // ---- connections: intra-campus dense, inter-campus sparse --------------
  const byUni = {};
  users.forEach((u) => (byUni[u.uni] ||= []).push(u));

  const connRows = [];
  const seen = new Set();
  let cn = 0;
  const addEdge = (a, b, note) => {
    if (a.id === b.id) return;
    const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    const [x, y] = a.id < b.id ? [a, b] : [b, a];
    connRows.push([`conn${DEMO}${++cn}`, x.id, y.id,
      chance(0.74) ? "accepted" : chance(0.7) ? "pending" : "declined", note]);
  };

  // Same campus: people know several others, more if they share a course.
  for (const list of Object.values(byUni)) {
    for (const a of list) {
      const classmates = list.filter(
        (b) => b.id !== a.id && b.courses.some((c) => a.courses.includes(c))
      );
      for (const b of pickN(classmates, int(2, 5))) addEdge(a, b, "We take the same course.");
      for (const b of pickN(list, int(2, 4))) {
        addEdge(a, b, pick([null, "Same hall of residence.", "Met at orientation."]));
      }
    }
  }
  const intra = connRows.length;

  // Across campuses: far fewer, and attached to a plausible reason. Roughly a
  // fifth of students know someone at another university.
  for (const a of users) {
    if (!chance(0.22)) continue;
    const others = users.filter((b) => b.uni !== a.uni);
    for (const b of pickN(others, int(1, 3))) {
      addEdge(a, b, pick([
        "Met at the inter-university hackathon.",
        "Same national study group.",
        "Met at the sports festival.",
        "Introduced through the design exchange.",
        "We were at the same senior high school.",
      ]));
    }
  }
  set("connections_intra", intra);
  set("connections_inter", connRows.length - intra);
  await insertMany("connections",
    ["connection_id","requester_id","receiver_id","status","connection_note"], connRows);

  // ---- study groups: local and national ---------------------------------
  const groupRows = [], memberRows = [];
  let gn = 0, gmn = 0;

  for (const [name, course, freq, loc] of C.LOCAL_GROUPS) {
    const c = pick(campuses);
    const pool = byUni[c.university_id] || [];
    if (pool.length < 3) continue;
    const members = pickN(pool, Math.min(pool.length, int(4, 9)));
    const gid = `grp${DEMO}${++gn}`;
    groupRows.push([gid, c.university_id, name,
      `${name} — meets to work through problem sets and past papers.`,
      course, (C.COURSES[Object.keys(C.COURSES).find((k) => C.COURSES[k].some(([cc]) => cc === course))] || [])
        .find(([cc]) => cc === course)?.[1] || name,
      pick(["public","public","private","invite_only"]), int(10, 25), freq, loc,
      members[0].id, 1]);
    members.forEach((m, i) => memberRows.push([`gm${DEMO}${++gmn}`, gid, m.id,
      i === 0 ? "creator" : i === 1 ? "admin" : "member", pick(["all","important"])]));
  }
  const localGroups = groupRows.length;

  // National groups: one university owns the row, members come from several.
  // This is the inter-school shape the app has to render.
  for (const [name, course, freq, loc] of C.NATIONAL_GROUPS) {
    const host = pick(campuses);
    const spread = pickN(campuses, int(3, 6));
    const members = [];
    for (const c of spread) {
      const pool = byUni[c.university_id] || [];
      members.push(...pickN(pool, Math.min(pool.length, int(2, 5))));
    }
    if (members.length < 4) continue;
    const gid = `grp${DEMO}${++gn}`;
    groupRows.push([gid, host.university_id, name,
      `${name} — open to students from any Ghanaian university. ` +
      `Currently ${members.length} members across ${spread.length} campuses.`,
      course, name, "public", int(30, 80), freq, loc, members[0].id, 1]);
    members.forEach((m, i) => memberRows.push([`gm${DEMO}${++gmn}`, gid, m.id,
      i === 0 ? "creator" : i < 3 ? "admin" : "member", pick(["all","important"])]));
  }
  set("study_groups_local", localGroups);
  set("study_groups_national", groupRows.length - localGroups);
  await insertMany("study_groups",
    ["group_id","university_id","group_name","description","course_code","course_name",
     "group_type","max_members","meeting_frequency","preferred_location_type","created_by","is_active"], groupRows);
  set("group_members", await insertMany("group_members",
    ["group_member_id","group_id","user_id","role","notification_preferences"], memberRows));

  // ---- events ------------------------------------------------------------
  const eventRows = [], attRows = [];
  let en = 0, an = 0;

  const addEvent = (title, type, desc, host, pool, national) => {
    const eid = `evt${DEMO}${++en}`;
    const offset = int(-28, 45);
    const hour = int(8, 18);
    eventRows.push([eid, host.university_id, pool[0].id, title,
      national ? `${desc} Open to students from any university.` : desc,
      type, offset, hour, offset + (national && chance(0.4) ? int(1,2) : 0), hour + int(2, 5),
      national ? pick(["hybrid","physical"]) : pick(["physical","physical","hybrid"]),
      pick(["Main Auditorium","Great Hall","Lecture Theatre A","Sports Complex",
            "Central Cafeteria","Engineering Block Forecourt","ICT Centre"]),
      national ? pick([200, 400, 800]) : pick([null, 50, 120, 300]),
      chance(0.6) ? 1 : 0]);
    for (const u of pickN(pool, Math.min(pool.length, national ? int(12, 30) : int(4, 16)))) {
      attRows.push([`att${DEMO}${++an}`, eid, u.id,
        chance(0.58) ? "going" : chance(0.7) ? "interested" : "not_going"]);
    }
  };

  for (const [t, ty, d] of C.LOCAL_EVENTS) {
    const c = pick(campuses);
    const pool = byUni[c.university_id] || [];
    if (pool.length < 2) continue;
    addEvent(t, ty, d, c, pool, false);
  }
  const localEvents = eventRows.length;
  for (const [t, ty, d] of C.NATIONAL_EVENTS) {
    const host = pick(campuses);
    // Attendees drawn from every campus, which is what makes these
    // inter-school rather than just large.
    addEvent(t, ty, d, host, users, true);
  }
  set("events_local", localEvents);
  set("events_national", eventRows.length - localEvents);

  // start_time/end_time are relative, so they are built in SQL per row.
  for (let i = 0; i < eventRows.length; i += 100) {
    const chunk = eventRows.slice(i, i + 100);
    await db.query(
      `INSERT IGNORE INTO events
         (event_id, university_id, created_by, event_title, event_description,
          event_type, start_time, end_time, location_type, physical_location,
          max_attendees, requires_rsvp, is_public)
       VALUES ${chunk.map(() => `(?,?,?,?,?,?,
         DATE_ADD(DATE_ADD(CURDATE(), INTERVAL ? DAY), INTERVAL ? HOUR),
         DATE_ADD(DATE_ADD(CURDATE(), INTERVAL ? DAY), INTERVAL ? HOUR),
         ?,?,?,?,1)`).join(",")}`,
      chunk.flat()
    );
  }
  set("event_attendees", await insertMany("event_attendees",
    ["attendee_id","event_id","user_id","rsvp_status"], attRows));

  // ---- posts, comments, likes -------------------------------------------
  const postRows = [], commentRows = [], likeRows = [];
  let pn = 0, cmn = 0, lkn = 0;

  // Two passes over the pool, so the feed has more than one post per prompt.
  for (let pass = 0; pass < 2; pass++) {
    for (const body of C.POSTS) {
      const author = pick(users);
      const pid = `post${DEMO}${++pn}`;
      postRows.push([pid, author.id, body, "text",
        pick(["public","public","connections","connections"]), int(1, 900)]);

      // Commenters and likers come mostly from the same campus, occasionally
      // from another -- public posts are visible across the network.
      const local = (byUni[author.uni] || []).filter((u) => u.id !== author.id);
      const foreign = users.filter((u) => u.uni !== author.uni);
      const audience = [...pickN(local, int(0, 5)), ...(chance(0.35) ? pickN(foreign, int(1, 3)) : [])];

      for (const u of pickN(audience, Math.min(audience.length, int(0, 4)))) {
        commentRows.push([`cmt${DEMO}${++cmn}`, pid, u.id, pick(C.COMMENTS), 1]);
      }
      for (const u of pickN([...local, ...(chance(0.4) ? pickN(foreign, int(1, 4)) : [])], int(0, 11))) {
        likeRows.push([`lk${DEMO}${++lkn}`, pid, u.id]);
      }
    }
  }

  for (let i = 0; i < postRows.length; i += 100) {
    const chunk = postRows.slice(i, i + 100);
    await db.query(
      `INSERT IGNORE INTO posts (post_id,user_id,content,media_type,visibility,is_active,created_at)
       VALUES ${chunk.map(() => "(?,?,?,?,?,1,DATE_SUB(NOW(), INTERVAL ? HOUR))").join(",")}`,
      chunk.flat()
    );
  }
  set("posts", postRows.length);
  set("comments", await insertMany("post_comments",
    ["comment_id","post_id","user_id","content","is_active"], commentRows));
  set("likes", await insertMany("post_likes", ["like_id","post_id","user_id"], likeRows));

  return { counts, campuses };
};

const main = async () => {
  try {
    if (process.argv.includes("--clean")) {
      await clean();
    } else {
      const { counts, campuses } = await seedData();
      console.log("Seeded:");
      for (const [k, v] of Object.entries(counts)) {
        console.log(`  ${k.padEnd(24)} ${v}`);
      }
      console.log(`\n  ${campuses.length} campuses, sizes: ${campuses.map((c) => c.size).join(", ")}`);
      console.log(`  All demo accounts use password: ${DEMO_PASSWORD}`);
      console.log("  Remove everything with: node scripts/seedDemoData.js --clean\n");
    }
  } catch (error) {
    console.error(`\n✗ ${error.message}\n`, error.stack?.split("\n")[1] || "");
    process.exitCode = 1;
  } finally {
    await db.end().catch(() => {});
  }
};

main();
