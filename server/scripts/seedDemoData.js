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
// Universities are NOT created or removed here -- those are real records from
// db/seeds/ghana-universities.json.

import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { db } from "../config/db.js";

dotenv.config();

export const DEMO_PASSWORD = "CampusTest!2026";

// Deterministic PRNG so repeated runs produce the same dataset, which makes
// frontend bugs reproducible rather than shifting under you.
let seed = 20260921;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0]);
  }
  return out;
};
const int = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

const FIRST_F = ["Ama","Akosua","Abena","Adwoa","Afua","Yaa","Esi","Akua","Efua","Nana Ama","Adjoa","Serwaa","Maame","Akorfa","Dzifa","Elikem","Naa","Hamdiya","Fatima","Zainab"];
const FIRST_M = ["Kofi","Kwame","Yaw","Kwabena","Kojo","Kwaku","Kwesi","Fiifi","Ato","Nana Kwame","Emmanuel","Isaac","Prince","Samuel","Michael","Ibrahim","Abdul","Selorm","Kelvin","Joshua"];
const LAST = ["Mensah","Owusu","Boateng","Asante","Appiah","Osei","Agyeman","Darko","Adjei","Frimpong","Ansah","Amoah","Baidoo","Quartey","Tetteh","Lartey","Nyarko","Gyasi","Bediako","Acheampong","Sarpong","Yeboah","Danso","Antwi","Addo"];

const PROGRAMS = [
  ["Computer Science","CS"],["Computer Engineering","CE"],["Information Technology","IT"],
  ["Mechanical Engineering","ME"],["Civil Engineering","CV"],["Electrical Engineering","EE"],
  ["Business Administration","BA"],["Accounting","ACC"],["Economics","ECON"],
  ["Nursing","NUR"],["Medicine","MED"],["Pharmacy","PHA"],
  ["Architecture","ARC"],["Statistics","STA"],["Mathematics","MATH"],["Law","LAW"],
];

const COURSES = {
  CS: [["CS101","Introduction to Programming"],["CS201","Data Structures and Algorithms"],["CS305","Database Systems"],["CS340","Operating Systems"],["CS410","Machine Learning"],["CS350","Software Engineering"]],
  CE: [["CE210","Digital Logic Design"],["CE320","Computer Architecture"],["CE330","Embedded Systems"],["CS201","Data Structures and Algorithms"]],
  IT: [["IT110","Web Technologies"],["IT220","Networks and Security"],["IT310","Systems Analysis"],["CS305","Database Systems"]],
  ME: [["ME101","Engineering Drawing"],["ME220","Thermodynamics"],["ME330","Fluid Mechanics"],["ME410","Machine Design"]],
  CV: [["CV150","Surveying"],["CV240","Structural Analysis"],["CV350","Geotechnical Engineering"],["CV420","Reinforced Concrete Design"]],
  EE: [["EE120","Circuit Theory"],["EE230","Electromagnetics"],["EE340","Power Systems"],["EE430","Control Systems"]],
  BA: [["BA101","Principles of Management"],["BA210","Marketing Management"],["BA320","Operations Management"],["ACC101","Financial Accounting"]],
  ACC: [["ACC101","Financial Accounting"],["ACC220","Cost Accounting"],["ACC330","Auditing"],["ACC410","Taxation"]],
  ECON: [["ECON101","Principles of Economics"],["ECON210","Microeconomics"],["ECON220","Macroeconomics"],["STA201","Statistics for Economists"]],
  NUR: [["NUR110","Anatomy and Physiology"],["NUR220","Fundamentals of Nursing"],["NUR330","Community Health"],["NUR410","Medical-Surgical Nursing"]],
  MED: [["MED101","Human Anatomy"],["MED210","Biochemistry"],["MED320","Pathology"],["MED430","Clinical Medicine"]],
  PHA: [["PHA120","Pharmaceutical Chemistry"],["PHA230","Pharmacology"],["PHA340","Pharmaceutics"]],
  ARC: [["ARC101","Design Studio I"],["ARC210","History of Architecture"],["ARC320","Building Construction"]],
  STA: [["STA101","Introductory Statistics"],["STA210","Probability Theory"],["STA320","Regression Analysis"]],
  MATH:[["MATH101","Calculus I"],["MATH201","Linear Algebra"],["MATH310","Real Analysis"]],
  LAW: [["LAW101","Ghana Legal System"],["LAW210","Law of Contract"],["LAW320","Constitutional Law"]],
};

const INTERESTS = {
  academic: ["Research Methods","Data Analysis","Robotics","Renewable Energy","Public Health","Entrepreneurship Studies"],
  hobby: ["Photography","Creative Writing","Chess","Cooking","Board Games","Gardening","Sketching"],
  career: ["Product Management","Software Engineering","Consulting","Investment Banking","Teaching","Civil Service"],
  sports: ["Football","Basketball","Athletics","Table Tennis","Volleyball","Swimming","Badminton"],
  arts: ["Afrobeats Production","Highlife Guitar","Drama","Dance","Spoken Word","Painting"],
};

const BUILDINGS = [
  ["MAIN","Main Administration Block","administrative"],
  ["LIB","University Library","library"],
  ["SCI","Science Block","academic"],
  ["ENG","Engineering Block","academic"],
  ["GYM","Sports Complex","sports"],
  ["CAF","Central Cafeteria","dining"],
  ["HALL","Students' Hall of Residence","residential"],
];

const FACILITIES = [
  ["Lecture Theatre A","classroom",180],["Lecture Theatre B","classroom",140],
  ["Computer Lab 1","lab",60],["Computer Lab 2","lab",45],
  ["Quiet Study Room","study_room",30],["Group Study Room","study_room",12],
  ["Reading Room","library",120],["Student Lounge","lounge",50],
  ["Campus Cafe","cafe",40],["Weights Room","gym",35],
];

const DEPARTMENTS = [
  ["CS","Department of Computer Science"],["EE","Department of Electrical Engineering"],
  ["ME","Department of Mechanical Engineering"],["CV","Department of Civil Engineering"],
  ["BA","Department of Business Administration"],["ACC","Department of Accounting"],
  ["ECON","Department of Economics"],["MATH","Department of Mathematics"],
  ["NUR","Department of Nursing"],["ARC","Department of Architecture"],
];

const GROUP_NAMES = [
  "Algorithms Study Circle","Database Design Crew","Thermodynamics Support Group",
  "Financial Accounting Peer Review","Calculus Problem Sessions","Anatomy Revision Group",
  "Structural Analysis Workshop","Machine Learning Reading Group","Constitutional Law Discussions",
  "Statistics Tutorial Group","Embedded Systems Builders","Marketing Case Study Team",
];

const EVENTS = [
  ["Mid-Semester Revision Marathon","academic","Bring past papers. Tutors on hand for CS and Maths."],
  ["Freshers' Welcome Mixer","social","Meet your cohort. Light refreshments provided."],
  ["Inter-Hall Football Final","sports","Supporters welcome. Kick-off prompt."],
  ["Career Fair: Tech and Finance","career","Recruiters from local and international firms."],
  ["Robotics Club Open Day","club","Live demos from final-year projects."],
  ["CV and Interview Workshop","workshop","Bring a printed CV for review."],
  ["Hackathon: Build for Campus","academic","Teams of four. 24 hours. Judging Sunday evening."],
  ["Entrepreneurship Pitch Night","career","Five minutes to pitch, five to defend."],
  ["Study Skills Seminar","workshop","Note-taking, revision planning, exam technique."],
  ["Cultural Night","social","Food, music and drumming from every region."],
  ["Public Health Symposium","academic","Guest speakers from Ghana Health Service."],
  ["Chess Tournament","club","Swiss format, five rounds."],
];

const POSTS = [
  "Does anyone have the CS305 past papers from last year? Happy to trade for my ME220 notes.",
  "Reminder: the library now opens at 7am during exam season. Front desk confirmed it today.",
  "Looking for two more people for the hackathon this weekend. We have a backend dev and a designer.",
  "Whoever left a blue water bottle in Computer Lab 2, it is with the lab assistant.",
  "Finally finished my structural analysis assignment. Three all-nighters. Do not recommend.",
  "Study group for Financial Accounting meets Thursday 4pm, Group Study Room. All welcome.",
  "The cafeteria jollof has genuinely improved this semester and I want that on the record.",
  "Anyone taking STA210? The Tuesday tutorial has moved to Lecture Theatre B.",
  "Selling a barely-used scientific calculator, upgraded to a graphing one. DM me.",
  "Congratulations to the robotics team for placing second nationally. Well deserved.",
  "Does the shuttle run on Saturdays? Conflicting answers from two different people.",
  "Posted my notes for the whole Thermodynamics course in the study group. Good luck everyone.",
  "Looking for a project partner for the software engineering group work. I do backend.",
  "The new quiet study room is excellent. Actually quiet, unlike the old one.",
  "Football final was a great match. Commiserations to the other hall, next year.",
  "If anyone finds a student ID with the name Kwabena on it, please hand it in at the main block.",
  "Machine learning reading group is doing attention mechanisms next week. Paper in the group chat.",
  "Print shop near the science block is cheaper than the one on the main road, for reference.",
  "Two weeks to exams. Starting my revision timetable today and sticking to it this time.",
  "Anyone else find the lecture recordings load faster on the campus network at night?",
];

const COMMENTS = [
  "I have these, will send them over tonight.","Seconded, this was really useful.",
  "Thanks for sharing this.","Does this still apply for the evening session?",
  "Count me in.","Same experience here.","Just messaged you.",
  "This is good to know, thanks.","Can confirm.","Any chance of a copy?",
  "See you there.","Much appreciated.",
];

const DEMO = "_demo_";

const clean = async () => {
  console.log("\nRemoving demo data…\n");
  // Order matters only where FKs do not cascade. Demo users cascade their
  // posts, comments, likes, connections, RSVPs, memberships, courses,
  // interests, availability and privacy rows automatically.
  const steps = [
    ["event_attendees", "attendee_id LIKE ?"],
    ["events", "event_id LIKE ?"],
    ["group_members", "group_member_id LIKE ?"],
    ["study_groups", "group_id LIKE ?"],
    ["post_comments", "comment_id LIKE ?"],
    ["post_likes", "like_id LIKE ?"],
    ["posts", "post_id LIKE ?"],
    ["connections", "connection_id LIKE ?"],
    ["campus_facilities", "facility_id LIKE ?"],
    ["campus_buildings", "building_id LIKE ?"],
    ["university_departments", "department_id LIKE ?"],
    ["users", "user_id LIKE ?"],
  ];
  for (const [table, where] of steps) {
    const [r] = await db.execute(
      `DELETE FROM ${table} WHERE ${where}`,
      [`%${DEMO}%`]
    );
    if (r.affectedRows) console.log(`  ${table.padEnd(24)} -${r.affectedRows}`);
  }
  console.log("\n✓ Demo data removed. Universities and operators untouched.\n");
};

const seedData = async () => {
  const [unis] = await db.execute(
    "SELECT university_id, name, domain FROM universities ORDER BY CAST(SUBSTRING(university_id,5) AS UNSIGNED)"
  );
  if (unis.length === 0) {
    throw new Error("No universities. Import the seed pack first.");
  }

  // Spread across a handful of real campuses rather than all 43, so each one
  // has enough students to look alive.
  const campuses = pickN(unis, Math.min(6, unis.length));
  console.log(`\nSeeding across ${campuses.length} campuses:`);
  campuses.forEach((c) => console.log(`  ${c.university_id}  ${c.name}`));

  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const counts = {};
  const bump = (k, n = 1) => (counts[k] = (counts[k] || 0) + n);

  // ---- departments, buildings, facilities --------------------------------
  let dn = 0, bn = 0, fn = 0;
  const buildingIds = [];
  for (const c of campuses) {
    for (const [code, name] of pickN(DEPARTMENTS, 6)) {
      await db.execute(
        `INSERT IGNORE INTO university_departments
           (department_id, university_id, department_code, department_name, description)
         VALUES (?,?,?,?,?)`,
        [`dep${DEMO}${++dn}`, c.university_id, code, name,
         `${name} at ${c.name}.`]
      );
      bump("departments");
    }
    for (const [code, name, type] of pickN(BUILDINGS, 5)) {
      const id = `bld${DEMO}${++bn}`;
      await db.execute(
        `INSERT IGNORE INTO campus_buildings
           (building_id, university_id, building_code, building_name,
            building_type, latitude, longitude, floors, is_accessible)
         VALUES (?,?,?,?,?,?,?,?,1)`,
        [id, c.university_id, code, name, type,
         (5.6 + rnd() * 5).toFixed(6), (-2.5 + rnd() * 2.5).toFixed(6), int(1, 5)]
      );
      buildingIds.push(id);
      bump("buildings");
      for (const [fname, ftype, cap] of pickN(FACILITIES, 3)) {
        await db.execute(
          `INSERT IGNORE INTO campus_facilities
             (facility_id, building_id, facility_name, facility_type, capacity,
              floor, room_number, is_reservable, operating_hours)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [`fac${DEMO}${++fn}`, id, fname, ftype, cap, int(1, 3),
           `${int(1,3)}${String(int(1,20)).padStart(2,"0")}`,
           ftype === "study_room" ? 1 : 0, "Mon-Fri 08:00-20:00"]
        );
        bump("facilities");
      }
    }
  }

  // ---- students ----------------------------------------------------------
  const users = [];
  const TOTAL = 60;
  for (let i = 1; i <= TOTAL; i++) {
    const female = rnd() < 0.48;
    const first = female ? pick(FIRST_F) : pick(FIRST_M);
    const last = pick(LAST);
    const c = campuses[i % campuses.length];
    const [program, pcode] = pick(PROGRAMS);
    const year = int(1, 4);
    const id = `user${DEMO}${i}`;
    const email = `${first.toLowerCase().replace(/ /g,".")}.${last.toLowerCase()}${i}@${c.domain}`;

    await db.execute(
      `INSERT INTO users
         (user_id, university_id, email, password_hash, first_name, last_name,
          gender, program, graduation_year, year_of_study, bio, profile_headline,
          profile_picture_url, phone_number, timezone, privacy_profile,
          is_active, is_email_verified, is_edu_verified, is_profile_complete,
          auth_provider, last_login)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'Africa/Accra',?,1,1,1,1,'email',
               DATE_SUB(NOW(), INTERVAL ? HOUR))
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
      [id, c.university_id, email, hash, first, last,
       female ? "F" : "M", program, 2026 + (5 - year), String(year),
       `${["Second","Third","Final","First"][year % 4]}-year ${program} student at ${c.name}. ${pick(["Interested in research.","Looking for study partners.","Open to project collaborations.","Happy to help juniors with coursework."])}`,
       `${program} · Year ${year}`,
       `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
       `+2332${String(int(10000000, 99999999))}`,
       pick(["public","university","friends"]), int(1, 340)]
    );
    users.push({ id, first, last, uni: c.university_id, pcode, year });
    bump("users");

    // privacy settings
    await db.execute(
      `INSERT IGNORE INTO user_privacy_settings
         (user_id, profile_visibility, custom_radius, show_exact_location, visible_fields)
       VALUES (?,?,?,?,?)`,
      [id, pick(["public","geofenced","friends_only"]), pick([100,250,500]),
       rnd() < 0.3 ? 1 : 0, JSON.stringify(["program","year_of_study","interests"])]
    );

    // courses
    for (const [code, name] of pickN(COURSES[pcode] || COURSES.CS, int(3, 4))) {
      await db.execute(
        `INSERT IGNORE INTO user_courses
           (user_id, course_code, course_name, semester, academic_year, is_current)
         VALUES (?,?,?,?,?,1)`,
        [id, code, name, pick(["First Semester","Second Semester"]), 2026]
      );
      bump("courses");
    }

    // interests
    for (const type of pickN(Object.keys(INTERESTS), int(2, 3))) {
      await db.execute(
        `INSERT IGNORE INTO user_interests
           (interest_id, user_id, interest_type, interest_name, skill_level)
         VALUES (?,?,?,?,?)`,
        [`int${DEMO}${id}_${type}`, id, type, pick(INTERESTS[type]),
         pick(["beginner","intermediate","advanced"])]
      );
      bump("interests");
    }

    // availability
    for (const day of pickN(["monday","tuesday","wednesday","thursday","friday"], int(2, 3))) {
      const start = int(8, 16);
      await db.execute(
        `INSERT IGNORE INTO user_availability
           (availability_id, user_id, day_of_week, start_time, end_time,
            preferred_activity, is_recurring)
         VALUES (?,?,?,?,?,?,1)`,
        [`av${DEMO}${id}_${day}`, id, day,
         `${String(start).padStart(2,"0")}:00:00`,
         `${String(start + 2).padStart(2,"0")}:00:00`,
         pick(["studying","social","sports","meetings"])]
      );
      bump("availability");
    }
  }

  // ---- connections -------------------------------------------------------
  // Only within a campus, which is what the app's recommendation query assumes.
  let cn = 0;
  const byUni = {};
  users.forEach((u) => (byUni[u.uni] ||= []).push(u));
  for (const list of Object.values(byUni)) {
    for (const a of list) {
      for (const b of pickN(list.filter((x) => x.id !== a.id), int(3, 6))) {
        if (a.id >= b.id) continue; // one directed row per pair
        const status = rnd() < 0.72 ? "accepted" : rnd() < 0.7 ? "pending" : "declined";
        const [r] = await db.execute(
          `INSERT IGNORE INTO connections
             (connection_id, requester_id, receiver_id, status, connection_note)
           VALUES (?,?,?,?,?)`,
          [`conn${DEMO}${++cn}`, a.id, b.id, status,
           pick([null, "We take the same course.", "Met at the career fair.", "Same hall of residence."])]
        );
        if (r.affectedRows) bump("connections");
      }
    }
  }

  // ---- study groups ------------------------------------------------------
  let gn = 0, gmn = 0;
  for (const name of GROUP_NAMES) {
    const c = pick(campuses);
    const members = pickN(byUni[c.university_id] || users, int(4, 8));
    if (!members.length) continue;
    const gid = `grp${DEMO}${++gn}`;
    const creator = members[0];
    const [code, cname] = pick(COURSES[creator.pcode] || COURSES.CS);
    await db.execute(
      `INSERT IGNORE INTO study_groups
         (group_id, university_id, group_name, description, course_code,
          course_name, group_type, max_members, meeting_frequency,
          preferred_location_type, created_by, is_active)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`,
      [gid, c.university_id, name,
       `${name} — meets regularly to work through problem sets and past papers.`,
       code, cname, pick(["public","public","private","invite_only"]),
       int(10, 25), pick(["weekly","biweekly","weekly"]),
       pick(["campus","hybrid","virtual"]), creator.id]
    );
    bump("study_groups");
    for (const [i, m] of members.entries()) {
      await db.execute(
        `INSERT IGNORE INTO group_members
           (group_member_id, group_id, user_id, role, notification_preferences)
         VALUES (?,?,?,?,?)`,
        [`gm${DEMO}${++gmn}`, gid, m.id,
         i === 0 ? "creator" : i === 1 ? "admin" : "member",
         pick(["all","important"])]
      );
      bump("group_members");
    }
  }

  // ---- events ------------------------------------------------------------
  let en = 0, an = 0;
  for (const [title, type, desc] of EVENTS) {
    const c = pick(campuses);
    const pool = byUni[c.university_id] || users;
    if (!pool.length) continue;
    const eid = `evt${DEMO}${++en}`;
    // Mix of past and upcoming, so list and history views both have content.
    const offset = int(-20, 40);
    const startHour = int(9, 18);
    await db.execute(
      `INSERT IGNORE INTO events
         (event_id, university_id, created_by, event_title, event_description,
          event_type, start_time, end_time, location_type, physical_location,
          max_attendees, is_public, requires_rsvp)
       VALUES (?,?,?,?,?,?,
               DATE_ADD(DATE_ADD(CURDATE(), INTERVAL ? DAY), INTERVAL ? HOUR),
               DATE_ADD(DATE_ADD(CURDATE(), INTERVAL ? DAY), INTERVAL ? HOUR),
               ?,?,?,1,?)`,
      [eid, c.university_id, pick(pool).id, title, desc, type,
       offset, startHour, offset, startHour + int(2, 4),
       pick(["physical","physical","hybrid"]),
       pick(["Main Auditorium","Lecture Theatre A","Sports Complex","Central Cafeteria","Engineering Block Forecourt"]),
       pick([null, 50, 120, 300]), rnd() < 0.6 ? 1 : 0]
    );
    bump("events");
    for (const u of pickN(pool, int(5, 14))) {
      await db.execute(
        `INSERT IGNORE INTO event_attendees
           (attendee_id, event_id, user_id, rsvp_status)
         VALUES (?,?,?,?)`,
        [`att${DEMO}${++an}`, eid, u.id,
         rnd() < 0.6 ? "going" : rnd() < 0.7 ? "interested" : "not_going"]
      );
      bump("event_attendees");
    }
  }

  // ---- posts, comments, likes -------------------------------------------
  let pn = 0, cmn = 0, lkn = 0;
  for (const body of POSTS) {
    const author = pick(users);
    const pid = `post${DEMO}${++pn}`;
    await db.execute(
      `INSERT IGNORE INTO posts
         (post_id, user_id, content, media_type, visibility, is_active, created_at)
       VALUES (?,?,?,?,?,1, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
      [pid, author.id, body, "text",
       pick(["public","connections","connections"]), int(1, 500)]
    );
    bump("posts");

    const peers = (byUni[author.uni] || users).filter((u) => u.id !== author.id);
    for (const u of pickN(peers, int(0, 4))) {
      await db.execute(
        `INSERT IGNORE INTO post_comments
           (comment_id, post_id, user_id, content, is_active)
         VALUES (?,?,?,?,1)`,
        [`cmt${DEMO}${++cmn}`, pid, u.id, pick(COMMENTS)]
      );
      bump("comments");
    }
    for (const u of pickN(peers, int(0, 9))) {
      const [r] = await db.execute(
        `INSERT IGNORE INTO post_likes (like_id, post_id, user_id) VALUES (?,?,?)`,
        [`lk${DEMO}${++lkn}`, pid, u.id]
      );
      if (r.affectedRows) bump("likes");
    }
  }

  return counts;
};

const main = async () => {
  try {
    if (process.argv.includes("--clean")) {
      await clean();
    } else {
      const counts = await seedData();
      console.log("\nSeeded:");
      for (const [k, v] of Object.entries(counts)) {
        console.log(`  ${k.padEnd(18)} ${v}`);
      }
      console.log(`\n  All demo accounts use password: ${DEMO_PASSWORD}`);
      console.log("  Remove everything with: node scripts/seedDemoData.js --clean\n");
    }
  } catch (error) {
    console.error(`\n✗ ${error.message}\n`);
    process.exitCode = 1;
  } finally {
    await db.end().catch(() => {});
  }
};

main();
