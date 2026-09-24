import { db } from "../config/db.js";
export const findByIds = async (userIds) => {
  const placeholders = userIds.map(() => "?").join(",");
  // Only the columns buildFilteredProfile actually reads -- this used to be
  // `SELECT *`, which pulled every column (including password_hash) for
  // every nearby user on every request.
  const query = `
    SELECT user_id, university_id, first_name, last_name,
           profile_picture_url, bio, program
    FROM users
    WHERE user_id IN (${placeholders})
  `;

  const [rows] = await db.execute(query, userIds);
  return rows;
};
