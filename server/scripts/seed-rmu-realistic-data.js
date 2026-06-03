import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER?.trim(),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const universityId = "uni_31";
const leslieId = "user_rmu_leslie_ajayi";
const passwordHash =
  "$2b$12$6AFDme3RT9zSqEH/KdfFnuS6H4onVkvTwO5qJ3fNmngv0qpcvY46G";

const students = [
  ["rmu_real_ama_boateng", "ama.boateng@rmu.edu.gh", "Ama", "Boateng", "F", "Maritime Law", "4", "Final-year Maritime Law student tracking port compliance and vessel documentation.", "Maritime Law Society secretary"],
  ["rmu_real_kwesi_mensah", "kwesi.mensah@rmu.edu.gh", "Kwesi", "Mensah", "M", "Marine Engineering", "3", "Marine engineering student rebuilding a small diesel pump for lab practicals.", "Engine room systems enthusiast"],
  ["rmu_real_abena_owusu", "abena.owusu@rmu.edu.gh", "Abena", "Owusu", "F", "Logistics and Supply Chain Management", "2", "Learning how Ghanaian ports move cargo from manifest to last mile.", "Supply chain analyst in training"],
  ["rmu_real_kojo_arthur", "kojo.arthur@rmu.edu.gh", "Kojo", "Arthur", "M", "Nautical Science", "3", "Nautical science cadet practicing chartwork, COLREGS, and bridge resource management.", "Nautical cadet"],
  ["rmu_real_efua_sarpong", "efua.sarpong@rmu.edu.gh", "Efua", "Sarpong", "F", "Port and Shipping Administration", "4", "Researching berth scheduling and truck turnaround times at Tema Port.", "Port operations researcher"],
  ["rmu_real_yaw_darko", "yaw.darko@rmu.edu.gh", "Yaw", "Darko", "M", "Computer Science", "2", "Building small campus tools with React Native and Node.", "Mobile developer"],
  ["rmu_real_akosua_adjei", "akosua.adjei@rmu.edu.gh", "Akosua", "Adjei", "F", "Procurement and Supply Chain", "3", "Interested in ethical procurement and cold-chain logistics.", "Procurement club organizer"],
  ["rmu_real_kofi_asare", "kofi.asare@rmu.edu.gh", "Kofi", "Asare", "M", "Marine Electrical and Electronics Engineering", "4", "Debugging radar, AIS, and embedded systems for marine navigation.", "Marine electronics lead"],
  ["rmu_real_yaa_danquah", "yaa.danquah@rmu.edu.gh", "Yaa", "Danquah", "F", "Hospitality and Tourism Management", "2", "Exploring cruise hospitality, guest operations, and service quality.", "Campus events volunteer"],
  ["rmu_real_fiifi_quaye", "fiifi.quaye@rmu.edu.gh", "Fiifi", "Quaye", "M", "Nautical Science", "1", "Fresh cadet getting used to knots, bearings, and early morning drills.", "Nautical science freshman"],
  ["rmu_real_adwoa_baah", "adwoa.baah@rmu.edu.gh", "Adwoa", "Baah", "F", "Environmental and Safety Management", "3", "Focused on marine pollution prevention and HSE audits.", "HSE student researcher"],
  ["rmu_real_sena_atekpe", "sena.atekpe@rmu.edu.gh", "Sena", "Atekpe", "M", "Logistics Management", "4", "Mapping demurrage risk and container dwell time for a capstone project.", "Logistics data analyst"],
  ["rmu_real_esi_tetteh", "esi.tetteh@rmu.edu.gh", "Esi", "Tetteh", "F", "Computer Science", "3", "Into backend APIs, database design, and campus automation.", "Backend developer"],
  ["rmu_real_kwame_akoto", "kwame.akoto@rmu.edu.gh", "Kwame", "Akoto", "M", "Marine Engineering", "2", "Learning thermodynamics, workshop safety, and auxiliary machinery.", "Workshop practicals regular"],
  ["rmu_real_nana_gyamfi", "nana.gyamfi@rmu.edu.gh", "Nana", "Gyamfi", "F", "Port and Shipping Administration", "1", "New RMU student trying every society before choosing one.", "First-year port admin student"],
  ["rmu_real_selorm_doe", "selorm.doe@rmu.edu.gh", "Selorm", "Doe", "M", "Information Technology", "4", "Running the lab network checklist and helping classmates with Linux.", "IT lab assistant"],
  ["rmu_real_afua_bonsu", "afua.bonsu@rmu.edu.gh", "Afua", "Bonsu", "F", "Maritime Law", "2", "Interested in arbitration, crew welfare, and maritime insurance.", "Moot court participant"],
  ["rmu_real_kobina_essien", "kobina.essien@rmu.edu.gh", "Kobina", "Essien", "M", "Supply Chain Management", "3", "Uses spreadsheets a little too seriously for inventory planning.", "Inventory planning nerd"],
  ["rmu_real_mavis_adu", "mavis.adu@rmu.edu.gh", "Mavis", "Adu", "F", "Marine Catering", "2", "Studying nutrition planning for shipboard crews and offshore teams.", "Marine catering student"],
  ["rmu_real_elorm_kpodo", "elorm.kpodo@rmu.edu.gh", "Elorm", "Kpodo", "M", "Nautical Science", "4", "Preparing for sea time and final oral exam drills.", "Bridge team captain"],
];

const posts = [
  ["rmu_real_post_01", "rmu_real_ama_boateng", "Maritime law seminar notes are finally organized. If anyone needs the arrest of ships case list, I put the clean version in the class drive.", "connections", "2026-06-03 08:15:00"],
  ["rmu_real_post_02", "rmu_real_kwesi_mensah", "Auxiliary machinery lab was intense today. The pump alignment demo made way more sense once we checked vibration readings.", "connections", "2026-06-03 08:42:00"],
  ["rmu_real_post_03", "rmu_real_abena_owusu", "Our supply chain lecturer used Tema Port truck queues as the whole case study. Painfully real, but very useful.", "connections", "2026-06-03 09:05:00"],
  ["rmu_real_post_04", "rmu_real_kojo_arthur", "Chartwork group meeting at the library after lunch. Bring parallel rulers if you have one; mine is doing too much work.", "connections", "2026-06-03 09:30:00"],
  ["rmu_real_post_05", "rmu_real_yaw_darko", "Pushed a small Expo fix for our campus project. The real fight was not the code; it was the network on my phone.", "connections", "2026-06-03 10:10:00"],
  ["rmu_real_post_06", "rmu_real_efua_sarpong", "Anyone attending the port operations talk tomorrow? I want to compare notes for the berth planning assignment.", "connections", "2026-06-03 10:45:00"],
  ["rmu_real_post_07", "rmu_real_adwoa_baah", "HSE audit checklist is longer than expected, but the spill response section is actually practical.", "connections", "2026-06-03 11:20:00"],
  ["rmu_real_post_08", "rmu_real_selorm_doe", "The lab printer is back online. Please do not send 80-page lecture slides in full color again.", "connections", "2026-06-03 12:05:00"],
  ["rmu_real_post_09", "rmu_real_esi_tetteh", "Database indexing finally clicked after seeing the feed query slow down. Query plans are humbling.", "connections", "2026-06-03 12:40:00"],
  ["rmu_real_post_10", leslieId, "Testing the new Campus Connect media flow with real classmates in the feed. If you see this, the local API is behaving.", "connections", "2026-06-03 13:10:00"],
  ["rmu_real_post_11", "rmu_real_nana_gyamfi", "First-year orientation still feels like a lot, but the seniors are making RMU feel less overwhelming.", "connections", "2026-06-03 13:35:00"],
  ["rmu_real_post_12", "rmu_real_kofi_asare", "Marine electronics practical: AIS configuration looks simple until one wrong setting makes the whole display useless.", "connections", "2026-06-03 14:00:00"],
];

const statuses = [
  ["rmu_real_status_01", "rmu_real_ama_boateng", "Moot court prep until 7.", "text", null],
  ["rmu_real_status_02", "rmu_real_kwesi_mensah", "Workshop practicals done.", "image", "sticker:🔧"],
  ["rmu_real_status_03", "rmu_real_abena_owusu", "Supply chain quiz survived.", "text", null],
  ["rmu_real_status_04", "rmu_real_kojo_arthur", "Chartwork table is full.", "image", "sticker:🧭"],
  ["rmu_real_status_05", "rmu_real_yaw_darko", "Debugging on campus Wi-Fi.", "image", "sticker:💻"],
  ["rmu_real_status_06", leslieId, "Campus Connect test status live.", "image", "sticker:🚢"],
  ["rmu_real_status_07", "rmu_real_efua_sarpong", "Port ops talk tomorrow.", "text", null],
  ["rmu_real_status_08", "rmu_real_esi_tetteh", "API contract reading mode.", "image", "sticker:📚"],
];

const events = [
  ["rmu_real_event_01", "Port Operations Guest Lecture", "A practitioner-led session on berth planning, cargo documentation, and reducing truck turnaround at Ghanaian ports.", "career", "2026-06-05 10:00:00", "2026-06-05 12:00:00", "physical", "Main Auditorium", 180],
  ["rmu_real_event_02", "Marine Engineering Workshop Safety Drill", "Hands-on safety session for workshop PPE, lockout procedures, and machine-room risk control.", "workshop", "2026-06-06 08:30:00", "2026-06-06 11:30:00", "physical", "Engineering Workshop", 60],
  ["rmu_real_event_03", "Nautical Science Chartwork Clinic", "Peer-led clinic covering bearings, fixes, dead reckoning, and exam-style chartwork problems.", "academic", "2026-06-07 15:00:00", "2026-06-07 17:30:00", "physical", "Library Seminar Room 2", 45],
  ["rmu_real_event_04", "RMU Tech and Maritime Systems Demo Night", "Students demo apps, sensors, and small tools for campus logistics and vessel operations.", "club", "2026-06-08 18:00:00", "2026-06-08 20:00:00", "physical", "ICT Lab", 70],
  ["rmu_real_event_05", "Women in Maritime Roundtable", "A practical networking session with alumnae working in shipping, logistics, marine safety, and law.", "career", "2026-06-09 14:00:00", "2026-06-09 16:00:00", "physical", "Conference Room A", 90],
];

const groups = [
  ["rmu_real_group_01", "Maritime Law Case Briefs", "Weekly review of maritime law cases, statutes, and arbitration notes.", "MLAW402", "Maritime Law", "public", 20, "weekly", "campus", "rmu_real_ama_boateng"],
  ["rmu_real_group_02", "Marine Engineering Practicals", "Workshop prep, thermodynamics problem sets, and lab safety checklists.", "MENG306", "Auxiliary Machinery", "public", 18, "biweekly", "campus", "rmu_real_kwesi_mensah"],
  ["rmu_real_group_03", "Campus App Builders", "React Native, backend APIs, and useful tools for RMU students.", "CS301", "Mobile App Development", "public", 16, "weekly", "hybrid", "rmu_real_yaw_darko"],
  ["rmu_real_group_04", "Nautical Chartwork Crew", "Bridge-team style practice for chartwork and navigation exam questions.", "NAUT304", "Terrestrial Navigation", "public", 14, "weekly", "campus", "rmu_real_kojo_arthur"],
  ["rmu_real_group_05", "Port Logistics Data Lab", "Spreadsheet models, queue analysis, and supply-chain case prep.", "LOG401", "Port Logistics", "public", 22, "weekly", "campus", "rmu_real_abena_owusu"],
];

const comments = [
  ["rmu_real_comment_01", "rmu_real_post_01", leslieId, "Send it to me too. I need the limitation of liability case."],
  ["rmu_real_comment_02", "rmu_real_post_02", "rmu_real_kwame_akoto", "The vibration reading part saved me. I finally understood why alignment matters."],
  ["rmu_real_comment_03", "rmu_real_post_05", "rmu_real_esi_tetteh", "Network issues on physical devices are a rite of passage."],
  ["rmu_real_comment_04", "rmu_real_post_06", "rmu_real_sena_atekpe", "I’m going. Berth planning is directly in my capstone."],
  ["rmu_real_comment_05", "rmu_real_post_08", "rmu_real_nana_gyamfi", "Noted. Printing handouts only from now on."],
  ["rmu_real_comment_06", "rmu_real_post_10", "rmu_real_yaw_darko", "Seeing it. Feed is loading cleanly on my phone."],
  ["rmu_real_comment_07", "rmu_real_post_10", "rmu_real_ama_boateng", "Good. Now make statuses expire properly."],
  ["rmu_real_comment_08", "rmu_real_post_12", "rmu_real_elorm_kpodo", "AIS config errors are exactly why checklists matter."],
];

await db.beginTransaction();

try {
  await db.execute(
    `INSERT INTO universities (university_id, name, domain, address, city, state, country, is_verified, primary_color, secondary_color, accent_color, text_color)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, '#012A4A', '#013A63', '#2C7DA0', '#13242E')
     ON DUPLICATE KEY UPDATE name=VALUES(name), domain=VALUES(domain), address=VALUES(address), city=VALUES(city), country=VALUES(country), is_verified=1`,
    [
      universityId,
      "Regional Maritime University",
      "rmu.edu.gh",
      "Nungua Road, Accra",
      "Accra",
      "Greater Accra",
      "Ghana",
    ],
  );

  for (const [id, email, first, last, gender, program, year, bio, headline] of students) {
    await db.execute(
      `INSERT INTO users (
        user_id, university_id, email, password_hash, first_name, last_name, gender,
        program, graduation_year, bio, profile_headline, show_location_preference,
        show_status_preference, timezone, notification_email, notification_push,
        privacy_profile, is_active, is_email_verified, year_of_study, interests,
        privacy_settings, is_profile_complete
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'university', 'university', 'Africa/Accra', 1, 1, 'university', 1, 1, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE
        university_id=VALUES(university_id), first_name=VALUES(first_name),
        last_name=VALUES(last_name), program=VALUES(program),
        bio=VALUES(bio), profile_headline=VALUES(profile_headline), year_of_study=VALUES(year_of_study),
        interests=VALUES(interests), is_email_verified=1, is_profile_complete=1`,
      [
        id,
        universityId,
        email,
        passwordHash,
        first,
        last,
        gender,
        program,
        2027,
        bio,
        headline,
        year,
        JSON.stringify(["campus life", program, "study groups"]),
        JSON.stringify({ profile_visibility: "university", show_email: false }),
      ],
    );
  }

  const userIdMap = new Map([[leslieId, leslieId]]);
  for (const [id, email] of students) {
    const [rows] = await db.execute(
      "SELECT user_id FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    userIdMap.set(id, rows[0]?.user_id ?? id);
  }
  const uid = (id) => userIdMap.get(id) ?? id;

  for (const [postId, userId, content, visibility, createdAt] of posts) {
    const [userRows] = await db.execute(
      "SELECT user_id FROM users WHERE user_id = ?",
      [uid(userId)],
    );
    if (userRows.length === 0) {
      throw new Error(`Missing user ${userId} for post ${postId}`);
    }
    await db.execute(
      `INSERT INTO posts (post_id, user_id, content, media_type, visibility, is_active, created_at, updated_at)
       VALUES (?, ?, ?, 'text', ?, 1, ?, ?)
       ON DUPLICATE KEY UPDATE content=VALUES(content), visibility=VALUES(visibility), is_active=1`,
      [postId, uid(userId), content, visibility, createdAt, createdAt],
    );
  }

  for (const [statusId, userId, content, mediaType, mediaUrl] of statuses) {
    await db.execute(
      `INSERT INTO statuses (status_id, user_id, content, media_url, media_type, is_active, expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW(), NOW())
       ON DUPLICATE KEY UPDATE content=VALUES(content), media_url=VALUES(media_url), media_type=VALUES(media_type), is_active=1, expires_at=DATE_ADD(NOW(), INTERVAL 24 HOUR)`,
      [statusId, uid(userId), content, mediaUrl, mediaType],
    );
  }

  for (const [eventId, title, description, type, start, end, locationType, location, max] of events) {
    await db.execute(
      `INSERT INTO events (
        event_id, university_id, created_by, event_title, event_description, event_type,
        start_time, end_time, is_recurring, location_type, physical_location,
        max_attendees, is_public, requires_rsvp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 1, 1)
      ON DUPLICATE KEY UPDATE event_title=VALUES(event_title), event_description=VALUES(event_description), start_time=VALUES(start_time), end_time=VALUES(end_time), max_attendees=VALUES(max_attendees)`,
      [eventId, universityId, uid(leslieId), title, description, type, start, end, locationType, location, max],
    );
  }

  for (const [groupId, name, description, code, course, type, max, frequency, locationType, creator] of groups) {
    await db.execute(
      `INSERT INTO study_groups (
        group_id, university_id, group_name, description, course_code, course_name,
        group_type, max_members, meeting_frequency, preferred_location_type,
        created_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE group_name=VALUES(group_name), description=VALUES(description), max_members=VALUES(max_members), is_active=1`,
      [groupId, universityId, name, description, code, course, type, max, frequency, locationType, uid(creator)],
    );
  }

  const allStudentIds = students.map(([id]) => uid(id));
  for (const [index, userId] of allStudentIds.entries()) {
    await db.execute(
      `INSERT INTO connections (connection_id, requester_id, receiver_id, status, connection_note, shared_courses)
       VALUES (?, ?, ?, 'accepted', ?, ?)
       ON DUPLICATE KEY UPDATE status='accepted', connection_note=VALUES(connection_note), shared_courses=VALUES(shared_courses)`,
      [
        `rmu_real_conn_leslie_${index + 1}`,
        uid(leslieId),
        userId,
        "Connected through RMU Campus Connect seed data.",
        JSON.stringify(["Campus Connect", "RMU community"]),
      ],
    );
  }

  for (const [index, [commentId, postId, userId, content]] of comments.entries()) {
    await db.execute(
      `INSERT INTO post_comments (comment_id, post_id, user_id, content, is_active, created_at)
       VALUES (?, ?, ?, ?, 1, DATE_ADD(NOW(), INTERVAL ? MINUTE))
       ON DUPLICATE KEY UPDATE content=VALUES(content), is_active=1`,
      [commentId, postId, uid(userId), content, index + 1],
    );
  }

  let likeIndex = 1;
  for (const [postId] of posts) {
    for (const userId of [uid(leslieId), ...allStudentIds.slice(0, 8)]) {
      if (likeIndex % 3 === 0) {
        likeIndex += 1;
        continue;
      }
      await db.execute(
        `INSERT INTO post_likes (like_id, post_id, user_id)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE post_id=VALUES(post_id)`,
        [`rmu_real_like_${likeIndex}`, postId, userId],
      );
      likeIndex += 1;
    }
  }

  let memberIndex = 1;
  for (const [groupId, , , , , , , , , creator] of groups) {
    for (const userId of [uid(creator), uid(leslieId), ...allStudentIds.slice(memberIndex, memberIndex + 5)]) {
      await db.execute(
        `INSERT INTO group_members (group_member_id, group_id, user_id, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE role=VALUES(role), last_active=CURRENT_TIMESTAMP`,
        [`rmu_real_member_${memberIndex}`, groupId, userId, userId === uid(creator) ? "creator" : "member"],
      );
      memberIndex += 1;
    }
  }

  await db.commit();
  console.log(
    JSON.stringify(
      {
        students: students.length,
        posts: posts.length,
        statuses: statuses.length,
        events: events.length,
        groups: groups.length,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}
