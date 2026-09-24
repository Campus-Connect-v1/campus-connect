import db from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

// Get user by ID
export const findById = async (userId) => {
  try {
    const [rows] = await db.execute(
      `SELECT u.*, uni.name as university_name, uni.domain as university_domain
       FROM users u 
       LEFT JOIN universities uni ON u.university_id = uni.university_id
       WHERE u.user_id = ? 
       -- AND u.is_active = 1`,
      [userId]
    );
    return rows[0] || null;
  } catch (error) {
    throw new Error(`Database error in findById: ${error.message}`);
  }
};

// Batched variant of findById for lists (e.g. conversation participants)
// that would otherwise fire one SELECT per row.
export const findByIdsModel = async (userIds) => {
  if (!userIds.length) return [];
  try {
    const placeholders = userIds.map(() => "?").join(",");
    const [rows] = await db.execute(
      `SELECT u.*, uni.name as university_name, uni.domain as university_domain
       FROM users u
       LEFT JOIN universities uni ON u.university_id = uni.university_id
       WHERE u.user_id IN (${placeholders})`,
      userIds
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error in findByIdsModel: ${error.message}`);
  }
};

// Get user by email
export const findByEmail = async (email) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? AND is_active = 1",
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    throw new Error(`Database error in findByEmail: ${error.message}`);
  }
};

// Get comprehensive user profile
export const getProfile = async (userId) => {
  try {
    // Get basic user info
    const [userRows] = await db.execute(
      `SELECT u.*, uni.name as university_name, uni.domain as university_domain
       FROM users u 
       LEFT JOIN universities uni ON u.university_id = uni.university_id
       WHERE u.user_id = ? AND u.is_active = 1`,
      [userId]
    );

    if (!userRows[0]) return null;

    const user = userRows[0];

    // Get user interests
    const [interestRows] = await db.execute(
      "SELECT * FROM user_interests WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    // Get user courses
    const [courseRows] = await db.execute(
      `SELECT uc.*, ud.department_name 
       FROM user_courses uc 
       LEFT JOIN university_departments ud ON uc.department_id = ud.department_id
       WHERE uc.user_id = ? AND uc.is_current = 1 
       ORDER BY uc.course_name`,
      [userId]
    );

    // Get user availability
    const [availabilityRows] = await db.execute(
      "SELECT * FROM user_availability WHERE user_id = ? ORDER BY day_of_week, start_time",
      [userId]
    );

    // Get connection count
    const [connectionRows] = await db.execute(
      `SELECT COUNT(*) as connection_count 
       FROM connections 
       WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'`,
      [userId, userId]
    );

    // Get group count
    const [groupRows] = await db.execute(
      `SELECT COUNT(*) as group_count 
       FROM group_members 
       WHERE user_id = ?`,
      [userId]
    );

    return {
      ...user,
      interests: interestRows,
      courses: courseRows,
      availability: availabilityRows,
      stats: {
        connections: connectionRows[0]?.connection_count || 0,
        groups: groupRows[0]?.group_count || 0,
      },
    };
  } catch (error) {
    throw new Error(`Database error in getProfile: ${error.message}`);
  }
};

// Update user profile
export const updateUserProfileModel = async (userId, updateData) => {
  try {
    const allowedFields = [
      "first_name",
      "last_name",
      "profile_picture_url",
      "phone_number",
      "program",
      "graduation_year",
      "bio",
      "profile_headline",
      "linkedin_url",
      "website_url",
      "date_of_birth",
      "show_location_preference",
      "show_status_preference",
      "timezone",
      "notification_email",
      "notification_push",
      "privacy_profile",
      "year_of_study",
      "is_profile_complete",
    ];

    const updates = {};
    Object.keys(updateData).forEach((key) => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      throw new Error("No valid fields to update");
    }

    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(updates), userId];

    const [result] = await db.execute(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error("User not found or no changes made");
    }

    return await findById(userId);
  } catch (error) {
    throw new Error(`Database error in updateProfile: ${error.message}`);
  }
};

// Search users
export const searchUsersModel = async (filters = {}) => {
  try {
    let query = `
      SELECT DISTINCT 
        u.user_id, u.first_name, u.last_name, u.profile_picture_url,
        u.profile_headline, u.program, u.graduation_year,
        u.university_id, uni.name as university_name,
        u.privacy_profile, u.created_at, u.last_login
      FROM users u
      LEFT JOIN universities uni ON u.university_id = uni.university_id
      LEFT JOIN user_interests ui ON u.user_id = ui.user_id
      LEFT JOIN user_courses uc ON u.user_id = uc.user_id
       WHERE u.is_active = 1 
    `;
    // uncomment this line if you want to include active users only. for now, we are including all users.(the db was loaded understand me)
    const params = [];
    const conditions = [];

    if (filters.university_id) {
      conditions.push("u.university_id = ?");
      params.push(filters.university_id);
    }

    if (filters.q && filters.q.trim() !== "") {
      const searchParam = `%${filters.q}%`;
      conditions.push(`(
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.profile_headline LIKE ? OR 
        u.bio LIKE ? OR
        u.program LIKE ?
      )`);
      params.push(
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam
      );
    }

    if (filters.program) {
      conditions.push("u.program LIKE ?");
      params.push(`%${filters.program}%`);
    }

    if (filters.graduation_year) {
      conditions.push("u.graduation_year = ?");
      params.push(filters.graduation_year);
    }

    if (filters.interest) {
      conditions.push("ui.interest_name LIKE ?");
      params.push(`%${filters.interest}%`);
    }

    if (filters.course) {
      conditions.push("uc.course_name LIKE ?");
      params.push(`%${filters.course}%`);
    }

    conditions.push(`u.privacy_profile IN ('public', 'university')`);

    if (conditions.length > 0) query += ` AND ${conditions.join(" AND ")}`;
    query += ` ORDER BY u.last_login DESC, u.created_at DESC`;

    if (filters.limit) {
      const safeLimit = Math.min(parseInt(filters.limit, 10) || 20, 100);
      query += ` LIMIT ${safeLimit}`;
    }

    // console.log("Final SQL:", query);
    // console.log("Params:", params);

    const [rows] = await db.execute(query, params);
    return rows;
  } catch (error) {
    throw new Error(`Database error in searchUsers: ${error.message}`);
  }
};

// Get connection recommendations
//
// Scores every same-campus user the caller is not already connected to, and
// returns the best `limit` of them.
//
// This used to read from the `connection_recommendations` view. It no longer
// does, for two reasons:
//
//   1. Correctness. The view's mutual-friend subquery required
//      `c1.requester_id = u1.user_id` in BOTH of its OR branches, so a mutual
//      friend was only counted when the caller had SENT the friend request.
//      `connections` stores one directed row per pair, so roughly half of
//      every user's friendships were invisible to the scorer.
//   2. Cost. The view has subqueries in its select list, which forces MySQL to
//      use the TEMPTABLE algorithm. It materialises the scored candidate set
//      and runs three dependent subqueries per candidate row.
//
// The query below pre-aggregates each score once for the caller and hash-joins
// the results onto the candidate list, so each signal is computed in a single
// pass instead of once per candidate.
export const getConnectionRecommendationsModel = async (userId, limit = 10) => {
  try {
    // sanitize limit safely
    const safeLimit = Math.min(parseInt(limit, 10) || 10, 50);

    // Placeholder order matters: shared interests, courses, groups, then the
    // three mutual-connections occurrences, then the caller themselves.
    const query = `
      SELECT
        u2.user_id,
        u2.first_name,
        u2.last_name,
        u2.profile_picture_url,
        u2.profile_headline,
        u2.program,
        u2.graduation_year,
        -- Returned so the client can say WHY two people match ("3 shared
        -- interests, 2 mutual friends") instead of only showing a number.
        COALESCE(shared_interests.score, 0) AS shared_interests,
        COALESCE(shared_courses.score, 0)   AS shared_courses,
        COALESCE(shared_groups.score, 0)    AS shared_groups,
        COALESCE(mutuals.score, 0)          AS mutual_connections,
        u2.university_id,
        CASE WHEN u2.university_id = u1.university_id THEN 1 ELSE 0 END AS same_campus,
        CASE WHEN u1.program IS NOT NULL AND u1.program = u2.program THEN 1 ELSE 0 END AS same_program,
        CASE WHEN u1.graduation_year IS NOT NULL
              AND u1.graduation_year = u2.graduation_year THEN 1 ELSE 0 END AS same_year,
        /*
         * Match score, 0-100, computed here rather than derived downstream.
         *
         * The previous formula summed raw counts and the controller divided by
         * a hardcoded 5, so the score was unbounded while the denominator was
         * not: three shared interests scored 6 and clamped to 100%, and every
         * strong match looked identical to every other. Two people sharing
         * three interests and nothing else were indistinguishable from two who
         * shared interests, courses, a study group and nine mutual friends.
         *
         * Each signal is now saturated individually, then weighted. Saturating
         * first is the important part: it stops any single dimension running
         * away with the total, so the score rewards breadth of overlap rather
         * than depth in one place -- which is what actually predicts whether
         * two students would get on.
         *
         * Weights, and why:
         *   interests 27 - the only signal a brand-new account has
         *   mutuals   23 - the strongest real-world predictor of a connection
         *   courses   18 - you already share a room twice a week
         *   groups    11 - deliberate, but a smaller population
         *   campus    10 - see below
         *   program    7 - same department, weak on its own
         *   year       4 - weakest; cohort alone says little
         *
         * Campus is WEIGHTED, not a filter, and deliberately not a hard tier.
         * Ranking every same-campus account above every other one would mean
         * never meeting anyone off your campus until you had exhausted it,
         * which is the behaviour this change exists to remove. At 10 it breaks
         * ties among similar matches and steps aside for a clearly better one:
         * a stranger elsewhere sharing three interests and two courses still
         * outranks a same-campus account sharing nothing.
         *
         * The other six were scaled from their previous values to make room
         * while keeping their order and rough proportions, so the total is
         * still 100 and a saturated score still means the same thing.
         *
         * Caps are set where the signal stops being informative: a fourth
         * shared interest says much less than the first, and beyond five
         * mutuals you are simply in the same circle.
         */
        LEAST(100, ROUND(
          LEAST(COALESCE(shared_interests.score, 0) / 3.0, 1.0) * 27 +
          LEAST(COALESCE(mutuals.score, 0)          / 5.0, 1.0) * 23 +
          LEAST(COALESCE(shared_courses.score, 0)   / 2.0, 1.0) * 18 +
          LEAST(COALESCE(shared_groups.score, 0)    / 2.0, 1.0) * 11 +
          CASE WHEN u2.university_id = u1.university_id THEN 10 ELSE 0 END +
          CASE WHEN u1.program IS NOT NULL AND u1.program = u2.program THEN 7 ELSE 0 END +
          CASE WHEN u1.graduation_year IS NOT NULL
                AND u1.graduation_year = u2.graduation_year THEN 4 ELSE 0 END
        )) AS match_score
      FROM users u1
      JOIN users u2
        ON u2.user_id <> u1.user_id
       AND u2.is_active = 1
       -- New accounts default to friends. They still need to appear as a
       -- lightweight discovery card so the first-run matching flow can work;
       -- private is the explicit opt-out from discovery.
       AND u2.privacy_profile <> 'private'
       /*
        * Recommendations now cross universities, following the same split the
        * feed made: WHO may be suggested is decided here, HOW RELEVANT they
        * are is decided by the score below. Confining suggestions to one
        * school meant you could read another campus but never be introduced
        * to anyone on it.
        *
        * 'university' is the one privacy value whose meaning is campus scope,
        * so it has to actually bound this. Before, it was moot -- the join
        * never left the campus. Opening the join without this line would
        * surface exactly the people who asked not to be seen off it.
        */
       AND (u2.university_id = u1.university_id
            OR u2.privacy_profile <> 'university')

      -- Interests are the strongest first-run signal: a new account has no
      -- friends, groups or courses yet, but it has just told us what it likes.
      LEFT JOIN (
        SELECT ui2.user_id, COUNT(*) AS score
        FROM user_interests ui1
        JOIN user_interests ui2
          ON LOWER(ui2.interest_name) = LOWER(ui1.interest_name)
         AND ui2.user_id <> ui1.user_id
        WHERE ui1.user_id = ?
        GROUP BY ui2.user_id
      ) AS shared_interests
        ON shared_interests.user_id = u2.user_id

      -- Courses the caller currently takes, and who else currently takes them.
      LEFT JOIN (
        SELECT uc2.user_id, COUNT(*) AS score
        FROM user_courses uc1
        JOIN user_courses uc2
          ON uc2.course_code = uc1.course_code
         AND uc2.user_id <> uc1.user_id
         AND uc2.is_current = 1
        WHERE uc1.user_id = ?
          AND uc1.is_current = 1
        GROUP BY uc2.user_id
      ) AS shared_courses
        ON shared_courses.user_id = u2.user_id

      -- Study groups the caller belongs to, and who else belongs to them.
      LEFT JOIN (
        SELECT gm2.user_id, COUNT(*) AS score
        FROM group_members gm1
        JOIN group_members gm2
          ON gm2.group_id = gm1.group_id
         AND gm2.user_id <> gm1.user_id
        WHERE gm1.user_id = ?
        GROUP BY gm2.user_id
      ) AS shared_groups
        ON shared_groups.user_id = u2.user_id

      -- Friends-of-friends. The inner select normalises each of the caller's
      -- accepted connections to "the other person", regardless of who sent the
      -- request, which is what the view got wrong.
      LEFT JOIN (
        SELECT fof.other_id AS user_id, COUNT(DISTINCT fof.via_id) AS score
        FROM (
          SELECT
            IF(c2.requester_id = friends.friend_id, c2.receiver_id, c2.requester_id) AS other_id,
            friends.friend_id AS via_id
          FROM (
            SELECT IF(requester_id = ?, receiver_id, requester_id) AS friend_id
            FROM connections
            WHERE status = 'accepted'
              AND (requester_id = ? OR receiver_id = ?)
          ) AS friends
          JOIN connections c2
            ON c2.status = 'accepted'
           AND (c2.requester_id = friends.friend_id OR c2.receiver_id = friends.friend_id)
        ) AS fof
        GROUP BY fof.other_id
      ) AS mutuals
        ON mutuals.user_id = u2.user_id

      WHERE u1.user_id = ?
        AND u1.is_active = 1
        AND NOT EXISTS (
          SELECT 1 FROM connections c
          WHERE (c.requester_id = u1.user_id AND c.receiver_id = u2.user_id)
             OR (c.requester_id = u2.user_id AND c.receiver_id = u1.user_id)
        )
      -- Ties were rare while everyone shared a campus; opening the join makes
      -- them common, and an unordered tie means the list reshuffles on every
      -- refresh. Same campus breaks a tie -- the one place a hard preference
      -- for your own school costs nothing, because the match is equal anyway.
      ORDER BY match_score DESC, same_campus DESC, u2.user_id
      LIMIT ${safeLimit};
    `;

    const [rows] = await db.execute(query, [
      userId, // shared_interests
      userId, // shared_courses
      userId, // shared_groups
      userId, // mutuals: normalise direction
      userId, // mutuals: caller is requester
      userId, // mutuals: caller is receiver
      userId, // outer: the caller
    ]);
    return rows;
  } catch (error) {
    throw new Error(
      `Database error in getConnectionRecommendationsModel: ${error.message}`
    );
  }
};
// Add user interest
export const addInterestModel = async (userId, interestData) => {
  try {
    const interestId = `int_${uuidv4()}`;
    const { interest_type, interest_name, skill_level } = interestData;

    const [result] = await db.execute(
      "INSERT INTO user_interests (interest_id, user_id, interest_type, interest_name, skill_level) VALUES (?, ?, ?, ?, ?)",
      [interestId, userId, interest_type, interest_name, skill_level]
    );

    return { interest_id: interestId, ...interestData };
  } catch (error) {
    throw new Error(`Database error in addInterest: ${error.message}`);
  }
};

export const getUserInterestsModel = async (userId) => {
  const [rows] = await db.execute(
    `SELECT interest_id, interest_type, interest_name,
            interest_name AS name, skill_level, created_at
     FROM user_interests
     WHERE user_id = ?
     ORDER BY created_at DESC, interest_name ASC`,
    [userId]
  );
  return rows;
};
export const updateInterestModel = async (userId, interestId, interestData) => {
  try {
    const { interest_type, interest_name, skill_level } = interestData;

    // Validate interest_type against allowed values
    const allowedInterestTypes = [
      "academic",
      "hobby",
      "career",
      "sports",
      "arts",
    ];
    if (interest_type && !allowedInterestTypes.includes(interest_type)) {
      throw new Error(
        `Invalid interest_type. Allowed values: ${allowedInterestTypes.join(
          ", "
        )}`
      );
    }

    // Validate skill_level against allowed values
    const allowedSkillLevels = [
      "beginner",
      "intermediate",
      "advanced",
      "expert",
    ];
    if (skill_level && !allowedSkillLevels.includes(skill_level)) {
      throw new Error(
        `Invalid skill_level. Allowed values: ${allowedSkillLevels.join(", ")}`
      );
    }

    // First, verify the interest belongs to the user
    const [existing] = await db.execute(
      "SELECT interest_id FROM user_interests WHERE interest_id = ? AND user_id = ?",
      [interestId, userId]
    );

    if (existing.length === 0) {
      throw new Error("Interest not found or access denied");
    }

    // Build dynamic update query
    const updateFields = [];
    const values = [];

    if (interest_type !== undefined) {
      updateFields.push("interest_type = ?");
      values.push(interest_type);
    }

    if (interest_name !== undefined) {
      updateFields.push("interest_name = ?");
      values.push(interest_name);
    }

    if (skill_level !== undefined) {
      updateFields.push("skill_level = ?");
      values.push(skill_level);
    }

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update");
    }

    values.push(interestId, userId);

    // Update the interest
    const [result] = await db.execute(
      `UPDATE user_interests SET ${updateFields.join(
        ", "
      )} WHERE interest_id = ? AND user_id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to update interest");
    }

    // Return the updated interest
    const [updatedInterest] = await db.execute(
      "SELECT * FROM user_interests WHERE interest_id = ? AND user_id = ?",
      [interestId, userId]
    );

    return updatedInterest[0];
  } catch (error) {
    throw new Error(`Database error in updateInterest: ${error.message}`);
  }
};
// Remove user interest
export const removeInterestModel = async (userId, interestId) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM user_interests WHERE interest_id = ? AND user_id = ?",
      [interestId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Interest not found or access denied");
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Database error in removeInterest: ${error.message}`);
  }
};

// Add user course
// export const addCourseModel = async (userId, courseData) => {
//   try {
//     const userCourseId = `uc_${uuidv4()}`;
//     const {
//       course_code,
//       course_name,
//       department_id,
//       semester,
//       academic_year,
//       is_current,
//     } = courseData;

//     const [result] = await db.execute(
//       `INSERT INTO user_courses (user_course_id, user_id, course_code, course_name, department_id, semester, academic_year, is_current)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [
//         userCourseId,
//         userId,
//         course_code,
//         course_name,
//         department_id,
//         semester,
//         academic_year,
//         is_current || 1,
//       ]
//     );

//     return { user_course_id: userCourseId, ...courseData };
//   } catch (error) {
//     throw new Error(`Database error in addCourse: ${error.message}`);
//   }
// };

// Remove user course
export const removeCourseModel = async (userId, userCourseId) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM user_courses WHERE user_course_id = ? AND user_id = ?",
      [userCourseId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Course not found or access denied");
    }

    return { success: true };
  } catch (error) {
    throw new Error(`Database error in removeCourse: ${error.message}`);
  }
};

// Update last login
export const updateLastLogin = async (userId) => {
  try {
    await db.execute(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?",
      [userId]
    );
  } catch (error) {
    throw new Error(`Database error in updateLastLogin: ${error.message}`);
  }
};

// Check if user exists and is active
export const userExists = async (userId) => {
  try {
    const [rows] = await db.execute(
      "SELECT 1 FROM users WHERE user_id = ? AND is_active = 1",
      [userId]
    );
    return rows.length > 0;
  } catch (error) {
    throw new Error(`Database error in userExists: ${error.message}`);
  }
};

// Get user stats
export const getUserStatsModel = async (userId) => {
  try {
    const [connectionRows] = await db.execute(
      `SELECT COUNT(*) as connection_count 
       FROM connections 
       WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'`,
      [userId, userId]
    );

    const [groupRows] = await db.execute(
      `SELECT COUNT(*) as group_count 
       FROM group_members 
       WHERE user_id = ?`,
      [userId]
    );

    const [eventRows] = await db.execute(
      `SELECT COUNT(*) as event_count 
       FROM event_attendees 
       WHERE user_id = ? AND rsvp_status = 'going'`,
      [userId]
    );

    return {
      connections: connectionRows[0]?.connection_count || 0,
      groups: groupRows[0]?.group_count || 0,
      events: eventRows[0]?.event_count || 0,
    };
  } catch (error) {
    throw new Error(`Database error in getUserStats: ${error.message}`);
  }
};

export const createConnectionRequest = async (
  connectionId,
  requesterId,
  receiverId,
  connectionNote = null,
  sharedCourses = null
) => {
  try {
    const query = `
      INSERT INTO connections (connection_id, requester_id, receiver_id, status, connection_note, shared_courses) 
           VALUES (?, ?, ?, 'pending', ?, ?)
    `;

    const [result] = await db.execute(query, [
      connectionId,
      requesterId,
      receiverId,
      connectionNote,
      sharedCourses,
    ]);

    return result;
  } catch (error) {
    console.error("Create connection model error:", error);
    throw error;
  }
};
export const updateConnectionStatus = async (connectionId, status, userId) => {
  const [result] = await db.execute(
    `UPDATE connections SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE connection_id = ? AND receiver_id = ? AND status = 'pending'`,
    [status, connectionId, userId]
  );
  return result.affectedRows > 0;
};
export const cancelConnectionRequestModel = async (connectionId, userId) => {
  try {
    const query = `
      UPDATE connections 
      SET status = 'declined', updated_at = CURRENT_TIMESTAMP 
      WHERE connection_id = ? 
        AND requester_id = ? 
        AND status = 'pending'
    `;

    const [result] = await db.execute(query, [connectionId, userId]);

    if (result.affectedRows === 0) {
      throw new Error(
        "Connection request not found, already processed, or you don't have permission to cancel it"
      );
    }

    return {
      success: true,
      connection_id: connectionId,
      status: "cancelled",
    };
  } catch (error) {
    console.error("Cancel connection model error:", error);
    throw error;
  }
};

export const getUserConnections = async (userId, status = "accepted") => {
  const [rows] = await db.execute(
    `SELECT 
      uc.*,
      u1.first_name as requester_first_name, 
      u1.last_name as requester_last_name, 
      u1.profile_picture_url as requester_profile_pic,
      u2.first_name as receiver_first_name, 
      u2.last_name as receiver_last_name, 
      u2.profile_picture_url as receiver_profile_pic
    FROM connections uc
    JOIN users u1 ON uc.requester_id = u1.user_id
    JOIN users u2 ON uc.receiver_id = u2.user_id
    WHERE (uc.requester_id = ? OR uc.receiver_id = ?) 
      AND uc.status = ?
    ORDER BY uc.updated_at DESC`,
    [userId, userId, status]
  );
  return rows;
};

// Lightweight companion to getUserConnections: just the other side's ids, for
// fan-out (e.g. notifying connections about a new post). No joined profile
// columns, since the caller only wants recipient ids.
export const getConnectionUserIds = async (userId) => {
  const [rows] = await db.execute(
    `SELECT
       CASE WHEN requester_id = ? THEN receiver_id ELSE requester_id END AS connection_user_id
     FROM connections
     WHERE (requester_id = ? OR receiver_id = ?)
       AND status = 'accepted'`,
    [userId, userId, userId]
  );
  return rows.map((row) => row.connection_user_id);
};

export const getAllUserConnectionsModel = async (
  userId,
  status,
  limit,
  offset
) => {
  try {
    let query = `
      SELECT 
        uc.*,
        u1.first_name as requester_first_name, 
        u1.last_name as requester_last_name, 
        u1.profile_picture_url as requester_profile_pic,
        u1.profile_headline as requester_headline,
        u1.program as requester_program,
        u2.first_name as receiver_first_name, 
        u2.last_name as receiver_last_name, 
        u2.profile_picture_url as receiver_profile_pic,
        u2.profile_headline as receiver_headline,
        u2.program as receiver_program
      FROM connections uc
      JOIN users u1 ON uc.requester_id = u1.user_id
      JOIN users u2 ON uc.receiver_id = u2.user_id
      WHERE (uc.requester_id = ? OR uc.receiver_id = ?)
    `;

    const params = [userId, userId];

    // Add status filter if provided
    if (status && status !== "all") {
      query += ` AND uc.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY 
      CASE uc.status
        WHEN 'pending' THEN 1
        WHEN 'accepted' THEN 2
        WHEN 'declined' THEN 3
        WHEN 'blocked' THEN 4
        ELSE 5
      END,
      uc.updated_at DESC`;

    // Add pagination if provided
    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit));

      if (offset) {
        query += ` OFFSET ?`;
        params.push(parseInt(offset));
      }
    }

    const [rows] = await db.execute(query, params);
    return rows;
  } catch (error) {
    console.error("Get all user connections model error:", error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  const [[rows], interests, courses] = await Promise.all([
    db.execute(
    `SELECT 
      user_id, university_id, email, first_name, last_name, 
      profile_picture_url, phone_number, program, bio, profile_headline,
      linkedin_url, website_url,
      date_of_birth, gender, year_of_study, graduation_year,
      social_links, privacy_settings, is_profile_complete,
      is_email_verified, created_at, updated_at,
      -- The notification and privacy screens read these off the session
      -- profile. They were writable (updateUserProfileModel allows them) but
      -- never selected, so every toggle saved correctly and then read back as
      -- its default: switch one off, reopen the screen, it is on again.
      notification_email, notification_push,
      privacy_profile, show_status_preference, show_location_preference,
      timezone
     FROM users WHERE user_id = ? AND is_active = TRUE`,
    [userId]
    ),
    getUserInterestsModel(userId),
    getUserCoursesModel(userId),
  ]);
  return rows[0] ? { ...rows[0], interests, courses } : null;
};
// In your user.model.js
export const addCourseModel = async (courseData) => {
  try {
    const [result] = await db.execute(
      `INSERT INTO user_courses 
       (user_id, course_code, course_name, department_id, semester, academic_year, is_current, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        courseData.user_id,
        courseData.course_code,
        courseData.course_name,
        courseData.department_id || null,
        courseData.semester || null,
        courseData.academic_year || null,
        courseData.is_current !== undefined ? courseData.is_current : true,
        new Date(),
      ]
    );

    return {
      user_course_id: result.insertId,
      ...courseData,
    };
  } catch (error) {
    throw new Error(`Database error in addCourseModel: ${error.message}`);
  }
};

export const getUserCoursesModel = async (userId) => {
  try {
    const [rows] = await db.execute(
      `SELECT user_course_id, course_code, course_name, department_id, 
              semester, academic_year, is_current, created_at
       FROM user_courses 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  } catch (error) {
    throw new Error(`Database error in getUserCoursesModel: ${error.message}`);
  }
};

export const checkCourseExistsModel = async (userId, courseCode) => {
  try {
    const [rows] = await db.execute(
      "SELECT user_course_id FROM user_courses WHERE user_id = ? AND course_code = ?",
      [userId, courseCode]
    );
    return rows.length > 0;
  } catch (error) {
    throw new Error(
      `Database error in checkCourseExistsModel: ${error.message}`
    );
  }
};

export const removeCourseByCodeModel = async (userId, courseCode) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM user_courses WHERE course_code = ? AND user_id = ?",
      [courseCode, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Course not found or access denied");
    }

    return { success: true };
  } catch (error) {
    throw new Error(
      `Database error in removeCourseByCodeModel: ${error.message}`
    );
  }
};
export const checkExistingConnectionModel = async (requesterId, receiverId) => {
  try {
    const query = `
    SELECT connection_id, requester_id, receiver_id, status
FROM connections 
WHERE (requester_id = ? AND receiver_id = ?) 
   OR (requester_id = ? AND receiver_id = ?)
ORDER BY updated_at DESC
  `;

    const [rows] = await db.execute(query, [
      requesterId,
      receiverId,
      receiverId, // Check reverse direction
      requesterId,
    ]);
    return rows[0] || null;
  } catch (error) {
    console.error("Check existing connection model error:", error);
    throw error;
  }
};

export const deleteProfileModel = async (
  userId,
  deletionReason = "User initiated"
) => {
  try {
    await db.beginTransaction();

    // 1. Archive the user data.
    //
    // The trailing values must line up with user_archive's own columns, which
    // are the 35 columns of `users` followed by archived_at (36) then
    // deletion_reason (37) -- in that order. This previously supplied three
    // values (reason, timestamp, and an expiry) in the wrong order, so every
    // delete died on "Column count doesn't match value count" and rolled the
    // whole transaction back. There is no expires_at column and no need for
    // one: recoverProfileModel derives the 30-day window from archived_at.
    //
    // SELECT * carries new columns across automatically, which is why it is
    // kept -- but it means a column added to `users` must also be added to
    // `user_archive` in the same position, ahead of these two.
    const [archiveResult] = await db.execute(
      `INSERT INTO user_archive
       SELECT *, CURRENT_TIMESTAMP, ?
       FROM users
       WHERE user_id = ?`,
      [deletionReason, userId]
    );

    // 2. Soft delete user
    const [updateResult] = await db.execute(
      `UPDATE users 
       SET is_active = 0, 
           email = CONCAT('deleted_', UNIX_TIMESTAMP(), '_', user_id, '@deleted.example'),
           password_hash = '',
           first_name = 'Deleted',
           last_name = 'User',
           profile_picture_url = NULL,
           phone_number = NULL,
           bio = NULL,
           profile_headline = NULL,
           linkedin_url = NULL,
           website_url = NULL,
           privacy_profile = 'private',
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [userId]
    );

    // 3. Update connections status
    await db.execute(
      `UPDATE connections 
       SET status = 'declined' 
       WHERE (requester_id = ? OR receiver_id = ?) 
       AND status = 'pending'`,
      [userId, userId]
    );

    // 4. Remove from active sessions
    await db.execute(`DELETE FROM user_sessions WHERE user_id = ?`, [userId]);

    await db.commit();

    return {
      archived: archiveResult.affectedRows > 0,
      deactivated: updateResult.affectedRows > 0,
    };
  } catch (error) {
    await db.rollback();
    throw new Error(`Database error in deleteProfile: ${error.message}`);
  }
};
export const recoverProfileModel = async (userId) => {
  try {
    await db.beginTransaction();

    // 1. Check if recovery is within 30 days
    const [archivedUser] = await db.execute(
      `SELECT * FROM user_archive 
       WHERE user_id = ? 
       AND archived_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)`,
      [userId]
    );

    if (archivedUser.length === 0) {
      throw new Error(
        "Recovery period has expired or user not found in archive"
      );
    }

    const userData = archivedUser[0];

    // 2. Restore user data
    const [restoreResult] = await db.execute(
      `UPDATE users 
       SET is_active = 1,
           email = ?,
           password_hash = ?,
           first_name = ?,
           last_name = ?,
           profile_picture_url = ?,
           phone_number = ?,
           bio = ?,
           profile_headline = ?,
           linkedin_url = ?,
           website_url = ?,
           privacy_profile = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        userData.email,
        userData.password_hash,
        userData.first_name,
        userData.last_name,
        userData.profile_picture_url,
        userData.phone_number,
        userData.bio,
        userData.profile_headline,
        userData.linkedin_url,
        userData.website_url,
        userData.privacy_profile,
        userId,
      ]
    );

    // 3. Remove from archive
    await db.execute(`DELETE FROM user_archive WHERE user_id = ?`, [userId]);

    await db.commit();

    return { restored: restoreResult.affectedRows > 0 };
  } catch (error) {
    await db.rollback();
    throw new Error(`Database error in recoverProfile: ${error.message}`);
  }
};

export const getPrivacySettingsModel = async (userId) => {
  try {
    const query = `
      SELECT
        profile_visibility,
        custom_radius,
        show_exact_location,
        visible_fields
      FROM user_privacy_settings
      WHERE user_id = ?
    `;

    const [rows] = await db.execute(query, [userId]);
    return rows[0] || null;
  } catch (error) {
    console.error("Get privacy settings model error:", error);
    throw error;
  }
};

// Batched variant of getPrivacySettingsModel for the nearby-profiles pipeline,
// which otherwise fires one query per uncached user on every request.
export const getPrivacySettingsModelBatch = async (userIds) => {
  if (!userIds.length) return {};

  try {
    const placeholders = userIds.map(() => "?").join(",");
    const query = `
      SELECT
        user_id,
        profile_visibility,
        custom_radius,
        show_exact_location,
        visible_fields
      FROM user_privacy_settings
      WHERE user_id IN (${placeholders})
    `;

    const [rows] = await db.execute(query, userIds);
    const map = {};
    rows.forEach((row) => {
      map[row.user_id] = row;
    });
    return map;
  } catch (error) {
    console.error("Get privacy settings model batch error:", error);
    throw error;
  }
};

export const updatePrivacySettingsModel = async (userId, settings) => {
  try {
    const query = `
      INSERT INTO user_privacy_settings 
        (user_id, profile_visibility, custom_radius, show_exact_location, visible_fields)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        profile_visibility = VALUES(profile_visibility),
        custom_radius = VALUES(custom_radius),
        show_exact_location = VALUES(show_exact_location),
        visible_fields = VALUES(visible_fields),
        updated_at = CURRENT_TIMESTAMP
    `;

    const [result] = await db.execute(query, [
      userId,
      settings.profile_visibility,
      settings.custom_radius,
      settings.show_exact_location,
      typeof settings.visible_fields === "string"
        ? settings.visible_fields
        : JSON.stringify(settings.visible_fields),
    ]);

    return await getPrivacySettingsModel(userId);
  } catch (error) {
    console.error("Update privacy settings model error:", error);
    throw error;
  }
};

/**
 * Whether two users have an accepted connection.
 *
 * `connections` stores ONE directed row per pair, so the test has to look at
 * both orientations. Checking only (requester = viewer) would report a
 * connection as absent for whichever side did not send the request.
 */
export const areUsersConnected = async (userIdA, userIdB) => {
  if (!userIdA || !userIdB || userIdA === userIdB) return false;

  const [rows] = await db.execute(
    `SELECT 1 FROM connections
      WHERE status = 'accepted'
        AND ((requester_id = ? AND receiver_id = ?)
          OR (requester_id = ? AND receiver_id = ?))
      LIMIT 1`,
    [userIdA, userIdB, userIdB, userIdA]
  );
  return rows.length > 0;
};

/**
 * Every user with an accepted connection to this one, with the fields the map
 * needs. Returns the OTHER side of each row, whichever orientation it is in.
 */
export const getAcceptedConnectionProfiles = async (userId) => {
  const [rows] = await db.execute(
    `SELECT
       u.user_id,
       u.first_name,
       u.last_name,
       u.profile_picture_url,
       u.university_id,
       u.privacy_profile,
       EXISTS(
         SELECT 1 FROM stories s
          WHERE s.user_id = u.user_id
            AND s.is_active = 1
            AND s.expires_at > NOW()
       ) AS has_story
     FROM connections c
     JOIN users u
       ON u.user_id = CASE WHEN c.requester_id = ? THEN c.receiver_id ELSE c.requester_id END
     WHERE c.status = 'accepted'
       AND (c.requester_id = ? OR c.receiver_id = ?)
       AND u.is_active = 1`,
    [userId, userId, userId]
  );
  return rows;
};
