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
export const getConnectionRecommendationsModel = async (userId, limit = 10) => {
  try {
    // sanitize limit safely
    const safeLimit = Math.min(parseInt(limit, 10) || 10, 50);

    const query = `
      SELECT 
        u.user_id, 
        u.first_name, 
        u.last_name, 
        u.profile_picture_url,
        u.profile_headline, 
        u.program, 
        u.graduation_year,
        (
          COALESCE(common_courses_score, 0) +
          COALESCE(common_groups_score, 0) +
          COALESCE(mutual_connections_score, 0) +
          COALESCE(same_program_score, 0) +
          COALESCE(same_graduation_score, 0)
        ) AS match_score
      FROM connection_recommendations cr
      JOIN users u 
        ON cr.recommended_user_id = u.user_id
      WHERE cr.source_user_id = ?
        -- AND u.is_active = 1
        -- chnage to active when all members are active


        AND u.privacy_profile IN ('public', 'university')
      ORDER BY match_score DESC
      LIMIT ${safeLimit};
    `;

    // console.log("Recommendation Query:", query);
    // console.log("Params:", [userId]);

    const [rows] = await db.execute(query, [userId]);
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

export const createConnectionRequest = async (requesterId, receiverId) => {
  const connectionId = uuidv4();
  const [result] = await db.execute(
    `INSERT INTO user_connections ( user_id_1, user_id_2, status) 
     VALUES ( ?, ?, 'pending')`,
    [requesterId, receiverId]
  );
  return connectionId;
};

export const updateConnectionStatus = async (connectionId, status, userId) => {
  const [result] = await db.execute(
    `UPDATE user_connections SET status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE connection_id = ? AND (user_id_1 = ? OR user_id_2 = ?)`,
    [status, connectionId, userId, userId]
  );
  return result.affectedRows > 0;
};

export const getUserConnections = async (userId, status = "accepted") => {
  const [rows] = await db.execute(
    `SELECT uc.*, 
       u1.first_name as user1_first_name, u1.last_name as user1_last_name, u1.profile_picture_url as user1_profile_pic,
       u2.first_name as user2_first_name, u2.last_name as user2_last_name, u2.profile_picture_url as user2_profile_pic
FROM connections uc
JOIN users u1 ON uc.requester_id = u1.user_id
JOIN users u2 ON uc.receiver_id = u2.user_id
WHERE (uc.requester_id = ? OR uc.receiver_id = ?) AND uc.status = ?`,
    [userId, userId, status]
  );
  return rows;
};

export const getUserProfile = async (userId) => {
  const [rows] = await db.execute(
    `SELECT 
      user_id, university_id, email, first_name, last_name, 
      profile_picture_url, phone_number, program, bio, 
      date_of_birth, gender, year_of_study, graduation_year,
      interests, social_links, privacy_settings, is_profile_complete,
      is_email_verified, created_at, updated_at
     FROM users WHERE user_id = ? AND is_active = TRUE`,
    [userId]
  );
  return rows[0];
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
export const checkExistingConnectionModel = async (user1, user2) => {
  const query = `
    SELECT connection_id, status 
    FROM user_connections 
    WHERE (user_id_1 = ? AND user_id_2 = ?) 
       OR (user_id_1 = ? AND user_id_2 = ?)
  `;

  const [rows] = await db.execute(query, [user1, user2, user2, user1]);
  return rows[0] || null;
};
